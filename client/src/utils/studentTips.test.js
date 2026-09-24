const { buildStudentTipPayload, getStudentTipCardModel, translateStudentTipText } = require('./studentTips');

const externalTip = {
  title: 'AI uitgelegd',
  url: 'https://example.org/ai',
  audience: 'Studenten die beginnen met AI',
  learningOutcome: 'Ik begrijp wat een taalmodel doet',
  recommendationReason: 'De uitleg is concreet',
  criticalCheck: 'Controleer de voorbeelden op actualiteit'
};

test('privacy choices default off in a student tip payload', () => {
  const payload = buildStudentTipPayload(externalTip);
  expect(payload.shareWithStudents).toBe(false);
  expect(payload.displayFirstName).toBe(false);
});

test('internal recommendations serialize their content ID and learning context', () => {
  const payload = buildStudentTipPayload({
    type: 'internal',
    contentId: '37',
    ...externalTip
  });
  expect(payload.contentId).toBe(37);
  expect(payload.audience).toBe(externalTip.audience);
  expect(payload.title).toBeUndefined();
  expect(payload.url).toBeUndefined();
});

test('external recommendations include title, URL, and all learning context', () => {
  expect(buildStudentTipPayload(externalTip)).toMatchObject({
    contentId: null,
    title: externalTip.title,
    url: externalTip.url,
    audience: externalTip.audience,
    learningOutcome: externalTip.learningOutcome,
    recommendationReason: externalTip.recommendationReason,
    criticalCheck: externalTip.criticalCheck
  });
});

test('internal cards link to the platform and external cards use safe new-tab links', () => {
  expect(getStudentTipCardModel({ id: 4, content_id: 12, title: 'Intern' })).toMatchObject({
    href: '/content/12',
    external: false
  });
  expect(getStudentTipCardModel({ id: 5, url: 'https://example.org/tip' })).toMatchObject({
    href: 'https://example.org/tip',
    external: true,
    target: '_blank',
    rel: 'noopener noreferrer'
  });
  expect(getStudentTipCardModel({ id: 6, url: 'javascript:alert(1)' }).href).toBeNull();
});

test('student tip labels are available in Dutch and English', () => {
  expect(translateStudentTipText('nl', 'Deel een tip')).toBe('Deel een tip');
  expect(translateStudentTipText('en', 'Deel een tip')).toBe('Share a tip');
  expect(translateStudentTipText('en', 'Aanbevolen door {name}', { name: 'Sam' })).toBe('Recommended by Sam');
});
