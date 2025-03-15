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
        const carsRoutes = require('./routes/cars');
        const rentalsRoutes = require('./routes/rentals');
        const adminRoutes = require('./routes/admin');
        const remindersRoutes = require('./routes/reminders');

        app.use('/api/cars', carsRoutes);
        app.use('/api/rentals', rentalsRoutes);
        app.use('/api/admin', adminRoutes);
        app.use('/api/reminders', remindersRoutes);

        // Serve index.html for all other routes (SPA support)
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ error: 'Something broke!' });
        });

        // Start the Server with fallback ports
        const startOnPort = (port) => {
            return new Promise((resolve, reject) => {
                const server = app.listen(port, () => {
                    console.log(`Server running on port ${port}`);
                    resolve(server);
                });
                
                server.on('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        console.log(`Port ${port} is already in use, trying another port...`);
                        reject(err);
                    } else {
                        reject(err);
                    }
                });
            });
        };
        
        // Try alternative ports if 3000 is in use
        const tryPorts = async () => {
            const ports = [3000, 3001, 3002, 3003, 3004, 3005];
            
            for (const port of ports) {
                try {
                    return await startOnPort(port);
                } catch (err) {
                    if (err.code === 'EADDRINUSE' && ports.indexOf(port) < ports.length - 1) {
                        // Try the next port
                        continue;
                    }
                    throw err;
                }
            }
            
            throw new Error('All ports are in use');
        };
        
        await tryPorts();
    } catch (error) {
        console.error('Server error:', error);
        process.exit(1);
    }
};

startServer();
