import { Router } from 'express';
import { getAllUsers, createUser, toggleUserStatus } from '../controllers/userController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All user management routes require Authentication AND Admin privileges
router.use(verifyToken, requireAdmin);

// GET /api/v1/users - List all users
router.get('/', getAllUsers);

// POST /api/v1/users - Create new Staff or Admin user
router.post('/', createUser);

// PATCH /api/v1/users/:id/toggle-status - Toggle user active status
router.patch('/:id/toggle-status', toggleUserStatus);

export default router;
