# Studenttips and Teacher Inbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let students submit thoughtful tips about existing or external learning resources, then let teachers and admins review, publish, decline, or convert them into hidden content drafts.

**Architecture:** Add a portable `student_suggestions` table and a small domain/service layer behind authenticated Express routes. The student page owns submission, status tracking, and approved tips; a separate reviewer page owns moderation, so existing admin content permissions remain unchanged. Use an explicit database transaction when a reviewer converts a tip into a content draft and links the two records.

**Tech Stack:** React 18, React Router 6, Express 4, MySQL 8 / PostgreSQL, the existing `db-universal` interface, Jest through Create React App, and Node's built-in `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-24-studenttips-en-docentinbox.md`

## Global Constraints

- Een student kan een bestaand content-item aanbevelen of een externe URL indienen.
- Een tip is privé totdat een bevoegde beoordelaar hem goedkeurt.
- Een student bepaalt bij inzending of de tip na goedkeuring met andere studenten gedeeld mag worden. Naamvermelding is apart en staat standaard uit.
- Alleen rollen `teacher` en `admin` mogen inbox- en reviewroutes gebruiken.
- Nieuwe schemawijzigingen worden als afzonderlijke migratie geleverd; bestaande database-initialisaties of tabellen worden niet verwijderd of opnieuw opgebouwd.
- Accepteer voor externe links uitsluitend `http` en `https`.
- De interface en feedbackberichten zijn beschikbaar in Nederlands en Engels.
- Studenten kunnen alleen hun eigen inzendingen lezen; gepubliceerde studenttips bevatten geen beoordelaarsnotities.

## Review Focus

- Een externe URL met `javascript:`, `data:`, een ongeldige URL-opmaak of een lege host wordt geweigerd door `server/tests/studentTipRules.test.js` en de service-test in Task 3.
- Een student probeert een inzending van iemand anders op te halen of te wijzigen; de service/API retourneert geen data en de test staat in `server/tests/studentTipService.test.js`.
- Een gedeelde tip wordt gepubliceerd terwijl de student delen niet toestond, of naam wordt getoond zonder toestemming; review-transitiontests in `server/tests/studentTipRules.test.js` en de gepubliceerde-lijsttest in Task 3 moeten dit blokkeren.
- Een afwijzing zonder uitleg of een willekeurige statusovergang probeert door te komen; transitie- en review-API-tests in Tasks 1 and 3 moeten een 400-respons opleveren zonder databasewijziging.
- Een URL of tekstveld is langer dan de bestaande contentvelden kunnen opslaan, vooral tijdens conceptconversie; validatie- en service-tests in Tasks 1 and 3 moeten dit begrijpelijk weigeren en geen los contentconcept achterlaten.

---

## File Map

- `server/migrations/add-student-tips.postgres.sql` and `server/migrations/add-student-tips.mysql.sql`: additive schema for student submissions and review state, with each dialect's existing `users` and `content` integer keys.
- `server/run-student-tips-migration.js` and `server/package.json`: select and run only the migration matching `DB_TYPE`; no reset or seed operation.
- `server/tests/studentTipMigrationRunner.test.js`: verify dialect selection and reject unsupported database engines.
- `server/utils/studentTipRules.js`: pure URL, field, and status-transition rules shared by the service and tests.
- `server/config/db-universal.js`: expose a transaction helper for atomic draft conversion across the configured database pool.
- `server/services/studentTipService.js`: validation, ownership-scoped reads, review queue queries, status changes, and conversion to a content draft.
- `server/controllers/studentTipController.js`, `server/routes/studentTips.js`, and `server/server.js`: HTTP request/response mapping, role checks, and API mount.
- `client/src/pages/StudentTips.js` and `client/src/pages/StudentTips.css`: student submission, approved tips, and own-status list.
- `client/src/pages/StudentTipReview.js` and `client/src/pages/StudentTipReview.css`: teacher/admin review queue and actions.
- `client/src/utils/studentTips.js` and its test: deterministic payload formatting and safe link/view-model behavior.
- `client/src/utils/studentTipReview.js` and its test: deterministic review payloads for decline, publication, hiding, and draft conversion.
- `client/src/App.js`, `client/src/components/layout/Navbar.js`, `client/src/pages/ContentView.js`, and `client/src/utils/studentTipTranslations.js`: routes, role-aware entry points, content-detail shortcut, and NL/ENG labels.

