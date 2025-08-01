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
  let freeCourses = []

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

      if (course.price === 0) {
        freeCourses.push(course_id)
      } else {
        total_amount += course.price
      }
    } catch (error) {
      console.log(error)
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  // If all courses are free, directly enroll the student without Razorpay
  if (total_amount === 0 && freeCourses.length > 0) {
    await enrollStudents(freeCourses, userId, res)
    return res.status(200).json({
      success: true,
      message: "Enrolled in free course(s) without payment",
    })
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
