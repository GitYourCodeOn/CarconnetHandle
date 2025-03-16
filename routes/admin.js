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

// POST reset database
router.post('/reset-database', async (req, res) => {
  try {
    // For added security, you might want to check for an admin password
    // if (req.body.adminPassword !== process.env.ADMIN_PASSWORD) {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }
    
    console.log('Performing database reset via API endpoint');
    
    // Delete all records from rentals and reminders collections
    const [rentalsResult, remindersResult] = await Promise.all([
      mongoose.model('Rental').deleteMany({}),
      mongoose.model('Reminder').deleteMany({})
    ]);
    
    console.log(`Deleted ${rentalsResult.deletedCount} rentals and ${remindersResult.deletedCount} reminders`);
    
    res.json({
      success: true,
      message: 'Database reset successfully',
      deletedCounts: {
        rentals: rentalsResult.deletedCount,
        reminders: remindersResult.deletedCount
      }
    });
  } catch (err) {
    console.error('Error resetting database:', err);
    res.status(500).json({ error: 'Failed to reset database', details: err.message });
  }
});

module.exports = router; 