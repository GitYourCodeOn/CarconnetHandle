// routes/rentals.js
const express = require('express');
const router = express.Router();
const Rental = require('../models/rentals');

// POST /api/rentals - Add a new rental
router.post('/', async (req, res) => {
  try {
    const {
      car, rentalDate, returnDate, rentalFee,
      customerName, customerReg, customerEmail,
      customerNumber, rentalType, note
    } = req.body;
    const newRental = new Rental({
      car,
      rentalDate,
      returnDate,
      rentalFee,
      customerName,
      customerReg,
      customerEmail,
      customerNumber,
      rentalType,
      note
    });
    await newRental.save();
    res.json({ message: 'Rental added successfully', rental: newRental });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving rental' });
  }
});

// GET /api/rentals/active - Retrieve all active rentals (populated with car details)
router.get('/active', async (req, res) => {
  try {
    const rentals = await Rental.find({ active: true }).populate('car');
    res.json(rentals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching rentals' });
  }
});

// GET /api/rentals - Retrieve all rentals (active and ended), populated with car details
router.get('/', async (req, res) => {
  try {
    const rentals = await Rental.find({}).populate('car');
    res.json(rentals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching rentals' });
  }
});

// POST /api/rentals/:id/end - Mark a rental as ended
router.post('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, reason } = req.body;
    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    rental.rating = rating;
    rental.comment = comment;
    rental.reason = reason;
    rental.active = false;
    await rental.save();
    res.json({ message: 'Rental ended successfully', rental });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error ending rental' });
  }
});

module.exports = router;
