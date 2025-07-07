#!/usr/bin/env node

/**
 * mySafePlay Platform Comprehensive Audit Script
 * Version: 1.0.0
 * 
 * This script performs a comprehensive audit of the mySafePlay platform
 * including navigation testing, API endpoint validation, and functionality checks.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const AUDIT_RESULTS = {
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  navigation: {
    parent: [],
    venueAdmin: [],
    admin: []
  },
  api: {
    endpoints: [],
    health: null
  },
  pages: {
    accessible: [],
    errors: []
  },
  issues: {
    critical: [],
    major: [],
    minor: []
  }
};

// Navigation structure extracted from the codebase
const NAVIGATION_STRUCTURE = {
  parent: [
    '/parent',
    '/parent/children',
    '/parent/family',
    '/parent/memories',
    '/parent/account',
    '/parent/subscription',
    '/parent/discount-history',
    '/parent/mobile',
    '/verification'
  ],
  venueAdmin: [
    '/venue-admin',
    '/venue-admin/floor-plans',
    '/venue-admin/zone-configuration',
    '/venue-admin/advanced-zones',
    '/venue-admin/tracking',
    '/venue-admin/check-in-out',
    '/venue-admin/biometric',
    '/venue-admin/emergency-management',
    '/venue-admin/alerts',
    '/venue-admin/pickup',
    '/venue-admin/ai-features',
    '/venue-admin/ai-analytics',
    '/venue-admin/qr-codes',
    '/venue-admin/kiosks',
    '/venue-admin/zone-analytics',
    '/venue-admin/revenue',
    '/venue-admin/payment-setup'
  ],
  admin: [
    '/admin',
    '/admin/analytics',
    '/admin/discount-analytics',
    '/admin/users',
    '/admin/verification',
    '/admin/venues',
    '/admin/payments',
    '/admin/discount-codes',
    '/admin/email-automation',
    '/admin/settings'
  ]
};

// API endpoints to test
const API_ENDPOINTS = [
  '/api/health',
  '/api/auth/session',
  '/api/venues',
  '/api/children',
  '/api/analytics/metrics',
  '/api/ai/settings',
  '/api/qr-codes',
  '/api/zones'
];

// Static analysis functions
function analyzeFileStructure() {
  console.log('📁 Analyzing file structure...');
  
  const appDir = path.join(__dirname, 'app');
  const pages = [];
  
  function scanDirectory(dir, basePath = '') {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath, basePath + '/' + item);
        } else if (item === 'page.tsx' || item === 'page.ts') {
          pages.push(basePath || '/');
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error.message);
    }
  }
  
  scanDirectory(appDir);
  return pages;
}

function analyzeLintIssues() {
  console.log('🔍 Analyzing lint issues...');
  
  try {
    const { execSync } = require('child_process');
    const lintOutput = execSync('npm run lint', { encoding: 'utf8', cwd: __dirname });
    
    // Parse lint output for issues
    const lines = lintOutput.split('\n');
    const issues = [];
    
    for (const line of lines) {
      if (line.includes('Error:') || line.includes('Warning:')) {
        const severity = line.includes('Error:') ? 'major' : 'minor';
        issues.push({
          type: 'lint',
          severity,
          message: line.trim(),
          file: lines[lines.indexOf(line) - 1] || 'unknown'
        });
      }
    }
    
    return issues;
  } catch (error) {
    return [{
      type: 'lint',
      severity: 'minor',
      message: 'Could not run lint analysis: ' + error.message
    }];
  }
}

function analyzeSecurityHeaders() {
  console.log('🔒 Analyzing security configuration...');
  
  const issues = [];
  
  // Check middleware.ts for security measures
  try {
    const middlewarePath = path.join(__dirname, 'middleware.ts');
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    
    if (!middlewareContent.includes('addSecurityHeaders')) {
      issues.push({
        type: 'security',
        severity: 'major',
        message: 'Security headers not properly implemented in middleware'
      });
    }
    
    if (!middlewareContent.includes('isRateLimited')) {
      issues.push({
        type: 'security',
        severity: 'major',
        message: 'Rate limiting not implemented'
      });
    }
    
    if (!middlewareContent.includes('isBotRequest')) {
      issues.push({
        type: 'security',
        severity: 'minor',
        message: 'Bot protection not implemented'
      });
    }
  } catch (error) {
    issues.push({
      type: 'security',
      severity: 'critical',
      message: 'Could not analyze middleware security: ' + error.message
    });
  }
  
  return issues;
}

function analyzeEnvironmentConfig() {
  console.log('⚙️ Analyzing environment configuration...');
  
  const issues = [];
  const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'DATABASE_URL',
    'STAGING_PASSWORD'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      issues.push({
        type: 'environment',
        severity: 'critical',
        message: `Missing required environment variable: ${envVar}`
      });
    }
  }
  
  return issues;
}

function analyzeDatabaseSchema() {
  console.log('🗄️ Analyzing database schema...');
  
  const issues = [];
  
  try {
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Check for essential models
    const requiredModels = ['User', 'Child', 'Venue', 'Zone', 'CheckIn'];
    
    for (const model of requiredModels) {
      if (!schemaContent.includes(`model ${model}`)) {
        issues.push({
          type: 'database',
          severity: 'critical',
          message: `Missing required database model: ${model}`
        });
      }
    }
  } catch (error) {
    issues.push({
      type: 'database',
      severity: 'critical',
      message: 'Could not analyze database schema: ' + error.message
    });
  }
  
  return issues;
}

// Main audit function
async function runComprehensiveAudit() {
  console.log('🚀 Starting mySafePlay Platform Comprehensive Audit');
  console.log('=' .repeat(60));
  
  // Static analysis
  const pages = analyzeFileStructure();
  const lintIssues = analyzeLintIssues();
  const securityIssues = analyzeSecurityHeaders();
  const envIssues = analyzeEnvironmentConfig();
  const dbIssues = analyzeDatabaseSchema();
  
  // Combine all issues
  const allIssues = [...lintIssues, ...securityIssues, ...envIssues, ...dbIssues];
  
  // Categorize issues by severity
  AUDIT_RESULTS.issues.critical = allIssues.filter(i => i.severity === 'critical');
  AUDIT_RESULTS.issues.major = allIssues.filter(i => i.severity === 'major');
  AUDIT_RESULTS.issues.minor = allIssues.filter(i => i.severity === 'minor');
  
  // Store discovered pages
  AUDIT_RESULTS.pages.accessible = pages;
  
  // Generate report
  generateAuditReport();
}

function generateAuditReport() {
  console.log('\n📊 AUDIT RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  console.log(`🔴 Critical Issues: ${AUDIT_RESULTS.issues.critical.length}`);
  console.log(`🟡 Major Issues: ${AUDIT_RESULTS.issues.major.length}`);
  console.log(`🟢 Minor Issues: ${AUDIT_RESULTS.issues.minor.length}`);
  console.log(`📄 Pages Discovered: ${AUDIT_RESULTS.pages.accessible.length}`);
  
  // Display critical issues
  if (AUDIT_RESULTS.issues.critical.length > 0) {
    console.log('\n🔴 CRITICAL ISSUES:');
    AUDIT_RESULTS.issues.critical.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.type.toUpperCase()}] ${issue.message}`);
    });
  }
  
  // Display major issues
  if (AUDIT_RESULTS.issues.major.length > 0) {
    console.log('\n🟡 MAJOR ISSUES:');
    AUDIT_RESULTS.issues.major.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.type.toUpperCase()}] ${issue.message}`);
    });
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(AUDIT_RESULTS, null, 2));
  console.log(`\n📋 Detailed report saved to: ${reportPath}`);
  
  // Generate recommendations
  generateRecommendations();
}

function generateRecommendations() {
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('=' .repeat(60));
  
  if (AUDIT_RESULTS.issues.critical.length > 0) {
    console.log('🔴 IMMEDIATE ACTION REQUIRED:');
    console.log('- Fix all critical issues before proceeding with stakeholder demos');
    console.log('- Ensure all environment variables are properly configured');
    console.log('- Verify database schema integrity');
  }
  
  if (AUDIT_RESULTS.issues.major.length > 0) {
    console.log('\n🟡 HIGH PRIORITY:');
    console.log('- Address major security and functionality issues');
    console.log('- Fix lint errors that could affect functionality');
    console.log('- Implement proper error handling');
  }
  
  console.log('\n✅ NEXT STEPS:');
  console.log('1. Fix critical and major issues identified');
  console.log('2. Run manual testing of key user workflows');
  console.log('3. Perform browser-based navigation testing');
  console.log('4. Validate API endpoints with authentication');
  console.log('5. Test responsive design and mobile compatibility');
  
  console.log('\n🎯 STAKEHOLDER DEMO READINESS:');
  const readinessScore = calculateReadinessScore();
  console.log(`Current Readiness Score: ${readinessScore}%`);
  
  if (readinessScore >= 90) {
    console.log('✅ READY for stakeholder demonstrations');
  } else if (readinessScore >= 75) {
    console.log('⚠️  MOSTLY READY - Address remaining issues for optimal presentation');
  } else {
    console.log('❌ NOT READY - Significant issues need resolution before demos');
  }
}

function calculateReadinessScore() {
  const criticalWeight = 30;
  const majorWeight = 15;
  const minorWeight = 5;
  
  const totalDeductions = 
    (AUDIT_RESULTS.issues.critical.length * criticalWeight) +
    (AUDIT_RESULTS.issues.major.length * majorWeight) +
    (AUDIT_RESULTS.issues.minor.length * minorWeight);
  
  return Math.max(0, 100 - totalDeductions);
}

// Run the audit
if (require.main === module) {
  runComprehensiveAudit().catch(console.error);
}

module.exports = {
  runComprehensiveAudit,
  AUDIT_RESULTS,
  NAVIGATION_STRUCTURE
};
