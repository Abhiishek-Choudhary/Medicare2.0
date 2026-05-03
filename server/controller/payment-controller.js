import Razorpay from "razorpay";
import crypto from "crypto";
import Appointment from "../model/AppointmentSchema.js";
import Payment from "../model/PaymentSchema.js";

// Create order endpoint
export const createOrder = async (req, res) => {
  const { amount, currency = "INR" } = req.body;

  if (!amount) {
    return res.status(400).json({ message: "Amount is required" });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ message: "Razorpay credentials not configured." });
  }

  console.log("Razorpay key_id:", keyId);

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const options = {
      amount: Math.round(amount) * 100, // paise
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.status(201).json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      key_id: keyId,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error?.error || error);
    res.status(500).json({ message: "Unable to create order", detail: error?.error?.description || error.message });
  }
};

// Verify payment signature endpoint
export const verifyPayment = (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(500).json({ status: "failure", message: "Razorpay secret not configured." });
  }

  const hmac = crypto.createHmac("sha256", keySecret);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generated_signature = hmac.digest("hex");

  if (generated_signature === razorpay_signature) {
    res.json({ status: "success" });
  } else {
    res.status(400).json({ status: "failure", message: "Invalid signature." });
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
