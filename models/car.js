// models/Car.js
const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
  make: String,
  model: String,
  year: Number,
  mileage: Number,
  serviceDue: Date,
  tireChangeDate: Date,    // New field
  registrationDate: Date,  // New field
  taxDate: Date,           // New field
  customReminder: {        // New custom reminder field
    message: String,
    date: Date
  }
});

module.exports = mongoose.model('Car', CarSchema);
