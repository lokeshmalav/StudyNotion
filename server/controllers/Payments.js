// const { instance } = require("../config/razorpay") // Commented Razorpay import

const Course = require("../models/Course")
const crypto = require("crypto")
const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const mongoose = require("mongoose")
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail")
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail")
const CourseProgress = require("../models/CourseProgress")

// Dummy Razorpay fallback
const instance = process.env.RAZORPAY_KEY && process.env.RAZORPAY_SECRET
  ? require("../config/razorpay").instance
  : null;

// Capture the payment and initiate the Razorpay order (or dummy order)
exports.capturePayment = async (req, res) => {
  const { courses } = req.body
  const userId = req.user.id
  if (!courses || courses.length === 0) {
    return res.json({ success: false, message: "Please Provide Course ID" })
  }

  let total_amount = 0

  for (const course_id of courses) {
    try {
      const course = await Course.findById(course_id)
      if (!course) {
        return res.status(200).json({ success: false, message: "Course not found" })
      }

      const uid = new mongoose.Types.ObjectId(userId)
      if (course.studentsEnrolled?.includes(uid)) {
        return res.status(200).json({ success: false, message: "Already Enrolled" })
      }

      total_amount += course.price
    } catch (error) {
      console.log(error)
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  const fakeOrder = {
    id: "dummy_order_" + Date.now(),
    currency: "INR",
    amount: total_amount * 100,
  }

  if (!instance) {
    return res.json({
      success: true,
      data: fakeOrder,
      message: "Dummy order generated (Razorpay skipped)",
    })
  }

  try {
    const options = {
      amount: total_amount * 100,
      currency: "INR",
      receipt: Math.random(Date.now()).toString(),
    }

    const paymentResponse = await instance.orders.create(options)
    res.json({ success: true, data: paymentResponse })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Could not initiate order" })
  }
}

// verify the payment
exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    courses,
  } = req.body
  const userId = req.user.id

  if (!courses || !userId) {
    return res.status(200).json({ success: false, message: "Payment Failed" })
  }

  // Skip verification in dummy mode
  if (!instance) {
    await enrollStudents(courses, userId, res)
    return res.status(200).json({
      success: true,
      message: "Dummy payment verified (Razorpay skipped)",
    })
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(200).json({ success: false, message: "Payment Failed" })
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex")

  if (expectedSignature === razorpay_signature) {
    await enrollStudents(courses, userId, res)
    return res.status(200).json({ success: true, message: "Payment Verified" })
  }

  return res.status(200).json({ success: false, message: "Payment Failed" })
}

// send payment success email
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body
  const userId = req.user.id

  if (!orderId || !paymentId || !amount || !userId) {
    return res.status(400).json({ success: false, message: "Missing fields" })
  }

  try {
    const enrolledStudent = await User.findById(userId)

    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    )
  } catch (error) {
    console.log("error in sending mail", error)
    return res.status(400).json({ success: false, message: "Email failed" })
  }
}

// enroll student in courses
const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide Course ID and User ID" })
  }

  for (const courseId of courses) {
    try {
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnrolled: userId } },
        { new: true }
      )

      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, error: "Course not found" })
      }

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId,
        completedVideos: [],
      })

      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      )

      await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      )
    } catch (error) {
      console.log(error)
      return res.status(400).json({ success: false, error: error.message })
    }
  }
}
