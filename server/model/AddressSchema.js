import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
  fullName: { type: String, required: true },
  phone:    { type: String, required: true },
  line1:    { type: String, required: true },
  line2:    { type: String },
  city:     { type: String, required: true },
  state:    { type: String, required: true },
  pincode:  { type: String, required: true, match: /^\d{6}$/ },
  landmark: { type: String },
  isDefault:{ type: Boolean, default: false },
}, { timestamps: true });

const Address = mongoose.model('Address', addressSchema);
export default Address;
