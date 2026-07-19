import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { getMe, updateMe, getMyActivity } from '../controller/me-controller.js';

const router = express.Router();

router.get('/', authRequired, getMe);
router.put('/', authRequired, updateMe);
router.get('/activity', authRequired, getMyActivity);

export default router;
