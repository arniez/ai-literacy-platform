const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Initialize app
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : 'http://localhost:3000',
  credentials: true
}));

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // limit each IP to 500 requests per windowMs (increased for development)
});
app.use('/api/', limiter);

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/social', require('./routes/social'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5002;

// Connect to database and start server
const startServer = async () => {
  try {
    await testConnection();

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   AI Literacy Server Running                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║   Port: ${PORT}                                       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
