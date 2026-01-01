require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const deepseekOCR = require('./services/deepseek-ocr-service');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractTextFromPDF(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = new Uint8Array(dataBuffer);
  
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  
  let fullText = '';
  
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return {
    text: fullText,
    numPages: pdfDocument.numPages
  };
}

async function testDeepSeekOCR(pdfPath) {
  console.log('🚀 DeepSeek OCR Test\n');
  console.log('='.repeat(60));
  console.log(`\n📄 File: ${pdfPath}\n`);

  try {
    // Đọc PDF
    console.log('📝 Đang đọc PDF...\n');
    const pdfData = await extractTextFromPDF(pdfPath);
    
    console.log(`✅ Đọc thành công: ${pdfData.numPages} trang, ${pdfData.text.length} ký tự\n`);
    
    // Phân tích bằng DeepSeek
    console.log('🤖 Đang phân tích bằng DeepSeek AI...\n');
    const result = await deepseekOCR.processText(pdfData.text);

    if (result.success) {
      console.log('\n✅ PHÂN TÍCH THÀNH CÔNG!\n');
      console.log('='.repeat(60));
      
      // Hiển thị kết quả
      const data = result.data;
      
      // Thuốc
      if (data.medications && data.medications.length > 0) {
        console.log(`\n💊 THUỐC (${data.medications.length} loại):`);
        console.log('-'.repeat(60));
        data.medications.forEach((med, i) => {
          console.log(`\n${i + 1}. ${med.name}`);
          console.log(`   📦 Liều lượng: ${med.dosage}`);
          console.log(`   ⏰ Tần suất: ${med.frequency}`);
          if (med.timing && med.timing.length > 0) {
            console.log(`   🕐 Thời gian: ${med.timing.join(', ')}`);
          }
          if (med.duration) {
            console.log(`   📅 Thời hạn: ${med.duration}`);
          }
          if (med.instructions) {
            console.log(`   📝 Hướng dẫn: ${med.instructions}`);
          }
        });
      } else {
        console.log('\n⚠️  Không tìm thấy thông tin thuốc');
      }
      
      // Lịch tái khám
      if (data.appointments && data.appointments.length > 0) {
        console.log(`\n\n📅 LỊCH TÁI KHÁM (${data.appointments.length}):`);
        console.log('-'.repeat(60));
        data.appointments.forEach((apt, i) => {
          console.log(`\n${i + 1}. ${apt.date} ${apt.time || ''}`);
          if (apt.location) {
            console.log(`   📍 Địa điểm: ${apt.location}`);
          }
          if (apt.notes) {
            console.log(`   📝 Ghi chú: ${apt.notes}`);
          }
        });
      } else {
        console.log('\n⚠️  Không tìm thấy lịch tái khám');
      }
      
      // Lời dặn bác sĩ
      if (data.doctorInstructions) {
        console.log('\n\n👨‍⚕️ LỜI DẶN BÁC SĨ:');
        console.log('-'.repeat(60));
        console.log(data.doctorInstructions);
      }
      
      // Tóm tắt
      if (data.summary) {
        console.log('\n\n📋 TÓM TẮT:');
        console.log('-'.repeat(60));
        console.log(data.summary);
      }
      
      // Thống kê
      console.log('\n\n📊 THỐNG KÊ:');
      console.log('-'.repeat(60));
      console.log(`Text gốc: ${result.originalTextLength} ký tự`);
      console.log(`Text đã lọc: ${result.filteredTextLength} ký tự`);
      console.log(`Tỷ lệ lọc: ${Math.round((1 - result.filteredTextLength / result.originalTextLength) * 100)}%`);
      
    } else {
      console.error('\n❌ PHÂN TÍCH THẤT BẠI:', result.error);
      if (result.rawResponse) {
        console.log('\nResponse từ DeepSeek:');
        console.log(result.rawResponse);
      }
    }

  } catch (error) {
    console.error('\n❌ LỖI:', error.message);
  }

  console.log('\n' + '='.repeat(60));
}

// Test với text mẫu
async function testWithSampleText() {
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

Lời dặn:
- Uống thuốc đúng giờ
- Uống đủ liều, không tự ý ngưng thuốc
- Thay băng hàng ngày
- Cắt chỉ sau 7 ngày

Lịch tái khám:
Ngày: 05/01/2025
Giờ: 14:00
Phòng khám: Khoa Nội - Tầng 3
  `;

  console.log('🚀 DeepSeek OCR Test (Text mẫu)\n');
  console.log('='.repeat(60));
  
  const result = await deepseekOCR.processText(sampleText);
  
  if (result.success) {
    console.log('\n✅ THÀNH CÔNG!\n');
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.error('\n❌ THẤT BẠI:', result.error);
  }
  
  console.log('\n' + '='.repeat(60));
}

// Chạy test
const pdfPath = process.argv[2];

if (!pdfPath) {
  console.log('💡 Cách sử dụng:');
  console.log('   node test-deepseek-ocr.js <đường-dẫn-pdf>');
  console.log('\nVí dụ:');
  console.log('   node test-deepseek-ocr.js ./DonThuoc.pdf');
  console.log('\nHoặc test với text mẫu:');
  console.log('   node test-deepseek-ocr.js sample\n');
  process.exit(1);
}

if (pdfPath === 'sample') {
  testWithSampleText();
} else {
  testDeepSeekOCR(pdfPath);
}
