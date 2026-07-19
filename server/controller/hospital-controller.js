import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../model/UserSchema.js';
import Hospital from '../model/HospitalSchema.js';
import HospitalBooking from '../model/HospitalBookingSchema.js';
import Doctor from '../model/DoctorSchema.js';
import Medicine from '../model/MedicineSchema.js';
import { signToken } from '../middleware/auth.js';

// ── Hospital auth ────────────────────────────────────────────────

// POST /hospital/signup
export const hospitalSignup = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { username, email, password, phone, hospitalName, address, city, state, phone: hospitalPhone } = req.body;
        if (!username || !email || !password || !hospitalName || !address || !city || !state) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'username, email, password, hospitalName, address, city, state are required' });
        }

        const exists = await User.findOne({ $or: [{ username }, { email }] }).session(session);
        if (exists) {
            await session.abortTransaction();
            return res.status(409).json({ message: 'A user with that username/email already exists' });
        }

        const hash = await bcrypt.hash(password, 10);
        const [user] = await User.create([{
            username, email, password: hash, phone,
            role: 'hospital',
        }], { session });

        const [hospital] = await Hospital.create([{
            ownerUserId: user._id,
            name: hospitalName,
            address, city, state,
            phone: hospitalPhone || phone || 'N/A',
            email,
        }], { session });

        user.hospitalId = hospital._id;
        await user.save({ session });

        await session.commitTransaction();

        const token = signToken(user);
        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.username, email: user.email, role: user.role, hospitalId: hospital._id },
            hospital,
        });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
};

// POST /hospital/login
export const hospitalLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        if (user.role !== 'hospital') {
            return res.status(403).json({ success: false, message: 'This account is not a hospital account' });
        }
        if (user.isActive === false) {
            return res.status(403).json({ success: false, message: 'Account disabled' });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = signToken(user);
        res.json({
            success: true,
            token,
            user: { id: user._id, name: user.username, email: user.email, role: user.role, hospitalId: user.hospitalId },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── Hospital self-service (requires role=hospital) ───────────────

const findMyHospital = async (userId) => {
    return Hospital.findOne({ ownerUserId: userId });
};

// GET /hospital/me — my hospital
export const getMyHospital = async (req, res) => {
    try {
        const hospital = await Hospital.findOne({ ownerUserId: req.user._id })
            .populate('affiliatedDoctorIds')
            .populate('inHouseMedicineIds', 'name price mrp images stock');
        if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });
        res.json(hospital);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /hospital/me — update my hospital
export const updateMyHospital = async (req, res) => {
    try {
        const hospital = await findMyHospital(req.user._id);
        if (!hospital) return res.status(404).json({ message: 'Not found' });

        // Prevent role/verification tampering
        const disallowed = ['ownerUserId', 'isVerified', 'services', 'affiliatedDoctorIds', 'inHouseMedicineIds', 'slug'];
        const updates = { ...req.body };
        for (const k of disallowed) delete updates[k];

        Object.assign(hospital, updates);
        await hospital.save();
        res.json(hospital);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Services ──────────────────────────────────────────────────────

// POST /hospital/me/services
export const addService = async (req, res) => {
    try {
        const hospital = await findMyHospital(req.user._id);
        if (!hospital) return res.status(404).json({ message: 'Not found' });
        hospital.services.push(req.body);
        await hospital.save();
        res.status(201).json(hospital.services[hospital.services.length - 1]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /hospital/me/services/:serviceId
export const updateService = async (req, res) => {
    try {
        const hospital = await findMyHospital(req.user._id);
        if (!hospital) return res.status(404).json({ message: 'Not found' });
        const service = hospital.services.id(req.params.serviceId);
        if (!service) return res.status(404).json({ message: 'Service not found' });
        Object.assign(service, req.body);
        await hospital.save();
        res.json(service);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /hospital/me/services/:serviceId
export const deleteService = async (req, res) => {
    try {
        const hospital = await findMyHospital(req.user._id);
        if (!hospital) return res.status(404).json({ message: 'Not found' });
        hospital.services.pull({ _id: req.params.serviceId });
        await hospital.save();
        res.json({ message: 'Service removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Affiliated doctors & medicines ────────────────────────────────

// PUT /hospital/me/doctors — replace full list
export const setAffiliatedDoctors = async (req, res) => {
    try {
        const hospital = await findMyHospital(req.user._id);
        if (!hospital) return res.status(404).json({ message: 'Not found' });
        hospital.affiliatedDoctorIds = req.body.doctorIds || [];
        await hospital.save();
        res.json(hospital);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /hospital/me/medicines — replace full list
export const setInHouseMedicines = async (req, res) => {
    try {
        const hospital = await findMyHospital(req.user._id);
        if (!hospital) return res.status(404).json({ message: 'Not found' });
        hospital.inHouseMedicineIds = req.body.medicineIds || [];
        await hospital.save();
        res.json(hospital);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Bookings management for the hospital ─────────────────────────

// GET /hospital/me/bookings
export const getMyHospitalBookings = async (req, res) => {
    try {
        const hospital = await findMyHospital(req.user._id);
        if (!hospital) return res.status(404).json({ message: 'Not found' });
        const { status, date } = req.query;
        const filter = { hospitalId: hospital._id };
        if (status) filter.status = status;
        if (date) {
            const d = new Date(date); d.setHours(0, 0, 0, 0);
            const next = new Date(d); next.setDate(next.getDate() + 1);
            filter.date = { $gte: d, $lt: next };
        }
        const bookings = await HospitalBooking.find(filter)
            .populate('userId', 'username email')
            .sort({ date: 1, timeSlot: 1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /hospital/me/bookings/:id/status
export const updateBookingStatus = async (req, res) => {
    try {
        const { status, cancellationReason } = req.body;
        const validStatuses = ['confirmed', 'completed', 'cancelled', 'no_show'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const hospital = await findMyHospital(req.user._id);
        if (!hospital) return res.status(404).json({ message: 'Not found' });

        const booking = await HospitalBooking.findOne({ _id: req.params.id, hospitalId: hospital._id });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.status = status;
        if (status === 'cancelled') booking.cancellationReason = cancellationReason;
        await booking.save();
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
