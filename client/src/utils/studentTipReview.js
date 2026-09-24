const ALLOWED_ACTIONS = {
  submitted: ['start_review'],
  in_review: ['publish', 'add_to_library', 'decline'],
  published: ['hide'],
  hidden: ['publish'],
  added: [],
  declined: []
};
const CONTENT_TYPES = new Set(['cursus', 'video', 'podcast', 'game', 'praktijkvoorbeeld', 'artikel']);

function buildReviewPayload({
  action,
  currentStatus,
  reviewerNote,
  displayTitle,
  displaySummary,
  moduleId,
  contentType,
  shareWithStudents
} = {}) {
  if (!ALLOWED_ACTIONS[currentStatus]?.includes(action)) {
    throw new Error('Deze actie past niet bij de huidige tipstatus.');
  }
  if (action === 'publish' && shareWithStudents !== true) {
    throw new Error('Deze tip mag zonder toestemming niet worden gedeeld.');
  }

  const note = typeof reviewerNote === 'string' ? reviewerNote.trim() : '';
  if (action === 'decline' && !note) throw new Error('Een afwijzing vraagt om een toelichting.');
  if (note.length > 2000) throw new Error('De toelichting mag maximaal 2000 tekens bevatten.');

  const payload = { action };
  if (note) payload.reviewerNote = note;

  if (action === 'publish' || action === 'add_to_library') {
    const title = typeof displayTitle === 'string' ? displayTitle.trim() : '';
    const summary = typeof displaySummary === 'string' ? displaySummary.trim() : '';
    if (!title) throw new Error('Vul een titel in.');
    if (title.length > 200) throw new Error('De titel mag maximaal 200 tekens bevatten.');
    if (summary.length > 2000) throw new Error('De samenvatting mag maximaal 2000 tekens bevatten.');
    payload.displayTitle = title;
    if (summary) payload.displaySummary = summary;
  }

  if (action === 'add_to_library') {
    const parsedModuleId = Number(moduleId);
    if (!Number.isInteger(parsedModuleId) || parsedModuleId < 1) throw new Error('Kies een geldige module.');
    if (!CONTENT_TYPES.has(contentType)) throw new Error('Kies een geldig type leermateriaal.');
    payload.moduleId = parsedModuleId;
    payload.contentType = contentType;
  }

  return payload;
}

module.exports = { buildReviewPayload };
