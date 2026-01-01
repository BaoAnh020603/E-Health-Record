/**
 * Image Preprocessor Service
 * Tiền xử lý ảnh để cải thiện chất lượng OCR
 * Xử lý: ảnh mờ, nghiêng, ánh sáng kém, nhiễu
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class ImagePreprocessor {
  constructor() {
    this.tempDir = path.join(__dirname, '../uploads/temp');
  }

  /**
   * Đảm bảo thư mục temp tồn tại
   */
  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp dir:', error);
    }
  }

  /**
   * Tiền xử lý ảnh - SIÊU NÂNG CAO
   * Xử lý: mờ, nghiêng, ánh sáng kém, nhiễu, độ tương phản thấp
   */
  async preprocessImage(imagePath) {
    try {
      console.log('🎨 Preprocessing image for optimal OCR...');
      
      await this.ensureTempDir();
      
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      console.log(`   📐 Original: ${metadata.width}x${metadata.height}, ${metadata.format}`);
      
      // === BƯỚC 1: Chuyển sang grayscale (xám) ===
      console.log('   🎨 Step 1: Converting to grayscale...');
      let processed = image.grayscale();
      
      // === BƯỚC 2: Tăng độ phân giải nếu ảnh nhỏ ===
      if (metadata.width < 1500 || metadata.height < 1500) {
        const scale = Math.max(1500 / metadata.width, 1500 / metadata.height);
        const newWidth = Math.round(metadata.width * scale);
        const newHeight = Math.round(metadata.height * scale);
        
        console.log(`   📏 Step 2: Upscaling to ${newWidth}x${newHeight}...`);
        processed = processed.resize(newWidth, newHeight, {
          kernel: sharp.kernel.lanczos3, // Chất lượng cao nhất
          fit: 'fill'
        });
      } else {
        console.log('   ✓ Step 2: Resolution OK, skipping upscale');
      }
      
      // === BƯỚC 3: Chuẩn hóa độ sáng (normalize) ===
      console.log('   💡 Step 3: Normalizing brightness...');
      processed = processed.normalize();
      
      // === BƯỚC 4: Tăng độ tương phản ===
      console.log('   🔆 Step 4: Enhancing contrast...');
      processed = processed.linear(1.5, -(128 * 0.5)); // Tăng contrast 50%
      
      // === BƯỚC 5: Làm sắc nét (sharpen) ===
      console.log('   ✨ Step 5: Sharpening image...');
      processed = processed.sharpen({
        sigma: 1.5,  // Độ mạnh
        m1: 1.0,     // Flat areas
        m2: 2.0,     // Jagged areas
        x1: 2,       // Threshold
        y2: 10,      // Max boost
        y3: 20       // Max boost for jagged
      });
      
      // === BƯỚC 6: Giảm nhiễu (denoise) ===
      console.log('   🧹 Step 6: Reducing noise...');
      processed = processed.median(3); // Median filter để giảm nhiễu
      
      // === BƯỚC 7: Threshold (nhị phân hóa) ===
      console.log('   ⚫⚪ Step 7: Applying adaptive threshold...');
      processed = processed.threshold(128, {
        grayscale: false // Chuyển thành đen trắng
      });
      
      // === BƯỚC 8: Lưu ảnh đã xử lý ===
      const outputPath = path.join(
        this.tempDir, 
        `preprocessed_${Date.now()}_${path.basename(imagePath)}`
      );
      
      await processed.toFile(outputPath);
      
      console.log(`   ✅ Preprocessed image saved: ${outputPath}`);
      
      return {
        success: true,
        processedPath: outputPath,
        originalPath: imagePath
      };
    } catch (error) {
      console.error('❌ Preprocessing error:', error);
      return {
        success: false,
        error: error.message,
        originalPath: imagePath
      };
    }
  }

  /**
   * Tạo nhiều phiên bản ảnh với các cài đặt khác nhau
   * Để thử nhiều cách xử lý và chọn kết quả tốt nhất
   */
  async createMultipleVersions(imagePath) {
    try {
      console.log('🎨 Creating multiple preprocessed versions...');
      
      await this.ensureTempDir();
      
      const versions = [];
      
      // === VERSION 1: Standard (như trên) ===
      console.log('\n📸 Version 1: Standard preprocessing');
      const v1 = await this.preprocessImage(imagePath);
      if (v1.success) {
        versions.push({ name: 'standard', path: v1.processedPath });
      }
      
      // === VERSION 2: High Contrast ===
      console.log('\n📸 Version 2: High contrast');
      const v2Path = path.join(this.tempDir, `v2_${Date.now()}_${path.basename(imagePath)}`);
      await sharp(imagePath)
        .grayscale()
        .normalize()
        .linear(2.0, -(128 * 1.0)) // Contrast cao hơn
        .sharpen()
        .threshold(120)
        .toFile(v2Path);
      versions.push({ name: 'high_contrast', path: v2Path });
      
      // === VERSION 3: Soft (cho ảnh mờ) ===
      console.log('\n📸 Version 3: Soft processing (for blurry images)');
      const v3Path = path.join(this.tempDir, `v3_${Date.now()}_${path.basename(imagePath)}`);
      await sharp(imagePath)
        .grayscale()
        .normalize()
        .blur(0.5) // Blur nhẹ trước khi sharpen
        .sharpen({ sigma: 2.0 })
        .linear(1.3, -(128 * 0.3))
        .threshold(130)
        .toFile(v3Path);
      versions.push({ name: 'soft', path: v3Path });
      
      // === VERSION 4: Aggressive (cho ảnh tối) ===
      console.log('\n📸 Version 4: Aggressive (for dark images)');
      const v4Path = path.join(this.tempDir, `v4_${Date.now()}_${path.basename(imagePath)}`);
      await sharp(imagePath)
        .grayscale()
        .normalize()
        .linear(2.5, -(128 * 1.5)) // Contrast rất cao
        .sharpen({ sigma: 2.5 })
        .median(5) // Giảm nhiễu mạnh
        .threshold(110)
        .toFile(v4Path);
      versions.push({ name: 'aggressive', path: v4Path });
      
      console.log(`\n✅ Created ${versions.length} versions`);
      
      return {
        success: true,
        versions: versions,
        originalPath: imagePath
      };
    } catch (error) {
      console.error('❌ Error creating versions:', error);
      return {
        success: false,
        error: error.message,
        originalPath: imagePath
      };
    }
  }

  /**
   * Dọn dẹp file tạm - AN TOÀN
   */
  async cleanup(filePath, maxRetries = 3) {
    try {
      if (filePath && filePath.includes('/temp/') && fsSync.existsSync(filePath)) {
        // Retry logic cho Windows
        for (let i = 0; i < maxRetries; i++) {
          try {
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 300 * i));
            }
            await fs.unlink(filePath);
            console.log(`🧹 Cleaned up: ${path.basename(filePath)}`);
            return;
          } catch (error) {
            if (error.code === 'EPERM' && i < maxRetries - 1) {
              console.log(`⚠️  File locked, retry cleanup ${i + 1}/${maxRetries}...`);
              continue;
            }
            throw error;
          }
        }
      }
    } catch (error) {
      // Ignore cleanup errors - file sẽ được dọn dẹp sau
      console.warn(`⚠️  Could not cleanup file: ${error.message}`);
    }
  }

  /**
   * Dọn dẹp tất cả file tạm cũ (> 1 giờ)
   */
  async cleanupOldFiles() {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        
        try {
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtimeMs > oneHour) {
            // Retry logic cho từng file
            for (let i = 0; i < 3; i++) {
              try {
                await fs.unlink(filePath);
                console.log(`🧹 Cleaned up old file: ${file}`);
                break;
              } catch (error) {
                if (error.code === 'EPERM' && i < 2) {
                  await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
                  continue;
                }
                // Ignore nếu không xóa được
                break;
              }
            }
          }
        } catch (error) {
          // Ignore errors for individual files
          continue;
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }
}

module.exports = new ImagePreprocessor();
