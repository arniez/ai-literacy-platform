const URL_LIMIT = 500;
const FIELD_LIMITS = {
  title: 200,
  audience: 200,
  learningOutcome: 2000,
  recommendationReason: 2000,
  criticalCheck: 2000
};
const REVIEW_TEXT_LIMIT = 2000;

function normalizeTipUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const parsed = new URL(value.trim());
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) return null;
    if (parsed.username || parsed.password) return null;
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

function validateTipSubmission(input = {}) {
  const errors = [];
  const isInternal = input.contentId !== undefined && input.contentId !== null && input.contentId !== '';
  let normalizedUrl = null;

  if (isInternal) {
    if (!Number.isInteger(Number(input.contentId)) || Number(input.contentId) < 1) {
      errors.push('Kies geldige bestaande leermateriaal.');
    }
  } else {
    const title = input.title;
    if (typeof title !== 'string' || !title.trim()) {
      errors.push('title is verplicht.');
    } else if (title.trim().length > FIELD_LIMITS.title) {
      errors.push(`title is langer dan ${FIELD_LIMITS.title} tekens.`);
    }

    if (typeof input.url !== 'string' || !input.url.trim()) {
      errors.push('url is verplicht.');
    } else if (input.url.trim().length > URL_LIMIT) {
      errors.push(`url is langer dan ${URL_LIMIT} tekens.`);
    } else {
      normalizedUrl = normalizeTipUrl(input.url);
      if (!normalizedUrl) errors.push('Gebruik een geldige http- of https-link.');
    }
  }

  for (const field of ['audience', 'learningOutcome', 'recommendationReason', 'criticalCheck']) {
    const value = input[field];
    const limit = field === 'audience' ? FIELD_LIMITS.audience : REVIEW_TEXT_LIMIT;
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`${field} is verplicht.`);
    } else if (value.trim().length > limit) {
      errors.push(`${field} is langer dan ${limit} tekens.`);
    }
  }

  return { errors, normalizedUrl };
}

const ALLOWED_ACTIONS = {
  submitted: ['start_review'],
  in_review: ['publish', 'add_to_library', 'decline'],
  published: ['hide'],
  hidden: ['publish'],
  added: [],
  declined: []
};

function validateTipReview({ currentStatus, action, shareWithStudents, reviewerNote } = {}) {
  const actions = ALLOWED_ACTIONS[currentStatus];
  if (!actions || !actions.includes(action)) {
    return { error: 'Deze statuswijziging is niet toegestaan.' };
  }

  if (action === 'publish' && shareWithStudents !== true) {
    return { error: 'De student heeft geen toestemming gegeven om deze tip te delen.' };
  }

  if (action === 'decline' && (typeof reviewerNote !== 'string' || !reviewerNote.trim())) {
    return { error: 'Een afwijzing vraagt om een toelichting.' };
  }

  if (typeof reviewerNote === 'string' && reviewerNote.trim().length > REVIEW_TEXT_LIMIT) {
    return { error: `De toelichting is langer dan ${REVIEW_TEXT_LIMIT} tekens.` };
  }

  return { error: null };
}

module.exports = {
  normalizeTipUrl,
  validateTipSubmission,
  validateTipReview
};
