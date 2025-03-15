const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET database stats
router.get('/dbstats', async (req, res) => {
  try {
    const stats = {
      cars: await mongoose.model('Car').countDocuments(),
      rentals: await mongoose.model('Rental').countDocuments(),
      activeRentals: await mongoose.model('Rental').countDocuments({ active: true }),
      dbSize: await mongoose.connection.db.stats().then(stats => stats.dataSize)
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching database stats' });
  }
});

// POST prune old data
router.post('/prune', async (req, res) => {
  try {
    const { olderThan, collections } = req.body;
    const date = new Date();
    date.setDate(date.getDate() - parseInt(olderThan));
    
    const results = {};
    
    if (collections.includes('rentals')) {
      const result = await mongoose.model('Rental').deleteMany({
        active: false,
        returnDate: { $lt: date }
      });
      results.rentals = result.deletedCount;
    }
    
    res.json({ 
      message: 'Database pruned successfully',
      deletedCounts: results 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error pruning database' });
  }
});

module.exports = router; 