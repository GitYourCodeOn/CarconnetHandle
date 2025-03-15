// routes/rentals.js
const express = require('express');
const router = express.Router();
const Rental = require('../models/rentals');
const Car = require('../models/car');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads');
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
    cb(null, 'document-' + uniqueSuffix + ext);
  }
});

// Filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// POST /api/rentals - Add a new rental with document uploads
router.post('/', upload.array('documents', 10), async (req, res) => {
  try {
    const {
      car, rentalDate, returnDate, rentalFee,
      customerName, customerReg, customerEmail,
      customerNumber, rentalType, note
    } = req.body;
    
    // Process uploaded documents if any
    const documents = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        documents.push({
          name: file.originalname,
          url: `/uploads/${file.filename}`,
          contentType: file.mimetype
        });
      });
    }
    
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
      note,
      documents
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

// GET /api/rentals/:id/documents - Get documents for a specific rental
router.get('/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id);
    
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    res.json(rental.documents || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rentals/:id/documents - Add documents to an existing rental
router.post('/:id/documents', upload.array('documents', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id);
    
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    // Process uploaded documents
    const newDocuments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        newDocuments.push({
          name: file.originalname,
          url: `/uploads/${file.filename}`,
          contentType: file.mimetype
        });
      });
      
      // Add new documents to the rental
      rental.documents = rental.documents || [];
      rental.documents.push(...newDocuments);
      await rental.save();
      
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

// DELETE /api/rentals/:id/documents/:docId - Delete a specific document
router.delete('/:id/documents/:docId', async (req, res) => {
  try {
    const { id, docId } = req.params;
    const rental = await Rental.findById(id);
    
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    // Find the document
    const docIndex = rental.documents.findIndex(doc => doc._id.toString() === docId);
    
    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Get the document URL to delete the file
    const docUrl = rental.documents[docIndex].url;
    const filePath = path.join(__dirname, '../public', docUrl);
    
    // Remove from array
    rental.documents.splice(docIndex, 1);
    await rental.save();
    
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
      .populate('car', 'make model year')
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
