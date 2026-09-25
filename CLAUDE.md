# CLAUDE.md — Vaardig met AI (AI Literacy platform)

Overdrachtsdocument voor Claude. Stand van zaken: 25 september 2026, branch
`release/eenvoudig-publiceren` (afgetakt van `ailiteracy11`).
Communiceer met de gebruiker in het Nederlands.

## Wat het is

Leerplatform over AI-geletterdheid voor hbo/mbo-studenten ("Vaardig met AI"). Studenten volgen content
(video's, podcasts, e-learning, BASIS-track), maken quizzen en verdienen punten, levels, badges en streaks.
Docenten/admins beheren content, beoordelen studenttips en kiezen lessen uit de externe cursus AI Voor Studenten.

- **client/**: React 18 (Create React App), React Router 6, axios (`client/src/utils/api.js`, standaard
  `baseURL: '/api'`), NL/ENG via `LanguageContext` + losse vertaalbestanden (`prototypeTranslations.js`,
  `studentTipTranslations.js`, `aiStudentTranslations.js`). In ontwikkeling stuurt de CRA-proxy `/api` door
  naar `http://localhost:5002`; in productie serveert dezelfde Express-dienst de gebouwde client, dus is er
  geen `REACT_APP_API_URL` nodig.
- **server/**: Express 4, JWT-auth (`middleware/auth.js`: `protect`, `authorize(...roles)`), rollen
  `student`, `teacher`, `admin`. `server/app.js` bouwt de Express-app (`createApp({ env })`, testbaar zonder
  te luisteren); `server/server.js` doet alleen `createApp` → `testConnection` → `listen` + shutdown. Env uit
  `server/config/config.env` (gitignored), geladen via `server/config/env.js` (absoluut pad, no-op als het
  bestand ontbreekt).
- **Database**: **alleen PostgreSQL** (MySQL-ondersteuning is verwijderd). Verbinding via `DATABASE_URL`
  (optioneel `DB_SSL=true`) of losse `PG_*`-velden — zie `server/config/dbConfig.js`. Gebruik altijd
  `server/config/db-universal.js` (`query`, `insertAndGetId`, `withTransaction`) met `?`-placeholders; die
  worden voor Postgres omgezet naar `$1..$n`.
- Nieuwe features volgen een laag-patroon: `utils/*Rules.js` (pure regels) → `services/*Service.js`
  (factory met geïnjecteerde `query`, testbaar zonder DB) → `controllers/` → `routes/` → mount in `server.js`.

## Commando's

```bash
# server (vanuit server/)
npm run dev                      # nodemon
node --test tests/*.test.js      # 84 unit-tests, geen DB nodig (Windows: bestanden los opgeven)
npm run migrate                  # past openstaande migraties toe (server/migrations/postgres/*.sql)
npm run migrate -- --status      # toont welke migraties zijn toegepast
npm run migrate -- --baseline [--up-to 005]   # markeert migraties als toegepast zonder ze te draaien
npm run create-admin             # bootstrap eerste admin/docent (wachtwoord via ADMIN_PASSWORD of prompt)
node seed-database.js --catalog | --demo | --all   # --demo/--all weigeren onder NODE_ENV=production
npm run db:migrate:user-ai-interests | db:import:ai-student-lessons | db:import:content-interests  # nog ongecommit, zie hieronder

# root (vanuit de repo-root)
npm run build     # install-all + client build (wat Render als buildCommand gebruikt)
npm start         # start de server (delegeert naar server/)
npm run migrate   # delegeert naar server/
npm run dev       # server (nodemon) + client (CRA) gelijktijdig

# client (vanuit client/)
npm start
npm test -- --watchAll=false
npm run build
```

Op 25-09-2026 slaagden alle 84 servertests (na het plan "Eenvoudig publiceren", taken 1–5). Clienttests zijn
toen niet gedraaid; `npm run build` van de client wel (nodig voor de productiemodus-check van Taak 4).

## Werkafspraken (uit specs/plans)

- Schemawijzigingen alleen als **nieuw genummerd bestand** `NNN_naam.sql` in `server/migrations/postgres/`,
  toegepast via `npm run migrate` (`server/db/migrate.js`, met `schema_migrations`-tabel en advisory lock).
  **Wijzig nooit een bestaande migratie** — voeg een nieuwe toe. Nooit een `DROP` in een migratie.
- `server/config/dev-reset-schema.sql` is de enige destructieve schema-file; die is alleen voor lokale
  ontwikkeling en de scripts die hem aanroepen weigeren onder `NODE_ENV=production`.
- Seeds zijn gesplitst: `server/config/seed-catalog.sql` (cursuscatalogus, mag naar productie) en
  `server/config/seed-demo.sql` (demo-accounts, alleen lokaal; `seed-database.js --demo`/`--all` weigeren
  onder `NODE_ENV=production`). Geen seed/reset draaien zonder expliciete toestemming van de gebruiker.
- Alle zichtbare tekst in NL én ENG.
- Test-first, kleine commits met prefix `feat:` / `fix:` / `docs:` / `refactor:` / `chore:`.
- Specs en plannen staan in `docs/superpowers/specs/` en `docs/superpowers/plans/`.
- Bij een werkmap met veel losse, ongecommitte wijzigingen: vraag de gebruiker hoe dat in logische commits
  moet, of werk (met toestemming) op een aparte branch zonder de bestaande wijzigingen te stagen/stashen/
  resetten. Zie "Werkmap en git" hieronder voor hoe dat in de praktijk is opgelost tijdens "Eenvoudig
  publiceren": kleine, noodzakelijke fixes (bijv. een `require('./config/env')`-pad) zijn wél toegepast op
  bestanden van andere, nog ongecommitte features, maar die bestanden zijn zelf niet meegecommit.

## Status features

| Feature | Status |
|---|---|
| Basisplatform (auth, content, quiz, badges, challenges, leaderboard, social) | af, gecommit |
| Studenttips + docentinbox (`/studenttips`, `/docent/studenttips`, `/api/student-tips`) | Task 1–5 gecommit; Task 6 (volledige lifecycle-smoketest) niet aantoonbaar gedaan |
| AI Voor Studenten-selectie in Beheer (`/api/integrations/ai-students`, manifest `server/data/ai-student-lesson-manifest.json`) | Task 1–4 gecommit; Task 5 (`TrackedVideoPlayer`, YouTube IFrame API) staat **ongecommit** in de werkmap; Task 6 open |
| Interesses/personalisatie (`/interesses`, `users.ai_interests`, `PUT /api/auth/interests`) | ongecommit |
| Leerpad, Basiscursus-pagina, AI-trivia, AI-selectiegame, aquacultuurcasus, confetti, UI-restyling | ongecommit |
| Dagelijkse check-in (`POST /api/progress/daily-checkin`) | backend ongecommit; routevolgorde is gefixt (zie hieronder), maar de controller faalt nog: `activity_type`-enum kent geen `'daily_checkin'`-waarde. Client roept de route nog niet aan. |
| Eenvoudig publiceren (alleen Postgres, `npm run migrate`, gesplitste seeds, `create-admin`, één dienst voor API+client, `render.yaml`) | Taak 1–5 gecommit op `release/eenvoudig-publiceren` (zie commits `refactor:`/`feat:`/`chore:` op die branch); Taak 6 (deze doc-update) en Taak 7 (eindcontrole) lopen. Baseline van `npm run migrate -- --baseline` op de echte `ai_literacy_db` is **nog niet uitgevoerd** (geblokkeerd door de auto-mode-classifier van Claude Code — moet de gebruiker zelf draaien, of expliciet toestemming geven). |
| Live gaan | plan bijgewerkt naar de nieuwe architectuur: `docs/live-deployment-plan.md` (één Render Web Service + PostgreSQL via `render.yaml`) |
| Ideeën (Vondstkaart, feedbacklus, sectorbrillen, vaardigheidspaspoort) | `docs/aanbevelingen-studentbetrokkenheid-en-leerresultaat.md` |

## Werkmap en git

- Branch `release/eenvoudig-publiceren` is afgetakt van de toenmalige `ailiteracy11`-HEAD (commit
  `92482db`), op verzoek van de gebruiker, juist omdat de werkmap te veel losse ongecommitte wijzigingen
  bevatte om die eerst allemaal uit te zoeken. Die 12 commits t.o.v. `origin/ailiteracy11` zitten dus ook op
  deze branch.
- De werkmap heeft nog steeds een grote hoeveelheid ongecommitte wijzigingen (andere, nog niet afgeronde
  features zoals interesses/personalisatie, AI-studentenlessen-integratie Task 5/6, leerpad/UI-restyling).
  Die zijn tijdens "Eenvoudig publiceren" bewust **niet gestaged of gecommit**. Waar een taak uit dat plan
  wél een klein, noodzakelijk correctie nodig had in zo'n bestand (bijvoorbeeld het `config.env`-laadpad, of
  de `db-factory`-referentie in een migratierunner), is die correctie toegepast in de werkmap, maar het
  bestand zelf is niet meegecommit — het staat nog steeds als ongecommit klaar voor wanneer die andere
  feature wordt afgerond.
- De overlappende setup-docs zijn opgeruimd na akkoord van de gebruiker: `INSTALL.md`, `QUICKSTART.md`,
  `START.md`, `SETUP_COMPLETE.md`, `SETUP_STEPS.md`, `POSTGRESQL-MIGRATION.md` en `verify-setup.js` zijn
  verwijderd; README.md dekt nu alle drie routes (lokaal, productiemodus, Render).
- Nog steeds rommel: `client/src/pages/Leermaterialen.js.backup`, `create-backup.js`.
- Root `package-lock.json` is ongetrackt; nog niet besloten of dat bewust is of opgeruimd moet worden.

## Bekende problemen

Opgelost tijdens "Eenvoudig publiceren" (Taak 1–4):

1. ~~Routevolgorde in `server/routes/progress.js`~~ — `/daily-checkin` staat nu vóór `/:contentId`. Let op:
   de controller zelf faalt nog om een andere, ongerelateerde reden (zie de tabel hierboven).
2. ~~`server/server.js`: `server.close()` op een niet-gedefinieerde `server`~~ — `server.js` bewaart nu
   `const server = app.listen(...)` en gebruikt die in `SIGTERM`/`SIGINT`/`unhandledRejection`.
4. ~~Hardgecodeerd LAN-IP `192.168.178.79`~~ — verwijderd; CORS komt nu uit `server/config/security.js`
   (`buildCorsOptions`, standaard geen cross-origin in productie tenzij `CORS_ORIGINS` is gezet).
5. ~~Geen veilige manier om de eerste admin aan te maken~~ — `npm run create-admin`
   (`server/scripts/createAdmin.js`); de demo-seed (`password123`) staat nu in `seed-demo.sql` en wordt
   geweigerd onder `NODE_ENV=production`.
6. ~~`/api/health` controleert de database niet~~ — nieuwe route `/api/health/ready` doet een echte
   `SELECT 1` met timeout; `/api/health` blijft een pure liveness-check.

Nog open:

3. `/docent/studenttips` staat in `App.js` zonder route-guard. De pagina controleert de rol zelf en de API
   is afgeschermd, dus dit is geen lek, maar het wijkt af van het plan (`ReviewerRoute`).
7. `activity_type`-enum in het schema kent geen `'daily_checkin'`-waarde, waardoor
   `progressController.dailyCheckin` een 500 geeft zodra hij (nu wél) wordt bereikt. Dit hoort bij de
   ongecommitte dagelijkse-check-in-feature, niet bij "Eenvoudig publiceren".
8. `render.yaml` is geschreven volgens het plan, maar de service-/databasevelden, regio en plannamen
   (`plan: starter`, `plan: basic-256mb`, `postgresMajorVersion`) zijn niet geverifieerd tegen de actuele
   Render-documentatie. Controleer dit vóór de Blueprint echt gekoppeld wordt.
9. De livebranch is nog niet gekozen; `render.yaml` bevat voorlopig `branch: live` als placeholder.
