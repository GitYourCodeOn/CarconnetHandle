// Script to fix invalid dates in reminders
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/carconnect', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Load models
const Reminder = require('../models/reminders');
const Car = require('../models/car');

// Fix invalid dates in standalone reminders
const fixStandaloneReminders = async () => {
  try {
    // Find all reminders
    const reminders = await Reminder.find({});
    let fixedCount = 0;
    
    for (const reminder of reminders) {
      const reminderDate = new Date(reminder.date);
      
      // Check if date is invalid
      if (isNaN(reminderDate.valueOf())) {
        console.log(`Found reminder with invalid date: ${reminder._id}, title: ${reminder.title}`);
        
        // Option 1: Set to a default date (today + 30 days)
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 30);
        
        reminder.date = defaultDate;
        await reminder.save();
        
        console.log(`  Fixed by setting date to ${defaultDate.toISOString()}`);
        fixedCount++;
        
        // Option 2: Remove the reminder (uncomment to use this option instead)
        // await Reminder.findByIdAndDelete(reminder._id);
        // console.log(`  Removed reminder ${reminder._id}`);
        // fixedCount++;
      }
    }
    
    console.log(`Fixed ${fixedCount} standalone reminders with invalid dates`);
  } catch (err) {
    console.error('Error fixing standalone reminders:', err);
  }
};

// Fix invalid dates in car reminders
const fixCarReminders = async () => {
  try {
    // Find all cars
    const cars = await Car.find({});
    let fixedCount = 0;
    let carsUpdated = 0;
    
    for (const car of cars) {
      let needsUpdate = false;
      
      // Check standard date fields
      const dateFields = [
        { field: 'serviceDue', name: 'Service Due' },
        { field: 'taxDate', name: 'Tax Date' },
        { field: 'insuranceDate', name: 'Insurance Date' },
        { field: 'tireChangeDate', name: 'Tire Change Date' },
        { field: 'registrationDate', name: 'Registration Date' }
      ];
      
      for (const field of dateFields) {
        if (car[field.field]) {
          const fieldDate = new Date(car[field.field]);
          
          if (isNaN(fieldDate.valueOf())) {
            console.log(`Found car ${car._id} (${car.make} ${car.model}) with invalid ${field.name}`);
            
            // Set to null (remove the date)
            car[field.field] = null;
            needsUpdate = true;
            fixedCount++;
            
            console.log(`  Fixed by removing the invalid date`);
          }
        }
      }
      
      // Check embedded reminders
      if (car.reminders && car.reminders.length > 0) {
        const validReminders = [];
        
        for (const reminder of car.reminders) {
          const reminderDate = new Date(reminder.date);
          
          if (isNaN(reminderDate.valueOf())) {
            console.log(`Found car ${car._id} (${car.make} ${car.model}) with invalid reminder date`);
            
            // Option 1: Set to a default date and keep it
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 30);
            
            reminder.date = defaultDate;
            validReminders.push(reminder);
            needsUpdate = true;
            fixedCount++;
            
            console.log(`  Fixed by setting date to ${defaultDate.toISOString()}`);
            
            // Option 2: Remove the reminder (uncomment to use this option instead)
            // console.log(`  Removed invalid reminder`);
            // fixedCount++;
            // Don't push to validReminders to remove it
          } else {
            validReminders.push(reminder);
          }
        }
        
        if (validReminders.length !== car.reminders.length) {
          car.reminders = validReminders;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await car.save();
        carsUpdated++;
      }
    }
    
    console.log(`Fixed ${fixedCount} date issues across ${carsUpdated} cars`);
  } catch (err) {
    console.error('Error fixing car reminders:', err);
  }
};

// Main function to run the fixes
const main = async () => {
  try {
    await connectDB();
    
    console.log('Starting to fix invalid dates...');
    
    await fixStandaloneReminders();
    await fixCarReminders();
    
    console.log('Finished fixing invalid dates!');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
    process.exit(0);
  } catch (err) {
    console.error('Error running fix script:', err);
    process.exit(1);
  }
};

main(); 