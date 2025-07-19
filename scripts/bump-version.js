
const fs = require('fs');
const path = require('path');

// Paths
const VERSION_FILE = path.join(__dirname, '..', 'VERSION');
const PACKAGE_JSON_FILE = path.join(__dirname, '..', 'package.json');

/**
 * Parse version string in format: 1.5.33-alpha.1
 * Returns { major, minor, patch, alpha }
 */
function parseVersion(versionString) {
  const alphaRegex = /^(\d+)\.(\d+)\.(\d+)-alpha\.(\d+)$/;
  const match = versionString.trim().match(alphaRegex);
  
  if (!match) {
    throw new Error(`Invalid version format: ${versionString}. Expected format: X.Y.Z-alpha.N`);
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    alpha: parseInt(match[4], 10)
  };
}

/**
 * Format version object back to string
 */
function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}-alpha.${version.alpha}`;
}

/**
 * Read current version from VERSION file
 */
function getCurrentVersion() {
  try {
    if (!fs.existsSync(VERSION_FILE)) {
      throw new Error('VERSION file not found');
    }
    
    const versionContent = fs.readFileSync(VERSION_FILE, 'utf8');
    return versionContent.trim();
  } catch (error) {
    throw new Error(`Failed to read VERSION file: ${error.message}`);
  }
}

/**
 * Write new version to VERSION file
 */
function writeVersion(versionString) {
  try {
    fs.writeFileSync(VERSION_FILE, versionString + '\n', 'utf8');
    console.log(`✅ Updated VERSION file: ${versionString}`);
  } catch (error) {
    throw new Error(`Failed to write VERSION file: ${error.message}`);
  }
}

/**
 * Update package.json version (read-only approach for display)
 */
function updatePackageJsonVersion(versionString) {
  try {
    if (!fs.existsSync(PACKAGE_JSON_FILE)) {
      console.log('⚠️  package.json not found - skipping package.json update');
      return;
    }
    
    const packageContent = fs.readFileSync(PACKAGE_JSON_FILE, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    console.log(`📦 Current package.json version: ${packageJson.version}`);
    console.log(`📦 Note: Consider manually updating package.json version to: ${versionString}`);
    
  } catch (error) {
    console.log(`⚠️  Could not read package.json: ${error.message}`);
  }
}

/**
 * Main bump function
 */
function bumpVersion() {
  try {
    console.log('🔄 Starting version bump...\n');
    
    // Read current version
    const currentVersionString = getCurrentVersion();
    console.log(`📍 Current version: ${currentVersionString}`);
    
    // Parse version
    const currentVersion = parseVersion(currentVersionString);
    console.log(`📊 Parsed: Major=${currentVersion.major}, Minor=${currentVersion.minor}, Patch=${currentVersion.patch}, Alpha=${currentVersion.alpha}`);
    
    // Increment alpha
    const newVersion = {
      ...currentVersion,
      alpha: currentVersion.alpha + 1
    };
    
    const newVersionString = formatVersion(newVersion);
    console.log(`⬆️  New version: ${newVersionString}`);
    
    // Write new version
    writeVersion(newVersionString);
    
    // Show package.json info
    updatePackageJsonVersion(newVersionString);
    
    console.log('\n✅ Version bump complete!');
    console.log(`🎯 ${currentVersionString} → ${newVersionString}`);
    
    return newVersionString;
    
  } catch (error) {
    console.error('❌ Version bump failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  bumpVersion();
}

module.exports = { bumpVersion, parseVersion, formatVersion, getCurrentVersion };
