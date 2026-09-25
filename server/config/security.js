function buildCsp() {
  return {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.youtube.com', 'https://s.ytimg.com'],
      frameSrc: ['https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      mediaSrc: ["'self'", 'https:'],
      connectSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
    },
  };
}

function parseOrigins(value) {
  return (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function buildCorsOptions(env = {}) {
  const extraOrigins = parseOrigins(env.CORS_ORIGINS);
  const isProduction = env.NODE_ENV === 'production';
  const allowedOrigins = isProduction ? extraOrigins : ['http://localhost:3000', ...extraOrigins];

  return {
    origin(origin, callback) {
      // No Origin header means same-origin or a non-browser client; always allow.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  };
}

function buildRateLimits(env = {}) {
  return {
    general: {
      windowMs: 15 * 60 * 1000,
      max: Number(env.RATE_LIMIT_MAX) || 2000,
      standardHeaders: true,
      legacyHeaders: false,
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: Number(env.AUTH_RATE_LIMIT_MAX) || 20,
      standardHeaders: true,
      legacyHeaders: false,
    },
  };
}

module.exports = { buildCsp, buildCorsOptions, buildRateLimits };
