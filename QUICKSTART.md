# 🚀 Quick Start Guide - AI Literacy Platform

Get up and running in 5 minutes!

## Prerequisites

✅ **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
✅ **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
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

### Step 2: Setup PostgreSQL Database

**Option A: Using PostgreSQL Command Line**
```bash
psql -U postgres -d ai_literacy_db -f server/config/database-postgres.sql
```

**Option B: Using pgAdmin**
1. Create database: `ai_literacy_db`
2. Open `server/config/database-postgres.sql`
3. Execute the SQL in pgAdmin query tool

### Step 3: Configure Environment

Create `server/.env` file:

```env
# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
DB_NAME=ai_literacy_db
DB_PORT=5432

# Server Configuration
PORT=5002
NODE_ENV=development

# JWT Configuration
JWT_SECRET=change_this_to_a_random_secret_key_at_least_32_chars
JWT_EXPIRE=30d
```

### Step 4: Seed Demo Data

```bash
cd server
node seed-database.js
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
npm start
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
- ✅ PostgreSQL database with full schema
- ✅ JWT authentication & authorization
- ✅ User management
- ✅ Content management (PostgreSQL optimized)
- ✅ Progress tracking
- ✅ Quiz system (BASIS content + general quizzes)
- ✅ Content quiz integration
- ✅ Badges & achievements system
- ✅ Challenges (daily/weekly/monthly)
- ✅ Social features (comments, likes, follows)
- ✅ Leaderboard
- ✅ Notifications
- ✅ Activity feed
- ✅ Demo data seeding

### ✅ Frontend (Implemented Features)
- ✅ React 18 with React Router
- ✅ Authentication (Login/Register)
- ✅ Protected routes
- ✅ Responsive navigation
- ✅ Home page with hero section
- ✅ User context & state management
- ✅ Toast notifications
- ✅ Beautiful UI with CSS variables
- ✅ Dashboard with statistics
- ✅ Learning Materials page (Leermaterialen)
  - ✅ Content filtering by type (BASIS, E-LEARNING, PODCASTS, VIDEOS, GAMES, PRAKTIJKVOORBEELDEN)
  - ✅ Search functionality
  - ✅ Difficulty filters
  - ✅ Module filters
  - ✅ Featured content
  - ✅ Tag-based filtering (JSONB support)
- ✅ Content Viewer
  - ✅ Draggable window interface
  - ✅ Video/iframe embedding
  - ✅ YouTube, Vimeo, Spotify support
  - ✅ Fullscreen mode
  - ✅ External link support
- ✅ Content Details page
  - ✅ Progress tracking
  - ✅ Rating system
  - ✅ View counter
  - ✅ Rewards display
- ✅ Quiz System
  - ✅ Content-based quizzes (BASIS items)
  - ✅ General quizzes
  - ✅ Multiple choice questions
  - ✅ Progress tracking
  - ✅ Scoring system
  - ✅ Completion rewards
- ✅ Admin Panel
  - ✅ Content management (CRUD)
  - ✅ Quiz management
  - ✅ User overview
- ✅ Badges page
- ✅ Leaderboard
- ✅ Profile page with social features

## Recent Updates (Branch: ailiteracy11)

### 🎉 Quiz System
- Full quiz implementation for BASIS content items
- General quiz system with questions and answers
- Admin interface for quiz management
- Automatic content completion after quiz success
- Points and rewards integration

### 🎨 UI Enhancements
- Draggable content viewer window
- Improved content filtering with PostgreSQL JSONB
- BASIS tag filtering now working correctly
- Enhanced navigation with Quiz link

### 🔧 Technical Improvements
- Migrated from MySQL to PostgreSQL
- Fixed tag filtering using JSONB containment operator (`@>`)
- Optimized content queries with dynamic parameter counting
- Database backup system

## Project Structure

```
AILiteracy/
├── server/                    # Backend (Node.js/Express)
│   ├── config/
│   │   ├── .env              # ⚠️  Configure this!
│   │   ├── db-postgres.js
│   │   ├── db-universal.js
│   │   └── database-postgres.sql
│   ├── controllers/          # ✅ Complete
│   │   ├── authController.js
│   │   ├── badgeController.js
│   │   ├── challengeController.js
│   │   ├── contentController.js    # PostgreSQL optimized
│   │   ├── contentQuizController.js # NEW
│   │   ├── quizController.js       # NEW
│   │   ├── progressController.js
│   │   └── socialController.js
│   ├── middleware/           # ✅ Complete
│   ├── routes/               # ✅ Complete
│   │   ├── contentQuiz.js    # NEW
│   │   └── quiz.js           # NEW
│   ├── migrations/           # Database migrations
│   │   ├── add-quiz-system.sql
│   │   └── add-content-quiz.sql
│   ├── scripts/
│   │   └── seedData.js       # ✅ Complete
│   ├── utils/
│   └── server.js
│
├── client/                    # Frontend (React)
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── layout/
│       │   │   └── Navbar.js       # ✅ Complete
│       │   ├── common/
│       │   │   └── ContentViewer.js # ✅ Draggable
│       │   └── ContentQuizModal.js  # NEW
│       ├── context/
│       │   └── AuthContext.js      # ✅ Complete
│       ├── hooks/
│       │   └── useDraggable.js     # NEW - Custom drag hook
│       ├── pages/
│       │   ├── Home.js             # ✅ Complete
│       │   ├── Login.js            # ✅ Complete
│       │   ├── Register.js         # ✅ Complete
│       │   ├── Dashboard.js        # ✅ Complete
│       │   ├── Leermaterialen.js   # ✅ Complete
│       │   ├── ContentView.js      # ✅ Complete
│       │   ├── Quiz.js             # ✅ Complete - NEW
│       │   ├── Admin.js            # ✅ Complete - NEW
│       │   ├── Badges.js           # ✅ Complete
│       │   ├── Leaderboard.js      # ✅ Complete
│       │   └── Profile.js          # ✅ Complete
│       ├── utils/
│       │   └── api.js              # ✅ Complete
│       ├── App.js                  # ✅ Complete
│       └── index.js
│
├── backups/                   # Database backups
├── README.md                  # Full documentation
├── INSTALL.md                 # Detailed installation guide
└── QUICKSTART.md             # This file
```

## Common Commands

```bash
# Backend
cd server
npm start            # Production mode
npm run dev          # Development mode (if nodemon installed)
node seed-database.js  # Re-seed database
node run-quiz-migration.js  # Run quiz migration
node run-content-quiz-migration.js  # Run content quiz migration

