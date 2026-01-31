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
router.use('/session', responseRoutes); // Mount response routes under session since they use :sessionId in their paths
router.use('/analytics', analyticsRoutes);


module.exports = router;