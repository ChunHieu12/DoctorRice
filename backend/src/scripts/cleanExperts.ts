/**
 * Clean Script: Delete all expert users
 * Run with: npx ts-node src/scripts/cleanExperts.ts
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User';

dotenv.config();

async function cleanExperts() {
  try {
    console.log('🧹 Starting expert users cleanup...\n');

    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/doctorrice';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Delete all users with 'expert' role
    const result = await User.deleteMany({ roles: 'expert' });
    
    console.log(`✅ Deleted ${result.deletedCount} expert users\n`);

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run cleanup
cleanExperts();

