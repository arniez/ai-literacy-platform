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
      // An Origin header that isn't in the allowlist gets `false`, not an error: the
      // `cors` package turns an Error into a 500 that blocks the request entirely, but a
      // same-origin browser request also carries an Origin header (e.g. on POST) and must
      // still succeed — it just doesn't need (or get) an Access-Control-Allow-Origin header.
      // `false` omits the CORS headers without failing the request; the browser's own
      // same-origin policy is what actually protects a *cross*-origin caller here.
      callback(null, !origin || allowedOrigins.includes(origin));
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
