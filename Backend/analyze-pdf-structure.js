require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function analyzePDFStructure(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = new Uint8Array(dataBuffer);
  
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  
  console.log('📊 PHÂN TÍCH CẤU TRÚC PDF\n');
  console.log('='.repeat(70));
  
  // Chỉ phân tích trang 1 và 2
  for (let pageNum = 1; pageNum <= Math.min(2, pdfDocument.numPages); pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    console.log(`\n📄 TRANG ${pageNum} - ${textContent.items.length} items\n`);
    
    let medicationCount = 0;
    let inMedication = false;
    let currentMedItems = [];
    
    for (let i = 0; i < textContent.items.length; i++) {
      const item = textContent.items[i];
      const text = item.str.trim();
      
      if (!text) continue;
      
      // Kiểm tra số thứ tự
      if (/^\d+$/.test(text) && i + 1 < textContent.items.length) {
        const nextItem = textContent.items[i + 1];
        if (nextItem.str.trim() === '.') {
          // Bắt đầu medication mới
          if (inMedication && currentMedItems.length > 0) {
            console.log(`\n[Medication ${medicationCount}]:`);
            console.log(currentMedItems.slice(0, 10).join(' | '));
            console.log('---');
          }
          
          medicationCount++;
          inMedication = true;
          currentMedItems = [text];
          continue;
        }
      }
      
      if (inMedication) {
        currentMedItems.push(text);
        
        // Kiểm tra separator (kết thúc medication)
        if (/^[-]{20,}$/.test(text)) {
          console.log(`\n[Medication ${medicationCount}]:`);
          console.log(currentMedItems.slice(0, 15).join(' | '));
          console.log('---');
          inMedication = false;
          currentMedItems = [];
        }
      }
    }
    
    console.log(`\n✅ Trang ${pageNum}: Tìm thấy ${medicationCount} medications`);
  }
  
  console.log('\n' + '='.repeat(70));
}

const pdfPath = process.argv[2] || "C:\\Users\\ADMIN\\Desktop\\Downloads\\DonThuoc_25.007367.pdf";
analyzePDFStructure(pdfPath);
