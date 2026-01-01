require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function readAnnotations(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = new Uint8Array(dataBuffer);
  
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  
  console.log('📝 ĐỌC ANNOTATIONS VÀ FORM FIELDS\n');
  console.log('='.repeat(70));
  
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    
    // Đọc annotations
    const annotations = await page.getAnnotations();
    
    if (annotations.length > 0) {
      console.log(`\n📄 TRANG ${pageNum} - Có ${annotations.length} annotations`);
      console.log('='.repeat(70));
      
      annotations.forEach((annotation, idx) => {
        console.log(`\n[${idx}] Annotation:`);
        console.log(`  Type: ${annotation.subtype}`);
        console.log(`  ID: ${annotation.id}`);
        
        if (annotation.fieldName) {
          console.log(`  Field Name: ${annotation.fieldName}`);
        }
        
        if (annotation.fieldValue) {
          console.log(`  Field Value: ${annotation.fieldValue}`);
        }
        
        if (annotation.contents) {
          console.log(`  Contents: ${annotation.contents}`);
        }
        
        if (annotation.buttonValue) {
          console.log(`  Button Value: ${annotation.buttonValue}`);
        }
        
        if (annotation.defaultAppearance) {
          console.log(`  Default Appearance: ${annotation.defaultAppearance}`);
        }
        
        if (annotation.textContent) {
          console.log(`  Text Content: ${annotation.textContent}`);
        }
        
        if (annotation.richText) {
          console.log(`  Rich Text:`, annotation.richText);
        }
        
        // In tất cả properties
        console.log(`  All properties:`, Object.keys(annotation));
      });
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ HOÀN THÀNH');
}

const pdfPath = process.argv[2] || "DonThuoc_25.007367 (1).pdf";
readAnnotations(pdfPath).catch(console.error);
