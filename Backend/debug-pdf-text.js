require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function debugPDFText(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = new Uint8Array(dataBuffer);
  
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  
  console.log(`📄 PDF có ${pdfDocument.numPages} trang\n`);
  
  // Chỉ debug trang 1
  const page = await pdfDocument.getPage(1);
  const textContent = await page.getTextContent();
  
  console.log(`📊 Trang 1 có ${textContent.items.length} text items\n`);
  console.log('='.repeat(70));
  console.log('FIRST 50 TEXT ITEMS:');
  console.log('='.repeat(70));
  
  for (let i = 0; i < Math.min(50, textContent.items.length); i++) {
    const item = textContent.items[i];
    console.log(`[${i}] "${item.str}"`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('JOINED TEXT (first 2000 chars):');
  console.log('='.repeat(70));
  
  const joinedText = textContent.items.map(item => item.str).join(' ');
  console.log(joinedText.substring(0, 2000));
}

const pdfPath = process.argv[2] || "C:\\Users\\ADMIN\\Desktop\\Downloads\\DonThuoc_25.007367.pdf";
debugPDFText(pdfPath);
