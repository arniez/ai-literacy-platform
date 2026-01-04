# Neon Database Setup & Deployment Guide

This guide will help you set up your Neon PostgreSQL database and deploy your AI Literacy Platform.

## Prerequisites

✅ You already have:
- Neon database created
- Database credentials configured in `server/config/config.env`
- All code changes committed to branch `claude/seed-neon-database-zBmqK`

## Step 1: Set Up Database Schema

Run this command from your **local machine** or **deployment environment**:

```bash
cd server
node setup-postgres.js
```

**What this does:**
- Connects to your Neon database
- Creates all required tables (users, modules, content, badges, etc.)
- Verifies the tables were created successfully

**Expected output:**
```
✓ Connected to database: neondb
✓ Executing schema...
✓ Schema created successfully!
✓ Created 11 tables:
  - badges
  - challenges
  - comments
  - content
  - content_ratings
  - modules
  - notifications
  - user_badges
  - user_challenges
  - user_progress
  - users

╔════════════════════════════════════════════════════╗
║                                                    ║
║   PostgreSQL Database Setup Complete! ✓           ║
║                                                    ║
║   Next steps:                                      ║
║   1. Run: npm run seed                             ║
║      (to populate database with initial data)      ║
║   2. Start server: npm start                       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

## Step 2: Seed Database with Initial Data

After the schema is created, run:

```bash
npm run seed
```

**What this does:**
- Clears existing data (if any)
- Inserts initial data:
  - 14 users (admin, teachers, students)
  - 4 learning modules
  - 37 content items (videos, courses, podcasts, games)
  - 10 badges
  - 4 challenges
  - Comments, ratings, and notifications

**Expected output:**
```
🌱 Seeding database with initial data...

📖 Reading seed data file...
🗑️  Clearing existing data...

   ✓ Cleared notifications
   ✓ Cleared content_ratings
   ✓ Cleared comments
   ✓ Cleared user_challenges
   ✓ Cleared challenges
   ✓ Cleared user_badges
   ✓ Cleared badges
   ✓ Cleared user_progress
   ✓ Cleared content
   ✓ Cleared modules
   ✓ Cleared users

💾 Inserting seed data...

✅ Database seeded successfully!
📊 Inserted 100+ rows
🔢 Updated 11 sequences
```

## Step 3: Test Database Connection (Optional)

To verify your connection is working:

```bash
node test-neon-connection.js
```

## Step 4: Start Your Server

```bash
npm start
# or for development:
npm run dev
```

## Default Login Accounts

After seeding, you can login with these accounts:

### Admin Account
- **Email:** `admin@ailiteracy.nl`
- **Password:** `password123`
- **Role:** Administrator

### Student Account
- **Email:** `student@student.nl`
- **Password:** `password123`
- **Role:** Student

### Teacher Account
- **Email:** `teacher@teacher.nl`
- **Password:** `password123`
- **Role:** Teacher

---

## Deploying to Vercel (Recommended)

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Configure Environment Variables

In your Vercel dashboard or via CLI, add these environment variables:

```bash
# PostgreSQL (Neon)
PG_HOST=ep-curly-lake-agc8n0as-pooler.c-2.eu-central-1.aws.neon.tech
PG_USER=neondb_owner
PG_PASSWORD=npg_l4bztWmo6xkE
PG_NAME=neondb
PG_PORT=5432

# JWT
JWT_SECRET=your-production-secret-key-change-this
JWT_EXPIRE=30d

# Server
NODE_ENV=production
PORT=5002
```

### 3. Deploy

From the project root:

```bash
vercel --prod
```

### 4. Run Database Setup on Vercel

You have two options:

**Option A: Run locally before deploying**
```bash
# Run setup and seeding locally
node server/setup-postgres.js
npm run seed

# Then deploy
vercel --prod
```

**Option B: Run as Vercel build step**

Add to `server/package.json`:
```json
{
  "scripts": {
    "setup-db": "node setup-postgres.js && npm run seed",
    "vercel-build": "npm run setup-db"
  }
}
```

---

## Troubleshooting

### Connection Errors

If you get `ECONNREFUSED` or `EAI_AGAIN`:
1. Check your credentials in `config.env`
2. Verify your IP is allowed in Neon dashboard
3. Ensure SSL is enabled for Neon connections

### Schema Already Exists

If tables already exist, the script may fail. To reset:

**Option 1: Drop all tables manually**
```sql
-- Connect to Neon via their SQL editor and run:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

**Option 2: Use seed script directly** (clears data but keeps schema)
```bash
npm run seed
```

### Seed Data Not Showing

Make sure you:
1. Ran `setup-postgres.js` first
2. Then ran `npm run seed`
3. Restarted your server

---

## Next Steps

After successful setup:

1. ✅ **Database is ready** with schema and seed data
2. ✅ **Start your server** with `npm start`
3. ✅ **Test the application** by logging in
4. 🚀 **Deploy to production** using Vercel or another platform

---

## Need Help?

If you encounter issues:
1. Check the console output for specific errors
2. Verify all environment variables are set correctly
3. Test connection with `node test-neon-connection.js`
4. Check Neon dashboard for connection logs

Good luck with your deployment! 🎉
