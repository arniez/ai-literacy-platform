const studentTipMessages = {
  nl: {},
  en: {
    'Ingediend': 'Submitted',
    'In beoordeling': 'Under review',
    'Gedeeld met studenten': 'Shared with students',
    'Toegevoegd aan leermateriaal': 'Added to learning materials',
    'Niet geselecteerd': 'Not selected',
    'Niet meer zichtbaar': 'No longer visible',
    'Studenttip': 'Student tip',
    'Aanbevolen door {name}': 'Recommended by {name}',
    'Voor wie': 'Who it helps',
    'Wat je ervan leert': 'What you can learn',
    'Blijf kritisch': 'Think critically',
    'Open de bron': 'Open source',
    'Bekijk materiaal': 'View material',
    'Toelichting van de beoordelaar': 'Reviewer note',
    'Bekijk het toegevoegde leermateriaal': 'View the added learning material',
    'Mijn tip': 'My tip',
    'SAMEN LEREN': 'LEARN TOGETHER',
    'Studenttips': 'Student tips',
    'Vind iets dat jou helpt. Deel het met anderen.': 'Find something that helps you. Share it with others.',
    'JOUW BIJDRAGE': 'YOUR CONTRIBUTION',
    'Deel een tip': 'Share a tip',
    'Deel een les of bron die jou verder hielp. Vertel wat je leerde en wat een ander kritisch mag bekijken.': 'Share a lesson or source that helped you. Tell others what you learned and what they should check critically.',
    'Wat wil je aanbevelen?': 'What would you like to recommend?',
    'Leermateriaal uit de bibliotheek': 'Material from the library',
    'Een externe bron': 'An external source',
    'Kies leermateriaal': 'Choose learning material',
    'Selecteer een onderdeel': 'Select a lesson',
    'Je beveelt aan': 'You are recommending',
    'Titel van de tip': 'Tip title',
    'Bronlink': 'Source link',
    'Voor wie is dit nuttig?': 'Who would find this useful?',
    'Wat heb je ervan geleerd?': 'What did you learn from it?',
    'Waarom raad je het aan?': 'Why do you recommend it?',
    'Wat moet een ander controleren?': 'What should someone check?',
    'Jij bepaalt wie je tip te zien krijgt': 'You decide who sees your tip',
    'Na beoordeling delen met andere studenten': 'Share with other students after review',
    'Je tip blijft privé totdat een docent hem beoordeelt.': 'Your tip stays private until a teacher reviews it.',
    'Mijn voornaam erbij tonen': 'Show my first name',
    'Dit kan alleen als je tip met studenten wordt gedeeld.': 'This is available only if your tip is shared with students.',
    'Je tip is verstuurd. Je vindt de status terug bij Mijn tips.': 'Your tip has been sent. You can follow its status under My tips.',
    'Deze bron lijkt al eerder gedeeld. Je kunt je tip toch versturen; een docent bekijkt hem.': 'This source may already have been shared. You can still send your tip; a teacher will review it.',
    'Je tip versturen lukt nu niet. Probeer het opnieuw.': 'Your tip could not be sent. Please try again.',
    'Tip versturen…': 'Sending tip…',
    'Verstuur je tip': 'Send your tip',
    'JOUW KEUZE': 'YOUR CHOICE',
    'Een goede tip helpt iemand verder.': 'A good tip helps someone move forward.',
    'Beschrijf wat je eraan had. Een docent beoordeelt de bron en jouw tip voordat die zichtbaar wordt.': 'Describe what you found useful. A teacher reviews the source and your tip before it becomes visible.',
    'Je voortgang blijft van jou': 'Your progress stays yours',
    'Delen is altijd jouw keuze': 'Sharing is always your choice',
    'Bekijk tips van studenten': 'Explore student tips',
    'TIPS VAN STUDENTEN': 'TIPS FROM STUDENTS',
    'Wat anderen aanraden': 'What others recommend',
    'Er zijn nog geen tips gedeeld.': 'No tips have been shared yet.',
    'Jouw tip kan de eerste zijn.': 'Your tip could be the first.',
    'ALLEEN VOOR JOU': 'JUST FOR YOU',
    'Mijn tips': 'My tips',
    'Volg wat er met je inzendingen gebeurt.': 'See what happens to your submissions.',
    'Je hebt nog geen tips ingestuurd.': 'You have not sent in any tips yet.',
    'Je inzendingen zijn privé. Alleen jij en bevoegde beoordelaars kunnen ze zien.': 'Your submissions are private. Only you and authorised reviewers can see them.',
    'Leren begrijpen. Zelf blijven denken.': 'Understand what you learn. Keep thinking for yourself.',
    'Studenttips laden…': 'Loading student tips…',
    'Je tips zijn even niet beschikbaar': 'Your tips are temporarily unavailable',
    'Probeer het nog een keer.': 'Please try again.',
    'Opnieuw proberen': 'Try again',
    'Deel dit leermateriaal': 'Recommend this material',
    'Van studenten': 'From students',
    'Tips van studenten': 'Student tips',
    'Deel wat jou helpt en ontdek wat anderen aanraden.': 'Share what helps you and explore what others recommend.'
  }
};

Object.keys(studentTipMessages.en).forEach((key) => {
  studentTipMessages.nl[key] = key;
});

export function translateStudentTipText(language, key, values = {}, fallback = (value) => value) {
  const template = studentTipMessages[language]?.[key];
  const message = template || fallback(key, values);
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    message
  );
}

export default studentTipMessages;
