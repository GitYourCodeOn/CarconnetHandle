// models/Rental.js
const mongoose = require('mongoose');

const RentalSchema = new mongoose.Schema({
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  rentalDate: Date,
  returnDate: Date,
  rentalFee: Number,
  customerName: String,
  customerReg: String,
  customerEmail: String,
  customerNumber: String,
  rentalType: { type: String, enum: ['Rental', 'Reservation'], default: 'Rental' },
  note: String,
  rating: String,
  comment: String,
  reason: String,
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Rental', RentalSchema);
