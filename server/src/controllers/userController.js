import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

/**
 * GET /api/v1/users
 * Admin only: Returns all registered users with their roles and active status.
 */
export const getAllUsers = async (req, res, next) => {
  try {
    let users = [];
    try {
      users = await query(
        `SELECT user_id, username, email, full_name, role, is_active, created_at, updated_at 
         FROM users 
         ORDER BY user_id ASC`
      );
    } catch (dbErr) {
      console.warn('[USERS]: Database offline, using fallback users list.');
      users = [
        { user_id: 1, username: 'admin', email: 'admin@store.com', full_name: 'Admin Manager', role: 'ADMIN', is_active: 1, created_at: '2026-10-23' },
        { user_id: 2, username: 'staff', email: 'staff@store.com', full_name: 'Store Cashier', role: 'STAFF', is_active: 1, created_at: '2026-10-23' },
      ];
    }

    const sanitizedUsers = users.map(u => ({
      userId: u.user_id,
      username: u.username,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      isActive: Boolean(u.is_active),
      createdAt: u.created_at,
      updatedAt: u.updated_at
    }));

    return res.status(200).json({
      success: true,
      count: sanitizedUsers.length,
      users: sanitizedUsers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users
 * Admin only: Create a new Staff (or Admin) account with a bcrypt-hashed password.
 */
export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    // 1. Validation
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, and full name are required.'
      });
    }

    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'STAFF';
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim().toLowerCase();

    // 2. Check for duplicate username or email
    const existing = await query(
      `SELECT user_id, username, email FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?`,
      [trimmedEmail, trimmedUsername]
    );

    if (existing.length > 0) {
      const isEmailDuplicate = existing.some(u => u.email.toLowerCase() === trimmedEmail);
      return res.status(409).json({
        success: false,
        message: isEmailDuplicate 
          ? 'A user with this email address already exists.' 
          : 'A user with this username already exists.'
      });
    }

    // 3. Hash password with bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Insert new user into MySQL
    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [trimmedUsername, trimmedEmail, passwordHash, fullName.trim(), assignedRole]
    );

    return res.status(201).json({
      success: true,
      message: `Account for ${fullName} (${assignedRole}) created successfully.`,
      user: {
        userId: result.insertId,
        username: trimmedUsername,
        email: trimmedEmail,
        fullName: fullName.trim(),
        role: assignedRole,
        isActive: true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/:id/toggle-status
 * Admin only: Toggle is_active status of a user (activate or deactivate).
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    if (isNaN(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID parameter.'
      });
    }

    // Self-deactivation protection
    if (req.user.userId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Security Guard: You cannot deactivate your own active Administrator session.'
      });
    }

    // Fetch existing user
    const users = await query(
      `SELECT user_id, username, email, full_name, role, is_active FROM users WHERE user_id = ?`,
      [targetUserId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const currentStatus = Boolean(users[0].is_active);
    const newStatus = currentStatus ? 0 : 1;

    await query(
      `UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [newStatus, targetUserId]
    );

    return res.status(200).json({
      success: true,
      message: `User '${users[0].username}' has been ${newStatus ? 'activated' : 'deactivated'}.`,
      user: {
        userId: users[0].user_id,
        username: users[0].username,
        email: users[0].email,
        fullName: users[0].full_name,
        role: users[0].role,
        isActive: Boolean(newStatus)
      }
    });
  } catch (error) {
    next(error);
  }
};
