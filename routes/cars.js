const express = require('express');
const router = express.Router();
const Car = require('../models/car');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads/cars');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'car-doc-' + uniqueSuffix + ext);
  }
});

// Filter to only allow image files and PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image and PDF files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET /api/cars - Retrieve all cars
router.get('/', async (req, res) => {
  try {
    const cars = await Car.find().sort({ make: 1, model: 1 });
    res.json(cars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching cars' });
  }
});

// GET /api/cars/available - Retrieve all available cars
router.get('/available', async (req, res) => {
  try {
    const cars = await Car.find({ isRented: false }).sort({ make: 1, model: 1 });
    res.json(cars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching available cars' });
  }
});

// GET /api/cars/:id - Retrieve a specific car
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json(car);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching car' });
  }
});

// POST /api/cars - Add a new car with document uploads
router.post('/', upload.array('documents', 10), async (req, res) => {
  try {
    const {
      make, model, year, mileage, registration,
      ownerName, ownerContact, ownerEmail, notes,
      serviceDue, taxDate, insuranceDate, tireChangeDate, registrationDate
    } = req.body;
    
    // Process uploaded documents if any
    const documents = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        documents.push({
          name: file.originalname,
          url: `/uploads/cars/${file.filename}`,
          contentType: file.mimetype
        });
      });
    }
    
    // Create reminders array based on provided dates - only if dates are provided
    const reminders = [];
    
    if (serviceDue) {
      reminders.push({
        type: 'service',
        date: new Date(serviceDue),
        message: `Service due for ${make} ${model} (${registration || year})`
      });
    }
    
    if (taxDate) {
      reminders.push({
        type: 'tax',
        date: new Date(taxDate),
        message: `Tax renewal due for ${make} ${model} (${registration || year})`
      });
    }
    
    if (insuranceDate) {
      reminders.push({
        type: 'insurance',
        date: new Date(insuranceDate),
        message: `Insurance renewal due for ${make} ${model} (${registration || year})`
      });
    }
    
    if (tireChangeDate) {
      reminders.push({
        type: 'tireChange',
        date: new Date(tireChangeDate),
        message: `Tire change due for ${make} ${model} (${registration || year})`
      });
    }
    
    if (registrationDate) {
      reminders.push({
        type: 'registration',
        date: new Date(registrationDate),
        message: `Registration renewal due for ${make} ${model} (${registration || year})`
      });
    }
    
    const newCar = new Car({
      make,
      model,
      year: year ? parseInt(year) : undefined,
      mileage: mileage ? parseInt(mileage) : undefined,
      registration,
      owner: {
        name: ownerName,
        contact: ownerContact,
        email: ownerEmail
      },
      notes,
      serviceDue: serviceDue ? new Date(serviceDue) : undefined,
      taxDate: taxDate ? new Date(taxDate) : undefined,
      insuranceDate: insuranceDate ? new Date(insuranceDate) : undefined,
      tireChangeDate: tireChangeDate ? new Date(tireChangeDate) : undefined,
      registrationDate: registrationDate ? new Date(registrationDate) : undefined,
      documents,
      reminders
    });
    
    await newCar.save();
    res.status(201).json({ message: 'Car added successfully', car: newCar });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/cars/:id - Update a car
router.put('/:id', upload.array('documents', 10), async (req, res) => {
  try {
    const {
      make, model, year, mileage, registration,
      ownerName, ownerContact, ownerEmail, notes,
      serviceDue, taxDate, insuranceDate, tireChangeDate, registrationDate
    } = req.body;
    
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    // Process uploaded documents if any
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        car.documents.push({
          name: file.originalname,
          url: `/uploads/cars/${file.filename}`,
          contentType: file.mimetype
        });
      });
    }
    
    // Update car fields
    car.make = make || car.make;
    car.model = model || car.model;
    car.year = year ? parseInt(year) : car.year;
    car.mileage = mileage ? parseInt(mileage) : car.mileage;
    car.registration = registration || car.registration;
    car.notes = notes || car.notes;
    
    // Update owner information
    car.owner = car.owner || {};
    car.owner.name = ownerName || car.owner.name;
    car.owner.contact = ownerContact || car.owner.contact;
    car.owner.email = ownerEmail || car.owner.email;
    
    // Update dates
    if (serviceDue) car.serviceDue = new Date(serviceDue);
    if (taxDate) car.taxDate = new Date(taxDate);
    if (insuranceDate) car.insuranceDate = new Date(insuranceDate);
    if (tireChangeDate) car.tireChangeDate = new Date(tireChangeDate);
    if (registrationDate) car.registrationDate = new Date(registrationDate);
    
    // Update reminders based on new dates
    // First, remove any existing reminders that match the types we're updating
    const reminderTypes = [];
    if (serviceDue) reminderTypes.push('service');
    if (taxDate) reminderTypes.push('tax');
    if (insuranceDate) reminderTypes.push('insurance');
    if (tireChangeDate) reminderTypes.push('tireChange');
    if (registrationDate) reminderTypes.push('registration');
    
    car.reminders = car.reminders.filter(reminder => !reminderTypes.includes(reminder.type));
    
    // Add new reminders
    if (serviceDue) {
      car.reminders.push({
        type: 'service',
        date: new Date(serviceDue),
        message: `Service due for ${car.make} ${car.model} (${car.registration || car.year})`
      });
    }
    
    if (taxDate) {
      car.reminders.push({
        type: 'tax',
        date: new Date(taxDate),
        message: `Tax renewal due for ${car.make} ${car.model} (${car.registration || car.year})`
      });
    }
    
    if (insuranceDate) {
      car.reminders.push({
        type: 'insurance',
        date: new Date(insuranceDate),
        message: `Insurance renewal due for ${car.make} ${car.model} (${car.registration || car.year})`
      });
    }
    
    if (tireChangeDate) {
      car.reminders.push({
        type: 'tireChange',
        date: new Date(tireChangeDate),
        message: `Tire change due for ${car.make} ${car.model} (${car.registration || car.year})`
      });
    }
    
    if (registrationDate) {
      car.reminders.push({
        type: 'registration',
        date: new Date(registrationDate),
        message: `Registration renewal due for ${car.make} ${car.model} (${car.registration || car.year})`
      });
    }
    
    await car.save();
    res.json({ message: 'Car updated successfully', car });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/cars/:id/documents - Add documents to a car
