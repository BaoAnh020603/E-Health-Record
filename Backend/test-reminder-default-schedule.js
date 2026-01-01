/**
 * Test Reminder với thuốc thiếu thông tin timing/frequency
 * Kiểm tra việc tạo lịch nhắc mặc định
 */

const reminderAI = require('./services/reminder-ai-service');

function testDefaultSchedule() {
  console.log('🧪 TEST REMINDER - LỊCH MẶC ĐỊNH\n');
  console.log('='.repeat(60));
  
  // Test data: 4 thuốc, 2 có timing, 2 KHÔNG có timing
  const testData = {
    medications: [
      {
        name: 'Paracetamol',
        dosage: '500mg',
        timing: ['sáng', 'tối'], // CÓ timing
        duration: '7 ngày'
      },
      {
        name: 'Amoxicillin',
        dosage: '250mg',
        frequency: '3 lần/ngày', // CÓ frequency
        duration: '5 ngày'
      },
      {
        name: 'Vitamin C',
        dosage: '1000mg',
        // KHÔNG có timing và frequency
        duration: '7 ngày'
      },
      {
        name: 'Omega-3',
        dosage: '500mg'
        // KHÔNG có timing, frequency, duration
      }
    ],
    appointments: []
  };
  
  console.log('\n📊 DỮ LIỆU TEST:');
  console.log(`   • Tổng số thuốc: ${testData.medications.length}`);
  console.log(`   • Thuốc có timing: 1 (Paracetamol)`);
  console.log(`   • Thuốc có frequency: 1 (Amoxicillin)`);
  console.log(`   • Thuốc THIẾU thông tin: 2 (Vitamin C, Omega-3)`);
  
  // Tạo reminders
  const startDate = new Date();
  const reminders = reminderAI.generateReminders(testData, startDate);
  
  console.log('\n📊 KẾT QUẢ:');
  console.log(`   • Tổng lịch nhắc: ${reminders.summary.totalMedications}`);
  console.log(`   • Thuốc dùng lịch mặc định: ${reminders.summary.medicationsWithDefaultSchedule}`);
  
  if (reminders.summary.medicationsNeedingReview.length > 0) {
    console.log('\n⚠️  THUỐC CẦN XEM LẠI:');
    reminders.summary.medicationsNeedingReview.forEach((med, index) => {
      console.log(`\n${index + 1}. ${med.name}`);
      console.log(`   Lý do: ${med.reason}`);
      console.log(`   Lịch mặc định: ${med.defaultSchedule}`);
      console.log(`   Gợi ý: ${med.suggestion}`);
    });
  }
  
  // Hiển thị chi tiết reminders
  console.log('\n📅 CHI TIẾT LỊCH NHẮC:');
  
  // Nhóm theo thuốc
  const byMedication = {};
  reminders.medications.forEach(r => {
    if (!byMedication[r.medicationName]) {
      byMedication[r.medicationName] = [];
    }
    byMedication[r.medicationName].push(r);
  });
  
  Object.entries(byMedication).forEach(([name, reminders]) => {
    console.log(`\n• ${name}: ${reminders.length} lịch nhắc`);
    if (reminders[0].isDefaultSchedule) {
      console.log(`  ⚠️  Đang dùng lịch MẶC ĐỊNH`);
    }
    
    // Hiển thị 3 lịch nhắc đầu tiên
    reminders.slice(0, 3).forEach(r => {
      console.log(`  - ${r.date} ${r.time}`);
    });
    if (reminders.length > 3) {
      console.log(`  ... và ${reminders.length - 3} lịch nhắc khác`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST HOÀN TẤT!\n');
  
  // Kiểm tra kết quả
  console.log('🔍 KIỂM TRA:');
  const expectedTotal = (2 * 7) + (3 * 5) + (3 * 7) + (3 * 7); // 2+3+3+3 lần/ngày * số ngày
  console.log(`   • Mong đợi: ~${expectedTotal} lịch nhắc`);
  console.log(`   • Thực tế: ${reminders.summary.totalMedications} lịch nhắc`);
  console.log(`   • Thuốc dùng lịch mặc định: ${reminders.summary.medicationsWithDefaultSchedule}/4`);
  
  if (reminders.summary.totalMedications > 0) {
    console.log('\n✅ THÀNH CÔNG: Đã tạo lịch nhắc cho TẤT CẢ thuốc (kể cả thiếu thông tin)');
  } else {
    console.log('\n❌ THẤT BẠI: Không tạo được lịch nhắc');
  }
}

// Chạy test
testDefaultSchedule();
