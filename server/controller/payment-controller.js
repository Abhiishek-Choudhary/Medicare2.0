import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import Appointment from "../model/AppointmentSchema.js";
import Payment from "../model/PaymentSchema.js";

dotenv.config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Your Razorpay key id
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Your Razorpay secret
});

// Create order endpoint
export const createOrder = async (req, res) => {
  const { amount, currency = "INR" } = req.body;

  if (!amount) {
    return res.status(400).json({ message: "Amount is required" });
  }

  try {
    const options = {
      amount: amount * 100, // amount in paise (e.g., Rs 500 = 50000 paise)
      currency,
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1, // auto capture payment
    };

    const order = await razorpay.orders.create(options);

    res.status(201).json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    res.status(500).json({ message: "Unable to create order" });
  }
};

// Verify payment signature endpoint
export const verifyPayment = (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  // Create the expected signature
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generated_signature = hmac.digest("hex");

  if (generated_signature === razorpay_signature) {
    // Payment is legit
    res.json({ status: "success" });
  } else {
    // Payment verification failed
    res
      .status(400)
      .json({ status: "failure", message: "Invalid signature sent!" });
  }
};

// payment-controller.js
export const savePayment = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      doctorId,
      amount,
      paymentMethod,
      transactionId,
    } = req.body;
    if (
      !patientId ||
      !appointmentId ||
      !doctorId ||
      !amount ||
      !paymentMethod ||
      !transactionId
    ) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const payment = new Payment({
      patientId,
      doctorId,
      appointmentId,
      amount,
      paymentMethod,
      transactionId, // optional but passed
      paymentStatus: "completed", // you can set status here on successful payment
    });

    await payment.save();

    return res
      .status(201)
      .json({ message: "Payment saved successfully", payment });
  } catch (error) {
    console.error("Error saving payment:", error);
    return res.status(500).json({ message: "Failed to save payment" });
  }
};

// Get all appointments for a specific user (i.e., payment history)
export const getPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await Payment.find({ userId }).populate("doctorId");

    // Map to include doctorName
    const result = payments.map((p) => ({
      _id: p._id,
      doctorName: p.doctorId?.name || "Unknown",
      amount: p.amount,
      razorpayPaymentId: p.razorpayPaymentId,
      createdAt: p.createdAt,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
};
