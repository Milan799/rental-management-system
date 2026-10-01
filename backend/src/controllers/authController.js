const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'aerorent_super_secret_jwt_key_2026';

// Fixed dummy hash for constant-time comparison against timing attacks
const DUMMY_HASH = '$2b$10$wK1cW5FmEHzzF9fI9pYlIuR7E5rQ5fI5wK1cW5FmEHzzF9fI9pYlI';

// In-memory Brute Force Protection (IP + Email tracking)
const loginAttempts = new Map(); // key -> { count: number, lockUntil: number, firstAttempt: number }

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes lockout

function checkRateLimit(key) {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) return { allowed: true };

  if (record.lockUntil && record.lockUntil > now) {
    const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return { 
      allowed: false, 
      remainingSeconds,
      message: `Security Lockout: Too many failed login attempts. Please wait ${remainingSeconds} seconds before trying again.` 
    };
  }

  // Reset if window has elapsed
  if (now - record.firstAttempt > LOCKOUT_WINDOW_MS) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, firstAttempt: now, lockUntil: 0 };
  record.count += 1;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_WINDOW_MS;
  }

  loginAttempts.set(key, record);
}

function clearRateLimit(key) {
  loginAttempts.delete(key);
}

/**
 * Handle Admin / Manager Login with Double Layer Security
 * (Rate limiting + Timing attack defense + Input sanitization + Bcrypt + JWT)
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // 1. Input presence & length validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid payload type.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail.length > 100 || cleanPassword.length > 100) {
      return res.status(400).json({ success: false, message: 'Input exceeds maximum allowed length.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email format.' });
    }

    // 2. Check Brute-Force Rate Limiting (Per IP & Per Email)
    const rateLimitKey = `${clientIp}_${cleanEmail}`;
    const rateStatus = checkRateLimit(rateLimitKey);
    if (!rateStatus.allowed) {
      return res.status(429).json({
        success: false,
        message: rateStatus.message,
        retryAfter: rateStatus.remainingSeconds
      });
    }

    // 3. Query MySQL users table
    let user = null;
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
      if (rows && rows.length > 0) {
        user = rows[0];
      }
    } catch (dbErr) {
      console.warn('Database query failed or users table not created yet:', dbErr.message);
    }

    // Default Fallback Admin if DB not yet migrated
    if (!user && cleanEmail === 'admin@aerorent.com') {
      const defaultHash = '$2b$10$mpyyVTje6l8NzRwDqSs0o.xruU.c2dj25k77Qj67C7EbzdbNsDaVu'; // 'admin123'
      user = {
        id: 1,
        name: 'Property Admin',
        email: 'admin@aerorent.com',
        password_hash: defaultHash,
        role: 'ADMIN'
      };
    }

    // 4. Timing attack defense: Run bcrypt compare even if user not found
    if (!user) {
      await bcrypt.compare(cleanPassword, DUMMY_HASH);
      recordFailedAttempt(rateLimitKey);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.'
      });
    }

    // 5. Verify bcrypt password
    const isPasswordValid = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!isPasswordValid) {
      recordFailedAttempt(rateLimitKey);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.'
      });
    }

    // 6. Login Successful - Reset rate limiter
    clearRateLimit(rateLimitKey);

    // 7. Sign JWT token with strict algorithm & 7-day expiration
    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        authTime: Date.now()
      },
      JWT_SECRET,
      { 
        expiresIn: '7d',
        algorithm: 'HS256',
        issuer: 'AeroRent Property Suite'
      }
    );

    res.json({
      success: true,
      message: 'Login successful! Security verified.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during secure authentication' });
  }
};

/**
 * Verify current session token
 */
exports.getMe = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No authorization token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    res.json({ success: true, data: { user: decoded } });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};
