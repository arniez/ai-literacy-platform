# Database Seeding

This directory contains scripts to seed the PostgreSQL database with initial data.

## Files

- **`seed-data.sql`** - SQL file containing all seed data (auto-generated)
- **`seed-database.js`** - Script to load seed data into PostgreSQL
- **`export-seed-data.js`** - Script to export current database to seed file

## Usage

### Loading Seed Data

To seed a fresh database with initial data:

```bash
# Make sure PostgreSQL is running and database is created
npm run seed

# Or manually:
node seed-database.js
```

This will:
1. Clear all existing data from tables
2. Insert all seed data (users, modules, content, etc.)
3. Update sequences to correct values

⚠️ **Warning**: This will DELETE all existing data in the database!

### Exporting Current Data

To export the current database state as seed data:

```bash
# Export all data to seed-data.sql
node export-seed-data.js
```

This will update `config/seed-data.sql` with the current database contents.

## Seed Data Contents

The seed file includes:

- **14 users** - Admin, teachers, and students with various roles
- **4 modules** - Learning modules (AI Basics, Applications, Critical Thinking, Practical Skills)
- **37 content items** - Videos, courses, podcasts, games, case studies
- **11 user progress records** - Student progress tracking
- **10 badges** - Achievement badges
- **8 user badges** - Awarded badges
- **4 challenges** - Learning challenges
- **4 comments** - Content comments
- **5 content ratings** - User ratings
- **9 notifications** - User notifications

## Default Accounts

After seeding, you can login with:

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

## NPM Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "seed": "node seed-database.js",
    "seed:export": "node export-seed-data.js"
  }
}
```

## Production Deployment

For production deployment (Supabase, Railway, Render, etc.):

1. Create database and run schema:
   ```bash
   node setup-postgres.js
   ```

2. Load seed data:
   ```bash
   node seed-database.js
   ```

Or combine both steps:
```bash
node setup-postgres.js && node seed-database.js
```

## Troubleshooting

### Permission Errors
Make sure your database user has sufficient permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE ai_literacy_db TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Foreign Key Errors
The seed script automatically handles foreign key constraints by:
1. Temporarily disabling them during truncate
2. Loading data in correct order
3. Re-enabling constraints

### Sequence Issues
If IDs are not auto-incrementing after seeding, the sequences need updating:
```sql
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);
-- Repeat for all tables
```

This is handled automatically by the seed script.
