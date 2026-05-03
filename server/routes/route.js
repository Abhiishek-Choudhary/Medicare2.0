import express from 'express';
import { userLogin, userSignUp } from '../controller/login-controller.js';
import { DoctorLogin, getDoctor, getDoctorById, getAllDoctors } from '../controller/doctor-controller.js';
import { getUser, getUserDetails } from '../controller/details-controller.js';
import { uploadImage } from '../controller/Image-controller.js';
import upload from '../config/multer-config.js';
import { createAppointment, updateAppointment, getDoctorAppointments } from '../controller/appointment-controller.js';
import { getAppointmentsByDoctor, getAppointmentsByUser } from '../controller/getdoctorById-controller.js';
import { cancelAppointment, rescheduleAppointment, cancelAppointmentByDoctor } from '../controller/appointmentdelete-controller.js';
import { createOrder, verifyPayment, getPaymentHistory, savePayment } from '../controller/payment-controller.js';
import { submitRating } from '../controller/rating-controller.js';

const router = express.Router();

// ── POST routes ──────────────────────────────────────────────
router.post('/signup', userSignUp);
router.post('/login', userLogin);
router.post('/doclogin', DoctorLogin);
router.post('/details', getUserDetails);
router.post('/upload', upload.single('file'), uploadImage);
router.post('/api/appointments', createAppointment);
router.post('/save', savePayment);
router.post('/rate', submitRating);
router.post('/order', createOrder);
router.post('/verify', verifyPayment);

// ── GET routes (specific paths first, wildcard LAST) ─────────
router.get('/doctor/appointments/:id', getDoctorAppointments);
router.get('/doctor/:id', getDoctorById);
router.get('/doctor', getDoctor);
router.get('/alldoctors', getAllDoctors);
router.get('/profile', getUser);
router.get('/user/:userId', getAppointmentsByUser);
router.get('/payments/:userId', getPaymentHistory);
router.get('/history/:userId', getPaymentHistory);
router.get('/:doctorId', getAppointmentsByDoctor); // wildcard — must stay LAST

// ── PUT routes ───────────────────────────────────────────────
router.put('/cancel/:id', cancelAppointmentByDoctor);
router.put('/reschedule/:id', rescheduleAppointment);
router.put('/:appointmentId', updateAppointment);  // wildcard — must stay LAST

// ── DELETE routes ────────────────────────────────────────────
router.delete('/delete/:id', cancelAppointment);

export default router;
