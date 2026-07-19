import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import PharmacyOrder from '../model/PharmacyOrderSchema.js';
import Cart from '../model/CartSchema.js';
import Medicine from '../model/MedicineSchema.js';
import Prescription from '../model/PrescriptionSchema.js';
import User from '../model/UserSchema.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import {
  sendOrderConfirmation,
  sendOrderCancellation,
  sendOrderStatusUpdate,
} from '../utils/mailer.js';

// Fire-and-forget email helper — never blocks the response
const fireEmail = (fn, args) => {
  Promise.resolve().then(() => fn(args)).catch((e) =>
    console.error('Order email failed:', e?.message || e)
  );
};

const DELIVERY_FEE_FLAT = 40;
const FREE_DELIVERY_THRESHOLD = 499;
const GST_RATE = 0.05; // 5% GST on medicines

const razorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay credentials not configured');
  return { client: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId };
};

const computeTotals = (items) => {
  const subtotal = items.reduce((n, it) => n + it.price * it.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE_FLAT;
  const tax = Math.round(subtotal * GST_RATE);
  const totalAmount = subtotal + deliveryFee + tax;
  return { subtotal, deliveryFee, tax, totalAmount };
};

// POST /pharmacy/orders — place order, create Razorpay order, reserve stock
export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user._id;
    const { shippingAddress, billingAddress, prescriptionId, paymentMethod = 'Razorpay' } = req.body;

    if (!shippingAddress || !shippingAddress.line1 || !shippingAddress.pincode) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'shippingAddress required' });
    }

    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Load medicines, validate stock, build snapshot, decrement stock
    const items = [];
    let requiresPrescription = false;
    for (const cartItem of cart.items) {
      const med = await Medicine.findById(cartItem.medicineId).session(session);
      if (!med || !med.isActive) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Medicine unavailable` });
      }
      if (med.stock < cartItem.quantity) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Only ${med.stock} of ${med.name} in stock` });
      }
      med.stock -= cartItem.quantity;
      await med.save({ session });

      if (med.prescriptionRequired) requiresPrescription = true;

      items.push({
        medicineId: med._id,
        name: med.name,
        sku: med.sku,
        quantity: cartItem.quantity,
        price: med.price,
        subtotal: med.price * cartItem.quantity,
        prescriptionRequired: med.prescriptionRequired,
      });
    }

    // If prescription required, must be attached
    let prescriptionStatus = 'not_required';
    if (requiresPrescription) {
      if (!prescriptionId) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'prescriptionId required for prescription-only items' });
      }
      const rx = await Prescription.findById(prescriptionId).session(session);
      if (!rx || rx.userId.toString() !== userId.toString()) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Invalid prescription' });
      }
      prescriptionStatus = rx.status === 'verified' ? 'verified' : 'pending';
    }

    const totals = computeTotals(items);

    // Create Razorpay order (unless COD)
    let razorpayOrderId;
    let razorpayKeyId;
    if (paymentMethod === 'Razorpay') {
      const { client, keyId } = razorpayClient();
      const rzp = await client.orders.create({
        amount: Math.round(totals.totalAmount * 100),
        currency: 'INR',
        receipt: `pmcy_${Date.now()}`,
        payment_capture: 1,
      });
      razorpayOrderId = rzp.id;
      razorpayKeyId = keyId;
    }

    const orderNumber = generateOrderNumber();
    const [order] = await PharmacyOrder.create([{
      userId,
      orderNumber,
      items,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      ...totals,
      prescriptionId: prescriptionId || undefined,
      requiresPrescription,
      prescriptionStatus,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'pending' : 'pending',
      razorpayOrderId,
      orderStatus: paymentMethod === 'COD'
        ? (requiresPrescription && prescriptionStatus !== 'verified' ? 'awaiting_verification' : 'placed')
        : 'awaiting_payment',
      statusHistory: [{ status: 'awaiting_payment', note: 'Order created', by: userId }],
    }], { session });

    // Link prescription to order
    if (prescriptionId) {
      await Prescription.findByIdAndUpdate(
        prescriptionId,
        { $addToSet: { linkedOrderIds: order._id } },
        { session }
      );
    }

    // Clear cart
    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();

    // For COD, the order is placed right away — send confirmation.
    // For Razorpay, wait for payment verification (handled in verifyOrderPayment).
    if (paymentMethod === 'COD') {
      fireEmail(sendOrderConfirmation, {
        to: req.user.email,
        customerName: req.user.username,
        order: order.toObject(),
      });
    }

    res.status(201).json({
      order,
      razorpay: paymentMethod === 'Razorpay' ? {
        orderId: razorpayOrderId,
        amount: Math.round(totals.totalAmount * 100),
        currency: 'INR',
        keyId: razorpayKeyId,
      } : null,
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// POST /pharmacy/orders/verify — verify Razorpay signature + mark paid
export const verifyOrderPayment = async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return res.status(500).json({ message: 'Razorpay not configured' });

    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const expected = hmac.digest('hex');
    if (expected !== razorpay_signature) {
      const order = await PharmacyOrder.findById(orderId);
      if (order) {
        order.paymentStatus = 'failed';
        order.statusHistory.push({ status: 'payment_failed', note: 'Signature mismatch' });
        await order.save();
        // restore stock
        for (const it of order.items) {
          await Medicine.findByIdAndUpdate(it.medicineId, { $inc: { stock: it.quantity } });
        }
      }
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const order = await PharmacyOrder.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.orderStatus = order.requiresPrescription && order.prescriptionStatus !== 'verified'
      ? 'awaiting_verification'
      : 'placed';
    order.statusHistory.push({ status: order.orderStatus, note: 'Payment verified' });
    await order.save();

    // Send confirmation email now that payment is verified
    const user = await User.findById(order.userId).select('email username');
    if (user) {
      fireEmail(sendOrderConfirmation, {
        to: user.email,
        customerName: user.username,
        order: order.toObject(),
      });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /pharmacy/orders/user
export const getMyOrders = async (req, res) => {
  try {
    const orders = await PharmacyOrder.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /pharmacy/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const order = await PharmacyOrder.findById(req.params.id).populate('items.medicineId', 'name images');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'customer' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /pharmacy/orders/:id/cancel — customer cancels
export const cancelMyOrder = async (req, res) => {
  try {
    const order = await PharmacyOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!['awaiting_payment', 'awaiting_verification', 'placed', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({ message: `Cannot cancel order in ${order.orderStatus} state` });
    }

    order.orderStatus = 'cancelled';
    order.cancelledReason = req.body.reason || 'Cancelled by customer';
    order.statusHistory.push({ status: 'cancelled', note: order.cancelledReason, by: req.user._id });
    await order.save();

    // restore stock
    for (const it of order.items) {
      await Medicine.findByIdAndUpdate(it.medicineId, { $inc: { stock: it.quantity } });
    }

    fireEmail(sendOrderCancellation, {
      to: req.user.email,
      customerName: req.user.username,
      order: order.toObject(),
      reason: order.cancelledReason,
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /pharmacy/orders (admin)
export const listAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.orderStatus = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      PharmacyOrder.find(filter).populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      PharmacyOrder.countDocuments(filter),
    ]);
    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const VALID_ADMIN_STATUSES = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

// PUT /pharmacy/orders/:id/status (admin/pharmacist)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note, deliveryPartner, trackingId, expectedDelivery } = req.body;
    if (!VALID_ADMIN_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await PharmacyOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // stock restore on cancel/return
    if (['cancelled', 'returned'].includes(status)) {
      for (const it of order.items) {
        await Medicine.findByIdAndUpdate(it.medicineId, { $inc: { stock: it.quantity } });
      }
    }

    order.orderStatus = status;
    if (deliveryPartner) order.deliveryPartner = deliveryPartner;
    if (trackingId) order.trackingId = trackingId;
    if (expectedDelivery) order.expectedDelivery = expectedDelivery;
    order.statusHistory.push({ status, note, by: req.user._id });
    await order.save();

    // Notify the customer whenever admin/pharmacist updates status
    const user = await User.findById(order.userId).select('email username');
    if (user) {
      if (status === 'cancelled') {
        fireEmail(sendOrderCancellation, {
          to: user.email,
          customerName: user.username,
          order: order.toObject(),
          reason: note || 'Cancelled by pharmacy',
        });
      } else {
        fireEmail(sendOrderStatusUpdate, {
          to: user.email,
          customerName: user.username,
          order: order.toObject(),
          newStatus: status,
          note,
        });
      }
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
