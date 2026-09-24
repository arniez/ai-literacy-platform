const { getAiStudentLessons, validateAiStudentLesson } = require('../utils/aiStudentLessonManifest');

const MANIFEST = require('../data/ai-student-lesson-manifest.json');

function integrationError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createAiStudentIntegrationService({ query, insertAndGetId, withTransaction, manifest = MANIFEST } = {}) {
  if (typeof query !== 'function') throw new Error('A query adapter is required.');
  if (typeof insertAndGetId !== 'function') throw new Error('An insert adapter is required.');
  if (typeof withTransaction !== 'function') throw new Error('A transaction adapter is required.');

  async function importCatalog() {
    const lessons = getAiStudentLessons(manifest);
    if (!lessons.length) throw integrationError('The AI student lesson catalog is empty.');
    const invalid = lessons.flatMap((lesson) => validateAiStudentLesson(lesson).errors.map((message) => `${lesson.externalId}: ${message}`));
    if (invalid.length) throw integrationError(`The AI student lesson catalog is invalid: ${invalid.join(' ')}`);

    return withTransaction(async ({ query: transactionQuery, insertAndGetId: transactionInsert }) => {
      let contentCreated = 0;
      let mappingsCreated = 0;
      for (const lesson of lessons) {
        const [existingRows] = await transactionQuery(
          `SELECT * FROM external_lessons
           WHERE provider = ? AND course_version = ? AND external_id = ?
           FOR UPDATE`,
          [lesson.provider, lesson.courseVersion, lesson.externalId]
        );
        let existing = existingRows[0] || null;
        let contentId = existing?.content_id ?? null;

        if (lesson.availabilityStatus === 'available' && !contentId) {
          contentId = await transactionInsert(
            `INSERT INTO content (
              title, description, content_type, url, duration, is_published, source, points_reward
            ) VALUES (?, ?, 'video', ?, ?, false, 'aivoorstudenten', 0)`,
            [lesson.title, `Video uit AI voor studenten (${lesson.courseVersion}), les ${lesson.externalId}.`, lesson.videoUrl, lesson.durationMinutes ?? null]
          );
          contentCreated += 1;
        }

        if (existing) {
          await transactionQuery(
            `UPDATE external_lessons
             SET title = ?, lesson_url = ?, video_url = ?, video_duration_minutes = ?,
                 availability_status = ?, unavailable_reason = ?, content_id = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [lesson.title, lesson.lessonUrl, lesson.videoUrl ?? null, lesson.durationMinutes ?? null, lesson.availabilityStatus, lesson.unavailableReason ?? null, contentId, existing.id]
          );
          if (contentId) {
            await transactionQuery(
              `UPDATE content SET title = ?, description = ?, url = ?, duration = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [lesson.title, `Video uit AI voor studenten (${lesson.courseVersion}), les ${lesson.externalId}.`, lesson.videoUrl ?? null, lesson.durationMinutes ?? null, contentId]
            );
            if (lesson.availabilityStatus !== 'available') {
              await transactionQuery('UPDATE content SET is_published = false WHERE id = ?', [contentId]);
            }
          }
        } else {
          await transactionInsert(
            `INSERT INTO external_lessons (
              provider, course_version, external_id, title, lesson_url, video_url,
              video_duration_minutes, availability_status, unavailable_reason, content_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [lesson.provider, lesson.courseVersion, lesson.externalId, lesson.title, lesson.lessonUrl, lesson.videoUrl ?? null, lesson.durationMinutes ?? null, lesson.availabilityStatus, lesson.unavailableReason ?? null, contentId]
          );
          mappingsCreated += 1;
        }
      }
      return { imported: lessons.length, mappingsCreated, contentCreated };
    });
  }

  async function listLessons(courseVersion) {
    if (!['2025', '2026'].includes(String(courseVersion))) throw integrationError('Choose course version 2025 or 2026.');
    const [rows] = await query(
      `SELECT external_lessons.id, external_lessons.provider, external_lessons.course_version,
              external_lessons.external_id, external_lessons.title, external_lessons.lesson_url,
              external_lessons.video_url, external_lessons.video_duration_minutes,
              external_lessons.availability_status, external_lessons.unavailable_reason,
              external_lessons.content_id, content.is_published
       FROM external_lessons
       LEFT JOIN content ON content.id = external_lessons.content_id
       WHERE external_lessons.course_version = ?
       ORDER BY external_lessons.external_id`,
      [String(courseVersion)]
    );
    return rows;
  }

  async function setPublication(lessonId, isPublished) {
    const id = Number(lessonId);
    if (!Number.isInteger(id) || id < 1) throw integrationError('Invalid AI student lesson ID.');
    if (typeof isPublished !== 'boolean') throw integrationError('Publication must be true or false.');
    const [rows] = await query('SELECT * FROM external_lessons WHERE id = ?', [id]);
    const lesson = rows[0];
    if (!lesson) throw integrationError('AI student lesson not found.', 404);
    if (isPublished) {
      if (lesson.availability_status !== 'available' || !lesson.content_id) {
        throw integrationError('This lesson is not yet available for students.');
      }
      const validation = validateAiStudentLesson({
        provider: lesson.provider,
        courseVersion: lesson.course_version,
        externalId: lesson.external_id,
        title: lesson.title,
        lessonUrl: lesson.lesson_url,
        videoUrl: lesson.video_url,
        availabilityStatus: lesson.availability_status,
        durationMinutes: lesson.video_duration_minutes ?? undefined,
      });
      if (validation.errors.length) throw integrationError('This lesson does not have a valid video source.');
    }
    if (lesson.content_id) {
      await query('UPDATE content SET is_published = ? WHERE id = ?', [isPublished, lesson.content_id]);
    }
    return { id: lesson.id, contentId: lesson.content_id, isPublished };
  }

  return { importCatalog, listLessons, setPublication };
}

module.exports = { createAiStudentIntegrationService };
