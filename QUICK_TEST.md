# Quick Test Guide

## How to Run the Test Script

### 1. Start Your Development Server
```bash
npm run dev
```
Keep this running in a separate terminal.

### 2. Run the Test Script
In a new terminal, run:
```bash
npm test
```

This will test your local development server at `http://localhost:3000`.

### 3. Test Production Deployment
After deploying to Vercel, run:
```bash
npm run test:production
```
(Update the URL in package.json to your actual Vercel URL)

## What the Script Tests

### ✅ Health Check
- Homepage accessibility
- Server response status

### ✅ Environment Variables
- Required variables configured
- Optional variables status

### ✅ Database Connection
- DATABASE_URL presence
- Connection string format validation

### ✅ Supabase Connection
- Credentials configured
- API accessibility

### ✅ Control Tower API
- Endpoint accessibility
- Data structure validation
- Stage groups and KPIs presence

### ✅ SMS API
- Send endpoint accessibility
- Test endpoint accessibility
- Error handling for missing config

### ✅ Page Routes
- Homepage
- Control Tower
- Intake form
- Admin settings

## Test Results

The script will show:
- ✅ PASS for successful tests
- ✗ FAIL for failed tests
- Detailed error messages
- Summary with pass/fail counts

## Example Output

```
🚀 Recon Command Center - Automated Test Suite
Testing: http://localhost:3000
Started at: 5/8/2026, 10:30:00 PM

============================================================
  HEALTH CHECK
============================================================
  ✓ PASS - Homepage accessible

============================================================
  ENVIRONMENT VARIABLES
============================================================
  ✓ PASS - Required env var: NEXT_PUBLIC_SUPABASE_URL
  ✗ FAIL - Required env var: DATABASE_URL
    Missing

============================================================
  TEST SUMMARY
============================================================
  Total Tests: 15
  Passed: 12
  Failed: 3
  Skipped: 0
============================================================
```

## Troubleshooting

### "Cannot connect to localhost:3000"
- Make sure your dev server is running: `npm run dev`
- Check if port 3000 is available
- Try a different port: `PORT=3001 npm run dev`

### "Environment variables missing"
- Create a `.env.local` file with required variables
- Reference `.env.example` for needed variables
- Restart dev server after adding variables

### "Database connection failed"
- Verify DATABASE_URL format
- Check Supabase project is active
- Ensure database is accessible

### "Supabase API not accessible"
- Verify NEXT_PUBLIC_SUPABASE_URL
- Check Supabase project status
- Ensure anon key is correct

## Quick Test Commands

```bash
# Test local development
npm test

# Test with custom URL
TEST_URL=http://localhost:3001 node test-app.js

# Test production
TEST_URL=https://your-app.vercel.app node test-app.js

# Test specific endpoint (manual)
curl http://localhost:3000/api/control-tower/snapshot
```

## Before Vercel Deployment

Run this checklist:
```bash
# 1. Start dev server
npm run dev

# 2. Run tests in new terminal
npm test

# 3. Fix any failures
# 4. Run tests again
npm test

# 5. If all pass, deploy to Vercel
```

## After Vercel Deployment

```bash
# Update package.json with your Vercel URL
# Then run:
npm run test:production

# Or test manually:
TEST_URL=https://your-app.vercel.app node test-app.js
```
