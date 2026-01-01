// test-records.ts
import { createMedicalRecord, listMedicalRecords } from './lib/api/medical-records'

async function testRecords() {
  // Create record
  const record = await createMedicalRecord({
    ngay_kham: '2024-12-10',
    ten_benh_vien: 'Bệnh viện Test',
    chan_doan_vao: 'Sốt, ho',
    chan_doan_ra: 'Cảm cúm'
  })
  console.log('Created:', record)

  // List records
  const list = await listMedicalRecords({ page: 1, limit: 10 })
  console.log('List:', list)
}

testRecords()