const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

const AVATAR_COLORS = ['#E8A33D', '#7A9E7E', '#C1666B', '#4C6A92', '#9C6ADE'];

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({ error: 'Username or email is already taken.' });
    }

    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const user = await User.create({
      username,
      email,
      password,
      displayName: displayName || username,
      avatarColor,
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed.', detail: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.', detail: err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: user.toPublicJSON() });
});

module.exports = router;
