// models/Car.js
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  name: String,
  url: String,
  contentType: String,
  uploadDate: { type: Date, default: Date.now }
});

const ReminderSchema = new mongoose.Schema({
  type: { type: String, enum: ['service', 'tax', 'insurance', 'tireChange', 'registration', 'custom'] },
  date: Date,
  message: String,
  completed: { type: Boolean, default: false }
});

const CarSchema = new mongoose.Schema({
  make: {
    type: String,
    required: [true, 'Make is required'],
    trim: true,
    minlength: [1, 'Make must be at least 1 character long']
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  mileage: {
    type: Number,
    required: [true, 'Mileage is required'],
    min: [0, 'Mileage cannot be negative']
  },
  registration: String,
  owner: {
    name: String,
    contact: String,
    email: String
  },
  notes: String,
  isRented: {
    type: Boolean,
    default: false
  },
  serviceDue: Date,
  tireChangeDate: Date,
  registrationDate: Date,
  taxDate: Date,
  insuranceDate: Date,
  customReminder: {
    message: String,
    date: Date
  },
  reminders: [ReminderSchema],
  documents: [DocumentSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Car', CarSchema);
