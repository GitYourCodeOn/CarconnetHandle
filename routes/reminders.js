// routes/reminders.js
const express = require('express');
const router = express.Router();
const Reminder = require('../models/reminders');
const Car = require('../models/car');

// GET /api/reminders - Get all reminders with optional filtering
router.get('/', async (req, res) => {
  try {
    const { type, category, completed, carId, startDate, endDate } = req.query;
    
    // Build filter object based on query parameters
    const filter = {};
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (completed !== undefined) filter.completed = completed === 'true';
    if (carId) filter.carId = carId;
    
    // Date range filtering
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    const reminders = await Reminder.find(filter).sort({ date: 1 });
    
    // If reminders are associated with cars, populate car details
    const populatedReminders = await Promise.all(reminders.map(async (reminder) => {
      const reminderObj = reminder.toObject();
      
      if (reminder.carId) {
        try {
          const car = await Car.findById(reminder.carId);
          if (car) {
            reminderObj.carDetails = {
              make: car.make,
              model: car.model,
              year: car.year,
              registration: car.registration
            };
          }
        } catch (err) {
          console.error(`Error fetching car details for reminder ${reminder._id}:`, err);
        }
      }
      
      return reminderObj;
    }));
    
    res.json(populatedReminders);
  } catch (err) {
    console.error('Error fetching reminders:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reminders/upcoming - Get upcoming reminders (next 30 days by default)
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + parseInt(days));
    
    // Instead of querying with the date condition directly which causes errors with invalid dates,
    // fetch all non-completed reminders first
    const allReminders = await Reminder.find({ completed: false }).sort({ date: 1 });
    
    // Filter reminders with valid dates manually
    const validReminders = allReminders.filter(reminder => {
      const reminderDate = new Date(reminder.date);
      return !isNaN(reminderDate.valueOf()) && reminderDate >= now && reminderDate <= endDate;
    });
    
    // Populate car details for car-related reminders
    const populatedReminders = await Promise.all(validReminders.map(async (reminder) => {
      const reminderObj = reminder.toObject();
      
      if (reminder.carId) {
        try {
          const car = await Car.findById(reminder.carId);
          if (car) {
            reminderObj.carDetails = {
              make: car.make,
              model: car.model,
              year: car.year,
              registration: car.registration
            };
          }
        } catch (err) {
          console.error(`Error fetching car details for reminder ${reminder._id}:`, err);
        }
      }
      
      // Calculate days remaining
      reminderObj.daysRemaining = Math.ceil((new Date(reminder.date) - now) / (1000 * 60 * 60 * 24));
      
      return reminderObj;
    }));
    
    res.json(populatedReminders);
  } catch (err) {
    console.error('Error fetching upcoming reminders:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reminders/:id - Get a specific reminder
router.get('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // If reminder is associated with a car, include car details
    let result = reminder.toObject();
    
    if (reminder.carId) {
      try {
        const car = await Car.findById(reminder.carId);
        if (car) {
          result.carDetails = {
            make: car.make,
            model: car.model,
            year: car.year,
            registration: car.registration
          };
        }
      } catch (err) {
        console.error(`Error fetching car details for reminder ${reminder._id}:`, err);
      }
    }
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching reminder:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reminders - Create a new reminder
router.post('/', async (req, res) => {
  try {
    const { title, description, date, type, category, priority, carId, notes } = req.body;
    
    // Validate car ID if provided
    if (carId) {
      const car = await Car.findById(carId);
      if (!car) {
        return res.status(400).json({ error: 'Invalid car ID' });
      }
    }
    
    const newReminder = new Reminder({
      title,
      description,
      date: new Date(date),
      type: type || (carId ? 'car' : 'business'),
      category,
      priority,
      carId,
      notes
    });
    
    await newReminder.save();
    
    res.status(201).json({ 
      message: 'Reminder created successfully', 
      reminder: newReminder 
    });
  } catch (err) {
    console.error('Error creating reminder:', err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/reminders/:id - Update a reminder
router.put('/:id', async (req, res) => {
  try {
    const { title, description, date, type, category, priority, carId, notes, completed } = req.body;
    
    // Validate car ID if provided
    if (carId) {
      const car = await Car.findById(carId);
      if (!car) {
        return res.status(400).json({ error: 'Invalid car ID' });
      }
    }
    
    const reminder = await Reminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Update fields
    if (title) reminder.title = title;
    if (description !== undefined) reminder.description = description;
    if (date) reminder.date = new Date(date);
    if (type) reminder.type = type;
    if (category) reminder.category = category;
    if (priority) reminder.priority = priority;
    if (carId !== undefined) reminder.carId = carId || null;
    if (notes !== undefined) reminder.notes = notes;
    if (completed !== undefined) reminder.completed = completed;
    
    await reminder.save();
    
    res.json({ 
      message: 'Reminder updated successfully', 
      reminder 
    });
  } catch (err) {
    console.error('Error updating reminder:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/reminders/:id - Delete a reminder
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder deleted successfully' });
  } catch (err) {
    console.error('Error deleting reminder:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reminders/:id/complete - Mark a reminder as completed
router.post('/:id/complete', async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    reminder.completed = true;
    await reminder.save();
    
    res.json({ 
      message: 'Reminder marked as completed', 
      reminder 
    });
  } catch (err) {
    console.error('Error completing reminder:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 