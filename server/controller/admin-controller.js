import User from '../model/UserSchema.js';
import Doctor from '../model/DoctorSchema.js';
import Appointment from '../model/AppointmentSchema.js';
import PharmacyOrder from '../model/PharmacyOrderSchema.js';
import Prescription from '../model/PrescriptionSchema.js';
import Payment from '../model/PaymentSchema.js';

// ── GET /admin/stats — dashboard overview ────────────────────────
export const getStats = async (_req, res) => {
    try {
        const [
            usersCount, doctorsCount, appointmentsCount, ordersCount,
            paidOrders, deliveredOrders, cancelledOrders,
            pendingRx, pharmacyRevenueAgg, consultRevenueAgg,
            todayAppointments, todayOrders,
        ] = await Promise.all([
            User.countDocuments({ role: { $ne: 'admin' } }),
            Doctor.countDocuments({}),
            Appointment.countDocuments({}),
            PharmacyOrder.countDocuments({}),
            PharmacyOrder.countDocuments({ paymentStatus: 'paid' }),
            PharmacyOrder.countDocuments({ orderStatus: 'delivered' }),
            PharmacyOrder.countDocuments({ orderStatus: 'cancelled' }),
            Prescription.countDocuments({ status: 'pending' }),
            PharmacyOrder.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            Payment.aggregate([
                { $match: { paymentStatus: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Appointment.countDocuments({
                createdAt: { $gte: startOfDay() },
            }),
            PharmacyOrder.countDocuments({
                createdAt: { $gte: startOfDay() },
            }),
        ]);

        res.json({
            users: usersCount,
            doctors: doctorsCount,
            appointments: appointmentsCount,
            todayAppointments,
            orders: ordersCount,
            paidOrders,
            deliveredOrders,
            cancelledOrders,
            todayOrders,
            pendingPrescriptions: pendingRx,
            pharmacyRevenue: pharmacyRevenueAgg[0]?.total || 0,
            consultRevenue: consultRevenueAgg[0]?.total || 0,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /admin/activity — recent activity feed ───────────────────
export const getRecentActivity = async (_req, res) => {
    try {
        const [orders, appointments, prescriptions] = await Promise.all([
            PharmacyOrder.find({}).populate('userId', 'username email').sort({ createdAt: -1 }).limit(15),
            Appointment.find({}).sort({ createdAt: -1 }).limit(15),
            Prescription.find({}).populate('userId', 'username email').sort({ createdAt: -1 }).limit(10),
        ]);

        const events = [
            ...orders.map((o) => ({
                type: 'order',
                at: o.createdAt,
                actor: o.userId?.username || 'Unknown',
                actorEmail: o.userId?.email,
                title: `Order ${o.orderNumber}`,
                subtitle: `${o.items.length} item(s) · ₹${o.totalAmount} · ${o.orderStatus}`,
                link: `/admin/orders?highlight=${o._id}`,
                status: o.orderStatus,
            })),
            ...appointments.map((a) => ({
                type: 'appointment',
                at: a.createdAt || a.date,
                actor: a.customerName,
                actorEmail: a.customerEmail,
                title: `Appointment with Dr. ${a.doctorName}`,
                subtitle: `${new Date(a.date).toLocaleString()} · ${a.status}`,
                link: `/admin/appointments`,
                status: a.status,
            })),
            ...prescriptions.map((p) => ({
                type: 'prescription',
                at: p.createdAt,
                actor: p.userId?.username || 'Unknown',
                actorEmail: p.userId?.email,
                title: `Prescription uploaded`,
                subtitle: `Status: ${p.status}`,
                link: `/admin/customers/${p.userId?._id}`,
                status: p.status,
            })),
        ]
            .filter((e) => e.at)
            .sort((a, b) => new Date(b.at) - new Date(a.at))
            .slice(0, 30);

        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /admin/customers — list with counts ──────────────────────
export const listCustomers = async (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;
        const filter = { role: { $ne: 'admin' } };
        if (q) {
            filter.$or = [
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [users, total] = await Promise.all([
            User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            User.countDocuments(filter),
        ]);

        const ids = users.map((u) => u._id);
        const [orderStats, apptStats] = await Promise.all([
            PharmacyOrder.aggregate([
                { $match: { userId: { $in: ids } } },
                { $group: {
                    _id: '$userId',
                    orders: { $sum: 1 },
                    spent: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
                    lastOrder: { $max: '$createdAt' },
                }},
            ]),
            Appointment.aggregate([
                { $match: { userId: { $in: ids } } },
                { $group: {
                    _id: '$userId',
                    appointments: { $sum: 1 },
                    lastAppointment: { $max: '$createdAt' },
                }},
            ]),
        ]);

        const orderMap = Object.fromEntries(orderStats.map((s) => [s._id.toString(), s]));
        const apptMap = Object.fromEntries(apptStats.map((s) => [s._id.toString(), s]));

        const items = users.map((u) => {
            const os = orderMap[u._id.toString()] || {};
            const as = apptMap[u._id.toString()] || {};
            return {
                _id: u._id,
                username: u.username,
                email: u.email,
                phone: u.phone,
                role: u.role,
                createdAt: u.createdAt,
                orders: os.orders || 0,
                spent: os.spent || 0,
                lastOrder: os.lastOrder,
                appointments: as.appointments || 0,
                lastAppointment: as.lastAppointment,
            };
        });

        res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /admin/customers/:id — full detail ───────────────────────
export const getCustomerDetail = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Customer not found' });

        const [appointments, orders, prescriptions, payments] = await Promise.all([
            Appointment.find({ userId: user._id }).sort({ date: -1 }),
            PharmacyOrder.find({ userId: user._id }).sort({ createdAt: -1 }),
            Prescription.find({ userId: user._id }).sort({ createdAt: -1 }),
            Payment.find({ patientId: user._id }).populate('doctorId').sort({ timestamp: -1 }),
        ]);

        const spent = orders.reduce((n, o) => o.paymentStatus === 'paid' ? n + o.totalAmount : n, 0);
        const consultSpent = payments.reduce((n, p) => p.paymentStatus === 'completed' ? n + p.amount : n, 0);

        res.json({
            user,
            summary: {
                totalAppointments: appointments.length,
                totalOrders: orders.length,
                totalPrescriptions: prescriptions.length,
                pharmacySpent: spent,
                consultSpent,
                totalSpent: spent + consultSpent,
            },
            appointments,
            orders,
            prescriptions,
            payments,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /admin/doctors — list with metrics ────────────────────────
export const listDoctors = async (req, res) => {
    try {
        const { q } = req.query;
        const filter = {};
        if (q) filter.title = { $regex: q, $options: 'i' };

        const doctors = await Doctor.find(filter).sort({ title: 1 });

        // Compute metrics per doctor by title (Appointment stores doctorName)
        const names = doctors.map((d) => d.title);
        const stats = await Appointment.aggregate([
            { $match: { doctorName: { $in: names } } },
            { $group: {
                _id: '$doctorName',
                totalAppointments: { $sum: 1 },
                scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                revenue: { $sum: { $ifNull: ['$fee', 0] } },
                avgRating: { $avg: '$rating' },
            }},
        ]);
        const statMap = Object.fromEntries(stats.map((s) => [s._id, s]));

        const items = doctors.map((d) => {
            const s = statMap[d.title] || {};
            return {
                _id: d._id,
                id: d.id,
                title: d.title,
                category: d.category,
                fee: d.fee,
                url: d.url,
                available: d.available,
                totalAppointments: s.totalAppointments || 0,
                scheduled: s.scheduled || 0,
                cancelled: s.cancelled || 0,
                revenue: s.revenue || 0,
                avgRating: s.avgRating ? Math.round(s.avgRating * 10) / 10 : null,
            };
        });

        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /admin/doctors/:id — full doctor detail ───────────────────
export const getDoctorDetail = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const appointments = await Appointment.find({ doctorName: doctor.title }).sort({ date: -1 });
        const ratings = appointments
            .filter((a) => a.rating)
            .map((a) => ({ rating: a.rating, review: a.review, at: a.updatedAt, customer: a.customerName }));

        const revenue = appointments.reduce((n, a) => n + (a.fee || 0), 0);
        const avgRating = ratings.length
            ? Math.round((ratings.reduce((n, r) => n + r.rating, 0) / ratings.length) * 10) / 10
            : null;

        res.json({
            doctor,
            summary: {
                totalAppointments: appointments.length,
                scheduled: appointments.filter((a) => a.status === 'scheduled').length,
                cancelled: appointments.filter((a) => a.status === 'cancelled').length,
                completed: appointments.filter((a) => a.status === 'completed').length,
                revenue,
                avgRating,
                totalRatings: ratings.length,
            },
            appointments,
            ratings,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /admin/appointments — all appointments ────────────────────
export const listAllAppointments = async (req, res) => {
    try {
        const { status, q, page = 1, limit = 30 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (q) {
            filter.$or = [
                { customerName: { $regex: q, $options: 'i' } },
                { doctorName: { $regex: q, $options: 'i' } },
                { customerEmail: { $regex: q, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Appointment.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)),
            Appointment.countDocuments(filter),
        ]);

        res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const startOfDay = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

// ── PUT /admin/customers/:id — update role or activation ────────
export const updateCustomer = async (req, res) => {
    try {
        const { role, isActive, phone, username } = req.body;
        const updates = {};
        if (role !== undefined) {
            if (!['customer', 'pharmacist', 'admin'].includes(role)) {
                return res.status(400).json({ message: 'Invalid role' });
            }
            updates.role = role;
        }
        if (isActive !== undefined) updates.isActive = !!isActive;
        if (phone !== undefined) updates.phone = phone;
        if (username !== undefined) updates.username = username;

        // Prevent admins from disabling their own account by mistake
        if (updates.isActive === false && req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot disable your own account' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'Customer not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── DELETE /admin/customers/:id — permanent delete ──────────────
export const deleteCustomer = async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'Customer not found' });
        res.json({ message: 'Customer deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PUT /admin/doctors/:id — update fee/available/etc ───────────
export const updateDoctorAdmin = async (req, res) => {
    try {
        const allowed = ['title', 'category', 'fee', 'time', 'available', 'url'];
        const updates = {};
        for (const k of allowed) {
            if (req.body[k] !== undefined) updates[k] = req.body[k];
        }
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.json(doctor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── DELETE /admin/doctors/:id ────────────────────────────────────
export const deleteDoctorAdmin = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.json({ message: 'Doctor deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
