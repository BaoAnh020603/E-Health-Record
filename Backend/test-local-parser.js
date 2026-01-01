require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const localParser = require('./services/local-parser-service');
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

async function testLocalParser(pdfPath) {
  console.log('🚀 Local Parser Test (NO API CALLS)\n');
  console.log('='.repeat(70));
  console.log(`\n📄 File: ${pdfPath}\n`);

  try {
    // Bước 1: Đọc PDF
    console.log('📝 Bước 1: Đọc PDF...\n');
    const pdfData = await extractTextFromPDF(pdfPath);
    console.log(`✅ Đọc thành công: ${pdfData.numPages} trang, ${pdfData.text.length} ký tự\n`);
    
    // Bước 2: Phân tích bằng Local Parser (hoàn toàn local, không gọi API)
    console.log('🔍 Bước 2: Phân tích bằng Local Parser (100% offline)...\n');
    const result = localParser.parse(pdfData.text);
    
    if (result.success) {
      console.log('\n✅ PHÂN TÍCH THÀNH CÔNG!\n');
      console.log('='.repeat(70));
      
      const data = result.data;
      
      // Thuốc
      if (data.medications && data.medications.length > 0) {
        console.log(`\n💊 THUỐC (${data.medications.length} loại):`);
        console.log('-'.repeat(70));
        
        // Hiển thị 20 thuốc đầu tiên
        const displayCount = Math.min(20, data.medications.length);
        for (let i = 0; i < displayCount; i++) {
          const med = data.medications[i];
          console.log(`\n${i + 1}. ${med.name || 'N/A'}`);
          if (med.dosage) console.log(`   📦 Liều lượng: ${med.dosage}`);
          if (med.frequency) console.log(`   ⏰ Tần suất: ${med.frequency}`);
          if (med.timing && med.timing.length > 0) {
            console.log(`   🕐 Thời gian: ${med.timing.join(', ')}`);
          }
          if (med.duration) console.log(`   📅 Thời hạn: ${med.duration}`);
          if (med.instructions) console.log(`   📝 Hướng dẫn: ${med.instructions}`);
        }
        
        if (data.medications.length > displayCount) {
          console.log(`\n... và ${data.medications.length - displayCount} loại thuốc khác`);
        }
      } else {
        console.log('\n⚠️  Không tìm thấy thông tin thuốc');
      }
      
      // Lịch tái khám
      if (data.appointments && data.appointments.length > 0) {
        console.log(`\n\n📅 LỊCH TÁI KHÁM (${data.appointments.length}):`);
        console.log('-'.repeat(70));
        data.appointments.forEach((apt, i) => {
          console.log(`\n${i + 1}. ${apt.date || 'N/A'} ${apt.time || ''}`);
          if (apt.location) console.log(`   📍 Địa điểm: ${apt.location}`);
          if (apt.doctor) console.log(`   👨‍⚕️ Bác sĩ: ${apt.doctor}`);
          if (apt.notes) console.log(`   📝 Ghi chú: ${apt.notes.substring(0, 100)}`);
        });
      } else {
        console.log('\n⚠️  Không tìm thấy lịch tái khám');
      }
      
      // Lời dặn
      if (data.instructions && data.instructions.length > 0) {
        console.log(`\n\n📝 LỜI DẶN BÁC SĨ (${data.instructions.length}):`);
        console.log('-'.repeat(70));
        data.instructions.forEach((inst, i) => {
          console.log(`\n${i + 1}. ${inst.substring(0, 200)}`);
          if (inst.length > 200) console.log('   ...');
        });
      } else {
        console.log('\n⚠️  Không tìm thấy lời dặn');
      }
      
      // Tóm tắt
      if (data.summary) {
        console.log('\n\n📋 TÓM TẮT:');
        console.log('-'.repeat(70));
        console.log(data.summary);
      }
      
      // Thống kê
      console.log('\n\n📊 THỐNG KÊ:');
      console.log('-'.repeat(70));
      console.log(`⏱️  Thời gian xử lý: ${result.stats.processingTime}ms`);
      console.log(`💊 Thuốc: ${result.stats.medicationCount} loại`);
      console.log(`📅 Lịch khám: ${result.stats.appointmentCount}`);
      console.log(`📝 Lời dặn: ${result.stats.instructionCount}`);
      console.log(`📄 Text gốc: ${pdfData.text.length} ký tự`);
      
      // Lưu kết quả ra file JSON
      const outputPath = './local-parser-result.json';
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
      console.log(`\n💾 Đã lưu kết quả vào: ${outputPath}`);
      
    } else {
      console.error('\n❌ PHÂN TÍCH THẤT BẠI:', result.error);
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
  console.log('   node test-local-parser.js <đường-dẫn-pdf>');
  console.log('\nVí dụ:');
  console.log('   node test-local-parser.js "C:\\Users\\ADMIN\\Desktop\\Downloads\\DonThuoc_25.007367.pdf"\n');
  process.exit(1);
}

testLocalParser(pdfPath);
