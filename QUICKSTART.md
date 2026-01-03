# 🚀 Quick Start Guide - AI Literacy Platform

Get up and running in 5 minutes!

## Prerequisites

✅ **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
✅ **MySQL** (v5.7 or higher) - [Download](https://dev.mysql.com/downloads/)
✅ **Git** (optional)

## Installation (5 Steps)

### Step 1: Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2: Setup MySQL Database

**Option A: Using MySQL Command Line**
```bash
mysql -u root -p < server/config/database.sql
```

**Option B: Using MySQL Workbench/phpMyAdmin**
1. Open `server/config/database.sql`
2. Copy and execute the SQL in your MySQL client

### Step 3: Configure Environment

Edit `server/config/config.env`:

```env
# REQUIRED: Change these values!
DB_PASSWORD=your_mysql_password
JWT_SECRET=change_this_to_a_random_secret_key_at_least_32_chars
```

### Step 4: Seed Demo Data

```bash
cd server
node scripts/seedData.js
```

Expected output:
```
✅ Database seeding completed successfully!

Demo Users:
- Admin: admin@ailiteracy.nl / password123
- Student: student@student.nl / password123
```

### Step 5: Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

🎉 **Done!** The app should open at [http://localhost:3000](http://localhost:3000)

## First Login

1. Go to http://localhost:3000
2. Click "Inloggen"
3. Use demo credentials:
   - **Email:** `student@student.nl`
   - **Password:** `password123`

## What's Included

### ✅ Backend (Complete)
- ✅ RESTful API with Express.js
- ✅ MySQL database with full schema
- ✅ JWT authentication & authorization
- ✅ User management
- ✅ Content management
- ✅ Progress tracking
- ✅ Badges & achievements system
- ✅ Challenges (daily/weekly/monthly)
- ✅ Social features (comments, likes, follows)
- ✅ Leaderboard
- ✅ Notifications
- ✅ Activity feed
- ✅ Demo data seeding

### ✅ Frontend (Core Features)
- ✅ React 18 with React Router
- ✅ Authentication (Login/Register)
- ✅ Protected routes
- ✅ Responsive navigation
- ✅ Home page
- ✅ User context & state management
- ✅ Toast notifications
- ✅ Beautiful UI with CSS variables
- ⏳ Dashboard (stub - to be implemented)
- ⏳ Learning Materials (stub - to be implemented)
- ⏳ Badges page (stub - to be implemented)
- ⏳ Leaderboard (stub - to be implemented)
- ⏳ Profile (stub - to be implemented)

## Next Steps for Development

The core infrastructure is complete! Here's what you can build next:

### 1. **Dashboard Page** (High Priority)
- User stats widget (points, level, streak)
- Recent activities
- Active challenges
- Progress overview
- Quick access to content

**API Endpoints Ready:**
- `GET /api/progress/stats` - User statistics
- `GET /api/social/feed` - Activity feed
- `GET /api/challenges/my` - User challenges

### 2. **Learning Materials Page** (High Priority)
- Content grid/list view
- Filters (type, difficulty, module)
- Search functionality
- Content cards with thumbnails
- Progress indicators

**API Endpoints Ready:**
- `GET /api/content` - Get all content with filters
- `GET /api/content/:id` - Get specific content

### 3. **Content Viewer**
- Display content details
- Video/iframe embedding
- Progress tracking
- Comments section
- Rating system
- Related content

**API Endpoints Ready:**
- `POST /api/progress/:contentId` - Update progress
- `POST /api/content/:id/rate` - Rate content
- `GET /api/social/comments/:contentId` - Get comments
- `POST /api/social/comments/:contentId` - Post comment

### 4. **Badges Page**
- Display all badges
- Show earned vs locked badges
- Progress towards badges
- Badge details & requirements

**API Endpoints Ready:**
- `GET /api/badges` - All badges
- `GET /api/badges/progress` - Badge progress

### 5. **Leaderboard**
- Top users by points
- Filter by timeframe
- User rankings
- Profile links

**API Endpoints Ready:**
- `GET /api/social/leaderboard` - Get leaderboard

## Project Structure

```
AILiteracy/
├── server/                    # Backend (Node.js/Express)
│   ├── config/
│   │   ├── config.env        # ⚠️  Configure this!
│   │   ├── db.js
│   │   └── database.sql
│   ├── controllers/          # ✅ Complete
│   ├── middleware/           # ✅ Complete
│   ├── routes/               # ✅ Complete
│   ├── scripts/
│   │   └── seedData.js       # ✅ Complete
│   ├── utils/
│   └── server.js
│
├── client/                    # Frontend (React)
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── layout/
│       │       └── Navbar.js # ✅ Complete
│       ├── context/
│       │   └── AuthContext.js # ✅ Complete
│       ├── pages/
│       │   ├── Home.js       # ✅ Complete
│       │   ├── Login.js      # ✅ Complete
│       │   ├── Register.js   # ✅ Complete
│       │   ├── Dashboard.js  # ⏳ Stub
│       │   ├── Leermaterialen.js # ⏳ Stub
│       │   ├── Badges.js     # ⏳ Stub
│       │   ├── Leaderboard.js # ⏳ Stub
│       │   └── Profile.js    # ⏳ Stub
│       ├── utils/
│       │   └── api.js        # ✅ Complete
│       ├── App.js            # ✅ Complete
│       └── index.js
│
├── README.md                  # Full documentation
├── INSTALL.md                 # Detailed installation guide
└── QUICKSTART.md             # This file
```

## Common Commands

```bash
# Backend
cd server
npm run dev          # Development mode (auto-restart)
npm start            # Production mode
node scripts/seedData.js  # Re-seed database

# Frontend
cd client
npm start            # Development server
npm run build        # Production build

# Database
mysql -u root -p < server/config/database.sql  # Reset DB
```

## Troubleshooting

### Can't connect to database?
1. Ensure MySQL is running
2. Check credentials in `server/config/config.env`
3. Verify database exists: `mysql -u root -p` then `SHOW DATABASES;`

### Port already in use?
- Kill process on port 3000 (frontend) or 5002 (backend)
- Or change ports in `config.env` and `client/package.json`

### Module not found?
```bash
rm -rf node_modules package-lock.json
npm install
```

## API Testing

Test if backend is working:
```bash
curl http://localhost:5002/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-02T..."
}
```

## Key Features to Implement

1. **Dashboard** - User overview & stats
2. **Learning Materials** - Browse & filter content
3. **Content Viewer** - Watch/read content with progress tracking
4. **Badges** - Show achievements
5. **Leaderboard** - Rankings & competition
6. **Profile** - User profiles with social features
7. **Challenges** - Accept & track challenges
8. **Admin Panel** - Content management (bonus)

All backend APIs for these features are already implemented! 🎉

## Resources

- **Full Documentation**: See `README.md`
- **Detailed Installation**: See `INSTALL.md`
- **Database Schema**: See `server/config/database.sql`
- **API Endpoints**: See `README.md` API section

## Demo Data Included

- 4 demo users (admin, students, teacher)
- 4 learning modules
- 10+ pieces of content (courses, videos, games, case studies)
- 10 badges with different rarities
- 4 active challenges
- Sample comments, ratings, and activities

## Technology Stack

**Backend:**
- Node.js + Express.js
- MySQL (with mysql2)
- JWT Authentication
- bcryptjs for password hashing

**Frontend:**
- React 18
- React Router v6
- Axios for API calls
- React Icons
- React Toastify
- Framer Motion (ready for animations)

## Security Features

✅ JWT-based authentication
✅ Password hashing (bcrypt)
✅ Protected API routes
✅ Rate limiting
✅ Helmet.js security headers
✅ Input validation
✅ SQL injection protection

## Support

Need help? Check:
1. `INSTALL.md` for detailed installation steps
2. `README.md` for full documentation
3. Console logs for error messages
4. Database connection with `curl http://localhost:5002/api/health`

---

**Ready to build amazing AI literacy features! 🚀**

Start by implementing the Dashboard or Learning Materials page using the ready-made API endpoints!
