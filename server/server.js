/**
 * server.js
 * Entry point. Connects to MongoDB then starts the HTTP server.
 * 
 * Start with:  npm run dev   (development, with auto-restart)
 *              npm start     (production)
 */

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 SVMS Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown — important for production deployments
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Crash safety — log but don't swallow uncaught errors
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err);
    server.close(() => process.exit(1));
  });
};

startServer();

