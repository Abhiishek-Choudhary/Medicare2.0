import mongoose from 'mongoose';

const hospitalBookingSchema = new mongoose.Schema({
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    hospitalId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },

    serviceId:   { type: mongoose.Schema.Types.ObjectId, required: true }, // sub-doc _id
    serviceName: { type: String, required: true },

    date:        { type: Date, required: true },     // date component (YYYY-MM-DD 00:00 local)
    timeSlot:    { type: String, required: true },   // 'HH:MM' start
    durationMinutes: { type: Number, required: true },

    amount:      { type: Number, required: true, min: 0 },

    customerName:  { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String },
    notes:       { type: String },

    status:      { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'], default: 'pending' },
    cancellationReason: { type: String },
}, { timestamps: true });

// Prevent double-booking the same time slot at the same service at the same hospital
hospitalBookingSchema.index(
    { hospitalId: 1, serviceId: 1, date: 1, timeSlot: 1, status: 1 }
);

const HospitalBooking = mongoose.model('HospitalBooking', hospitalBookingSchema);
export default HospitalBooking;
