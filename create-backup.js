const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * AI Literacy Platform - Automated Backup Script
 * Creates a complete backup of project files and database
 */

function createBackup() {
  console.log('🔄 Starting AI Literacy Platform Backup...\n');

  // Create timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupDir = path.join(__dirname, 'backups', `backup_${timestamp}`);

  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`✓ Created backup directory: ${backupDir}\n`);
  }

  try {
    // 1. Backup Server Files
    console.log('[1/4] Backing up server files...');
    execSync(`xcopy /E /I /Y /Q server "${backupDir}\\server"`, { stdio: 'inherit' });
    console.log('✓ Server files backed up\n');

    // 2. Backup Client Files
    console.log('[2/4] Backing up client files...');
    execSync(`xcopy /E /I /Y /Q client "${backupDir}\\client"`, { stdio: 'inherit' });
    console.log('✓ Client files backed up\n');

    // 3. Export Database Schema
    console.log('[3/4] Exporting database schema...');
    const schemaFile = path.join(backupDir, 'database_schema.sql');
    process.env.PGPASSWORD = 'root';

    try {
      execSync(
        `"C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe" -U postgres -d ai_literacy_db -f "${schemaFile}" --schema-only`,
        { stdio: 'inherit' }
      );
      console.log('✓ Database schema exported\n');
    } catch (error) {
      console.log('⚠ Schema export failed (may need manual export)\n');
    }

    // 4. Export Full Database
    console.log('[4/4] Exporting full database...');
    const fullFile = path.join(backupDir, 'database_full.sql');

    try {
      execSync(
        `"C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe" -U postgres -d ai_literacy_db -f "${fullFile}"`,
        { stdio: 'inherit' }
      );
      console.log('✓ Full database exported\n');
    } catch (error) {
      console.log('⚠ Full database export failed (may need manual export)\n');
    }

    // 5. Create Restore Instructions
    console.log('[5/5] Creating restore instructions...');
    const instructions = generateRestoreInstructions(timestamp);
    fs.writeFileSync(path.join(backupDir, 'RESTORE_INSTRUCTIONS.md'), instructions);
    console.log('✓ Restore instructions created\n');

    // Summary
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║                                                    ║');
    console.log('║   ✅ Backup Completed Successfully!                ║');
    console.log('║                                                    ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log(`\n📁 Backup Location: ${backupDir}`);
    console.log(`📅 Timestamp: ${new Date().toLocaleString('nl-NL')}\n`);
    console.log('To restore, see RESTORE_INSTRUCTIONS.md in the backup folder.\n');

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

function generateRestoreInstructions(timestamp) {
  return `# AI Literacy Platform - Restore Instructions

**Backup Created:** ${new Date().toLocaleString('nl-NL')}

## Quick Restore

### 1. Restore Project Files
\`\`\`bash
xcopy /E /I /Y backup_${timestamp}\\server C:\\path\\to\\AILiteracy\\server
xcopy /E /I /Y backup_${timestamp}\\client C:\\path\\to\\AILiteracy\\client
\`\`\`

### 2. Restore Database
\`\`\`bash
SET PGPASSWORD=root
"C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe" -U postgres -d ai_literacy_db -f database_full.sql
\`\`\`

### 3. Install Dependencies
\`\`\`bash
cd server && npm install
cd ../client && npm install
\`\`\`

### 4. Start Application
\`\`\`bash
# Terminal 1
cd server && npm start

# Terminal 2
cd client && npm start
\`\`\`

## Need Help?

See the full RESTORE_INSTRUCTIONS.md for detailed steps and troubleshooting.
`;
}

// Run backup
if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };
