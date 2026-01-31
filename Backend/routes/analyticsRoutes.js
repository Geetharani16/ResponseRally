const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getUserAnalytics,
  getUserSessions
} = require('../controllers/analyticsController');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Analytics route is working!' });
});

// Dashboard data
router.get('/dashboard/:userId', getDashboardData);

// User analytics
router.get('/user/:userId', getUserAnalytics);

// User sessions
router.get('/sessions/:userId', getUserSessions);

module.exports = router;