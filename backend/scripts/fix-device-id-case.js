/**
 * FIX SCRIPT: Normalize all device_id to lowercase in IoTConnection collection
 * Usage: node backend/scripts/fix-device-id-case.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixDeviceIdCase() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/doctorrice';
    await mongoose.connect(MONGO_URI);
    
    console.log('✅ Connected to MongoDB');
    console.log('🔧 Fixing device_id case...\n');
    
    // Get IoTConnection model
    const IoTConnection = mongoose.model('IoTConnection', new mongoose.Schema({
      deviceId: String,
      // ... other fields not needed for this script
    }), 'iotconnections');
    
    // Find all connections
    const connections = await IoTConnection.find({});
    
    console.log(`📊 Found ${connections.length} IoT connections\n`);
    
    let updated = 0;
    let unchanged = 0;
    
    for (const conn of connections) {
      const originalDeviceId = conn.deviceId;
      const normalizedDeviceId = originalDeviceId.toLowerCase();
      
      if (originalDeviceId !== normalizedDeviceId) {
        await IoTConnection.updateOne(
          { _id: conn._id },
          { $set: { deviceId: normalizedDeviceId } }
        );
        
        console.log(`✅ Updated: "${originalDeviceId}" → "${normalizedDeviceId}"`);
        updated++;
      } else {
        console.log(`⏭️  Skipped: "${originalDeviceId}" (already lowercase)`);
        unchanged++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY:');
    console.log(`   Updated: ${updated}`);
    console.log(`   Unchanged: ${unchanged}`);
    console.log(`   Total: ${connections.length}`);
    console.log('='.repeat(80));
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDeviceIdCase();

