require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const ocrService = require('./services/ocr-service');

async function testOCR() {
  console.log('🧪 Bắt đầu test OCR Service...\n');

  // Test với text mẫu (thay vì ảnh thật)
  const sampleText = `
ĐƠN THUỐC
Bệnh viện Chợ Rẫy
Ngày: 29/12/2024

Bác sĩ: BS. Nguyễn Văn A
Bệnh nhân: Nguyễn Thị B

Đơn thuốc:
1. Paracetamol 500mg
   - Liều dùng: 1 viên x 3 lần/ngày
   - Thời gian: Sáng, trưa, tối sau ăn
   - Thời hạn: 7 ngày

2. Amoxicillin 500mg
   - Liều dùng: 1 viên x 2 lần/ngày
   - Thời gian: Sáng, tối trước ăn
   - Thời hạn: 5 ngày

Lịch tái khám:
Ngày: 05/01/2025
Giờ: 14:00
Phòng khám: Khoa Nội - Tầng 3
  `;

  try {
    console.log('📝 Text mẫu:');
    console.log(sampleText);
    console.log('\n🤖 Đang phân tích bằng AI...\n');

    const result = await ocrService.analyzeTextWithAI(sampleText);

    if (result.success) {
      console.log('✅ Phân tích thành công!\n');
      console.log('📊 Kết quả:');
      console.log(JSON.stringify(result.data, null, 2));

      // Kiểm tra các trường quan trọng
      console.log('\n🔍 Kiểm tra dữ liệu:');
      
      if (result.data.medications && result.data.medications.length > 0) {
        console.log(`✅ Tìm thấy ${result.data.medications.length} loại thuốc`);
        result.data.medications.forEach((med, i) => {
          console.log(`   ${i + 1}. ${med.name} - ${med.dosage} - ${med.frequency}`);
        });
      } else {
        console.log('⚠️  Không tìm thấy thông tin thuốc');
      }

      if (result.data.appointments && result.data.appointments.length > 0) {
        console.log(`✅ Tìm thấy ${result.data.appointments.length} lịch khám`);
        result.data.appointments.forEach((apt, i) => {
          console.log(`   ${i + 1}. ${apt.date} ${apt.time} - ${apt.location}`);
        });
      } else {
        console.log('⚠️  Không tìm thấy lịch khám');
      }

    } else {
      console.error('❌ Phân tích thất bại:', result.error);
    }

  } catch (error) {
    console.error('❌ Lỗi test:', error);
  }
}

// Test với ảnh thật (nếu có)
async function testOCRWithImage(imagePath) {
  console.log(`\n🖼️  Test với ảnh: ${imagePath}\n`);

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const result = await ocrService.processImage(imageBuffer);

    if (result.success) {
      console.log('✅ OCR thành công!\n');
      console.log('📝 Text trích xuất:');
      console.log(result.extractedText);
      console.log(`\n🎯 Độ chính xác: ${Math.round(result.confidence)}%\n`);
      
      if (result.analysis) {
        console.log('📊 Phân tích:');
        console.log(JSON.stringify(result.analysis, null, 2));
      }
    } else {
      console.error('❌ OCR thất bại:', result.error);
    }
  } catch (error) {
    console.error('❌ Lỗi đọc ảnh:', error.message);
  }
}

// Chạy test
console.log('🚀 OCR Service Test\n');
console.log('='.repeat(50));

testOCR().then(() => {
  console.log('\n' + '='.repeat(50));
  console.log('\n💡 Để test với ảnh thật:');
  console.log('   node test-ocr.js <đường-dẫn-ảnh>');
  console.log('\nVí dụ:');
  console.log('   node test-ocr.js ./data/prescription.jpg');
  
  // Nếu có tham số đường dẫn ảnh
  if (process.argv[2]) {
    testOCRWithImage(process.argv[2]);
  }
});
