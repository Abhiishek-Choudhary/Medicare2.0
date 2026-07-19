import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name:            { type: String, required: true, index: true },
  slug:            { type: String, required: true, unique: true, lowercase: true },
  sku:             { type: String, required: true, unique: true },
  brand:           { type: String },
  manufacturer:    { type: String },
  description:     { type: String },
  composition:     { type: String },
  dosageForm:      { type: String, enum: ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'other'], default: 'tablet' },
  strength:        { type: String },
  packSize:        { type: String },

  price:           { type: Number, required: true, min: 0 },
  mrp:             { type: Number, required: true, min: 0 },

  stock:           { type: Number, required: true, min: 0, default: 0 },
  category:        { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tags:            [{ type: String }],
  images:          [{ type: String }],

  prescriptionRequired: { type: Boolean, default: false },

  expiryDate:      { type: Date },
  batchNumber:     { type: String },

  isActive:        { type: Boolean, default: true },
}, { timestamps: true });

medicineSchema.virtual('discountPercent').get(function () {
  if (!this.mrp || this.mrp <= 0) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

medicineSchema.set('toJSON', { virtuals: true });
medicineSchema.index({ name: 'text', composition: 'text', brand: 'text', tags: 'text' });

const Medicine = mongoose.model('Medicine', medicineSchema);
export default Medicine;
