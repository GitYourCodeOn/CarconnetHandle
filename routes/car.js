// routes/cars.js
const express = require('express');
const router = express.Router();
const Car = require('../models/car')

// GET /api/cars - Retrieve all cars
router.get('/', async (req, res) => {
  try {
    const cars = await Car.find({});
    res.json(cars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cars - Add a new car
router.post('/', async (req, res) => {
  try {
    const { make, model, year, mileage, serviceDue } = req.body;
    const newCar = new Car({ make, model, year, mileage, serviceDue });
    await newCar.save();
    res.json({ message: 'Car added successfully', car: newCar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving car' });
  }
});

// POST /api/cars/:id/reminders - Update reminder dates for a specific car
router.post('/:id/reminders', async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceDue, tireChangeDate, registrationDate, taxDate, customReminderMessage, customReminderDate } = req.body;
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    if (serviceDue) car.serviceDue = new Date(serviceDue);
    if (tireChangeDate) car.tireChangeDate = new Date(tireChangeDate);
    if (registrationDate) car.registrationDate = new Date(registrationDate);
    if (taxDate) car.taxDate = new Date(taxDate);
    if (customReminderMessage) {
      if (!car.customReminder) car.customReminder = {};
      car.customReminder.message = customReminderMessage;
    }
    if (customReminderDate) {
      if (!car.customReminder) car.customReminder = {};
      car.customReminder.date = new Date(customReminderDate);
    }
    await car.save();
    res.json({ message: 'Reminders updated successfully', car });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating reminders' });
  }
});

module.exports = router;