# Frontend
cd client
npm start            # Development server
npm run build        # Production build

# Database
psql -U postgres -d ai_literacy_db -f server/config/database-postgres.sql  # Reset DB
```

## Troubleshooting

### Can't connect to database?
1. Ensure PostgreSQL is running
2. Check credentials in `server/.env`
3. Verify database exists: `psql -U postgres -l`
4. Create database if needed: `createdb -U postgres ai_literacy_db`

### Port already in use?
- Kill process on port 3000 (frontend) or 5002 (backend)
- Windows: `taskkill /F /IM node.exe`
- Or change ports in `.env` and `client/package.json`

### Module not found?
```bash
rm -rf node_modules package-lock.json
npm install
```

### Quiz not showing?
- Content must have the 'basis' tag to show quiz option
- Run content quiz migration: `node run-content-quiz-migration.js`
- Check if questions exist in database

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

Test BASIS filter:
```bash
curl "http://localhost:5002/api/content?tag=basis"
```

## Key Features

### 1. **Content Management** ✅
- Browse learning materials by type
- Search and filter content
- Tag-based filtering (BASIS items)
- Progress tracking
- Rating system

### 2. **Quiz System** ✅
- BASIS content quizzes (integrated with content completion)
- General quiz system
- Multiple choice questions
- Score tracking
- Completion rewards

### 3. **Draggable Content Viewer** ✅
- Drag and reposition content window
- Video embedding (YouTube, Vimeo)
- Audio embedding (Spotify)
- Fullscreen mode
- External link support

### 4. **Admin Panel** ✅
- Content CRUD operations
- Quiz management
- User management

### 5. **Gamification** ✅
- Points and levels
- Badges and achievements
- Challenges
- Leaderboard

### 6. **Social Features** ✅
- User profiles
- Activity feed
- Comments and ratings
- Leaderboard rankings

## Demo Data Included

- 4 demo users (admin, students, teacher)
- 4 learning modules
- 15+ pieces of content (courses, videos, podcasts, games, case studies)
- 8 BASIS content items with quizzes
- 10 badges with different rarities
- 4 active challenges
- Sample comments, ratings, and activities

## Technology Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL (with pg library)
- JWT Authentication
- bcryptjs for password hashing

**Frontend:**
- React 18
- React Router v6
- Axios for API calls
- React Icons
- React Toastify
- Custom hooks (useDraggable)

## PostgreSQL Features Used

✅ JSONB data type for tags
✅ JSONB containment operator (`@>`)
✅ Case-insensitive search (ILIKE)
✅ Parameterized queries with `$1, $2, $3`
✅ ON CONFLICT for upserts
✅ Foreign key constraints
✅ Transactions

## Security Features

✅ JWT-based authentication
✅ Password hashing (bcrypt)
✅ Protected API routes
✅ Helmet.js security headers
✅ Input validation
✅ SQL injection protection (parameterized queries)
✅ CORS configuration

## Support

Need help? Check:
1. `INSTALL.md` for detailed installation steps
2. `README.md` for full documentation
3. Console logs for error messages
4. Database connection with `curl http://localhost:5002/api/health`

## GitHub Branch

Current development branch: **ailiteracy11**

Features in this branch:
- Quiz system implementation
- Draggable content viewer
- PostgreSQL optimizations
- BASIS filter fixes
- Admin panel enhancements

---

**Ready to learn about AI! 🚀**

The platform is fully functional with content management, quizzes, progress tracking, and gamification features!
