require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function findAppointmentText(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = new Uint8Array(dataBuffer);
  
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  
  console.log('🔍 TÌM TEXT VỀ TÁI KHÁM (TẤT CẢ CÁC TRANG)\n');
  console.log('='.repeat(70));
  
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    for (let i = 0; i < textContent.items.length; i++) {
      const item = textContent.items[i];
      const text = item.str.trim();
      
      // Tìm "Tái khám ngày:" hoặc số có dấu gạch ngang (30 - 12 - 2025)
      if (text.includes('Tái khám ngày:') || /\d{1,2}\s*-\s*\d{1,2}\s*-\s*\d{4}/.test(text)) {
        console.log(`\n📄 TRANG ${pageNum} - Tìm thấy: "${text}"`);
        console.log('='.repeat(70));
        
        // Lấy 15 items xung quanh
        const startIdx = Math.max(0, i - 2);
        const contextItems = textContent.items.slice(startIdx, i + 15);
        contextItems.forEach((it, idx) => {
          const marker = (startIdx + idx === i) ? '>>> ' : '    ';
          console.log(`${marker}[${idx}] "${it.str.trim()}"`);
        });
        console.log('='.repeat(70));
      }
    }
  }
}

const pdfPath = process.argv[2] || "C:\\Users\\ADMIN\\Desktop\\Downloads\\DonThuoc_25.007367.pdf";
findAppointmentText(pdfPath);
