const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../app');

function makeFakeBuildDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-test-build-'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><html><body>SPA</body></html>');
  return dir;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function baseUrl(server) {
  return `http://127.0.0.1:${server.address().port}`;
}

test('GET a client route returns the SPA HTML page', async () => {
  const app = createApp({ env: { CLIENT_BUILD_PATH: makeFakeBuildDir(), NODE_ENV: 'test' } });
  const server = await listen(app);
  try {
    const res = await fetch(`${baseUrl(server)}/basiscursus`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /html/);
    assert.match(await res.text(), /SPA/);
  } finally {
    server.close();
  }
});

test('GET an unknown /api route returns a JSON 404, not HTML', async () => {
  const app = createApp({ env: { CLIENT_BUILD_PATH: makeFakeBuildDir(), NODE_ENV: 'test' } });
  const server = await listen(app);
  try {
    const res = await fetch(`${baseUrl(server)}/api/bestaat-niet`);
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type'), /json/);
    const body = await res.json();
    assert.equal(body.success, false);
  } finally {
    server.close();
  }
});

test('GET /api/health returns 200', async () => {
  const app = createApp({ env: { CLIENT_BUILD_PATH: makeFakeBuildDir(), NODE_ENV: 'test' } });
  const server = await listen(app);
  try {
    const res = await fetch(`${baseUrl(server)}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  } finally {
    server.close();
  }
});

test('POST /api/progress/daily-checkin without a token is rejected by protect, not swallowed by /:contentId', async () => {
  const app = createApp({ env: { CLIENT_BUILD_PATH: makeFakeBuildDir(), NODE_ENV: 'test' } });
  const server = await listen(app);
  try {
    const res = await fetch(`${baseUrl(server)}/api/progress/daily-checkin`, { method: 'POST' });
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});

test('a same-origin POST (Origin header present, not in any allowlist) is not turned into a 500 by CORS', async () => {
  // Regression test: browsers send an Origin header on same-origin POSTs too. In production
  // with no CORS_ORIGINS set, that origin is never "allowed", but it must still reach the
  // route instead of being errored out by the cors middleware.
  const app = createApp({ env: { CLIENT_BUILD_PATH: makeFakeBuildDir(), NODE_ENV: 'production' } });
  const server = await listen(app);
  try {
    const res = await fetch(`${baseUrl(server)}/api/progress/daily-checkin`, {
      method: 'POST',
      headers: { Origin: baseUrl(server) },
    });
    assert.equal(res.status, 401); // reaches `protect`, not a CORS-triggered 500
  } finally {
    server.close();
  }
});
