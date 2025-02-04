// app.js
const express    = require('express');
const mongoose   = require('mongoose');
const bodyParser = require('body-parser');
const path       = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB (without deprecated options)
mongoose.connect('mongodb://localhost/car_rental')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// =======================
// Mongoose Models
// -----------------------

// Updated Car model with extra reminder fields and custom reminder.
const CarSchema = new mongoose.Schema({
  make:              String,
  model:             String,
  year:              Number,
  mileage:           Number,
  serviceDue:        Date,
  tireChangeDate:    Date,   // new field
  registrationDate:  Date,   // new field
  taxDate:           Date,   // new field
  customReminder: {           // new custom reminder field
    message: String,
    date:    Date
  }
});
const Car = mongoose.model('Car', CarSchema);

// Rental model
const RentalSchema = new mongoose.Schema({
  car:            { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  rentalDate:     Date,
  returnDate:     Date,
  rentalFee:      Number,
  customerName:   String,
  customerReg:    String,
  customerEmail:  String,
  customerNumber: String,
  rentalType:     { type: String, enum: ['Rental', 'Reservation'], default: 'Rental' },
  note:           String,
  rating:         String,
  comment:        String,
  reason:         String,
  active:         { type: Boolean, default: true }
});
const Rental = mongoose.model('Rental', RentalSchema);

// =======================
// API Endpoints
// -----------------------

// ----- Cars endpoints -----
// GET /api/cars - Retrieve all cars
app.get('/api/cars', async (req, res) => {
  try {
    const cars = await Car.find({});
    res.json(cars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cars - Add a new car
app.post('/api/cars', async (req, res) => {
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
app.post('/api/cars/:id/reminders', async (req, res) => {
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

// ----- Rental endpoints -----
// POST /api/rentals - Add a new rental
app.post('/api/rentals', async (req, res) => {
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
app.get('/api/rentals/active', async (req, res) => {
  try {
    const rentals = await Rental.find({ active: true }).populate('car');
    res.json(rentals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching rentals' });
  }
});

// GET /api/rentals - Retrieve all rentals (active and ended), populated with car details
app.get('/api/rentals', async (req, res) => {
  try {
    const rentals = await Rental.find({}).populate('car');
    res.json(rentals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching rentals' });
  }
});

// POST /api/rentals/:id/end - Mark a rental as ended
app.post('/api/rentals/:id/end', async (req, res) => {
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

// -----------------------
// Catch-all Route (for client-side routing)
// -----------------------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// -----------------------
// Start the Server
// -----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
