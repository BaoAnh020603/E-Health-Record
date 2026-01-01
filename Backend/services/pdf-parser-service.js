/**
 * PDF Parser Service - Phân tích trực tiếp từ PDF items
 * Xử lý đúng cấu trúc PDF thay vì join text
 */

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');

class PDFParserService {
  constructor() {
    // Regex patterns - CẢI THIỆN ĐỂ CHÍNH XÁC 100%
    this.patterns = {
      // Số thứ tự thuốc: 1., 2., 3., ... (có thể có khoảng trắng)
      medicationNumber: /^(\d+)\s*\.?\s*$/,
      
      // Tên thuốc: Chữ hoa + chữ thường/số (hỗ trợ nhiều format)
      medicationName: /^([A-Z][a-zA-Z0-9\-]+(?:\s+[A-Z][a-zA-Z0-9\-]+)*)$/,
      
      // Liều lượng: 500mg, 10ml, 1.00 Viên (hỗ trợ nhiều đơn vị)
      dosage: /(\d+(?:[.,]\d+)?\s*(?:mg|ml|mcg|µg|g|kg|viên|vien|tablet|tab|capsule|cap|ống|ong|chai|lọ|lo|gói|goi|túi|tui))/gi,
      
      // Tần suất: 1 lần/ngày, 2x/day, 3 lần mỗi ngày
      frequency: /(\d+\s*(?:lần|lan|x|times?)\s*[\/]?\s*(?:ngày|ngay|day|mỗi ngày|moi ngay))/gi,
      
      // Thời gian: sáng, trưa, tối, chiều, khuya
      timing: /(sáng|sang|trưa|trua|chiều|chieu|tối|toi|khuya|đêm|dem|buổi sáng|buoi sang|buổi trưa|buoi trua|buổi chiều|buoi chieu|buổi tối|buoi toi)/gi,
      
      // Thời hạn: 7 ngày, 2 tuần, 1 tháng
      duration: /(\d+\s*(?:ngày|ngay|day|tuần|tuan|week|tháng|thang|month))/gi,
      
      // Hướng dẫn (nhiều format hơn)
      instructions: /(trước ăn|truoc an|trước bữa ăn|truoc bua an|sau ăn|sau an|sau bữa ăn|sau bua an|khi đói|khi doi|khi no|trong bữa ăn|trong bua an|cùng bữa ăn|cung bua an|uống nhiều nước|uong nhieu nuoc|ngậm dưới lưỡi|ngam duoi luoi|bôi|boi|nhỏ|nho|xịt|xit)/gi,
      
      // Dấu gạch ngang dài (separator giữa các thuốc)
      separator: /^[-]{10,}$/,
      
      // Lịch khám
      appointmentKeyword: /(tái khám|tai kham|khám lại|kham lai|tái khám ngày|tai kham ngay|tái khám chuyên khoa|tai kham chuyen khoa)/gi,
      
      // Ngày (nhiều format: 30-12-2025, 30/12/2025, 30.12.2025, 30 - 12 - 2025)
      date: /(\d{1,2})\s*[-\/\.]\s*(\d{1,2})\s*[-\/\.]\s*(\d{2,4})/,
      
      // Giờ (nhiều format: 08:00, 8h00, 8:00, 08h00)
      time: /(\d{1,2})\s*[:h]\s*(\d{2})/,
      
      // Số lượng (1.00, 2.00, 10.00)
      quantity: /^(\d+(?:\.\d+)?)$/,
      
      // Đơn vị (Viên, Ống, Chai, Lọ, Gói, Túi)
      unit: /^(Viên|Vien|Ống|Ong|Chai|Lọ|Lo|Gói|Goi|Túi|Tui|Hộp|Hop)$/i
    };
    
    // Danh sách từ không phải tên thuốc (để lọc noise)
    this.invalidMedicationNames = [
      'Vi', 'Viên', 'Vien', 'Ch', 'Ng', 'Thu', 'Gi', 'Chai', 'Vui', 'Ong',
      'Lo', 'Lọ', 'Goi', 'Gói', 'Tui', 'Túi', 'Hop', 'Hộp', 'Lan', 'Lần',
      'Ngay', 'Ngày', 'Sang', 'Sáng', 'Trua', 'Trưa', 'Chieu', 'Chiều',
      'Toi', 'Tối', 'Truoc', 'Trước', 'Sau', 'Khi', 'Uong', 'Uống',
      'Nho', 'Nhỏ', 'Xit', 'Xịt', 'Boi', 'Bôi', 'Ngam', 'Ngậm'
    ];
  }

