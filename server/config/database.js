/**
 * database.js
 * Handles MongoDB connection using Mongoose.
 *
 * DNS FIX: The system stub resolver on some environments does not support
 * SRV queries required by mongodb+srv:// URIs. We override Node's DNS
 * servers to use Google Public DNS (8.8.8.8) before connecting, so Atlas
 * SRV lookups always succeed. This only affects DNS queries in this process.
 */

const mongoose = require('mongoose');
const dns      = require('dns');

// Use public DNS resolvers that support SRV records.
// System stub resolvers (127.0.0.53) often reject SRV queries.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('FATAL: MONGODB_URI is not set in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
