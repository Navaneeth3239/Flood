import crypto from 'crypto';
import { sendOtp, verifyOtp } from '../services/smsService.js';
import { signToken } from '../middleware/authMiddleware.js';
import { db, MongoUser } from '../config/db.js';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedPasswordHash) {
  if (!storedPasswordHash || !storedPasswordHash.includes(':')) return false;
  const [salt, originalHash] = storedPasswordHash.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch (e) {
    return false;
  }
}

/**
 * POST /api/auth/register
 * Accepts details: name, password, age, dob, mail (email), number (phone), address (optional)
 */
export async function registerController(req, res) {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.mail || req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const age = parseInt(req.body.age, 10);
    const dob = (req.body.dob || req.body.DOB || '').trim();
    const phone = (req.body.number || req.body.phone || '').trim();
    const address = (req.body.address || '').trim();

    // Field Validations
    if (!name) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }
    if (isNaN(age) || age < 1 || age > 130) {
      return res.status(400).json({ success: false, error: 'A valid age between 1 and 130 is required.' });
    }
    if (!dob) {
      return res.status(400).json({ success: false, error: 'Date of Birth (DOB) is required.' });
    }
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Mobile phone number is required.' });
    }

    // Check if user already exists with this email
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists. Please log in.',
      });
    }

    const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const passwordHash = hashPassword(password);
    const role = req.body.role || 'citizen';

    // Insert into SQLite
    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, age, dob, phone, address, role, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(userId, name, email, passwordHash, age, dob, phone, address, role);

    // Sync to MongoDB if connected
    try {
      if (MongoUser) {
        await MongoUser.create({
          id: userId,
          name,
          email,
          password_hash: passwordHash,
          age,
          dob,
          phone,
          address,
          role,
        });
      }
    } catch (mErr) {
      console.warn('[AUTH] Mongo sync notice:', mErr.message);
    }

    const userObj = {
      id: userId,
      name,
      email,
      phone,
      age,
      dob,
      address,
      role,
    };

    const token = signToken(userObj);

    return res.status(201).json({
      success: true,
      message: 'Account registered and signed in successfully.',
      token,
      user: userObj,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Registration failed.' });
  }
}

/**
 * POST /api/auth/login
 * Log in using email (mail) and password
 */
export async function loginController(req, res) {
  try {
    const email = (req.body.mail || req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      age: user.age,
      dob: user.dob,
      address: user.address,
      role: user.role,
    };

    const token = signToken(userObj);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userObj,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Login failed.' });
  }
}

export async function sendOtpController(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Mobile phone number is required.' });
    }

    const result = await sendOtp(phone);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function verifyOtpController(req, res) {
  try {
    const { phone, code, name } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, error: 'Both phone number and OTP code are required.' });
    }

    const user = verifyOtp(phone, code);

    // If an optional display name is provided during onboarding, update user record
    if (name && name.trim()) {
      db.prepare("UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name.trim(), user.id);
      user.name = name.trim();
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function getMeController(req, res) {
  try {
    const user = db
      .prepare('SELECT id, name, email, phone, age, dob, address, role, created_at FROM users WHERE id = ?')
      .get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function logoutController(req, res) {
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
}
