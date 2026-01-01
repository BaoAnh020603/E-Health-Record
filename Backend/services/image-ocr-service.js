/**
 * Image OCR Service - Đọc chữ từ ảnh (bao gồm chữ viết tay)
 * Sử dụng Tesseract.js - PHIÊN BẢN SIÊU NÂNG CAO
 * Có tiền xử lý ảnh để xử lý ảnh mờ, nghiêng, ánh sáng kém
 */

const Tesseract = require('tesseract.js');
const imagePreprocessor = require('./image-preprocessor');

class ImageOCRService {
  constructor() {
    this.worker = null;
    
    // Patterns để trích xuất thông tin - GIỐNG PDF PARSER
    this.patterns = {
      medicationNumber: /^(\d+)\s*\.?\s*/,
      medicationName: /\b([A-Z][a-zA-Z0-9\-\^]{2,}(?:[-\s][A-Z][a-zA-Z0-9\-\^]+)*)\b/,
      
      // Liều lượng - MỞ RỘNG (thêm CFU, ^7, ^8)
      dosage: /(?:\d+(?:\^[0-9]+)?(?:[.,]\d+)?\s*(?:[-\s]?\s*\d+(?:\^[0-9]+)?)?)\s*(?:mg|ml|g|kg|mcg|µg|IU|%|UI|U|cc|mmol|mEq|CFU)(?:\/(?:ml|kg|ngày|lần|giờ|h))?/gi,
      
      // Tần suất - MỞ RỘNG
      frequency: /(?:\d+\s*[-x×]\s*\d+\s*(?:lần|viên|ống|gói)?\s*\/\s*(?:ngày|tuần|tháng)|\d+\s*lần\s*\/\s*(?:ngày|tuần|tháng))/gi,
      
      // Thời gian - MỞ RỘNG
      timing: /(?:buổi\s+)?(?:sáng|sang|sớm|som|trưa|trua|chiều|chieu|tối|toi|khuya|đêm|dem|tối muộn|toi muon|nửa đêm|nua dem)(?:\s+sớm|\s+muộn|\s+muon)?/gi,
      
      // Thời hạn - MỞ RỘNG  
      duration: /\d+\s*(?:ngày|tuần|tuan|tháng|thang|năm|nam)/gi,
      
      // Hướng dẫn - MỞ RỘNG
      instructions: /(?:uống|uong|dùng|dung|tiêm|tiem|bôi|boi|nhỏ|nho|ngậm|ngam|đắp|dap|xịt|xit|súc|suc|rửa|rua|thoa|bơm|bom)\s+(?:trước|truoc|sau|trong|ngoài|ngoai|cùng|cung|khi|lúc|luc)\s+(?:ăn|an|bữa|bua|ngủ|ngu|thức|thuc|dậy|day)/gi,
      
      separator: /^[-=_]{3,}$/,
      
      // Ngày tháng - MỞ RỘNG
      date: /(\d{1,2})\s*[-\/\.]\s*(\d{1,2})\s*[-\/\.]\s*(\d{2,4})/,
      
      // Giờ - MỞ RỘNG
      time: /(\d{1,2})\s*[:hH]\s*(\d{2})(?:\s*(?:AM|PM|am|pm|SA|CH|sa|ch))?/
    };
    
    // Danh sách tên không hợp lệ - MỞ RỘNG
    this.invalidMedicationNames = [
      'N/A', 'NA', 'NULL', 'UNDEFINED',
      'STT', 'TEN', 'LIEU', 'LUONG', 'SO', 'NGAY', 'THANG', 'NAM',
      'BENH', 'VIEN', 'PHONG', 'KHAM', 'BENH', 'NHAN',
      // Từ thường gặp KHÔNG PHẢI tên thuốc
      'THAY', 'BANG', 'CHAI', 'VIEN', 'ONG', 'GOI', 'TUI', 'HOP', 'LO', 'HU',
      'SANG', 'TRUA', 'CHIEU', 'TOI', 'KHUYA', 'DEM', 'SOM', 'MUON',
      'UONG', 'DUNG', 'TIEM', 'BOI', 'NHO', 'NGAM', 'XIT', 'SUC', 'RUA', 'THOA',
      'TRUOC', 'SAU', 'TRONG', 'NGOAI', 'AN', 'BUA', 'NGU', 'THUC', 'DAY',
      'LAN', 'NGAY', 'TUAN', 'THANG', 'NAM',
      'CFU', 'MG', 'ML', 'G', 'KG', 'MCG', 'IU', 'UI', 'CC', 'MMOL', 'MEQ',
      // Từ chỉ số lượng
      'MOT', 'HAI', 'BA', 'BON', 'NAM', 'SAU', 'BAY', 'TAM', 'CHIN', 'MUOI',
      // Từ chỉ hướng dẫn
      'CAP', 'PHAT', 'KE', 'DON', 'TOA', 'THUOC', 'DUOC', 'SI', 'BAC',
      // Từ layout
      'DANH', 'SACH', 'CHI', 'TIET', 'GHI', 'CHU', 'LUU', 'Y'
    ];
  }

