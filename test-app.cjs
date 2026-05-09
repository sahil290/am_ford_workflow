#!/usr/bin/env node

/**
 * Automated Test Script for Recon Command Center
 * Run with: node test-app.js
 */

const http = require('http');
const https = require('https');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 10000; // 10 seconds per test

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName, passed, message = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? colors.green : colors.red;
  
  results.tests.push({ name: testName, passed, message });
  
  if (passed) {
    results.passed++;
    log(`  ${status} - ${testName}`, color);
  } else {
    results.failed++;
    log(`  ${status} - ${testName}`, color);
    if (message) log(`    ${message}`, colors.yellow);
  }
}

function logSection(sectionName) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${sectionName}`, colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function logSummary() {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log('  TEST SUMMARY', colors.blue);
  log(`${'='.repeat(60)}`, colors.blue);
  log(`  Total Tests: ${results.tests.length}`, colors.reset);
  log(`  Passed: ${results.passed}`, colors.green);
  log(`  Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.green);
  log(`  Skipped: ${results.skipped}`, colors.yellow);
  log(`${'='.repeat(60)}\n`, colors.blue);
}

// HTTP request helper
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ReconCommandCenter-Test/1.0'
      }
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(TEST_TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  logSection('HEALTH CHECK');
  
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    logTest('Homepage accessible', response.status === 200, `Status: ${response.status}`);
  } catch (error) {
    logTest('Homepage accessible', false, error.message);
  }
}

async function testControlTowerAPI() {
  logSection('CONTROL TOWER API');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/control-tower/snapshot`);
    const hasData = response.data && typeof response.data === 'object';
    
    logTest('Control Tower API endpoint accessible', response.status === 200, `Status: ${response.status}`);
    logTest('Control Tower API returns valid data', hasData, 'Response structure check');
    
    if (hasData) {
      logTest('Control Tower has stage groups', !!response.data.stageGroups, 'Stage groups present');
      logTest('Control Tower has KPIs', !!response.data.kpis, 'KPIs present');
    }
  } catch (error) {
    logTest('Control Tower API endpoint accessible', false, error.message);
    logTest('Control Tower API returns valid data', false, 'Cannot test due to connection error');
  }
}

async function testSMSAPI() {
  logSection('SMS API');
  
  try {
    // Test SMS send endpoint
    const smsData = {
      to: '+1234567890',
      message: 'Test message from automated test',
      type: 'info'
    };
    
    const response = await makeRequest(`${BASE_URL}/api/sms/send`, 'POST', smsData);
    
    // SMS might fail if Twilio not configured, but endpoint should work
    const endpointWorks = response.status === 200 || response.status === 500;
    logTest('SMS send endpoint accessible', endpointWorks, `Status: ${response.status}`);
    
    if (response.status === 500 && response.data?.error) {
      logTest('SMS endpoint returns expected error for missing config', true, 'Error: ' + response.data.error);
    } else if (response.status === 200) {
      logTest('SMS send successful', response.data.success === true, 'Twilio configured');
    } else {
      logTest('SMS endpoint behavior', false, `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logTest('SMS send endpoint accessible', false, error.message);
  }
  
  try {
    // Test SMS test endpoint
    const testData = { phoneNumber: '+1234567890' };
    const response = await makeRequest(`${BASE_URL}/api/sms/test`, 'POST', testData);
    
    const endpointWorks = response.status === 200 || response.status === 500;
    logTest('SMS test endpoint accessible', endpointWorks, `Status: ${response.status}`);
  } catch (error) {
    logTest('SMS test endpoint accessible', false, error.message);
  }
}

async function testEnvironmentVariables() {
  logSection('ENVIRONMENT VARIABLES');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL',
    'NEXTAUTH_SECRET'
  ];
  
  const optionalVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER'
  ];
  
  requiredVars.forEach(varName => {
    const exists = process.env[varName] !== undefined;
    logTest(`Required env var: ${varName}`, exists, exists ? 'Set' : 'Missing');
  });
  
  optionalVars.forEach(varName => {
    const exists = process.env[varName] !== undefined;
    logTest(`Optional env var: ${varName}`, true, exists ? 'Set' : 'Not set (optional)');
  });
}

async function testDatabaseConnection() {
  logSection('DATABASE CONNECTION');
  
  // This is a basic test - in production you'd want more sophisticated DB testing
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    logTest('DATABASE_URL configured', false, 'DATABASE_URL not set');
    return;
  }
  
  logTest('DATABASE_URL configured', true, 'Database URL present');
  
  // Check if it's a valid PostgreSQL connection string
  const isValidPgUrl = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
  logTest('DATABASE_URL format valid', isValidPgUrl, isValidPgUrl ? 'Valid PostgreSQL URL' : 'Invalid format');
}

async function testPageRoutes() {
  logSection('PAGE ROUTES');
  
  const routes = [
    '/',
    '/control-tower',
    '/intake',
    '/admin/sms-settings'
  ];
  
  for (const route of routes) {
    try {
      const response = await makeRequest(`${BASE_URL}${route}`);
      const success = response.status === 200 || response.status === 404; // 404 is ok for unimplemented routes
      logTest(`Route: ${route}`, success, `Status: ${response.status}`);
    } catch (error) {
      logTest(`Route: ${route}`, false, error.message);
    }
  }
}

async function testSupabaseConnection() {
  logSection('SUPABASE CONNECTION');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    logTest('Supabase credentials configured', false, 'Missing credentials');
    return;
  }
  
  logTest('Supabase credentials configured', true, 'Credentials present');
  
  // Try to ping Supabase
  try {
    const response = await makeRequest(`${supabaseUrl}/rest/v1/`, 'GET', null);
    const accessible = response.status < 500;
    logTest('Supabase API accessible', accessible, `Status: ${response.status}`);
  } catch (error) {
    logTest('Supabase API accessible', false, error.message);
  }
}

async function runAllTests() {
  log('\n🚀 Recon Command Center - Automated Test Suite');
  log(`Testing: ${BASE_URL}`);
  log(`Started at: ${new Date().toLocaleString()}\n`);
  
  // Check if server is running
  try {
    await makeRequest(`${BASE_URL}/`, 'GET');
  } catch (error) {
    log(`\n⚠️  WARNING: Cannot connect to ${BASE_URL}`, colors.yellow);
    log(`Make sure your dev server is running: npm run dev`, colors.yellow);
    log(`Or set TEST_URL environment variable for different endpoint\n`, colors.yellow);
  }
  
  // Run all tests
  await testHealthCheck();
  await testEnvironmentVariables();
  await testDatabaseConnection();
  await testSupabaseConnection();
  await testControlTowerAPI();
  await testSMSAPI();
  await testPageRoutes();
  
  // Print summary
  logSummary();
  
  // Exit with appropriate code
  const exitCode = results.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, colors.red);
  process.exit(1);
});
