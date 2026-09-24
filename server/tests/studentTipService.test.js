const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStudentTipService } = require('../services/studentTipService');

const externalTip = {
  title: 'Een AI-gids',
  url: 'https://example.org/guide',
  audience: 'Beginnende studenten',
  learningOutcome: 'Ik kan een antwoord controleren',
  recommendationReason: 'De stappen zijn helder',
  criticalCheck: 'Controleer de bronvermelding',
  shareWithStudents: true,
  displayFirstName: false
};

const inReviewSuggestion = {
  id: 4,
  student_id: 12,
  title: 'Een AI-gids',
  url: 'https://example.org/guide',
  audience: 'Beginnende studenten',
  learning_outcome: 'Ik kan een antwoord controleren',
  recommendation_reason: 'De stappen zijn helder',
  critical_check: 'Controleer de bronvermelding',
  share_with_students: true,
  display_first_name: false,
  status: 'in_review'
};

test('student list queries are scoped to the owning student ID', async () => {
  const calls = [];
  const service = createStudentTipService({
    query: async (sql, params) => { calls.push({ sql, params }); return [[], {}]; }
  });

  await service.listMine(37);

  assert.match(calls[0].sql, /student_id\s*=\s*\?/);
  assert.deepEqual(calls[0].params, [37]);
});

test('published list filters private tips and selects only public fields', async () => {
  const calls = [];
  const service = createStudentTipService({
    query: async (sql, params) => { calls.push({ sql, params }); return [[], {}]; }
  });

  await service.listPublished();

  assert.match(calls[0].sql, /status\s*=\s*'published'/i);
  assert.match(calls[0].sql, /share_with_students\s*=\s*true/i);
  assert.doesNotMatch(calls[0].sql, /reviewer_note|last_name|SELECT\s+s\.\*/i);
  assert.match(calls[0].sql, /display_first_name/);
});

test('submission returns a non-blocking duplicate warning', async () => {
  const service = createStudentTipService({
    query: async (sql) => {
      if (/FROM student_suggestions/i.test(sql)) return [[{ id: 3 }], {}];
      return [[], {}];
    },
    insertAndGetId: async () => 16
  });

  const result = await service.createSuggestion(12, externalTip);
  assert.equal(result.id, 16);
  assert.equal(result.status, 'submitted');
  assert.equal(result.duplicateWarning, true);
});

test('internal submissions use a published content item title and URL', async () => {
  const inserts = [];
  const service = createStudentTipService({
    query: async (sql) => {
      if (/FROM content WHERE id/i.test(sql)) return [[{ id: 21, title: 'AI in de praktijk', url: null }], {}];
      return [[], {}];
    },
    insertAndGetId: async (sql, params) => { inserts.push({ sql, params }); return 22; }
  });

  const result = await service.createSuggestion(12, {
    contentId: 21,
    audience: externalTip.audience,
    learningOutcome: externalTip.learningOutcome,
    recommendationReason: externalTip.recommendationReason,
    criticalCheck: externalTip.criticalCheck
  });

  assert.equal(result.id, 22);
  assert.equal(inserts[0].params[1], 21);
  assert.equal(inserts[0].params[2], 'AI in de praktijk');
  assert.equal(inserts[0].params[3], '');
});

test('rejects an unsafe external URL before inserting a submission', async () => {
  let insertCalled = false;
  const service = createStudentTipService({
    query: async () => [[], {}],
    insertAndGetId: async () => { insertCalled = true; return 1; }
  });

  await assert.rejects(
    service.createSuggestion(12, { ...externalTip, url: 'javascript:alert(1)' }),
    (error) => error.statusCode === 400
  );
  assert.equal(insertCalled, false);
});

test('a tip cannot be published without student consent', async () => {
  const calls = [];
  const service = createStudentTipService({
    query: async (sql) => {
      calls.push(sql);
      if (/SELECT .*student_suggestions/i.test(sql)) {
        return [[{ ...inReviewSuggestion, share_with_students: false }], {}];
      }
      return [[], {}];
    }
  });

  await assert.rejects(
    service.reviewSuggestion({ suggestionId: 4, reviewerId: 2, action: 'publish' }),
    (error) => error.statusCode === 400 && /toestemming/i.test(error.message)
  );
  assert.equal(calls.some((sql) => /UPDATE student_suggestions/i.test(sql)), false);
});

