const sessionService = require('../src/services/sessionService');

exports.getDashboardData = async (req, res, next) => {
  try {
    const { userId } = req.params;
    console.log(`\n>>> Fetching dashboard data for user: ${userId} at ${new Date().toISOString()} <<<`);
    
    const dashboardData = await sessionService.getDashboardData(userId);
    
    console.log(`>>> Dashboard data retrieved successfully for user: ${userId}`);
    console.log(`>>> Total conversations: ${dashboardData.overallStats.totalConversations}`);
    console.log(`>>> Total responses: ${dashboardData.overallStats.totalResponses}`);
    console.log(`>>> Provider stats count: ${dashboardData.providerStats.length}\n`);
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message);
    next(error);
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