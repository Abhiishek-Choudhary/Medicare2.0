import express from 'express';
import { authRequired } from '../middleware/auth.js';
import {
    hospitalSignup, hospitalLogin,
    getMyHospital, updateMyHospital,
    addService, updateService, deleteService,
    setAffiliatedDoctors, setInHouseMedicines,
    getMyHospitalBookings, updateBookingStatus,
} from '../controller/hospital-controller.js';
import {
    listHospitalsPublic, getHospitalPublic, getHospitalSlots, bookSlot,
    getMyBookings, cancelMyBooking,
} from '../controller/hospital-public-controller.js';

const router = express.Router();

// Middleware — role check for hospital-only endpoints
const hospitalOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'hospital') {
        return res.status(403).json({ message: 'Hospital account required' });
    }
    next();
};

// Public / auth
router.post('/signup', hospitalSignup);
router.post('/login', hospitalLogin);
router.get('/list', listHospitalsPublic);

// User self-service bookings — must come BEFORE '/:id' wildcard
router.get('/me/bookings', authRequired, getMyBookings);
router.put('/me/bookings/:id/cancel', authRequired, cancelMyBooking);

// Hospital self-service (protected) — also BEFORE wildcard
router.get('/me', authRequired, hospitalOnly, getMyHospital);
router.put('/me', authRequired, hospitalOnly, updateMyHospital);
router.post('/me/services', authRequired, hospitalOnly, addService);
router.put('/me/services/:serviceId', authRequired, hospitalOnly, updateService);
router.delete('/me/services/:serviceId', authRequired, hospitalOnly, deleteService);
router.put('/me/doctors', authRequired, hospitalOnly, setAffiliatedDoctors);
router.put('/me/medicines', authRequired, hospitalOnly, setInHouseMedicines);
router.get('/me/bookings-inbox', authRequired, hospitalOnly, getMyHospitalBookings);
router.put('/me/bookings-inbox/:id/status', authRequired, hospitalOnly, updateBookingStatus);

// Public detail + slot query + booking action (booking is auth-gated) — wildcard LAST
router.get('/:id/slots', getHospitalSlots);
router.post('/:id/book', authRequired, bookSlot);
router.get('/:id', getHospitalPublic);

export default router;
