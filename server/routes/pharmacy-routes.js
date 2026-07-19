import express from 'express';
import upload from '../config/multer-config.js';
import { authRequired, adminOnly, pharmacistOrAdmin } from '../middleware/auth.js';

import {
  listMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine, updateStock,
} from '../controller/medicine-controller.js';
import {
  listCategories, createCategory, updateCategory, deleteCategory,
} from '../controller/category-controller.js';
import {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart,
} from '../controller/cart-controller.js';
import {
  listAddresses, createAddress, updateAddress, deleteAddress,
} from '../controller/address-controller.js';
import {
  uploadPrescription, listUserPrescriptions, listPendingPrescriptions, verifyPrescription,
} from '../controller/prescription-controller.js';
import {
  placeOrder, verifyOrderPayment, getMyOrders, getOrderById, cancelMyOrder,
  listAllOrders, updateOrderStatus,
} from '../controller/pharmacy-order-controller.js';

const router = express.Router();

// ── Public catalog ──────────────────────────────────────────
router.get('/medicines', listMedicines);
router.get('/medicines/:id', getMedicineById);
router.get('/categories', listCategories);

// ── Admin catalog CRUD ──────────────────────────────────────
router.post('/medicines', authRequired, adminOnly, createMedicine);
router.put('/medicines/:id', authRequired, adminOnly, updateMedicine);
router.delete('/medicines/:id', authRequired, adminOnly, deleteMedicine);
router.put('/medicines/:id/stock', authRequired, adminOnly, updateStock);

router.post('/categories', authRequired, adminOnly, createCategory);
router.put('/categories/:id', authRequired, adminOnly, updateCategory);
router.delete('/categories/:id', authRequired, adminOnly, deleteCategory);

// ── Cart (auth required) ────────────────────────────────────
router.get('/cart', authRequired, getCart);
router.post('/cart/add', authRequired, addToCart);
router.put('/cart/update', authRequired, updateCartItem);
router.delete('/cart/remove/:medicineId', authRequired, removeFromCart);
router.delete('/cart/clear', authRequired, clearCart);

// ── Addresses ───────────────────────────────────────────────
router.get('/addresses', authRequired, listAddresses);
router.post('/addresses', authRequired, createAddress);
router.put('/addresses/:id', authRequired, updateAddress);
router.delete('/addresses/:id', authRequired, deleteAddress);

// ── Prescriptions ───────────────────────────────────────────
router.post('/prescriptions', authRequired, upload.single('file'), uploadPrescription);
router.get('/prescriptions/me', authRequired, listUserPrescriptions);
router.get('/prescriptions/pending', authRequired, pharmacistOrAdmin, listPendingPrescriptions);
router.put('/prescriptions/:id/verify', authRequired, pharmacistOrAdmin, verifyPrescription);

// ── Orders ──────────────────────────────────────────────────
router.post('/orders', authRequired, placeOrder);
router.post('/orders/verify', authRequired, verifyOrderPayment);
router.get('/orders/me', authRequired, getMyOrders);
router.get('/orders/all', authRequired, pharmacistOrAdmin, listAllOrders);
router.get('/orders/:id', authRequired, getOrderById);
router.put('/orders/:id/cancel', authRequired, cancelMyOrder);
router.put('/orders/:id/status', authRequired, pharmacistOrAdmin, updateOrderStatus);

export default router;
