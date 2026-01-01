/**
 * Duplicate Checker Service - Kiểm tra trùng lặp thuốc và lịch khám
 */

class DuplicateCheckerService {
  /**
   * Chuẩn hóa tên thuốc để so sánh
   */
  normalizeMedicationName(name) {
    if (!name) return '';
    return name.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Kiểm tra 2 thuốc có giống nhau không
   */
  isSameMedication(med1, med2) {
    // So sánh tên (chuẩn hóa)
    const name1 = this.normalizeMedicationName(med1.name);
    const name2 = this.normalizeMedicationName(med2.name);
    
    if (name1 !== name2) return false;
    
    // So sánh liều lượng (nếu có)
    const dosage1 = (med1.dosage || []).join('').toLowerCase();
    const dosage2 = (med2.dosage || []).join('').toLowerCase();
    
    // Nếu cả 2 đều có liều lượng, phải giống nhau
    if (dosage1 && dosage2 && dosage1 !== dosage2) {
      return false;
    }
    
    return true;
  }

  /**
   * Tìm thuốc trùng lặp trong danh sách
   */
  findDuplicateMedications(medications) {
    const duplicates = [];
    const seen = new Map();
    
    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      const normalizedName = this.normalizeMedicationName(med.name);
      
      if (seen.has(normalizedName)) {
        // Tìm thấy trùng lặp
        const originalIndex = seen.get(normalizedName);
        duplicates.push({
          original: medications[originalIndex],
          duplicate: med,
          originalIndex: originalIndex,
          duplicateIndex: i
        });
      } else {
        seen.set(normalizedName, i);
      }
    }
    
    return duplicates;
  }

  /**
   * Loại bỏ thuốc trùng lặp (giữ lại cái đầu tiên)
   */
  removeDuplicateMedications(medications) {
    const unique = [];
    const seen = new Set();
    
    for (const med of medications) {
      const normalizedName = this.normalizeMedicationName(med.name);
      
      if (!seen.has(normalizedName)) {
        unique.push(med);
        seen.add(normalizedName);
      }
    }
    
    return unique;
  }

  /**
   * Kiểm tra 2 lịch khám có giống nhau không
   */
  isSameAppointment(apt1, apt2) {
    // So sánh loại
    if (apt1.type !== apt2.type) return false;
    
    // So sánh ngày (nếu có)
    if (apt1.date && apt2.date && apt1.date !== apt2.date) {
      return false;
    }
    
    // So sánh giờ (nếu có)
    if (apt1.time && apt2.time && apt1.time !== apt2.time) {
      return false;
    }
    
    return true;
  }

  /**
   * Tìm lịch khám trùng lặp
   */
  findDuplicateAppointments(appointments) {
    const duplicates = [];
    
    for (let i = 0; i < appointments.length; i++) {
      for (let j = i + 1; j < appointments.length; j++) {
        if (this.isSameAppointment(appointments[i], appointments[j])) {
          duplicates.push({
            original: appointments[i],
            duplicate: appointments[j],
            originalIndex: i,
            duplicateIndex: j
          });
        }
      }
    }
    
    return duplicates;
  }

  /**
   * Loại bỏ lịch khám trùng lặp
   */
  removeDuplicateAppointments(appointments) {
    const unique = [];
    
    for (let i = 0; i < appointments.length; i++) {
      let isDuplicate = false;
      
      for (let j = 0; j < unique.length; j++) {
        if (this.isSameAppointment(appointments[i], unique[j])) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        unique.push(appointments[i]);
      }
    }
    
    return unique;
  }

  /**
   * Kiểm tra và báo cáo trùng lặp
   */
  checkDuplicates(data) {
    const report = {
      medications: {
        total: data.medications.length,
        duplicates: [],
        unique: 0
      },
      appointments: {
        total: data.appointments.length,
        duplicates: [],
        unique: 0
      }
    };
    
    // Kiểm tra thuốc
    report.medications.duplicates = this.findDuplicateMedications(data.medications);
    report.medications.unique = data.medications.length - report.medications.duplicates.length;
    
    // Kiểm tra lịch khám
    report.appointments.duplicates = this.findDuplicateAppointments(data.appointments);
    report.appointments.unique = data.appointments.length - report.appointments.duplicates.length;
    
    return report;
  }

  /**
   * Làm sạch dữ liệu (loại bỏ trùng lặp)
   */
  cleanData(data) {
    return {
      ...data,
      medications: this.removeDuplicateMedications(data.medications),
      appointments: this.removeDuplicateAppointments(data.appointments)
    };
  }
}

module.exports = new DuplicateCheckerService();
