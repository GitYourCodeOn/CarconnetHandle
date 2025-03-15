const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Reminder title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Reminder date is required']
  },
  type: {
    type: String,
    enum: ['car', 'business', 'other'],
    default: 'business'
  },
  category: {
    type: String,
    enum: ['service', 'tax', 'insurance', 'tireChange', 'registration', 'meeting', 'payment', 'custom'],
    default: 'custom'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: false
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

ReminderSchema.pre('save', function(next) {
  if (isNaN(this.date.valueOf())) {
    return next(new Error('Invalid date provided for reminder.'));
  }
  next();
});

module.exports = mongoose.model('Reminder', ReminderSchema); 