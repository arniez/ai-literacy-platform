# AI voor studenten beheren en aanbieden

## Probleem en doel

De beheerder moet lessen en video's uit AI Voor Studenten kunnen kiezen en bepalen welke daarvan studenten in Vaardig met AI te zien krijgen. Voor aangeboden video's komt de les in de bestaande leeromgeving, zodat studenten voortgang kunnen bijhouden, een beoordeling kunnen geven en een reactie kunnen plaatsen.

De huidige app beheert publicatie per content-item (`is_published`), toont alleen gepubliceerde items aan studenten en heeft bestaande API's voor voortgang, beoordelingen en reacties. De bestaande videoviewer kan YouTube-video's in een iframe tonen, maar meldt nog geen videovoltooiing en de detailpagina toont nog geen reacties.

## Gekozen ontwerp

Voeg binnen de bestaande adminpagina een aparte sectie **AI voor studenten** toe. De beheerder kan daar tussen cursusversies wisselen en per externe les zien of die beschikbaar is, welke video wordt gebruikt en of de les aan studenten wordt aangeboden. Publicatie begint standaard uit. De beheerder kan een les vooraf bekijken en daarna met één schakelaar publiceren of verbergen. Verbergen verwijdert de les niet en wist geen bestaande voortgang, beoordelingen of reacties.

De eerste catalogus bevat openbare videolessen uit de e-learning 2025 en de huidige cursus 2026, als afzonderlijke versies. De openbare overzichten noemen 54 onderdelen voor 2025 en 60 praktische lessen voor 2026. Bewijs dat een les al beschikbaar is en een werkende video-URL heeft, is vereist voordat de beheerder die kan publiceren. De cursuspagina van 2026 toont op dit moment ook lessen als “Binnenkort”; die blijven niet beschikbaar om te publiceren totdat er een werkende video is.

Elk extern lesitem wordt gekoppeld aan een normaal content-item van de app. De koppeltabel bewaart de originele lespagina-URL; de video-URL staat in het bestaande `content.url`-veld zodat de bestaande detail- en playerflow die kan gebruiken. Zo blijft de bronlink behouden en kan de video rechtstreeks in de wrapper spelen. De content-ID blijft de sleutel voor bestaande studentvoortgang, beoordelingen en reacties. Reacties en beoordelingen blijven in Vaardig met AI; ze worden niet teruggeschreven naar AI Voor Studenten.

De student ziet alleen gepubliceerde lessen in de bestaande bibliotheek. De detailpagina toont de video in een wrapper, een link naar de originele les en de bestaande voortgangs-, beoordelings- en reactiebediening. De nieuwe beheerinterface en zichtbare labels volgen NL/ENG.

## Data en API

Voeg een externe-leskoppeling toe met minimaal:

- provider en cursusversie;
- een stabiele externe les-ID of slug;
- de originele lespagina-URL en beschikbaarheidsstatus;
- optionele videoduur;
- de gekoppelde `content.id`.

Een losse koppeltabel houdt provider-ID's en de originele lespagina-URL buiten het generieke contentmodel en voorkomt dubbele import van dezelfde externe les. De titel staat in `content.title`; de koppeling bevat provider, cursusversie, externe les-ID, lespagina-URL, beschikbaarheidsstatus, optionele videoduur en `content_id`. Het bijbehorende content-item krijgt `content_type = video`, `source = aivoorstudenten`, de video-URL in `content.url` en `is_published = false` bij import. De beheer-API retourneert ook niet-gepubliceerde externe lessen en staat alleen toe dat een admin een beschikbaar item publiceert of verbergt. De gewone student-API blijft alleen gepubliceerde content retourneren.

De eerste lescatalogus komt uit een versiebeheerde, lokaal meegeleverde manifestfile die uit de openbare cursusoverzichten en lespagina's is samengesteld. Een idempotente import maakt of werkt koppelingen bij aan de hand van provider, cursusversie en externe les-ID. Er is geen automatische crawler of live synchronisatie; een nieuwe manifestversie wordt met een app-update toegevoegd. Nieuwe manifestitems beginnen verborgen. Een ontbrekende of nog niet gepubliceerde videobron krijgt `available = false` en kan niet worden aangezet.

