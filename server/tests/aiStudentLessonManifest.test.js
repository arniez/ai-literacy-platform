const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getAiStudentLessons, validateAiStudentLesson } = require('../utils/aiStudentLessonManifest');
const manifest = require('../data/ai-student-lesson-manifest.json');

test('the initial source catalog keeps 2025 and 2026 lessons separate', () => {
  const lessons = getAiStudentLessons(manifest);
  assert.equal(lessons.filter((lesson) => lesson.courseVersion === '2025').length, 54);
  assert.equal(lessons.filter((lesson) => lesson.courseVersion === '2026').length, 60);
  assert.equal(lessons.filter((lesson) => lesson.courseVersion === '2025' && lesson.availabilityStatus === 'available').length, 39);
  assert.ok(lessons.filter((lesson) => lesson.courseVersion === '2026').every((lesson) => lesson.availabilityStatus === 'upcoming' && !lesson.videoUrl));
});

test('the manifest contains unique IDs and validates all publishable source records', () => {
  const lessons = getAiStudentLessons(manifest);
  const identities = lessons.map(({ provider, courseVersion, externalId }) => `${provider}:${courseVersion}:${externalId}`);
  assert.equal(new Set(identities).size, lessons.length);
  assert.equal(lessons.filter((lesson) => lesson.courseVersion === '2025' && lesson.availabilityStatus === 'no_video').length, 15);
  assert.ok(lessons.every((lesson) => validateAiStudentLesson(lesson).errors.length === 0));
});

test('an available lesson requires an HTTPS source and supported embed URL', () => {
  assert.equal(validateAiStudentLesson({ courseVersion: '2025', externalId: 'one', title: 'Lesson', lessonUrl: 'https://aivoorstudenten.nl/lesson', availabilityStatus: 'available', videoUrl: 'https://www.youtube-nocookie.com/embed/abc12345678' }).errors.length, 0);
  assert.ok(validateAiStudentLesson({ courseVersion: '2025', externalId: 'two', title: 'Lesson', lessonUrl: 'https://aivoorstudenten.nl/lesson', availabilityStatus: 'available', videoUrl: 'javascript:alert(1)' }).errors.length > 0);
});
