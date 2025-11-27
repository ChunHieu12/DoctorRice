const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Đường dẫn đến thư mục ảnh
const IMAGES_DIR = path.join(__dirname, '../src/assets/images');

// Yêu cầu kích thước
const REQUIREMENTS = {
  icon: {
    file: 'logo2.png',
    width: 1024,
    height: 1024,
    safeZone: {
      // Safe zone cho Android adaptive icon: 66% ở giữa
      minX: 0.17, // 17% từ trái
      maxX: 0.83, // 83% từ trái
      minY: 0.17, // 17% từ trên
      maxY: 0.83, // 83% từ trên
    },
    description: 'Icon app (1024x1024px) - phần quan trọng nên nằm trong safe zone 66%',
  },
  splash: {
    file: 'onboarding-1.png',
    // Splash nên có tỷ lệ phù hợp với màn hình (thường là 9:16 hoặc 3:4)
    minWidth: 1242,
    minHeight: 2436, // iOS standard
    recommendedWidth: 1284,
    recommendedHeight: 2778, // Android standard
    description: 'Splash screen - nên có kích thước lớn để cover full màn hình',
  },
};

/**
 * Kiểm tra kích thước ảnh
 */
async function checkImageSize(filePath, requirements) {
  try {
    const metadata = await sharp(filePath).metadata();
    const { width, height, format } = metadata;

    console.log(`\n📸 File: ${path.basename(filePath)}`);
    console.log(`   Kích thước hiện tại: ${width}x${height}px`);
    console.log(`   Format: ${format.toUpperCase()}`);

    if (requirements.width && requirements.height) {
      // Kiểm tra icon
      const isCorrectSize = width === requirements.width && height === requirements.height;
      const aspectRatio = width / height;
      const expectedRatio = requirements.width / requirements.height;

      console.log(`   ✅ Yêu cầu: ${requirements.width}x${requirements.height}px`);
      
      if (isCorrectSize) {
        console.log(`   ✅ Kích thước ĐÚNG`);
      } else {
        console.log(`   ❌ Kích thước SAI`);
        if (Math.abs(aspectRatio - expectedRatio) > 0.01) {
          console.log(`   ⚠️  Tỷ lệ khung hình không đúng (hiện tại: ${aspectRatio.toFixed(2)}, yêu cầu: ${expectedRatio.toFixed(2)})`);
        }
      }

      // Kiểm tra safe zone cho icon
      if (requirements.safeZone) {
        console.log(`\n   📐 Safe Zone (Android Adaptive Icon):`);
        console.log(`      Phần quan trọng nên nằm trong: ${Math.round(requirements.width * requirements.safeZone.minX)}-${Math.round(requirements.width * requirements.safeZone.maxX)}px (ngang)`);
        console.log(`      và ${Math.round(requirements.height * requirements.safeZone.minY)}-${Math.round(requirements.height * requirements.safeZone.maxY)}px (dọc)`);
        console.log(`      ⚠️  Lưu ý: Text "Bác sĩ Lúa" ở dưới có thể bị cắt nếu nằm ngoài safe zone`);
      }

      return {
        file: path.basename(filePath),
        currentSize: { width, height },
        requiredSize: { width: requirements.width, height: requirements.height },
        isValid: isCorrectSize,
        needsResize: !isCorrectSize,
      };
    } else {
      // Kiểm tra splash
      const meetsMinSize = width >= requirements.minWidth && height >= requirements.minHeight;
      const aspectRatio = width / height;
      const recommendedRatio = requirements.recommendedWidth / requirements.recommendedHeight;

      console.log(`   ✅ Kích thước tối thiểu: ${requirements.minWidth}x${requirements.minHeight}px`);
      console.log(`   ✅ Kích thước khuyến nghị: ${requirements.recommendedWidth}x${requirements.recommendedHeight}px`);
      
      if (meetsMinSize) {
        console.log(`   ✅ Đạt kích thước tối thiểu`);
      } else {
        console.log(`   ❌ Chưa đạt kích thước tối thiểu`);
      }

      if (Math.abs(aspectRatio - recommendedRatio) > 0.1) {
        console.log(`   ⚠️  Tỷ lệ khung hình: ${aspectRatio.toFixed(2)} (khuyến nghị: ${recommendedRatio.toFixed(2)})`);
        console.log(`      Có thể không cover full màn hình tốt`);
      }

      return {
        file: path.basename(filePath),
        currentSize: { width, height },
        minSize: { width: requirements.minWidth, height: requirements.minHeight },
        recommendedSize: { width: requirements.recommendedWidth, height: requirements.recommendedHeight },
        isValid: meetsMinSize,
        needsResize: !meetsMinSize || Math.abs(aspectRatio - recommendedRatio) > 0.1,
      };
    }
  } catch (error) {
    console.error(`   ❌ Lỗi khi đọc file: ${error.message}`);
    return {
      file: path.basename(filePath),
      error: error.message,
      isValid: false,
    };
  }
}

/**
 * Resize ảnh icon
 */
async function resizeIcon(inputPath, outputPath, width, height) {
  try {
    console.log(`\n🔄 Đang resize icon...`);
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background
      })
      .png()
      .toFile(outputPath);
    
    console.log(`   ✅ Đã resize thành công: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Lỗi khi resize: ${error.message}`);
    return false;
  }
}

/**
 * Resize ảnh splash
 */
