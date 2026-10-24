import { Router } from 'express';
import { login, getProfile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Public: User Authentication
router.post('/login', login);

// Protected: Authenticated Profile
router.get('/me', verifyToken, getProfile);

export default router;
