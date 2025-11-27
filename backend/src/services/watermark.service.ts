import sharp from 'sharp';

interface WatermarkOptions {
  lat: number;
  lng: number;
  timestamp: number;
  device: string;
}

/**
 * Add GPS watermark to image using Sharp
 */
export class WatermarkService {
  /**
   * Process image and add watermark
   */
  static async addWatermark(
    inputPath: string,
    outputPath: string,
    options: WatermarkOptions
  ): Promise<void> {
    try {
      const { lat, lng, timestamp, device } = options;

      // Format watermark text
      const date = new Date(timestamp).toLocaleString('vi-VN');
      const coordinates = `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      const watermarkText = `${date}\n${coordinates}\n${device}`;

      // Get image metadata
      const metadata = await sharp(inputPath).metadata();
      const width = metadata.width || 1024;
      const height = metadata.height || 1024;

      // Create SVG watermark
      const fontSize = 24;
      const padding = 20;
      const lineHeight = fontSize + 8;
      const lines = watermarkText.split('\n');
      
      const svgText = lines
        .map((line, i) => `<text x="${padding}" y="${padding + lineHeight * (i + 1)}">${line}</text>`)
        .join('');

      const svgWatermark = `
        <svg width="${width}" height="${height}">
          <style>
            text {
              font-family: Arial, sans-serif;
              font-size: ${fontSize}px;
              fill: white;
              stroke: black;
              stroke-width: 1px;
              paint-order: stroke;
            }
          </style>
          ${svgText}
        </svg>
      `;

      // Apply watermark
      await sharp(inputPath)
        .composite([
          {
            input: Buffer.from(svgWatermark),
            gravity: 'southwest',
          },
        ])
        .jpeg({ quality: 90 })
        .toFile(outputPath);

    } catch (error) {
      console.error('Watermark error:', error);
      throw new Error('Failed to add watermark');
    }
  }

  /**
   * Generate thumbnail
   */
  static async generateThumbnail(
    inputPath: string,
    outputPath: string,
    size: number = 200
  ): Promise<void> {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
  }
}

