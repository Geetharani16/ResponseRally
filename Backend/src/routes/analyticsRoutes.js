const express = require('express');
const router = express.Router();

// Placeholder route for analytics
router.get('/', (req, res) => {
  res.json({ message: 'Analytics endpoint' });
});

module.exports = router;