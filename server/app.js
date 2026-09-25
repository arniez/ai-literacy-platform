const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { buildCsp, buildCorsOptions, buildRateLimits } = require('./config/security');
const errorHandler = require('./middleware/errorHandler');

function createApp({ env = process.env } = {}) {
  const app = express();

  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors(buildCorsOptions(env)));
  app.use(helmet({ contentSecurityPolicy: buildCsp(env) }));

  const rateLimits = buildRateLimits(env);
  app.use('/api/', rateLimit(rateLimits.general));
  const authLimiter = rateLimit(rateLimits.auth);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/content', require('./routes/content'));
  app.use('/api/progress', require('./routes/progress'));
  app.use('/api/badges', require('./routes/badges'));
  app.use('/api/challenges', require('./routes/challenges'));
  app.use('/api/social', require('./routes/social'));
  app.use('/api/quiz', require('./routes/quiz'));
  app.use('/api/content-quiz', require('./routes/contentQuiz'));
  app.use('/api/student-tips', require('./routes/studentTips'));
  app.use('/api/integrations/ai-students', require('./routes/aiStudentIntegration'));

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/health/ready', async (req, res) => {
    try {
      const { pool } = require('./config/db-universal');
      await Promise.race([
        pool.query('SELECT 1'),
        new Promise((_resolve, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
      ]);
      res.status(200).json({ success: true });
    } catch {
      res.status(503).json({ success: false });
    }
  });

  const buildPath = env.CLIENT_BUILD_PATH || path.join(__dirname, '..', 'client', 'build');
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath, {
      index: false,
      setHeaders: (res, filePath) => {
        const relative = path.relative(buildPath, filePath);
        if (relative === 'index.html') {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (relative.startsWith(`static${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  }

  // Anything under /api that no router above matched.
  app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
