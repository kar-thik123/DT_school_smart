# Deployment & Operations Guide: Pre-Production & Production Environments

This operations manual details the step-by-step procedures for deploying the School SaaS platform, managing environment configurations, executing database migrations, and executing automated PostgreSQL backups.

---

## 🏗 Environment Strategy

We recommend maintaining two distinct environments:

1. **Staging Environment**: A replica of production used for QA validation and final school demonstrations.
2. **Production Environment**: The live environment serving active schools and real users.

---

## 🔑 Environment Variables (.env) Strategy

Secure and segregate configurations using env variables. NEVER commit `.env` files to source repositories.

### Recommended Production Template
```ini
# Environment
NODE_ENV=production
PORT=5000

# Database Pooling Settings (Enforce SSL in Production)
DATABASE_URL="postgresql://saas_prod:ComplexPassword@144.91.71.246:5432/school_saas_prod?sslmode=require&connection_limit=20"

# Authentication Cryptography
JWT_SECRET="HighlyComplexRandomHexadecimalSecretKey64CharsLong"

# Mail Server Configurations
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASS=SG.ProductionSendGridApiKeyGoesHere

# Legacy Settings
USE_NEW_ACADEMIC_STRUCTURE=true
```

---

## 🔄 Database Migrations Execution

To apply database schema changes in production safely:

1. **Perform Backup**: Execute a pre-migration backup (see Scripts section below).
2. **Compile Backend**: Build clean assets: `npm run build`.
3. **Execute Migration**: Run the Prisma migration engine:
   ```bash
   npx prisma migrate deploy
   ```
> [!IMPORTANT]
> Never use `npx prisma migrate dev` in staging or production. It will trigger database resets if schema drift is detected. Always use `npx prisma migrate deploy`.

---

## 💾 PostgreSQL Backup & Restore Utilities

Provide repeatable backup and restore routines to protect school tenant data.

### 1. Manual Backup Script (`backup.bat`)
Save this script inside your production server scripts folder (`d:\DT_school_smart\backend\scripts\backup.bat`):
```bat
@echo off
set PG_HOST=144.91.71.246
set PG_PORT=5432
set PG_USER=saas_prod
set PG_DB=school_saas_prod
set PG_PASSWORD=DT_Sch00l%%23Chenn%%40i_2026%%21

set BACKUP_DIR=d:\DT_school_smart\backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set FILENAME=%BACKUP_DIR%\backup_%PG_DB%_%date:~10,4%-%date:~4,2%-%date:~7,2%.sql

echo [INFO] Starting database backup for %PG_DB%...
pg_dump -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d %PG_DB% -F p -f "%FILENAME%"
echo [SUCCESS] Database backup saved successfully to: %FILENAME%
```

### 2. Manual Restore Script (`restore.bat`)
Save this script to restore a database backup in recovery operations:
```bat
@echo off
set PG_HOST=144.91.71.246
set PG_PORT=5432
set PG_USER=saas_prod
set PG_DB=school_saas_prod
set PG_PASSWORD=DT_Sch00l%%23Chenn%%40i_2026%%21

set /p BACKUP_FILE="Enter full path of SQL backup file to restore: "

if not exist "%BACKUP_FILE%" (
    echo [ERROR] Backup file not found at: %BACKUP_FILE%
    exit /b 1
)

echo [CAUTION] You are about to restore %BACKUP_FILE% into %PG_DB%!
set /p CONFIRM="Type YES to confirm restoration: "

if "%CONFIRM%"=="YES" (
    echo [INFO] Restoring database %PG_DB%...
    psql -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d %PG_DB% -f "%BACKUP_FILE%"
    echo [SUCCESS] Database restored successfully!
) else (
    echo [CANCELLED] Restore operations aborted by administrator.
)
```

---

## 📈 Production Logging & Monitoring Config

* Set `NODE_ENV=production` to disable verbose development stack traces.
* Unhandled routing failures will return standardized JSON 500 blocks:
  ```json
  { "error": "Internal server error occurred. Please contact institutional support." }
  ```
* Global Client error details will be securely printed to server logs for diagnostics rather than exposed to end users.
