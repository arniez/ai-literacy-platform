const { test } = require('node:test');
const assert = require('node:assert/strict');
const router = require('../routes/aiStudentIntegration');
const { protect } = require('../middleware/auth');

function responseRecorder() {
  return { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

const expectedRoutes = [['get', '/'], ['post', '/import'], ['patch', '/:id/publication']];

test('integration management exposes only the version list, import, and publication routes', () => {
  for (const [method, routePath] of expectedRoutes) {
    const layer = router.stack.find((candidate) => candidate.route?.path === routePath && candidate.route.methods[method]);
    assert.ok(layer, `expected ${method.toUpperCase()} ${routePath} route`);
    assert.equal(layer.route.stack[0].handle, protect);
    assert.equal(typeof layer.route.stack[1].handle, 'function');
    assert.equal(typeof layer.route.stack.at(-1).handle, 'function');
  }
});

test('student and teacher roles are rejected while admins reach every integration handler', () => {
  for (const [method, routePath] of expectedRoutes) {
    const layer = router.stack.find((candidate) => candidate.route?.path === routePath && candidate.route.methods[method]);
    const authorizeAdmin = layer.route.stack[1].handle;
    for (const role of ['student', 'teacher']) {
      const res = responseRecorder();
      let continued = false;
      authorizeAdmin({ user: { role } }, res, () => { continued = true; });
      assert.equal(res.statusCode, 403);
      assert.equal(continued, false);
    }
    const res = responseRecorder();
    let continued = false;
    authorizeAdmin({ user: { role: 'admin' } }, res, () => { continued = true; });
    assert.equal(res.statusCode, null);
    assert.equal(continued, true);
  }
});
