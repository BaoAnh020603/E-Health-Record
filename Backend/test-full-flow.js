/**
 * Test Full Flow: OCR → Duplicate Check → AI Reminders
 */

require('dotenv').config({ path: '.env.local' });
const pdfParserService = require('./services/pdf-parser-service');
const duplicateChecker = require('./services/duplicate-checker-service');
const reminderAI = require('./services/reminder-ai-service');
const fs = require('fs');

async function testFullFlow(pdfPath) {
  console.log('🚀 TEST FULL FLOW: OCR → DUPLICATE CHECK → AI REMINDERS\n');
  console.log('='.repeat(70));
  
  try {
    // ========================================
    // BƯỚC 1: OCR - Phân tích PDF
    // ========================================
    console.log('\n📄 BƯỚC 1: PHÂN TÍCH PDF (OCR)');
    console.log('='.repeat(70));
    
    const parseResult = await pdfParserService.parse(pdfPath);
    
    if (!parseResult.success) {
      console.error('❌ Lỗi phân tích PDF:', parseResult.error);
      return;
    }
    
    const data = parseResult.data;
    console.log(`✅ Phân tích thành công:`);
    console.log(`   💊 Thuốc: ${data.medications.length}`);
    console.log(`   📅 Lịch khám: ${data.appointments.length}`);
    console.log(`   📝 Lời dặn: ${data.instructions.length}`);
    
    // ========================================
    // BƯỚC 2: KIỂM TRA TRÙNG LẶP
    // ========================================
    console.log('\n\n🔍 BƯỚC 2: KIỂM TRA TRÙNG LẶP');
    console.log('='.repeat(70));
    
    const duplicateReport = duplicateChecker.checkDuplicates(data);
    
    console.log('\n💊 THUỐC:');
    console.log(`   Tổng số: ${duplicateReport.medications.total}`);
    console.log(`   Trùng lặp: ${duplicateReport.medications.duplicates.length}`);
    console.log(`   Unique: ${duplicateReport.medications.unique}`);
    
    if (duplicateReport.medications.duplicates.length > 0) {
      console.log('\n   ⚠️  Danh sách trùng lặp:');
      duplicateReport.medications.duplicates.forEach((dup, idx) => {
        console.log(`   ${idx + 1}. "${dup.original.name}" (vị trí ${dup.originalIndex}) trùng với "${dup.duplicate.name}" (vị trí ${dup.duplicateIndex})`);
      });
    }
    
    console.log('\n📅 LỊCH KHÁM:');
    console.log(`   Tổng số: ${duplicateReport.appointments.total}`);
    console.log(`   Trùng lặp: ${duplicateReport.appointments.duplicates.length}`);
    console.log(`   Unique: ${duplicateReport.appointments.unique}`);
    
    // Làm sạch dữ liệu
    const cleanData = duplicateChecker.cleanData(data);
    console.log('\n✅ Đã loại bỏ trùng lặp:');
    console.log(`   💊 Thuốc: ${data.medications.length} → ${cleanData.medications.length}`);
    console.log(`   📅 Lịch khám: ${data.appointments.length} → ${cleanData.appointments.length}`);
    
    // ========================================
    // BƯỚC 3: TẠO LỊCH NHẮC THÔNG MINH (AI)
    // ========================================
    console.log('\n\n🤖 BƯỚC 3: TẠO LỊCH NHẮC THÔNG MINH (AI - 100% LOCAL)');
    console.log('='.repeat(70));
    
    const startDate = new Date(); // Bắt đầu từ hôm nay
    const reminders = reminderAI.generateReminders(cleanData, startDate);
    
    console.log(`\n✅ Đã tạo ${reminders.summary.totalMedications + reminders.summary.totalAppointments} reminders:`);
    console.log(`   💊 Nhắc uống thuốc: ${reminders.summary.totalMedications}`);
    console.log(`   📅 Nhắc tái khám: ${reminders.summary.totalAppointments}`);
    console.log(`   📆 Khoảng thời gian: ${reminders.summary.dateRange.start} → ${reminders.summary.dateRange.end}`);
    
    // ========================================
    // HIỂN THỊ LỊCH NHẮC 7 NGÀY TỚI
    // ========================================
    console.log('\n\n📅 LỊCH NHẮC 7 NGÀY TỚI');
    console.log('='.repeat(70));
    
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    
    const upcomingReminders = reminderAI.filterRemindersByDateRange(
      reminders,
      startDate,
      next7Days
    );
    
    const groupedByDate = reminderAI.groupRemindersByDate(upcomingReminders);
    
    // Sắp xếp theo ngày
    const sortedDates = Object.keys(groupedByDate).sort();
    
    for (const date of sortedDates) {
      const dayReminders = groupedByDate[date];
      const totalCount = dayReminders.medications.length + dayReminders.appointments.length;
      
      console.log(`\n📆 ${date} (${totalCount} nhắc nhở)`);
      console.log('-'.repeat(70));
      
      // Hiển thị nhắc uống thuốc
      if (dayReminders.medications.length > 0) {
        console.log('  💊 Uống thuốc:');
        dayReminders.medications.forEach(r => {
          console.log(`     ${r.time} - ${r.medicationName} ${r.dosage || ''}`);
        });
      }
      
      // Hiển thị nhắc tái khám
      if (dayReminders.appointments.length > 0) {
        console.log('  📅 Tái khám:');
        dayReminders.appointments.forEach(r => {
          console.log(`     ${r.time} - ${r.appointmentType}`);
        });
      }
    }
    
    // ========================================
    // LƯU KẾT QUẢ
    // ========================================
    console.log('\n\n💾 LƯU KẾT QUẢ');
    console.log('='.repeat(70));
    
    const output = {
      ocr: {
        medications: cleanData.medications,
        appointments: cleanData.appointments,
        instructions: cleanData.instructions
      },
      duplicateCheck: duplicateReport,
      reminders: reminders,
      generatedAt: new Date().toISOString()
    };
    
    const outputPath = './full-flow-result.json';
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`✅ Đã lưu kết quả vào: ${outputPath}`);
    
    // ========================================
    // TÓM TẮT
    // ========================================
    console.log('\n\n📊 TÓM TẮT');
    console.log('='.repeat(70));
    console.log(`✅ OCR: ${cleanData.medications.length} thuốc, ${cleanData.appointments.length} lịch khám`);
    console.log(`✅ Duplicate Check: Loại bỏ ${duplicateReport.medications.duplicates.length} thuốc trùng`);
    console.log(`✅ AI Reminders: Tạo ${reminders.summary.totalMedications + reminders.summary.totalAppointments} nhắc nhở`);
    console.log(`✅ Thời gian xử lý: ${parseResult.stats.processingTime}ms`);
    console.log(`✅ 100% LOCAL - KHÔNG CALL API`);
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 HOÀN THÀNH!\n');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
    console.error(error.stack);
  }
}

// Chạy test
const pdfPath = process.argv[2] || "DonThuoc_25.007367 (1).pdf";
testFullFlow(pdfPath);
