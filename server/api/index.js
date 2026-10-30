const app = require('../app');
const connectDB = require('../config/database');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Backend startup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Backend connection failed'
    });
  }
};
