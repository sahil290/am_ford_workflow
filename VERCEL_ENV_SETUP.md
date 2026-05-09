# Vercel Environment Variables Setup

## Required Environment Variables

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Database Configuration
```
DATABASE_URL=your_database_connection_string
```

### Authentication
```
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-app.vercel.app
```

### Twilio (Optional - can be added later)
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Setup Steps

### 1. Get Supabase Credentials
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Get Database Connection String
1. In Supabase Dashboard → Settings → Database
2. Find "Connection String"
3. Copy the URI format
4. Replace `[YOUR-PASSWORD]` with your database password
5. Set as `DATABASE_URL`

### 3. Generate NextAuth Secret
```bash
# Generate a secure random string
openssl rand -base64 32
```
Set this as `NEXTAUTH_SECRET`

### 4. Configure in Vercel
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with its value
4. Select environments:
   - Production, Preview, Development (for most)
   - Production only for sensitive keys (service_role)

### 5. Test Locally First
Create a `.env.local` file with the same variables to test locally before deploying.

## Vercel CLI Deployment

### First Time Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### Subsequent Deployments
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

## Testing After Deployment

### 1. Basic Functionality Test
- [ ] Homepage loads
- [ ] CSS renders correctly
- [ ] Navigation works
- [ ] No console errors

### 2. API Testing
- [ ] Test control tower data fetching
- [ ] Test intake form submission
- [ ] Test database connections

### 3. Database Testing
- [ ] Can read from Supabase
- [ ] Can write to Supabase
- [ ] Real-time subscriptions work

### 4. Performance Testing
- [ ] Page load times acceptable
- [ ] API responses fast enough
- [ ] No memory leaks

## Troubleshooting

### Build Failures
- Check environment variables are set correctly
- Verify Node.js version matches Vercel's environment
- Check for missing dependencies

### Runtime Errors
- Check Vercel logs
- Verify database connection
- Test API endpoints locally first

### Database Issues
- Verify connection string format
- Check Supabase project status
- Ensure RLS policies allow access