### Task 1: Add portable storage and pure tip rules

**Files:**
- Create: `server/migrations/add-student-tips.postgres.sql`
- Create: `server/migrations/add-student-tips.mysql.sql`
- Create: `server/run-student-tips-migration.js`
- Create: `server/utils/studentTipRules.js`
- Test: `server/tests/studentTipRules.test.js`
- Test: `server/tests/studentTipMigrationRunner.test.js`
- Modify: `server/package.json`

**Interfaces:**
- Produces `normalizeTipUrl(value)`, returning a normalized `http` or `https` URL with its fragment removed, or `null` for invalid input.
- Produces `validateTipSubmission(input)`, returning `{ errors: string[], normalizedUrl: string | null }`.
- Produces `validateTipReview({ currentStatus, action, shareWithStudents, reviewerNote })`, returning `{ error: string | null }`.
- Submission text limits: title 200 characters; URL 500; audience 200; learning outcome, recommendation reason, critical check, reviewer note, and visible summary 2,000 each. Keep title/URL within existing `content` column limits.
- The table stores `student_id`, optional `content_id`, optional `converted_content_id`, submitted text, separate share/name consent, `status`, reviewer ID/note, editable public title/summary, and timestamps. Use `SERIAL` / `INTEGER` for PostgreSQL and `INT AUTO_INCREMENT` / `INT` for MySQL; use `VARCHAR` status values validated in application code.

- [ ] **Step 1: Write failing rules tests**

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTipUrl, validateTipSubmission, validateTipReview } = require('../utils/studentTipRules');

test('normalizes a web URL and drops its fragment', () => {
  assert.equal(normalizeTipUrl('HTTPS://Example.org/learn#part'), 'https://example.org/learn');
});

test('rejects unsafe schemes and incomplete external tips', () => {
  assert.equal(normalizeTipUrl('javascript:alert(1)'), null);
  const result = validateTipSubmission({ title: 'Tip', url: 'javascript:alert(1)' });
  assert.ok(result.errors.length > 0);
});

