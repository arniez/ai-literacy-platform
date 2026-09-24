const { test } = require('node:test');
const assert = require('node:assert/strict');
const router = require('../routes/studentTips');
const { protect } = require('../middleware/auth');

function responseRecorder() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function routeMiddleware(method, routePath) {
  const layer = router.stack.find((candidate) =>
    candidate.route?.path === routePath && candidate.route.methods[method]
  );
  assert.ok(layer, `expected ${method.toUpperCase()} ${routePath} route`);
  return layer.route.stack[0].handle;
}

test('all student tip routes require authentication', async () => {
  const layer = router.stack.find((candidate) => candidate.handle === protect);
  assert.ok(layer, 'expected authentication middleware on the router');
  const res = responseRecorder();
  await layer.handle({ headers: {} }, res, () => assert.fail('unauthenticated request continued'));
  assert.equal(res.statusCode, 401);
});

test('student roles are rejected from both review routes', () => {
  for (const [method, routePath] of [['get', '/review'], ['patch', '/:id/review']]) {
    const authorize = routeMiddleware(method, routePath);
    const res = responseRecorder();
    let continued = false;
    authorize({ user: { role: 'student' } }, res, () => { continued = true; });
    assert.equal(res.statusCode, 403);
    assert.equal(continued, false);
  }
});

test('teacher and admin roles can continue through both review route guards', () => {
  for (const [method, routePath] of [['get', '/review'], ['patch', '/:id/review']]) {
    const authorize = routeMiddleware(method, routePath);
    for (const role of ['teacher', 'admin']) {
      const res = responseRecorder();
      let continued = false;
      authorize({ user: { role } }, res, () => { continued = true; });
      assert.equal(continued, true);
      assert.equal(res.statusCode, null);
    }
  }
});
