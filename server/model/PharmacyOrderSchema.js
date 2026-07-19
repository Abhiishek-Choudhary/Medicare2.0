import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  name:       { type: String, required: true },
  sku:        { type: String },
  quantity:   { type: Number, required: true, min: 1 },
  price:      { type: Number, required: true, min: 0 },
  subtotal:   { type: Number, required: true, min: 0 },
  prescriptionRequired: { type: Boolean, default: false },
}, { _id: false });

const addressEmbedSchema = new mongoose.Schema({
  fullName: String,
  phone:    String,
  line1:    String,
  line2:    String,
  city:     String,
  state:    String,
  pincode:  String,
  landmark: String,
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  at:     { type: Date, default: Date.now },
  note:   { type: String },
  by:     { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
  orderNumber:  { type: String, required: true, unique: true },

  items:        [orderItemSchema],
  shippingAddress: { type: addressEmbedSchema, required: true },
  billingAddress:  { type: addressEmbedSchema },

  subtotal:     { type: Number, required: true, min: 0 },
  discount:     { type: Number, default: 0, min: 0 },
  deliveryFee:  { type: Number, default: 0, min: 0 },
  tax:          { type: Number, default: 0, min: 0 },
  totalAmount:  { type: Number, required: true, min: 0 },

  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  requiresPrescription: { type: Boolean, default: false },
  prescriptionStatus:   { type: String, enum: ['not_required', 'pending', 'verified', 'rejected'], default: 'not_required' },

  paymentStatus:   { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentMethod:   { type: String, enum: ['Razorpay', 'COD'], default: 'Razorpay' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },

  orderStatus:  {
    type: String,
    enum: ['awaiting_payment', 'awaiting_verification', 'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'awaiting_payment',
  },
  statusHistory: [statusHistorySchema],

  deliveryPartner:  { type: String },
  trackingId:       { type: String },
  expectedDelivery: { type: Date },

  cancelledReason:  { type: String },
}, { timestamps: true });

const PharmacyOrder = mongoose.model('PharmacyOrder', orderSchema);
export default PharmacyOrder;
