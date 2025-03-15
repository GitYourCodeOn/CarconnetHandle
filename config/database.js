// config/database.js
const mongoose = require('mongoose');
require('dotenv').config();

// Fix for strictQuery deprecation warning
mongoose.set('strictQuery', false);

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car_rental';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Add these options for persistence
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.error('MongoDB URI:', MONGO_URI);
    process.exit(1);
  }
};

// Handle connection errors after initial connection
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

module.exports = connectDB;
