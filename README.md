# 🎓 AI Literacy Platform

A comprehensive, full-stack learning platform for AI literacy education, featuring gamification, interactive quizzes, progress tracking, and a rich content management system.

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=flat&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Features

### 🎯 Core Features
- **User Authentication** - Secure JWT-based login and registration system
- **Learning Materials** - Browse and filter courses, videos, podcasts, games, and practical examples
- **BASIS Track** - Foundational AI literacy courses with dedicated tag-based filtering
- **Content Viewer** - Draggable window interface with support for:
  - YouTube and Vimeo videos
  - Spotify podcasts
  - iFrame embedding
  - Fullscreen mode
- **Quiz System**
  - Content-based quizzes for BASIS items
  - General quiz system
  - Multiple choice questions
  - Automatic progress completion
  - Points and rewards integration
- **Admin Panel** - Full CRUD operations for:
  - Content management
  - Quiz management
  - User overview

### 🎮 Gamification
- **Points System** - Earn points for completing content and quizzes
- **Levels & Progression** - Level up based on total points
- **Streaks** - Daily login streaks with bonuses
- **Achievements** - Unlock badges for milestones
- **Leaderboard** - Competitive rankings with auto-generated user avatars
- **Challenges** - Daily, weekly, and monthly challenges

### 📊 Progress Tracking
- **Dashboard** - Personalized overview with:
  - User statistics (points, level, streak)
  - Recent activities
  - Active challenges
  - Progress charts
- **Content Progress** - Track completion across all materials
- **Quiz Results** - View scores and attempt history

### 🎨 User Experience
- **Responsive Design** - Mobile-friendly interface
- **Draggable Windows** - Reposition content viewer to your preference
- **Search & Filters** - Find content by:
  - Type (BASIS, E-Learning, Podcasts, Videos, Games, Praktijkvoorbeelden)
  - Difficulty level
  - Module
  - Tags
  - Featured content
- **Social Features** - Comments, ratings, and activity feed
- **Profile Management** - Customizable user profiles with avatars

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **React Toastify** - Beautiful notifications
- **React Icons** - Icon library
- **Custom Hooks** - useDraggable for window dragging

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Relational database with JSONB support
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing

