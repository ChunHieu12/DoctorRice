const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Phân tích ảnh splash để kiểm tra padding và transparent areas
 */
async function analyzeSplashImage() {
  const imagePath = path.join(__dirname, '../src/assets/images/onboarding-1.png');

  if (!fs.existsSync(imagePath)) {
    console.error('❌ Không tìm thấy file onboarding-1.png');
    process.exit(1);
  }

  try {
    const metadata = await sharp(imagePath).metadata();
    const { width, height, channels, hasAlpha } = metadata;

    console.log('📸 Thông tin ảnh splash:');
    console.log(`   Kích thước: ${width}x${height}px`);
    console.log(`   Channels: ${channels}`);
    console.log(`   Có alpha channel: ${hasAlpha ? 'Có' : 'Không'}`);

    // Đọc ảnh để kiểm tra padding
    const image = sharp(imagePath);
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width: imgWidth, height: imgHeight, channels: imgChannels } = info;

    // Kiểm tra các góc để xem có transparent/padding không
    const corners = [
      { name: 'Góc trên trái', x: 0, y: 0 },
      { name: 'Góc trên phải', x: imgWidth - 1, y: 0 },
      { name: 'Góc dưới trái', x: 0, y: imgHeight - 1 },
      { name: 'Góc dưới phải', x: imgWidth - 1, y: imgHeight - 1 },
    ];

    console.log('\n🔍 Kiểm tra padding/transparent areas:');
    let hasPadding = false;

    for (const corner of corners) {
      const index = (corner.y * imgWidth + corner.x) * imgChannels;
      const alpha = imgChannels === 4 ? data[index + 3] : 255;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      // Kiểm tra nếu là transparent hoặc màu nền xanh lá (#4CAF50)
      const isTransparent = alpha < 10;
      const isGreenBg = Math.abs(r - 76) < 5 && Math.abs(g - 175) < 5 && Math.abs(b - 80) < 5;

      if (isTransparent || isGreenBg) {
        console.log(`   ⚠️  ${corner.name}: ${isTransparent ? 'Transparent' : 'Màu nền xanh lá'} - Có thể là padding`);
        hasPadding = true;
      } else {
        console.log(`   ✅ ${corner.name}: Có nội dung`);
      }
    }

    // Kiểm tra viền ảnh
    console.log('\n🔍 Kiểm tra viền ảnh (10px từ mỗi cạnh):');
    const borderSize = 10;
    let borderTransparentCount = 0;
    let borderGreenCount = 0;
    let totalBorderPixels = 0;

    for (let y = 0; y < imgHeight; y++) {
      for (let x = 0; x < imgWidth; x++) {
        const isBorder = x < borderSize || x >= imgWidth - borderSize || 
                        y < borderSize || y >= imgHeight - borderSize;
        
        if (isBorder) {
          totalBorderPixels++;
          const index = (y * imgWidth + x) * imgChannels;
          const alpha = imgChannels === 4 ? data[index + 3] : 255;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];

          if (alpha < 10) {
            borderTransparentCount++;
          } else if (Math.abs(r - 76) < 5 && Math.abs(g - 175) < 5 && Math.abs(b - 80) < 5) {
            borderGreenCount++;
          }
        }
      }
    }

    const borderPaddingPercent = ((borderTransparentCount + borderGreenCount) / totalBorderPixels) * 100;
    console.log(`   Viền có ${borderPaddingPercent.toFixed(1)}% là padding/transparent`);

    if (borderPaddingPercent > 50) {
      console.log(`   ⚠️  Ảnh có nhiều padding ở viền - đây có thể là lý do splash không full màn hình`);
      console.log(`\n💡 Giải pháp:`);
      console.log(`   1. Crop ảnh để loại bỏ padding`);
      console.log(`   2. Hoặc tạo ảnh mới không có padding`);
    } else {
      console.log(`   ✅ Viền ảnh có nội dung`);
    }

    // Kiểm tra tỷ lệ khung hình
    const aspectRatio = width / height;
    const phoneAspectRatio = 9 / 16; // Standard phone
    console.log(`\n📐 Tỷ lệ khung hình: ${aspectRatio.toFixed(3)} (phone: ${phoneAspectRatio.toFixed(3)})`);

    if (Math.abs(aspectRatio - phoneAspectRatio) > 0.01) {
      console.log(`   ⚠️  Tỷ lệ khung hình không khớp với màn hình phone`);
    } else {
      console.log(`   ✅ Tỷ lệ khung hình phù hợp`);
    }

    return {
      hasPadding,
      borderPaddingPercent,
      aspectRatio,
    };

  } catch (error) {
    console.error('❌ Lỗi khi phân tích ảnh:', error.message);
    process.exit(1);
  }
}

analyzeSplashImage();

