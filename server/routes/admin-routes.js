import express from 'express';
import { authRequired, adminOnly } from '../middleware/auth.js';
import {
    getStats,
    getRecentActivity,
    listCustomers,
    getCustomerDetail,
    updateCustomer,
    deleteCustomer,
    listDoctors,
    getDoctorDetail,
    updateDoctorAdmin,
    deleteDoctorAdmin,
    listAllAppointments,
} from '../controller/admin-controller.js';
import { listAllOrders, updateOrderStatus } from '../controller/pharmacy-order-controller.js';
import { listPendingPrescriptions, verifyPrescription } from '../controller/prescription-controller.js';
import {
    adminListDonors, adminVerifyDonor, adminDeleteDonor,
    adminCreateHospital, adminUpdateHospital, adminDeleteHospital,
    listHospitals,
} from '../controller/blood-controller.js';

const router = express.Router();

// All admin routes require JWT + admin role
router.use(authRequired, adminOnly);

// Dashboard
router.get('/stats', getStats);
router.get('/activity', getRecentActivity);

// Customers
router.get('/customers', listCustomers);
router.get('/customers/:id', getCustomerDetail);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// Doctors
router.get('/doctors', listDoctors);
router.get('/doctors/:id', getDoctorDetail);
router.put('/doctors/:id', updateDoctorAdmin);
router.delete('/doctors/:id', deleteDoctorAdmin);

// Appointments
router.get('/appointments', listAllAppointments);

// Orders (reusing pharmacy handlers)
router.get('/orders', listAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Prescriptions (reusing pharmacy handlers)
router.get('/prescriptions/pending', listPendingPrescriptions);
router.put('/prescriptions/:id/verify', verifyPrescription);

// Blood bank management
router.get('/blood/donors', adminListDonors);
router.put('/blood/donors/:id/verify', adminVerifyDonor);
router.delete('/blood/donors/:id', adminDeleteDonor);
router.get('/blood/hospitals', listHospitals);
router.post('/blood/hospitals', adminCreateHospital);
router.put('/blood/hospitals/:id', adminUpdateHospital);
router.delete('/blood/hospitals/:id', adminDeleteHospital);

export default router;
