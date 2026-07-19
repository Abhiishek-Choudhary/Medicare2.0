import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    name:            { type: String, required: true },
    description:     { type: String },
    category:        { type: String },
    price:           { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 15, default: 30 },
    isActive:        { type: Boolean, default: true },
});

const hospitalSchema = new mongoose.Schema({
    // Owner user account — optional so hospitals can be auto-created (e.g. by doctors during signup)
    // and claimed by their real operator later. sparse index prevents duplicate-key collisions on null.
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', unique: true, sparse: true },
    autoCreated: { type: Boolean, default: false },

    name:        { type: String, required: true, index: true },
    slug:        { type: String, unique: true },
    description: { type: String },
    logoUrl:     { type: String },
    images:      [{ type: String }],

    address:     { type: String, required: true },
    city:        { type: String, required: true, index: true },
    state:       { type: String, required: true },
    pincode:     { type: String, match: /^\d{6}$/ },

    phone:       { type: String, required: true },
    emergencyPhone: { type: String },
    email:       { type: String },
    website:     { type: String },

    // Working hours (single window). For 24x7, set is24x7 true.
    openingTime: { type: String, default: '09:00' }, // HH:MM
    closingTime: { type: String, default: '18:00' },
    is24x7:      { type: Boolean, default: false },

    specialties: [{ type: String }],   // e.g. Cardiology, Neurology
    facilities:  [{ type: String }],   // e.g. ICU, Ambulance, MRI

    services:    [serviceSchema],

    affiliatedDoctorIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    inHouseMedicineIds:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' }],

    isActive:    { type: Boolean, default: true },
    isVerified:  { type: Boolean, default: false },
}, { timestamps: true });

hospitalSchema.pre('validate', function (next) {
    if (!this.slug && this.name) {
        this.slug = this.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            + '-' + Date.now().toString(36);
    }
    next();
});

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
