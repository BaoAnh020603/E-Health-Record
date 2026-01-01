// scripts/import-csv-data.ts

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as Papa from 'papaparse'

// Configuration
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations
const csvFilePath = './data/medical-data.csv'

const supabase = createClient(supabaseUrl, supabaseKey)

interface CSVRow {
  MA_BV: string
  MA_LK: string
  MA_BN: string
  MA_HSBA?: string
  HO_TEN: string
  SO_CCCD: string
  NGAY_SINH: string
  GIOI_TINH: string
  NHOM_MAU: string
  DIA_CHI: string
  DIEN_THOAI: string
  MA_THE_BHYT: string
  NGAY_VAO: string
  NGAY_RA: string
  LY_DO_VV: string
  CHAN_DOAN_VAO: string
  CHAN_DOAN_RV: string
  MA_BENH_CHINH: string
  MA_BENH_KT: string
  SO_NGAY_DTRI: string
  PP_DIEU_TRI: string
  KET_QUA_DTRI: string
  T_TONGCHI_BV: string
  T_TONGCHI_BH: string
  T_BNTT: string
  MA_KHOA: string
  MA_CSKCB: string
  LOAI_KCB: string
}

/**
 * Parse CSV file
 */
function parseCSV(filePath: string): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    
    Papa.parse<CSVRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<CSVRow>) => {
        resolve(results.data)
      },
      error: (error: Error) => {
        reject(error)
      }
    })
  })
}

/**
 * Transform CSV row to medical record
 */
function transformToMedicalRecord(row: CSVRow, userId: string): any {
  // Parse dates
  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'NULL') return null
    // Format: YYYYMMDDHHMM -> ISO
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    const hour = dateStr.substring(8, 10) || '00'
    const minute = dateStr.substring(10, 12) || '00'
    return `${year}-${month}-${day}T${hour}:${minute}:00Z`
  }

  // Parse number
  const parseNumber = (str: string) => {
    if (!str || str === 'NULL') return null
    return parseFloat(str)
  }

  // Determine loai_kham
  let loaiKham: 'Ngoại trú' | 'Nội trú' | 'Cấp cứu' = 'Ngoại trú'
  if (row.LOAI_KCB === '02') loaiKham = 'Nội trú'
  if (row.LOAI_KCB === '03') loaiKham = 'Cấp cứu'

  return {
    user_id: userId,
    ma_hsba: row.MA_HSBA || row.MA_LK,
    ngay_kham: parseDate(row.NGAY_VAO),
    ma_benh_vien: row.MA_BV || row.MA_CSKCB,
    ten_benh_vien: 'Bệnh viện ' + (row.MA_BV || 'Không rõ'),
    ma_khoa: row.MA_KHOA,
    ten_khoa: null,
    bac_si_kham: null,
    ly_do_kham: row.LY_DO_VV,
    chan_doan_vao: row.CHAN_DOAN_VAO,
    chan_doan_ra: row.CHAN_DOAN_RV,
    ma_benh_chinh: row.MA_BENH_CHINH,
    ma_benh_phu: row.MA_BENH_KT ? row.MA_BENH_KT.split(';').filter(Boolean) : null,
    phuong_phap_dieu_tri: row.PP_DIEU_TRI,
    ket_qua_dieu_tri: row.KET_QUA_DTRI === '1' ? 'Khỏi' : row.KET_QUA_DTRI === '2' ? 'Đỡ' : 'Không thay đổi',
    so_ngay_dieu_tri: parseNumber(row.SO_NGAY_DTRI),
    ghi_chu_bac_si: null,
    toa_thuoc: null,
    chi_phi: {
      tong_chi: parseNumber(row.T_TONGCHI_BV),
      bhyt_chi_tra: parseNumber(row.T_TONGCHI_BH),
      benh_nhan_tra: parseNumber(row.T_BNTT)
    },
    loai_kham: loaiKham,
    trang_thai: 'active'
  }
}

/**
 * Transform CSV row to user profile
 */