async function resizeSplash(inputPath, outputPath, width, height) {
  try {
    console.log(`\n🔄 Đang resize splash...`);
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover', // Cover để fill full màn hình
        position: 'center',
      })
      .png()
      .toFile(outputPath);
    
    console.log(`   ✅ Đã resize thành công: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Lỗi khi resize: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Kiểm tra kích thước ảnh icon và splash...\n');
  console.log('='.repeat(60));

  const results = [];

  // Kiểm tra icon
  const iconPath = path.join(IMAGES_DIR, REQUIREMENTS.icon.file);
  if (fs.existsSync(iconPath)) {
    const iconResult = await checkImageSize(iconPath, REQUIREMENTS.icon);
    results.push(iconResult);
  } else {
    console.log(`\n❌ Không tìm thấy file: ${REQUIREMENTS.icon.file}`);
    results.push({
      file: REQUIREMENTS.icon.file,
      error: 'File not found',
      isValid: false,
    });
  }

  // Kiểm tra splash
  const splashPath = path.join(IMAGES_DIR, REQUIREMENTS.splash.file);
  if (fs.existsSync(splashPath)) {
    const splashResult = await checkImageSize(splashPath, REQUIREMENTS.splash);
    results.push(splashResult);
  } else {
    console.log(`\n❌ Không tìm thấy file: ${REQUIREMENTS.splash.file}`);
    results.push({
      file: REQUIREMENTS.splash.file,
      error: 'File not found',
      isValid: false,
    });
  }

  // Tóm tắt
  console.log('\n' + '='.repeat(60));
  console.log('📊 TÓM TẮT:');
  console.log('='.repeat(60));

  const needsResize = results.some(r => r.needsResize);
  const allValid = results.every(r => r.isValid);

  results.forEach(result => {
    if (result.error) {
      console.log(`\n❌ ${result.file}: ${result.error}`);
    } else if (result.isValid && !result.needsResize) {
      console.log(`\n✅ ${result.file}: Kích thước đúng`);
    } else {
      console.log(`\n⚠️  ${result.file}: Cần resize`);
      if (result.requiredSize) {
        console.log(`   → Resize về: ${result.requiredSize.width}x${result.requiredSize.height}px`);
      } else if (result.recommendedSize) {
        console.log(`   → Resize về: ${result.recommendedSize.width}x${result.recommendedSize.height}px`);
      }
    }
  });

  // Hỏi có muốn resize không
  if (needsResize) {
    console.log('\n' + '='.repeat(60));
    console.log('💡 Để tự động resize, chạy:');
    console.log('   node scripts/validate-and-resize-images.js --resize');
    console.log('\n⚠️  Lưu ý: Script sẽ tạo file backup trước khi resize');
  }

  if (allValid && !needsResize) {
    console.log('\n✅ Tất cả ảnh đều đạt yêu cầu!');
  }

  return { results, needsResize, allValid };
}

// Xử lý argument --resize
if (process.argv.includes('--resize')) {
  (async () => {
    const iconPath = path.join(IMAGES_DIR, REQUIREMENTS.icon.file);
    const splashPath = path.join(IMAGES_DIR, REQUIREMENTS.splash.file);
    
    // Backup files
    const backupDir = path.join(IMAGES_DIR, 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Kiểm tra và resize icon nếu cần
    if (fs.existsSync(iconPath)) {
      const iconResult = await checkImageSize(iconPath, REQUIREMENTS.icon);
      if (iconResult.needsResize) {
        const iconBackup = path.join(backupDir, `logo2-backup-${timestamp}.png`);
        fs.copyFileSync(iconPath, iconBackup);
        console.log(`📦 Đã backup icon: ${iconBackup}`);
        
        // Tạo file tạm thời
        const iconTemp = path.join(IMAGES_DIR, `logo2-temp-${timestamp}.png`);
        const success = await resizeIcon(
          iconPath,
          iconTemp,
          REQUIREMENTS.icon.width,
          REQUIREMENTS.icon.height
        );
        
        if (success) {
          // Thay thế file gốc bằng file đã resize
          fs.unlinkSync(iconPath);
          fs.renameSync(iconTemp, iconPath);
        }
      } else {
        console.log(`\n⏭️  Icon đã đúng kích thước, bỏ qua resize`);
      }
    }

    // Kiểm tra và resize splash nếu cần
    if (fs.existsSync(splashPath)) {
      const splashResult = await checkImageSize(splashPath, REQUIREMENTS.splash);
      if (splashResult.needsResize) {
        const splashBackup = path.join(backupDir, `onboarding-1-backup-${timestamp}.png`);
        fs.copyFileSync(splashPath, splashBackup);
        console.log(`📦 Đã backup splash: ${splashBackup}`);
        
        // Tạo file tạm thời
        const splashTemp = path.join(IMAGES_DIR, `onboarding-1-temp-${timestamp}.png`);
        const success = await resizeSplash(
          splashPath,
          splashTemp,
          REQUIREMENTS.splash.recommendedWidth,
          REQUIREMENTS.splash.recommendedHeight
        );
        
        if (success) {
          // Thay thế file gốc bằng file đã resize
          fs.unlinkSync(splashPath);
          fs.renameSync(splashTemp, splashPath);
        }
      } else {
        console.log(`\n⏭️  Splash đã đúng kích thước, bỏ qua resize`);
      }
    }

    console.log('\n✅ Hoàn tất resize!');
  })().catch(console.error);
} else {
  main().catch(console.error);
}

