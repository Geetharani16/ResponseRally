const express = require('express');
const router = express.Router();

// Import organized route files
const sessionRoutes = require('./sessions');
const responseRoutes = require('./responses');
const promptRoutes = require('./prompts');
const analyticsRoutes = require('./analyticsRoutes');


// Mount routes at appropriate paths
router.use('/session', sessionRoutes);
router.use('/prompt', promptRoutes);
router.use('/responses', responseRoutes); // Mount response routes under responses for dedicated endpoints
router.use('/session', responseRoutes); // Keep for backward compatibility
router.use('/analytics', analyticsRoutes);


module.exports = router;