router.post('/:id/documents', upload.array('documents', 10), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    // Process uploaded documents
    const newDocuments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        newDocuments.push({
          name: file.originalname,
          url: `/uploads/cars/${file.filename}`,
          contentType: file.mimetype
        });
      });
      
      // Add new documents to the car
      car.documents = car.documents || [];
      car.documents.push(...newDocuments);
      await car.save();
      
      res.json({ 
        message: 'Documents added successfully', 
        documents: newDocuments 
      });
    } else {
      res.status(400).json({ error: 'No documents uploaded' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cars/:id/documents/:docId - Delete a specific document
router.delete('/:id/documents/:docId', async (req, res) => {
  try {
    const { id, docId } = req.params;
    const car = await Car.findById(id);
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    // Find the document
    const docIndex = car.documents.findIndex(doc => doc._id.toString() === docId);
    
    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Get the document URL to delete the file
    const docUrl = car.documents[docIndex].url;
    const filePath = path.join(__dirname, '../public', docUrl);
    
    // Remove from array
    car.documents.splice(docIndex, 1);
    await car.save();
    
    // Delete the file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cars/:id/reminders - Add a custom reminder
router.post('/:id/reminders', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, date, message } = req.body;
    
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    // Add the new reminder
    car.reminders.push({
      type: type || 'custom',
      date: new Date(date),
      message
    });
    
    await car.save();
    
    res.json({ 
      message: 'Reminder added successfully', 
      car 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cars/:id/reminders/:reminderId - Update a reminder
router.put('/:id/reminders/:reminderId', async (req, res) => {
  try {
    const { id, reminderId } = req.params;
    const { date, message, completed } = req.body;
    
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    // Find the reminder
    const reminder = car.reminders.id(reminderId);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Update reminder fields
    if (date) reminder.date = new Date(date);
    if (message) reminder.message = message;
    if (completed !== undefined) reminder.completed = completed;
    
    await car.save();
    
    res.json({ 
      message: 'Reminder updated successfully', 
      car 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cars/:id/reminders/:reminderId - Delete a reminder
router.delete('/:id/reminders/:reminderId', async (req, res) => {
  try {
    const { id, reminderId } = req.params;
    const car = await Car.findById(id);
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    // Find and remove the reminder
    const reminderIndex = car.reminders.findIndex(r => r._id.toString() === reminderId);
    
    if (reminderIndex === -1) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    car.reminders.splice(reminderIndex, 1);
    await car.save();
    
    res.json({ message: 'Reminder deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cars/:id - Delete a car
router.delete('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    // Delete all associated documents
    if (car.documents && car.documents.length > 0) {
      car.documents.forEach(doc => {
        const filePath = path.join(__dirname, '../public', doc.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: 'Car deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting car' });
  }
});

// GET /api/cars/reminders/upcoming - Get all upcoming reminders
router.get('/reminders/upcoming', async (req, res) => {
  try {
    const cars = await Car.find();
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    const upcomingReminders = [];
    
    cars.forEach(car => {
      // Check standard date fields
      const dateFields = [
        { type: 'service', date: car.serviceDue },
        { type: 'tax', date: car.taxDate },
        { type: 'insurance', date: car.insuranceDate },
        { type: 'tireChange', date: car.tireChangeDate },
        { type: 'registration', date: car.registrationDate }
      ];
      
      dateFields.forEach(field => {
        // Check if the date is valid before using it
        const fieldDate = field.date ? new Date(field.date) : null;
        if (fieldDate && !isNaN(fieldDate.valueOf()) && fieldDate > now && fieldDate < thirtyDaysFromNow) {
          upcomingReminders.push({
            carId: car._id,
            carInfo: `${car.make} ${car.model} (${car.registration || car.year})`,
            type: field.type,
            date: fieldDate,
            daysRemaining: Math.ceil((fieldDate - now) / (1000 * 60 * 60 * 24))
          });
        }
      });
      
      // Check reminders array
      if (car.reminders && car.reminders.length > 0) {
        car.reminders.forEach(reminder => {
          // Check if the date is valid before using it
          const reminderDate = reminder.date ? new Date(reminder.date) : null;
          if (!reminder.completed && reminderDate && !isNaN(reminderDate.valueOf()) && 
              reminderDate > now && reminderDate < thirtyDaysFromNow) {
            upcomingReminders.push({
              carId: car._id,
              carInfo: `${car.make} ${car.model} (${car.registration || car.year})`,
              type: reminder.type,
              message: reminder.message,
              date: reminderDate,
              daysRemaining: Math.ceil((reminderDate - now) / (1000 * 60 * 60 * 24))
            });
          }
        });
      }
    });
    
    // Sort by date (closest first)
    upcomingReminders.sort((a, b) => a.date - b.date);
    
    res.json(upcomingReminders);
  } catch (err) {
    console.error('Error fetching upcoming reminders:', err);
    res.status(500).json({ error: 'Error fetching reminders' });
  }
});

module.exports = router; 