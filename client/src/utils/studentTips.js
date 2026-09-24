import { translateStudentTipText } from './studentTipTranslations';

export function buildStudentTipPayload(formState = {}) {
  const contentId = formState.type === 'internal' && formState.contentId
    ? Number(formState.contentId)
    : null;
  const payload = {
    contentId: Number.isInteger(contentId) && contentId > 0 ? contentId : null,
    audience: (formState.audience || '').trim(),
    learningOutcome: (formState.learningOutcome || '').trim(),
    recommendationReason: (formState.recommendationReason || '').trim(),
    criticalCheck: (formState.criticalCheck || '').trim(),
    shareWithStudents: formState.shareWithStudents === true,
    displayFirstName: formState.shareWithStudents === true && formState.displayFirstName === true
  };

  if (payload.contentId) return payload;
  return {
    ...payload,
    title: (formState.title || '').trim(),
    url: (formState.url || '').trim()
  };
}

export function getStudentTipCardModel(tip = {}) {
  const contentId = tip.content_id || tip.contentId;
  const title = tip.display_title || tip.displayTitle || tip.title || '';
  const description = tip.display_summary || tip.displaySummary || tip.recommendation_reason || tip.recommendationReason || '';

  if (contentId) {
    return { href: `/content/${contentId}`, external: false, target: undefined, rel: undefined, title, description };
  }

  let href = null;
  try {
    const parsed = new URL(tip.url);
    if (['http:', 'https:'].includes(parsed.protocol) && parsed.hostname && !parsed.username && !parsed.password) {
      parsed.hash = '';
      href = parsed.toString();
    }
  } catch {
    href = null;
  }

  return {
    href,
    external: true,
    target: href ? '_blank' : undefined,
    rel: href ? 'noopener noreferrer' : undefined,
    title,
    description
  };
}

export function localizeTipValidationErrors(errors = [], language = 'nl') {
  if (language !== 'en') return errors;
  const fieldNames = {
    title: 'Title',
    url: 'Source link',
    audience: 'Audience',
    learningOutcome: 'Learning outcome',
    recommendationReason: 'Why you recommend it',
    criticalCheck: 'What to check critically'
  };

  return errors.map((message) => {
    const field = Object.keys(fieldNames).find((name) => message.startsWith(`${name} `));
    const label = fieldNames[field] || 'This field';
    const maxLength = message.match(/langer dan (\d+) tekens/);
    if (/is verplicht/.test(message)) return `${label} is required.`;
    if (maxLength) return `${label} must be ${maxLength[1]} characters or fewer.`;
    if (/http- of https-link/.test(message)) return 'Enter a valid http or https link.';
    return 'Check this value and try again.';
  });
}

export { translateStudentTipText };
