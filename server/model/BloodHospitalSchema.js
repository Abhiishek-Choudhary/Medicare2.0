import mongoose from 'mongoose';

const bloodHospitalSchema = new mongoose.Schema({
    name:      { type: String, required: true },
    type:      { type: String, enum: ['hospital', 'blood_bank'], default: 'hospital' },
    address:   { type: String, required: true },
    city:      { type: String, required: true, index: true },
    state:     { type: String, required: true },
    pincode:   { type: String, match: /^\d{6}$/ },

    phone:     { type: String, required: true },
    emergencyPhone: { type: String },
    email:     { type: String },
    website:   { type: String },

    bloodGroupsAvailable: [{ type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] }],
    is24x7:    { type: Boolean, default: false },
    notes:     { type: String },
    isActive:  { type: Boolean, default: true },
}, { timestamps: true });

const BloodHospital = mongoose.model('BloodHospital', bloodHospitalSchema);
export default BloodHospital;