  /**
   * Initialize Tesseract worker - CẤU HÌNH SIÊU TỐI ƯU
   */
  async initWorker() {
    if (!this.worker) {
      console.log('🔧 Initializing Tesseract worker with ULTRA settings...');
      this.worker = await Tesseract.createWorker('vie', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            if (progress % 10 === 0 && progress > 0) {
              console.log(`📝 OCR Progress: ${progress}%`);
            }
          }
        }
      });
      
      console.log('✅ Tesseract worker ready');
    }
    return this.worker;
  }

  /**
   * Perform OCR on image - ĐA CHIẾN LƯỢC SIÊU MẠNH
   */
  async recognizeImage(imagePath) {
    try {
      console.log('🔍 Starting ULTRA OCR with multiple strategies...');
      
      const worker = await this.initWorker();
      const strategies = [];
      
      // === CHIẾN LƯỢC 1: AUTO (Tự động phát hiện layout) ===
      console.log('\n📸 Strategy 1: AUTO page segmentation');
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        preserve_interword_spaces: '1'
      });
      
      const result1 = await worker.recognize(imagePath);
      strategies.push({
        name: 'AUTO',
        confidence: result1.data.confidence,
        text: result1.data.text,
        data: result1.data
      });
      console.log(`   ✓ Confidence: ${result1.data.confidence.toFixed(2)}%`);
      
      // === CHIẾN LƯỢC 2: SINGLE_BLOCK (Coi toàn bộ là 1 khối text) ===
      console.log('\n📸 Strategy 2: SINGLE_BLOCK mode');
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
      });
      
      const result2 = await worker.recognize(imagePath);
      strategies.push({
        name: 'SINGLE_BLOCK',
        confidence: result2.data.confidence,
        text: result2.data.text,
        data: result2.data
      });
      console.log(`   ✓ Confidence: ${result2.data.confidence.toFixed(2)}%`);
      
      // === CHIẾN LƯỢC 3: SPARSE_TEXT (Text rải rác) ===
      console.log('\n📸 Strategy 3: SPARSE_TEXT mode');
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
      });
      
      const result3 = await worker.recognize(imagePath);
      strategies.push({
        name: 'SPARSE_TEXT',
        confidence: result3.data.confidence,
        text: result3.data.text,
        data: result3.data
      });
      console.log(`   ✓ Confidence: ${result3.data.confidence.toFixed(2)}%`);
      
      // === CHIẾN LƯỢC 4: SINGLE_COLUMN (1 cột text) ===
      console.log('\n📸 Strategy 4: SINGLE_COLUMN mode');
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_COLUMN,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
      });
      
      const result4 = await worker.recognize(imagePath);
      strategies.push({
        name: 'SINGLE_COLUMN',
        confidence: result4.data.confidence,
        text: result4.data.text,
        data: result4.data
      });
      console.log(`   ✓ Confidence: ${result4.data.confidence.toFixed(2)}%`);
      
      // === CHIẾN LƯỢC 5: Hybrid OEM (LSTM + Legacy) ===
      console.log('\n📸 Strategy 5: HYBRID OEM mode');
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.DEFAULT // Hybrid
      });
      
      const result5 = await worker.recognize(imagePath);
      strategies.push({
        name: 'HYBRID_OEM',
        confidence: result5.data.confidence,
        text: result5.data.text,
        data: result5.data
      });
      console.log(`   ✓ Confidence: ${result5.data.confidence.toFixed(2)}%`);
      
      // === CHỌN CHIẾN LƯỢC TỐT NHẤT ===
      console.log('\n🎯 Analyzing results...');
      
      // Đánh giá dựa trên nhiều tiêu chí
      const scored = strategies.map(s => {
        const lines = s.text.split('\n').filter(l => l.trim()).length;
        const hasNumbers = /\d+\.\s+[A-Z]/.test(s.text);
        const hasMedNames = /[A-Z][a-z]{3,}/.test(s.text);
        
        let score = s.confidence;
        if (lines > 10) score += 10; // Bonus cho nhiều dòng
        if (hasNumbers) score += 15; // Bonus cho có số thứ tự
        if (hasMedNames) score += 10; // Bonus cho có tên thuốc
        
        return { ...s, score, lines, hasNumbers, hasMedNames };
      });
      
      // Sắp xếp theo score
      scored.sort((a, b) => b.score - a.score);
      
      const best = scored[0];
      console.log(`\n✅ Best strategy: ${best.name}`);
      console.log(`   • Confidence: ${best.confidence.toFixed(2)}%`);
      console.log(`   • Score: ${best.score.toFixed(2)}`);
      console.log(`   • Lines: ${best.lines}`);
      console.log(`   • Has numbers: ${best.hasNumbers ? 'Yes' : 'No'}`);
      console.log(`   • Has med names: ${best.hasMedNames ? 'Yes' : 'No'}`);
      
      // Post-processing
      const cleanedText = this.postProcessText(best.text);
      
      return {
        success: true,
        text: cleanedText,
        originalText: best.text,
        confidence: best.confidence,
        words: best.data.words,
        lines: best.data.lines,
        strategy: best.name
      };
    } catch (error) {
      console.error('❌ OCR error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Post-process OCR text - SỬA LỖI SIÊU NÂNG CAO
   */
  postProcessText(text) {
    let cleaned = text;
    
    console.log('🧹 Post-processing text with ULTRA corrections...');
    
    // === SỬA LỖI NHẬN DẠNG SỐ - NÂNG CAO ===
    
    // 1. Số 0 bị nhận thành O
    cleaned = cleaned.replace(/([A-Z][a-z]+)O(\d)/g, '$10$2'); // ParacetamolO500 → Paracetamol0500
    cleaned = cleaned.replace(/(\d)O(\d)/g, '$10$2'); // 5O0 → 500
    
    // 2. Số 1 bị nhận thành l hoặc I
    cleaned = cleaned.replace(/(\d+)l(\d+)/g, '$11$2'); // 5l0 → 510
    cleaned = cleaned.replace(/(\d+)I(\d+)/g, '$11$2'); // 5I0 → 510
    cleaned = cleaned.replace(/\bl(\d+)/g, '1$1'); // l00 → 100
    
    // 3. Số 5 bị nhận thành S
    cleaned = cleaned.replace(/(\d+)S(\d+)/g, '$15$2'); // 7S0 → 750
    cleaned = cleaned.replace(/S(\d{2,})/g, '5$1'); // S00 → 500
    
    // 4. Số 8 bị nhận thành B
    cleaned = cleaned.replace(/(\d+)B(\d+)/g, '$18$2'); // 1B0 → 180
    
    // 5. Số 6 bị nhận thành G
    cleaned = cleaned.replace(/(\d+)G(\d+)/g, '$16$2'); // 6G0 → 660
    
    // 6. Số 2 bị nhận thành Z
    cleaned = cleaned.replace(/(\d+)Z(\d+)/g, '$12$2'); // 2Z0 → 220
    
    // === SỬA LỖI KHOẢNG TRẮNG ===
    
    // 7. Khoảng trắng thừa trong số
    cleaned = cleaned.replace(/(\d+)\s+(\d+)(mg|ml|g|kg|mcg|µg)/gi, '$1$2$3'); // 500 mg → 500mg
    
    // 8. Khoảng trắng giữa số và đơn vị
    cleaned = cleaned.replace(/(\d+)\s+(mg|ml|g|kg|mcg|µg|IU|%)/gi, '$1$2'); // 500 mg → 500mg
    
    // 9. Số bị tách rời
    cleaned = cleaned.replace(/(\d)\s+(\d)\s+(\d)/g, '$1$2$3'); // 5 0 0 → 500
    
    // === SỬA LỖI DẤU CHẤM ===
    
    // 10. Dấu chấm thừa trong số (không phải thập phân)
    cleaned = cleaned.replace(/(\d{2,})\.(\d{2,})(mg|ml|g|kg)/gi, '$1$2$3'); // 50.0mg → 500mg
    
    // 11. Dấu chấm thành dấu phẩy
    cleaned = cleaned.replace(/(\d+),(\d+)(mg|ml|g|kg)/gi, '$1.$2$3'); // 2,5mg → 2.5mg
    
    // === SỬA LỖI KÝ TỰ ĐẶC BIỆT ===
    
    // 12. Pipe thành I
    cleaned = cleaned.replace(/[|]/g, 'I');
    
    // 13. Loại bỏ backtick, quote lẻ
    cleaned = cleaned.replace(/[`']/g, '');
    
    // 14. Chuẩn hóa dấu gạch ngang
    cleaned = cleaned.replace(/[-—–]{2,}/g, '---');
    
    // 15. Dấu ^ bị nhầm
    cleaned = cleaned.replace(/\^(\d)/g, '^$1'); // Giữ nguyên ^7, ^8
    
    // === SỬA LỖI CHỮ CÁI ===
    
    // 16. Chữ x thành X (trong liều lượng)
    cleaned = cleaned.replace(/(\d+)\s*x\s*(\d+)/gi, '$1 X $2'); // 2x3 → 2 X 3
    
    // 17. Chữ o thành 0 trong số
    cleaned = cleaned.replace(/(\d)o(\d)/gi, '$10$2'); // 5o0 → 500
    
    // === SỬA LỖI ĐƠN VỊ ===
    
    // 18. Chuẩn hóa đơn vị
    cleaned = cleaned.replace(/\bmg\b/gi, 'mg');
    cleaned = cleaned.replace(/\bml\b/gi, 'ml');
    cleaned = cleaned.replace(/\bmcg\b/gi, 'mcg');
    
    // 19. Sửa lỗi "rng" thành "mg"
    cleaned = cleaned.replace(/(\d+)rng\b/gi, '$1mg');
    
    // 20. Sửa lỗi "rnl" thành "ml"
    cleaned = cleaned.replace(/(\d+)rnl\b/gi, '$1ml');
    
    // === CHUẨN HÓA KHOẢNG TRẮNG ===
    
    // 21. Nhiều space thành 1 space
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // 22. Loại bỏ dòng trống có space
    cleaned = cleaned.replace(/\n\s+\n/g, '\n\n');
    
    // 23. Trim mỗi dòng
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    
    // === SỬA LỖI PHỨC TẠP - SIÊU NÂNG CAO ===
    
    // 24. Sửa lỗi tên thuốc bị tách: "Para cetamol" → "Paracetamol"
    cleaned = cleaned.replace(/Para\s+cetamol/gi, 'Paracetamol');
    cleaned = cleaned.replace(/Ibu\s+profen/gi, 'Ibuprofen');
    cleaned = cleaned.replace(/Amoxi\s+cillin/gi, 'Amoxicillin');
    cleaned = cleaned.replace(/Cepha\s+lexin/gi, 'Cephalexin');
    
    // 25. Sửa lỗi CFU bị tách: "10 ^ 7" → "10^7"
    cleaned = cleaned.replace(/(\d+)\s*\^\s*(\d+)/g, '$1^$2');
    
    // 26. Sửa lỗi dấu gạch ngang trong khoảng: "10^7 - 10^8" → "10^7-10^8"
    cleaned = cleaned.replace(/(\d+\^?\d*)\s*-\s*(\d+\^?\d*)\s+(CFU|mg|ml)/gi, '$1-$2 $3');
    
    // 27. Sửa lỗi số thứ tự bị dính: "1.Paracetamol" → "1. Paracetamol"
    cleaned = cleaned.replace(/(\d+)\.([A-Z])/g, '$1. $2');
    
    // 28. Sửa lỗi đơn vị bị dính: "500mg" → "500 mg" (để dễ parse)
    cleaned = cleaned.replace(/(\d+)(mg|ml|g|kg|mcg|µg|IU|%|UI|U|cc|mmol|mEq|CFU)/gi, '$1 $2');
    
    // 29. Sửa lỗi số lượng bị dính: "1Viên" → "1 Viên"
    cleaned = cleaned.replace(/(\d+)(Viên|Vien|Ống|Ong|Chai|Lọ|Lo|Gói|Goi|Túi|Tui|Hộp|Hop)/gi, '$1 $2');
    
    // 30. Sửa lỗi chữ thường thành chữ hoa cho tên thuốc
    // VD: "paracetamol" → "Paracetamol"
    cleaned = cleaned.replace(/\b([a-z])([a-z]{2,})\b/g, (match, first, rest) => {
      // Chỉ viết hoa nếu là từ đầu câu hoặc sau số thứ tự
      return first.toUpperCase() + rest;
    });
    
    // 31. Sửa lỗi ký tự đặc biệt trong tên thuốc
    // VD: "Bio-subtyl" → "Biosubtyl" (nếu cần)
    // Giữ nguyên dấu gạch ngang hợp lệ
    
    // 32. Sửa lỗi số 0 ở đầu: "0500mg" → "500mg"
    cleaned = cleaned.replace(/\b0+(\d+)/g, '$1');
    
    // 33. Sửa lỗi dấu phẩy thành dấu chấm trong số thập phân
    cleaned = cleaned.replace(/(\d+),(\d{1,2})\s*(mg|ml|g|kg)/gi, '$1.$2 $3');
    
    // 34. Sửa lỗi "viên" bị nhận thành "vien"
    cleaned = cleaned.replace(/\bvien\b/gi, 'Viên');
    cleaned = cleaned.replace(/\bong\b/gi, 'Ống');
    cleaned = cleaned.replace(/\blo\b/gi, 'Lọ');
    cleaned = cleaned.replace(/\bgoi\b/gi, 'Gói');
    cleaned = cleaned.replace(/\btui\b/gi, 'Túi');
    cleaned = cleaned.replace(/\bhop\b/gi, 'Hộp');
    
    // 35. Sửa lỗi thời gian: "sang" → "sáng", "trua" → "trưa"
    cleaned = cleaned.replace(/\bsang\b/gi, 'sáng');
    cleaned = cleaned.replace(/\btrua\b/gi, 'trưa');
    cleaned = cleaned.replace(/\bchieu\b/gi, 'chiều');
    cleaned = cleaned.replace(/\btoi\b/gi, 'tối');
    cleaned = cleaned.replace(/\bdem\b/gi, 'đêm');
    
    // 36. Sửa lỗi "uống" bị nhận thành "uong"
    cleaned = cleaned.replace(/\buong\b/gi, 'uống');
    cleaned = cleaned.replace(/\bdung\b/gi, 'dùng');
    cleaned = cleaned.replace(/\btiem\b/gi, 'tiêm');
    cleaned = cleaned.replace(/\bboi\b/gi, 'bôi');
    cleaned = cleaned.replace(/\bnho\b/gi, 'nhỏ');
    
    // 37. Sửa lỗi "trước" bị nhận thành "truoc"
    cleaned = cleaned.replace(/\btruoc\b/gi, 'trước');
    cleaned = cleaned.replace(/\bsau\b/gi, 'sau');
    cleaned = cleaned.replace(/\ban\b/gi, 'ăn');
    cleaned = cleaned.replace(/\bbua\b/gi, 'bữa');
    cleaned = cleaned.replace(/\bngu\b/gi, 'ngủ');
    
    // 38. Sửa lỗi "lần" bị nhận thành "lan"
    cleaned = cleaned.replace(/\blan\b/gi, 'lần');
    cleaned = cleaned.replace(/\bngay\b/gi, 'ngày');
    cleaned = cleaned.replace(/\btuan\b/gi, 'tuần');
    cleaned = cleaned.replace(/\bthang\b/gi, 'tháng');
    cleaned = cleaned.replace(/\bnam\b/gi, 'năm');
    
    // 39. Sửa lỗi số La Mã bị nhầm: "II" trong "Biosubtyl-II"
    // Giữ nguyên II, III, IV, V trong tên thuốc
    
    // 40. Sửa lỗi ký tự đặc biệt thừa
    cleaned = cleaned.replace(/[~`!@#$%&*()_+=\[\]{}|\\;:"<>?]/g, '');
    
    // 41. Sửa lỗi nhiều dấu chấm: "..." → ""
    cleaned = cleaned.replace(/\.{2,}/g, '');
    
    // 42. Sửa lỗi dòng có chỉ số hoặc ký tự lẻ
    cleaned = cleaned.split('\n')
      .filter(line => {
        const trimmed = line.trim();
        // Loại bỏ dòng chỉ có 1-2 ký tự (trừ số thứ tự)
        if (trimmed.length <= 2 && !/^\d+\.?$/.test(trimmed)) {
          return false;
        }
        return true;
      })
      .join('\n');
    
    // 43. Sửa lỗi tên thuốc có số ở cuối không hợp lệ
    // VD: "Paracetamol500" → "Paracetamol 500"
    cleaned = cleaned.replace(/([A-Z][a-z]+)(\d{2,})/g, '$1 $2');
    
    // 44. Chuẩn hóa khoảng trắng cuối cùng
    cleaned = cleaned.replace(/\s+$/gm, '');
    cleaned = cleaned.replace(/^\s+/gm, '');
    
    console.log('   ✓ Applied 44 advanced OCR error corrections');
    
    return cleaned;
  }

  /**
   * Extract medications from OCR text - LOGIC NÂNG CAO
   */
  extractMedications(text) {
    // BƯỚC 1: Tách text thành dòng
    let lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    console.log(`📝 Phân tích ${lines.length} dòng text từ OCR...`);
    
    // BƯỚC 2: Xử lý trường hợp text bị ghép thành 1 dòng
    if (lines.length <= 5) {
      console.log('⚠️  Phát hiện text có thể bị ghép!');
      
      // Đếm số thứ tự trong text
      const numberMatches = text.match(/\b(\d+)\.\s+[A-Z]/g);
      if (numberMatches && numberMatches.length > 3) {
        console.log(`   → Tìm thấy ${numberMatches.length} số thứ tự thuốc`);
        console.log('   → Tách text bằng số thứ tự...');
        
        // Tìm tất cả vị trí có pattern "số. Chữ hoa"
        const regex = /(\d+)\.\s+([A-Z])/g;
        const matches = [];
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            number: match[1],
            position: match.index
          });
        }
        
        // Tách text dựa vào vị trí
        lines = [];
        for (let i = 0; i < matches.length; i++) {
          const start = matches[i].position;
          const end = i < matches.length - 1 ? matches[i + 1].position : text.length;
          const line = text.substring(start, end).trim();
          lines.push(line);
        }
        
        console.log(`   ✅ Đã tách thành ${lines.length} dòng riêng biệt`);
      }
    }
    
    // BƯỚC 3: Thử cả 2 phương pháp
    const medicationsWithNumbers = this.extractMedicationsWithNumbers(lines);
    const medicationsWithoutNumbers = this.extractMedicationsWithoutNumbers(lines);
    
    // BƯỚC 4: Merge kết quả
    const allMedications = [];
    
    if (medicationsWithNumbers.length > 0) {
      console.log(`✅ Phương pháp 1: Tìm thấy ${medicationsWithNumbers.length} thuốc (có số thứ tự)`);
      allMedications.push(...medicationsWithNumbers);
    }
    
    if (medicationsWithoutNumbers.length > 0) {
      console.log(`✅ Phương pháp 2: Tìm thấy ${medicationsWithoutNumbers.length} thuốc (không số thứ tự)`);
      // Chỉ thêm thuốc chưa có
      for (const med of medicationsWithoutNumbers) {
        const exists = allMedications.some(m => m.name === med.name);
        if (!exists) {
          allMedications.push(med);
        }
      }
    }
    
    return this.normalizeMedications(allMedications);
  }
  
  /**
   * Trích xuất thuốc CÓ SỐ THỨ TỰ
   */
  extractMedicationsWithNumbers(lines) {
    const medications = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const numberMatch = line.match(this.patterns.medicationNumber);
      
      if (numberMatch) {
        const number = parseInt(numberMatch[1]);
        const medication = {
          number: number,
          name: null,
          dosage: [],
          quantity: null,
          unit: null,
          frequency: null,
          timing: [],
          duration: null,
          instructions: [],
          rawLines: []
        };
        
        let remainingText = line.substring(numberMatch[0].length).trim();
        let currentLine = remainingText;
        medication.rawLines.push(currentLine);
        
        // Lấy thêm 5 dòng tiếp theo
        let j = i + 1;
        let lineCount = 0;
        const maxLines = 5;
        
        while (j < lines.length && lineCount < maxLines) {
          const nextLine = lines[j];
          
          if (this.patterns.separator.test(nextLine)) {
            j++;
            break;
          }
          
          if (this.patterns.medicationNumber.test(nextLine)) {
            break;
          }
          
          medication.rawLines.push(nextLine);
          currentLine += ' ' + nextLine;
          j++;
          lineCount++;
        }
        
        // Trích xuất tên thuốc - CẢI THIỆN
        const nameMatch = remainingText.match(this.patterns.medicationName);
        if (nameMatch) {
          let medName = nameMatch[1];
          
          // Loại bỏ số và ký tự đặc biệt ở cuối (10^7, 10^8, CFU...)
          // VD: "Biosubtyl-II10^7" → "Biosubtyl-II"
          medName = medName.replace(/\d+\^?\d*\s*[-\s]*\s*\d*\^?\d*\s*[A-Z]*$/i, '').trim();
          
          // Loại bỏ các từ không phải tên thuốc ở cuối
          const words = medName.split(/\s+/);
          const validWords = [];
          
          for (const word of words) {
            const upperWord = word.toUpperCase();
            // Dừng nếu gặp từ không hợp lệ
            if (this.invalidMedicationNames.includes(upperWord)) {
              break;
            }
            validWords.push(word);
          }
          
          medName = validWords.join(' ').trim();
          
          if (medName.length >= 3 && !this.invalidMedicationNames.includes(medName.toUpperCase())) {
            medication.name = medName;
          }
        }
        
        // Trích xuất liều lượng - CHỈ TỪ DÒNG ĐẦU TIÊN
        // Tìm pattern đặc biệt cho CFU: "10^7 - 10^8 CFU"
        const cfuPattern = /(\d+\^[0-9]+)\s*[-\s]+\s*(\d+\^[0-9]+)\s+(CFU)/gi;
        const cfuMatch = remainingText.match(cfuPattern);
        if (cfuMatch) {
          // Tìm thấy pattern CFU đặc biệt
          medication.dosage.push(cfuMatch[0].trim());
        } else {
          // Tìm liều lượng thông thường
          const dosageMatches = [...remainingText.matchAll(this.patterns.dosage)];
          for (const match of dosageMatches) {
            const dosage = match[0].trim();
            if (!medication.dosage.includes(dosage)) {
              medication.dosage.push(dosage);
            }
          }
        }
        
        // Trích xuất số lượng và đơn vị - CHỈ TỪ DÒNG ĐẦU TIÊN
        const quantityMatch = remainingText.match(/(\d+(?:\.\d+)?)\s+(Viên|Vien|Ống|Ong|Chai|Lọ|Lo)/i);
        if (quantityMatch) {
          medication.quantity = quantityMatch[1];
          medication.unit = quantityMatch[2];
        }
        
        // Các thông tin khác có thể lấy từ nhiều dòng (timing, frequency, duration, instructions)
        // vì chúng không bị nhầm lẫn giữa các thuốc
        
        // Trích xuất tần suất
        const freqMatch = currentLine.match(this.patterns.frequency);
        if (freqMatch) {
          medication.frequency = freqMatch[0];
        }
        
        // Trích xuất thời gian
        const timingMatches = [...currentLine.matchAll(this.patterns.timing)];
        for (const match of timingMatches) {
          const timing = match[0].toLowerCase()
            .replace(/buổi\s+/gi, '')
            .replace(/sang/gi, 'sáng')
            .replace(/trua/gi, 'trưa')
            .replace(/chieu/gi, 'chiều')
            .replace(/toi/gi, 'tối')
            .replace(/dem/gi, 'đêm');
          
          if (!medication.timing.includes(timing)) {
            medication.timing.push(timing);
          }
        }
        
        // Trích xuất thời hạn
        const durationMatch = currentLine.match(this.patterns.duration);
        if (durationMatch) {
          medication.duration = durationMatch[0];
        }
        
        // Trích xuất hướng dẫn
        const instructionMatches = [...currentLine.matchAll(this.patterns.instructions)];
        for (const match of instructionMatches) {
          const instruction = match[0].toLowerCase();
          if (!medication.instructions.includes(instruction)) {
            medication.instructions.push(instruction);
          }
        }
        
        // Validation
        if (medication.name && 
            medication.name.length >= 3 &&
            !this.invalidMedicationNames.includes(medication.name)) {
          medications.push(medication);
        }
        
        i = j;
        continue;
      }
      
      i++;
    }
    
    return medications;
  }
  
  /**
   * FALLBACK: Trích xuất thuốc KHÔNG CẦN số thứ tự - NÂNG CAO
   */
  extractMedicationsWithoutNumbers(lines) {
    const medications = [];
    const processedNames = new Set(); // Tránh trùng lặp
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Tìm tất cả tên thuốc có thể (chữ hoa, >= 3 ký tự)
      const nameMatches = [...line.matchAll(/\b([A-Z][a-zA-Z]{2,}(?:[-\s][A-Z][a-zA-Z]+)*)\b/g)];
      
      for (const nameMatch of nameMatches) {
        let medName = nameMatch[1];
        
        // Loại bỏ số và ký tự đặc biệt ở cuối
        medName = medName.replace(/\d+\^?\d*\s*[-\s]*\s*\d*\^?\d*\s*[A-Z]*$/i, '').trim();
        
        // Loại bỏ các từ không phải tên thuốc
        const words = medName.split(/\s+/);
        const validWords = [];
        
        for (const word of words) {
          const upperWord = word.toUpperCase();
          if (this.invalidMedicationNames.includes(upperWord)) {
            break;
          }
          validWords.push(word);
        }
        
        medName = validWords.join(' ').trim();
        
        // Validation
        if (medName.length < 3 || 
            this.invalidMedicationNames.includes(medName.toUpperCase()) ||
            processedNames.has(medName)) {
          continue;
        }
        
        processedNames.add(medName);
        
        const medication = {
          name: medName,
          dosage: [],
          quantity: null,
          unit: null,
          frequency: null,
          timing: [],
          duration: null,
          instructions: []
        };
        
        // CHỈ lấy liều lượng và số lượng từ DÒNG HIỆN TẠI
        const currentLineText = line;
        
        // Trích xuất liều lượng - Tìm CFU trước
        const cfuPattern = /(\d+\^[0-9]+)\s*[-\s]+\s*(\d+\^[0-9]+)\s+(CFU)/gi;
        const cfuMatch = currentLineText.match(cfuPattern);
        if (cfuMatch) {
          medication.dosage.push(cfuMatch[0].trim());
        } else {
          // Tìm liều lượng thông thường
          const dosageMatches = [...currentLineText.matchAll(this.patterns.dosage)];
          for (const match of dosageMatches) {
            const dosage = match[0].trim();
            if (!medication.dosage.includes(dosage)) {
              medication.dosage.push(dosage);
            }
          }
        }
        
        // Trích xuất số lượng và đơn vị - CHỈ TỪ DÒNG HIỆN TẠI
        const quantityMatch = currentLineText.match(/(\d+(?:\.\d+)?)\s+(Viên|Vien|Ống|Ong|Chai|Lọ|Lo|Gói|Goi|Túi|Tui)/i);
        if (quantityMatch) {
          medication.quantity = quantityMatch[1];
          medication.unit = quantityMatch[2];
        }
        
        // Các thông tin khác (timing, frequency, duration) có thể lấy từ context
        // vì chúng không bị nhầm lẫn
        const contextLines = lines.slice(i, Math.min(i + 3, lines.length));
        const contextText = contextLines.join(' ');
        
        // Trích xuất tần suất
        const freqMatch = contextText.match(this.patterns.frequency);
        if (freqMatch) {
          medication.frequency = freqMatch[0];
        }
        
        // Trích xuất thời gian
        const timingMatches = [...contextText.matchAll(this.patterns.timing)];
        for (const match of timingMatches) {
          const timing = match[0].toLowerCase()
            .replace(/buổi\s+/gi, '')
            .replace(/sang/gi, 'sáng')
            .replace(/trua/gi, 'trưa')
            .replace(/chieu/gi, 'chiều')
            .replace(/toi/gi, 'tối')
            .replace(/dem/gi, 'đêm');
          
          if (!medication.timing.includes(timing)) {
            medication.timing.push(timing);
          }
        }
        
        // Trích xuất thời hạn
        const durationMatch = contextText.match(this.patterns.duration);
        if (durationMatch) {
          medication.duration = durationMatch[0];
        }
        
        // Trích xuất hướng dẫn
        const instructionMatches = [...contextText.matchAll(this.patterns.instructions)];
        for (const match of instructionMatches) {
          const instruction = match[0].toLowerCase();
          if (!medication.instructions.includes(instruction)) {
            medication.instructions.push(instruction);
          }
        }
        
        medications.push(medication);
      }
    }
    
    return medications;
  }
  
  /**
   * Chuẩn hóa medications - KHÔNG GHÉP LIỀU LƯỢNG
   */
  normalizeMedications(medications) {
    const seen = new Map();
    
    for (const med of medications) {
      if (!med.name || med.name.length < 3 || 
          this.invalidMedicationNames.includes(med.name.toUpperCase())) {
        continue;
      }
      
      // Chuẩn hóa tên
      let normalizedName = med.name
        .replace(/[-\s]+$/, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (normalizedName.length < 3) continue;
      
      const keyName = normalizedName;
      
      if (seen.has(keyName)) {
        const existing = seen.get(keyName);
        
        // KHÔNG MERGE LIỀU LƯỢNG - Giữ nguyên liều lượng đầu tiên
        // Chỉ merge timing, instructions nếu chưa có
        
        // Merge timing (chỉ nếu existing chưa có)
        if ((!existing.timing || existing.timing.length === 0) && med.timing && med.timing.length > 0) {
          existing.timing = [...med.timing];
        }
        
        // Merge instructions (chỉ nếu existing chưa có)
        if (!existing.instructions && med.instructions && med.instructions.length > 0) {
          existing.instructions = [...med.instructions];
        }
        
        // Cập nhật các field đơn (chỉ nếu chưa có)
        if (!existing.frequency && med.frequency) existing.frequency = med.frequency;
        if (!existing.duration && med.duration) existing.duration = med.duration;
        if (!existing.quantity && med.quantity) existing.quantity = med.quantity;
        if (!existing.unit && med.unit) existing.unit = med.unit;
      } else {
        // Thuốc mới - Lưu nguyên
        seen.set(keyName, {
          name: normalizedName,
          dosage: med.dosage ? [...med.dosage] : [],
          quantity: med.quantity || null,
          unit: med.unit || null,
          frequency: med.frequency || null,
          timing: med.timing ? [...med.timing] : [],
          duration: med.duration || null,
          instructions: med.instructions ? [...med.instructions] : []
        });
      }
    }
    
    return Array.from(seen.values()).map(med => {
      const dosageStr = med.dosage && med.dosage.length > 0 
        ? [...new Set(med.dosage)].join(', ') 
        : null;
      
      const instructionsStr = med.instructions && med.instructions.length > 0 
        ? [...new Set(med.instructions)].join(', ') 
        : null;
      
      const timingOrder = ['sáng', 'trưa', 'chiều', 'tối', 'khuya', 'đêm'];
      const sortedTiming = med.timing.sort((a, b) => {
        const indexA = timingOrder.indexOf(a);
        const indexB = timingOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });
      
      return {
        name: med.name,
        dosage: dosageStr,
        quantity: med.quantity,
        unit: med.unit,
        frequency: med.frequency,
        timing: sortedTiming,
        duration: med.duration,
        instructions: instructionsStr
      };
    });
  }

  /**
   * Extract appointments from OCR text
   */
  extractAppointments(text) {
    const appointments = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log('📅 Tìm lịch khám...');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('tái khám') || lowerLine.includes('tai kham') || 
          lowerLine.includes('khám lại') || lowerLine.includes('kham lai')) {
        
        const appointment = {
          type: lowerLine.includes('chuyên khoa') || lowerLine.includes('chuyen khoa') 
            ? 'Tái khám chuyên khoa' 
            : 'Tái khám',
          date: null,
          time: null,
          notes: null
        };
        
        const contextLines = lines.slice(i, i + 6);
        const contextText = contextLines.join(' ');
        
        const dateMatch = contextText.match(this.patterns.date);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          const year = dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
          appointment.date = `${year}-${month}-${day}`;
        }
        
        const timeMatch = contextText.match(this.patterns.time);
        if (timeMatch) {
          const hour = timeMatch[1].padStart(2, '0');
          const minute = timeMatch[2];
          appointment.time = `${hour}:${minute}`;
        }
        
        let noteText = contextText
          .replace(/\d{1,2}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{2,4}/g, '')
          .replace(/\d{1,2}\s*[:h]\s*\d{2}/g, '')
          .replace(/tái khám|tai kham|khám lại|kham lai|chuyên khoa|chuyen khoa/gi, '')
          .trim();
        
        if (noteText && noteText.length > 10) {
          appointment.notes = noteText;
        }
        
        appointments.push(appointment);
        console.log(`   ✅ Tìm thấy lịch khám: ${appointment.type} - ${appointment.date || 'N/A'}`);
      }
    }
    
    return appointments;
  }

  /**
   * Extract instructions from OCR text
   */
  extractInstructions(text) {
    const instructions = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log('📝 Tìm lời dặn...');
    
    const instructionKeywords = [
      'lời dặn:', 'loi dan:',
      'lời dặn', 'loi dan',
      'hướng dẫn:', 'huong dan:',
      'hướng dẫn', 'huong dan',
      'chú ý:', 'chu y:',
      'chú ý', 'chu y',
      'lưu ý:', 'luu y:',
      'lưu ý', 'luu y'
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      const hasKeyword = instructionKeywords.some(kw => lowerLine.includes(kw));
      
      if (hasKeyword) {
        const contextLines = lines.slice(i, i + 10);
        const contextText = contextLines.join(' ');
        
        const patterns = [
          /lời dặn:\s*(.+?)(?=tái khám|ngày in|bác sĩ|$)/i,
          /loi dan:\s*(.+?)(?=tai kham|ngay in|bac si|$)/i,
          /hướng dẫn:\s*(.+?)(?=tái khám|ngày in|bác sĩ|$)/i,
          /huong dan:\s*(.+?)(?=tai kham|ngay in|bac si|$)/i,
          /chú ý:\s*(.+?)(?=tái khám|ngày in|bác sĩ|$)/i,
          /chu y:\s*(.+?)(?=tai kham|ngay in|bac si|$)/i,
          /lưu ý:\s*(.+?)(?=tái khám|ngày in|bác sĩ|$)/i,
          /luu y:\s*(.+?)(?=tai kham|ngay in|bac si|$)/i
        ];
        
        for (const pattern of patterns) {
          const match = contextText.match(pattern);
          if (match && match[1].trim() && match[1].trim().length > 10) {
            instructions.push(match[1].trim());
            console.log(`   ✅ Tìm thấy lời dặn: "${match[1].trim().substring(0, 50)}..."`);
            break;
          }
        }
      }
    }
    
    return [...new Set(instructions)];
  }

  /**
   * Parse OCR result into structured data
   */
  parseOCRResult(ocrResult) {
    if (!ocrResult.success) {
      return {
        success: false,
        error: ocrResult.error
      };
    }

    const text = ocrResult.text;
    
    return {
      success: true,
      data: {
        type: 'medication',
        medications: this.extractMedications(text),
        appointments: this.extractAppointments(text),
        instructions: this.extractInstructions(text),
        rawText: text,
        confidence: ocrResult.confidence
      }
    };
  }

  /**
   * Process image file - SIÊU NÂNG CAO VỚI TIỀN XỬ LÝ
   */
  async processImage(imagePath) {
    try {
      console.log('📸 Processing image with ULTRA preprocessing:', imagePath);
      
      // === BƯỚC 0: Tiền xử lý ảnh ===
      console.log('🎨 Bước 0: Preprocessing image...');
      const preprocessResult = await imagePreprocessor.preprocessImage(imagePath);
      
      let imageToProcess = imagePath;
      if (preprocessResult.success) {
        console.log('   ✅ Preprocessing successful, using enhanced image');
        imageToProcess = preprocessResult.processedPath;
      } else {
        console.log('   ⚠️  Preprocessing failed, using original image');
      }
      
      // === BƯỚC 1: OCR Image ===
      console.log('🔍 Bước 1: OCR Image (Tesseract)...');
      
      const ocrResult = await this.recognizeImage(imageToProcess);
      
      // Cleanup preprocessed file
      if (preprocessResult.success) {
        await imagePreprocessor.cleanup(preprocessResult.processedPath);
      }
      
      if (!ocrResult.success) {
        return {
          success: false,
          error: 'Không thể đọc ảnh. Vui lòng thử ảnh rõ hơn.'
        };
      }
      
      console.log(`📊 Bước 2: Parse OCR result (Confidence: ${ocrResult.confidence.toFixed(0)}%)...`);

      const parseResult = this.parseOCRResult(ocrResult);
      
      if (!parseResult.success) {
        return parseResult;
      }

      console.log(`✅ Extracted: ${parseResult.data.medications.length} medications, ${parseResult.data.appointments.length} appointments`);
      
      return parseResult;
    } catch (error) {
      console.error('❌ Image processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup worker
   */
  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('🧹 Tesseract worker terminated');
    }
  }
}

module.exports = new ImageOCRService();
