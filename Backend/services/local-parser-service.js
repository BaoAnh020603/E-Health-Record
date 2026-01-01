/**
 * Local Parser Service - Phân tích đơn thuốc hoàn toàn local
 * Không gọi API, sử dụng regex và pattern matching
 */

class LocalParserService {
  constructor() {
    // Regex patterns cho thuốc
    this.medicationPatterns = {
      // Tên thuốc thường có chữ hoa, số, dấu gạch ngang
      name: /([A-Z][a-zA-Z0-9\-]+(?:\s+[A-Z][a-zA-Z0-9\-]+)*)/,
      
      // Liều lượng: 500mg, 10ml, 250mcg, v.v.
      dosage: /(\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|viên|vien|tablet|capsule|ống|chai|lọ))/gi,
      
      // Tần suất: 1 lần/ngày, 2x/day, 3 lần mỗi ngày
      frequency: /(\d+\s*(?:lần|lan|x)\s*[\/]?\s*(?:ngày|ngay|day|mỗi ngày|moi ngay))/gi,
      
      // Thời gian: sáng, trưa, tối, chiều, morning, evening
      timing: /(sáng|sang|trưa|trua|chiều|chieu|tối|toi|đêm|dem|morning|afternoon|evening|night)/gi,
      
      // Thời hạn: 7 ngày, 2 tuần, 1 tháng
      duration: /(\d+\s*(?:ngày|ngay|tuần|tuan|tháng|thang|day|week|month))/gi,
      
      // Hướng dẫn: trước ăn, sau ăn, khi đói, v.v.
      instructions: /(trước ăn|truoc an|sau ăn|sau an|khi đói|khi doi|before meal|after meal|with food)/gi
    };

    // Regex patterns cho lịch khám
    this.appointmentPatterns = {
      // Keywords
      keywords: /(tái khám|tai kham|khám lại|kham lai|hẹn khám|hen kham|follow up|revisit)/gi,
      
      // Ngày: 05/01/2025, 5-1-2025, 05.01.2025
      date: /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/g,
      
      // Giờ: 14:00, 2:30 PM, 14h00
      time: /(\d{1,2}[:h]\d{2}(?:\s*(?:AM|PM|am|pm))?)/gi,
      
      // Bác sĩ: BS., Dr., Bác sĩ
      doctor: /(?:BS\.|Dr\.|Bác sĩ|Bac si)\s*([A-ZĐÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ][a-zđáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵA-ZĐÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ\s]+)/gi
    };

