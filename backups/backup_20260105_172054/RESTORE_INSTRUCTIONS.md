# AI Literacy Platform - Backup Restore Instructies

**Backup Datum:** 5 januari 2026, 17:20:54

## 📁 Backup Inhoud

Deze backup bevat:
- ✅ Complete server code (backend)
- ✅ Complete client code (frontend)
- ✅ Database export script
- ✅ Alle configuratie bestanden
- ✅ Alle migratie scripts

## 🔄 Project Herstellen

### 1. Project Bestanden Terugzetten

```bash
# Kopieer de backup terug naar je werkmap
xcopy /E /I /Y backup_20260105_172054\server C:\Users\Gebruiker\Documents\VScode\AILiteracy\server
xcopy /E /I /Y backup_20260105_172054\client C:\Users\Gebruiker\Documents\VScode\AILiteracy\client
```

### 2. Dependencies Installeren

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

## 💾 Database Herstellen

### Optie A: Handmatige Export/Import

#### Database Exporteren (voor backup):
```bash
SET PGPASSWORD=root
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -d ai_literacy_db -f backup_full.sql
```

#### Database Importeren (restore):
```bash
# 1. Maak een nieuwe database aan (optioneel)
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE ai_literacy_db;"

# 2. Importeer de backup
SET PGPASSWORD=root
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d ai_literacy_db -f backup_full.sql
```

### Optie B: Via Node.js Script

Gebruik de migratie scripts in `server/migrations/`:
```bash
cd server
node run-seed.js           # Seed initial data
node run-quiz-migration.js # Create quiz system
```

## 🚀 Applicatie Starten

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm start
```

De applicatie is beschikbaar op:
- Frontend: http://localhost:3000
- Backend: http://localhost:5002

## ⚙️ Environment Configuratie

Database configuratie in `server/.env.local`:
```
PG_HOST=localhost
PG_USER=postgres
PG_PASSWORD=root
PG_NAME=ai_literacy_db
PG_PORT=5432
DB_TYPE=postgres
```

## 📊 Database Schema

Belangrijkste tabellen:
- `users` - Gebruikers accounts
- `modules` - Leermodules
- `content` - Leermaterialen
- `user_progress` - Voortgang tracking
- `badges` - Badge definities
- `user_badges` - Toegekende badges
- `quizzes` - Quiz metadata
- `quiz_questions` - Quiz vragen
- `quiz_question_options` - Antwoord opties
- `user_quiz_attempts` - Quiz pogingen
- `challenges` - Uitdagingen

## 🔧 Troubleshooting

### Database Connectie Problemen
1. Check of PostgreSQL service draait
2. Verifieer credentials in `.env.local`
3. Test connectie: `psql -U postgres -d ai_literacy_db`

### Port Conflicts
- Backend: Wijzig PORT in `server/config/config.env`
- Frontend: Wijzig poort in `client/package.json` proxy

### Module Not Found Errors
```bash
# Verwijder node_modules en reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Nieuwe Backup Maken

```bash
# Gebruik het backup script
cd AILiteracy
node create-backup.js
```

Of handmatig:
```bash
# 1. Kopieer project bestanden
xcopy /E /I /Y server backups\backup_YYYYMMDD\server
xcopy /E /I /Y client backups\backup_YYYYMMDD\client

# 2. Exporteer database
SET PGPASSWORD=root
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -d ai_literacy_db -f backups\backup_YYYYMMDD\database.sql
```

## 📞 Support

Bij vragen of problemen:
1. Check de server logs in de console
2. Check browser console voor frontend errors
3. Verifieer database connectie

---
*Backup gemaakt op: 2026-01-05 17:20:54*
