const VALID_AVAILABILITY = new Set(['available', 'no_video', 'upcoming']);
const SOURCE_HOST = 'aivoorstudenten.nl';
const YOUTUBE_HOSTS = new Set(['youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtube.com', 'www.youtube.com']);
const EMBED_PATH = /^\/embed\/[A-Za-z0-9_-]{11}$/;

function getAiStudentLessons(manifest) {
  if (!manifest || !Array.isArray(manifest.courses)) return [];
  return manifest.courses.flatMap((course) => (Array.isArray(course.lessons) ? course.lessons : []).map((lesson) => ({
    provider: course.provider,
    courseVersion: String(course.courseVersion),
    externalId: String(lesson.externalId),
    title: lesson.title,
    lessonUrl: lesson.lessonUrl,
    ...(lesson.videoUrl ? { videoUrl: lesson.videoUrl } : {}),
    availabilityStatus: lesson.availabilityStatus,
    ...(lesson.unavailableReason ? { unavailableReason: lesson.unavailableReason } : {}),
    ...(Number.isFinite(lesson.durationMinutes) ? { durationMinutes: lesson.durationMinutes } : {}),
  })));
}

function validateAiStudentLesson(lesson) {
  const errors = [];
  if (!lesson || typeof lesson !== 'object') return { errors: ['Lesson must be an object.'] };
  if (!['2025', '2026'].includes(String(lesson.courseVersion))) errors.push('Course version must be 2025 or 2026.');
  if (!String(lesson.externalId || '').trim()) errors.push('External lesson ID is required.');
  if (!String(lesson.title || '').trim()) errors.push('Lesson title is required.');

  let sourceUrl;
  try { sourceUrl = new URL(lesson.lessonUrl); } catch { errors.push('Lesson page URL must be a valid HTTPS URL.'); }
  if (sourceUrl && (sourceUrl.protocol !== 'https:' || sourceUrl.hostname !== SOURCE_HOST || sourceUrl.username || sourceUrl.password)) {
    errors.push('Lesson page URL must use the official HTTPS source domain.');
  }

  if (!VALID_AVAILABILITY.has(lesson.availabilityStatus)) errors.push('Availability status is invalid.');
  if (lesson.availabilityStatus === 'available') {
    let videoUrl;
    try { videoUrl = new URL(lesson.videoUrl); } catch { errors.push('Available lessons require a valid HTTPS YouTube embed URL.'); }
    if (videoUrl && (videoUrl.protocol !== 'https:' || !YOUTUBE_HOSTS.has(videoUrl.hostname) || !EMBED_PATH.test(videoUrl.pathname) || videoUrl.username || videoUrl.password)) {
      errors.push('Available lessons require a valid HTTPS YouTube embed URL.');
    }
  } else if (lesson.videoUrl) {
    errors.push('Unavailable lessons cannot include a video URL.');
  }
  if (lesson.availabilityStatus !== 'available' && !String(lesson.unavailableReason || '').trim()) errors.push('Unavailable lessons require a reason.');
  if (lesson.durationMinutes !== undefined && (!Number.isFinite(lesson.durationMinutes) || lesson.durationMinutes <= 0)) errors.push('Video duration must be a positive number.');
  return { errors };
}

module.exports = { getAiStudentLessons, validateAiStudentLesson };


