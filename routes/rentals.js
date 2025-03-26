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

// Setup a simpler multer middleware for form data without files
const formParser = multer().none();

// POST /api/rentals - Add a new rental with document uploads
router.post('/', upload.array('documents', 10), async (req, res) => {
  try {
    const {
      car, rentalDate, returnDate, rentalFee,
      customerName, customerReg, customerEmail,
      customerNumber, rentalType, note
    } = req.body;
    
    // Check for existing rentals for this car
    const conflictingRental = await Rental.findOne({
      car,
      active: true,
      $or: [
        { 
          rentalDate: { $lt: new Date(returnDate) },
          returnDate: { $gt: new Date(rentalDate) }
        }
      ]
    });

    if (conflictingRental) {
      throw new Error('Car already booked for selected dates');
    }
    
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

// GET /api/rentals/active - Retrieve all active rentals
router.get('/active', async (req, res) => {
  try {
    const rentals = await Rental.find({ 
      active: true,
      returned: { $ne: true }, // Exclude returned rentals
      clearedFromDashboard: { $ne: true } 
    }).populate('car');
    res.json(rentals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching rentals' });
  }
});

// GET /api/rentals - Retrieve all rentals
router.get('/', async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate('car', 'make model year')
      .sort({ rentalDate: -1 })
      .select('-__v')
      .lean(); // Convert to plain JS object
    
    // Add returned status to all rentals
    const processedRentals = rentals.map(rental => ({
      ...rental,
      returned: rental.returned || (!rental.active && rental.returnDate < new Date())
    }));

    res.json(processedRentals);
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
router.post('/:id/notes', formParser, async (req, res) => {
  try {
    const { id } = req.params;
    const { noteContent, author } = req.body;
    
    if (!noteContent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Note content is required' 
      });
    }

    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rental not found' 
      });
    }
    
    // Create new structured note
    const newNote = {
      content: noteContent,
      author: author || 'User',
      timestamp: new Date()
    };
    
    // Initialize notes array if it doesn't exist
    if (!rental.notes) {
      rental.notes = [];
    }
    
    // Add the new note to the beginning of the notes array
    rental.notes.unshift(newNote);
    
    // Also update legacy note field for backward compatibility
    const legacyNote = `[${new Date().toLocaleString()}] ${noteContent}`;
    rental.note = rental.note 
      ? `${legacyNote}\n${rental.note}`
      : legacyNote;
    
    // Save with version control
    try {
      await rental.save();
      res.json({ 
        success: true,
        message: 'Note added successfully', 
        note: newNote
      });
    } catch (saveError) {
      if (saveError.name === 'VersionError') {
        return res.status(409).json({
          success: false,
          message: 'Version conflict - rental was modified by another user'
        });
      }
      throw saveError;
    }
  } catch (err) {
    console.error('Error adding note:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error adding note: ' + err.message 
    });
  }
});

// GET /api/rentals/:id/notes - Get all notes for a rental
router.get('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Fetching notes for rental:', id);
    
    const rental = await Rental.findById(id);
    if (!rental) {
      console.log('Rental not found:', id);
      return res.status(404).json({ 
        success: false,
        message: 'Rental not found' 
      });
    }
    
    // If structured notes exist, return them
    if (rental.notes && rental.notes.length > 0) {
      console.log(`Found ${rental.notes.length} structured notes`);
      return res.json(rental.notes);
    }
    
    // If no structured notes but has legacy note, convert it
    if (rental.note) {
      console.log('Converting legacy notes to structured format');
      // Create structured notes from legacy note
      const legacyNotes = [];
      
      // Try to parse the legacy note (formatted as "[date] content")
      const noteLines = rental.note.split('\n');
      
      noteLines.forEach(line => {
        const match = line.match(/^\[(.*?)\] (.*)/);
        if (match) {
          try {
            const timestamp = new Date(match[1]);
            const content = match[2];
            
            if (!isNaN(timestamp.getTime())) {
              legacyNotes.push({
                content,
                timestamp,
                author: 'System (Migrated)'
              });
              return;
            }
          } catch (e) { /* If parsing fails, fall through to default */ }
        }
        
        // Default case if parsing fails
        legacyNotes.push({
          content: line,
          timestamp: new Date(),
          author: 'System (Migrated)'
        });
      });
      
      return res.json(legacyNotes);
    }
    
    // No notes
    console.log('No notes found for rental:', id);
    return res.json([]);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching notes: ' + err.message 
    });
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

// POST /api/rentals/:id/complete - Complete a rental
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the rental
    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    // Mark as completed
    rental.active = false;
    rental.returnDate = new Date();
    
    // Add a note about completion
    if (Array.isArray(rental.notes)) {
      rental.notes.push({
        content: 'Rental completed early by user',
        date: new Date()
      });
    }
    
    // Save the updated rental
    await rental.save();
    
    res.json({
      success: true,
      message: 'Rental completed successfully'
    });
    
  } catch (err) {
    console.error('Error completing rental:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rentals/:id/return - Mark rental as returned
router.put('/:id/return', async (req, res) => {
    try {
        const rental = await Rental.findById(req.params.id);
        if (!rental) {
            return res.status(404).json({ 
                success: false, 
                message: 'Rental not found' 
            });
        }

        // Permanent status changes
        rental.returned = true;
        rental.active = false;
        rental.returnDate = new Date();
        rental.rating = req.body.rating || 'good';
        rental.comment = req.body.comment || '';
        
        // Add permanent return note
        const returnNote = {
            content: `Vehicle returned ${req.body.comment ? 'with notes' : ''}`,
            author: 'System',
            timestamp: new Date()
        };
        
        if (!rental.notes) rental.notes = [];
        rental.notes.unshift(returnNote);

        // Update car status
        if (rental.car) {
            await Car.findByIdAndUpdate(rental.car, { 
                isRented: false,
                lastRented: rental.returnDate 
            });
        }

        const updatedRental = await rental.save();
        
        res.json({
            success: true,
            message: 'Rental marked as returned successfully',
            rental: updatedRental
        });
    } catch (err) {
        console.error('Error processing return:', err);
        res.status(500).json({
            success: false,
            message: 'Server error processing return',
            error: err.message
        });
    }
});

module.exports = router;
