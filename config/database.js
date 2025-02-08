// config/database.js
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost/car_rental'; // You can also use an environment variable

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = mongoose;
