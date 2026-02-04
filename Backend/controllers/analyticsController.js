const sessionService = require('../src/services/sessionService');

exports.getDashboardData = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.warn(`Invalid userId provided: ${userId}`);
      return res.status(400).json({ 
        error: 'Invalid user ID', 
        message: 'A valid user ID is required' 
      });
    }
    
    console.log(`\n=== Dashboard Data Request Debug ===`);
    console.log(`Received userId: ${userId}`);
    console.log(`Type of userId: ${typeof userId}`);
    console.log(`UserId length: ${userId.length}`);
    console.log(`=====================================\n`);
    
    console.log(`\n=== Dashboard Data Request ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`================================\n`);
    
    const dashboardData = await sessionService.getDashboardData(userId);
    
    // Validate the returned data structure
    if (!dashboardData || typeof dashboardData !== 'object') {
      throw new Error('Invalid data structure returned from session service');
    }
    
    console.log(`\n=== Dashboard Data Response ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Total Conversations: ${dashboardData.overallStats?.totalConversations || 0}`);
    console.log(`Total Responses: ${dashboardData.overallStats?.totalResponses || 0}`);
    console.log(`Provider Stats Count: ${dashboardData.providerStats?.length || 0}`);
    console.log(`Performance Trends Count: ${dashboardData.performanceTrends?.length || 0}`);
    console.log(`================================\n`);
    
    // Add metadata to response
    const responseWithMetadata = {
      ...dashboardData,
      metadata: {
        userId,
        timestamp: new Date().toISOString(),
        dataFreshness: 'real-time'
      }
    };
    
    res.json(responseWithMetadata);
  } catch (error) {
    console.error(`\n=== Dashboard Data Error ===`);
    console.error(`User ID: ${req.params.userId}`);
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error(`===============================\n`);
    
    // Return structured error response
    return res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message,
      userId: req.params.userId,
      timestamp: new Date().toISOString()
    });
  }
};

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.params;
    console.log(`\n>>> Fetching user analytics for: ${userId} at ${new Date().toISOString()} <<<`);
    
    const analytics = await sessionService.getUserAnalytics(userId);
    
    console.log(`>>> User analytics retrieved successfully for: ${userId}\n`);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching user analytics:', error.message);
    next(error);
  }
};

exports.getUserSessions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    console.log(`\n>>> Fetching sessions for user: ${userId} at ${new Date().toISOString()} <<<`);
    
    const sessions = await sessionService.getUserSessions(userId);
    
    console.log(`>>> Retrieved ${sessions.length} sessions for user: ${userId}\n`);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching user sessions:', error.message);
    next(error);
  }
};