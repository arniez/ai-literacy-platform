# 🚀 Step-by-Step Setup Guide

Follow these steps to get your AI Literacy Platform running.

## ✅ Step 1: Install Dependencies (DONE!)

Already completed! All npm packages are installed.

---

## 📊 Step 2: Create MySQL Database

You need to execute the SQL script to create the database and tables.

### **Method 1: MySQL Workbench (Recommended)**

1. **Open MySQL Workbench**

2. **Connect to MySQL**:
   - Click the **Local instance** connection (or create new connection)
   - Username: `root`
   - Password: `root`
   - Click **OK**

3. **Open SQL Script**:
   - Menu: **File** → **Open SQL Script...**
   - Navigate to: `c:\Users\Gebruiker\Documents\VScode\AILiteracy\server\config\database.sql`
   - Click **Open**

4. **Execute Script**:
   - Click the **⚡ Execute** button (lightning bolt icon)
   - Wait for execution to complete
   - You should see "ai_literacy_db" in the Schemas panel

5. **Verify**:
   - Expand "ai_literacy_db" in the Schemas panel
   - You should see 14 tables (users, content, badges, etc.)

### **Method 2: Command Prompt**

1. **Open Command Prompt** (cmd)

2. **Navigate to project**:
   ```bash
   cd c:\Users\Gebruiker\Documents\VScode\AILiteracy
   ```

3. **Run SQL script**:
   ```bash
   mysql -u root -proot < server\config\database.sql
   ```

4. **Verify**:
   ```bash
   mysql -u root -proot -e "USE ai_literacy_db; SHOW TABLES;"
   ```

### **Method 3: phpMyAdmin**

1. **Open phpMyAdmin** in your browser (usually `http://localhost/phpmyadmin`)

2. **Login**:
   - Username: `root`
   - Password: `root`

3. **Import**:
   - Click **Import** tab
   - Click **Choose File**
   - Select: `server\config\database.sql`
   - Click **Go** at the bottom

4. **Verify**:
   - You should see "ai_literacy_db" in the left sidebar
   - Click it to see the 14 tables

---

## 🌱 Step 3: Seed Demo Data

After creating the database, populate it with demo data.

1. **Open Command Prompt** (or use the existing one)

2. **Navigate to server folder**:
   ```bash
   cd c:\Users\Gebruiker\Documents\VScode\AILiteracy\server
   ```

3. **Run seed script**:
   ```bash
   node scripts/seedData.js
   ```

4. **Expected output**:
   ```
   Starting database seeding...
   Cleared existing data
   Seeded users
   Seeded modules
   Seeded content
   Seeded badges
   Seeded user badges
   Seeded challenges
   Seeded user progress
   Seeded comments
   Seeded ratings
   Seeded activities
   Seeded notifications
   ✅ Database seeding completed successfully!

   Demo Users:
   - Admin: admin@ailiteracy.nl / password123
   - Student: student@student.nl / password123
   - Jan: jan@student.nl / password123
   - Teacher: teacher@teacher.nl / password123
   ```

---

## ✅ Step 4: Verify Setup (Optional but Recommended)

Verify everything is set up correctly:

```bash
cd c:\Users\Gebruiker\Documents\VScode\AILiteracy
node verify-setup.js
```

Expected output:
```
🔍 Verifying AI Literacy Platform Setup...

📊 Testing database connection...
✅ Database connection successful!

📋 Checking database tables...
✅ Found 14 tables:

   - badges
   - challenges
   - comment_likes
   - comments
   - content
   - ...

📊 Checking demo data...
✅ Users: 4
✅ Content: 11
✅ Badges: 10
✅ Challenges: 4

👤 Demo Users:
   - admin@ailiteracy.nl (admin) - Level 6 - 500 points
   - student@student.nl (student) - Level 3 - 250 points
   ...

🎉 Setup verification complete!
```

---

## 🚀 Step 5: Start the Application

### **Option A: Start Both Servers Together (Windows)**

**Double-click** the file: `RUN.bat`

This will open two command windows:
- One for the backend server (port 5002)
- One for the frontend app (port 3000)

### **Option B: Start Servers Manually**

**Terminal 1 - Backend Server:**
```bash
cd c:\Users\Gebruiker\Documents\VScode\AILiteracy\server
npm run dev
```

Wait until you see:
```
╔════════════════════════════════════════════════════╗
║   AI Literacy Server Running                       ║
║   Environment: development                         ║
║   Port: 5002                                       ║
╚════════════════════════════════════════════════════╝
```

**Terminal 2 - Frontend Application:**
```bash
cd c:\Users\Gebruiker\Documents\VScode\AILiteracy\client
npm start
```

The app should open automatically at `http://localhost:3000`

---

## 🎉 Step 6: Login and Explore!

1. **Go to** http://localhost:3000

2. **Login with demo account**:
   - Email: `student@student.nl`
   - Password: `password123`

3. **Explore**:
   - Check your profile (top right)
   - See your points and level
   - Navigate through the menu
   - Currently working: Home, Login, Register, Navigation

---

## 🛠️ Troubleshooting

### ❌ "Cannot connect to database"

**Problem**: MySQL server is not running

**Solution**:
- **Windows**: Open Services and start "MySQL80" (or your MySQL service)
- **Or**: Start MySQL from XAMPP/WAMP control panel

### ❌ "Database 'ai_literacy_db' not found"

**Problem**: Database hasn't been created yet

**Solution**: Go back to **Step 2** and create the database

### ❌ "Port 3000 already in use"

**Problem**: Another app is using port 3000

**Solution**:
```bash
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### ❌ "Port 5002 already in use"

**Problem**: Another app is using port 5002

**Solution**: Kill the process or change the port in `server/config/config.env`

### ❌ Seed script fails

**Problem**: Database not created or connection error

**Solution**:
1. Ensure database exists: Run **Step 2** again
2. Check MySQL is running
3. Verify credentials in `server/config/config.env`

---

## 📚 What's Next?

After successful setup, you can:

1. **Explore the demo data**
   - Login with different accounts
   - See the learning materials
   - Check badges and challenges

2. **Start building features**
   - Dashboard page
   - Learning materials browser
   - Content viewer
   - See [SETUP_COMPLETE.md](SETUP_COMPLETE.md) for details

3. **Customize**
   - Add your own content
   - Create custom badges
   - Modify the UI theme

---

## 🆘 Need Help?

- **Full documentation**: [README.md](README.md)
- **Quick reference**: [QUICKSTART.md](QUICKSTART.md)
- **Complete overview**: [SETUP_COMPLETE.md](SETUP_COMPLETE.md)

---

## ✅ Setup Checklist

- [x] Node.js and npm installed
- [x] Server dependencies installed
- [x] Client dependencies installed
- [ ] MySQL database created ← **DO THIS NEXT**
- [ ] Demo data seeded
- [ ] Setup verified
- [ ] Servers started
- [ ] Logged in successfully

---

**Good luck! 🚀**
