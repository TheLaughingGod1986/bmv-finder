# 🚀 BMV Finder: Migration to Turso Database

This guide will help you migrate your BMV Finder application from local SQLite to Turso, a distributed SQLite platform.

## 📋 Prerequisites

- [x] Turso CLI installed
- [ ] Turso account authenticated
- [ ] Turso database created
- [ ] Environment variables configured

## 🔑 Step 1: Complete Turso Authentication

1. **Visit the login URL in your browser:**
   ```
   https://api.turso.tech?redirect=false
   ```

2. **Complete the login process in your browser**

3. **Verify authentication:**
   ```bash
   turso auth whoami
   ```

## 🏗️ Step 2: Create Your Turso Database

1. **Create a new database:**
   ```bash
   turso db create bmv-finder
   ```

2. **Get your database URL:**
   ```bash
   turso db show bmv-finder
   ```

3. **Create an authentication token:**
   ```bash
   turso db tokens create bmv-finder
   ```

## ⚙️ Step 3: Configure Environment Variables

1. **Update your `.env.local` file with your actual Turso credentials:**
   ```env
   # Replace these with your actual values from Step 2
   TURSO_DATABASE_URL=libsql://bmv-finder-[your-username].turso.io
   TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
   
   # Set to 'turso' to use Turso, 'local' for local SQLite
   DATABASE_TYPE=turso
   ```

## 📊 Step 4: Choose Your Migration Path

### Option A: Migrate Existing Data (Recommended)

If you have existing data in `land_registry.db`:

```bash
# Migrate your existing SQLite data to Turso
node migrate-to-turso.js migrate
```

### Option B: Fresh Import to Turso

If you want to start fresh or don't have existing data:

```bash
# Import fresh data directly to Turso
node turso-import-land-registry.js
```

## 🔄 Step 5: Update Your Application

Your application is already updated to work with both SQLite and Turso! The database utility (`src/lib/database.ts`) automatically switches between:

- **Local SQLite** when `DATABASE_TYPE=local` or when Turso credentials are missing
- **Turso** when `DATABASE_TYPE=turso` and credentials are provided

## 🧪 Step 6: Test Your Migration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test a property search:**
   - Open http://localhost:3000
   - Search for a postcode (e.g., "SW1A 1AA")
   - Verify that results are returned from Turso

3. **Check database connection:**
   ```bash
   # This should now show data from Turso
   curl -X POST http://localhost:3000/api/scan \
     -H "Content-Type: application/json" \
     -d '{"postcode": "SW1A"}'
   ```

## 📈 Benefits of Migration

- **Scalability**: Turso automatically scales with your application
- **Global Distribution**: Data replicated globally for faster access
- **High Availability**: Built-in redundancy and failover
- **Edge Deployment**: Works seamlessly with Vercel, Netlify, etc.
- **Zero-Downtime**: Migrations and updates without service interruption

## 🛠️ Migration Commands Reference

```bash
# Check Turso authentication
turso auth whoami

# List your databases
turso db list

# Show database details
turso db show bmv-finder

# Create auth token
turso db tokens create bmv-finder

# Migrate existing SQLite data
node migrate-to-turso.js migrate

# Truncate Turso table (if needed)
node migrate-to-turso.js truncate

# Fresh import to Turso
node turso-import-land-registry.js

# Test local database utility
node -e "
const { queryRows } = require('./src/lib/database.ts');
queryRows('SELECT COUNT(*) as count FROM prices').then(console.log);
"
```

## 🚨 Troubleshooting

### Authentication Issues
```bash
# If login fails, try:
turso auth logout
turso auth login --headless
```

### Connection Issues
- Verify your `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env.local`
- Check that your database exists: `turso db list`
- Ensure your token has the correct permissions

### Migration Issues
- Check that your local `land_registry.db` file exists
- Verify sufficient disk space for the migration process
- Monitor the migration logs for specific error messages

### Performance Issues
- Turso databases are optimized for read-heavy workloads (perfect for property searches)
- Consider adding indexes for frequently queried columns:
  ```sql
  CREATE INDEX idx_postcode ON prices(postcode);
  CREATE INDEX idx_town_city ON prices(town_city);
  CREATE INDEX idx_date ON prices(date_of_transfer);
  ```

## 🔄 Rollback Plan

If you need to rollback to local SQLite:

1. **Change your environment:**
   ```env
   DATABASE_TYPE=local
   ```

2. **Restart your application:**
   ```bash
   npm run dev
   ```

Your local `land_registry.db` file will still be available and functional.

## 🎯 Next Steps

1. **Deploy to Production**: Your app is now ready for deployment to Vercel, Netlify, or any edge platform
2. **Set up Monitoring**: Consider adding database monitoring for query performance
3. **Optimize Queries**: Add appropriate indexes based on your most common search patterns
4. **Backup Strategy**: Turso provides automatic backups, but consider regular exports for additional safety

## 📞 Support

- **Turso Documentation**: https://docs.turso.tech/
- **Turso Discord**: https://discord.gg/turso
- **BMV Finder Issues**: Create an issue in your repository

---

🎉 **Congratulations!** Your BMV Finder is now powered by Turso's distributed SQLite platform!