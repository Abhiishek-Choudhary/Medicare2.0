import Hospital from '../model/HospitalSchema.js';
import HospitalBooking from '../model/HospitalBookingSchema.js';
import Doctor from '../model/DoctorSchema.js';
import Medicine from '../model/MedicineSchema.js';

// GET /hospital/list — public search
export const listHospitalsPublic = async (req, res) => {
    try {
        const { q, city, specialty, page = 1, limit = 20 } = req.query;
        const filter = { isActive: true };
        if (q) filter.name = { $regex: q, $options: 'i' };
        if (city) filter.city = { $regex: city, $options: 'i' };
        if (specialty) filter.specialties = { $regex: specialty, $options: 'i' };

        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Hospital.find(filter)
                .select('name slug description logoUrl images address city state pincode phone emergencyPhone is24x7 specialties facilities services isVerified')
                .sort({ isVerified: -1, name: 1 })
                .skip(skip).limit(Number(limit)),
            Hospital.countDocuments(filter),
        ]);
        res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /hospital/:id — public detail with doctors + medicines
export const getHospitalPublic = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id)
            .populate('affiliatedDoctorIds')
            .populate('inHouseMedicineIds', 'name slug price mrp images stock prescriptionRequired');
        if (!hospital || !hospital.isActive) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        res.json(hospital);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /hospital/:id/slots?serviceId=X&date=YYYY-MM-DD
export const getHospitalSlots = async (req, res) => {
    try {
        const { serviceId, date } = req.query;
        if (!serviceId || !date) return res.status(400).json({ message: 'serviceId and date required' });

        const hospital = await Hospital.findById(req.params.id);
        if (!hospital || !hospital.isActive) return res.status(404).json({ message: 'Hospital not found' });

        const service = hospital.services.id(serviceId);
        if (!service || !service.isActive) return res.status(404).json({ message: 'Service not found' });

        // Generate slot start times from opening → closing at durationMinutes stride
        const [openH, openM] = (hospital.is24x7 ? '00:00' : hospital.openingTime).split(':').map(Number);
        const [closeH, closeM] = (hospital.is24x7 ? '23:59' : hospital.closingTime).split(':').map(Number);

        const start = openH * 60 + openM;
        const end   = closeH * 60 + closeM;
        const step  = service.durationMinutes;

        const slots = [];
        for (let t = start; t + step <= end; t += step) {
            const hh = String(Math.floor(t / 60)).padStart(2, '0');
            const mm = String(t % 60).padStart(2, '0');
            slots.push(`${hh}:${mm}`);
        }

        // Find already-booked slots for this date
        const d = new Date(date); d.setHours(0, 0, 0, 0);
        const next = new Date(d); next.setDate(next.getDate() + 1);
        const booked = await HospitalBooking.find({
            hospitalId: hospital._id,
            serviceId: service._id,
            date: { $gte: d, $lt: next },
            status: { $in: ['pending', 'confirmed'] },
        }).select('timeSlot');
        const bookedSet = new Set(booked.map((b) => b.timeSlot));

        // For today's date, hide already-past slots
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const nowMins = now.getHours() * 60 + now.getMinutes();

        const result = slots.map((s) => {
            const [h, m] = s.split(':').map(Number);
            const past = isToday && (h * 60 + m) <= nowMins;
            return { time: s, booked: bookedSet.has(s), past };
        });

        res.json({
            hospitalId: hospital._id,
            service: { _id: service._id, name: service.name, price: service.price, duration: service.durationMinutes },
            date,
            slots: result,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /hospital/:id/book — book a slot (auth)
export const bookSlot = async (req, res) => {
    try {
        const { serviceId, date, timeSlot, customerName, customerPhone, customerEmail, notes } = req.body;
        if (!serviceId || !date || !timeSlot || !customerName || !customerPhone) {
            return res.status(400).json({ message: 'serviceId, date, timeSlot, customerName, customerPhone required' });
        }

        const hospital = await Hospital.findById(req.params.id);
        if (!hospital || !hospital.isActive) return res.status(404).json({ message: 'Hospital not found' });

        const service = hospital.services.id(serviceId);
        if (!service || !service.isActive) return res.status(404).json({ message: 'Service not found' });

        // Refuse past date
        const bookDate = new Date(date); bookDate.setHours(0, 0, 0, 0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (bookDate < today) return res.status(400).json({ message: 'Cannot book a past date' });

        // Refuse if already booked
        const conflict = await HospitalBooking.findOne({
            hospitalId: hospital._id,
            serviceId: service._id,
            date: bookDate,
            timeSlot,
            status: { $in: ['pending', 'confirmed'] },
        });
        if (conflict) return res.status(409).json({ message: 'That slot is already booked' });

        const booking = await HospitalBooking.create({
            userId: req.user._id,
            hospitalId: hospital._id,
            serviceId: service._id,
            serviceName: service.name,
            date: bookDate,
            timeSlot,
            durationMinutes: service.durationMinutes,
            amount: service.price,
            customerName,
            customerPhone,
            customerEmail: customerEmail || req.user.email,
            notes,
            status: 'pending',
        });

        res.status(201).json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /me/hospital-bookings — user's own bookings
export const getMyBookings = async (req, res) => {
    try {
        const bookings = await HospitalBooking.find({ userId: req.user._id })
            .populate('hospitalId', 'name city phone')
            .sort({ date: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /me/hospital-bookings/:id/cancel
export const cancelMyBooking = async (req, res) => {
    try {
        const booking = await HospitalBooking.findOne({ _id: req.params.id, userId: req.user._id });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({ message: `Cannot cancel in ${booking.status} state` });
        }
        booking.status = 'cancelled';
        booking.cancellationReason = req.body.reason || 'Cancelled by customer';
        await booking.save();
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
