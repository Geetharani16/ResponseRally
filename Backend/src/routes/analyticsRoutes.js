const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Dashboard data endpoint
router.get('/dashboard/:userId', analyticsController.getDashboardData);

// User analytics endpoint
router.get('/user/:userId', analyticsController.getUserAnalytics);

module.exports = router;