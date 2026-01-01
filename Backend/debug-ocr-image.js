/**
 * Debug OCR - Xem Tesseract đọc được gì từ ảnh
 */

const imageOCRService = require('./services/image-ocr-service');
const path = require('path');
const fs = require('fs');

async function debugOCR() {
  console.log('🔍 DEBUG OCR IMAGE\n');
  console.log('='.repeat(60));
  
  // Tìm file ảnh mới nhất trong uploads
  const uploadsDir = path.join(__dirname, 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ Thư mục uploads không tồn tại!');
    return;
  }
  
  const files = fs.readdirSync(uploadsDir)
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
    .map(f => ({
      name: f,
      path: path.join(uploadsDir, f),
      time: fs.statSync(path.join(uploadsDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  if (files.length === 0) {
    console.log('❌ Không tìm thấy file ảnh nào trong uploads!');
    console.log('   Vui lòng upload ảnh từ app trước.');
    return;
  }
  
  const latestFile = files[0];
  console.log(`\n📸 File ảnh mới nhất: ${latestFile.name}`);
  console.log(`   Path: ${latestFile.path}`);
  console.log(`   Thời gian: ${new Date(latestFile.time).toLocaleString()}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 BẮT ĐẦU OCR...\n');
  
  try {
    // Chỉ chạy OCR, không parse
    const ocrResult = await imageOCRService.recognizeImage(latestFile.path);
    
    if (!ocrResult.success) {
      console.log('❌ OCR thất bại:', ocrResult.error);
      return;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 KẾT QUẢ OCR:\n');
    
    console.log(`✅ Confidence: ${ocrResult.confidence.toFixed(2)}%`);
    console.log(`✅ Rotation: ${ocrResult.rotateRadians || 0} radians`);
    
    // Hiển thị text đầy đủ
    console.log('\n📄 RAW TEXT (TOÀN BỘ):');
    console.log('='.repeat(60));
    console.log(ocrResult.text);
    console.log('='.repeat(60));
    
    // Phân tích text
    const lines = ocrResult.text.split('\n').filter(l => l.trim());
    console.log(`\n📊 THỐNG KÊ:`);
    console.log(`   • Tổng số dòng: ${lines.length}`);
    console.log(`   • Tổng số ký tự: ${ocrResult.text.length}`);
    
    // Hiển thị từng dòng
    console.log('\n📝 TỪNG DÒNG TEXT:');
    console.log('='.repeat(60));
    lines.forEach((line, idx) => {
      console.log(`${(idx + 1).toString().padStart(3, ' ')}. "${line}"`);
    });
    console.log('='.repeat(60));
    
    // Tìm số thứ tự
    console.log('\n🔍 TÌM SỐ THỨ TỰ THUỐC:');
    const numberPattern = /^(\d+)\s*\.?\s*/;
    let foundNumbers = 0;
    lines.forEach((line, idx) => {
      const match = line.match(numberPattern);
      if (match) {
        foundNumbers++;
        console.log(`   ✅ Dòng ${idx + 1}: Tìm thấy số ${match[1]}`);
      }
    });
    
    if (foundNumbers === 0) {
      console.log('   ❌ KHÔNG TÌM THẤY SỐ THỨ TỰ NÀO!');
      console.log('   → Đây là lý do không phân tích được thuốc');
    } else {
      console.log(`   ✅ Tìm thấy ${foundNumbers} số thứ tự`);
    }
    
    // Tìm tên thuốc (chữ hoa)
    console.log('\n🔍 TÌM TÊN THUỐC (CHỮ HOA):');
    const namePattern = /\b([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]+)*)\b/g;
    let foundNames = 0;
    lines.forEach((line, idx) => {
      const matches = [...line.matchAll(namePattern)];
      if (matches.length > 0) {
        matches.forEach(match => {
          foundNames++;
          console.log(`   ✅ Dòng ${idx + 1}: "${match[1]}"`);
        });
      }
    });
    
    if (foundNames === 0) {
      console.log('   ❌ KHÔNG TÌM THẤY TÊN THUỐC NÀO!');
    } else {
      console.log(`   ✅ Tìm thấy ${foundNames} tên có thể là thuốc`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DEBUG HOÀN TẤT!\n');
    
    // Gợi ý
    console.log('💡 GỢI Ý:');
    if (lines.length < 10) {
      console.log('   ⚠️  Text quá ít (< 10 dòng)');
      console.log('   → Ảnh có thể bị crop hoặc Tesseract không đọc được');
      console.log('   → Thử chụp lại với ánh sáng tốt hơn');
    }
    if (foundNumbers === 0) {
      console.log('   ⚠️  Không có số thứ tự thuốc');
      console.log('   → Đảm bảo chụp phần danh sách thuốc (có 1., 2., 3., ...)');
    }
    if (foundNames === 0) {
      console.log('   ⚠️  Không có tên thuốc (chữ hoa)');
      console.log('   → Tesseract không đọc được chữ');
      console.log('   → Thử tăng độ sáng hoặc chụp rõ hơn');
    }
    if (ocrResult.confidence < 70) {
      console.log('   ⚠️  Confidence thấp (< 70%)');
      console.log('   → Ảnh có thể mờ, nghiêng hoặc chất lượng kém');
    }
    
    // Cleanup
    await imageOCRService.cleanup();
    
  } catch (error) {
    console.error('\n❌ LỖI:', error);
    await imageOCRService.cleanup();
  }
}

// Chạy debug
debugOCR();
