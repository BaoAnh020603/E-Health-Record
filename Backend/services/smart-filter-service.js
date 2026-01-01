/**
 * Smart Filter Service - Lọc thông tin quan trọng từ đơn thuốc
 * Không cần API, xử lý hoàn toàn local
 */

class SmartFilterService {
  constructor() {
    // Keywords để nhận diện các loại thông tin
    this.medicationKeywords = [
      'thuốc', 'viên', 'lần/ngày', 'mg', 'ml', 'uống', 'liều',
      'tablets', 'capsule', 'injection', 'chai', 'lọ', 'ống',
      'sáng', 'trưa', 'tối', 'chiều', 'trước ăn', 'sau ăn'
    ];
    
    this.appointmentKeywords = [
      'tái khám', 'khám lại', 'hẹn khám', 'ngày khám', 'lịch khám',
      'tái khám ngày', 'khám lại ngày', 'follow up'
    ];
    
    this.instructionKeywords = [
      'lời dặn', 'chú ý', 'hướng dẫn', 'cắt chỉ', 'thay băng',
      'uống thuốc', 'đúng giờ', 'không tự ý', 'báo bác sĩ',
      'instructions', 'note', 'warning'
    ];
    
    this.patientInfoKeywords = [
      'họ tên', 'tuổi', 'ngày sinh', 'giới tính', 'địa chỉ',
      'cân nặng', 'chiều cao', 'bệnh nhân', 'patient'
    ];
    
    this.diagnosisKeywords = [
      'chẩn đoán', 'bệnh', 'diagnosis', 'triệu chứng'
    ];
  }

  /**
   * Phân loại dòng text
   */
  classifyLine(line) {
    const lowerLine = line.toLowerCase();
    
    // Bỏ qua dòng rỗng hoặc quá ngắn
    if (!line.trim() || line.trim().length < 3) {
      return 'skip';
    }
    
    // Bỏ qua các ký tự đặc biệt không có ý nghĩa
    if (/^[-=_\s]+$/.test(line)) {
      return 'skip';
    }
    
    // Kiểm tra thuốc (ưu tiên cao nhất)
    const hasMedicationKeyword = this.medicationKeywords.some(kw => lowerLine.includes(kw));
    const hasNumber = /\d/.test(line);
    const hasDosage = /\d+\s*(mg|ml|viên|lần|ngày)/i.test(line);
    
    if ((hasMedicationKeyword && hasNumber) || hasDosage) {
      return 'medication';
    }
    
    // Kiểm tra lịch khám
    const hasAppointment = this.appointmentKeywords.some(kw => lowerLine.includes(kw));
    const hasDate = /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(line);
    
    if (hasAppointment || (hasDate && lowerLine.includes('khám'))) {
      return 'appointment';
    }
    
    // Kiểm tra lời dặn
    const hasInstruction = this.instructionKeywords.some(kw => lowerLine.includes(kw));
    if (hasInstruction) {
      return 'instruction';
    }
    
    // Kiểm tra chẩn đoán
    const hasDiagnosis = this.diagnosisKeywords.some(kw => lowerLine.includes(kw));
    if (hasDiagnosis) {
      return 'diagnosis';
    }
    
    // Kiểm tra thông tin bệnh nhân
    const hasPatientInfo = this.patientInfoKeywords.some(kw => lowerLine.includes(kw));
    if (hasPatientInfo) {
      return 'patient';
    }
    
    return 'other';
  }

  /**
   * Tách text thành các đoạn có ý nghĩa
   */
  splitIntoSegments(text) {
    // Tách theo số thứ tự (1., 2., 3., ...)
    const segments = [];
    const regex = /(\d+\s*\.\s+[^\d]+?)(?=\d+\s*\.|$)/g;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      segments.push(match[1].trim());
    }
    
    // Nếu không tách được theo số, tách theo dấu xuống dòng
    if (segments.length === 0) {
      return text.split('\n').filter(line => line.trim().length > 0);
    }
    
