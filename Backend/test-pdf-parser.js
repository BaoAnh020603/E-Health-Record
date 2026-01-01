require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const pdfParser = require('./services/pdf-parser-service');

async function testPDFParser(pdfPath) {
  console.log('🚀 PDF Parser Test (Xử lý từng item)\n');
  console.log('='.repeat(70));
  console.log(`\n📄 File: ${pdfPath}\n`);

  try {
    // Parse PDF
    const result = await pdfParser.parse(pdfPath);
    
    console.log('='.repeat(70));
    
    if (result.success) {
      console.log('\n✅ PHÂN TÍCH THÀNH CÔNG!\n');
      console.log('='.repeat(70));
      
      const data = result.data;
      
      // Thống kê
      console.log(`\n📊 THỐNG KÊ:`);
      console.log(`   ⏱️  Thời gian: ${result.stats.processingTime}ms`);
      console.log(`   📄 Tổng items: ${result.stats.totalItems}`);
      console.log(`   💊 Thuốc: ${result.stats.medicationCount} loại`);
      console.log(`   📅 Lịch khám: ${result.stats.appointmentCount}`);
      console.log(`   📝 Lời dặn: ${result.stats.instructionCount}`);
      
      // Thuốc
      if (data.medications && data.medications.length > 0) {
        console.log(`\n\n💊 THUỐC (${data.medications.length} loại):`);
        console.log('-'.repeat(70));
        
        // Hiển thị tất cả thuốc
        data.medications.forEach((med, i) => {
          console.log(`\n${i + 1}. ${med.name || 'N/A'}`);
          if (med.dosage) console.log(`   📦 Liều lượng: ${med.dosage}`);
          if (med.frequency) console.log(`   ⏰ Tần suất: ${med.frequency}`);
          if (med.timing && med.timing.length > 0) {
            console.log(`   🕐 Thời gian: ${med.timing.join(', ')}`);
          }
          if (med.duration) console.log(`   📅 Thời hạn: ${med.duration}`);
          if (med.instructions) console.log(`   📝 Hướng dẫn: ${med.instructions}`);
        });
      } else {
        console.log('\n⚠️  Không tìm thấy thông tin thuốc');
      }
      
      // Lịch khám
      if (data.appointments && data.appointments.length > 0) {
        console.log(`\n\n📅 LỊCH TÁI KHÁM (${data.appointments.length}):`);
        console.log('-'.repeat(70));
        data.appointments.forEach((apt, i) => {
          console.log(`\n${i + 1}. ${apt.type || 'Tái khám'}`);
          if (apt.date) console.log(`   📆 Ngày: ${apt.date}`);
          if (apt.time) console.log(`   🕐 Giờ: ${apt.time}`);
          if (apt.notes) {
            console.log(`   📝 Ghi chú:`);
            // Tách thành từng câu (dựa vào dấu chấm)
            const sentences = apt.notes.split(/\.\s+/).filter(s => s.trim());
            sentences.forEach(sentence => {
              if (sentence.trim()) {
                console.log(`      - ${sentence.trim()}.`);
              }
            });
          }
        });
      } else {
        console.log('\n⚠️  Không tìm thấy lịch tái khám');
      }
      
      // Lời dặn
      if (data.instructions && data.instructions.length > 0) {
        console.log(`\n\n📝 LỜI DẶN BÁC SĨ (${data.instructions.length}):`);
        console.log('-'.repeat(70));
        data.instructions.forEach((inst, i) => {
          console.log(`\n${i + 1}. ${inst.substring(0, 300)}`);
          if (inst.length > 300) console.log('   ...');
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
      
      // Lưu kết quả
      const outputPath = './pdf-parser-result.json';
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
      console.log(`\n💾 Đã lưu kết quả vào: ${outputPath}`);
      
      // So sánh với local parser
      console.log('\n\n📊 SO SÁNH:');
      console.log('-'.repeat(70));
      console.log('PDF Parser (mới):  ' + result.stats.medicationCount + ' thuốc');
      console.log('Local Parser (cũ): 14 thuốc');
      console.log('Cải thiện:         +' + (result.stats.medicationCount - 14) + ' thuốc');
      
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
  console.log('   node test-pdf-parser.js <đường-dẫn-pdf>');
  console.log('\nVí dụ:');
  console.log('   node test-pdf-parser.js "C:\\Users\\ADMIN\\Desktop\\Downloads\\DonThuoc_25.007367.pdf"\n');
  process.exit(1);
}

testPDFParser(pdfPath);
