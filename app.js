// app.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Ensure the database connection is initialized
require('./config/database');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const carsRoutes = require('../CarconnetHandle/routes/car');
const rentalsRoutes = require('./routes/rentals');

app.use('/api/cars', carsRoutes);
app.use('/api/rentals', rentalsRoutes);

// Catch-all route (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
