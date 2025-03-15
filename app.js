// app.js
process.env.NODE_NO_WARNINGS = '1';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const app = express();

// Connect to MongoDB first
const startServer = async () => {
    try {
        await connectDB();
        
        // Security middleware
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", 'code.jquery.com', 'stackpath.bootstrapcdn.com', 'cdn.jsdelivr.net'],
                    styleSrc: ["'self'", "'unsafe-inline'", 'stackpath.bootstrapcdn.com', 'fonts.googleapis.com'],
                    imgSrc: ["'self'", 'data:', 'blob:'],
                },
            },
        }));
        app.use(cors());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100
        });
        app.use('/api/', limiter);

        // Middleware
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());
        app.use(express.static(path.join(__dirname, 'public')));

        // Routes
        const carsRoutes = require('./routes/car');
        const rentalsRoutes = require('./routes/rentals');
        const adminRoutes = require('./routes/admin');

        app.use('/api/cars', carsRoutes);
        app.use('/api/rentals', rentalsRoutes);
        app.use('/api/admin', adminRoutes);

        // Serve index.html for all other routes (SPA support)
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ error: 'Something broke!' });
        });

        // Start the Server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

startServer();
