
const { spawn } = require('child_process');
const path = require('path');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function runTests() {
  log('blue', '🧪 mySafePlay<sup>™</sup> Testing Framework - Comprehensive Test Suite');
  log('blue', '=======================================================');

  const tests = [
    {
      name: 'TypeScript Compilation Check',
      command: 'npx',
      args: ['tsc', '--noEmit']
    },
    {
      name: 'Jest Unit Tests',
      command: 'npx',
      args: ['jest', '--passWithNoTests', '--verbose']
    },
    {
      name: 'Component Tests',
      command: 'npx',
      args: ['jest', '--testPathPattern=components', '--passWithNoTests']
    },
    {
      name: 'API Integration Tests',
      command: 'npx',
      args: ['jest', '--testPathPattern=api', '--passWithNoTests']
    },
    {
      name: 'Library/Utility Tests',
      command: 'npx',
      args: ['jest', '--testPathPattern=lib', '--passWithNoTests']
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      log('yellow', `\n🔍 Running: ${test.name}`);
      log('blue', `Command: ${test.command} ${test.args.join(' ')}`);
      console.log('----------------------------------------');
      
      await runCommand(test.command, test.args);
      log('green', `✅ ${test.name} - PASSED`);
      passed++;
    } catch (error) {
      log('red', `❌ ${test.name} - FAILED`);
      failed++;
    }
  }

  // Summary
  log('blue', '\n📊 TEST SUMMARY');
  log('blue', '=======================================================');
  console.log(`Total Tests: ${colors.blue}${tests.length}${colors.reset}`);
  console.log(`Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${failed}${colors.reset}`);

  if (failed === 0) {
    log('green', '\n🎉 ALL TESTS PASSED! Testing framework is ready.');
    process.exit(0);
  } else {
    log('red', '\n❌ Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

runTests().catch(error => {
  log('red', `\n💥 Test runner failed: ${error.message}`);
  process.exit(1);
});
