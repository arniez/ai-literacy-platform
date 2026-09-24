import { translateAiStudent } from './aiStudentTranslations';

export function buildPublicationChange(lesson, isPublished, language = 'nl') {
  if (typeof isPublished !== 'boolean') {
    throw new Error(translateAiStudent('invalidPublication', language));
  }
  if (isPublished && lesson?.availability_status !== 'available') {
    const error = new Error(translateAiStudent('publishUnavailable', language));
    error.code = 'LESSON_NOT_AVAILABLE';
    throw error;
  }
  return { isPublished };
}
