/**
 * Generate IoT Connection Codes
 * CLI script to generate connection codes for IoT devices
 * 
 * Usage:
 *   npm run generate-iot-codes -- --device JETSON001 --quantity 100
 */
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { IoTConnectionCode } from '../models/IoTConnectionCode';
import { logger } from '../utils/logger';

// Generate random code part (6 characters)
function generateRandomPart(): string {
  // Exclude confusing characters: 0, O, I, 1
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  
  return result;
}

// Generate full connection code
function generateCode(deviceId: string = 'ANY'): string {
  const randomPart = generateRandomPart();
  return `${deviceId.toUpperCase()}-${randomPart}`;
}

// Check if code already exists
async function codeExists(code: string): Promise<boolean> {
  const existing = await IoTConnectionCode.findOne({ code }).select('_id');
  return !!existing;
}

// Generate unique code
async function generateUniqueCode(deviceId: string): Promise<string> {
  let code = generateCode(deviceId);
  let attempts = 0;
  const maxAttempts = 10;
  
  while (await codeExists(code) && attempts < maxAttempts) {
    code = generateCode(deviceId);
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique code after 10 attempts');
  }
  
  return code;
}

// Generate multiple codes
async function generateCodes(deviceId: string, quantity: number): Promise<string[]> {
  const codes: string[] = [];
  
  logger.info(`🔧 Generating ${quantity} codes for device: ${deviceId}`);
  
  for (let i = 0; i < quantity; i++) {
    try {
      const code = await generateUniqueCode(deviceId);
      const codeHash = await bcrypt.hash(code, 10);
      
      await IoTConnectionCode.create({
        deviceId: deviceId.toUpperCase(),
        code,
        codeHash,
        isUsed: false,
      });
      
      codes.push(code);
      
      if ((i + 1) % 10 === 0) {
        logger.info(`  ✓ Generated ${i + 1}/${quantity} codes`);
      }
    } catch (error: any) {
      logger.error(`  ✗ Error generating code ${i + 1}:`, error.message);
    }
  }
  
  return codes;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let deviceId = 'JETSON001';
  let quantity = 10;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--device' && args[i + 1]) {
      deviceId = args[i + 1];
    }
    if (args[i] === '--quantity' && args[i + 1]) {
      quantity = parseInt(args[i + 1], 10);
    }
  }
  
  return { deviceId, quantity };
}

// Main function
async function main() {
  try {
    logger.info('🚀 IoT Code Generator');
    logger.info('='.repeat(50));
    
    const { deviceId, quantity } = parseArgs();
    
    // Validate
    if (!deviceId || quantity < 1 || quantity > 1000) {
      logger.error('Invalid arguments!');
      logger.info('Usage: npm run generate-iot-codes -- --device JETSON001 --quantity 100');
      logger.info('  --device: Device ID (default: JETSON001)');
      logger.info('  --quantity: Number of codes (1-1000, default: 10)');
      process.exit(1);
    }
    
    // Connect to database
    logger.info('📦 Connecting to database...');
    await connectDatabase();
    
    // Generate codes
    const codes = await generateCodes(deviceId, quantity);
    
    // Summary
    logger.info('='.repeat(50));
    logger.info(`✅ Successfully generated ${codes.length} codes!`);
    logger.info(`📋 Device: ${deviceId}`);
    logger.info('');
    logger.info('Sample codes (first 5):');
    codes.slice(0, 5).forEach((code, i) => {
      logger.info(`  ${i + 1}. ${code}`);
    });
    
    if (codes.length > 5) {
      logger.info(`  ... and ${codes.length - 5} more`);
    }
    
    logger.info('');
    logger.info('💡 Next steps:');
    logger.info('  1. Export codes: GET /api/admin/iot-codes/export?deviceId=' + deviceId);
    logger.info('  2. Distribute codes to users');
    logger.info('  3. Users connect via app with code');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { generateCode, generateCodes };

