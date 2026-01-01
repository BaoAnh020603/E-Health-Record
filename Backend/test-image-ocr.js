/**
 * Test Image OCR - Đọc chữ viết tay từ ảnh
 */

const imageOCR = require('./services/image-ocr-service');
const prescriptionValidator = require('./services/prescription-validator-service');
const fs = require('fs');
const path = require('path');

async function testImageOCR() {
  console.log('🧪 TEST IMAGE OCR - HANDWRITING RECOGNITION\n');
  console.log('='.repeat(70));
  
  // Test với ảnh mẫu (nếu có)
  const testImages = [
    './test-prescription.jpg',
    './test-prescription.png'
  ];
  
  let testImage = null;
  for (const img of testImages) {
    if (fs.existsSync(img)) {
      testImage = img;
      break;
    }
  }
  
  if (!testImage) {
    console.log('⚠️  Không tìm thấy ảnh test.');
    console.log('📝 Hướng dẫn test với ảnh thật:');
    console.log('   1. Chụp ảnh đơn thuốc (chữ viết tay)');
    console.log('   2. Lưu vào Backend/ với tên: test-prescription.jpg');
    console.log('   3. Chạy lại: node test-image-ocr.js\n');
    
    // Demo với text mẫu
    console.log('📋 DEMO: Phân tích text mẫu\n');
    console.log('-'.repeat(70));
    
    const demoText = `
BỆnh VIỆN ĐA KHOA TRUNG ƯƠNG
ĐƠN THUỐC

Bác sĩ: Nguyễn Văn A
Ngày: 30/12/2025

THUỐC ĐIỀU TRỊ:
1. Paracetamol 500mg - Uống 2 viên x 3 lần/ngày
2. Amoxicillin 500mg - Uống 1 viên x 2 lần/ngày
3. Vitamin C 1000mg - Uống 1 viên x 1 lần/ngày

TÁI KHÁM: 05/01/2026 lúc 08:00

LỜI DẶN:
- Uống thuốc sau ăn
- Nghỉ ngơi đầy đủ
- Uống nhiều nước
    `;
    
    console.log('📝 Text mẫu:');
    console.log(demoText);
    console.log('\n' + '-'.repeat(70));
    
    // Extract medications
    const medications = imageOCR.extractMedications(demoText);
    console.log(`\n💊 Thuốc tìm thấy: ${medications.length}`);
    medications.forEach((med, i) => {
      console.log(`   ${i + 1}. ${med.name}`);
      console.log(`      Liều lượng: ${med.dosage.join(', ')}`);
    });
    
    // Extract appointments
    const appointments = imageOCR.extractAppointments(demoText);
    console.log(`\n📅 Lịch khám: ${appointments.length}`);
    appointments.forEach((apt, i) => {
      console.log(`   ${i + 1}. ${apt.type}`);
      if (apt.date) console.log(`      Ngày: ${apt.date}`);
      if (apt.time) console.log(`      Giờ: ${apt.time}`);
    });
    
    // Extract instructions
    const instructions = imageOCR.extractInstructions(demoText);
    console.log(`\n📝 Lời dặn: ${instructions.length}`);
    instructions.forEach((inst, i) => {
      console.log(`   ${i + 1}. ${inst}`);
    });
    
    // Validate
    console.log('\n' + '-'.repeat(70));
    console.log('\n🔍 VALIDATION\n');
    
    const data = {
      medications: medications,
      appointments: appointments,
      instructions: instructions
    };
    
    const validation = prescriptionValidator.validatePrescription(data);
    
    console.log(`✅ Hợp lệ: ${validation.isValid}`);
    console.log(`📊 Độ tin cậy: ${validation.confidence}%`);
    console.log(`💡 Lý do: ${validation.reasons.join(', ')}`);
    if (validation.warnings.length > 0) {
      console.log(`⚠️  Cảnh báo: ${validation.warnings.join(', ')}`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ DEMO HOÀN THÀNH!\n');
    
    return;
  }
  
  // Test với ảnh thật
  console.log(`\n📸 Test với ảnh: ${testImage}\n`);
  console.log('-'.repeat(70));
  
  const startTime = Date.now();
  
  try {
    // Step 1: OCR
    console.log('\n🔍 Bước 1: OCR...');
    const result = await imageOCR.processImage(testImage);
    
    if (!result.success) {
      console.log(`❌ Lỗi: ${result.error}`);
      return;
    }
    
    const data = result.data;
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ OCR hoàn thành (${processingTime}ms)`);
    console.log(`📊 Confidence: ${data.confidence}%`);
    
    // Step 2: Results
    console.log('\n📊 KẾT QUẢ:\n');
    
    console.log(`💊 Thuốc: ${data.medications.length}`);
    data.medications.forEach((med, i) => {
      console.log(`   ${i + 1}. ${med.name}`);
      if (med.dosage.length > 0) {
        console.log(`      Liều lượng: ${med.dosage.join(', ')}`);
      }
    });
    
    console.log(`\n📅 Lịch khám: ${data.appointments.length}`);
    data.appointments.forEach((apt, i) => {
      console.log(`   ${i + 1}. ${apt.type}`);
      if (apt.date) console.log(`      Ngày: ${apt.date}`);
      if (apt.time) console.log(`      Giờ: ${apt.time}`);
    });
    
    console.log(`\n📝 Lời dặn: ${data.instructions.length}`);
    data.instructions.forEach((inst, i) => {
      console.log(`   ${i + 1}. ${inst}`);
    });
    
    // Step 3: Validation
    console.log('\n' + '-'.repeat(70));
    console.log('\n🔍 VALIDATION\n');
    
    const validation = prescriptionValidator.validatePrescription(data);
    
    if (validation.isValid) {
      console.log(`✅ Hợp lệ: true`);
    } else {
      console.log(`❌ Hợp lệ: false`);
    }
    console.log(`📊 Độ tin cậy: ${validation.confidence}%`);
    console.log(`💡 Lý do: ${validation.reasons.join(', ')}`);
    if (validation.warnings.length > 0) {
      console.log(`⚠️  Cảnh báo:`);
      validation.warnings.forEach(w => console.log(`   - ${w}`));
    }
    
    // Step 4: Raw text (first 500 chars)
    console.log('\n' + '-'.repeat(70));
    console.log('\n📄 RAW TEXT (500 ký tự đầu):\n');
    console.log(data.rawText.substring(0, 500));
    if (data.rawText.length > 500) {
      console.log('...');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST HOÀN THÀNH!\n');
    
    // Cleanup
    await imageOCR.cleanup();
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    await imageOCR.cleanup();
  }
}

// Run test
testImageOCR().catch(console.error);
