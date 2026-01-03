# 🎯 START HERE - AI Literacy Platform

## Your MySQL Credentials
- **User**: root
- **Password**: root

## Quick Start (3 Commands)

### 1. Install Everything
```bash
# From the AILiteracy directory
cd server
npm install

cd ../client
npm install

cd ..
```

### 2. Setup Database
```bash
# Create the database and tables
mysql -u root -proot < server/config/database.sql

# Seed with demo data
cd server
node scripts/seedData.js
```

### 3. Start Both Servers

**Terminal 1** (keep open):
```bash
cd server
npm run dev
```

**Terminal 2** (keep open):
```bash
cd client
npm start
```

## ✅ You're Ready!

The app will open automatically at **http://localhost:3000**

## Login with Demo Account

**Email**: `student@student.nl`
**Password**: `password123`

---

## What You Have

✅ **Complete Backend API** - All endpoints ready
✅ **Database with Demo Data** - Users, content, badges, challenges
✅ **Authentication System** - Login/Register working
✅ **Beautiful UI Framework** - Ready to build on

## What's Next

Build out these pages (stub files created, just add UI):

1. **Dashboard** ([Dashboard.js](client/src/pages/Dashboard.js))
   - Use API: `GET /api/progress/stats`
   - Show user stats, recent activity, challenges

2. **Learning Materials** ([Leermaterialen.js](client/src/pages/Leermaterialen.js))
   - Use API: `GET /api/content`
   - Display content cards, filters, search

3. **Badges** ([Badges.js](client/src/pages/Badges.js))
   - Use API: `GET /api/badges/progress`
   - Show earned and locked badges

4. **Leaderboard** ([Leaderboard.js](client/src/pages/Leaderboard.js))
   - Use API: `GET /api/social/leaderboard`
   - Display top users

## File Structure

```
AILiteracy/
├── server/                 ← Backend (COMPLETE ✅)
│   ├── config/
│   │   └── config.env     ← MySQL password: root
│   ├── controllers/       ← All API logic ready
│   ├── routes/            ← All endpoints ready
│   └── scripts/
│       └── seedData.js    ← Creates demo data
│
├── client/                 ← Frontend (UI to build)
│   └── src/
│       ├── pages/         ← Build these pages
│       │   ├── Dashboard.js       (stub)
│       │   ├── Leermaterialen.js  (stub)
│       │   ├── Badges.js          (stub)
│       │   └── ...
│       └── components/    ← Reusable components
│
├── README.md              ← Full documentation
├── QUICKSTART.md          ← 5-minute setup guide
└── START.md               ← This file
```

## Available APIs

All these endpoints are working and ready to use:

**Authentication:**
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`

**Content:**
- GET `/api/content` - Get all learning materials
- GET `/api/content/:id` - Get specific content
- POST `/api/content/:id/rate` - Rate content

**Progress:**
- GET `/api/progress` - User's progress
- POST `/api/progress/:contentId` - Update progress
- GET `/api/progress/stats` - User statistics

**Badges:**
- GET `/api/badges` - All badges
- GET `/api/badges/progress` - User's badge progress

**Social:**
- GET `/api/social/leaderboard` - Rankings
- GET `/api/social/comments/:contentId` - Comments
- POST `/api/social/follow/:userId` - Follow user

**Challenges:**
- GET `/api/challenges` - All challenges
- GET `/api/challenges/my` - User's challenges
- POST `/api/challenges/:id/accept` - Accept challenge

## Need Help?

1. **Can't connect to MySQL?**
   - Ensure MySQL is running
   - Credentials are: root/root

2. **Port already in use?**
   - Kill the process or change port in config.env

3. **Seed data errors?**
   - Run database.sql first
   - Then run seedData.js

## Docs

- [QUICKSTART.md](QUICKSTART.md) - 5-minute setup
- [INSTALL.md](INSTALL.md) - Detailed installation
- [README.md](README.md) - Full documentation

---

**🚀 Happy Coding!**

Everything is set up and ready. Just build the UI! 🎨
