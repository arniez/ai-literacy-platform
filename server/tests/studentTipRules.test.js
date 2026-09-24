const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeTipUrl,
  validateTipSubmission,
  validateTipReview
} = require('../utils/studentTipRules');

const validExternalTip = {
  title: 'AI uitgelegd',
  url: 'https://example.org/ai',
  audience: 'Studenten die beginnen met AI',
  learningOutcome: 'Ik begrijp wat een taalmodel doet',
  recommendationReason: 'De uitleg is concreet',
  criticalCheck: 'Controleer de voorbeelden op actualiteit'
};

test('normalizes an HTTPS URL and drops its fragment', () => {
  assert.equal(normalizeTipUrl('HTTPS://Example.org/learn#part'), 'https://example.org/learn');
});

test('rejects unsafe URL schemes and malformed URLs', () => {
  assert.equal(normalizeTipUrl('javascript:alert(1)'), null);
  assert.equal(normalizeTipUrl('data:text/html,hi'), null);
  assert.equal(normalizeTipUrl('https://not a valid host'), null);
});

test('accepts a complete external tip', () => {
  const result = validateTipSubmission(validExternalTip);
  assert.deepEqual(result.errors, []);
  assert.equal(result.normalizedUrl, 'https://example.org/ai');
});

test('accepts an internal tip using its content ID without revalidating a relative URL', () => {
  const result = validateTipSubmission({
    contentId: 12,
    audience: validExternalTip.audience,
    learningOutcome: validExternalTip.learningOutcome,
    recommendationReason: validExternalTip.recommendationReason,
    criticalCheck: validExternalTip.criticalCheck
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.normalizedUrl, null);
});

test('rejects empty required context and values beyond the schema limits', () => {
  const missing = validateTipSubmission({ ...validExternalTip, criticalCheck: ' ' });
  assert.ok(missing.errors.length > 0);

  const missingAudience = validateTipSubmission({ ...validExternalTip, audience: ' ' });
  assert.equal(missingAudience.errors.filter((error) => error.startsWith('audience ')).length, 1);

  const oversized = validateTipSubmission({ ...validExternalTip, title: 'T'.repeat(201) });
  assert.ok(oversized.errors.length > 0);

  const oversizedUrl = validateTipSubmission({ ...validExternalTip, url: `https://example.org/${'a'.repeat(490)}` });
  assert.ok(oversizedUrl.errors.length > 0);
});

test('does not publish without share consent or decline without a note', () => {
  assert.ok(validateTipReview({
    currentStatus: 'in_review',
    action: 'publish',
    shareWithStudents: false
  }).error);
  assert.ok(validateTipReview({
    currentStatus: 'in_review',
    action: 'decline',
    reviewerNote: ''
  }).error);
});

test('allows only transitions defined for the current status', () => {
  assert.equal(validateTipReview({
    currentStatus: 'submitted',
    action: 'start_review'
  }).error, null);
  assert.ok(validateTipReview({
    currentStatus: 'declined',
    action: 'publish',
    shareWithStudents: true
  }).error);
});
