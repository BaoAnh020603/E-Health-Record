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

    // Kiểm tra kết nối
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Lỗi kết nối Supabase:', testError.message);
      console.log('\n💡 Hãy kiểm tra:');
      console.log('   1. SUPABASE_URL trong .env.local');
      console.log('   2. SUPABASE_SERVICE_ROLE_KEY trong .env.local');
      process.exit(1);
    }

    console.log('✅ Kết nối Supabase thành công!\n');

    // Tạo bảng appointments
    console.log('📝 Tạo bảng appointments...');
    const { error: apptError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS appointments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          date DATE NOT NULL,
          time TIME,
          doctor TEXT,
          location TEXT,
          notes TEXT,
          created_from TEXT DEFAULT 'manual',
          reminder_sent BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (apptError && !apptError.message.includes('already exists')) {
      console.log('⚠️  Lỗi tạo bảng appointments:', apptError.message);
    } else {
      console.log('✅ Bảng appointments OK');
    }

    // Tạo bảng medications
    console.log('📝 Tạo bảng medications...');
    const { error: medError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS medications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          name TEXT NOT NULL,
          dosage TEXT,
          frequency TEXT,
          instructions TEXT,
          start_date DATE,
          duration TEXT,
          created_from TEXT DEFAULT 'manual',
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (medError && !medError.message.includes('already exists')) {
      console.log('⚠️  Lỗi tạo bảng medications:', medError.message);
    } else {
      console.log('✅ Bảng medications OK');
    }

    // Tạo bảng medication_reminders
    console.log('📝 Tạo bảng medication_reminders...');
    const { error: reminderError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS medication_reminders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          medication_id UUID NOT NULL,
          user_id UUID NOT NULL,
          time_of_day TEXT NOT NULL,
          specific_time TIME,
          enabled BOOLEAN DEFAULT TRUE,
          last_reminded_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (reminderError && !reminderError.message.includes('already exists')) {
      console.log('⚠️  Lỗi tạo bảng medication_reminders:', reminderError.message);
    } else {
      console.log('✅ Bảng medication_reminders OK');
    }

    console.log('\n✅ Setup hoàn tất!');
    console.log('\n📋 Các bảng đã tạo:');
    console.log('   - appointments (lịch khám)');
    console.log('   - medications (thông tin thuốc)');
    console.log('   - medication_reminders (lịch nhắc uống thuốc)');
    
    console.log('\n💡 Bước tiếp theo:');
    console.log('   1. Chạy server: node server.js');
    console.log('   2. Test OCR: node test-ocr.js');
    console.log('   3. Sử dụng app mobile để quét đơn thuốc');

    console.log('\n⚠️  LƯU Ý: Nếu gặp lỗi "function exec_sql does not exist"');
    console.log('   Hãy chạy SQL trực tiếp trong Supabase Dashboard:');
    console.log('   File: Backend/database/ocr-reminders-schema.sql');

  } catch (error) {
    console.error('❌ Lỗi setup:', error);
    process.exit(1);
  }
}

// Chạy setup
setupOCRReminders();
