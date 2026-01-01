/**
 * Test Image OCR - Phiên bản nâng cao
 */

const imageOCRService = require('./services/image-ocr-service');
const path = require('path');
const fs = require('fs');

async function testAdvancedOCR() {
  console.log('🧪 TEST IMAGE OCR - PHIÊN BẢN NÂNG CAO\n');
  console.log('='.repeat(60));
  
  // Tìm file ảnh mới nhất
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
    console.log('❌ Không tìm thấy file ảnh nào!');
    return;
  }
  
  const latestFile = files[0];
  console.log(`\n📸 File ảnh: ${latestFile.name}`);
  console.log(`   Thời gian: ${new Date(latestFile.time).toLocaleString()}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 BẮT ĐẦU XỬ LÝ...\n');
  
  try {
    const result = await imageOCRService.processImage(latestFile.path);
    
    if (!result.success) {
      console.log('❌ Lỗi:', result.error);
      return;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 KẾT QUẢ:\n');
    
    console.log(`✅ Confidence: ${result.data.confidence.toFixed(2)}%`);
    console.log(`✅ Số thuốc: ${result.data.medications.length}`);
    console.log(`✅ Số lịch khám: ${result.data.appointments.length}`);
    console.log(`✅ Số lời dặn: ${result.data.instructions.length}`);
    
    // Hiển thị thuốc
    if (result.data.medications.length > 0) {
      console.log('\n💊 DANH SÁCH THUỐC:');
      console.log('='.repeat(60));
      result.data.medications.forEach((med, idx) => {
        console.log(`\n${idx + 1}. ${med.name}`);
        if (med.dosage) console.log(`   Liều lượng: ${med.dosage}`);
        if (med.quantity && med.unit) console.log(`   Số lượng: ${med.quantity} ${med.unit}`);
        if (med.frequency) console.log(`   Tần suất: ${med.frequency}`);
        if (med.timing && med.timing.length > 0) console.log(`   Thời gian: ${med.timing.join(', ')}`);
        if (med.duration) console.log(`   Thời hạn: ${med.duration}`);
        if (med.instructions) console.log(`   Hướng dẫn: ${med.instructions}`);
      });
    } else {
      console.log('\n⚠️  Không tìm thấy thuốc nào!');
    }
    
    // Hiển thị lịch khám
    if (result.data.appointments.length > 0) {
      console.log('\n📅 LỊCH KHÁM:');
      console.log('='.repeat(60));
      result.data.appointments.forEach((apt, idx) => {
        console.log(`\n${idx + 1}. ${apt.type}`);
        if (apt.date) console.log(`   Ngày: ${apt.date}`);
        if (apt.time) console.log(`   Giờ: ${apt.time}`);
        if (apt.notes) console.log(`   Ghi chú: ${apt.notes}`);
      });
    }
    
    // Hiển thị lời dặn
    if (result.data.instructions.length > 0) {
      console.log('\n📝 LỜI DẶN:');
      console.log('='.repeat(60));
      result.data.instructions.forEach((inst, idx) => {
        console.log(`${idx + 1}. ${inst}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST HOÀN TẤT!\n');
    
    // Cleanup
    await imageOCRService.cleanup();
    
  } catch (error) {
    console.error('\n❌ LỖI:', error);
    await imageOCRService.cleanup();
  }
}

// Chạy test
testAdvancedOCR();
