// const Razorpay = require("razorpay");

// exports.instance = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY,
//     key_secret: process.env.RAZORPAY_SECRET,
// });


const Razorpay = require("razorpay");

let instance = null;

if (process.env.RAZORPAY_KEY && process.env.RAZORPAY_SECRET) {
  instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET,
  });
  console.log("✅ Razorpay initialized");
} else {
  console.log("⚠️ Razorpay skipped: Missing key_id or key_secret in .env");
}

exports.instance = instance;


