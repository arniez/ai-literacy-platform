const {
  normalizeTipUrl,
  validateTipSubmission,
  validateTipReview
} = require('../utils/studentTipRules');

const URL_LIMIT = 500;
const REVIEW_TEXT_LIMIT = 2000;
const CONTENT_TITLE_LIMIT = 200;
const CONTENT_TYPES = new Set(['cursus', 'video', 'podcast', 'game', 'praktijkvoorbeeld', 'artikel']);
const STATUSES = new Set(['submitted', 'in_review', 'published', 'added', 'declined', 'hidden']);

function tipError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isEnabled(value) {
  return value === true || value === 1 || value === '1';
}

function createStudentTipService({ query, insertAndGetId, withTransaction } = {}) {
  if (typeof query !== 'function') throw new Error('A query adapter is required.');

  async function findSuggestion(suggestionId) {
    const id = Number(suggestionId);
    if (!Number.isInteger(id) || id < 1) throw tipError('Ongeldig tipnummer.');
    const [rows] = await query('SELECT * FROM student_suggestions WHERE id = ?', [id]);
    if (!rows.length) throw tipError('Deze studenttip bestaat niet (meer).', 404);
    return rows[0];
  }

  async function checkTransition(suggestion, action, reviewerNote) {
    const validation = validateTipReview({
      currentStatus: suggestion.status,
      action,
      shareWithStudents: isEnabled(suggestion.share_with_students),
      reviewerNote
    });
    if (validation.error) throw tipError(validation.error);
  }

  async function createSuggestion(studentId, input = {}) {
    if (typeof insertAndGetId !== 'function') throw new Error('An insert adapter is required.');
    const validation = validateTipSubmission(input);
    if (validation.errors.length) throw tipError(validation.errors.join(' '));

    const isInternal = input.contentId !== undefined && input.contentId !== null && input.contentId !== '';
    let title = typeof input.title === 'string' ? input.title.trim() : '';
    let url = validation.normalizedUrl;
    let contentId = null;

    if (isInternal) {
      contentId = Number(input.contentId);
      const [contentRows] = await query(
        'SELECT id, title, url FROM content WHERE id = ? AND is_published = true',
        [contentId]
      );
      if (!contentRows.length) throw tipError('Kies gepubliceerd leermateriaal.', 404);
      title = contentRows[0].title;
      url = contentRows[0].url || '';
    } else if (url.length > URL_LIMIT) {
      throw tipError(`De genormaliseerde bronlink is langer dan ${URL_LIMIT} tekens.`);
    }

    let duplicateWarning = false;
    if (contentId !== null) {
      const [duplicates] = await query(
        'SELECT id FROM student_suggestions WHERE content_id = ? LIMIT 1',
        [contentId]
      );
      duplicateWarning = duplicates.length > 0;
    } else {
      const [duplicates] = await query(
        `SELECT id FROM student_suggestions WHERE url = ?
         UNION SELECT id FROM content WHERE url = ? LIMIT 1`,
        [url, url]
      );
      duplicateWarning = duplicates.length > 0;
    }

    const id = await insertAndGetId(
      `INSERT INTO student_suggestions (
        student_id, content_id, title, url, audience, learning_outcome,
        recommendation_reason, critical_check, share_with_students, display_first_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        studentId,
        contentId,
        title.trim(),
        url,
        input.audience.trim(),
        input.learningOutcome.trim(),
        input.recommendationReason.trim(),
        input.criticalCheck.trim(),
        input.shareWithStudents === true,
        input.displayFirstName === true
      ]
    );

    return { id, status: 'submitted', duplicateWarning };
  }

  async function listMine(studentId) {
    const [rows] = await query(
      `SELECT id, content_id, converted_content_id, title, url, audience, learning_outcome,
              recommendation_reason, critical_check, share_with_students, display_first_name,
              status, reviewer_note, display_title, display_summary, created_at, updated_at, reviewed_at
       FROM student_suggestions
       WHERE student_id = ?
       ORDER BY created_at DESC, id DESC`,
      [studentId]
    );
    return rows;
  }

  async function listPublished() {
    const [rows] = await query(
      `SELECT s.id, s.content_id, s.title, s.url, s.audience, s.learning_outcome,
              s.recommendation_reason, s.critical_check, s.display_title, s.display_summary,
              CASE WHEN s.display_first_name = true THEN u.first_name ELSE NULL END AS student_first_name,
              s.created_at
       FROM student_suggestions s
       LEFT JOIN users u ON u.id = s.student_id
       WHERE s.status = 'published' AND s.share_with_students = true
       ORDER BY s.reviewed_at DESC, s.id DESC`
    );
    return rows;
  }

  async function listReview({ status, search } = {}) {
    const conditions = [];
    const params = [];
    if (status && status !== 'all') {
      if (!STATUSES.has(status)) throw tipError('Ongeldige tipstatus.');
      conditions.push('s.status = ?');
      params.push(status);
    }
    if (typeof search === 'string' && search.trim()) {
      conditions.push('(LOWER(s.title) LIKE LOWER(?) OR LOWER(s.url) LIKE LOWER(?))');
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await query(
      `SELECT s.*, u.first_name, u.last_name, u.email,
              CASE WHEN EXISTS (
                SELECT 1 FROM student_suggestions duplicate
                WHERE duplicate.id <> s.id AND duplicate.url = s.url
              ) OR EXISTS (
                SELECT 1 FROM content existing WHERE existing.url = s.url
              ) THEN true ELSE false END AS duplicate_warning
       FROM student_suggestions s
       JOIN users u ON u.id = s.student_id
       ${where}
       ORDER BY CASE WHEN s.status = 'submitted' THEN 0 ELSE 1 END, s.created_at ASC, s.id ASC`,
      params
    );
    return rows;
  }

  async function convertToLibrary({ suggestion, suggestionId, reviewerId, reviewerNote, displayTitle, displaySummary, moduleId, contentType }) {
    if (typeof withTransaction !== 'function') {
      throw new Error('A transaction adapter is required to convert a studenttip.');
    }
    const id = Number(suggestionId);
    const targetModuleId = Number(moduleId);
    const title = typeof displayTitle === 'string' ? displayTitle.trim() : '';
    const summary = typeof displaySummary === 'string' && displaySummary.trim()
      ? displaySummary.trim()
      : suggestion.recommendation_reason;

    if (suggestion.content_id) throw tipError('Alleen een externe tip kan als nieuw concept worden toegevoegd.');
    if (typeof suggestion.url !== 'string' || suggestion.url.length > URL_LIMIT) {
      throw tipError(`De bronlink is langer dan ${URL_LIMIT} tekens en past niet in leermateriaal.`);
    }
    if (!normalizeTipUrl(suggestion.url)) throw tipError('De tip bevat geen geldige http- of https-bronlink.');
    if (!title) throw tipError('Vul een titel in voor het concept.');
    if (title.length > CONTENT_TITLE_LIMIT) throw tipError(`De titel is langer dan ${CONTENT_TITLE_LIMIT} tekens.`);
    if (summary.length > REVIEW_TEXT_LIMIT) throw tipError(`De samenvatting is langer dan ${REVIEW_TEXT_LIMIT} tekens.`);
    if (!Number.isInteger(targetModuleId) || targetModuleId < 1) throw tipError('Kies een geldige module.');
    if (!CONTENT_TYPES.has(contentType)) throw tipError('Kies een geldig type leermateriaal.');

    return withTransaction(async ({ query: transactionQuery, insertAndGetId: transactionInsert }) => {
      const [lockedRows] = await transactionQuery(
        'SELECT * FROM student_suggestions WHERE id = ? FOR UPDATE',
        [id]
      );
      if (!lockedRows.length) throw tipError('Deze studenttip bestaat niet (meer).', 404);
      const current = lockedRows[0];
      await checkTransition(current, 'add_to_library', reviewerNote);
      if (current.content_id) throw tipError('Alleen een externe tip kan als nieuw concept worden toegevoegd.');
      if (typeof current.url !== 'string' || current.url.length > URL_LIMIT || !normalizeTipUrl(current.url)) {
        throw tipError(`De bronlink is ongeldig of langer dan ${URL_LIMIT} tekens.`);
      }

      const [modules] = await transactionQuery('SELECT id FROM modules WHERE id = ?', [targetModuleId]);
      if (!modules.length) throw tipError('De gekozen module bestaat niet.');

      const convertedContentId = await transactionInsert(
        `INSERT INTO content (
          module_id, title, description, content_type, url, is_published, source, points_reward
        ) VALUES (?, ?, ?, ?, ?, false, 'student tip', 0)`,
        [targetModuleId, title, summary, contentType, current.url]
      );
      await transactionQuery(
        `UPDATE student_suggestions
         SET status = 'added', converted_content_id = ?, reviewer_id = ?, reviewer_note = ?,
             display_title = ?, display_summary = ?, reviewed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [convertedContentId, reviewerId, reviewerNote?.trim() || null, title, summary, id]
      );
      return { id, status: 'added', convertedContentId, duplicateWarning: false };
    });
  }

  async function reviewSuggestion({
    suggestionId,
    reviewerId,
    action,
    reviewerNote,
    displayTitle,
    displaySummary,
    moduleId,
    contentType
  } = {}) {
    const suggestion = await findSuggestion(suggestionId);
    await checkTransition(suggestion, action, reviewerNote);

    if (action === 'add_to_library') {
      return convertToLibrary({
        suggestion,
        suggestionId,
        reviewerId,
        reviewerNote,
        displayTitle,
        displaySummary,
        moduleId,
        contentType
      });
    }

    const statusByAction = {
      start_review: 'in_review',
      publish: 'published',
      decline: 'declined',
      hide: 'hidden'
    };
    const nextStatus = statusByAction[action];
    const nextTitle = typeof displayTitle === 'string' && displayTitle.trim()
      ? displayTitle.trim()
      : (suggestion.display_title || suggestion.title);
    const nextSummary = typeof displaySummary === 'string' && displaySummary.trim()
      ? displaySummary.trim()
      : (suggestion.display_summary || suggestion.recommendation_reason);

    if (nextTitle.length > CONTENT_TITLE_LIMIT) throw tipError(`De titel is langer dan ${CONTENT_TITLE_LIMIT} tekens.`);
    if (nextSummary && nextSummary.length > REVIEW_TEXT_LIMIT) throw tipError(`De samenvatting is langer dan ${REVIEW_TEXT_LIMIT} tekens.`);

    await query(
      `UPDATE student_suggestions
       SET status = ?, reviewer_id = ?, reviewer_note = ?, display_title = ?, display_summary = ?,
           reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextStatus, reviewerId, reviewerNote?.trim() || null, nextTitle, nextSummary || null, suggestion.id]
    );
    return { id: suggestion.id, status: nextStatus, duplicateWarning: false };
  }

  return { createSuggestion, listMine, listPublished, listReview, reviewSuggestion };
}

module.exports = { createStudentTipService };