    return segments;
  }

  /**
   * Lọc và phân loại text
   */
  filterAndClassify(text) {
    // Tách text thành các segment
    const segments = this.splitIntoSegments(text);
    
    const classified = {
      medications: [],
      appointments: [],
      instructions: [],
      diagnosis: [],
      patient: [],
      other: []
    };
    
    let stats = {
      total: segments.length,
      medication: 0,
      appointment: 0,
      instruction: 0,
      diagnosis: 0,
      patient: 0,
      skipped: 0,
      other: 0
    };
    
    for (const segment of segments) {
      const type = this.classifyLine(segment);
      
      if (type === 'skip') {
        stats.skipped++;
        continue;
      }
      
      const trimmedSegment = segment.trim();
      
      // Giới hạn độ dài mỗi segment (tránh quá dài)
      const maxLength = 500;
      const finalSegment = trimmedSegment.length > maxLength 
        ? trimmedSegment.substring(0, maxLength) + '...'
        : trimmedSegment;
      
      switch (type) {
        case 'medication':
          classified.medications.push(finalSegment);
          stats.medication++;
          break;
        case 'appointment':
          classified.appointments.push(finalSegment);
          stats.appointment++;
          break;
        case 'instruction':
          classified.instructions.push(finalSegment);
          stats.instruction++;
          break;
        case 'diagnosis':
          classified.diagnosis.push(finalSegment);
          stats.diagnosis++;
          break;
        case 'patient':
          classified.patient.push(finalSegment);
          stats.patient++;
          break;
        default:
          // Bỏ qua "other" để giảm kích thước
          stats.other++;
      }
    }
    
    return { classified, stats };
  }

  /**
   * Tạo text đã lọc chỉ với thông tin quan trọng
   * Giới hạn số lượng để tránh quá dài
   */
  createFilteredText(classified) {
    let filtered = '';
    
    // Thông tin bệnh nhân (chỉ lấy 3 dòng đầu)
    if (classified.patient.length > 0) {
      filtered += '=== THÔNG TIN BỆNH NHÂN ===\n';
      filtered += classified.patient.slice(0, 3).join('\n') + '\n\n';
    }
    
    // Chẩn đoán (chỉ lấy 5 dòng đầu)
    if (classified.diagnosis.length > 0) {
      filtered += '=== CHẨN ĐOÁN ===\n';
      filtered += classified.diagnosis.slice(0, 5).join('\n') + '\n\n';
    }
    
    // Thuốc (chỉ lấy 15 loại đầu tiên)
    if (classified.medications.length > 0) {
      filtered += '=== THUỐC (Top 15) ===\n';
      filtered += classified.medications.slice(0, 15).join('\n') + '\n\n';
      if (classified.medications.length > 15) {
        filtered += `... và ${classified.medications.length - 15} loại thuốc khác\n\n`;
      }
    }
    
    // Lịch khám
    if (classified.appointments.length > 0) {
      filtered += '=== LỊCH KHÁM ===\n';
      filtered += classified.appointments.join('\n') + '\n\n';
    }
    
    // Lời dặn
    if (classified.instructions.length > 0) {
      filtered += '=== LỜI DẶN ===\n';
      filtered += classified.instructions.join('\n') + '\n\n';
    }
    
    return filtered;
  }

  /**
   * Xử lý toàn bộ: phân tích và lọc
   */
  process(text) {
    console.log('🔍 Bắt đầu lọc thông tin...');
    
    const { classified, stats } = this.filterAndClassify(text);
    const filteredText = this.createFilteredText(classified);
    
    const originalLength = text.length;
    const filteredLength = filteredText.length;
    const reductionRate = Math.round((1 - filteredLength / originalLength) * 100);
    
    console.log('\n📊 Thống kê lọc:');
    console.log(`   Tổng dòng: ${stats.total}`);
    console.log(`   💊 Thuốc: ${stats.medication} dòng`);
    console.log(`   📅 Lịch khám: ${stats.appointment} dòng`);
    console.log(`   📝 Lời dặn: ${stats.instruction} dòng`);
    console.log(`   🏥 Chẩn đoán: ${stats.diagnosis} dòng`);
    console.log(`   👤 Bệnh nhân: ${stats.patient} dòng`);
    console.log(`   ⏭️  Bỏ qua: ${stats.skipped} dòng`);
    console.log(`   📄 Khác: ${stats.other} dòng`);
    console.log(`\n   Giảm: ${originalLength} → ${filteredLength} ký tự (${reductionRate}%)`);
    
    return {
      filteredText,
      classified,
      stats: {
        ...stats,
        originalLength,
        filteredLength,
        reductionRate
      }
    };
  }
}

module.exports = new SmartFilterService();
