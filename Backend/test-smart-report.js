/**
 * Test Smart Report - Phân tích thông minh và hiển thị OPTIONS
 */

const fs = require('fs');
const smartReport = require('./services/smart-report-service');

function testSmartReport() {
  console.log('🤖 TEST SMART REPORT - PHÂN TÍCH THÔNG MINH\n');
  console.log('='.repeat(70));
  
  // Đọc JSON từ full-flow-result.json
  const jsonPath = './full-flow-result.json';
  
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Không tìm thấy file:', jsonPath);
    console.log('💡 Hãy chạy: node test-full-flow.js trước');
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // ========================================
  // PHÂN TÍCH DỮ LIỆU
  // ========================================
  console.log('\n📊 PHÂN TÍCH DỮ LIỆU');
  console.log('='.repeat(70));
  
  const analysis = smartReport.analyzeData(data);
  
  // Hiển thị tóm tắt
  console.log('\n📋 TÓM TẮT:');
  console.log(`   💊 Thuốc: ${analysis.summary.totalMedications}`);
  console.log(`   📅 Lịch khám: ${analysis.summary.totalAppointments}`);
  console.log(`   📝 Lời dặn: ${analysis.summary.totalInstructions}`);
  console.log(`   🔔 Nhắc nhở: ${analysis.summary.totalReminders}`);
  console.log(`   📆 Khoảng thời gian: ${analysis.summary.dateRange.start} → ${analysis.summary.dateRange.end}`);
  
  // Hiển thị insights
  console.log('\n\n💡 PHÂN TÍCH THÔNG MINH:');
  console.log('='.repeat(70));
  
  if (analysis.insights.length === 0) {
    console.log('   Không có insights đặc biệt.');
  } else {
    analysis.insights.forEach((insight, idx) => {
      console.log(`\n${idx + 1}. ${insight.icon} ${insight.title}`);
      console.log(`   ${insight.message}`);
      if (insight.details) {
        console.log(`   Chi tiết: ${JSON.stringify(insight.details, null, 2).substring(0, 100)}...`);
      }
    });
  }
  
  // Hiển thị cảnh báo
  console.log('\n\n⚠️  CẢNH BÁO:');
  console.log('='.repeat(70));
  
  if (analysis.warnings.length === 0) {
    console.log('   ✅ Không có cảnh báo.');
  } else {
    analysis.warnings.forEach((warning, idx) => {
      console.log(`\n${idx + 1}. ${warning.icon} ${warning.title}`);
      console.log(`   ${warning.message}`);
    });
  }
  
  // Hiển thị khuyến nghị
  console.log('\n\n💡 KHUYẾN NGHỊ:');
  console.log('='.repeat(70));
  
  analysis.recommendations.forEach((rec, idx) => {
    console.log(`\n${idx + 1}. ${rec.icon} ${rec.title} [${rec.priority.toUpperCase()}]`);
    console.log(`   ${rec.message}`);
    console.log(`   Action: ${rec.action}`);
  });
  
  // ========================================
  // HIỂN THỊ OPTIONS (KHÔNG RENDER DỮ LIỆU)
  // ========================================
  console.log('\n\n📱 OPTIONS CHO NGƯỜI DÙNG CHỌN');
  console.log('='.repeat(70));
  
  console.log('\n👁️  XEM DỮ LIỆU:');
  analysis.options.viewOptions.forEach((opt, idx) => {
    const sizeLabel = opt.dataSize === 'large' ? '⚠️ Nhiều dữ liệu' : 
                      opt.dataSize === 'medium' ? 'ℹ️ Trung bình' : '✅ Ít dữ liệu';
    const countLabel = opt.count ? ` (${opt.count})` : '';
    console.log(`   ${idx + 1}. ${opt.icon} ${opt.label}${countLabel}`);
    console.log(`      ${opt.description}`);
    console.log(`      ${sizeLabel} | ID: ${opt.id}`);
  });
  
  console.log('\n📤 XUẤT DỮ LIỆU:');
  analysis.options.exportOptions.forEach((opt, idx) => {
    console.log(`   ${idx + 1}. ${opt.icon} ${opt.label}`);
    console.log(`      ${opt.description}`);
    console.log(`      Format: ${opt.format} | ID: ${opt.id}`);
  });
  
  console.log('\n⚡ HÀNH ĐỘNG:');
  analysis.options.actionOptions.forEach((opt, idx) => {
    console.log(`   ${idx + 1}. ${opt.icon} ${opt.label}`);
    console.log(`      ${opt.description}`);
    console.log(`      Action: ${opt.action} | ID: ${opt.id}`);
  });
  
  // ========================================
  // DEMO: NGƯỜI DÙNG CHỌN OPTION
  // ========================================
  console.log('\n\n🎯 DEMO: NGƯỜI DÙNG CHỌN OPTION');
  console.log('='.repeat(70));
  
  // Giả sử người dùng chọn "Xem tóm tắt"
  console.log('\n👤 Người dùng chọn: "summary" (Xem tóm tắt)');
  const summaryData = smartReport.getDataByOption(data, 'summary');
  console.log('📊 Dữ liệu trả về:');
  console.log(JSON.stringify(summaryData, null, 2));
  
  // Giả sử người dùng chọn "Nhắc nhở hôm nay"
  console.log('\n\n👤 Người dùng chọn: "reminders_today" (Nhắc nhở hôm nay)');
  const todayReminders = smartReport.getDataByOption(data, 'reminders_today');
  console.log(`📊 Dữ liệu trả về: ${todayReminders.medications.length} nhắc uống thuốc, ${todayReminders.appointments.length} nhắc tái khám`);
  
  if (todayReminders.medications.length > 0) {
    console.log('\n💊 Nhắc uống thuốc hôm nay:');
    todayReminders.medications.slice(0, 5).forEach(r => {
      console.log(`   ${r.time} - ${r.medicationName}`);
    });
    if (todayReminders.medications.length > 5) {
      console.log(`   ... và ${todayReminders.medications.length - 5} nhắc nhở khác`);
    }
  }
  
  // ========================================
  // LƯU BÁO CÁO
  // ========================================
  console.log('\n\n💾 LƯU BÁO CÁO');
  console.log('='.repeat(70));
  
  const report = {
    analysis: analysis,
    timestamp: new Date().toISOString()
  };
  
  const reportPath = './smart-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`✅ Đã lưu báo cáo vào: ${reportPath}`);
  
  // ========================================
  // TÓM TẮT
  // ========================================
  console.log('\n\n📊 TÓM TẮT');
  console.log('='.repeat(70));
  console.log(`✅ Phân tích: ${analysis.insights.length} insights, ${analysis.warnings.length} warnings, ${analysis.recommendations.length} recommendations`);
  console.log(`✅ Options: ${analysis.options.viewOptions.length} view options, ${analysis.options.exportOptions.length} export options, ${analysis.options.actionOptions.length} action options`);
  console.log(`✅ Không render dữ liệu lớn - Tiết kiệm token!`);
  console.log(`✅ Người dùng chọn option → Mới trả về dữ liệu`);
  
  console.log('\n' + '='.repeat(70));
  console.log('🎉 HOÀN THÀNH!\n');
}

testSmartReport();
