# Database Seeding

This directory contains the schema, migrations and seed data for the PostgreSQL database.

## Files

- **`migrations/postgres/`** - Numbered, non-destructive schema migrations, applied with `npm run migrate`
  (`db/migrate.js`). Never edit an existing migration; add a new `NNN_name.sql` file instead.
- **`config/seed-catalog.sql`** - The course catalog: modules, content, badges, challenges. Safe to run
  against a production database. Idempotent via `ON CONFLICT (id) DO NOTHING`.
- **`config/seed-demo.sql`** - Demo accounts and their activity (progress, badges, comments, ratings,
  notifications). Local development only.
- **`seed-database.js`** - Loads one or both seed files.
- **`export-seed-data.js`** - Exports the current database into a single combined seed file (legacy format;
  useful for regenerating `seed-catalog.sql`/`seed-demo.sql` by hand after a schema change).
- **`config/dev-reset-schema.sql`** - Destructive, drop-and-recreate schema for a clean local reinstall.
  Development only; scripts that run it refuse under `NODE_ENV=production`.

## Usage

### First-time setup

```bash
createdb -U postgres ai_literacy_db
npm run migrate                    # applies migrations/postgres/*.sql
node seed-database.js --all        # catalog + demo accounts
```

### Loading only the catalog (safe for production)

```bash
node seed-database.js --catalog
```

This inserts modules, content, badges and challenges with `ON CONFLICT (id) DO NOTHING`, so running it again
does nothing destructive — it only adds rows that aren't there yet. It does **not** clear or replace existing
content.

For the local student prototype, add the explicit interest labels and the aquaculture practice case after
seeding the catalog:

```bash
npm run db:import:content-interests
```

This import is repeatable: it keeps existing content tags and publication choices, updates only missing
interest labels, and creates the practice case only once. It does not clear or replace database content.

### Loading demo accounts (local development only)

```bash
node seed-database.js --demo
```

This refuses to run when `NODE_ENV=production`. It never clears existing data; the demo rows use fixed IDs
with `ON CONFLICT (id) DO NOTHING`, so it depends on the catalog seed already being applied (it references
catalog content/badge IDs).

### Exporting current data

```bash
node export-seed-data.js
```

This writes the current database contents to a combined seed file — regenerate `seed-catalog.sql` /
`seed-demo.sql` from that manually if the schema or content has changed significantly.

## Seed Data Contents

- **Catalog** (`seed-catalog.sql`): 4 modules, 37 content items, 10 badges, 4 challenges.
- **Demo** (`seed-demo.sql`): 14 users, 11 user progress records, 8 awarded badges, 4 comments, 5 content
  ratings, 9 notifications.

## Default Accounts (local development only — never seeded into production)

### Admin Account
- **Email**: `admin@ailiteracy.nl`
- **Password**: `password123`
- **Role**: Admin

### Student Account
- **Email**: `student@student.nl`
- **Password**: `password123`
- **Role**: Student

### Teacher Account
- **Email**: `teacher@teacher.nl`
- **Password**: `password123`
- **Role**: Teacher

## Production Deployment

Production never uses the schema-reset or the demo seed. The sequence is:

```bash
npm run migrate                    # applies pending migrations, never drops anything
npm run create-admin               # bootstrap the first admin/teacher account safely
node seed-database.js --catalog    # course catalog only, after reviewing its content
```

`seed-database.js --demo` and `--all` refuse to run when `NODE_ENV=production`. `config/dev-reset-schema.sql`
and the scripts that run it (`setup-postgres.js`, `setup-and-seed-ai-lit-stud.js`) also refuse under
`NODE_ENV=production` — they are for a clean local reinstall only.

## Troubleshooting

### Permission Errors
Make sure your database user has sufficient permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE ai_literacy_db TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Sequence Issues
Both seed files call `setval(...)` for every table they touch after inserting, so IDs keep auto-incrementing
correctly afterwards. If you ever load data another way and sequences get out of sync:
```sql
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);
-- Repeat for all tables
```
