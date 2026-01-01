require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const hybridParser = require('./services/hybrid-parser-service');
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

async function testHybridParser(pdfPath, mode = 'auto') {
  console.log('🚀 Hybrid Parser Test\n');
  console.log('='.repeat(70));
  console.log(`\n📄 File: ${pdfPath}`);
  console.log(`🔧 Mode: ${mode}\n`);

  try {
    // Đọc PDF
    console.log('📝 Đọc PDF...\n');
    const pdfData = await extractTextFromPDF(pdfPath);
    console.log(`✅ Đọc thành công: ${pdfData.numPages} trang, ${pdfData.text.length} ký tự\n`);
    console.log('='.repeat(70));
    
    // Phân tích bằng Hybrid Parser
    let result;
    
    switch (mode) {
      case 'local':
        console.log('\n🔧 Mode: LOCAL ONLY (không gọi AI)\n');
        result = await hybridParser.parseLocalOnly(pdfData.text);
        break;
        
      case 'ai':
        console.log('\n🔧 Mode: AI ONLY (bỏ qua local)\n');
        result = await hybridParser.parseAIOnly(pdfData.text);
        break;
        
      default:
        console.log('\n🔧 Mode: AUTO (thử local trước, fallback AI)\n');
        result = await hybridParser.parse(pdfData.text);
    }
    
    console.log('='.repeat(70));
    
    if (result.success) {
      console.log('\n✅ PHÂN TÍCH THÀNH CÔNG!\n');
      console.log('='.repeat(70));
      
      const data = result.data;
      
      // Thông tin method
      console.log(`\n📊 METHOD: ${result.method.toUpperCase()}`);
      console.log(`⏱️  Tổng thời gian: ${result.totalTime}ms`);
      
      // Thuốc
      if (data.medications && data.medications.length > 0) {
        console.log(`\n💊 THUỐC (${data.medications.length} loại):`);
        console.log('-'.repeat(70));
        
        const displayCount = Math.min(10, data.medications.length);
        for (let i = 0; i < displayCount; i++) {
          const med = data.medications[i];
          console.log(`\n${i + 1}. ${med.name || 'N/A'}`);
          if (med.dosage) console.log(`   📦 Liều lượng: ${med.dosage}`);
          if (med.frequency) console.log(`   ⏰ Tần suất: ${med.frequency}`);
          if (med.timing && med.timing.length > 0) {
            console.log(`   🕐 Thời gian: ${med.timing.join(', ')}`);
          }
          if (med.duration) console.log(`   📅 Thời hạn: ${med.duration}`);
        }
        
        if (data.medications.length > displayCount) {
          console.log(`\n... và ${data.medications.length - displayCount} loại thuốc khác`);
        }
      } else {
        console.log('\n⚠️  Không tìm thấy thông tin thuốc');
      }
      
      // Lịch khám
      if (data.appointments && data.appointments.length > 0) {
        console.log(`\n\n📅 LỊCH TÁI KHÁM (${data.appointments.length}):`);
        console.log('-'.repeat(70));
        data.appointments.forEach((apt, i) => {
          console.log(`\n${i + 1}. ${apt.date || 'N/A'} ${apt.time || ''}`);
          if (apt.location) console.log(`   📍 Địa điểm: ${apt.location}`);
          if (apt.doctor) console.log(`   👨‍⚕️ Bác sĩ: ${apt.doctor}`);
        });
      }
      
      // Lời dặn
      if (data.instructions && data.instructions.length > 0) {
        console.log(`\n\n📝 LỜI DẶN (${data.instructions.length}):`);
        console.log('-'.repeat(70));
        data.instructions.forEach((inst, i) => {
          const preview = typeof inst === 'string' ? inst.substring(0, 100) : JSON.stringify(inst).substring(0, 100);
          console.log(`${i + 1}. ${preview}${inst.length > 100 ? '...' : ''}`);
        });
      }
      
      // Tóm tắt
      if (data.summary) {
        console.log('\n\n📋 TÓM TẮT:');
        console.log('-'.repeat(70));
        console.log(data.summary.substring(0, 300));
      }
      
      // So sánh local vs AI (nếu có)
      if (result.localResult && result.method === 'ai') {
        console.log('\n\n📊 SO SÁNH LOCAL vs AI:');
        console.log('-'.repeat(70));
        console.log(`Local: ${result.localResult.medications?.length || 0} thuốc`);
        console.log(`AI: ${data.medications?.length || 0} thuốc`);
        console.log(`Cải thiện: +${(data.medications?.length || 0) - (result.localResult.medications?.length || 0)} thuốc`);
      }
      
      // Lưu kết quả
      const outputPath = './hybrid-parser-result.json';
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
const mode = process.argv[3] || 'auto'; // auto, local, ai

if (!pdfPath) {
  console.log('💡 Cách sử dụng:');
  console.log('   node test-hybrid-parser.js <đường-dẫn-pdf> [mode]');
  console.log('\nMode:');
  console.log('   auto   - Thử local trước, fallback AI (mặc định)');
  console.log('   local  - Chỉ dùng local parser');
  console.log('   ai     - Chỉ dùng AI API');
  console.log('\nVí dụ:');
  console.log('   node test-hybrid-parser.js "C:\\path\\to\\file.pdf"');
  console.log('   node test-hybrid-parser.js "C:\\path\\to\\file.pdf" local');
  console.log('   node test-hybrid-parser.js "C:\\path\\to\\file.pdf" ai\n');
  process.exit(1);
}

testHybridParser(pdfPath, mode);
