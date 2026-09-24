const { buildReviewPayload } = require('./studentTipReview');

test('decline actions require a reviewer note and include the trimmed note', () => {
  expect(() => buildReviewPayload({ action: 'decline', currentStatus: 'in_review' })).toThrow(/toelichting/i);
  expect(buildReviewPayload({ action: 'decline', currentStatus: 'in_review', reviewerNote: '  Bron ontbreekt.  ' })).toEqual({
    action: 'decline',
    reviewerNote: 'Bron ontbreekt.'
  });
});

test('conversion requires a module and a title', () => {
  expect(() => buildReviewPayload({ action: 'add_to_library', currentStatus: 'in_review', displayTitle: 'Tip' })).toThrow(/module/i);
  expect(() => buildReviewPayload({ action: 'add_to_library', currentStatus: 'in_review', moduleId: 4 })).toThrow(/titel/i);
});

test('conversion sends only the documented review fields', () => {
  expect(buildReviewPayload({
    action: 'add_to_library',
    currentStatus: 'in_review',
    reviewerNote: ' Goed idee ',
    displayTitle: 'AI leren',
    displaySummary: 'Een praktische video',
    moduleId: '8',
    contentType: 'video',
    studentId: 99,
    internalFlag: true
  })).toEqual({
    action: 'add_to_library',
    reviewerNote: 'Goed idee',
    displayTitle: 'AI leren',
    displaySummary: 'Een praktische video',
    moduleId: 8,
    contentType: 'video'
  });
});

test('hide is valid only for a published tip', () => {
  expect(buildReviewPayload({ action: 'hide', currentStatus: 'published' })).toEqual({ action: 'hide' });
  expect(() => buildReviewPayload({ action: 'hide', currentStatus: 'in_review' })).toThrow(/status/i);
});

test('publish sends only editable public text and the action', () => {
  expect(() => buildReviewPayload({
    action: 'publish',
    currentStatus: 'in_review',
    shareWithStudents: false,
    displayTitle: 'Titel'
  })).toThrow(/toestemming/i);
  expect(buildReviewPayload({
    action: 'publish',
    currentStatus: 'in_review',
    shareWithStudents: true,
    reviewerNote: '',
    displayTitle: 'Titel',
    displaySummary: 'Samenvatting',
    unexpected: 'ignored'
  })).toEqual({ action: 'publish', displayTitle: 'Titel', displaySummary: 'Samenvatting' });
});
