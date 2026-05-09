# Testing Strategy for Recon Command Center

## Manual Testing Plan

### Phase 1: Pre-Deployment Local Testing

#### 1.1 Core Functionality
- [ ] Homepage loads without errors
- [ ] Control Tower displays mock data correctly
- [ ] Stage rows expand/collapse on click
- [ ] Navbar navigation works
- [ ] Intake form opens and submits
- [ ] No console errors in browser

#### 1.2 API Testing
```bash
# Test control tower data endpoint
curl http://localhost:3000/api/control-tower/snapshot

# Test SMS send endpoint (if configured)
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"to":"+1234567890","message":"Test","type":"info"}'
```

#### 1.3 Database Connection
- [ ] Can connect to Supabase
- [ ] Can read mock data
- [ ] Can write test records
- [ ] Real-time subscriptions work

### Phase 2: Post-Deployment Vercel Testing

#### 2.1 Basic Functionality
- [ ] Application loads at Vercel URL
- [ ] All pages accessible
- [ ] Styling renders correctly
- [ ] No 404 errors
- [ ] No console errors

#### 2.2 API Endpoint Testing
```bash
# Test production API endpoints
curl https://your-app.vercel.app/api/control-tower/snapshot

# Test SMS endpoint
curl -X POST https://your-app.vercel.app/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"to":"+1234567890","message":"Test","type":"info"}'
```

#### 2.3 Environment Variables
- [ ] Supabase connection works
- [ ] Database queries execute
- [ ] Auth secrets configured
- [ ] No missing variable errors

### Phase 3: User Flow Testing

#### 3.1 Control Tower Flow
1. Navigate to `/control-tower`
2. Verify stage rows display
3. Click on a stage row
4. Verify expansion shows tagline
5. Verify gold highlighting works
6. Click info icon
7. Verify popup shows vehicle list

#### 3.2 Intake Flow
1. Navigate to `/intake`
2. Fill out intake form
3. Submit form
4. Verify submission success
5. Check if data appears in system

#### 3.3 Navigation Flow
1. Test navbar links
2. Test mobile menu
3. Test profile dropdown
4. Test logout functionality

## Automated Testing Tools

### 1. Sentry (Error Monitoring)
**Purpose:** Track runtime errors and performance issues

**Setup:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Benefits:**
- Real-time error tracking
- Performance monitoring
- User session recording
- Release tracking

**When to use:** Production deployment

### 2. Playwright (E2E Testing)
**Purpose:** Automated end-to-end testing of user flows

**Setup:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Example Test:**
```typescript
import { test, expect } from '@playwright/test';

test('Control Tower loads correctly', async ({ page }) => {
  await page.goto('http://localhost:3000/control-tower');
  await expect(page.locator('text=Control Tower')).toBeVisible();
  await page.click('[data-testid="stage-row"]');
  await expect(page.locator('[data-testid="expanded-content"]')).toBeVisible();
});
```

**When to use:** Critical user flows

### 3. Jest + React Testing Library (Unit Testing)
**Purpose:** Test individual components and functions

**Setup:**
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
```

**When to use:** Component logic testing

### 4. Postman/Insomnia (API Testing)
**Purpose:** Manual API endpoint testing

**Usage:**
- Create collection of API endpoints
- Test each endpoint with various inputs
- Save test cases for regression testing

**When to use:** API development and debugging

## Recommended Testing Approach for Now

### Immediate Testing (Before Sentry)
1. **Manual Testing** - Test all user flows manually
2. **Browser DevTools** - Check console for errors
3. **Network Tab** - Monitor API calls
4. **Vercel Logs** - Check deployment logs

### After Initial Deployment
1. **Add Sentry** - For production error tracking
2. **Add Playwright** - For critical flow automation
3. **Add API Tests** - For endpoint validation

## Testing Checklist for Vercel Deployment

### Pre-Deployment
- [ ] Run `npm run build` locally (no errors)
- [ ] Test `npm run start` locally
- [ ] Verify all environment variables set
- [ ] Check for console errors in dev tools
- [ ] Test all API endpoints locally

### Post-Deployment
- [ ] Access Vercel URL successfully
- [ ] Test all pages load
- [ ] Check Vercel deployment logs
- [ ] Test API endpoints on production
- [ ] Verify database connections
- [ ] Test user flows end-to-end
- [ ] Check mobile responsiveness
- [ ] Verify no console errors

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] First Contentful Paint < 1.5 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks in browser
- [ ] Database queries optimized

## Current Recommendation

**For immediate deployment and testing:**
1. Deploy to Vercel first with manual testing
2. Use browser DevTools for debugging
3. Monitor Vercel logs for errors
4. Add Sentry after confirming basic functionality works

**This approach lets you:**
- Get the app live quickly
- Identify real issues in production
- Add monitoring tools based on actual needs
- Avoid over-engineering the initial deployment
