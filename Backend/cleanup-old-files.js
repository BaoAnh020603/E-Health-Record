/**
 * Cleanup Old Files Script
 * Dọn dẹp file upload và temp cũ (> 1 giờ)
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const TEMP_DIR = path.join(__dirname, 'uploads/temp');
const ONE_HOUR = 60 * 60 * 1000;

/**
 * Xóa file an toàn với retry
 */
async function safeDelete(filePath, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 300 * i));
      }
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'EPERM' && i < maxRetries - 1) {
        continue;
      }
      return false;
    }
  }
  return false;
}

/**
 * Dọn dẹp thư mục
 */
async function cleanupDirectory(dirPath, olderThan = ONE_HOUR) {
  try {
    if (!fsSync.existsSync(dirPath)) {
      console.log(`⚠️  Directory not found: ${dirPath}`);
      return { deleted: 0, failed: 0 };
    }

    const files = await fs.readdir(dirPath);
    const now = Date.now();
    let deleted = 0;
    let failed = 0;

    console.log(`\n📂 Cleaning ${dirPath}...`);
    console.log(`   Found ${files.length} files`);

    for (const file of files) {
      const filePath = path.join(dirPath, file);

      try {
        const stats = await fs.stat(filePath);

        // Skip directories
        if (stats.isDirectory()) {
          continue;
        }

        const age = now - stats.mtimeMs;
        const ageMinutes = Math.round(age / 60000);

        if (age > olderThan) {
          const success = await safeDelete(filePath);
          if (success) {
            console.log(`   ✅ Deleted: ${file} (${ageMinutes} minutes old)`);
            deleted++;
          } else {
            console.log(`   ❌ Failed: ${file} (locked)`);
            failed++;
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Error processing ${file}: ${error.message}`);
        failed++;
      }
    }

    return { deleted, failed };
  } catch (error) {
    console.error(`❌ Error cleaning directory ${dirPath}:`, error);
    return { deleted: 0, failed: 0 };
  }
}

/**
 * Main cleanup
 */
async function main() {
  console.log('🧹 Starting cleanup...');
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log(`📁 Upload dir: ${UPLOAD_DIR}`);
  console.log(`📁 Temp dir: ${TEMP_DIR}`);

  // Cleanup uploads (prescription files)
  const uploadResult = await cleanupDirectory(UPLOAD_DIR, ONE_HOUR);
  console.log(`\n📊 Upload cleanup: ${uploadResult.deleted} deleted, ${uploadResult.failed} failed`);

  // Cleanup temp (preprocessed images)
  const tempResult = await cleanupDirectory(TEMP_DIR, ONE_HOUR);
  console.log(`📊 Temp cleanup: ${tempResult.deleted} deleted, ${tempResult.failed} failed`);

  const total = uploadResult.deleted + tempResult.deleted;
  const totalFailed = uploadResult.failed + tempResult.failed;

  console.log(`\n✅ Cleanup completed!`);
  console.log(`   Total deleted: ${total}`);
  console.log(`   Total failed: ${totalFailed}`);
}

// Run cleanup
main().catch(error => {
  console.error('❌ Cleanup error:', error);
  process.exit(1);
});
