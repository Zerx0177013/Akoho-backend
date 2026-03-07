// backend/app.js
const express = require('express');
const cors = require('cors');
const poolPromise = require('./db');

// Import all routes
const raceRoutes = require('./routes/raceRoutes');
const lotRoutes = require('./routes/lotRoutes');
const situationRoutes = require('./routes/situationRoutes');
const grossissementRoutes = require('./routes/grossissementRoutes');
const eclosionRoutes = require('./routes/eclosionRoutes');
const situationFinanciereRoutes = require('./routes/situationFinanciereRoutes');
const app = express();

// Middleware
app.use(cors());                  // Allow requests from Angular (frontend)
app.use(express.json());          // Parse JSON from requests

// Register routes
app.use('/api/races', raceRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/situations', situationRoutes);
app.use('/api/grossissements', grossissementRoutes);
app.use('/api/eclosions', eclosionRoutes);
app.use('/api/situations-financieres', situationFinanciereRoutes);

// Health check route (optional)
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});