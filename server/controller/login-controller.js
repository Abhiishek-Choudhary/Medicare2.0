import bcrypt from 'bcryptjs';
import User from "../model/UserSchema.js";
import { signToken } from '../middleware/auth.js';

const looksHashed = (pw) => typeof pw === 'string' && pw.startsWith('$2');

export const userSignUp = async (request, response) => {
  try {
    const { username, email, password, phone } = request.body;
    if (!username || !email || !password) {
      return response.status(400).json({ message: 'username, email, password are required' });
    }

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      return response.status(409).json({ message: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hash, phone });
    await newUser.save();

    const token = signToken(newUser);
    return response.status(201).json({
      success: true,
      token,
      user: { id: newUser._id, name: newUser.username, email: newUser.email, role: newUser.role },
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const userLogin = async (request, response) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email });
    if (!user) {
      return response.status(401).json({ success: false, message: 'Invalid Login' });
    }

    let ok = false;
    if (looksHashed(user.password)) {
      ok = await bcrypt.compare(password, user.password);
    } else {
      // legacy plaintext row — accept once, then upgrade to hash
      ok = user.password === password;
      if (ok) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!ok) {
      return response.status(401).json({ success: false, message: 'Invalid Login' });
    }

    if (user.isActive === false) {
      return response.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact support.',
      });
    }

    const token = signToken(user);
    return response.status(200).json({
      success: true,
      token,
      data: { id: user._id, name: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    return response.status(500).json({ success: false, message: error.message });
  }
};
