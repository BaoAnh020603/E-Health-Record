/**
 * Kiểm tra nhanh Reminder Service có tạo lịch mặc định không
 */

const reminderAI = require('./services/reminder-ai-service');

console.log('🔍 KIỂM TRA REMINDER SERVICE\n');
console.log('='.repeat(60));

// Test data: 1 thuốc KHÔNG có timing/frequency
const testData = {
  medications: [
    {
      name: 'Paracetamol',
      dosage: '500mg',
      // KHÔNG có timing và frequency
    }
  ],
  appointments: []
};

console.log('\n📊 Test với 1 thuốc KHÔNG có timing/frequency:');
console.log('   Tên: Paracetamol');
console.log('   Liều lượng: 500mg');
console.log('   Timing: KHÔNG CÓ');
console.log('   Frequency: KHÔNG CÓ');

const reminders = reminderAI.generateReminders(testData, new Date());

console.log('\n📊 KẾT QUẢ:');
console.log(`   • Tổng lịch nhắc: ${reminders.summary.totalMedications}`);
console.log(`   • Thuốc dùng lịch mặc định: ${reminders.summary.medicationsWithDefaultSchedule}`);

if (reminders.summary.totalMedications > 0) {
  console.log('\n✅ ĐÚNG: Đã tạo lịch nhắc mặc định');
  console.log(`   → Tạo ${reminders.summary.totalMedications} lịch nhắc (3 lần/ngày x 7 ngày = 21)`);
} else {
  console.log('\n❌ SAI: Không tạo lịch nhắc (vẫn dùng code cũ)');
  console.log('   → Cần RESTART server!');
}

console.log('\n' + '='.repeat(60));
