/**
 * Test Medication Reminder System
 * Kiểm tra hệ thống nhắc nhở uống thuốc
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE_URL = 'http://localhost:3001';

// Sample prescription data
const samplePrescription = {
  user_id: 'test-user-id',
  prescription_data: {
    record_id: 'test-record-123',
    bac_si_ke_don: 'BS. Nguyễn Văn A',
    benh_vien: 'Bệnh viện Đa khoa Trung ương',
    ngay_ke_don: '2024-01-15',
    chan_doan: 'Viêm họng cấp',
    medications: [
      {
        ten_thuoc: 'Paracetamol 500mg',
        lieu_dung: '1 viên/lần',
        tan_suat: '3 lần/ngày',
        cach_dung: 'Uống sau ăn',
        ghi_chu: 'Uống đủ nước'
      },
      {
        ten_thuoc: 'Amoxicillin 500mg',
        lieu_dung: '1 viên/lần',
        tan_suat: '2 lần/ngày',
        cach_dung: 'Uống trước ăn 30 phút',
        ghi_chu: 'Uống đủ liệu trình 7 ngày'
      },
      {
        ten_thuoc: 'Vitamin C 1000mg',
        lieu_dung: '1 viên/lần',
        tan_suat: '1 lần/ngày',
        cach_dung: 'Uống sau ăn sáng'
      }
    ],
    verified_by_doctor: true,
    user_confirmed: true
  }
};

async function testPrescriptionAnalysis() {
  console.log('🧪 Testing Prescription Reminder System\n');
  console.log('=' .repeat(60));

  try {
    console.log('\n📋 Test Data:');
    console.log('- Bác sĩ:', samplePrescription.prescription_data.bac_si_ke_don);
    console.log('- Bệnh viện:', samplePrescription.prescription_data.benh_vien);
    console.log('- Chẩn đoán:', samplePrescription.prescription_data.chan_doan);
    console.log('- Số loại thuốc:', samplePrescription.prescription_data.medications.length);
    console.log('- Verified by doctor:', samplePrescription.prescription_data.verified_by_doctor);
    console.log('- User confirmed:', samplePrescription.prescription_data.user_confirmed);

    console.log('\n📤 Sending request to:', `${API_BASE_URL}/api/analyze-prescription`);

    const response = await fetch(`${API_BASE_URL}/api/analyze-prescription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(samplePrescription),
    });

    console.log('\n📥 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error:', errorData);
      return;
    }

    const result = await response.json();

    console.log('\n✅ Success!');
    console.log('\n📊 Results:');
    console.log('- Success:', result.success);
    console.log('- Message:', result.message);
    console.log('- Reminders created:', result.reminders.length);
    console.log('- Disclaimer:', result.disclaimer);

    console.log('\n💊 Medication Reminders:');
    console.log('=' .repeat(60));

    result.reminders.forEach((reminder, index) => {
      console.log(`\n${index + 1}. ${reminder.medication_name}`);
      console.log(`   Liều dùng: ${reminder.dosage}`);
      console.log(`   Thời gian: ${reminder.time}`);
      console.log(`   Tần suất: ${reminder.frequency}`);
      console.log(`   Hướng dẫn: ${reminder.instructions}`);
      console.log(`   Bác sĩ: ${reminder.doctor_name}`);
      console.log(`   Bệnh viện: ${reminder.hospital}`);
      console.log(`   Chẩn đoán: ${reminder.diagnosis}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');

    // Verify important rules
    console.log('\n🔍 Verification:');
    let allValid = true;

    result.reminders.forEach((reminder, index) => {
      const originalMed = samplePrescription.prescription_data.medications.find(
        m => m.ten_thuoc === reminder.medication_name
      );

      if (originalMed) {
        // Check if dosage is preserved
        if (reminder.dosage === originalMed.lieu_dung) {
          console.log(`✅ ${index + 1}. Liều dùng giữ nguyên: ${reminder.dosage}`);
        } else {
          console.log(`❌ ${index + 1}. Liều dùng bị thay đổi!`);
          console.log(`   Original: ${originalMed.lieu_dung}`);
          console.log(`   AI: ${reminder.dosage}`);
          allValid = false;
        }

        // Check if frequency is preserved
        if (reminder.frequency === originalMed.tan_suat) {
          console.log(`✅ ${index + 1}. Tần suất giữ nguyên: ${reminder.frequency}`);
        } else {
          console.log(`❌ ${index + 1}. Tần suất bị thay đổi!`);
          console.log(`   Original: ${originalMed.tan_suat}`);
          console.log(`   AI: ${reminder.frequency}`);
          allValid = false;
        }
      }
    });

    if (allValid) {
      console.log('\n✅ All verifications passed! AI did not modify doctor\'s prescriptions.');
    } else {
      console.log('\n❌ Some verifications failed! AI modified doctor\'s prescriptions.');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

// Test without verification
async function testWithoutVerification() {
  console.log('\n\n🧪 Testing without doctor verification\n');
  console.log('=' .repeat(60));

  const invalidData = {
    ...samplePrescription,
    prescription_data: {
      ...samplePrescription.prescription_data,
      verified_by_doctor: false
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze-prescription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData),
    });

    const result = await response.json();

    if (!response.ok && result.error) {
      console.log('✅ Correctly rejected: ', result.error);
    } else {
      console.log('❌ Should have been rejected!');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Test without user confirmation
async function testWithoutUserConfirmation() {
  console.log('\n\n🧪 Testing without user confirmation\n');
  console.log('=' .repeat(60));

  const invalidData = {
    ...samplePrescription,
    prescription_data: {
      ...samplePrescription.prescription_data,
      user_confirmed: false
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze-prescription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData),
    });

    const result = await response.json();

    if (!response.ok && result.error) {
      console.log('✅ Correctly rejected: ', result.error);
    } else {
      console.log('❌ Should have been rejected!');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Medication Reminder System Tests\n');
  
  await testPrescriptionAnalysis();
  await testWithoutVerification();
  await testWithoutUserConfirmation();
  
  console.log('\n\n✅ All tests completed!\n');
}

runAllTests();
