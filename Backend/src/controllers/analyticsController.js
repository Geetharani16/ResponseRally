const sessionService = require('../services/sessionService');

exports.getDashboardData = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        console.log(`\n>>> Analytics request for user: ${userId} at ${new Date().toISOString()} <<<`);

        const dashboardData = await sessionService.getDashboardData(userId);

        console.log(`>>> Dashboard data generated for user: ${userId}`);
        console.log(`>>> Total conversations: ${dashboardData.overallStats.totalConversations}`);

        res.json(dashboardData);
    } catch (error) {
        console.error('Error in getDashboardData:', error);
        next(error);
    }
};

exports.getUserAnalytics = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const analytics = await sessionService.getUserAnalytics(userId);
        res.json(analytics || { stats: 'No data available' });
    } catch (error) {
        console.error('Error in getUserAnalytics:', error);
        next(error);
    }
};
