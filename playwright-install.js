
#!/usr/bin/env node

const { spawn } = require('child_process');

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
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

async function installPlaywright() {
  try {
    console.log('📦 Installing Playwright browsers...');
    await runCommand('npx', ['playwright', 'install']);
    console.log('✅ Playwright browsers installed successfully!');
  } catch (error) {
    console.error('❌ Failed to install Playwright browsers:', error.message);
    process.exit(1);
  }
}

installPlaywright();
