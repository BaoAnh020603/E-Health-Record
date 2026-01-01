/**
 * Prescription Validator Service
 * Kiểm tra xem file có phải đơn thuốc thật không
 */

class PrescriptionValidatorService {
  /**
   * Validate prescription data
   */
  validatePrescription(data) {
    const validation = {
      isValid: false,
      confidence: 0,
      reasons: [],
      warnings: []
    };

    // Check 1: Có thuốc không?
    if (!data.medications || data.medications.length === 0) {
      validation.reasons.push('Không tìm thấy thông tin thuốc');
      validation.confidence = 0;
      return validation;
    }

    let score = 0;
    const maxScore = 100;

    // Check 2: Số lượng thuốc hợp lý (1-50)
    if (data.medications.length >= 1 && data.medications.length <= 50) {
      score += 20;
    } else if (data.medications.length > 50) {
      validation.warnings.push(`Số lượng thuốc quá nhiều (${data.medications.length}). Có thể không phải đơn thuốc.`);
    }

    // Check 3: Thuốc có tên hợp lý
    let validMedicationCount = 0;
    for (const med of data.medications) {
      if (this.isValidMedicationName(med.name)) {
        validMedicationCount++;
      }
    }

    const validMedicationRatio = validMedicationCount / data.medications.length;
    score += validMedicationRatio * 30; // Max 30 points

    if (validMedicationRatio < 0.5) {
      validation.warnings.push('Nhiều tên thuốc không hợp lệ. Có thể không phải đơn thuốc.');
    }

    // Check 4: Có thông tin liều lượng
    let medicationsWithDosage = 0;
    for (const med of data.medications) {
      if (med.dosage && med.dosage.length > 0) {
        medicationsWithDosage++;
      }
    }

    const dosageRatio = medicationsWithDosage / data.medications.length;
    score += dosageRatio * 20; // Max 20 points

    // Check 5: Có lịch khám hoặc lời dặn
    if (data.appointments && data.appointments.length > 0) {
      score += 15;
    }

    if (data.instructions && data.instructions.length > 0) {
      score += 15;
    }

    // Check 6: Từ khóa y tế
    const medicalKeywords = this.findMedicalKeywords(data);
    if (medicalKeywords.length > 0) {
      score += Math.min(medicalKeywords.length * 2, 10); // Max 10 points
    }

    // Calculate confidence
    validation.confidence = Math.round(score);

    // Determine if valid
    if (validation.confidence >= 60) {
      validation.isValid = true;
      validation.reasons.push('Đây là đơn thuốc hợp lệ');
    } else if (validation.confidence >= 40) {
      validation.isValid = true;
      validation.reasons.push('Có thể là đơn thuốc nhưng thiếu thông tin');
      validation.warnings.push('Độ tin cậy thấp. Vui lòng kiểm tra lại.');
    } else {
      validation.isValid = false;
      validation.reasons.push('Không phải đơn thuốc hoặc không đọc được');
      validation.warnings.push('File này có thể không phải đơn thuốc. Vui lòng upload đúng file.');
    }

    return validation;
  }

  /**
   * Check if medication name is valid
   */
  isValidMedicationName(name) {
    if (!name || name.length < 3) return false;

    // Tên thuốc thường bắt đầu bằng chữ hoa
    if (!/^[A-Z]/.test(name)) return false;

    // Tên thuốc không chứa ký tự đặc biệt (trừ dấu gạch ngang)
    if (/[^a-zA-Z0-9\-\s]/.test(name)) return false;

    // Tên thuốc không phải toàn số
    if (/^\d+$/.test(name)) return false;

    // Tên thuốc không quá ngắn hoặc quá dài
    if (name.length < 3 || name.length > 50) return false;

    return true;
  }

  /**
   * Find medical keywords in data
   */
  findMedicalKeywords(data) {
    const keywords = [
      'bác sĩ', 'bác sỹ', 'doctor',
      'bệnh viện', 'hospital',
      'phòng khám', 'clinic',
      'đơn thuốc', 'prescription',
      'tái khám', 'follow up',
      'lời dặn', 'instructions',
      'liều lượng', 'dosage',
      'uống thuốc', 'medication',
      'chẩn đoán', 'diagnosis',
      'triệu chứng', 'symptoms',
      'điều trị', 'treatment'
    ];

    const found = [];
    const allText = JSON.stringify(data).toLowerCase();

    for (const keyword of keywords) {
      if (allText.includes(keyword.toLowerCase())) {
        found.push(keyword);
      }
    }

    return found;
  }

  /**
   * Validate file type
   */
  validateFileType(filename, mimetype) {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `File extension không hợp lệ. Chỉ chấp nhận: ${allowedExtensions.join(', ')}`
      };
    }

    if (!allowedMimeTypes.includes(mimetype)) {
      return {
        valid: false,
        error: `File type không hợp lệ. Chỉ chấp nhận: PDF, JPG, PNG`
      };
    }

    return { valid: true };
  }

  /**
   * Validate file size
   */
  validateFileSize(size, maxSize = 10 * 1024 * 1024) {
    if (size > maxSize) {
      return {
        valid: false,
        error: `File quá lớn (${Math.round(size / 1024 / 1024)}MB). Tối đa ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    if (size < 1024) {
      return {
        valid: false,
        error: 'File quá nhỏ. Có thể bị lỗi.'
      };
    }

    return { valid: true };
  }

  /**
   * Create validation report
   */
  createValidationReport(validation, data) {
    return {
      isValid: validation.isValid,
      confidence: validation.confidence,
      summary: {
        medications: data.medications?.length || 0,
        appointments: data.appointments?.length || 0,
        instructions: data.instructions?.length || 0
      },
      reasons: validation.reasons,
      warnings: validation.warnings,
      recommendation: this.getRecommendation(validation)
    };
  }

  /**
   * Get recommendation based on validation
   */
  getRecommendation(validation) {
    if (validation.confidence >= 80) {
      return 'Đơn thuốc hợp lệ. Bạn có thể tiếp tục tạo lịch nhắc.';
    } else if (validation.confidence >= 60) {
      return 'Đơn thuốc hợp lệ nhưng thiếu một số thông tin. Vui lòng kiểm tra lại.';
    } else if (validation.confidence >= 40) {
      return 'Độ tin cậy thấp. Vui lòng kiểm tra xem đây có phải đơn thuốc không.';
    } else {
      return 'File này có thể không phải đơn thuốc. Vui lòng upload đúng file đơn thuốc.';
    }
  }
}

module.exports = new PrescriptionValidatorService();
