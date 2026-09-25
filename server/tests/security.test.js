const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildCsp, buildCorsOptions, buildRateLimits } = require('../config/security');

test('CSP allows YouTube in script-src and https: iframes in frame-src', () => {
  const csp = buildCsp({});
  assert.ok(csp.directives.scriptSrc.includes('https://www.youtube.com'));
  assert.ok(csp.directives.frameSrc.includes('https:'));
  assert.ok(csp.directives.objectSrc.includes("'none'"));
});

function callOrigin(corsOptions, origin) {
  return new Promise((resolve, reject) => {
    corsOptions.origin(origin, (err, allowed) => (err ? reject(err) : resolve(allowed)));
  });
}

test('in production without CORS_ORIGINS, a foreign origin is rejected', async () => {
  const options = buildCorsOptions({ NODE_ENV: 'production' });
  await assert.rejects(callOrigin(options, 'https://evil.example.com'));
});

test('in production, requests with no Origin header (same-origin) are allowed', async () => {
  const options = buildCorsOptions({ NODE_ENV: 'production' });
  assert.equal(await callOrigin(options, undefined), true);
});

test('in production, an origin listed in CORS_ORIGINS is allowed', async () => {
  const options = buildCorsOptions({ NODE_ENV: 'production', CORS_ORIGINS: 'https://vaardigmetai.nl' });
  assert.equal(await callOrigin(options, 'https://vaardigmetai.nl'), true);
});

test('in development, localhost:3000 is allowed by default', async () => {
  const options = buildCorsOptions({ NODE_ENV: 'development' });
  assert.equal(await callOrigin(options, 'http://localhost:3000'), true);
});

test('rate limit values come from the environment, with sane defaults', () => {
  const defaults = buildRateLimits({});
  assert.equal(defaults.general.max, 2000);
  assert.equal(defaults.auth.max, 20);

  const overridden = buildRateLimits({ RATE_LIMIT_MAX: '5000', AUTH_RATE_LIMIT_MAX: '10' });
  assert.equal(overridden.general.max, 5000);
  assert.equal(overridden.auth.max, 10);
});
