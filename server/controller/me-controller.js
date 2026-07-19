import Appointment from '../model/AppointmentSchema.js';
import PharmacyOrder from '../model/PharmacyOrderSchema.js';
import HospitalBooking from '../model/HospitalBookingSchema.js';
import BloodDonor from '../model/BloodDonorSchema.js';
import Prescription from '../model/PrescriptionSchema.js';
import User from '../model/UserSchema.js';

// GET /me — enriched user info
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /me — update own basic info
export const updateMe = async (req, res) => {
    try {
        const allowed = ['username', 'phone'];
        const updates = {};
        for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /me/activity — unified view for profile page
export const getMyActivity = async (req, res) => {
    try {
        const uid = req.user._id;
        const [user, appointments, orders, hospitalBookings, prescriptions, donor] = await Promise.all([
            User.findById(uid).select('-password'),
            Appointment.find({ userId: uid }).sort({ date: -1 }),
            PharmacyOrder.find({ userId: uid }).sort({ createdAt: -1 }),
            HospitalBooking.find({ userId: uid }).populate('hospitalId', 'name city phone address').sort({ date: -1 }),
            Prescription.find({ userId: uid }).sort({ createdAt: -1 }),
            BloodDonor.findOne({ userId: uid }),
        ]);

        const totalSpent = orders.reduce((n, o) => n + (o.paymentStatus === 'paid' ? o.totalAmount : 0), 0);

        res.json({
            user,
            summary: {
                totalAppointments: appointments.length,
                totalOrders: orders.length,
                totalHospitalBookings: hospitalBookings.length,
                totalPrescriptions: prescriptions.length,
                isDonor: !!donor,
                totalSpent,
            },
            appointments,
            orders,
            hospitalBookings,
            prescriptions,
            donor,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
