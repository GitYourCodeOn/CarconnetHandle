// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect('mongodb://localhost/car_rental')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// =======================
// Mongoose Models (example: Car, Rental, etc.)
// (Include all your models here; see previous examples.)
// For brevity, here's one sample model:
const CarSchema = new mongoose.Schema({
  make: String,
  model: String,
  year: Number,
  mileage: Number,
  serviceDue: Date
});
const Car = mongoose.model('Car', CarSchema);

// (Include other models and endpoints as needed)

// Serve index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
