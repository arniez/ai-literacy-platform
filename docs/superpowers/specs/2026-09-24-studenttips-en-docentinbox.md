# Studenttips en docent-inbox

**Status:** concept ter beoordeling
**Datum:** 24 september 2026
**Eerste tranche van:** `docs/aanbevelingen-studentbetrokkenheid-en-leerresultaat.md`

## Doel

Studenten kunnen bruikbare AI-leercontent of een eigen vondst aanbevelen. Docenten en beheerders beoordelen die tips op kwaliteit, relevantie, actualiteit en veiligheid. De student ziet wat er met de tip gebeurt. Een goedgekeurde tip kan daarna als studenttip zichtbaar worden of als concept aan de bestaande contentbibliotheek worden toegevoegd.

De eerste versie richt zich op een beheersbare tipstroom. Ze introduceert geen open chat of populariteitsranglijst.

## Bestaande basis en uitgangspunten

- De app heeft ingelogde studenten, rollen `teacher` en `admin`, leercontent, een contentdetailpagina, een bibliotheek en een beheerscherm.
- De bestaande beheerroute en contentbeheer-API zijn op dit moment voor admins. De studenttips krijgen daarom een eigen beoordelaarsroute die alleen voor `teacher` en `admin` toegankelijk is; de algemene contentbeheerrechten worden hierdoor niet verruimd.
- De server ondersteunt MySQL en PostgreSQL via `db-universal`. De nieuwe opslag en migratie moeten beide databases ondersteunen.
- Een student kan een bestaand content-item aanbevelen of een externe URL indienen.
- Een tip is privé totdat een bevoegde beoordelaar hem goedkeurt. Een student bepaalt bij inzending of de tip na goedkeuring met andere studenten gedeeld mag worden. Naamvermelding is apart en staat standaard uit.
- De interface en feedbackberichten zijn beschikbaar in Nederlands en Engels.

## Studentervaring

### Een tip indienen

Studenten openen **Deel een tip** vanuit de bibliotheek of een contentdetail. Ze kiezen een bestaand item of dienen een externe bron in. Bij een bestaand item wordt de titel en link vooraf ingevuld; bij een externe bron vult de student die zelf in.

De kaart vraagt om:

- titel en bron;
- voor wie en wanneer dit nuttig is;
- wat de student ervan heeft geleerd;
- waarom de student het aanbeveelt;
- wat een medestudent kritisch moet controleren;
- wel of niet delen met andere studenten na goedkeuring;
- optioneel: de voornaam tonen bij een gedeelde tip (standaard uit).

De inzender krijgt een ontvangstbevestiging en vindt de eigen inzendingen terug onder **Mijn tips**. Daar zijn status en eventuele toelichting van de beoordelaar zichtbaar. Andere studenten kunnen ongepubliceerde inzendingen niet zien.

### Een goedgekeurde tip bekijken

Er is een beschermde studentenpagina **Studenttips** met uitsluitend goedgekeurde, gedeelde tips. Een kaart toont de bron, de studentuitleg en — alleen na expliciete keuze — de voornaam van de inzender. Externe bronnen openen in een nieuw tabblad. Tips die alleen voor de docent zijn bedoeld, verschijnen niet op deze pagina.

Een tip kan daarnaast door de beoordelaar worden omgezet in een concept in de bestaande contentbibliotheek. Het concept blijft verborgen volgens de bestaande publicatieregel. De student ziet de status **Toegevoegd aan leermateriaal** zodra het concept is aangemaakt; publicatie blijft een aparte bestaande beheerhandeling.

## Docent- en beheerervaring

Een nieuwe sectie **Studenttips** is beschikbaar via een eigen route voor `teacher` en `admin`. De beoordelaar kan de inbox filteren op status en zoeken op titel of URL. Elke inzending toont bron, context, deelvoorkeur, inzender (alleen voor bevoegde beoordelaars), datum en eventuele bestaande koppeling.

De beoordelaar kan:

- een inzending als **In beoordeling** markeren;
- een gedeelde tip goedkeuren en publiceren op de studentenpagina;
- een externe inzending omzetten in een verborgen contentconcept;
- een inzending afwijzen met een verplichte toelichting.

Bij goedkeuring kan de beoordelaar de zichtbare titel en begeleidende tekst redigeren. De oorspronkelijke inzending blijft intern bewaard voor opvolging. Bij afwijzing ziet alleen de inzender de toelichting. Een reeds gepubliceerde tip kan door een beoordelaar worden verborgen; de oorspronkelijke inzending en eventuele studentvoortgang op gekoppelde content worden niet verwijderd.

De inbox toont een mogelijke duplicaatwaarschuwing wanneer dezelfde genormaliseerde URL al is ingediend of al als studenttip bestaat. De waarschuwing blokkeert de inzending niet.

## Statusmodel

| Status | Betekenis | Zichtbaar voor student |
|---|---|---|
| `submitted` | Ontvangen en wacht op beoordeling | Inzender ziet status |
| `in_review` | Docent of beheerder bekijkt de tip | Inzender ziet status |
| `published` | Goedgekeurd en zichtbaar voor studenten volgens de deelkeuze | Alle studenten zien tip; inzender ziet status |
| `added` | Omgezet naar een verborgen contentconcept | Inzender ziet status; andere studenten pas na bestaande contentpublicatie |
| `declined` | Niet geselecteerd | Alleen inzender ziet status en toelichting |
| `hidden` | Eerder gepubliceerde tip is door beoordelaar verborgen | Niet zichtbaar in studentenlijst; inzender ziet status |

