import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

// Fallback seed accounts for offline development
const fallbackAccounts = [
  {
    user_id: 1,
    username: 'admin',
    email: 'admin@store.com',
    password_hash: '$2a$10$Hkg6oDgdhD6.7sNvG2UgbuGgGCrG2SN0ub7vlCj1NVc5pgn1smU5u', // Admin@123
    full_name: 'Admin Manager',
    role: 'ADMIN',
    is_active: 1
  },
  {
    user_id: 2,
    username: 'staff',
    email: 'staff@store.com',
    password_hash: '$2a$10$yhWQTyYlyR0FNVbYGczrXulqwBgc9MPjCmyWUBHswGeAktqi1DZTi', // Staff@123
    full_name: 'Store Cashier',
    role: 'STAFF',
    is_active: 1
  }
];

/**
 * POST /api/v1/auth/login
 * Authenticates user via email and password, verifies active status,
 * and issues a JWT token valid for 8 hours containing { userId, username, role }.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    let user;

    // 2. Query user from MySQL database (with fallback for offline demo)
    try {
      const users = await query(
        `SELECT user_id, username, email, password_hash, full_name, role, is_active 
         FROM users 
         WHERE LOWER(email) = ? 
         LIMIT 1`,
        [trimmedEmail]
      );
      if (users.length > 0) {
        user = users[0];
      }
    } catch (dbErr) {
      console.warn('[AUTH LOGIN]: Database offline. Using seed fallback verification.');
      user = fallbackAccounts.find(u => u.email.toLowerCase() === trimmedEmail);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // 3. Verify password hash using bcryptjs
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // 4. Reject inactive accounts (is_active = FALSE)
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact your system administrator.'
      });
    }

    // 5. Sign JWT containing { userId, username, role } valid for 8 hours
    const payload = {
      userId: user.user_id,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super_secure_jwt_secret_key_pos_system_2026',
      { expiresIn: '8h' }
    );

    // 6. Return response with token and sanitized user details (no password_hash)
    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: Boolean(user.is_active)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 * Protected endpoint returning authenticated user profile.
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    try {
      const users = await query(
        `SELECT user_id, username, email, full_name, role, is_active, created_at, updated_at 
         FROM users 
         WHERE user_id = ? 
         LIMIT 1`,
        [userId]
      );

      if (users.length > 0) {
        const user = users[0];
        return res.status(200).json({
          success: true,
          user: {
            userId: user.user_id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            isActive: Boolean(user.is_active),
            createdAt: user.created_at,
            updatedAt: user.updated_at
          }
        });
      }
    } catch (dbErr) {
      console.warn('[AUTH ME]: Database offline, using token payload fallback.');
    }

    // Fallback response from JWT payload
    return res.status(200).json({
      success: true,
      user: {
        userId: req.user.userId,
        username: req.user.username,
        email: `${req.user.username}@store.com`,
        fullName: req.user.username === 'admin' ? 'Admin Manager' : 'Store Cashier',
        role: req.user.role,
        isActive: true
      }
    });
  } catch (error) {
    next(error);
  }
};