### Database Features
- **JSONB** - Efficient tag storage and querying
- **Full-text Search** - ILIKE for case-insensitive searches
- **Parameterized Queries** - SQL injection protection
- **Foreign Keys** - Data integrity
- **Transactions** - Atomic operations
- **Upserts** - ON CONFLICT handling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 24.x** (pinned in `.nvmrc`) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - this platform uses **PostgreSQL only** - [Download](https://www.postgresql.org/download/)
- **npm** - Package manager
- **Git** (optional) - Version control

## 🚀 Getting started

There are three routes, depending on what you're doing.

### 1. Local development

```bash
git clone https://github.com/arniez/ai-literacy-platform.git
cd ai-literacy-platform

createdb -U postgres ai_literacy_db
# create server/config/config.env with PG_HOST, PG_USER, PG_PASSWORD, PG_NAME, PG_PORT and JWT_SECRET
# (or set DATABASE_URL instead of the separate PG_* fields)

npm run migrate                    # applies server/migrations/postgres/*.sql
node server/seed-database.js --all # course catalog + demo accounts (local only)
npm run dev                        # server (nodemon) + client (CRA) with hot reload
```

The app opens at [http://localhost:3000](http://localhost:3000); the CRA dev proxy forwards `/api` to `http://localhost:5002`.

**Demo accounts** (only created locally by `--all` or `--demo`, never seeded into production — see below):
- Admin: `admin@ailiteracy.nl` / `password123`
- Student: `student@student.nl` / `password123`

### 2. Testing a production build locally

```bash
cd client && npm run build && cd ..
NODE_ENV=production DATABASE_URL=postgres://postgres:<pw>@localhost:5432/ai_literacy_db JWT_SECRET=<test-secret> PORT=5050 node server/server.js
```

One Express server now serves both the API and the built React app on the same port — no CORS, no `REACT_APP_API_URL`. Walk through: home, login, dashboard, a content page with a YouTube video (no CSP errors in the console), a direct browser refresh on `/basiscursus`, the admin "AI voor studenten" tab, and check that `curl localhost:5050/api/health/ready` returns 200.

### 3. Publishing to Render

1. Connect the repository as a Render Blueprint (`render.yaml` in the repo root describes one Web Service plus a managed PostgreSQL database).
2. After the first deploy, run `npm run create-admin` once via the Render Shell to bootstrap the first admin account (password via `ADMIN_PASSWORD` or the hidden prompt — never as a CLI argument).
3. Run `node server/seed-database.js --catalog` to load the course catalog, after reviewing its content (some example URLs are placeholders — see `docs/live-deployment-plan.md`). Never run `--demo` or `--all` against production; the script refuses that itself when `NODE_ENV=production`.
4. Follow the full acceptance checklist in [`docs/live-deployment-plan.md`](docs/live-deployment-plan.md) before opening it up to students.

## 📁 Project Structure

```
AILiteracy/
├── client/                     # React Frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── layout/
│       │   │   └── Navbar.js   # Navigation bar
│       │   ├── common/
│       │   │   ├── ContentViewer.js  # Draggable content window
│       │   │   └── Badge.js
│       │   └── ContentQuizModal.js   # Quiz interface
│       ├── context/
│       │   ├── AuthContext.js  # Authentication context
│       │   └── LanguageContext.js
│       ├── hooks/
│       │   └── useDraggable.js # Custom drag hook
│       ├── pages/
│       │   ├── Home.js         # Landing page
│       │   ├── Login.js        # Authentication
│       │   ├── Register.js
│       │   ├── Dashboard.js    # User dashboard
│       │   ├── Leermaterialen.js  # Learning materials browse
│       │   ├── ContentView.js  # Content details
│       │   ├── Quiz.js         # Quiz system
│       │   ├── Admin.js        # Admin panel
│       │   ├── Badges.js       # Badges overview
│       │   ├── Leaderboard.js  # Rankings
│       │   ├── Profile.js      # User profile
│       │   └── Challenges.js   # Challenges
│       ├── utils/
│       │   ├── api.js          # Axios instance
│       │   └── avatar.js       # Avatar generation
│       ├── App.js
│       ├── App.css
│       └── index.js
│
├── server/                     # Express Backend
│   ├── app.js                  # createApp({ env }) — the actual Express app, testable without listening
│   ├── server.js                # Entry point: createApp + testConnection + listen
│   ├── db/
│   │   └── migrate.js           # Migration runner (schema_migrations, --status, --baseline)
│   ├── migrations/postgres/     # Numbered, non-destructive migrations (000_base_schema.sql, 001..005)
│   ├── scripts/
│   │   └── createAdmin.js       # npm run create-admin — bootstrap the first admin/teacher
│   ├── config/
│   │   ├── config.env           # Local environment variables (gitignored)
│   │   ├── env.js                # Loads config.env once via an absolute path
│   │   ├── dbConfig.js           # Builds the pg pool config from DATABASE_URL or PG_* + TLS
│   │   ├── db-postgres.js       # PostgreSQL pool
│   │   ├── db-universal.js      # query/insertAndGetId/withTransaction used by controllers
│   │   ├── security.js          # CSP, CORS and rate-limit configuration
│   │   ├── seed-catalog.sql     # Course catalog seed — safe for production
│   │   ├── seed-demo.sql        # Demo accounts and activity — local development only
│   │   └── dev-reset-schema.sql # Destructive reset schema — dev only, refuses under NODE_ENV=production
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── badgeController.js
│   │   ├── challengeController.js
│   │   ├── contentController.js
│   │   ├── contentQuizController.js
│   │   ├── quizController.js
│   │   ├── progressController.js
│   │   └── socialController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── badges.js
│   │   ├── challenges.js
│   │   ├── content.js
│   │   ├── contentQuiz.js     # Quiz routes
│   │   ├── quiz.js
│   │   ├── progress.js
│   │   └── social.js
│   ├── utils/
│   │   └── generateToken.js
│   └── seed-database.js       # node seed-database.js --catalog | --demo | --all
│
├── backups/                   # Database backups
├── render.yaml                 # Render Blueprint (one Web Service + PostgreSQL)
└── README.md                  # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updateprofile` - Update profile

### Content
- `GET /api/content` - Get all content (with filters)
- `GET /api/content/:id` - Get single content
- `POST /api/content` - Create content (Admin)
- `PUT /api/content/:id` - Update content (Admin)
- `DELETE /api/content/:id` - Delete content (Admin)
- `POST /api/content/:id/rate` - Rate content

### Quiz
- `GET /api/quiz` - Get all quizzes
- `GET /api/quiz/:id` - Get quiz by ID
- `POST /api/quiz/:id/submit` - Submit quiz answers
- `GET /api/content-quiz/:contentId` - Get content quiz
- `POST /api/content-quiz/:contentId/submit` - Submit content quiz

### Progress
- `GET /api/progress/stats` - Get user statistics
- `GET /api/progress/:contentId` - Get content progress
- `POST /api/progress/:contentId` - Update progress
- `GET /api/progress/history` - Get learning history

### Badges
- `GET /api/badges` - Get all badges
- `GET /api/badges/progress` - Get badge progress
- `GET /api/badges/:id` - Get badge details

### Challenges
- `GET /api/challenges` - Get all challenges
- `GET /api/challenges/my` - Get user challenges
- `POST /api/challenges/:id/accept` - Accept challenge
- `POST /api/challenges/:id/submit` - Submit challenge

### Social
- `GET /api/social/leaderboard` - Get leaderboard
- `GET /api/social/feed` - Get activity feed
- `POST /api/social/comments/:contentId` - Post comment
- `GET /api/social/comments/:contentId` - Get comments

## 🎯 Key Features Explained

### Draggable Content Viewer

The content viewer window can be dragged anywhere on the screen:
- Click and hold the header to drag
- Visual indicator shows it's draggable
- Enhanced shadow while dragging
- Automatically resets when toggling fullscreen

### BASIS Content & Quizzes

Content tagged with "basis" automatically shows a quiz option:
1. User views BASIS content
2. Clicks "Maak Quiz" button
3. Completes multiple choice questions
4. Receives score and feedback
5. Content marked as complete if quiz passed
6. Earns points and rewards

### PostgreSQL JSONB Tag Filtering

Efficient tag filtering using PostgreSQL's JSONB type:
```sql
SELECT * FROM content
WHERE tags @> '["basis"]'::jsonb
```

### Admin Panel

Full content and quiz management:
- Create, edit, delete content items
- Manage quiz questions and answers
- View user statistics
- Monitor platform activity

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Helmet.js security headers
- **CORS** - Configured cross-origin requests
- **Input Validation** - Server-side validation
- **Protected Routes** - Middleware authentication
- **Environment Variables** - Sensitive data protection

## 📊 Database Schema

Main tables:
- **users** - User accounts and profiles
- **content** - Learning materials
- **modules** - Content organization
- **user_progress** - Completion tracking
- **content_ratings** - User ratings
- **quizzes** - Quiz definitions
- **quiz_questions** - Quiz questions
- **content_quiz** - Content-quiz relationships
- **quiz_attempts** - Quiz attempt history
- **badges** - Achievement definitions
- **user_badges** - Earned badges
- **challenges** - Challenge definitions
- **user_challenges** - User challenge progress
- **comments** - User comments
- **activities** - Activity log

## 🎮 Gamification System

### Points System
- Complete content: +10-50 points (based on difficulty)
- Complete quiz: +20 points
- Rate content: +5 points
- Comment on content: +5 points
- Daily login streak: +10 points

### Levels
- Level 1: 0-100 points
- Level 2: 101-250 points
- Level 3: 251-500 points
- Level 4: 501-1000 points
- Level 5: 1001+ points

### Badges
- **Beginner** - Complete first content
- **Dedicated Learner** - 7-day streak
- **Quiz Master** - Pass 5 quizzes
- **AI Literate** - Complete all BASIS content
- **Community Member** - 10 comments
- And more...

## 🌐 Deployment

See "Getting started → 3. Publishing to Render" above for the short version, and [`docs/live-deployment-plan.md`](docs/live-deployment-plan.md) for the full plan and acceptance checklist. In short: one Render Web Service (built from `render.yaml`) serves both the API and the React app from the same origin, with `preDeployCommand: npm run migrate` applying schema changes before each deploy.

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
psql -U postgres -l

# Test connection
psql -U postgres -d ai_literacy_db
```

### Port Already in Use
```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
lsof -ti:3000 | xargs kill
lsof -ti:5002 | xargs kill
```

### Module Not Found
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Development

### Running in Development Mode

```bash
# Backend with auto-reload (if nodemon installed)
cd server
npm run dev

# Frontend
cd client
npm start
```

### Database Migrations

```bash
npm run migrate              # apply pending migrations in server/migrations/postgres/
npm run migrate -- --status  # show which migrations are applied
```

To add a schema change, add a new `server/migrations/postgres/NNN_name.sql` file — never edit an existing one.

### Re-seed Database

```bash
node server/seed-database.js --catalog  # course catalog (modules, content, badges, challenges)
node server/seed-database.js --demo     # demo accounts and activity (refuses under NODE_ENV=production)
node server/seed-database.js --all      # both
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Development** - AI Literacy Platform Team

## 🙏 Acknowledgments

- React team for the amazing framework
- PostgreSQL for the powerful database
- Express.js community
- All contributors and testers

## 📚 Documentation

- **Deployment plan and acceptance checklist** - See [docs/live-deployment-plan.md](docs/live-deployment-plan.md)
- **Database schema** - See [server/migrations/postgres/](server/migrations/postgres/) (numbered migrations; never edit an existing one)

## 🔗 Links

- **Repository**: https://github.com/arniez/ai-literacy-platform

## 📈 Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time notifications (Socket.io)
- [ ] Video conferencing integration
- [ ] AI-powered content recommendations
- [ ] Certificate generation
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Export progress reports

---

**Built with ❤️ for AI Literacy Education**