test('does not publish without share consent or decline without a note', () => {
  assert.ok(validateTipReview({ currentStatus: 'in_review', action: 'publish', shareWithStudents: false }).error);
  assert.ok(validateTipReview({ currentStatus: 'in_review', action: 'decline', reviewerNote: '' }).error);
});
```

- [ ] **Step 2: Run tests and confirm they fail because the rules module is missing**

Run from `server`: `node --test tests/studentTipRules.test.js`

Expected: FAIL with `Cannot find module '../utils/studentTipRules'`.

- [ ] **Step 3: Implement the rules and dialect migrations**

Implement the three named functions with built-in `URL` parsing, trim-before-check behavior, the stated length limits, and an explicit allowed-transition table. Create the additive table with foreign keys to `users` and `content`, and indexes for `student_id`, `status`, `reviewer_id`, `content_id`, and `converted_content_id`. Use `CREATE TABLE IF NOT EXISTS`; put MySQL indexes inside its table definition and PostgreSQL indexes in `CREATE INDEX IF NOT EXISTS` statements. The migration runner must select only the file matching `dbType`, split these simple semicolon-terminated statements, and fail on an unsupported database type. Add `db:migrate:student-tips` to the server scripts.

```js
module.exports = { normalizeTipUrl, validateTipSubmission, validateTipReview };
```

- [ ] **Step 4: Run focused tests and verify migration selection**

Run from `server`: `node --test tests/studentTipRules.test.js tests/studentTipMigrationRunner.test.js`.

Expected: PASS for safe URL normalization, invalid input, consent, required rejection note, and allowed/blocked transitions. Run `npm run db:migrate:student-tips` only against the configured local development database; expected: the new table and indexes exist and prior tables/rows remain present.

- [ ] **Step 5: Commit the storage and rules slice**

```bash
git add server/migrations/add-student-tips.postgres.sql server/migrations/add-student-tips.mysql.sql server/run-student-tips-migration.js server/utils/studentTipRules.js server/tests/studentTipRules.test.js server/tests/studentTipMigrationRunner.test.js server/package.json
git commit -m "feat: add student tip storage and rules"
```

### Task 2: Add cross-database transactions for draft conversion

**Files:**
- Modify: `server/config/db-universal.js`
- Create: `server/config/transactionRunner.js`
- Test: `server/tests/transactionRunner.test.js`

**Interfaces:**
- Produces `createTransactionRunner({ dbType, pool })`, which returns `withTransaction(work)`.
- `work` receives `{ query(sql, params), insertAndGetId(sql, params) }`; `query` has the same normalized `[rows, result]` shape as `db-universal.query`.
- PostgreSQL uses a checked-out client with `BEGIN`/`COMMIT`/`ROLLBACK`; MySQL uses a checked-out connection with `beginTransaction`/`commit`/`rollback`. Always release the checked-out resource.

- [ ] **Step 1: Write transaction lifecycle tests for both pool shapes**

```js
test('rolls back and releases a PostgreSQL client when work fails', async () => {
  const events = [];
  const client = { query: async sql => { events.push(sql); return { rows: [], rowCount: 0 }; }, release: () => events.push('release') };
  const withTransaction = createTransactionRunner({ dbType: 'postgres', pool: { connect: async () => client } });
  await assert.rejects(withTransaction(async () => { throw new Error('stop'); }), /stop/);
  assert.deepEqual(events, ['BEGIN', 'ROLLBACK', 'release']);
});
```

Add the corresponding MySQL test asserting `beginTransaction`, `rollback`, and `release` are called in order, and success tests asserting `COMMIT`/`commit`.

- [ ] **Step 2: Run the transaction tests and confirm they fail**

Run from `server`: `node --test tests/transactionRunner.test.js`.

Expected: FAIL because `transactionRunner` is not defined/exported.

- [ ] **Step 3: Implement the injected transaction runner**

Normalize `?` placeholders to `$1...$n` for PostgreSQL using the same rule as `db-universal.query`. For PostgreSQL inserts, add `RETURNING id` and read `rows[0].id`; for MySQL inserts, return `result.insertId`. In `db-universal.js`, export one configured `withTransaction` from `createTransactionRunner({ dbType, pool })`.

```js
const withTransaction = createTransactionRunner({ dbType, pool });
module.exports = { pool, query, insertAndGetId, withTransaction, getInsertId, withReturning, getAffectedRows, testConnection, dbType };
```

- [ ] **Step 4: Run transaction tests and confirm commit/rollback/release behavior**

Run from `server`: `node --test tests/transactionRunner.test.js`.

Expected: PASS for MySQL and PostgreSQL success, failure, placeholder conversion, insert ID, and release cases.

- [ ] **Step 5: Commit the transaction helper**

```bash
git add server/config/db-universal.js server/config/transactionRunner.js server/tests/transactionRunner.test.js
git commit -m "feat: add portable database transactions"
```

### Task 3: Implement student tip API, moderation rules, and permissions

**Files:**
- Create: `server/services/studentTipService.js`
- Create: `server/controllers/studentTipController.js`
- Create: `server/routes/studentTips.js`
- Create: `server/tests/studentTipService.test.js`
- Test: `server/tests/studentTipRoutes.test.js`
- Modify: `server/config/db-universal.js`
- Modify: `server/server.js`

**Interfaces:**
- `createStudentTipService({ query, insertAndGetId, withTransaction })` returns `createSuggestion(studentId, input)`, `listMine(studentId)`, `listPublished()`, `listReview({ status, search })`, and `reviewSuggestion({ suggestionId, reviewerId, action, reviewerNote, displayTitle, displaySummary, moduleId, contentType })`.
- Student payload uses camelCase: `{ contentId, title, url, audience, learningOutcome, recommendationReason, criticalCheck, shareWithStudents, displayFirstName }`. For an internal item, resolve its title and URL from a currently published `content` row; for an external item, require title and URL.
- Review actions are `start_review`, `publish`, `add_to_library`, `decline`, and `hide`. `add_to_library` requires an existing module and creates an unpublished content row and suggestion link in one transaction.
- Routes: `POST /api/student-tips`, `GET /api/student-tips/mine`, `GET /api/student-tips`, `GET /api/student-tips/review`, and `PATCH /api/student-tips/:id/review`.

- [ ] **Step 1: Write failing service tests with an injected fake query adapter**

Test that student list queries include that student's ID, published listing requires both `status = 'published'` and `share_with_students = true`, `publish` is rejected without consent, a 501-character URL cannot be converted to existing 500-character `content.url`, and a reviewer cannot update a missing ID. Assert that a failed content conversion does not call the suggestion update.

```js
test('published list never returns a teacher-only suggestion', async () => {
  const calls = [];
  const service = createStudentTipService({ query: async (sql, params) => { calls.push({ sql, params }); return [[], {}]; } });
  await service.listPublished();
  assert.match(calls[0].sql, /status = .*published/);
  assert.match(calls[0].sql, /share_with_students = true/);
});
```

- [ ] **Step 2: Run the service tests and confirm they fail**

Run from `server`: `node --test tests/studentTipService.test.js tests/studentTipRoutes.test.js`.

Expected: FAIL because the service module is missing.

- [ ] **Step 3: Implement the service, controller, and role-protected router**

Use parameterized `?` placeholders with `db-universal` so both drivers follow the shared conversion path. Scope `listMine` by `student_id`; strip reviewer fields and conditionally omit author name in `listPublished`; verify a referenced internal content item is published; implement URL duplicate detection as a warning field; and use the transaction helper for content insert plus suggestion update. Mount the router at `/api/student-tips`. Apply `protect` to all routes and `authorize('teacher', 'admin')` to `/review` and `/:id/review` only.

```js
router.get('/mine', protect, controller.getMine);
router.get('/review', protect, authorize('teacher', 'admin'), controller.getReviewQueue);
router.patch('/:id/review', protect, authorize('teacher', 'admin'), controller.review);
```

- [ ] **Step 4: Run service tests and inspect route authorization**

Run from `server`: `node --test tests/studentTipService.test.js`.

Expected: PASS for ownership, publication filtering, consent, rejection note, status transitions, length boundaries, duplicate warning, and atomic draft conversion. In the local API smoke test, verify unauthenticated calls receive 401, a student calling either review route receives 403, and malformed URLs or invalid review transitions receive 400 without database changes.

- [ ] **Step 5: Commit the API slice**

```bash
git add server/services/studentTipService.js server/controllers/studentTipController.js server/routes/studentTips.js server/tests/studentTipService.test.js server/tests/studentTipRoutes.test.js server/config/db-universal.js server/server.js
git commit -m "feat: add student tip review API"
```

### Task 4: Build the student-facing tips page and entry points

**Files:**
- Create: `client/src/pages/StudentTips.js`
- Create: `client/src/pages/StudentTips.css`
- Create: `client/src/utils/studentTips.js`
- Test: `client/src/utils/studentTips.test.js`
- Modify: `client/src/App.js`
- Modify: `client/src/pages/ContentView.js`
- Modify: `client/src/pages/Leermaterialen.js`
- Create: `client/src/utils/studentTipTranslations.js`
- Modify: `server/services/studentTipService.js` and `server/controllers/studentTipController.js` to return field-level validation errors for the student form.

**Interfaces:**
- `buildStudentTipPayload(formState)` returns the API's camelCase payload and defaults `shareWithStudents` and `displayFirstName` to `false`.
- Student page loads `GET /student-tips`, `GET /student-tips/mine`, and posts to `POST /student-tips` using the existing `api` Axios client.
- `GET /student-tips?contentId=<id>` preselects a published content item; the detail-page **Deel een tip** link passes its current content ID.

- [ ] **Step 1: Write failing payload and rendering-helper tests**

Test that both privacy choices default to false, a content recommendation serializes `contentId`, and external input serializes title/URL with all four learning-context fields. Test that an internal card links to `/content/:id` and an external card receives `target="_blank"` and `rel="noopener noreferrer"`.

```js
test('privacy choices default off in a student tip payload', () => {
  const validExternalTip = {
    title: 'AI uitgelegd',
    url: 'https://example.org/ai',
    audience: 'Studenten die beginnen met AI',
    learningOutcome: 'Ik begrijp wat een taalmodel doet',
    recommendationReason: 'De uitleg is concreet',
    criticalCheck: 'Controleer de voorbeelden op actualiteit'
  };
  const payload = buildStudentTipPayload(validExternalTip);
  assert.equal(payload.shareWithStudents, false);
  assert.equal(payload.displayFirstName, false);
});
```

- [ ] **Step 2: Run client tests and confirm they fail**

Run from `client`: `npm test -- --watchAll=false --runInBand src/utils/studentTips.test.js`.

Expected: FAIL because the helper module and test do not yet exist.

- [ ] **Step 3: Implement the student page and connect its entry points**

Build sections **Deel een tip**, **Studenttips**, and **Mijn tips**. Show only approved tips in the shared list and only the current student's rows in the status list. Keep submission private by default, display server validation errors beside fields, show the duplicate warning without blocking submit, and render status labels using `t()`. Add a protected `/studenttips` route. Add an entry from the library and a detail-page shortcut that preselects the current content. Add every new visible label and status in `prototypeTranslations.js` for `nl` and `en`.

```js
<Route path="/studenttips" element={<ProtectedRoute><StudentTips /></ProtectedRoute>} />
```

- [ ] **Step 4: Run focused tests and the client build**

Run from `client`: `npm test -- --watchAll=false --runInBand src/utils/studentTips.test.js` and `npm run build`.

Expected: PASS; build completes without missing translation imports, route errors, or lint failures.

- [ ] **Step 5: Commit the student slice**

```bash
git add client/src/pages/StudentTips.js client/src/pages/StudentTips.css client/src/utils/studentTips.js client/src/utils/studentTips.test.js client/src/utils/studentTipTranslations.js client/src/App.js client/src/pages/ContentView.js client/src/pages/Leermaterialen.js server/services/studentTipService.js server/controllers/studentTipController.js
git commit -m "feat: add student tip submission and discovery"
```

### Task 5: Build the teacher/admin review queue

**Files:**
- Create: `client/src/pages/StudentTipReview.js`
- Create: `client/src/pages/StudentTipReview.css`
- Create: `client/src/utils/studentTipReview.js`
- Test: `client/src/utils/studentTipReview.test.js`
- Modify: `client/src/App.js`
- Modify: `client/src/components/layout/Navbar.js`
- Modify: `client/src/utils/studentTipTranslations.js`

**Interfaces:**
- Add a `ReviewerRoute` that waits for auth loading, redirects unauthenticated users to `/login`, and redirects roles other than `teacher` or `admin` to `/dashboard`.
- Reviewer page reads `GET /student-tips/review?status=<status>&search=<text>` and sends `{ action, reviewerNote, displayTitle, displaySummary, moduleId, contentType }` to `PATCH /student-tips/:id/review`.

- [ ] **Step 1: Write failing review-action formatting tests**

Add cases for decline requiring a note, conversion requiring a module and a title, and hiding an already published tip. Assert the exact PATCH payload for `add_to_library`.

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildReviewPayload } = require('../utils/studentTipReview');

test('decline action includes the review note', () => {
  assert.deepEqual(buildReviewPayload({ action: 'decline', reviewerNote: 'Bron ontbreekt.' }), {
    action: 'decline', reviewerNote: 'Bron ontbreekt.'
  });
});
```

