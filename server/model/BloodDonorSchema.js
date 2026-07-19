import mongoose from 'mongoose';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const bloodDonorSchema = new mongoose.Schema({
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, unique: true },

    fullName:   { type: String, required: true },
    phone:      { type: String, required: true },
    email:      { type: String, required: true },

    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true, index: true },
    age:        { type: Number, min: 18, max: 70, required: true },
    weight:     { type: Number, min: 45 },
    gender:     { type: String, enum: ['male', 'female', 'other'] },

    city:       { type: String, required: true, index: true },
    state:      { type: String, required: true },
    pincode:    { type: String, match: /^\d{6}$/ },
    address:    { type: String },

    availableMonths: [{ type: String, enum: MONTHS }],
    lastDonationDate: { type: Date },
    medicalConditions: { type: String },

    isActive:   { type: Boolean, default: true },
    showContactInfo: { type: Boolean, default: true },

    verified:   { type: Boolean, default: false },
}, { timestamps: true });

bloodDonorSchema.index({ bloodGroup: 1, city: 1, isActive: 1 });

const BloodDonor = mongoose.model('BloodDonor', bloodDonorSchema);
export default BloodDonor;
export { BLOOD_GROUPS, MONTHS };
