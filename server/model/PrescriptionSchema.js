import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
  fileUrl:     { type: String, required: true },
  originalName:{ type: String },
  status:      { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verifiedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  verifiedAt:  { type: Date },
  rejectionReason: { type: String },
  linkedOrderIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyOrder' }],
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