- [ ] **Step 2: Run the review helper tests and confirm they fail**

Run from `client`: `npm test -- --watchAll=false --runInBand src/utils/studentTipReview.test.js`.

Expected: FAIL because the review payload helper is not present.

- [ ] **Step 3: Implement reviewer page, route guard, and menu link**

Show status filters, title/URL search, duplicate warning, student context, sharing/name preferences, and reviewer-only author identity. Provide actions to start review, publish a shared tip, convert an external tip to a content draft by selecting a module and title, decline with a required note, and hide a published tip. Refresh the queue and **Mijn tips** after successful changes. Add a reviewer menu link for both teacher and admin without granting either role access to the existing general `/admin` page. Add and verify all NL/ENG labels.

```js
<Route path="/docent/studenttips" element={<ReviewerRoute><StudentTipReview /></ReviewerRoute>} />
```

- [ ] **Step 4: Run review tests and client build**

Run from `client`: `npm test -- --watchAll=false --runInBand src/utils/studentTipReview.test.js` and `npm run build`.

Expected: PASS; a student cannot reach the review route, and reviewer actions send only the documented action fields.

- [ ] **Step 5: Commit the review UI**

```bash
git add client/src/pages/StudentTipReview.js client/src/pages/StudentTipReview.css client/src/utils/studentTipReview.js client/src/utils/studentTipReview.test.js client/src/App.js client/src/components/layout/Navbar.js client/src/utils/studentTipTranslations.js
git commit -m "feat: add teacher student tip inbox"
```

