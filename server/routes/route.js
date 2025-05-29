import express from 'express';
import { userLogin, userSignUp } from '../controller/login-controller.js';
import { DoctorLogin, getDoctor, getDoctorById } from '../controller/doctor-controller.js';
import { getUser, getUserDetails } from '../controller/details-controller.js';
import { uploadImage } from '../controller/Image-controller.js';
import  upload from '../config/multer-config.js';
import { createAppointment } from '../controller/appointment-controller.js'
import { getAllDoctors } from '../controller/doctor-controller.js';
import { getAppointmentsByDoctor } from '../controller/getdoctorById-controller.js';
import { getAppointmentsByUser } from '../controller/getdoctorById-controller.js';
import { cancelAppointment, rescheduleAppointment,cancelAppointmentByDoctor } from '../controller/appointmentdelete-controller.js';
import { createOrder, verifyPayment } from '../controller/payment-controller.js';
import { updateAppointment } from '../controller/appointment-controller.js';
import { getPaymentHistory, savePayment } from '../controller/payment-controller.js';
import { getDoctorAppointments } from '../controller/appointment-controller.js';

const router = express.Router();

router.post('/signup',userSignUp);
router.post('/login',userLogin);
router.post('/doclogin', DoctorLogin);
router.post('/details',getUserDetails)
router.post('/upload',upload.single('file'),uploadImage)
router.post('/api/appointments', createAppointment);
router.post('/save', savePayment);

router.get('/doctor',getDoctor);
router.get('/profile',getUser);
router.get('/alldoctors', getAllDoctors);
router.get('/:doctorId', getAppointmentsByDoctor);
router.get('/user/:userId', getAppointmentsByUser);
router.get('/payments/:userId', getPaymentHistory);
router.get('/history/:userId', getPaymentHistory);
router.get('/doctor/:id', getDoctorById);
router.get('/doctor/appointments/:id', getDoctorAppointments);

router.delete('/delete/:id', cancelAppointment);

router.post('/order', createOrder);
router.post('/verify', verifyPayment);

router.put('/:appointmentId', updateAppointment);
router.put('/cancel/:id', cancelAppointmentByDoctor);
router.put('/reschedule/:id', rescheduleAppointment);


export default router;