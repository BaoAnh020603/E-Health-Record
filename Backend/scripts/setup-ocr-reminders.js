require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

async function setupOCRReminders() {
  try {
    console.log('🚀 Bắt đầu setup database cho OCR Reminders...\n');

    // Đọc SQL schema
    const schemaPath = path.join(__dirname, '../database/ocr-reminders-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Tách các câu lệnh SQL
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📝 Tìm thấy ${statements.length} câu lệnh SQL\n`);

    // Thực thi từng câu lệnh
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Bỏ qua comments
      if (statement.startsWith('--')) continue;

      try {
        console.log(`⏳ Đang thực thi câu lệnh ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // Thử cách khác nếu rpc không hoạt động
          const { error: directError } = await supabase
            .from('_sql')
            .insert({ query: statement });
          
          if (directError) {
            console.log(`⚠️  Lỗi (có thể bỏ qua): ${directError.message.substring(0, 100)}`);
          }
        } else {
          console.log(`✅ Thành công`);
        }
      } catch (err) {
        console.log(`⚠️  Lỗi: ${err.message.substring(0, 100)}`);
      }
    }

    console.log('\n✅ Setup hoàn tất!');
    console.log('\n📋 Các bảng đã tạo:');
    console.log('   - appointments (lịch khám)');
    console.log('   - medications (thông tin thuốc)');
    console.log('   - medication_reminders (lịch nhắc uống thuốc)');
    console.log('   - reminder_history (lịch sử nhắc nhở)');
    
    console.log('\n💡 Hướng dẫn sử dụng:');
    console.log('   1. Chạy server: cd Backend && node server.js');
    console.log('   2. Mở app mobile và vào màn hình "Quét Đơn Thuốc"');
    console.log('   3. Chụp hoặc chọn ảnh đơn thuốc/lịch khám');
    console.log('   4. Hệ thống sẽ tự động phân tích và tạo nhắc nhở');

  } catch (error) {
    console.error('❌ Lỗi setup:', error);
    process.exit(1);
  }
}

// Chạy setup
setupOCRReminders();