### Task 6: Verify the full tip lifecycle

**Files:**
- Modify only files that fail a check in Tasks 1–5.
- Test: `server/tests/studentTipRules.test.js`, `server/tests/transactionRunner.test.js`, `server/tests/studentTipService.test.js`, `client/src/utils/studentTips.test.js`, and `client/src/utils/studentTipReview.test.js`.

**Interfaces:**
- Full lifecycle: student submit → reviewer inbox → publish shared tip or create hidden content draft → student sees status and approved content → reviewer hides published tip.

- [ ] **Step 1: Run all server unit tests**

Run from `server`: `node --test tests/studentTipRules.test.js tests/transactionRunner.test.js tests/studentTipService.test.js`.

Expected: PASS with no test requiring a live production database.

- [ ] **Step 2: Run all client unit tests and production build**

Run from `client`: `npm test -- --watchAll=false --runInBand` and `npm run build`.

Expected: PASS; no test hangs in watch mode and the production build succeeds.

- [ ] **Step 3: Apply the additive migration to the configured development database**

Run from `server`: `npm run db:migrate:student-tips`.

Expected: migration chooses the configured dialect, creates the new table/indexes once, and leaves existing rows intact. If both local database engines are configured, run once against each using separate environment settings.

- [ ] **Step 4: Smoke-test roles, languages, and lifecycle in the local app**

