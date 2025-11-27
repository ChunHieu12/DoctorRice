const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Tạo icon version an toàn cho Android adaptive icon
 * Crop phần trên của logo (chỉ lấy nhân vật, bỏ text ở dưới)
 */
async function createSafeIcon() {
  const imagesDir = path.join(__dirname, '../src/assets/images');
  const inputPath = path.join(imagesDir, 'logo2.png');
  const outputPath = path.join(imagesDir, 'logo2-safe.png');
  const backupDir = path.join(imagesDir, 'backup');

  try {
    // Kiểm tra file tồn tại
    if (!fs.existsSync(inputPath)) {
      console.error('❌ Không tìm thấy file logo2.png');
      process.exit(1);
    }

    // Đọc metadata
    const metadata = await sharp(inputPath).metadata();
    const { width, height } = metadata;

    console.log(`📸 File gốc: ${width}x${height}px`);

    // Safe zone: 66% ở giữa (17% - 83%)
    // Để tránh text bị cắt, ta crop phần trên (khoảng 70% trên cùng)
    const cropHeight = Math.round(height * 0.7); // Lấy 70% trên cùng
    const cropY = 0; // Bắt đầu từ trên

    console.log(`✂️  Crop: ${width}x${cropHeight}px (từ y=${cropY})`);
    console.log(`   → Loại bỏ ${height - cropHeight}px ở dưới (chứa text)`);

    // Backup file gốc
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupPath = path.join(backupDir, `logo2-backup-${timestamp}.png`);
    fs.copyFileSync(inputPath, backupPath);
    console.log(`📦 Đã backup: ${backupPath}`);

    // Crop và resize về 1024x1024
    await sharp(inputPath)
      .extract({
        left: 0,
        top: cropY,
        width: width,
        height: cropHeight,
      })
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent
      })
      .png()
      .toFile(outputPath);

    console.log(`✅ Đã tạo icon an toàn: logo2-safe.png`);
    console.log(`\n💡 Bước tiếp theo:`);
    console.log(`   1. Kiểm tra file logo2-safe.png`);
    console.log(`   2. Nếu ổn, thay thế logo2.png hoặc cập nhật app.json`);
    console.log(`   3. Hoặc dùng logo2-safe.png làm foregroundImage trong adaptiveIcon`);

    return outputPath;
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

// Chạy script
createSafeIcon();

