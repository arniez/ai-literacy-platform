@echo off
REM Database Backup Script for AI Literacy Platform
REM ================================================

SET PGPASSWORD=root
SET PG_BIN=C:\Program Files\PostgreSQL\17\bin
SET DB_NAME=ai_literacy_db
SET DB_USER=postgres
SET BACKUP_DIR=%~dp0

echo Starting database backup...
echo.

REM Export schema only
echo [1/2] Exporting database schema...
"%PG_BIN%\pg_dump.exe" -U %DB_USER% -d %DB_NAME% -f "%BACKUP_DIR%database_schema.sql" --schema-only
if %ERRORLEVEL% EQU 0 (
    echo ✓ Schema exported successfully
) else (
    echo ✗ Schema export failed
)
echo.

REM Export data (with inserts)
echo [2/2] Exporting database data...
"%PG_BIN%\pg_dump.exe" -U %DB_USER% -d %DB_NAME% -f "%BACKUP_DIR%database_full.sql"
if %ERRORLEVEL% EQU 0 (
    echo ✓ Data exported successfully
) else (
    echo ✗ Data export failed
)
echo.

echo Backup completed!
echo Files saved in: %BACKUP_DIR%
echo.
pause
