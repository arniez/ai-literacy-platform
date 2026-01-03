# Installation Guide - AI Literacy Platform

## Step-by-Step Installation

### 1. Prerequisites Check

Ensure you have:
- [ ] Node.js >= 14.0.0 installed (`node --version`)
- [ ] MySQL >= 5.7 installed and running
- [ ] npm installed (`npm --version`)

### 2. Install Dependencies

```bash
# From the root directory (AILiteracy)
cd server
npm install

cd ../client
npm install

cd ..
```

### 3. MySQL Database Setup

**Option A: Using MySQL Workbench or phpMyAdmin**
1. Open the file `server/config/database.sql`
2. Copy all the SQL and execute it in your MySQL client

**Option B: Using Command Line**
```bash
# Login to MySQL
mysql -u root -p

# Create the database (you'll be prompted for password)
# Then paste the contents of server/config/database.sql

# Or run the file directly:
mysql -u root -p < server/config/database.sql
```

### 4. Configure Environment Variables

Edit `server/config/config.env`:

```env
PORT=5002
NODE_ENV=development

# Change this to a secure random string!
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long

JWT_EXPIRE=30d

# Your MySQL configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=ai_literacy_db
DB_PORT=3306
```

**Important**: Replace `your_mysql_password_here` with your actual MySQL password!

### 5. Seed Demo Data

```bash
cd server
node scripts/seedData.js
```

You should see output like:
```
Starting database seeding...
Cleared existing data
Seeded users
Seeded modules
... (more output)
✅ Database seeding completed successfully!

Demo Users:
- Admin: admin@ailiteracy.nl / password123
- Student: student@student.nl / password123
```

### 6. Start the Application

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════╗
║   AI Literacy Server Running              ║
║   Environment: development                ║
║   Port: 5002                              ║
╚═══════════════════════════════════════════╝
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

The application should open automatically at `http://localhost:3000`

### 7. Test the Installation

1. Go to `http://localhost:3000`
2. Click "Registreren" or use a demo account:
   - Email: `student@student.nl`
   - Password: `password123`
3. You should see the Dashboard!

## Troubleshooting

### Error: "Cannot connect to database"

**Solution:**
1. Ensure MySQL is running:
   ```bash
   # Windows
   net start MySQL80  # or your MySQL service name

   # Mac
   mysql.server start

   # Linux
   sudo systemctl start mysql
   ```

2. Check your `config.env` database credentials
3. Test MySQL connection:
   ```bash
   mysql -u root -p
   # Enter your password
   # If it works, type: SHOW DATABASES;
   ```

### Error: "Port 3000 is already in use"

**Solution:**
```bash
# Kill the process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Error: "Port 5002 is already in use"

**Solution:**
Change the port in `server/config/config.env`:
```env
PORT=5003  # or any other available port
```

### Error: "Module not found"

**Solution:**
```bash
# Reinstall dependencies
cd server
rm -rf node_modules package-lock.json
npm install

cd ../client
rm -rf node_modules package-lock.json
npm install
```

### Seed Data Fails

**Solution:**
1. Ensure database exists:
   ```bash
   mysql -u root -p
   SHOW DATABASES;
   # Should show 'ai_literacy_db'
   ```

2. If not, run the database.sql script again
3. Try seeding again:
   ```bash
   cd server
   node scripts/seedData.js
   ```

## Quick Reference

### Demo User Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ailiteracy.nl | password123 |
| Student | student@student.nl | password123 |
| Student | jan@student.nl | password123 |
| Teacher | teacher@teacher.nl | password123 |

### Default Ports

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5002`
- Backend Health Check: `http://localhost:5002/api/health`

### Useful Commands

```bash
# Check if backend is running
curl http://localhost:5002/api/health

# View backend logs
cd server
npm run dev  # Logs appear in real-time

# Rebuild frontend
cd client
npm run build

# Reset database (WARNING: Deletes all data!)
mysql -u root -p < server/config/database.sql
cd server
node scripts/seedData.js
```

## Next Steps

After successful installation:

1. **Explore the Platform**
   - Login with a demo account
   - Browse learning materials
   - Complete some content
   - Earn badges and points!

2. **Customize**
   - Add your own content via the admin panel
   - Modify colors in `client/src/index.css`
   - Add custom badges in the database

3. **Development**
   - Read the main README.md for API documentation
   - Check the project structure
   - Start building new features!

## Need Help?

- Check the main README.md for detailed documentation
- Review error messages carefully
- Ensure all prerequisites are met
- Check MySQL and Node.js are running

**Happy Learning! 🎓**
