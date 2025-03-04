const winston = require('winston');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log' })
  ]
});

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: 'Validation Error',
        details: err.message,
        status: 400
      }
    });
  }

  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      status: 500
    }
  });
};

module.exports = errorHandler; 