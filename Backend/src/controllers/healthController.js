exports.healthCheck = async (req, res, next) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`\n>>> Health check requested at ${timestamp} <<<`);
    console.log(`>>> Server status: OK`);
    console.log(`>>> Timestamp: ${timestamp}\n`);
    
    res.json({ 
      status: 'OK', 
      timestamp: timestamp
    });
  } catch (error) {
    console.error('Health check error:', error.message);
    next(error);
  }
};