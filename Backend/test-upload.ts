// test-upload.ts (trong browser)
import { uploadMedicalFile } from './lib/api/file-upload'

async function testUpload(file: File, recordId: string) {
  const result = await uploadMedicalFile({
    file,
    recordId,
    fileType: 'image',
    compress: true
  })
  console.log('Uploaded:', result)
}