Een tip die niet met studenten gedeeld mag worden, kan niet de status `published` krijgen. De beoordelaar kan deze afwijzen of als contentconcept toevoegen wanneer dat passend is.

## Gegevens en API-opzet

Voeg een aparte, additieve tabel `student_suggestions` toe. Bewaar minimaal:

- unieke ID, `student_id`, optioneel `content_id` en optioneel `converted_content_id`;
- titel en URL;
- doelgroep/context, leeropbrengst, aanbevelingsreden en kritische controle;
- toestemming om met studenten te delen en toestemming voor naamvermelding;
- status, beoordelaar-ID, beoordelaarsnotitie en tijdstempels.

Gebruik gewone kolommen en datatypes die naar zowel MySQL als PostgreSQL vertaalbaar zijn. Voeg passende foreign keys en indexen toe voor student, status, beoordelaar en gekoppeld content-item. Nieuwe schemawijzigingen worden als afzonderlijke migratie geleverd; bestaande database-initialisaties of tabellen worden niet verwijderd of opnieuw opgebouwd.

Voorgestelde routes:

- `POST /api/student-tips` — ingelogde student maakt een tip;
- `GET /api/student-tips/mine` — student haalt eigen tips en statussen op;
- `GET /api/student-tips` — ingelogde student haalt alleen gepubliceerde tips op;
- `GET /api/student-tips/review` — docent/beheerder haalt de inbox op;
- `PATCH /api/student-tips/:id/review` — docent/beheerder wijzigt status, zichtbare tekst of beoordelaarsnotitie.

De server controleert elke overgang en autorisatie; UI-verberging geldt niet als toegangscontrole. Studenten kunnen alleen hun eigen inzendingen lezen. Docenten/beheerders mogen alle inzendingen beoordelen. Alleen gepubliceerde, gedeelde tips verschijnen in de studentenlijst.

Valideer invoer aan de serverkant: trim tekst, beperk veldlengtes, eis een geldige titel en context en accepteer voor externe links uitsluitend `http` en `https`. Een interne tip moet verwijzen naar een bestaand content-item. Een afwijzing vereist een toelichting. De duplicate check is adviserend en vergelijkt een genormaliseerde URL zonder fragment en met genormaliseerde host/pad.

## Privacy en veiligheid

- Inzendingen zijn privé voor de student en bevoegde beoordelaars totdat een tip is goedgekeurd.
- Naamvermelding is een expliciete aparte keuze en standaard uit; beoordelaars zien de inzender om de inzending te kunnen beheren.
- Geen student krijgt toegang tot docentnotities van andere inzendingen.
- Externe links worden als data opgeslagen en veilig als link weergegeven; HTML uit studentinvoer wordt niet uitgevoerd.
- Alleen rollen `teacher` en `admin` mogen inbox- en reviewroutes gebruiken. De studentroutes vereisen authenticatie.
- Het verbergen of afwijzen verwijdert geen inzendingen of bestaand leerbewijs.

## Acceptatiecriteria

1. Een ingelogde student kan een bestaand platformitem of geldige externe bron met de verplichte contextvelden indienen.
2. De student ziet in **Mijn tips** uitsluitend de eigen inzendingen, hun actuele status en eventuele eigen toelichting.
3. Een andere student kan geen ongoedgekeurde, afgewezen of verborgen tip ophalen, ook niet door een API-ID te raden.
4. Een docent of beheerder kan de inbox openen, status aanpassen, een studenttip publiceren, een externe tip als verborgen contentconcept aanmaken of met toelichting afwijzen.
5. Een tip verschijnt alleen op **Studenttips** na beoordeling, als de student delen toestond en de beoordelaar hem publiceerde.
6. Naam wordt alleen aan andere studenten getoond als de inzender daar expliciet voor koos.
7. Een aangemaakt contentconcept blijft ongepubliceerd en volgt de bestaande contentpublicatiestroom.
8. De interface werkt in NL en ENG, inclusief validatie-, succes- en foutmeldingen.
9. Nieuwe migraties werken voor MySQL en PostgreSQL en wijzigen of verwijderen geen bestaande gegevens.
10. Duplicaten leveren een waarschuwing op, maar verhinderen niet dat studenten een tip insturen.

## Verificatie

- Controleer migratie en basis CRUD op zowel de MySQL- als PostgreSQL-querypaden, zonder bestaande data te resetten.
- Test student-, docent- en adminrechten voor elke route, inclusief pogingen op andermans inzending en niet-gepubliceerde tips.
- Doorloop een bestaand content-item en een externe URL: indienen, beoordelen, publiceren, afwijzen en verbergen.
- Controleer dat een externe inzending als verborgen contentconcept wordt aangemaakt en pas via het bestaande publicatieproces in de bibliotheek verschijnt.
- Test ongeldige URL-schema's, lege/verlengde velden, duplicate waarschuwing en verplichte afwijsnotitie.
- Controleer NL/ENG, naamvermelding uit/aan en terugkeer naar **Mijn tips** na statuswijziging.

## Buiten deze tranche

Sectorfilters, likes/bewaaracties, peercommentaar, privéchat, automatische aanbevelingen, klasgroepen en analyse van leerresultaten worden in latere tranches beoordeeld. Deze specificatie bouwt alleen de tipinzending, moderatie en gecontroleerde publicatie.
