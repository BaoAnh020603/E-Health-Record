require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const ocrService = require('./services/ocr-service');

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

async function testPDF(pdfPath) {
  console.log('🚀 PDF OCR Test\n');
  console.log('='.repeat(50));
  console.log(`\n📄 Đang xử lý PDF: ${pdfPath}\n`);

  try {
    console.log('📝 Đang trích xuất text từ PDF...\n');
    
    const pdfData = await extractTextFromPDF(pdfPath);
    
    console.log('✅ Trích xuất text thành công!\n');
    console.log('📄 Text từ PDF:');
    console.log('-'.repeat(50));
    console.log(pdfData.text);
    console.log('-'.repeat(50));
    console.log(`\n📊 Số trang: ${pdfData.numPages}`);
    console.log(`📊 Số ký tự: ${pdfData.text.length}\n`);

    // Phân tích text bằng AI
    console.log('🤖 Đang phân tích bằng AI...\n');
    
    // Rút gọn text nếu quá dài (chỉ lấy 5000 ký tự đầu)
    let textToAnalyze = pdfData.text;
    if (textToAnalyze.length > 5000) {
      console.log(`⚠️  Text quá dài (${textToAnalyze.length} ký tự), rút gọn xuống 5000 ký tự\n`);
      textToAnalyze = textToAnalyze.substring(0, 5000);
    }
    
    const result = await ocrService.analyzeTextWithAI(textToAnalyze);

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
          if (med.timing) {
            console.log(`      Thời gian: ${med.timing.join(', ')}`);
          }
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

      if (result.data.summary) {
        console.log(`\n📋 Tóm tắt:\n${result.data.summary}`);
      }

    } else {
      console.error('❌ Phân tích thất bại:', result.error);
    }

  } catch (error) {
    console.error('❌ Lỗi xử lý PDF:', error.message);
    
    if (error.message.includes('ENOENT')) {
      console.log('\n💡 File không tồn tại. Hãy kiểm tra đường dẫn.');
      console.log('   Ví dụ: node test-ocr-pdf.js ./DonThuoc_25.007367.pdf');
    }
  }

  console.log('\n' + '='.repeat(50));
}

// Lấy đường dẫn PDF từ command line
const pdfPath = process.argv[2];

if (!pdfPath) {
  console.log('❌ Thiếu đường dẫn file PDF\n');
  console.log('Cách sử dụng:');
  console.log('  node test-ocr-pdf.js <đường-dẫn-file-pdf>\n');
  console.log('Ví dụ:');
  console.log('  node test-ocr-pdf.js ./DonThuoc_25.007367.pdf');
  console.log('  node test-ocr-pdf.js "C:/Users/Admin/Downloads/DonThuoc_25.007367.pdf"');
  process.exit(1);
}

// Chạy test
testPDF(pdfPath);
