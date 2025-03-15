// routes/rentals.js
const express = require('express');
const router = express.Router();
const Rental = require('../models/rentals');
const Car = require('../models/car');

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
    
    // Update car status
    if (newRental.car) {
      await Car.findByIdAndUpdate(newRental.car, { isRented: true });
    }
    
    res.status(201).json({ message: 'Rental added successfully', rental: newRental });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/rentals/active - Retrieve all active rentals (populated with car details)
router.get('/active', async (req, res) => {
  try {
    // Only return active rentals that haven't been cleared from dashboard
    const rentals = await Rental.find({ 
      active: true,
      clearedFromDashboard: { $ne: true } 
    }).populate('car');
    res.json(rentals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching rentals' });
  }
});

// GET /api/rentals - Retrieve all rentals (active and ended), populated with car details
router.get('/', async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate('car', 'make model')
      .sort({ rentalDate: -1 });
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
    
    // Update car status
    if (rental.car) {
      await Car.findByIdAndUpdate(rental.car, { isRented: false });
    }
    
    res.json({ message: 'Rental ended successfully', rental });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rentals/:id/clear - Mark a rental as cleared from dashboard (without deleting)
router.post('/:id/clear', async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id);
    
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    // Mark the rental as cleared from dashboard
    rental.clearedFromDashboard = true;
    await rental.save();
    
    res.json({ message: 'Rental cleared from dashboard successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rentals/:id/extend - Extend a rental's return date
router.post('/:id/extend', async (req, res) => {
  try {
    const { id } = req.params;
    const { newReturnDate, reason, additionalFee } = req.body;
    
    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    // Update the return date
    rental.returnDate = new Date(newReturnDate);
    
    // Add extension details to notes
    const extensionNote = `Extended: ${reason}. Additional fee: ${additionalFee}`;
    rental.note = rental.note 
      ? `${rental.note}\n${extensionNote}` 
      : extensionNote;
    
    // If rental was completed, reactivate it
    if (!rental.active) {
      rental.active = true;
      
      // Update car status
      if (rental.car) {
        await Car.findByIdAndUpdate(rental.car, { isRented: true });
      }
    }
    
    // If it was cleared from dashboard, make it visible again
    if (rental.clearedFromDashboard) {
      rental.clearedFromDashboard = false;
    }
    
    await rental.save();
    
    res.json({ 
      message: 'Rental extended successfully', 
      rental 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rentals/:id/notes - Add notes to a rental
router.post('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { noteContent } = req.body;
    
    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    // Add the new note to existing notes
    const newNote = `[${new Date().toLocaleString()}] ${noteContent}`;
    rental.note = rental.note 
      ? `${rental.note}\n${newNote}` 
      : newNote;
    
    await rental.save();
    
    res.json({ 
      message: 'Notes added successfully', 
      rental 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rentals/:id - Delete a rental (alternative to clear)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id);
    
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    // Delete the rental
    await Rental.findByIdAndDelete(id);
    
    res.json({ message: 'Rental deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
