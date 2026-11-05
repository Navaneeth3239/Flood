import express from 'express';
import {
  registerController,
  loginController,
  sendOtpController,
  verifyOtpController,
  logoutController,
  getMeController,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/send-otp', sendOtpController);
router.post('/verify-otp', verifyOtpController);
router.post('/logout', logoutController);
router.get('/me', requireAuth, getMeController);

export default router;

