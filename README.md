# AI Literacy Platform

A comprehensive learning platform for AI literacy education, featuring gamification, progress tracking, and interactive learning materials.

## Features

- **User Authentication** - Secure login and registration system
- **Learning Materials** - Browse courses, videos, podcasts, games, and practical examples
- **BASIS Track** - Foundational AI literacy courses with dedicated filtering
- **Gamification** - Points, levels, streaks, and achievements
- **Leaderboard** - Competitive rankings with auto-generated user avatars
- **Progress Tracking** - Track completion and progress across all materials
- **Dashboard** - Personalized overview with statistics and recommendations
- **CEO Welcome Video** - Customizable welcome message for new users

## Tech Stack

### Frontend
- React.js
- React Router
- Axios
- React Toastify
- React Icons

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcrypt

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. Configure environment variables in `server/.env`
4. Import database schema from `server/config/database.sql`
5. Start servers:
   ```bash
   # Backend: cd server && npm start
   # Frontend: cd client && npm start
   ```

## Project Structure

- `client/` - React frontend application
- `server/` - Express backend API
- `server/config/` - Database and configuration files

## License

MIT License
