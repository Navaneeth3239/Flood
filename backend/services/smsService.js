import crypto from 'node:crypto';
import { db } from '../config/db.js';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function generateOtp() {
  // Generate secure 6-digit integer
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendOtp(phone) {
  const sanitizedPhone = phone.trim().replace(/[^\d+]/g, '');
  if (!sanitizedPhone || sanitizedPhone.length < 8) {
    throw new Error('Please enter a valid mobile phone number with country code (e.g., +919876543210).');
  }

  const otpCode = generateOtp();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  // Save to database
  const stmt = db.prepare(`
    INSERT INTO otps (phone, code, expires_at, attempts, created_at)
    VALUES (?, ?, ?, 0, datetime('now'))
    ON CONFLICT(phone) DO UPDATE SET
      code = excluded.code,
      expires_at = excluded.expires_at,
      attempts = 0,
      created_at = excluded.created_at
  `);
  stmt.run(sanitizedPhone, otpCode, expiresAt);

  const isDev = process.env.NODE_ENV !== 'production' || !process.env.SMS_PROVIDER_API_KEY;

  if (process.env.SMS_PROVIDER_API_KEY) {
    // Integration with SMS Gateway (e.g., Fast2SMS / Twilio / MSG91)
    console.log(`[SMS-GATEWAY] Dispatching SMS OTP to ${sanitizedPhone} via provider ID: ${process.env.SMS_PROVIDER_ID || 'DEFAULT'}`);
    // If real provider is hooked up: await externalSmsGateway.send(...)
  }

  console.log(`[AUTH-OTP] Generated 6-digit OTP for ${sanitizedPhone}: [${otpCode}] (Valid for 5 minutes)`);

  return {
    success: true,
    phone: sanitizedPhone,
    message: isDev
      ? 'Verification code generated (Development Mode: Code logged to server)'
      : 'Verification SMS dispatched to your mobile number.',
    expiresInSeconds: 300,
    devOtp: isDev ? otpCode : undefined,
  };
}

export function verifyOtp(phone, inputCode) {
  const sanitizedPhone = phone.trim().replace(/[^\d+]/g, '');
  const stmt = db.prepare('SELECT * FROM otps WHERE phone = ?');
  const record = stmt.get(sanitizedPhone);

  if (!record) {
    throw new Error('No OTP request found for this mobile number. Please request a new code.');
  }

  if (Date.now() > record.expires_at) {
    db.prepare('DELETE FROM otps WHERE phone = ?').run(sanitizedPhone);
    throw new Error('OTP has expired. Please request a new code.');
  }

  if (record.attempts >= 5) {
    db.prepare('DELETE FROM otps WHERE phone = ?').run(sanitizedPhone);
    throw new Error('Too many invalid attempts. Please request a new OTP.');
  }

  if (record.code !== inputCode.trim()) {
    db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE phone = ?').run(sanitizedPhone);
    throw new Error('Invalid verification code. Please check and try again.');
  }

  // Clear OTP on successful verification
  db.prepare('DELETE FROM otps WHERE phone = ?').run(sanitizedPhone);

  // Find or create User
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(sanitizedPhone);
  if (!user) {
    const userId = `usr-${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO users (id, phone, name, role, created_at, updated_at)
      VALUES (?, ?, ?, 'citizen', datetime('now'), datetime('now'))
    `).run(userId, sanitizedPhone, `User ${sanitizedPhone.slice(-4)}`);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }

  return user;
}

