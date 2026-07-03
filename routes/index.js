const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');

router.use('/auth', authRoutes);

// Simple health check for uptime monitors / load balancers
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'MPTest API is healthy', data: { uptime: process.uptime() } });
});

module.exports = router;
