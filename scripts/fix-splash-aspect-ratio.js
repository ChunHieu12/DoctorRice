const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

/**
 * Sửa tỷ lệ khung hình của splash screen về 9:16 (0.5625)
 */
async function fixSplashAspectRatio() {
  const imagesDir = path.join(__dirname, "../src/assets/images");
  const inputPath = path.join(imagesDir, "onboarding-1.png");
  const backupDir = path.join(imagesDir, "backup");

  if (!fs.existsSync(inputPath)) {
    console.error("❌ Không tìm thấy file onboarding-1.png");
    process.exit(1);
  }

  try {
    // Đọc metadata
    const metadata = await sharp(inputPath).metadata();
    const { width, height } = metadata;

    console.log(`📸 Ảnh hiện tại: ${width}x${height}px`);
    console.log(`   Tỷ lệ: ${(width / height).toFixed(3)}`);

    // Tỷ lệ màn hình phone 9:16 = 0.5625
    const targetRatio = 9 / 16; // 0.5625
    const currentRatio = width / height;

    console.log(`\n🎯 Tỷ lệ mục tiêu: ${targetRatio.toFixed(3)} (9:16)`);

    // Tính toán kích thước mới
    // Giữ chiều rộng và tính chiều cao, hoặc ngược lại
    // Ưu tiên giữ chiều rộng lớn hơn để đảm bảo chất lượng
    let newWidth, newHeight;

    if (currentRatio < targetRatio) {
      // Ảnh hiện tại quá "dài" (cao hơn so với rộng)
      // Giữ chiều rộng, tính chiều cao mới
      newWidth = width;
      newHeight = Math.round(width / targetRatio);
      console.log(`\n📐 Ảnh quá cao → Giữ chiều rộng, điều chỉnh chiều cao`);
    } else {
      // Ảnh hiện tại quá "rộng"
      // Giữ chiều cao, tính chiều rộng mới
      newHeight = height;
      newWidth = Math.round(height * targetRatio);
      console.log(`\n📐 Ảnh quá rộng → Giữ chiều cao, điều chỉnh chiều rộng`);
    }

    console.log(`   Kích thước mới: ${newWidth}x${newHeight}px`);
    console.log(`   Tỷ lệ mới: ${(newWidth / newHeight).toFixed(3)}`);

    // Backup
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const backupPath = path.join(
      backupDir,
      `onboarding-1-backup-${timestamp}.png`
    );
    fs.copyFileSync(inputPath, backupPath);
    console.log(`\n📦 Đã backup: ${backupPath}`);

    // Resize với cover để fill full màn hình
    const tempPath = path.join(imagesDir, `onboarding-1-temp-${timestamp}.png`);

    console.log(`\n🔄 Đang resize với tỷ lệ 9:16...`);
    await sharp(inputPath)
      .resize(newWidth, newHeight, {
        fit: "cover", // Cover để fill full, crop phần thừa
        position: "center", // Giữ phần giữa của ảnh
      })
      .png()
      .toFile(tempPath);

    // Thay thế file gốc
    fs.unlinkSync(inputPath);
    fs.renameSync(tempPath, inputPath);

    // Verify
    const newMetadata = await sharp(inputPath).metadata();
    const finalRatio = newMetadata.width / newMetadata.height;

    console.log(`\n✅ Hoàn tất!`);
    console.log(
      `   Kích thước cuối: ${newMetadata.width}x${newMetadata.height}px`
    );
    console.log(`   Tỷ lệ cuối: ${finalRatio.toFixed(3)}`);

    if (Math.abs(finalRatio - targetRatio) < 0.01) {
      console.log(`   ✅ Tỷ lệ đã đúng với màn hình phone (9:16)`);
    } else {
      console.log(`   ⚠️  Tỷ lệ vẫn chưa chính xác`);
    }

    console.log(`\n💡 Bước tiếp theo:`);
    console.log(`   1. Restart development server: npm run start:clear`);
    console.log(`   2. Hoặc rebuild app: npx expo prebuild --clean`);
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
    process.exit(1);
  }
}

fixSplashAspectRatio();
