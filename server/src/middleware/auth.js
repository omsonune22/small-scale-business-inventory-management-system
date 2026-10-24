import jwt from 'jsonwebtoken';

/**
 * verifyToken Middleware
 * Extracts and verifies Bearer JWT token from the Authorization header.
 * Attaches decoded user payload { userId, username, email, role } to req.user.
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: No Bearer token provided in Authorization header.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secure_jwt_secret_key_pos_system_2026');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Access Forbidden: Invalid, manipulated, or expired session token.',
      error: error.message
    });
  }
};

/**
 * requireAdmin Middleware
 * RBAC Guard: Ensures req.user.role === 'ADMIN'
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Authentication required before role validation.'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access Forbidden: Administrator privileges required.'
    });
  }

  next();
};

export default {
  verifyToken,
  requireAdmin
};
