import express from 'express';
import { authRequired } from '../middleware/auth.js';
import {
    searchDonors, getDonorPublic, listHospitals, getBloodMeta,
    registerDonor, getMyDonorProfile, updateMyDonorProfile, deleteMyDonorProfile,
} from '../controller/blood-controller.js';

const router = express.Router();

// Public
router.get('/meta', getBloodMeta);
router.get('/donors', searchDonors);
router.get('/hospitals', listHospitals);

// Authenticated (donor self-service)
router.get('/donors/me', authRequired, getMyDonorProfile);
router.post('/donors', authRequired, registerDonor);
router.put('/donors/me', authRequired, updateMyDonorProfile);
router.delete('/donors/me', authRequired, deleteMyDonorProfile);

// This must come AFTER /donors/me so 'me' isn't captured
router.get('/donors/:id', getDonorPublic);

export default router;
