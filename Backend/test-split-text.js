/**
 * Test logic tách text bị ghép thành 1 dòng
 */

// Giả lập text từ OCR (giống log của bạn)
const ocrText = `2.00 Viên Thay băng. 24. Biosubtyl-II10^7 - 10^8 CFU 1 Viên 1.00 Viên Thay băng. 25. Biosubtyl-II10^7 - 10^8 CFU 1 Viên 1.00 Viên Thay băng. 26. Rotundin 6060mg 1 Viên 1.00 Viên Thay băng. 27. Parazacol 75010mg/ml, 75ml 1Lọo 1.00 Chai Thay băng 28. Parazacol 75010mg/ml, 75ml 1Lọ 1.00 Chai Thay băng 29. Parazacol 75010mg/ml, 75ml 1Lọ 1.00 Chai Thay băng 30. Parazacol 75010mg/ml, 75ml 1Lọo 1.00 Chai Thay băng 31. Parazacol 75010mg/ml, 75ml 1Lọ 1.00 Chai Thay băng 32. Parazacol 75010mg/ml, 75ml 1Lọo 1.00 Chai Thay băng 33. Nefopam Medisol 20mg/2ml20mg/2ml 1Óng 1.00 Óng Thay băng.`;

console.log('🧪 TEST TÁCH TEXT BỊ GHÉP THÀNH 1 DÒNG\n');
console.log('='.repeat(60));

console.log('\n📄 TEXT GỐC (1 dòng dài):');
console.log(ocrText.substring(0, 200) + '...\n');

// Đếm số thứ tự
const numberMatches = ocrText.match(/\b(\d+)\.\s+[A-Z]/g);
console.log(`🔍 Tìm thấy ${numberMatches ? numberMatches.length : 0} số thứ tự:`);
if (numberMatches) {
  numberMatches.forEach(m => console.log(`   - ${m}`));
}

// Tách text bằng số thứ tự
console.log('\n✂️  TÁCH TEXT BẰNG SỐ THỨ TỰ:');

// Tìm tất cả vị trí có pattern "số. Chữ hoa"
const regex = /(\d+)\.\s+([A-Z])/g;
const matches = [];
let match;

while ((match = regex.exec(ocrText)) !== null) {
  matches.push({
    number: match[1],
    position: match.index,
    fullMatch: match[0]
  });
}

console.log(`   → Tìm thấy ${matches.length} vị trí\n`);

// Tách text dựa vào vị trí
const lines = [];
for (let i = 0; i < matches.length; i++) {
  const start = matches[i].position;
  const end = i < matches.length - 1 ? matches[i + 1].position : ocrText.length;
  const line = ocrText.substring(start, end).trim();
  lines.push(line);
  console.log(`Dòng ${i + 1}: "${line.substring(0, 80)}..."`);
}

console.log('\n' + '='.repeat(60));
console.log(`✅ KẾT QUẢ: Tách thành ${lines.length} dòng riêng biệt`);

// Trích xuất tên thuốc từ mỗi dòng
console.log('\n💊 TRÍCH XUẤT TÊN THUỐC:');
lines.forEach((line, idx) => {
  const nameMatch = line.match(/^\d+\.\s+([A-Z][a-zA-Z\-]+(?:\s+[A-Z][a-zA-Z\-]+)*)/);
  if (nameMatch) {
    console.log(`   ${idx + 1}. ${nameMatch[1]}`);
  }
});

console.log('\n✅ HOÀN TẤT!\n');
