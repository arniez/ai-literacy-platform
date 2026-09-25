require('./config/env');
const { createApp } = require('./app');
const { testConnection, dbType, pool } = require('./config/db-universal');

const app = createApp({ env: process.env });
const PORT = process.env.PORT || 5002;

let server;

const startServer = async () => {
  try {
    await testConnection();

    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   AI Literacy Server Running                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║   Database: ${dbType.toUpperCase()}                                  ║
║   Port: ${PORT}                                       ║
║   Local: http://localhost:${PORT}                      ║
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

const shutdown = () => {
  if (server) {
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});
