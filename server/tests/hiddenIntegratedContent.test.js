const { test } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../config/db-universal');

const controllerModules = [
  '../controllers/contentController',
  '../controllers/progressController',
  '../controllers/socialController',
];

function responseRecorder() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function loadControllersWithQuery(query) {
  const previousQuery = db.query;
  db.query = query;
  for (const modulePath of controllerModules) delete require.cache[require.resolve(modulePath)];
  const controllers = controllerModules.map((modulePath) => require(modulePath));
  return {
    content: controllers[0],
    progress: controllers[1],
    social: controllers[2],
    restore() {
      db.query = previousQuery;
      for (const modulePath of controllerModules) delete require.cache[require.resolve(modulePath)];
    },
  };
}

function createQueryAdapter({ hidden = true } = {}) {
  const calls = [];
  const query = async (sql, params = []) => {
    calls.push({ sql, params });
    const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    const published = !hidden;
    if (normalized.includes('from content c') && normalized.includes('where c.id')) {
      return [published ? [{ id: 7, title: 'Source lesson', content_type: 'video', points_reward: 10, is_published: true, external_lesson_url: 'https://aivoorstudenten.nl/lesson', external_course_version: '2025' }] : [], {}];
    }
    if (normalized.includes('from content') && normalized.includes('where id =') && normalized.includes('is_published = true')) {
      return [published ? [{ id: 7, points_reward: 10 }] : [], {}];
    }
    if (normalized.includes('from comments') && normalized.includes('join content')) {
      return [published ? [{ id: 3, content_id: 7 }] : [], {}];
    }
    if (normalized.includes('from user_progress up')) {
      return [published ? [{ id: 1, content_id: 7, title: 'Source lesson', status: 'in_progress' }] : [], {}];
    }
    if (normalized.includes('from user_progress where user_id')) return [[{ status: 'in_progress', progress_percentage: 10, completed_at: null }], {}];
    if (normalized.includes('from content_ratings') && normalized.includes('avg(')) return [[{ avg_rating: 4.5, rating_count: 1 }], {}];
    if (normalized.includes('from comments c') && normalized.includes('join users')) return [[], {}];
    if (normalized.startsWith('select id from comment_likes')) return [[], {}];
    if (/^(insert|update|delete)\b/i.test(normalized)) return [{ insertId: 15, affectedRows: 1 }, {}];
    return [[], {}];
  };
  return { query, calls };
}

test('hidden content cannot be read or changed through student content, progress, rating, or comment endpoints', async () => {
  const adapter = createQueryAdapter({ hidden: true });
  const controllers = loadControllersWithQuery(adapter.query);
  const user = { id: 12, role: 'student' };
  try {
    const cases = [
      [controllers.content.getContentById, { params: { id: '7' }, query: {}, user }],
      [controllers.progress.updateProgress, { params: { contentId: '7' }, body: { status: 'in_progress' }, user }],
      [controllers.content.rateContent, { params: { id: '7' }, body: { rating: 5 }, user }],
      [controllers.social.getComments, { params: { contentId: '7' } }],
      [controllers.social.postComment, { params: { contentId: '7' }, body: { commentText: 'Useful lesson' }, user }],
      [controllers.social.toggleCommentLike, { params: { commentId: '3' }, body: {}, user }],
    ];
    for (const [handler, req] of cases) {
      const res = responseRecorder();
      await handler(req, res);
      assert.equal(res.statusCode, 404, `expected 404 from ${handler.name}`);
      assert.equal(res.body.message, 'Content not found');
    }
    assert.equal(adapter.calls.some(({ sql }) => /^(insert|update|delete)\b/i.test(sql.trim())), false);

    const res = responseRecorder();
    await controllers.progress.getUserProgress({ user }, res);
    assert.equal(res.statusCode, 200);
    assert.match(adapter.calls.find(({ sql }) => sql.toLowerCase().includes('from user_progress up')).sql, /c\.is_published\s*=\s*true/i);
  } finally {
    controllers.restore();
  }
});

test('published integrated lessons keep the existing student endpoints usable', async () => {
  const adapter = createQueryAdapter({ hidden: false });
  const controllers = loadControllersWithQuery(adapter.query);
  const user = { id: 12, role: 'student' };
  try {
    const detail = responseRecorder();
    await controllers.content.getContentById({ params: { id: '7' }, query: {}, user }, detail);
    assert.equal(detail.statusCode, 200);
    assert.equal(detail.body.data.external_lesson_url, 'https://aivoorstudenten.nl/lesson');
    assert.equal(detail.body.data.external_course_version, '2025');

    const progress = responseRecorder();
    await controllers.progress.updateProgress({ params: { contentId: '7' }, body: { status: 'in_progress', progressPercentage: 10 }, user }, progress);
    assert.equal(progress.statusCode, 200);

    const rating = responseRecorder();
    await controllers.content.rateContent({ params: { id: '7' }, body: { rating: 5 }, user }, rating);
    assert.equal(rating.statusCode, 200);

    const comment = responseRecorder();
    await controllers.social.postComment({ params: { contentId: '7' }, body: { commentText: 'Useful lesson' }, user }, comment);
    assert.equal(comment.statusCode, 201);
    assert.ok(adapter.calls.some(({ sql }) => /insert into comments/i.test(sql)));
    const comments = responseRecorder();
    await controllers.social.getComments({ params: { contentId: '7' } }, comments);
    assert.equal(comments.statusCode, 200);

    const like = responseRecorder();
    await controllers.social.toggleCommentLike({ params: { commentId: '3' }, body: {}, user }, like);
    assert.equal(like.statusCode, 200);
  } finally {
    controllers.restore();
  }
});
