require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function dumpPage8Text(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = new Uint8Array(dataBuffer);
  
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  
  console.log('📄 DUMP TOÀN BỘ TEXT TRANG 8\n');
  console.log('='.repeat(70));
  
  const page = await pdfDocument.getPage(8);
  const textContent = await page.getTextContent();
  
  console.log(`\nTổng số items: ${textContent.items.length}\n`);
  
  textContent.items.forEach((item, idx) => {
    const text = item.str;
    if (text.trim()) {
      console.log(`[${idx}] "${text}"`);
    }
  });
}

const pdfPath = process.argv[2] || "DonThuoc_25.007367 (1).pdf";
dumpPage8Text(pdfPath);
