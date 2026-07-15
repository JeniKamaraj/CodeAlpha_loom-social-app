require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');

const app = express();

app.use(cors());
app.use(express.json());

// Serve the vanilla frontend directly from Express so the whole app
// runs from a single server during development.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Fallback 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] Loom API running on port ${PORT}`));
});
