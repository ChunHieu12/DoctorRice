#!/usr/bin/env node

/**
 * Script to quickly switch between environment configurations
 * Usage: node scripts/switch-env.js [local|production]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const env = args[0];

const ROOT_DIR = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT_DIR, '.env');

const ENV_CONFIGS = {
  local: path.join(ROOT_DIR, '.env.local'),
  production: path.join(ROOT_DIR, '.env.production'),
};

if (!env || !ENV_CONFIGS[env]) {
  console.log('❌ Usage: node scripts/switch-env.js [local|production]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/switch-env.js local       # Switch to localhost');
  console.log('  node scripts/switch-env.js production  # Switch to Render');
  process.exit(1);
}

try {
  const sourceFile = ENV_CONFIGS[env];
  
  if (!fs.existsSync(sourceFile)) {
    console.log(`❌ Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  fs.copyFileSync(sourceFile, ENV_FILE);
  
  console.log('✅ Environment switched successfully!');
  console.log('📝 Active configuration:', env);
  console.log('');
  console.log('⚠️  IMPORTANT: Restart Expo with --clear flag:');
  console.log('   npm start -- --clear');
  console.log('   or');
  console.log('   npx expo start --clear');
  
} catch (error) {
  console.log('❌ Error switching environment:', error.message);
  process.exit(1);
}

