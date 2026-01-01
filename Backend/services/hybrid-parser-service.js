/**
 * Hybrid Parser Service - Kết hợp Local Parser + AI API
 * Ưu tiên Local Parser (nhanh, miễn phí), fallback sang AI API nếu cần
 */

const localParser = require('./local-parser-service');
const smartFilter = require('./smart-filter-service');
const ocrService = require('./ocr-service');

class HybridParserService {
  constructor() {
    this.config = {
      // Ngưỡng để chấp nhận kết quả local
      minMedicationsLocal: 5,
      minAppointmentsLocal: 0,
      
      // Có sử dụng AI API không (có thể tắt để force local only)
      enableAI: true,
      
      // Có lọc text trước khi gọi AI không (giảm chi phí)
      filterBeforeAI: true
    };
  }

  /**
   * Cấu hình hybrid parser
   */
  configure(options) {
    this.config = { ...this.config, ...options };
  }

  /**
   * Kiểm tra kết quả local có đủ tốt không
   */
  isLocalResultGood(result) {
    if (!result.success) {
      return false;
    }

    const medCount = result.data.medications?.length || 0;
    const aptCount = result.data.appointments?.length || 0;

    // Chấp nhận nếu có đủ thuốc HOẶC có lịch khám
    return medCount >= this.config.minMedicationsLocal || 
           aptCount >= this.config.minAppointmentsLocal;
  }

  /**
   * Phân tích text bằng hybrid approach
   */
  async parse(text) {
    console.log('🔄 Bắt đầu Hybrid Parser...\n');
    
    const startTime = Date.now();
    
    // Bước 1: Thử Local Parser trước (nhanh, miễn phí)
    console.log('⚡ Bước 1: Thử Local Parser (offline, nhanh)...');
    const localResult = localParser.parse(text);
    
    if (localResult.success) {
      const medCount = localResult.data.medications?.length || 0;
      const aptCount = localResult.data.appointments?.length || 0;
      console.log(`   ✅ Local Parser: ${medCount} thuốc, ${aptCount} lịch khám`);
      
      // Kiểm tra kết quả có đủ tốt không
      if (this.isLocalResultGood(localResult)) {
        const totalTime = Date.now() - startTime;
        console.log(`\n✅ Chấp nhận kết quả Local Parser (${totalTime}ms)`);
        console.log('💰 Tiết kiệm: Không tốn tiền API\n');
        
        return {
          ...localResult,
          method: 'local',
          totalTime
        };
      }
      
      console.log(`   ⚠️  Kết quả chưa đủ tốt (cần >= ${this.config.minMedicationsLocal} thuốc)`);
    } else {
      console.log(`   ❌ Local Parser thất bại: ${localResult.error}`);
    }
    
    // Bước 2: Nếu không đủ và AI được bật, gọi AI API
    if (!this.config.enableAI) {
      console.log('\n⚠️  AI API bị tắt, chỉ trả về kết quả local');
      return {
        ...localResult,
        method: 'local-only',
        totalTime: Date.now() - startTime
      };
    }
    
    console.log('\n🤖 Bước 2: Gọi AI API (chậm hơn nhưng chính xác hơn)...');
    
    try {
      let textToAnalyze = text;
      
      // Lọc text trước nếu được bật (giảm chi phí)
      if (this.config.filterBeforeAI) {
        console.log('   🔍 Lọc text trước khi gọi AI...');
        const filtered = smartFilter.process(text);
        textToAnalyze = filtered.filteredText;
        console.log(`   📊 Giảm: ${text.length} → ${textToAnalyze.length} ký tự (${filtered.stats.reductionRate}%)`);
      }
      
      // Gọi AI API
      const aiResult = await ocrService.analyzeTextWithAI(textToAnalyze);
      
      if (aiResult.success) {
        const medCount = aiResult.data.medications?.length || 0;
        const aptCount = aiResult.data.appointments?.length || 0;
        const totalTime = Date.now() - startTime;
        
        console.log(`   ✅ AI API: ${medCount} thuốc, ${aptCount} lịch khám`);
        console.log(`\n✅ Hoàn thành bằng AI API (${totalTime}ms)`);
        console.log('💸 Chi phí: ~$0.01-0.05\n');
        
        return {
          success: true,
          data: aiResult.data,
          method: 'ai',
          totalTime,
          localResult: localResult.success ? localResult.data : null
        };
      } else {
        console.log(`   ❌ AI API thất bại: ${aiResult.error}`);
        
        // Fallback về local result
        console.log('\n⚠️  Fallback về kết quả Local Parser');
        return {
          ...localResult,
          method: 'local-fallback',
          totalTime: Date.now() - startTime,
          aiError: aiResult.error
        };
      }
      
    } catch (error) {
      console.error('   ❌ Lỗi khi gọi AI:', error.message);
      
      // Fallback về local result
      console.log('\n⚠️  Fallback về kết quả Local Parser');
      return {
        ...localResult,
        method: 'local-fallback',
        totalTime: Date.now() - startTime,
        aiError: error.message
      };
    }
  }

  /**
   * Parse với cấu hình tùy chỉnh
   */
  async parseWithConfig(text, config) {
    const oldConfig = { ...this.config };
    this.configure(config);
    
    const result = await this.parse(text);
    
    this.configure(oldConfig); // Restore
    return result;
  }

  /**
   * Force local only (không gọi AI)
   */
  parseLocalOnly(text) {
    return this.parseWithConfig(text, { enableAI: false });
  }

  /**
   * Force AI only (bỏ qua local)
   */
  async parseAIOnly(text) {
    console.log('🤖 Force AI API only...\n');
    
    const startTime = Date.now();
    
    // Lọc text trước
    const filtered = smartFilter.process(text);
    
    // Gọi AI
    const aiResult = await ocrService.analyzeTextWithAI(filtered.filteredText);
    
    return {
      ...aiResult,
      method: 'ai-only',
      totalTime: Date.now() - startTime
    };
  }
}

module.exports = new HybridParserService();
