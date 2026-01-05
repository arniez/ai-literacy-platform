const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { testConnection, dbType } = require('./config/db-universal');
const errorHandler = require('./middleware/errorHandler');

// Load env vars (only from file if it exists, otherwise use Railway environment variables)
const configPath = path.join(__dirname, 'config', 'config.env');
if (fs.existsSync(configPath)) {
  dotenv.config({ path: configPath });
}

// Initialize app
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - in production, allow all origins since we're serving frontend and backend together
// In development, restrict to localhost
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true  // Allow all origins in production
    : ['http://localhost:3000', 'http://192.168.178.79:3000'],
  credentials: true
}));

// Security headers - configure helmet for serving static React app
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to allow React app to load properly
  crossOriginEmbedderPolicy: false
}));

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

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5002;

// Connect to database and start server
const startServer = async () => {
  try {
    await testConnection();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   AI Literacy Server Running                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║   Database: ${dbType.toUpperCase()}                                  ║
║   Port: ${PORT}                                       ║
║   Local: http://localhost:${PORT}                      ║
║   Network: http://192.168.178.79:${PORT}               ║
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
