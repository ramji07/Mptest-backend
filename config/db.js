const mongoose = require('mongoose');
require("dotenv").config();

/**
 * Connects to MongoDB using Mongoose.
 * Exits process on failure so the app never runs without a DB connection.
 */
const connectDB = async () => {
  try {
    // console.log(process.env.MONGO_URI);

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`[DB] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[DB] Connection error: ${err.message}`);
    });


    

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected');
    });
  } catch (error) {
    console.error(`[DB] Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
