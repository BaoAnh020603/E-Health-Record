require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const smartFilter = require('./services/smart-filter-service');
const ocrService = require('./services/ocr-service');
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

async function testSmartFilter(pdfPath) {
  console.log('🚀 Smart Filter + Gemini AI Test\n');
  console.log('='.repeat(70));
  console.log(`\n📄 File: ${pdfPath}\n`);

  try {
    // Bước 1: Đọc PDF
    console.log('📝 Bước 1: Đọc PDF...\n');
    const pdfData = await extractTextFromPDF(pdfPath);
    console.log(`✅ Đọc thành công: ${pdfData.numPages} trang, ${pdfData.text.length} ký tự\n`);
    
    // Bước 2: Lọc thông tin bằng Smart Filter (local, không cần API)
    console.log('🔍 Bước 2: Lọc thông tin quan trọng (local)...');
    const filterResult = smartFilter.process(pdfData.text);
    
    console.log('\n📄 Text đã lọc:');
    console.log('-'.repeat(70));
    console.log(filterResult.filteredText.substring(0, 2000));
    if (filterResult.filteredText.length > 2000) {
      console.log(`\n... (còn ${filterResult.filteredText.length - 2000} ký tự nữa)`);
    }
    console.log('-'.repeat(70));
    
    // Bước 3: Phân tích bằng Gemini AI
    console.log('\n🤖 Bước 3: Phân tích bằng Gemini AI...\n');
    const aiResult = await ocrService.analyzeTextWithAI(filterResult.filteredText);
    
    if (aiResult.success) {
      console.log('\n✅ PHÂN TÍCH THÀNH CÔNG!\n');
      console.log('='.repeat(70));
      
      const data = aiResult.data;
      
      // Thuốc
      if (data.medications && data.medications.length > 0) {
        console.log(`\n💊 THUỐC (${data.medications.length} loại):`);
        console.log('-'.repeat(70));
        data.medications.forEach((med, i) => {
          console.log(`\n${i + 1}. ${med.name}`);
          console.log(`   📦 Liều lượng: ${med.dosage || 'N/A'}`);
          console.log(`   ⏰ Tần suất: ${med.frequency || 'N/A'}`);
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
        console.log('-'.repeat(70));
        data.appointments.forEach((apt, i) => {
          console.log(`\n${i + 1}. ${apt.date || 'N/A'} ${apt.time || ''}`);
          if (apt.location) {
            console.log(`   📍 Địa điểm: ${apt.location}`);
          }
          if (apt.doctor) {
            console.log(`   👨‍⚕️ Bác sĩ: ${apt.doctor}`);
          }
          if (apt.notes) {
            console.log(`   📝 Ghi chú: ${apt.notes}`);
          }
        });
      } else {
        console.log('\n⚠️  Không tìm thấy lịch tái khám');
      }
      
      // Tóm tắt
      if (data.summary) {
        console.log('\n\n📋 TÓM TẮT:');
        console.log('-'.repeat(70));
        console.log(data.summary);
      }
      
      // Thống kê tổng hợp
      console.log('\n\n📊 THỐNG KÊ TỔNG HỢP:');
      console.log('-'.repeat(70));
      console.log(`Text gốc: ${filterResult.stats.originalLength} ký tự`);
      console.log(`Text đã lọc: ${filterResult.stats.filteredLength} ký tự`);
      console.log(`Giảm: ${filterResult.stats.reductionRate}%`);
      console.log(`\nPhân loại:`);
      console.log(`  💊 Thuốc: ${filterResult.stats.medication} dòng`);
      console.log(`  📅 Lịch khám: ${filterResult.stats.appointment} dòng`);
      console.log(`  📝 Lời dặn: ${filterResult.stats.instruction} dòng`);
      console.log(`  🏥 Chẩn đoán: ${filterResult.stats.diagnosis} dòng`);
      
    } else {
      console.error('\n❌ PHÂN TÍCH THẤT BẠI:', aiResult.error);
    }

  } catch (error) {
    console.error('\n❌ LỖI:', error.message);
    console.error(error.stack);
  }

  console.log('\n' + '='.repeat(70));
}

// Chạy test
const pdfPath = process.argv[2];

if (!pdfPath) {
  console.log('💡 Cách sử dụng:');
  console.log('   node test-smart-filter.js <đường-dẫn-pdf>');
  console.log('\nVí dụ:');
  console.log('   node test-smart-filter.js ./DonThuoc.pdf\n');
  process.exit(1);
}

testSmartFilter(pdfPath);