function transformToUserProfile(row: CSVRow, userId: string): any {
  // Parse birth date
  const parseBirthDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'NULL') return null
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return `${year}-${month}-${day}`
  }

  // Parse gender
  const gioiTinh = row.GIOI_TINH === '1' ? 'Nam' : row.GIOI_TINH === '2' ? 'Nữ' : 'Khác'

  return {
    id: userId,
    ho_ten: row.HO_TEN,
    so_cccd: row.SO_CCCD !== 'NULL' ? row.SO_CCCD : null,
    ngay_sinh: parseBirthDate(row.NGAY_SINH),
    gioi_tinh: gioiTinh,
    nhom_mau: row.NHOM_MAU !== 'NULL' ? row.NHOM_MAU : null,
    dia_chi: row.DIA_CHI !== 'NULL' ? row.DIA_CHI : null,
    dien_thoai: row.DIEN_THOAI !== 'NULL' ? row.DIEN_THOAI : null,
    ma_the_bhyt: row.MA_THE_BHYT !== 'NULL' ? row.MA_THE_BHYT : null
  }
}

/**
 * Main import function
 */
async function importCSVData() {
  try {
    console.log('🚀 Starting CSV import...')
    
    // Read CSV
    console.log('📖 Reading CSV file...')
    const rows = await parseCSV(csvFilePath)
    console.log(`✓ Found ${rows.length} records`)

    // Group by patient (by MA_BN or HO_TEN)
    const patientGroups = new Map<string, CSVRow[]>()
    
    rows.forEach(row => {
      const patientKey = row.MA_BN || row.HO_TEN
      if (!patientGroups.has(patientKey)) {
        patientGroups.set(patientKey, [])
      }
      patientGroups.get(patientKey)!.push(row)
    })

    console.log(`✓ Found ${patientGroups.size} unique patients`)

    let successCount = 0
    let errorCount = 0

    // Process each patient
    for (const [patientKey, patientRows] of patientGroups) {
      try {
        // Create user account (email = patient ID + @example.com)
        const email = `${patientKey}@medical-import.com`
        const password = Math.random().toString(36).slice(-8) + 'A1!' // Random password

        console.log(`\n👤 Processing patient: ${patientRows[0].HO_TEN}`)

        // Sign up user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            ho_ten: patientRows[0].HO_TEN
          }
        })

        if (authError) {
          console.error(`  ✗ Auth error:`, authError.message)
          errorCount++
          continue
        }

        const userId = authData.user!.id

        // Create user profile
        const profile = transformToUserProfile(patientRows[0], userId)
        const { error: profileError } = await supabase
          .from('users_profile')
          .insert(profile)

        if (profileError) {
          console.error(`  ✗ Profile error:`, profileError.message)
          errorCount++
          continue
        }

        console.log(`  ✓ Created account: ${email}`)

        // Import medical records
        for (const row of patientRows) {
          const record = transformToMedicalRecord(row, userId)
          
          const { error: recordError } = await supabase
            .from('medical_records')
            .insert(record)

          if (recordError) {
            console.error(`  ✗ Record error:`, recordError.message)
          } else {
            console.log(`  ✓ Imported record: ${record.ma_hsba}`)
          }
        }

        successCount++
        console.log(`  ✓ Completed patient: ${patientRows[0].HO_TEN} (${patientRows.length} records)`)

      } catch (error: any) {
        console.error(`  ✗ Error processing patient:`, error.message)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 IMPORT SUMMARY')
    console.log('='.repeat(50))
    console.log(`✓ Success: ${successCount} patients`)
    console.log(`✗ Errors:  ${errorCount} patients`)
    console.log(`📝 Total CSV rows: ${rows.length}`)
    console.log('='.repeat(50))

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run import
importCSVData()
  .then(() => {
    console.log('\n✅ Import completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error)
    process.exit(1)
  })

/**
 * Usage:
 * 
 * 1. Install dependencies:
 *    npm install @supabase/supabase-js papaparse @types/papaparse
 * 
 * 2. Set environment variables:
 *    export SUPABASE_URL=https://your-project.supabase.co
 *    export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 * 
 * 3. Prepare CSV file at ./data/medical-data.csv
 * 
 * 4. Run script:
 *    ts-node scripts/import-csv-data.ts
 * 
 * 5. Check results in Supabase Dashboard
 */