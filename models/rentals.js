// models/Rental.js
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  name: String,
  url: String,
  contentType: String,
  uploadDate: { type: Date, default: Date.now }
});

// Add a dedicated schema for notes
const NoteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: String, default: 'User' },
  timestamp: { type: Date, default: Date.now }
});

const RentalSchema = new mongoose.Schema({
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  rentalDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  rentalFee: Number,
  customerName: String,
  customerReg: String,
  customerEmail: String,
  customerNumber: String,
  rentalType: { type: String, enum: ['Rental', 'Reservation'], default: 'Rental' },
  note: String, // Keep legacy note field for backward compatibility
  notes: [NoteSchema], // New structured notes array
  rating: String,
  comment: String,
  reason: String,
  active: { type: Boolean, default: true },
  clearedFromDashboard: { type: Boolean, default: false },
  documents: [DocumentSchema]
});

module.exports = mongoose.model('Rental', RentalSchema);
