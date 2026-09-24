const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAiStudentIntegrationService } = require('../services/aiStudentIntegrationService');

function createMemoryDatabase() {
  const state = { external: [], content: [], nextExternalId: 1, nextContentId: 1 };
  async function query(sql, params = []) {
    const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    if (normalized.startsWith('select * from external_lessons where provider = ?')) {
      const row = state.external.find((item) => item.provider === params[0] && item.course_version === params[1] && item.external_id === params[2]);
      return [row ? [{ ...row }] : [], {}];
    }
    if (normalized.startsWith('select * from external_lessons where id = ?')) {
      const row = state.external.find((item) => item.id === Number(params[0]));
      return [row ? [{ ...row }] : [], {}];
    }
    if (normalized.startsWith('select external_lessons.id')) {
      return [state.external.map((item) => ({
        ...item,
        is_published: state.content.find((content) => content.id === item.content_id)?.is_published ?? false,
      })), {}];
    }
    if (normalized.startsWith('update external_lessons set')) {
      const [title, lesson_url, video_url, video_duration_minutes, availability_status, unavailable_reason, content_id, id] = params;
      Object.assign(state.external.find((item) => item.id === Number(id)), { title, lesson_url, video_url, video_duration_minutes, availability_status, unavailable_reason, content_id });
      return [[], { affectedRows: 1, rowCount: 1 }];
    }
    if (normalized.startsWith('update content set is_published = false')) {
      const row = state.content.find((item) => item.id === Number(params[0]));
      if (row) row.is_published = false;
      return [[], { affectedRows: row ? 1 : 0, rowCount: row ? 1 : 0 }];
    }
    if (normalized.startsWith('update content set is_published = ?')) {
      const row = state.content.find((item) => item.id === Number(params[1]));
      if (row) row.is_published = params[0];
      return [[], { affectedRows: row ? 1 : 0, rowCount: row ? 1 : 0 }];
    }
    if (normalized.startsWith('update content set title = ?')) {
      const [title, description, url, duration, id] = params;
      Object.assign(state.content.find((item) => item.id === Number(id)), { title, description, url, duration });
      return [[], { affectedRows: 1, rowCount: 1 }];
    }
    throw new Error(`Unexpected query: ${sql}`);
  }
  async function insertAndGetId(sql, params = []) {
    const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    if (normalized.startsWith('insert into content')) {
      const row = { id: state.nextContentId++, title: params[0], description: params[1], content_type: 'video', url: params[2], duration: params[3], is_published: false, source: 'aivoorstudenten', points_reward: 0 };
      state.content.push(row);
      return row.id;
    }
    if (normalized.startsWith('insert into external_lessons')) {
      const [provider, course_version, external_id, title, lesson_url, video_url, video_duration_minutes, availability_status, unavailable_reason, content_id] = params;
      const row = { id: state.nextExternalId++, provider, course_version, external_id, title, lesson_url, video_url, video_duration_minutes, availability_status, unavailable_reason, content_id };
      state.external.push(row);
      return row.id;
    }
    throw new Error(`Unexpected insert: ${sql}`);
  }
  const withTransaction = (callback) => callback({ query, insertAndGetId });
  return { state, query, insertAndGetId, withTransaction };
}

const availableLesson = {
  provider: 'aivoorstudenten', courseVersion: '2025', externalId: '1.1', title: 'First lesson',
  lessonUrl: 'https://aivoorstudenten.nl/e-learning-2025/first', videoUrl: 'https://www.youtube-nocookie.com/embed/abc12345678',
  availabilityStatus: 'available', durationMinutes: 5,
};
const upcomingLesson = {
  provider: 'aivoorstudenten', courseVersion: '2026', externalId: '1.1', title: 'Upcoming lesson',
  lessonUrl: 'https://aivoorstudenten.nl/cursus', availabilityStatus: 'upcoming', unavailableReason: 'Binnenkort',
};

function createService(lessons) {
  const db = createMemoryDatabase();
  const versions = [...new Set(lessons.map((lesson) => lesson.courseVersion))];
  const courses = versions.map((courseVersion) => ({
    provider: 'aivoorstudenten', courseVersion,
    lessons: lessons.filter((lesson) => lesson.courseVersion === courseVersion).map(({ provider, courseVersion: version, ...lesson }) => lesson),
  }));
  return { db, service: createAiStudentIntegrationService({ ...db, manifest: { courses } }) };
}

test('repeated catalog import creates one external mapping and one hidden content item', async () => {
  const { db, service } = createService([availableLesson, upcomingLesson]);
  await service.importCatalog();
  await service.importCatalog();
  assert.equal(db.state.external.length, 2);
  assert.equal(db.state.content.length, 1);
  assert.equal(db.state.content[0].is_published, false);
  assert.equal(db.state.content[0].url, availableLesson.videoUrl);
  assert.equal(db.state.external.find((item) => item.external_id === '1.1').content_id, 1);
});

test('a reimport preserves an administrator publication choice', async () => {
  const { db, service } = createService([availableLesson]);
  await service.importCatalog();
  await service.setPublication(1, true);
  await service.importCatalog();
  assert.equal(db.state.content[0].is_published, true);
  assert.equal(db.state.content.length, 1);
});

test('unavailable records have no app content and cannot be published', async () => {
  const { db, service } = createService([upcomingLesson]);
  await service.importCatalog();
  assert.equal(db.state.content.length, 0);
  assert.equal(db.state.external[0].content_id, null);
  await assert.rejects(service.setPublication(1, true), /available|beschikbaar/i);
});

test('hiding an available lesson changes only its publication flag', async () => {
  const { db, service } = createService([availableLesson]);
  await service.importCatalog();
  await service.setPublication(1, true);
  const original = { ...db.state.content[0] };
  await service.setPublication(1, false);
  assert.deepEqual(db.state.content[0], { ...original, is_published: false });
});
