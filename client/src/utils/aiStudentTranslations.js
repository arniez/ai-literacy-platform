export const aiStudentTranslations = {
  nl: {
    tabContent: 'Content beheren', tabIntegration: 'AI voor studenten', eyebrow: 'Externe cursus', title: 'Kies wat studenten kunnen leren',
    subtitle: 'Selecteer video’s uit AI voor studenten. Voortgang, beoordelingen en reacties blijven in dit platform.',
    version: 'Cursusversie', search: 'Zoek een les', searchPlaceholder: 'Zoek op titel of lesnummer', status: 'Status', all: 'Alle statussen', available: 'Beschikbaar', published: 'Aangeboden', hidden: 'Verborgen', upcoming: 'Binnenkort', noVideo: 'Geen video',
    import: 'Catalogus bijwerken', importing: 'Catalogus laden…', loading: 'Lessen laden…', reloadError: 'De lescatalogus kon niet worden geladen.', importSuccess: 'Catalogus bijgewerkt.', importError: 'De catalogus kon niet worden bijgewerkt.',
    source: 'Open originele les', preview: 'Bekijk video', closePreview: 'Sluit voorbeeld', publish: 'Aanbieden aan studenten', hide: 'Verbergen voor studenten',
    readyReason: 'Deze videoles kan worden aangeboden aan studenten.', upcomingReason: 'Deze les is nog niet beschikbaar op AI voor studenten.', noVideoReason: 'Op de bronpagina staat geen video die we kunnen aanbieden.',
    empty: 'Geen lessen gevonden', emptyHint: 'Pas je zoekopdracht of filter aan.', noCatalog: 'Er staan nog geen lessen in deze versie.', noCatalogHint: 'Werk de catalogus bij om de lessen hier te tonen.',
    lesson: 'Les', minutes: 'min', videoPreviewTitle: 'Videovoorbeeld', publishUnavailable: 'Deze les is nog niet beschikbaar om aan te bieden.', invalidPublication: 'Kies aanbieden of verbergen.',
    availableCount: 'beschikbare video’s', offeredCount: 'aangeboden', lessonCount: 'lessen', filterPublished: 'Aangeboden', filterHidden: 'Verborgen',
  },
  en: {
    tabContent: 'Manage content', tabIntegration: 'AI for students', eyebrow: 'External course', title: 'Choose what students can learn',
    subtitle: 'Select videos from AI for students. Progress, ratings and comments stay on this platform.',
    version: 'Course version', search: 'Search lessons', searchPlaceholder: 'Search by title or lesson number', status: 'Status', all: 'All statuses', available: 'Available', published: 'Offered', hidden: 'Hidden', upcoming: 'Coming soon', noVideo: 'No video',
    import: 'Refresh catalog', importing: 'Loading catalog…', loading: 'Loading lessons…', reloadError: 'The lesson catalog could not be loaded.', importSuccess: 'Catalog refreshed.', importError: 'The catalog could not be refreshed.',
    source: 'Open original lesson', preview: 'Preview video', closePreview: 'Close preview', publish: 'Offer to students', hide: 'Hide from students',
    readyReason: 'This video lesson is ready to offer to students.', upcomingReason: 'This lesson is not available on AI for students yet.', noVideoReason: 'The source page does not have a video we can offer.',
    empty: 'No lessons found', emptyHint: 'Try changing your search or filter.', noCatalog: 'There are no lessons in this version yet.', noCatalogHint: 'Refresh the catalog to show lessons here.',
    lesson: 'Lesson', minutes: 'min', videoPreviewTitle: 'Video preview', publishUnavailable: 'This lesson is not available to offer yet.', invalidPublication: 'Choose whether to offer or hide the lesson.',
    availableCount: 'available videos', offeredCount: 'offered', lessonCount: 'lessons', filterPublished: 'Offered', filterHidden: 'Hidden',
  },
};

export function translateAiStudent(key, language = 'nl') {
  const translations = aiStudentTranslations[language] || aiStudentTranslations.nl;
  return translations[key] || aiStudentTranslations.nl[key] || key;
}
