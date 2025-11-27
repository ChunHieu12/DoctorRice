/**
 * DEBUG SCRIPT: Check Firebase for available devices and images
 * Usage: node backend/scripts/check-firebase-devices.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase
const serviceAccount = require(path.join(__dirname, '../firebase-iot-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://rice-813b5-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.database();

async function checkDevices() {
  try {
    console.log('🔍 Checking Firebase for IoT devices and images...\n');
    console.log('=' .repeat(80));
    
    // Get last 3 days
    const today = new Date();
    const dateKeys = [];
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0].replace(/-/g, '');
      dateKeys.push(dateKey);
    }
    
    console.log(`📅 Checking dates: ${dateKeys.join(', ')}\n`);
    
    const deviceSummary = new Map();
    let totalImages = 0;
    
    // Check each date
    for (const dateKey of dateKeys) {
      const feedsRef = db.ref(`feeds/${dateKey}`);
      const snapshot = await feedsRef.once('value');
      
      if (snapshot.exists()) {
        const feeds = snapshot.val();
        const feedCount = Object.keys(feeds).length;
        
        console.log(`\n📍 Date: ${dateKey} (${feedCount} captures)`);
        console.log('-'.repeat(80));
        
        // Analyze first 5 captures
        const captures = Object.entries(feeds).slice(0, 5);
        
        for (const [captureId, data] of captures) {
          const deviceId = data.device_id || 'UNKNOWN';
          const gps = data.gps || {};
          const hasImage = !!(data.image && data.image.url);
          
          console.log(`\n  📸 Capture: ${captureId}`);
          console.log(`     Device ID: ${deviceId}`);
          console.log(`     GPS: lat=${gps.lat}, lng=${gps.lng || gps.lon}`);
          console.log(`     Has Image: ${hasImage ? '✅' : '❌'}`);
          console.log(`     Image URL: ${hasImage ? data.image.url.substring(0, 80) + '...' : 'N/A'}`);
          
          if (data.env) {
            console.log(`     Sensors: temp=${data.env.temp}°C, hum=${data.env.hum}%, soil=${data.env.soil}%`);
          }
          
          // Track devices
          if (!deviceSummary.has(deviceId)) {
            deviceSummary.set(deviceId, {
              count: 0,
              dates: new Set(),
              sampleGPS: null,
            });
          }
          
          const summary = deviceSummary.get(deviceId);
          summary.count++;
          summary.dates.add(dateKey);
          if (!summary.sampleGPS && gps.lat) {
            summary.sampleGPS = { lat: gps.lat, lng: gps.lng || gps.lon };
          }
          
          totalImages++;
        }
        
        if (feedCount > 5) {
          console.log(`\n  ... and ${feedCount - 5} more captures`);
        }
      } else {
        console.log(`\n📍 Date: ${dateKey} - No data`);
      }
    }
    
    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`\nTotal Images: ${totalImages}`);
    console.log(`Total Devices: ${deviceSummary.size}\n`);
    
    if (deviceSummary.size > 0) {
      console.log('Devices found:');
      for (const [deviceId, info] of deviceSummary.entries()) {
        console.log(`\n  🤖 Device: ${deviceId}`);
        console.log(`     Images: ${info.count}`);
        console.log(`     Active dates: ${Array.from(info.dates).join(', ')}`);
        if (info.sampleGPS) {
          console.log(`     Sample GPS: lat=${info.sampleGPS.lat}, lng=${info.sampleGPS.lng}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 TROUBLESHOOTING TIPS:');
    console.log('\n1. Check device_id matches exactly (case-sensitive)');
    console.log('2. Check GPS coordinates are within field radius');
    console.log('3. Use calculator: https://www.movable-type.co.uk/scripts/latlong.html');
    console.log('4. Common radius: 100m for testing, 500m for production');
    console.log('\n' + '='.repeat(80));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDevices();

