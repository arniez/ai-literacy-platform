import { buildPublicationChange } from './aiStudentIntegration';

test('an upcoming lesson cannot be published', () => {
  expect(() => buildPublicationChange({ availability_status: 'upcoming' }, true)).toThrow(/beschikbaar/i);
});

test('an available lesson can be hidden or published', () => {
  expect(buildPublicationChange({ availability_status: 'available' }, false)).toEqual({ isPublished: false });
  expect(buildPublicationChange({ availability_status: 'available' }, true)).toEqual({ isPublished: true });
});
