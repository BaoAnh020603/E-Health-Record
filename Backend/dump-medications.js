require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function dumpMedications(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = new Uint8Array(dataBuffer);
  
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  
  console.log('💊 DUMP THUỐC ĐIỀU TRỊ (TRANG 1-7)\n');
  console.log('='.repeat(70));
  
  for (let pageNum = 1; pageNum <= 7; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    let foundMedSection = false;
    let itemCount = 0;
    
    for (let i = 0; i < textContent.items.length; i++) {
      const text = textContent.items[i].str.trim();
      
      // Tìm "Thuốc điều trị"
      if (text.includes('Thuốc điều trị')) {
        foundMedSection = true;
        console.log(`\n📄 TRANG ${pageNum} - Bắt đầu từ item ${i}`);
        console.log('='.repeat(70));
      }
      
      // In 50 items đầu tiên sau "Thuốc điều trị"
      if (foundMedSection && itemCount < 50) {
        console.log(`[${i}] "${text}"`);
        itemCount++;
      }
      
      if (itemCount >= 50) break;
    }
    
    if (foundMedSection) break;
  }
}

const pdfPath = process.argv[2] || "DonThuoc_25.007367 (1).pdf";
dumpMedications(pdfPath);
