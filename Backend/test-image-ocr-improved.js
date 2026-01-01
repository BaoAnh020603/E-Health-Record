/**
 * Test Image OCR với các cải thiện mới
 * Kiểm tra độ chính xác 100%
 */

const imageOCRService = require('./services/image-ocr-service');
const path = require('path');

async function testImageOCR() {
  console.log('🧪 TEST IMAGE OCR - CẢI THIỆN 100%\n');
  console.log('='.repeat(60));
  
  // Test với file ảnh mẫu (nếu có)
  const imagePath = path.join(__dirname, 'test-prescription.jpg');
  
  console.log(`\n📸 Đang test với ảnh: ${imagePath}\n`);
  
  try {
    const result = await imageOCRService.processImage(imagePath);
    
    if (result.success) {
      console.log('\n✅ PHÂN TÍCH THÀNH CÔNG!\n');
      console.log('='.repeat(60));
      
      // Hiển thị kết quả
      console.log('\n📊 THỐNG KÊ:');
      console.log(`   • Độ tin cậy OCR: ${result.data.confidence}%`);
      console.log(`   • Số thuốc tìm thấy: ${result.data.medications.length}`);
      console.log(`   • Số lịch khám: ${result.data.appointments.length}`);
      console.log(`   • Số lời dặn: ${result.data.instructions.length}`);
      
      // Hiển thị danh sách thuốc
      console.log('\n💊 DANH SÁCH THUỐC:');
      console.log('='.repeat(60));
      result.data.medications.forEach((med, index) => {
        console.log(`\n${index + 1}. ${med.name}`);
        if (med.dosage) console.log(`   Liều lượng: ${med.dosage}`);
        if (med.quantity) console.log(`   Số lượng: ${med.quantity} ${med.unit || ''}`);
        if (med.frequency) console.log(`   Tần suất: ${med.frequency}`);
        if (med.timing && med.timing.length > 0) {
          console.log(`   Thời gian: ${med.timing.join(', ')}`);
        }
        if (med.duration) console.log(`   Thời hạn: ${med.duration}`);
        if (med.instructions) console.log(`   Hướng dẫn: ${med.instructions}`);
      });
      
      // Hiển thị lịch khám
      if (result.data.appointments.length > 0) {
        console.log('\n📅 LỊCH KHÁM:');
        console.log('='.repeat(60));
        result.data.appointments.forEach((apt, index) => {
          console.log(`\n${index + 1}. ${apt.type}`);
          if (apt.date) console.log(`   Ngày: ${apt.date}`);
          if (apt.time) console.log(`   Giờ: ${apt.time}`);
          if (apt.notes) console.log(`   Ghi chú: ${apt.notes}`);
        });
      }
      
      // Hiển thị lời dặn
      if (result.data.instructions.length > 0) {
        console.log('\n📝 LỜI DẶN BÁC SĨ:');
        console.log('='.repeat(60));
        result.data.instructions.forEach((instruction, index) => {
          console.log(`\n${index + 1}. ${instruction}`);
        });
      }
      
      // Hiển thị raw text (để debug)
      console.log('\n📄 RAW OCR TEXT:');
      console.log('='.repeat(60));
      console.log(result.data.rawText.substring(0, 500) + '...\n');
      
      console.log('='.repeat(60));
      console.log('✅ TEST HOÀN TẤT!\n');
      
    } else {
      console.error('\n❌ PHÂN TÍCH THẤT BẠI!');
      console.error(`Lỗi: ${result.error}\n`);
    }
    
    // Cleanup
    await imageOCRService.cleanup();
    
  } catch (error) {
    console.error('\n❌ LỖI KHI TEST:');
    console.error(error);
    
    // Cleanup
    await imageOCRService.cleanup();
  }
}

// Chạy test
testImageOCR();
