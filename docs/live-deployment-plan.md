# Livegangplan voor Vaardig met AI

## Doel en huidige architectuur

Dit document beschrijft hoe de huidige toepassing veilig naar een live omgeving kan. Het betreft een plan en checklist; het voert geen deployment uit.

Sinds het plan "Eenvoudig publiceren" is doorgevoerd bestaat de toepassing uit **één Node/Express-dienst** die zowel de API (**/api/\***) als de gebouwde React-frontend (alle overige paden) levert. Er is dus geen aparte Static Site meer nodig: één webdienst, één domein, geen CORS en geen build-time **REACT_APP_API_URL** in productie. De database is uitsluitend PostgreSQL, verbonden via **DATABASE_URL** (optioneel met TLS via **DB_SSL**). Schemawijzigingen lopen via een genummerde migratiehistorie in **server/migrations/postgres/** en het commando **npm run migrate** (zie `server/db/migrate.js`); er is geen destructief `database-postgres.sql` meer dat los kan draaien op een gevulde database — het equivalent, **server/config/dev-reset-schema.sql**, weigert te draaien wanneer **NODE_ENV=production**. De eerste beheerder wordt aangemaakt met **npm run create-admin** (`server/scripts/createAdmin.js`), niet met een demo-account.

## Aanbevolen eerste live opstelling

Voor de eerste echte pilot is Render een eenvoudige optie: één Web Service plus beheerde PostgreSQL in dezelfde regio, gekoppeld via **render.yaml** (Render Blueprint). Render biedt Frankfurt als regio. Controleer vóór gebruik met de instelling of de verwerker, regio, overeenkomst en gegevensretentie passen bij de studentgegevens die worden opgeslagen. Een EU-regio op zichzelf is geen volledige privacybeoordeling.

De opstelling bestaat uit:

- **Eén webdienst:** Render Web Service (`npm run build` als buildcommando, `npm start` als startcommando), bijvoorbeeld **vaardigmetai.jouwdomein.nl**. Deze dienst bouwt de client, start de Express-server, en die server levert zowel `/api/*` als de React-app.
- **Database:** beheerde Render PostgreSQL in Frankfurt, bereikbaar vanuit de webdienst via de interne databasehost (**DATABASE_URL**).
- **Bronbeheer:** deployment vanaf een expliciet gekozen, beoordeelde Git-branch; niet vanaf een willekeurige lokale werkmap.

Gebruik een betaalde productie-database met passend herstel- en back-upbeleid voor echte studentdata. Render documenteert dat PITR/back-ups niet beschikbaar zijn voor de gratis PostgreSQL-compute; gratis webservices kunnen bovendien na inactiviteit stilvallen. De gratis opties zijn daarom geschikt om de werkwijze te verkennen, niet als uitgangspunt voor een klas die op beschikbaarheid en herstel rekent. Bekijk de actuele [Render-prijzen](https://render.com/pricing) voordat je een abonnement kiest.

## Publiceren met zo weinig mogelijk handwerk

Er zijn drie redelijke routes. Voor deze codebase is **Render Blueprint** de beste balans tussen eenvoudig publiceren en de huidige React-, Express- en PostgreSQL-opzet behouden.

| Route | Eenmalige inrichting | Daarna publiceren | Past bij dit project |
|---|---|---|---|
| **Render Blueprint (aanbevolen)** | De **render.yaml** in de repository beschrijft de webdienst en de database; je koppelt de repository één keer in Render en controleert welke onderdelen worden aangemaakt. Geheime waarden (**JWT_SECRET**, **DATABASE_URL**) worden automatisch of eenmalig handmatig ingevuld. | Een commit of merge naar de gekozen livebranch bouwt en publiceert de dienst automatisch, inclusief `npm run migrate` als `preDeployCommand`. | Sterke match: één Node-dienst die de client meebouwt en serveert, plus een beheerde PostgreSQL-database — precies wat `render.yaml` beschrijft. |
| **Railway vanuit GitHub** | Koppel GitHub en laat Railway de root-`package.json` herkennen (`npm run build` / `npm start`); voeg PostgreSQL toe en zet **DATABASE_URL**. | Een push naar de gekoppelde branch kan de service opnieuw deployen. | Werkt zonder aparte frontend/backend-splitsing, omdat er nu maar één dienst is. Controleer wel of Railway `preDeployCommand`-achtig gedrag ondersteunt voor `npm run migrate`, of voeg de migratie toe aan het buildcommando. |
| **Replit Publish** | Importeer de repository in Replit, stel de run/build-instructies en geheimen in en maak een aparte productiedatabase aan. | Publiceren of opnieuw publiceren gebeurt vanuit de Replit-editor. | Het voelt het meest als een publiceerknop, maar vraagt de meeste verhuizing van de huidige hostingconfiguratie naar Replit. Controleer regio, gegevensverwerking en productiedatabase vóór gebruik met studenten; de publicatieregio kan na de eerste publicatie niet zomaar worden gewijzigd. |

**Mijn advies voor jouw gewenste werkwijze:** zet de omgeving één keer klaar als Render Blueprint vanaf een schone releasebranch. Daarna is het proces: **wijzigingen beoordelen → naar de livebranch mergen → Render bouwt, migreert en publiceert**. Dit is een eenvoudige herhaalbare publicatie, geen veilige manier om ongecontroleerde lokale wijzigingen direct online te zetten.

Railway is een goed alternatief als je liever services in een dashboard instelt dan met een Blueprint-bestand. Replit is aantrekkelijk voor een demo die vanuit één editor met een knop gepubliceerd wordt, maar voor een onderwijsplatform met echte studenten moet je eerst controleren dat database, locatie, back-ups en gegevensvoorwaarden aan de eisen van de instelling voldoen. In alle drie gevallen blijft een productieklare, niet-destructieve migratieweg en een veilige eerste beheerder nodig — dat is nu aanwezig (`npm run migrate`, `npm run create-admin`).

## Wat eerst gereed moet zijn

1. **Kies een release en merge naar de livebranch.** `render.yaml` wijst naar `branch: main`. `main` bevat op dit moment nog niet de "Eenvoudig publiceren"-commits (die staan op `release/eenvoudig-publiceren`) en ook niet de losse ongecommitte wijzigingen die nog in de werkmap staan. Review welke wijzigingen bij de live versie horen, maak een schone, herkenbare releasecommit, en merge pas dan naar `main` — dat is de branch die Render bij elke merge automatisch bouwt en publiceert.
2. **Bescherm geheimen.** Bewaar **DATABASE_URL** en **JWT_SECRET** alleen als geheime omgevingsvariabelen in de hostingomgeving. Variabelen met de prefix **REACT_APP_** komen in het gebouwde JavaScript terecht en zijn openbaar; in de nieuwe opzet is er in productie geen **REACT_APP_API_URL** meer nodig (de client roept `/api` op hetzelfde domein aan). Controleer vóór pushen dat **.env**, **config.env**, dumps, logbestanden en backups niet in Git staan. Roteer een geheim als het ooit is gecommit of gedeeld.
3. **Schema-installatie is nu niet-destructief.** ~~`server/config/database-postgres.sql` bevat `DROP TABLE ... CASCADE`~~ — dat bestand heet nu **server/config/dev-reset-schema.sql**, wordt alleen nog door lokale ontwikkelscripts aangeroepen, en die scripts weigeren te draaien wanneer **NODE_ENV=production**. Productie krijgt zijn schema uitsluitend via **npm run migrate** (`server/migrations/postgres/000..005`), dat nooit een `DROP` bevat en per migratie een transactie gebruikt. Test een nieuwe migratie eerst op een aparte lege testdatabase, zoals gedaan is voor 000–005 op `vmai_release_test`.
4. **Er is nu een veilige beheerder-bootstrap.** ~~Er is vóór de pilot een veilige, eenmalige manier nodig om de eerste beheerder aan te maken~~ — dat is **`npm run create-admin`** (`server/scripts/createAdmin.js`): wachtwoord via **ADMIN_PASSWORD** of een verborgen prompt, nooit als CLI-argument, minimaal 12 tekens, bcrypt-hash. **Gebruik de demo-seed nog steeds niet in productie**: `npm run seed -- --demo` (en dus ook `--all`) weigert al bij **NODE_ENV=production**, maar controleer dat vóór livegang zelf nogmaals. Beslis ook of studentregistratie open blijft of via een gecontroleerd cohort-/uitnodigingsproces gaat.
5. **Controleer content en rechten.** `server/config/seed-catalog.sql` (de cursuscatalogus die wél naar productie mag) bevat nog een paar voorbeeld-URL's die niet echt bestaan (bijvoorbeeld een YouTube-link met `v=robotics-ai`). Beoordeel en vervang die voordat je deze seed op een productiedatabase uitvoert. Test alle openbare links, video's en afbeeldingen, controleer bron- en gebruiksrechten en controleer teksten en taalinstellingen voor studenten.
6. **Databaseverbinding ondersteunt nu connection strings en TLS.** De pool wordt gebouwd door `server/config/dbConfig.js`: **DATABASE_URL** wint van losse **PG_\***-velden, en **DB_SSL=true** (met optioneel **DB_SSL_REJECT_UNAUTHORIZED**) schakelt TLS in. Voor een Render-webdienst die in dezelfde regio via de interne hostname verbindt, is **DB_SSL** niet nodig; voor beheer vanaf een eigen computer via de externe URL wel. Maak een backup en oefen een herstel naar een testdatabase vóór de eerste echte klas.

## Render-instellingen

Deze instellingen staan al vastgelegd in **render.yaml** in de repository-root; koppel de Blueprint in Render en vul de gevraagde velden aan. De veldnamen (`runtime`, `region`, `preDeployCommand`, `healthCheckPath`, `envVars` met `fromDatabase`/`generateValue`) en de regio-notatie (`frankfurt`) zijn op 25 september 2026 geverifieerd tegen de actuele Render Blueprint-documentatie. Render is inmiddels overgestapt van naam-plannen (`starter`, `standard`, `pro`) naar CPU/RAM-notatie; `render.yaml` gebruikt nu `plan: 0.5c-512mb` voor de webdienst en `plan: 0.1c-256mb` voor de database — beide de kleinste betaalde stap boven `free` (de oude namen `starter`/`basic-256mb` bestaan niet meer in de Blueprint-spec). Controleer bij een grotere klas of die maat volstaat; de volgende stappen zijn `1c-2g` (web) en `0.5c-1g` (database).

### 1. Database

Render maakt de PostgreSQL-instantie (`vaardig-met-ai-db`) aan volgens `render.yaml`. Kies zelf een productiegeschikt compute- en herstelplan (het gratis plan heeft geen back-ups). De webdienst krijgt **DATABASE_URL** automatisch via `fromDatabase`.

### 2. Webdienst

De Blueprint beschrijft één Web Service (`vaardig-met-ai`) met:

| Instelling | Waarde |
|---|---|
| Build Command | **npm run build** (installeert server + client, bouwt de client) |
| Pre-Deploy Command | **npm run migrate** (past openstaande migraties toe vóór de nieuwe versie live gaat) |
| Start Command | **npm start** |
| Health Check Path | **/api/health/ready** (test een echte databasequery, niet alleen of Express antwoordt) |
| Region | Frankfurt, dezelfde regio als PostgreSQL |

