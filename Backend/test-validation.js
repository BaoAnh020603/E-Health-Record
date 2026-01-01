/**
 * Test Validation System
 */

const prescriptionValidator = require('./services/prescription-validator-service');

console.log('🧪 TEST VALIDATION SYSTEM\n');
console.log('='.repeat(70));

// Test Case 1: Đơn thuốc hợp lệ
console.log('\n📋 Test Case 1: Đơn thuốc hợp lệ');
console.log('-'.repeat(70));

const validPrescription = {
  medications: [
    { name: 'Paracetamol', dosage: ['500mg'], frequency: '3 lần/ngày' },
    { name: 'Amoxicillin', dosage: ['250mg'], frequency: '2 lần/ngày' },
    { name: 'Vitamin C', dosage: ['1000mg'], frequency: '1 lần/ngày' }
  ],
  appointments: [
    { type: 'Tái khám ngày', date: '2025-12-30', time: '08:00' }
  ],
  instructions: ['Uống thuốc sau ăn', 'Nghỉ ngơi đầy đủ']
};

const result1 = prescriptionValidator.validatePrescription(validPrescription);
console.log('✅ Kết quả:');
console.log(`   Hợp lệ: ${result1.isValid}`);
console.log(`   Độ tin cậy: ${result1.confidence}%`);
console.log(`   Lý do: ${result1.reasons.join(', ')}`);
if (result1.warnings.length > 0) {
  console.log(`   Cảnh báo: ${result1.warnings.join(', ')}`);
}

// Test Case 2: Thiếu thông tin
console.log('\n\n📋 Test Case 2: Thiếu thông tin');
console.log('-'.repeat(70));

const incompletePrescription = {
  medications: [
    { name: 'Paracetamol', dosage: [] }, // Không có liều lượng
    { name: 'Amoxicillin', dosage: [] }
  ],
  appointments: [],
  instructions: []
};

const result2 = prescriptionValidator.validatePrescription(incompletePrescription);
console.log('⚠️  Kết quả:');
console.log(`   Hợp lệ: ${result2.isValid}`);
console.log(`   Độ tin cậy: ${result2.confidence}%`);
console.log(`   Lý do: ${result2.reasons.join(', ')}`);
if (result2.warnings.length > 0) {
  console.log(`   Cảnh báo: ${result2.warnings.join(', ')}`);
}

// Test Case 3: Không phải đơn thuốc
console.log('\n\n📋 Test Case 3: Không phải đơn thuốc');
console.log('-'.repeat(70));

const invalidPrescription = {
  medications: [
    { name: '123', dosage: [] }, // Tên không hợp lệ
    { name: 'abc', dosage: [] }  // Không bắt đầu bằng chữ hoa
  ],
  appointments: [],
  instructions: []
};

const result3 = prescriptionValidator.validatePrescription(invalidPrescription);
console.log('❌ Kết quả:');
console.log(`   Hợp lệ: ${result3.isValid}`);
console.log(`   Độ tin cậy: ${result3.confidence}%`);
console.log(`   Lý do: ${result3.reasons.join(', ')}`);
if (result3.warnings.length > 0) {
  console.log(`   Cảnh báo: ${result3.warnings.join(', ')}`);
}

// Test Case 4: Không có thuốc
console.log('\n\n📋 Test Case 4: Không có thuốc');
console.log('-'.repeat(70));

const noMedications = {
  medications: [],
  appointments: [],
  instructions: []
};

const result4 = prescriptionValidator.validatePrescription(noMedications);
console.log('❌ Kết quả:');
console.log(`   Hợp lệ: ${result4.isValid}`);
console.log(`   Độ tin cậy: ${result4.confidence}%`);
console.log(`   Lý do: ${result4.reasons.join(', ')}`);

// Test Case 5: Quá nhiều thuốc (spam)
console.log('\n\n📋 Test Case 5: Quá nhiều thuốc (spam)');
console.log('-'.repeat(70));

const tooManyMeds = {
  medications: Array(100).fill({ name: 'Test', dosage: ['100mg'] }),
  appointments: [],
  instructions: []
};

const result5 = prescriptionValidator.validatePrescription(tooManyMeds);
console.log('⚠️  Kết quả:');
console.log(`   Hợp lệ: ${result5.isValid}`);
console.log(`   Độ tin cậy: ${result5.confidence}%`);
console.log(`   Lý do: ${result5.reasons.join(', ')}`);
if (result5.warnings.length > 0) {
  console.log(`   Cảnh báo: ${result5.warnings.join(', ')}`);
}

console.log('\n' + '='.repeat(70));
console.log('✅ TEST HOÀN THÀNH!\n');
