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

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** - Package manager
- **Git** (optional) - Version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/arniez/ai-literacy-platform.git
cd ai-literacy-platform
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure Database

Create PostgreSQL database:
```bash
createdb -U postgres ai_literacy_db
```

Import schema:
```bash
psql -U postgres -d ai_literacy_db -f server/config/database-postgres.sql
```

### 4. Configure Environment Variables

Create `server/.env`:

```env
# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=ai_literacy_db
DB_PORT=5432

# Server Configuration
PORT=5002
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_secret_key_at_least_32_characters_long
JWT_EXPIRE=30d
```

### 5. Seed Demo Data

```bash
cd server
node seed-database.js
```

### 6. Start the Application

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

The application will open at [http://localhost:3000](http://localhost:3000)

## 🔐 Demo Accounts

After seeding the database, use these credentials:

**Admin:**
- Email: `admin@ailiteracy.nl`
- Password: `password123`

**Student:**
- Email: `student@student.nl`
- Password: `password123`

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
│   ├── config/
│   │   ├── .env               # Environment variables
│   │   ├── db-postgres.js     # PostgreSQL connection
│   │   ├── db-universal.js    # Universal DB adapter
│   │   └── database-postgres.sql  # Database schema
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── badgeController.js
│   │   ├── challengeController.js
│   │   ├── contentController.js     # PostgreSQL optimized
│   │   ├── contentQuizController.js # Quiz integration
│   │   ├── quizController.js        # Quiz management
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
│   ├── migrations/
│   │   ├── add-quiz-system.sql
│   │   └── add-content-quiz.sql
│   ├── utils/
│   │   └── generateToken.js
│   ├── seed-database.js       # Database seeding
│   └── server.js              # Entry point
│
├── backups/                   # Database backups
├── README.md                  # This file
├── QUICKSTART.md             # Quick setup guide
└── INSTALL.md                # Detailed installation
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

### Backend Deployment (Example: Heroku)

```bash
# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Frontend Deployment (Example: Vercel)

```bash
cd client
npm run build
vercel --prod
```

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
# Run quiz migration
node run-quiz-migration.js

# Run content quiz migration
node run-content-quiz-migration.js
```

### Re-seed Database

```bash
cd server
node seed-database.js
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

- **Quick Start Guide** - See [QUICKSTART.md](QUICKSTART.md)
- **Installation Guide** - See [INSTALL.md](INSTALL.md)
- **Database Schema** - See [server/config/database-postgres.sql](server/config/database-postgres.sql)

## 🔗 Links

- **Repository**: https://github.com/arniez/ai-literacy-platform
- **Current Branch**: ailiteracy11

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