    // Regex patterns cho lời dặn
    this.instructionPatterns = {
      keywords: /(lời dặn|loi dan|chú ý|chu y|hướng dẫn|huong dan|cảnh báo|canh bao|lưu ý|luu y|note|warning|instruction)/gi
    };
  }

  /**
   * Chuẩn hóa text: loại bỏ ký tự đặc biệt, khoảng trắng thừa
   */
  normalizeText(text) {
    return text
      .replace(/\s+/g, ' ')  // Nhiều khoảng trắng -> 1 khoảng trắng
      .replace(/\n+/g, '\n') // Nhiều xuống dòng -> 1 xuống dòng
      .trim();
  }

  /**
   * Tách text thành các dòng có ý nghĩa
   * Cải thiện để xử lý text PDF không có xuống dòng đúng
   * Đặc biệt xử lý format: "1. Thuốc A 2. Thuốc B 3. Thuốc C"
   */
  splitIntoLines(text) {
    let lines = [];
    
    // Tách theo xuống dòng trước
    let rawLines = text.split('\n');
    
    // Với mỗi dòng, tách thêm theo các pattern
    for (const line of rawLines) {
      // Pattern 1: Số thứ tự + dấu chấm + khoảng trắng (1. , 2. , 3. )
      // Đây là pattern chính cho đơn thuốc
      const numberedPattern = /(\d+)\s*\.\s+/g;
      const positions = [];
      let match;
      
      // Tìm tất cả vị trí có số thứ tự
      while ((match = numberedPattern.exec(line)) !== null) {
        positions.push({
          index: match.index,
          number: match[1]
        });
      }
      
      // Nếu có nhiều hơn 1 số thứ tự, tách dòng
      if (positions.length > 1) {
        for (let i = 0; i < positions.length; i++) {
          const start = positions[i].index;
          const end = i < positions.length - 1 ? positions[i + 1].index : line.length;
          const segment = line.substring(start, end).trim();
          if (segment.length > 10) {
            lines.push(segment);
          }
        }
        continue;
      }
      
      // Pattern 2: Tách theo dấu gạch ngang dài (----------)
      const dashSplit = line.split(/[-]{20,}/);
      if (dashSplit.length > 1) {
        for (const segment of dashSplit) {
          if (segment.trim().length > 10) {
            lines.push(segment.trim());
          }
        }
        continue;
      }
      
      // Pattern 3: Tách theo tên thuốc viết hoa (nếu dòng quá dài > 300 ký tự)
      if (line.length > 300) {
        // Tìm các vị trí có tên thuốc (chữ hoa + chữ thường + số)
        const medicationPattern = /([A-Z][a-z]+[A-Z0-9][a-zA-Z0-9\-]*)/g;
        const medPositions = [];
        
        while ((match = medicationPattern.exec(line)) !== null) {
          medPositions.push(match.index);
        }
        
        if (medPositions.length > 1) {
          for (let i = 0; i < medPositions.length; i++) {
            const start = medPositions[i];
            const end = i < medPositions.length - 1 ? medPositions[i + 1] : line.length;
            const segment = line.substring(start, end).trim();
            if (segment.length > 10) {
              lines.push(segment);
            }
          }
          continue;
        }
      }
      
      // Nếu không match pattern nào, giữ nguyên dòng
      if (line.trim().length > 5) {
        lines.push(line.trim());
      }
    }
    
    return lines
      .map(line => this.normalizeText(line))
      .filter(line => line.length > 5); // Bỏ dòng quá ngắn
  }

  /**
   * Trích xuất thông tin thuốc từ một dòng text
   * Cải thiện để xử lý nhiều format khác nhau
   */
  extractMedicationFromLine(line) {
    // Bỏ qua nếu không có số (thuốc thường có liều lượng)
    if (!/\d/.test(line)) {
      return null;
    }

    // Bỏ qua dòng quá ngắn hoặc chỉ có số
    if (line.length < 10 || /^\d+[\s\.\-]*$/.test(line)) {
      return null;
    }

    const medication = {
      name: null,
      dosage: null,
      frequency: null,
      timing: [],
      duration: null,
      instructions: null,
      rawText: line
    };

    // Trích xuất tên thuốc - nhiều pattern khác nhau
    
    // Pattern 1: Số thứ tự + tên thuốc (1. Paracetamol)
    let nameMatch = line.match(/^\s*\d+\s*\.\s*([A-Z][a-zA-Z0-9\-]+(?:\s+[A-Z][a-zA-Z0-9\-]+)*)/);
    
    // Pattern 2: Tên thuốc ở đầu dòng (Paracetamol 500mg)
    if (!nameMatch) {
      nameMatch = line.match(/^([A-Z][a-zA-Z0-9\-]+(?:\s+[A-Z][a-zA-Z0-9\-]+)?)/);
    }
    
    // Pattern 3: Tên thuốc có số liền (Paracetamol500mg -> tách ra)
    if (!nameMatch) {
      nameMatch = line.match(/([A-Z][a-zA-Z]+)(?=\d)/);
    }
    
    if (nameMatch) {
      medication.name = nameMatch[1].trim();
    }

    // Trích xuất liều lượng - nhiều format
    const dosageMatches = line.matchAll(this.medicationPatterns.dosage);
    const dosages = [];
    for (const match of dosageMatches) {
      dosages.push(match[0]);
    }
    if (dosages.length > 0) {
      medication.dosage = dosages.join(', ');
    }

    // Trích xuất tần suất
    const frequencyMatch = line.match(this.medicationPatterns.frequency);
    if (frequencyMatch) {
      medication.frequency = frequencyMatch[0];
    }

    // Trích xuất thời gian uống
    const timingMatches = line.matchAll(this.medicationPatterns.timing);
    for (const match of timingMatches) {
      const timing = match[0].toLowerCase();
      if (!medication.timing.includes(timing)) {
        medication.timing.push(timing);
      }
    }

    // Trích xuất thời hạn
    const durationMatch = line.match(this.medicationPatterns.duration);
    if (durationMatch) {
      medication.duration = durationMatch[0];
    }

    // Trích xuất hướng dẫn
    const instructionsMatch = line.match(this.medicationPatterns.instructions);
    if (instructionsMatch) {
      medication.instructions = instructionsMatch[0];
    }

    // Chỉ trả về nếu có ít nhất tên hoặc liều lượng
    if (medication.name || medication.dosage) {
      return medication;
    }

    return null;
  }

  /**
   * Chuẩn hóa ngày tháng sang YYYY-MM-DD
   */
  normalizeDate(dateStr) {
    // Xử lý format: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const match = dateStr.match(/(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})/);
    if (!match) return null;

    let [, day, month, year] = match;
    
    // Chuyển năm 2 chữ số thành 4 chữ số
    if (year.length === 2) {
      year = '20' + year;
    }

    // Đảm bảo có 2 chữ số
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Chuẩn hóa giờ sang HH:MM
   */
  normalizeTime(timeStr) {
    // Xử lý format: 14:00, 14h00, 2:30 PM
    let match = timeStr.match(/(\d{1,2})[:h](\d{2})/);
    if (!match) return null;

    let [, hour, minute] = match;
    
    // Xử lý AM/PM
    if (/PM/i.test(timeStr) && parseInt(hour) < 12) {
      hour = (parseInt(hour) + 12).toString();
    } else if (/AM/i.test(timeStr) && parseInt(hour) === 12) {
      hour = '00';
    }

    hour = hour.padStart(2, '0');
    minute = minute.padStart(2, '0');

    return `${hour}:${minute}`;
  }

  /**
   * Trích xuất lịch khám từ text
   */
  extractAppointments(text) {
    const appointments = [];
    const lines = this.splitIntoLines(text);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // Kiểm tra có keyword lịch khám không
      if (!this.appointmentPatterns.keywords.test(lowerLine)) {
        continue;
      }

      const appointment = {
        date: null,
        time: null,
        doctor: null,
        location: null,
        notes: null
      };

      // Tìm trong dòng hiện tại và 3 dòng tiếp theo
      const contextLines = lines.slice(i, i + 4).join(' ');

      // Trích xuất ngày
      const dateMatch = contextLines.match(this.appointmentPatterns.date);
      if (dateMatch) {
        appointment.date = this.normalizeDate(dateMatch[0]);
      }

      // Trích xuất giờ
      const timeMatch = contextLines.match(this.appointmentPatterns.time);
      if (timeMatch) {
        appointment.time = this.normalizeTime(timeMatch[0]);
      }

      // Trích xuất bác sĩ
      const doctorMatch = contextLines.match(this.appointmentPatterns.doctor);
      if (doctorMatch && doctorMatch[1]) {
        appointment.doctor = doctorMatch[1].trim();
      }

      // Trích xuất địa điểm (tìm tên bệnh viện, phòng khám)
      const locationMatch = contextLines.match(/(Bệnh viện|Benh vien|Phòng khám|Phong kham|Khoa)\s+([A-ZĐÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ][^\n,\.]{5,50})/i);
      if (locationMatch) {
        appointment.location = locationMatch[0].trim();
      }

      appointment.notes = line;

      // Chỉ thêm nếu có ít nhất ngày hoặc thời gian
      if (appointment.date || appointment.time) {
        appointments.push(appointment);
      }
    }

    return appointments;
  }

  /**
   * Trích xuất lời dặn bác sĩ
   */
  extractInstructions(text) {
    const instructions = [];
    const lines = this.splitIntoLines(text);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // Kiểm tra có keyword lời dặn không
      if (this.instructionPatterns.keywords.test(lowerLine)) {
        // Lấy dòng hiện tại và 2 dòng tiếp theo
        const instructionText = lines.slice(i, i + 3).join(' ');
        instructions.push(instructionText);
      }
    }

    return instructions;
  }

  /**
   * Trích xuất tất cả thuốc từ text
   */
  extractMedications(text) {
    const medications = [];
    const lines = this.splitIntoLines(text);
    const seenNames = new Set(); // Để loại bỏ trùng lặp

    for (const line of lines) {
      const medication = this.extractMedicationFromLine(line);
      
      if (medication && medication.name) {
        // Loại bỏ trùng lặp dựa trên tên
        const normalizedName = medication.name.toLowerCase();
        if (!seenNames.has(normalizedName)) {
          seenNames.add(normalizedName);
          medications.push(medication);
        }
      }
    }

    return medications;
  }

  /**
   * Xử lý toàn bộ text và trả về JSON chuẩn
   */
  parse(text) {
    console.log('🔍 Bắt đầu phân tích local (không gọi API)...');
    
    if (!text || text.length < 50) {
      return {
        success: false,
        error: 'Text quá ngắn (< 50 ký tự)'
      };
    }

    try {
      const startTime = Date.now();

      // Trích xuất thông tin
      const medications = this.extractMedications(text);
      const appointments = this.extractAppointments(text);
      const instructions = this.extractInstructions(text);

      const processingTime = Date.now() - startTime;

      console.log(`✅ Phân tích xong trong ${processingTime}ms`);
      console.log(`   💊 Tìm thấy ${medications.length} loại thuốc`);
      console.log(`   📅 Tìm thấy ${appointments.length} lịch khám`);
      console.log(`   📝 Tìm thấy ${instructions.length} lời dặn`);

      return {
        success: true,
        data: {
          type: 'medication',
          medications: medications,
          appointments: appointments,
          instructions: instructions,
          summary: `Tìm thấy ${medications.length} loại thuốc, ${appointments.length} lịch khám, ${instructions.length} lời dặn`
        },
        stats: {
          processingTime,
          medicationCount: medications.length,
          appointmentCount: appointments.length,
          instructionCount: instructions.length
        }
      };

    } catch (error) {
      console.error('❌ Lỗi phân tích:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new LocalParserService();