Voortgang gebruikt `POST /api/progress/:contentId`. Beoordelingen gebruiken `POST /api/content/:id/rate`. Reacties gebruiken `GET` en `POST /api/social/comments/:contentId`. De bestaande endpoints blijven de enige plek voor deze appgegevens.

Studentgerichte detail-, voortgangs-, beoordelings- en reactie-API's weigeren verborgen content. Admins testen verborgen items alleen via de afgeschermde integratiebeheer-API; die preview maakt geen studentdata publiek.

## Videovoortgang en iframegedrag

Voor YouTube-video's wordt de officiële YouTube IFrame Player API gebruikt om afspelen en het `ENDED`-event te ontvangen. Bij voltooiing markeert de app de video als afgerond via de bestaande voortgangs-API. Als een video niet door de ondersteunde speler-API kan worden gevolgd of niet kan worden ingebed, toont de wrapper een expliciete knop **Markeer als bekeken** en een link om de les op de bronwebsite te openen.

De app probeert geen DOM van een externe iframe te lezen. De browser beperkt dat voor cross-origin pagina's. Er is geen aanname van single sign-on, een API of voortgangssynchronisatie met AI Voor Studenten.

## Toegang en foutafhandeling

De sectie staat binnen Beheer en is alleen toegankelijk voor de bestaande adminrol; de database heeft nog geen aparte integratorrol. Importfouten, ontbrekende video-URL's en niet-embeddable video's krijgen zichtbare statussen. Als de bronwebsite niet beschikbaar is, blijven eerder geïmporteerde lessen en studentgegevens bewaard. Publicatie is niet mogelijk voor lessen zonder gevalideerde videobron.

## Buiten scope

- Voortgang, beoordelingen of reacties synchroniseren terug naar AI Voor Studenten.
- Een live API-sync, scraping op iedere paginaweergave of single sign-on.
- Een nieuwe rol voor integrators.
- Niet-video-opdrachten, quizzen en lesmateriaal uit de externe cursus overnemen.

## Acceptatiecriteria

1. Een admin kan binnen Beheer de versies 2025 en 2026 openen en de geïmporteerde videolessen per versie bekijken.
2. Een les die nog niet beschikbaar is of geen gevalideerde video heeft, kan niet worden gepubliceerd.
3. Een admin kan een beschikbare les vooraf bekijken, publiceren en verbergen zonder het item of bestaande studentgegevens te verwijderen.
4. Studenten zien uitsluitend gepubliceerde AI Voor Studenten-lessen in de bibliotheek; een verborgen les is ook niet via de gewone detail-, voortgangs-, beoordelings- of reactie-API te benaderen.
5. Een voltooide YouTube-video slaat voortgang op voor de ingelogde student. Een niet-volgbaar videotype biedt de handmatige voltooiingsknop.
6. Beoordelingen en reacties zijn per les en per app-content-ID opgeslagen via de bestaande app-API's.
7. De beheerinterface en wrapperlabels werken in NL en ENG.
8. Een student kan de oorspronkelijke AI Voor Studenten-les openen zonder dat de app-authenticatie of iframe de bronwebsite nabootst.

## Verificatieplan

- Controleer catalogusimport en unieke externe les-ID's voor beide versies.
- Controleer dat ongepubliceerde items alleen via adminbeheer zichtbaar zijn en niet via de studentcatalogus of detail-API.
- Doorloop publiceren, openen, video voltooien, verbergen en opnieuw openen als student.
- Controleer dat voortgang, beoordeling en reacties aan het juiste content-item gekoppeld zijn en na verbergen behouden blijven.
- Controleer een niet-embeddable/ongeldige videobron, bronwebsitefout en beide talen.

## Bronnen

- [AI Voor Studenten: e-learning 2025](https://aivoorstudenten.nl/e-learning-2025)
- [AI Voor Studenten: huidige cursus](https://aivoorstudenten.nl/cursus)
- [Voorbeeldles met YouTube-video](https://aivoorstudenten.nl/e-learning-2025/waarom-zou-je-ai-moeten-leren)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [MDN: same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy)