test('declining a tip requires a reviewer explanation', async () => {
  let updateCalled = false;
  const service = createStudentTipService({
    query: async (sql) => {
      if (/SELECT .*student_suggestions/i.test(sql)) return [[inReviewSuggestion], {}];
      if (/UPDATE student_suggestions/i.test(sql)) updateCalled = true;
      return [[], {}];
    }
  });

  await assert.rejects(
    service.reviewSuggestion({ suggestionId: 4, reviewerId: 2, action: 'decline', reviewerNote: ' ' }),
    (error) => error.statusCode === 400 && /toelichting/i.test(error.message)
  );
  assert.equal(updateCalled, false);
});

test('a 501-character source URL cannot be converted into content', async () => {
  const longUrl = `https://example.org/${'a'.repeat(481)}`;
  const service = createStudentTipService({
    query: async () => [[{ ...inReviewSuggestion, url: longUrl }], {}],
    withTransaction: async () => assert.fail('oversized source must be rejected before opening a transaction')
  });

  await assert.rejects(
    service.reviewSuggestion({
      suggestionId: 4,
      reviewerId: 2,
      action: 'add_to_library',
      moduleId: 8,
      displayTitle: 'Een AI-gids',
      contentType: 'video'
    }),
    (error) => error.statusCode === 400 && /500/.test(error.message)
  );
});

test('a reviewer cannot update a missing suggestion', async () => {
  const service = createStudentTipService({ query: async () => [[], {}] });

  await assert.rejects(
    service.reviewSuggestion({ suggestionId: 999, reviewerId: 2, action: 'start_review' }),
    (error) => error.statusCode === 404
  );
});

test('failed content conversion leaves the suggestion unchanged', async () => {
  let suggestionUpdateCalled = false;
  const service = createStudentTipService({
    query: async () => [[inReviewSuggestion], {}],
    withTransaction: async (work) => work({
      query: async (sql) => {
        if (/SELECT id FROM modules/i.test(sql)) return [[{ id: 8 }], {}];
        if (/UPDATE student_suggestions/i.test(sql)) suggestionUpdateCalled = true;
        return [[inReviewSuggestion], {}];
      },
      insertAndGetId: async () => { throw new Error('content insert failed'); }
    })
  });

  await assert.rejects(
    service.reviewSuggestion({
      suggestionId: 4,
      reviewerId: 2,
      action: 'add_to_library',
      moduleId: 8,
      displayTitle: 'Een AI-gids',
      contentType: 'video'
    }),
    /content insert failed/
  );
  assert.equal(suggestionUpdateCalled, false);
});

test('successful content conversion creates an unpublished item and links it in one transaction', async () => {
  const events = [];
  const service = createStudentTipService({
    query: async () => [[inReviewSuggestion], {}],
    withTransaction: async (work) => work({
      query: async (sql, params) => {
        events.push({ sql, params });
        if (/SELECT id FROM modules/i.test(sql)) return [[{ id: 8 }], {}];
        return [[inReviewSuggestion], {}];
      },
      insertAndGetId: async (sql, params) => {
        events.push({ sql, params });
        return 101;
      }
    })
  });

  const result = await service.reviewSuggestion({
    suggestionId: 4,
    reviewerId: 2,
    action: 'add_to_library',
    moduleId: 8,
    displayTitle: 'AI in de praktijk',
    displaySummary: 'Een korte uitleg',
    contentType: 'video'
  });

  assert.deepEqual(result, { id: 4, status: 'added', convertedContentId: 101, duplicateWarning: false });
  const contentInsert = events.find((event) => /INSERT INTO content/i.test(event.sql));
  const suggestionUpdate = events.find((event) => /UPDATE student_suggestions/i.test(event.sql));
  assert.match(contentInsert.sql, /is_published, source, points_reward/i);
  assert.deepEqual(contentInsert.params, [8, 'AI in de praktijk', 'Een korte uitleg', 'video', inReviewSuggestion.url]);
  assert.deepEqual(suggestionUpdate.params.slice(0, 2), [101, 2]);
});