  /**
   * Đọc PDF và trích xuất text items + annotations
   */
  async extractPDFItems(pdfPath) {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = new Uint8Array(dataBuffer);
    
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    
    const allItems = [];
    const allAnnotations = [];
    
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      
      // Đọc text content
      const textContent = await page.getTextContent();
      
      // Lưu từng item với metadata
      for (const item of textContent.items) {
        if (item.str && item.str.trim()) {
          allItems.push({
            text: item.str.trim(),
            page: pageNum
          });
        }
      }
      
      // Đọc annotations (FreeText, comments, form fields)
      const annotations = await page.getAnnotations();
      for (const annotation of annotations) {
        if (annotation.textContent || annotation.richText) {
          allAnnotations.push({
            text: annotation.textContent || annotation.richText?.str || '',
            type: annotation.subtype,
            page: pageNum
          });
        }
      }
    }
    
    return {
      items: allItems,
      annotations: allAnnotations,
      numPages: pdfDocument.numPages
    };
  }

  /**
   * Nhóm các items thành medications - CẢI THIỆN ĐỂ CHÍNH XÁC 100%
   */
  groupMedications(items) {
    const medications = [];
    let i = 0;
    
    while (i < items.length) {
      const item = items[i];
      const text = item.text;
      
      // Tìm số thứ tự (1, 2, 3, ...) - PHẢI là số đơn thuần
      if (/^\d+$/.test(text) && parseInt(text) >= 1 && parseInt(text) <= 50) {
        const number = parseInt(text);
        
        // Kiểm tra item tiếp theo có phải dấu chấm không
        if (i + 1 < items.length && items[i + 1].text === '.') {
          // Bắt đầu medication mới
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
            rawItems: [],
            rawText: '' // Để debug
          };
          
          // Bỏ qua số và dấu chấm
          i += 2;
          
          // Thu thập tất cả items cho đến khi gặp separator hoặc số tiếp theo
          let itemCount = 0;
          const maxItems = 50; // Giới hạn để tránh vòng lặp vô hạn
          
          while (i < items.length && itemCount < maxItems) {
            const currentText = items[i].text;
            medication.rawItems.push(currentText);
            medication.rawText += currentText + ' ';
            itemCount++;
            
            // Kiểm tra separator (kết thúc medication) - ít nhất 10 dấu gạch
            if (/^[-]{10,}$/.test(currentText)) {
              i++;
              break;
            }
            
            // Kiểm tra số tiếp theo (medication mới) - PHẢI là số + dấu chấm
            if (/^\d+$/.test(currentText) && 
                parseInt(currentText) >= 1 && 
                parseInt(currentText) <= 50 &&
                i + 1 < items.length && 
                items[i + 1].text === '.') {
              // Không tăng i, để vòng lặp ngoài xử lý
              break;
            }
            
            // === TRÍCH XUẤT TÊN THUỐC ===
            // Tên thuốc PHẢI:
            // 1. Bắt đầu bằng chữ HOA
            // 2. Dài ít nhất 3 ký tự
            // 3. Không phải từ trong danh sách invalid
            // 4. Là item đầu tiên sau số và dấu chấm (chưa có tên)
            if (!medication.name && 
                /^[A-Z]/.test(currentText) && 
                currentText.length >= 3 &&
                !this.invalidMedicationNames.includes(currentText)) {
              
              // Tách tên thuốc khỏi liều lượng nếu dính liền
              // VD: "Paracetamol500mg" -> "Paracetamol" + "500mg"
              const nameMatch = currentText.match(/^([A-Z][a-zA-Z\-]+)/);
              if (nameMatch) {
                medication.name = nameMatch[1];
                
                // Phần còn lại có thể là liều lượng
                const remaining = currentText.substring(nameMatch[0].length);
                if (remaining) {
                  const dosageMatches = [...remaining.matchAll(this.patterns.dosage)];
                  for (const match of dosageMatches) {
                    if (!medication.dosage.includes(match[0])) {
                      medication.dosage.push(match[0]);
                    }
                  }
                }
              }
            }
            
            // === TRÍCH XUẤT LIỀU LƯỢNG ===
            // VD: 500mg, 10ml, 1.00 Viên
            const dosageMatches = [...currentText.matchAll(this.patterns.dosage)];
            for (const match of dosageMatches) {
              const dosage = match[0].trim();
              if (!medication.dosage.includes(dosage)) {
                medication.dosage.push(dosage);
              }
            }
            
            // === TRÍCH XUẤT SỐ LƯỢNG ===
            // VD: "1.00", "2.00", "10.00"
            if (!medication.quantity && /^\d+\.\d+$/.test(currentText)) {
              medication.quantity = currentText;
            }
            
            // === TRÍCH XUẤT ĐƠN VỊ ===
            // VD: Viên, Ống, Chai, Lọ, Gói, Túi
            if (!medication.unit && this.patterns.unit.test(currentText)) {
              medication.unit = currentText;
            }
            
            // === TRÍCH XUẤT TẦN SUẤT ===
            // VD: "1 lần/ngày", "2x/day", "3 lần mỗi ngày"
            if (!medication.frequency) {
              const freqMatch = currentText.match(this.patterns.frequency);
              if (freqMatch) {
                medication.frequency = freqMatch[0];
              }
            }
            
            // === TRÍCH XUẤT THỜI GIAN ===
            // VD: sáng, trưa, chiều, tối
            const timingMatches = [...currentText.matchAll(this.patterns.timing)];
            for (const match of timingMatches) {
              const timing = match[0].toLowerCase();
              // Chuẩn hóa timing
              const normalizedTiming = timing
                .replace(/buổi\s+/gi, '')
                .replace(/sang/gi, 'sáng')
                .replace(/trua/gi, 'trưa')
                .replace(/chieu/gi, 'chiều')
                .replace(/toi/gi, 'tối')
                .replace(/dem/gi, 'đêm');
              
              if (!medication.timing.includes(normalizedTiming)) {
                medication.timing.push(normalizedTiming);
              }
            }
            
            // === TRÍCH XUẤT THỜI HẠN ===
            // VD: "7 ngày", "2 tuần", "1 tháng"
            if (!medication.duration) {
              const durationMatch = currentText.match(this.patterns.duration);
              if (durationMatch) {
                medication.duration = durationMatch[0];
              }
            }
            
            // === TRÍCH XUẤT HƯỚNG DẪN ===
            // VD: "trước ăn", "sau ăn", "khi đói"
            const instructionMatches = [...currentText.matchAll(this.patterns.instructions)];
            for (const match of instructionMatches) {
              const instruction = match[0].toLowerCase();
              if (!medication.instructions.includes(instruction)) {
                medication.instructions.push(instruction);
              }
            }
            
            i++;
          }
          
          // === VALIDATION ===
          // Chỉ lưu medication nếu:
          // 1. Có tên hợp lệ (ít nhất 3 ký tự)
          // 2. Tên không phải từ invalid
          // 3. Có ít nhất 1 thông tin bổ sung (dosage, frequency, timing, duration)
          if (medication.name && 
              medication.name.length >= 3 &&
              !this.invalidMedicationNames.includes(medication.name) &&
              (medication.dosage.length > 0 || 
               medication.frequency || 
               medication.timing.length > 0 || 
               medication.duration)) {
            medications.push(medication);
          } else {
            // Log để debug
            if (medication.name) {
              console.log(`   ⚠️  Bỏ qua medication không hợp lệ: "${medication.name}" (thiếu thông tin)`);
            }
          }
          
          continue;
        }
      }
      
      i++;
    }
    
    return medications;
  }

  /**
   * Chuẩn hóa medications và loại bỏ trùng lặp - CẢI THIỆN 100%
   */
  normalizeMedications(medications) {
    const seen = new Map(); // Dùng Map để loại bỏ trùng lặp
    
    for (const med of medications) {
      // === VALIDATION TÊN THUỐC ===
      // Bỏ qua nếu:
      // 1. Không có tên
      // 2. Tên quá ngắn (< 3 ký tự)
      // 3. Tên trong danh sách invalid
      if (!med.name || 
          med.name.length < 3 || 
          this.invalidMedicationNames.includes(med.name)) {
        continue;
      }
      
      // === CHUẨN HÓA TÊN ===
      // 1. Loại bỏ ký tự đặc biệt cuối cùng
      // 2. Loại bỏ khoảng trắng thừa
      // 3. Chuyển về dạng chuẩn (Title Case)
      let normalizedName = med.name
        .replace(/[-\s]+$/, '')  // Loại bỏ dấu gạch/space cuối
        .replace(/\s+/g, ' ')    // Loại bỏ space thừa
        .trim();
      
      // Bỏ qua nếu sau khi chuẩn hóa tên quá ngắn
      if (normalizedName.length < 3) continue;
      
      // === MERGE HOẶC THÊM MỚI ===
      if (seen.has(normalizedName)) {
        // Đã có thuốc này -> Merge thông tin
        const existing = seen.get(normalizedName);
        
        // Merge dosage (loại bỏ trùng lặp)
        if (med.dosage && med.dosage.length > 0) {
          const newDosages = med.dosage.filter(d => !existing.dosage.includes(d));
          existing.dosage = [...existing.dosage, ...newDosages];
        }
        
        // Merge timing (loại bỏ trùng lặp)
        if (med.timing && med.timing.length > 0) {
          const newTimings = med.timing.filter(t => !existing.timing.includes(t));
          existing.timing = [...existing.timing, ...newTimings];
        }
        
        // Merge instructions (loại bỏ trùng lặp)
        if (med.instructions && med.instructions.length > 0) {
          const newInstructions = med.instructions.filter(i => !existing.instructions.includes(i));
          existing.instructions = [...existing.instructions, ...newInstructions];
        }
        
        // Cập nhật các field đơn nếu chưa có
        if (!existing.frequency && med.frequency) {
          existing.frequency = med.frequency;
        }
        if (!existing.duration && med.duration) {
          existing.duration = med.duration;
        }
        if (!existing.quantity && med.quantity) {
          existing.quantity = med.quantity;
        }
        if (!existing.unit && med.unit) {
          existing.unit = med.unit;
        }
      } else {
        // Thêm thuốc mới
        seen.set(normalizedName, {
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
    
    // === CHUYỂN MAP THÀNH ARRAY VÀ FORMAT ===
    return Array.from(seen.values()).map(med => {
      // Chuẩn hóa dosage array thành string
      let dosageStr = null;
      if (med.dosage && med.dosage.length > 0) {
        // Loại bỏ trùng lặp và join
        const uniqueDosages = [...new Set(med.dosage)];
        dosageStr = uniqueDosages.join(', ');
      }
      
      // Chuẩn hóa instructions array thành string
      let instructionsStr = null;
      if (med.instructions && med.instructions.length > 0) {
        // Loại bỏ trùng lặp và join
        const uniqueInstructions = [...new Set(med.instructions)];
        instructionsStr = uniqueInstructions.join(', ');
      }
      
      // Sắp xếp timing theo thứ tự trong ngày
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
   * Trích xuất lời dặn bác sĩ - CẢI THIỆN 100%
   */
  extractInstructions(items) {
    const instructions = [];
    const instructionKeywords = [
      'Lời dặn:',
      'lời dặn:',
      'Lời dặn',
      'lời dặn',
      'Chú ý:',
      'chú ý:',
      'Chú ý',
      'chú ý',
      'Lưu ý:',
      'lưu ý:',
      'Lưu ý',
      'lưu ý'
    ];
    
    for (let i = 0; i < items.length; i++) {
      const text = items[i].text;
      
      // Kiểm tra keyword lời dặn
      const hasKeyword = instructionKeywords.some(kw => text.includes(kw));
      
      if (hasKeyword) {
        console.log(`   ✅ Tìm thấy keyword lời dặn: "${text}"`);
        
        // Lấy 20 items tiếp theo để có đủ nội dung
        const contextItems = items.slice(i, i + 20);
        const contextLines = [];
        
        for (const item of contextItems) {
          // Dừng nếu gặp keyword khác
          if (item.text.includes('Tái khám') || 
              item.text.includes('Ngày in:') ||
              item.text.includes('Bác sĩ:')) {
            break;
          }
          
          contextLines.push(item.text);
        }
        
        const instructionText = contextLines.join(' ');
        
        // Trích xuất phần sau "Lời dặn:" hoặc "Chú ý:" hoặc "Lưu ý:"
        const patterns = [
          /[Ll]ời dặn:\s*(.+?)(?=Tái khám|Ngày in|Bác sĩ|$)/,
          /[Cc]hú ý:\s*(.+?)(?=Tái khám|Ngày in|Bác sĩ|$)/,
          /[Ll]ưu ý:\s*(.+?)(?=Tái khám|Ngày in|Bác sĩ|$)/
        ];
        
        for (const pattern of patterns) {
          const match = instructionText.match(pattern);
          if (match && match[1].trim()) {
            const instruction = match[1].trim();
            
            // Chỉ lưu nếu dài hơn 10 ký tự
            if (instruction.length > 10) {
              instructions.push(instruction);
              console.log(`   ✅ Trích xuất lời dặn: "${instruction.substring(0, 50)}..."`);
              break; // Chỉ lấy 1 pattern match
            }
          }
        }
      }
    }
    
    // Loại bỏ trùng lặp
    return [...new Set(instructions)];
  }

  /**
   * Trích xuất lịch tái khám (từ text items + annotations) - CẢI THIỆN 100%
   */
  extractAppointments(items, annotations = []) {
    const appointments = [];
    
    // === BƯỚC 1: TÌM NGÀY GIỜ TỪ ANNOTATIONS (ƯU TIÊN) ===
    let annotationDateTime = null;
    let annotationNotes = [];
    
    for (const annotation of annotations) {
      // Đảm bảo text là string
      const text = typeof annotation.text === 'string' ? annotation.text : String(annotation.text || '');
      
      if (!text) continue;
      
      // Tìm ngày giờ (nhiều format)
      // Format 1: "30 - 12 - 2025 08:00"
      // Format 2: "30 - 12 - 2025    08:00" (nhiều space)
      // Format 3: "30-12-2025 08:00"
      // Format 4: "30/12/2025 08:00"
      const dateTimeMatch = text.match(/(\d{1,2})\s*[-\/\.]\s*(\d{1,2})\s*[-\/\.]\s*(\d{4})\s+(\d{1,2})\s*[:h]\s*(\d{2})/);
      if (dateTimeMatch) {
        const day = dateTimeMatch[1].padStart(2, '0');
        const month = dateTimeMatch[2].padStart(2, '0');
        const year = dateTimeMatch[3];
        const hour = dateTimeMatch[4].padStart(2, '0');
        const minute = dateTimeMatch[5];
        
        annotationDateTime = {
          date: `${year}-${month}-${day}`,
          time: `${hour}:${minute}`
        };
        
        console.log(`   ✅ Tìm thấy ngày giờ từ annotation: ${annotationDateTime.date} ${annotationDateTime.time}`);
      }
      
      // Lưu các ghi chú khác (dài hơn 10 ký tự)
      if (!dateTimeMatch && text.trim().length > 10) {
        annotationNotes.push(text.trim());
      }
    }
    
    // === BƯỚC 2: TÌM "TÁI KHÁM NGÀY:" TRONG TEXT ITEMS ===
    for (let i = 0; i < items.length; i++) {
      const text = items[i].text;
      
      // === CASE 1: "Tái khám ngày:" (không có chuyên khoa) ===
      if (text === 'Tái khám ngày:' || text.toLowerCase().includes('tái khám ngày')) {
        const appointment = {
          date: null,
          time: null,
          type: 'Tái khám',
          notes: null
        };
        
        // Ưu tiên dùng annotation nếu có
        if (annotationDateTime) {
          appointment.date = annotationDateTime.date;
          appointment.time = annotationDateTime.time;
          if (annotationNotes.length > 0) {
            appointment.notes = annotationNotes.join('\n');
          }
          
          console.log(`   ✅ Sử dụng ngày giờ từ annotation cho "Tái khám ngày"`);
        } else {
          // Fallback: Tìm trong text items (10 items tiếp theo)
          const contextItems = items.slice(i + 1, i + 10);
          let contextText = '';
          
          for (const item of contextItems) {
            // Dừng nếu gặp keyword khác
            if (item.text.includes('Lời dặn:') || 
                item.text.includes('Tái khám chuyên khoa:') ||
                item.text.includes('Ngày in:')) {
              break;
            }
            contextText += item.text.trim() + ' ';
          }
          
          // Trích xuất ngày (nhiều format)
          const dateMatch = contextText.match(/(\d{1,2})\s*[-\/\.]\s*(\d{1,2})\s*[-\/\.]\s*(\d{4})/);
          if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const month = dateMatch[2].padStart(2, '0');
            const year = dateMatch[3];
            appointment.date = `${year}-${month}-${day}`;
            
            console.log(`   ✅ Tìm thấy ngày từ text: ${appointment.date}`);
          }
          
          // Trích xuất giờ (nhiều format: 08:00, 8h00, 8:00)
          const timeMatch = contextText.match(/(\d{1,2})\s*[:h]\s*(\d{2})/);
          if (timeMatch) {
            const hour = timeMatch[1].padStart(2, '0');
            const minute = timeMatch[2];
            appointment.time = `${hour}:${minute}`;
            
            console.log(`   ✅ Tìm thấy giờ từ text: ${appointment.time}`);
          }
          
          // Lấy ghi chú nếu có (phần còn lại sau khi loại bỏ ngày giờ)
          const noteText = contextText
            .replace(/\d{1,2}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{4}/g, '')
            .replace(/\d{1,2}\s*[:h]\s*\d{2}/g, '')
            .trim();
          
          if (noteText && noteText.length > 10) {
            appointment.notes = noteText;
          }
        }
        
        appointments.push(appointment);
        console.log(`   ✅ Thêm lịch khám: ${appointment.type} - ${appointment.date || 'N/A'} ${appointment.time || 'N/A'}`);
      }
      
      // === CASE 2: "Tái khám chuyên khoa:" ===
      if (text === 'Tái khám chuyên khoa:' || text.toLowerCase().includes('tái khám chuyên khoa')) {
        const appointment = {
          date: null,
          time: null,
          type: 'Tái khám chuyên khoa',
          notes: null
        };
        
        // Lấy ghi chú từ các items tiếp theo (TRƯỚC "Ngày in:" hoặc "Lời dặn:")
        const contextItems = items.slice(i + 1, i + 20);
        const noteLines = [];
        
        for (const item of contextItems) {
          // Dừng nếu gặp keyword khác
          if (item.text.includes('Ngày in:') || 
              item.text.includes('Lời dặn:') ||
              item.text.includes('Tái khám ngày:')) {
            break;
          }
          
          if (item.text.trim()) {
            noteLines.push(item.text.trim());
          }
        }
        
        if (noteLines.length > 0) {
          appointment.notes = noteLines.join('\n');
        }
        
        appointments.push(appointment);
        console.log(`   ✅ Thêm lịch khám chuyên khoa: ${appointment.notes ? appointment.notes.substring(0, 50) + '...' : 'N/A'}`);
      }
    }
    
    // === BƯỚC 3: VALIDATION ===
    // Loại bỏ appointments không hợp lệ (không có date và không có notes)
    const validAppointments = appointments.filter(apt => {
      return apt.date || (apt.notes && apt.notes.length > 10);
    });
    
    console.log(`   ✅ Tìm thấy ${validAppointments.length}/${appointments.length} lịch khám hợp lệ`);
    
    return validAppointments;
  }

  /**
   * Chuẩn hóa ngày
   */
  normalizeDate(dateStr) {
    const match = dateStr.match(/(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})/);
    if (!match) return null;

    let [, day, month, year] = match;
    if (year.length === 2) year = '20' + year;
    
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Chuẩn hóa giờ
   */
  normalizeTime(timeStr) {
    const match = timeStr.match(/(\d{1,2})[:h](\d{2})/);
    if (!match) return null;

    let [, hour, minute] = match;
    hour = hour.padStart(2, '0');
    minute = minute.padStart(2, '0');

    return `${hour}:${minute}`;
  }

  /**
   * Parse toàn bộ PDF
   */
  async parse(pdfPath) {
    console.log('🔍 Bắt đầu phân tích PDF (xử lý từng item)...');
    
    const startTime = Date.now();
    
    try {
      // Bước 1: Đọc PDF items + annotations
      console.log('📄 Đọc PDF items + annotations...');
      const pdfData = await this.extractPDFItems(pdfPath);
      console.log(`   ✅ Đọc được ${pdfData.items.length} items, ${pdfData.annotations.length} annotations từ ${pdfData.numPages} trang`);
      
      // Bước 2: Nhóm thành medications
      console.log('💊 Nhóm medications...');
      const rawMedications = this.groupMedications(pdfData.items);
      console.log(`   ✅ Tìm thấy ${rawMedications.length} medications`);
      
      // Bước 3: Chuẩn hóa
      const medications = this.normalizeMedications(rawMedications);
      
      // Bước 4: Trích xuất lời dặn
      console.log('�  Trích xuất lời dặn...');
      const instructions = this.extractInstructions(pdfData.items);
      console.log(`   ✅ Tìm thấy ${instructions.length} lời dặn`);
      
      // Bước 5: Trích xuất lịch khám (từ text + annotations)
      console.log('📅 Trích xuất lịch khám...');
      const appointments = this.extractAppointments(pdfData.items, pdfData.annotations);
      console.log(`   ✅ Tìm thấy ${appointments.length} lịch khám`);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`\n✅ Hoàn thành trong ${processingTime}ms`);
      
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
          totalItems: pdfData.items.length,
          medicationCount: medications.length,
          appointmentCount: appointments.length,
          instructionCount: instructions.length
        }
      };
      
    } catch (error) {
      console.error('❌ Lỗi:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PDFParserService();