Environment variables uit `render.yaml`: **NODE_ENV=production**, **DATABASE_URL** (uit de database), **JWT_SECRET** (automatisch gegenereerd) en **JWT_EXPIRE=30d**. **PORT** wordt door Render ingesteld; de server bindt al aan **0.0.0.0**. Gebruik Node 24.x (vastgelegd in `.nvmrc` en `engines.node`).

Na iedere database- of deploywijziging: controleer ook in de applicatie zelf of login, content laden en voortgang opslaan werken — `/api/health/ready` bewijst alleen dat de database bereikbaar is, niet dat de applicatielogica klopt.

### 3. Domein en TLS

Omdat frontend en API nu op hetzelfde domein draaien, is er maar één domein en één TLS-certificaat nodig (in plaats van een apart domein voor een Static Site en een API-subdomein). Koppel het domein aan de webdienst, volg de DNS-instructies van Render en wacht tot het TLS-certificaat actief is. Er is in productie geen **CORS_ORIGINS** nodig zolang alle verkeer via dat ene domein loopt; zet die variabele alleen als een apart domein (bijvoorbeeld een losse marketingsite) toch cross-origin toegang nodig heeft.

## Database vullen zonder productiedata te verliezen

Gebruik eerst een lege testdatabase om de volledige installatie te oefenen (zoals gedaan voor `vmai_release_test`): `npm run migrate`, dan `npm run migrate -- --status` om te controleren dat alles is toegepast, en gerichte smoke tests.

