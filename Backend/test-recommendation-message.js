/**
 * Test Recommendation Message Update
 */

// Clear cache
delete require.cache[require.resolve('./services/smart-report-service')];

const smartReport = require('./services/smart-report-service');

// Test data
const testData = {
  ocr: {
    medications: Array(10).fill({ name: 'Test', dosage: ['100mg'] }),
    appointments: [{ type: 'Tái khám', date: '2025-12-30' }],
    instructions: ['Test instruction']
  },
  reminders: {
    medications: [],
    appointments: [],
    summary: {
      totalMedications: 0,
      totalAppointments: 0
    }
  }
};

console.log('🧪 TEST RECOMMENDATION MESSAGE\n');
console.log('='.repeat(70));

const analysis = smartReport.analyzeData(testData);

console.log('\n💡 RECOMMENDATIONS:\n');
analysis.recommendations.forEach((rec, idx) => {
  console.log(`${idx + 1}. ${rec.icon} ${rec.title} [${rec.priority.toUpperCase()}]`);
  console.log(`   Message: ${rec.message}`);
  console.log('');
});

console.log('='.repeat(70));

// Check if message was updated
const rec3 = analysis.recommendations[2];
if (rec3 && rec3.message.includes('ngưng thuốc')) {
  console.log('✅ Message đã được cập nhật thành công!');
  console.log(`✅ New message: "${rec3.message}"`);
} else {
  console.log('⚠️  Message chưa được cập nhật');
}
