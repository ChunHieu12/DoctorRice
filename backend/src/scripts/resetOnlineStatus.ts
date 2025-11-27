/**
 * Reset all users' online status to offline
 * Run: npx ts-node src/scripts/resetOnlineStatus.ts
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';

// Load environment variables
dotenv.config();

async function resetOnlineStatus() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDatabase();

    console.log('🔄 Resetting all users to offline...');
    const result = await User.updateMany(
      {},
      {
        $set: {
          isOnline: false,
        },
      }
    );

    console.log(`✅ Reset ${result.modifiedCount} users to offline`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetOnlineStatus();

