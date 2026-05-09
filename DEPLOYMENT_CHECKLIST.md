# Vercel Deployment Checklist

## Pre-Deployment Requirements

### Environment Variables
- [ ] Supabase URL and keys configured
- [ ] Database connection string set
- [ ] Auth secrets configured
- [ ] Twilio credentials (optional - can be added later)
- [ ] Sentry DSN (for error monitoring)

### Database Setup
- [ ] Supabase project created
- [ ] Database migrations applied
- [ ] Row Level Security (RLS) policies configured
- [ ] Storage buckets created
- [ ] Test data inserted

### Code Configuration
- [ ] Next.js production build tested locally
- [ ] API routes tested locally
- [ ] Environment variables validated
- [ ] Error handling implemented
- [ ] Logging configured

## Vercel Deployment Steps

### 1. Connect to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel
```

### 2. Configure Environment Variables in Vercel Dashboard
- Go to Project Settings → Environment Variables
- Add all required environment variables
- Set appropriate environments (production, preview, development)

### 3. Build Configuration
- Next.js should auto-detect and configure
- Ensure `package.json` has correct build scripts
- Verify `next.config.ts` is properly configured

### 4. Database Connection
- Update Supabase URL for production
- Configure connection pooling if needed
- Set up read replicas for performance

## Post-Deployment Testing

### Critical User Flows to Test
- [ ] Homepage loads correctly
- [ ] Control Tower dashboard displays data
- [ ] Stage row click expansion works
- [ ] Navbar navigation functions
- [ ] Intake form submission
- [ ] API endpoints respond correctly
- [ ] Authentication flow (if implemented)

### API Testing Checklist
- [ ] `/api/sms/send` endpoint (if Twilio configured)
- [ ] `/api/sms/test` endpoint
- [ ] Control tower data fetching
- [ ] Intake form submission
- [ ] Database queries execute successfully

### Performance Testing
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] Mobile responsiveness verified
- [ ] Database query optimization

## Monitoring & Error Tracking

### Sentry Integration
- [ ] Sentry account created
- [ ] Sentry SDK installed
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] User session recording enabled

### Logging
- [ ] Application logging configured
- [ ] Error logs accessible
- [ ] Performance metrics collected
- [ ] User activity tracking (if needed)

## Security Checklist
- [ ] Environment variables secured
- [ ] API rate limiting configured
- [ ] CORS policies set
- [ ] Authentication implemented
- [ ] Database access restricted
- [ ] HTTPS enforced

## Rollback Plan
- [ ] Previous working version tagged
- [ ] Database backup before deployment
- [ ] Rollback procedure documented
- [ ] Team notification system in place