As a student, submit one internal tip, one external tip, one private tip, and one shared tip. As a teacher, verify the inbox and review actions; as an admin, verify the same actions; as a student, confirm the reviewer route is denied and only published shared tips are visible. Repeat submission/status views in NL and ENG. Confirm no name appears unless selected and no review note appears in the shared API response.

- [ ] **Step 5: Review the final diff and commit any integration fixes**

Run `git diff --check` and `git status --short`. Confirm only student-tip implementation files changed, all pre-existing user edits remain untouched, and no database reset/seed command ran. Commit any fixes with `git add <exact changed paths>` and `git commit -m "fix: complete student tip lifecycle checks"`.

## Spec Coverage Self-Review

- Student submission for internal or external resources: Tasks 1, 3, and 4.
- Own-only status page and server-side ownership: Tasks 3 and 4.
- No access to unapproved or hidden tips: Tasks 3 and 6.
- Teacher/admin moderation, rejection explanation, and content draft conversion: Tasks 2, 3, and 5.
- Consent-controlled publication and author name: Tasks 1, 3, and 4.
- NL/ENG student and reviewer interfaces: Tasks 4, 5, and 6.
- Additive MySQL/PostgreSQL schema and safe migration: Tasks 1 and 6.
- Duplicate warning, safe URL validation, and field length checks: Tasks 1 and 3.