Voor de productiedatabase:

1. Maak een backup voordat je migreert (of, bij een bestaande database die al up-to-date is, vóór je `npm run migrate -- --baseline` draait).
2. `npm run migrate` voert alleen gecontroleerde migraties uit die geen tabellen of gegevens verwijderen.
3. Maak een beheerder met **npm run create-admin**; gebruik geen demo-account.
4. Voeg alleen beoordeelde cursusinhoud toe met **npm run seed -- --catalog**, pas nadat de voorbeeld-URL's uit punt 5 hierboven zijn nagelopen. Draai **npm run seed -- --demo** nooit tegen productie (het commando weigert dat zelf ook al).
5. Als bestaande lokale voortgang of accounts mee moeten, maak eerst een export en hersteltest; vergelijk aantallen, relaties, wachtwoordlogin en voortgang in een aparte proef.

Maak in de hostingprovider een periodieke backup en bepaal wie een herstel mag uitvoeren. Test het terugzetten naar een tijdelijke database; een backup die nooit is teruggezet, is geen bewezen herstelplan. Render beschrijft de actuele [PostgreSQL-backups en PITR](https://render.com/docs/postgresql-backups).

## Validatie vóór studenten toegang krijgen

Voer een acceptatieronde uit op de echte preview- of testomgeving, zowel desktop als mobiel:

- **/api/health** en **/api/health/ready** antwoorden via HTTPS; er verschijnt geen mixed-contentwaarschuwing.
- De frontend laadt en verversen van **/**, **/basiscursus**, detailpagina's en quizroutes werkt (dit is nu dezelfde Express-dienst als de API, dus een aparte SPA-rewriteregel zoals bij een Static Site is niet meer nodig — die zit al in `server/app.js`).
- Een video-embed (YouTube) speelt af zonder CSP-foutmelding in de console.
- Student kan inloggen, content openen, quiz afronden en voortgang terugzien na opnieuw inloggen.
- Docent/beheerder kan alleen toegestane beheertaken uitvoeren; een student kan geen beheerfuncties gebruiken.
- Beoordelingen en reacties laden en worden aan het juiste item gekoppeld.
- Een verkeerd wachtwoord, verlopen token en ongeldig of niet-bestaand content-ID geven een nette fout zonder stacktrace of geheimen.
- Een onbekende `/api`-route geeft een nette JSON-foutmelding, geen HTML.
- Testregistratie volgens de gekozen cohortinstelling; er zijn geen publiek bruikbare demo-accounts.
- Herstart de webdienst en de databaseverbinding; test backup/herstel op een niet-productiedatabase.
- Bekijk de deploylogs op mislukte queries, schemafouten en onverwachte 4xx/5xx-responses; log geen tokens, wachtwoorden of volledige gevoelige gebruikersdata.

Laat docenten eerst met een kleine groep testen. Open pas daarna de registratie voor de afgesproken studentenpopulatie en communiceer waar gebruikers technische problemen melden.

## Uitrollen en terugdraaien

Deploy eerst naar een preview/testomgeving, waarbij `preDeployCommand: npm run migrate` de geteste database-migratie toepast, en loop de acceptatieronde door. Promoveer vervolgens dezelfde beoordeelde commit naar productie; verander configuratie via de hostingomgeving, niet door geheimen aan de broncode toe te voegen.

Houd eerdere succesvolle deploys beschikbaar. Bij een fout kan de dienst naar een vorige codeversie worden teruggezet. Draai een databasewijziging alleen terug met een vooraf geteste migratie of herstel naar een nieuwe database; voer geen destructief schema-resetbestand uit — `dev-reset-schema.sql` weigert dat toch al onder `NODE_ENV=production`. Noteer deploytijd, commit, migraties, databasebackup en verantwoordelijke in een kort releaseverslag.

## Huidige releasegereedheid

De drie grootste blokkades uit de vorige versie van dit plan zijn opgelost: er is een niet-destructieve migratieweg (`npm run migrate`), een veilige eerste-beheerder-bootstrap (`npm run create-admin`), en de destructieve resetfile weigert nu onder `NODE_ENV=production`. Een headless-browsersessie tegen een productie-build (tegen een wegwerptestdatabase) bevestigde login, de beveiligde pagina's, een echte YouTube-embed zonder CSP-fouten, de Engelse taalwisseling en een mobiele viewport — en vond daarbij een echte bug: CORS gaf een 500 op elk same-origin POST-verzoek omdat de origin-check een `Error` teruggaf in plaats van gewoon geen CORS-header te zetten. Dat is gefixt (`server/config/security.js`) en met regressietests afgedekt.

Wat nog open staat vóór een echte livegang:

- De werkmap bevat nog steeds grote hoeveelheden niet-gecommitte wijzigingen naast de "Eenvoudig publiceren"-commits; die moeten eerst in logische commits worden opgesplitst (zie CLAUDE.md).
- ~~Livebranch nog niet gekozen~~ — `render.yaml` wijst nu naar `branch: main`. `main` moet nog wel het gewenste werk bevatten (zie "Wat eerst gereed moet zijn", punt 1) vóórdat de Blueprint er echt aan gekoppeld wordt.
- De baseline-stap (`npm run migrate -- --baseline`) is nog niet uitgevoerd op de bestaande lokale `ai_literacy_db` — geblokkeerd door de auto-mode-classifier van Claude Code, moet de gebruiker zelf draaien. Dit hoeft pas vlak vóór livegang, of helemaal niet als productie met een lege database begint.
- De voorbeeld-URL's in `seed-catalog.sql` zijn nog niet inhoudelijk beoordeeld.
- ~~`render.yaml`-velden niet geverifieerd~~ — op 25 september 2026 alsnog gecontroleerd tegen de actuele Render-documentatie en de verouderde plannamen (`starter`, `basic-256mb`) vervangen door de huidige CPU/RAM-notatie (`0.5c-512mb`, `0.1c-256mb`). Blijft verstandig om dit rond de eerste echte koppeling nog eens kort te bevestigen, aangezien Render deze namen kan blijven wijzigen.
- `client/.env` (lokaal, gitignored) had een hardgecodeerd LAN-IP in `REACT_APP_API_URL` dat de same-origin-standaard overschreef bij elke lokale build; dat is lokaal gecorrigeerd maar treft alleen deze machine, niet Render.

Rond die punten af en valideer de installatie op een schone PostgreSQL-testdatabase (zoals hierboven beschreven) voordat een hostingprovider automatische productie-deploys uitvoert.

## Officiële documentatie

- [Render: Node.js / Express Web Service](https://render.com/docs/deploy-node-express-app)
- [Render: Web Services, poort en health checks](https://render.com/docs/web-services)
- [Render: Blueprints (render.yaml)](https://render.com/docs/blueprint-spec)
- [Render: PostgreSQL aanmaken en verbinden](https://render.com/docs/postgresql-creating-connecting)
- [Render: regio's, waaronder Frankfurt](https://render.com/docs/regions)
- [Render: PostgreSQL-backups en point-in-time recovery](https://render.com/docs/postgresql-backups)
- [Render: actuele prijzen en gratis-planbeperkingen](https://render.com/pricing)
- [Render: Data Processing Addendum](https://render.com/dpa)
- [Railway: automatische detectie van JavaScript-monorepo's](https://docs.railway.com/deployments/monorepo)
- [Railway: prijsplannen](https://docs.railway.com/pricing/plans)
- [Replit: GitHub import en publiceren](https://docs.replit.com/replit-workspace/workspace-features/version-control)
- [Replit: publicatietypen](https://docs.replit.com/features/publishing/deployment-types)
- [Replit: aparte ontwikkel- en productiedatabase](https://docs.replit.com/features/data-and-storage/development-and-production)
- [Replit: publicatieregio](https://docs.replit.com/features/security/geography)

*Hostinginformatie en links gecontroleerd op 24 september 2026; de Blueprint-veldnamen en plannamen in `render.yaml` zijn op 25 september 2026 opnieuw geverifieerd tegen render.com/docs/blueprint-spec. Planlimieten en tarieven kunnen desondanks wijzigen.*
