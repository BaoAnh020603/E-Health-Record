/**
 * Test Prescription OCR API
 */

const FormData = require('form-data');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'http://localhost:3001';

async function testPrescriptionAPI() {
  console.log('🧪 TEST PRESCRIPTION OCR API\n');
  console.log('='.repeat(70));
  
  try {
    // Test 1: Health check
    console.log('\n📡 Test 1: Health Check');
    console.log('-'.repeat(70));
    
    const healthResponse = await fetch(`${API_URL}/api/prescription/health`);
    const healthData = await healthResponse.json();
    
    console.log('✅ Health check:', healthData.status);
    console.log('Features:', healthData.features.join(', '));
    
    // Test 2: Analyze prescription
    console.log('\n\n📄 Test 2: Analyze Prescription');
    console.log('-'.repeat(70));
    
    const pdfPath = './DonThuoc_25.007367 (1).pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('⚠️  File không tồn tại:', pdfPath);
      console.log('Vui lòng đảm bảo file PDF có trong thư mục Backend');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));
    formData.append('startDate', new Date().toISOString());
    
    console.log('📤 Uploading file:', pdfPath);
    
    const analyzeResponse = await fetch(`${API_URL}/api/prescription/analyze`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const analyzeData = await analyzeResponse.json();
    
    if (!analyzeData.success) {
      console.error('❌ Error:', analyzeData.error);
      return;
    }
    
    console.log('\n✅ Phân tích thành công!');
    console.log(`⏱️  Thời gian xử lý: ${analyzeData.processingTime}ms`);
    
    // Hiển thị summary
    console.log('\n📊 TÓM TẮT:');
    console.log(`   💊 Thuốc: ${analyzeData.data.summary.totalMedications}`);
    console.log(`   📅 Lịch khám: ${analyzeData.data.summary.totalAppointments}`);
    console.log(`   🔔 Nhắc nhở: ${analyzeData.data.summary.totalReminders}`);
    
    // Hiển thị insights
    console.log('\n💡 PHÂN TÍCH THÔNG MINH:');
    analyzeData.data.insights.forEach((insight, idx) => {
      console.log(`   ${idx + 1}. ${insight.icon} ${insight.title}`);
      console.log(`      ${insight.message}`);
    });
    
    // Hiển thị warnings
    if (analyzeData.data.warnings.length > 0) {
      console.log('\n⚠️  CẢNH BÁO:');
      analyzeData.data.warnings.forEach((warning, idx) => {
        console.log(`   ${idx + 1}. ${warning.icon} ${warning.title}`);
        console.log(`      ${warning.message}`);
      });
    }
    
    // Hiển thị recommendations
    console.log('\n💡 KHUYẾN NGHỊ:');
    analyzeData.data.recommendations.forEach((rec, idx) => {
      console.log(`   ${idx + 1}. ${rec.icon} ${rec.title} [${rec.priority.toUpperCase()}]`);
    });
    
    // Hiển thị options
    console.log('\n📱 OPTIONS:');
    console.log(`   👁️  Xem dữ liệu: ${analyzeData.data.options.viewOptions.length} options`);
    console.log(`   📤 Xuất dữ liệu: ${analyzeData.data.options.exportOptions.length} options`);
    console.log(`   ⚡ Hành động: ${analyzeData.data.options.actionOptions.length} options`);
    
    // Lưu response để test tiếp
    fs.writeFileSync('./api-response.json', JSON.stringify(analyzeData, null, 2));
    console.log('\n💾 Đã lưu response vào: ./api-response.json');
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST HOÀN THÀNH!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Chạy test
testPrescriptionAPI();
