import jwt from 'jsonwebtoken';
import User from '../model/UserSchema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export const authRequired = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Auth token missing' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select('_id username email role isActive');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account disabled' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const pharmacistOrAdmin = (req, res, next) => {
  if (!req.user || !['pharmacist', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Pharmacist or admin access required' });
  }
  next();
};

export const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
