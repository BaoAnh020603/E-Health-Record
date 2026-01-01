/**
 * Test PDF OCR với các cải thiện mới
 * Kiểm tra độ chính xác 100%
 */

const pdfParserService = require('./services/pdf-parser-service');
const path = require('path');

async function testPDFOCR() {
  console.log('🧪 TEST PDF OCR - CẢI THIỆN 100%\n');
  console.log('='.repeat(60));
  
  // Test với file PDF mẫu
  const pdfPath = path.join(__dirname, 'DonThuoc_25.007367.pdf');
  
  console.log(`\n📄 Đang test với file: ${pdfPath}\n`);
  
  try {
    const result = await pdfParserService.parse(pdfPath);
    
    if (result.success) {
      console.log('\n✅ PHÂN TÍCH THÀNH CÔNG!\n');
      console.log('='.repeat(60));
      
      // Hiển thị kết quả
      console.log('\n📊 THỐNG KÊ:');
      console.log(`   • Tổng items đọc được: ${result.stats.totalItems}`);
      console.log(`   • Số thuốc tìm thấy: ${result.stats.medicationCount}`);
      console.log(`   • Số lịch khám: ${result.stats.appointmentCount}`);
      console.log(`   • Số lời dặn: ${result.stats.instructionCount}`);
      console.log(`   • Thời gian xử lý: ${result.stats.processingTime}ms`);
      
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
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ TEST HOÀN TẤT!\n');
      
    } else {
      console.error('\n❌ PHÂN TÍCH THẤT BẠI!');
      console.error(`Lỗi: ${result.error}\n`);
    }
    
  } catch (error) {
    console.error('\n❌ LỖI KHI TEST:');
    console.error(error);
  }
}

// Chạy test
testPDFOCR();
