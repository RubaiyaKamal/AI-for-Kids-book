# Database Setup Instructions

## Prerequisites
- Neon Serverless Postgres account
- Database connection string

## Steps

### 1. Create Neon Database

1. Go to https://neon.tech/
2. Sign up or log in
3. Create a new project: "physical-ai-book"
4. Copy the connection string

### 2. Run Schema Migration

```bash
# Install PostgreSQL client (if not already installed)
# Windows (using Chocolatey)
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/

# Run the schema
psql "your-neon-connection-string" -f database/schema.sql
```

### 3. Verify Tables Created

```sql
-- Connect to your database
psql "your-neon-connection-string"

-- List all tables
\dt

-- You should see:
-- user_profiles
-- user_progress
-- user_bookmarks
-- user_notes
-- user_achievements

-- Check a table structure
\d user_profiles
```

### 4. Update Environment Variables

Add to your `.env` file:

```env
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

## Alternative: Using Node.js Script

If you prefer to run migrations from Node.js:

**File: `database/migrate.js`**

```javascript
const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
  });

  try {
    const sql = fs.readFileSync('./database/schema.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Database schema created successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
```

**Run it:**
```bash
node database/migrate.js
```

## Verification Queries

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Check indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public';

-- Check views
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';
```

## Troubleshooting

### Connection Issues
- Ensure your IP is whitelisted in Neon dashboard
- Check connection string format
- Verify SSL mode is set to `require`

### Permission Issues
- Ensure your database user has CREATE privileges
- Check if tables already exist (drop them if needed)

### Schema Already Exists
```sql
-- Drop all tables (CAREFUL!)
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS user_notes CASCADE;
DROP TABLE IF EXISTS user_bookmarks CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Then re-run schema.sql
```

## Next Steps

After database setup:
1. ✅ Install Better Auth dependencies
2. ✅ Configure Better Auth
3. ✅ Create API routes
4. ✅ Build frontend components
