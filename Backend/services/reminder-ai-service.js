/**
 * Reminder AI Service - Tạo lịch nhắc thông minh từ JSON
 * 100% LOCAL - KHÔNG CALL API
 */

class ReminderAIService {
  constructor() {
    // Quy tắc thời gian uống thuốc mặc định
    this.defaultTimings = {
      'sáng': '07:00',
      'sang': '07:00',
      'trưa': '12:00',
      'trua': '12:00',
      'chiều': '17:00',
      'chieu': '17:00',
      'tối': '20:00',
      'toi': '20:00',
      'khuya': '22:00'
    };
    
    // Quy tắc tần suất
    this.frequencyRules = {
      '1 lần/ngày': ['07:00'],
      '2 lần/ngày': ['07:00', '20:00'],
      '3 lần/ngày': ['07:00', '12:00', '20:00'],
      '4 lần/ngày': ['07:00', '12:00', '17:00', '21:00']
    };
  }

  /**
   * Tạo lịch nhắc uống thuốc - CHỈ TẠO KHI CÓ THÔNG TIN
   */
  createMedicationReminders(medication, startDate = new Date()) {
    const reminders = [];
    
    // Xác định thời gian uống thuốc
    let times = [];
    
    // Ưu tiên 1: Từ timing (sáng, trưa, tối)
    if (medication.timing && medication.timing.length > 0) {
      times = medication.timing.map(t => {
        const normalized = t.toLowerCase();
        return this.defaultTimings[normalized] || '08:00';
      });
      console.log(`   ✅ Thuốc "${medication.name}": Có timing - ${medication.timing.join(', ')}`);
    }
    // Ưu tiên 2: Từ frequency (1 lần/ngày, 2 lần/ngày)
    else if (medication.frequency) {
      const freq = medication.frequency.toLowerCase();
      for (const [pattern, timings] of Object.entries(this.frequencyRules)) {
        if (freq.includes(pattern)) {
          times = timings;
          console.log(`   ✅ Thuốc "${medication.name}": Có frequency - ${medication.frequency}`);
          break;
        }
      }
    }
    
    // Nếu không có thông tin → BỎ QUA, không tạo reminder
    if (times.length === 0) {
      return reminders; // Trả về mảng rỗng (im lặng)
    }
    
    // Xác định số ngày uống
    let durationDays = 7; // Mặc định 7 ngày
    if (medication.duration) {
      const match = medication.duration.match(/(\d+)\s*ngày/i);
      if (match) {
        durationDays = parseInt(match[1]);
      }
    }
    
    console.log(`       → Tạo ${times.length} lịch nhắc/ngày x ${durationDays} ngày = ${times.length * durationDays} reminders`);
    
    // Tạo reminder cho từng ngày
    for (let day = 0; day < durationDays; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);
      
      for (const time of times) {
        const [hour, minute] = time.split(':');
        const reminderDate = new Date(date);
        reminderDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
        
        reminders.push({
          type: 'medication',
          medicationName: medication.name,
          dosage: medication.dosage ? (Array.isArray(medication.dosage) ? medication.dosage.join(' ') : String(medication.dosage)) : null,
          quantity: medication.quantity,
          unit: medication.unit,
          datetime: reminderDate.toISOString(),
          date: reminderDate.toISOString().split('T')[0],
          time: time,
          instructions: medication.instructions ? (Array.isArray(medication.instructions) ? medication.instructions.join(', ') : String(medication.instructions)) : null,
          title: `Uống thuốc: ${medication.name}`,
          message: this.generateMedicationMessage(medication, time)
        });
      }
    }
    
    return reminders;
  }

  /**
   * Tạo message cho reminder uống thuốc
   */
  generateMedicationMessage(medication, time) {
    let message = `Đã đến giờ uống thuốc ${medication.name}`;
    
    if (medication.dosage) {
      const dosageStr = Array.isArray(medication.dosage) 
        ? medication.dosage.join(' ') 
        : String(medication.dosage);
      if (dosageStr) {
        message += ` (${dosageStr})`;
      }
    }
    
    if (medication.quantity && medication.unit) {
      message += ` - ${medication.quantity} ${medication.unit}`;
    }
    
    if (medication.instructions) {
      const instructionsStr = Array.isArray(medication.instructions)
        ? medication.instructions.join(', ')
        : String(medication.instructions);
      if (instructionsStr) {
        message += `\n${instructionsStr}`;
      }
    }
    
    return message;
  }

  /**
   * Tạo lịch nhắc tái khám
   */
  createAppointmentReminders(appointment) {
    const reminders = [];
    
    if (!appointment.date) {
      return reminders;
    }
    
    // Parse ngày tái khám
    const appointmentDate = new Date(appointment.date);
    
    // Thêm giờ nếu có
    if (appointment.time) {
      const [hour, minute] = appointment.time.split(':');
      appointmentDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
    } else {
      appointmentDate.setHours(8, 0, 0, 0); // Mặc định 8:00
    }
    
    // Reminder 1: Ngay vào ngày tái khám (trước 1 giờ)
    const onDayReminder = new Date(appointmentDate);
    onDayReminder.setHours(onDayReminder.getHours() - 1);
    
    reminders.push({
      type: 'appointment',
      appointmentType: appointment.type,
      datetime: onDayReminder.toISOString(),
      date: onDayReminder.toISOString().split('T')[0],
      time: `${onDayReminder.getHours().toString().padStart(2, '0')}:${onDayReminder.getMinutes().toString().padStart(2, '0')}`,
      title: `Nhắc tái khám: ${appointment.type}`,
      message: `Bạn có lịch ${appointment.type} lúc ${appointment.time || '08:00'} hôm nay.\n${appointment.notes || ''}`
    });
    
    // Reminder 2: Trước 1 ngày
    const oneDayBefore = new Date(appointmentDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    oneDayBefore.setHours(20, 0, 0, 0); // 8:00 PM
    
    reminders.push({
      type: 'appointment',
      appointmentType: appointment.type,
      datetime: oneDayBefore.toISOString(),
      date: oneDayBefore.toISOString().split('T')[0],
      time: '20:00',
      title: `Nhắc tái khám: ${appointment.type}`,
      message: `Nhắc nhở: Ngày mai bạn có lịch ${appointment.type} lúc ${appointment.time || '08:00'}.\n${appointment.notes || ''}`
    });
    
    // Reminder 3: Trước 3 ngày
    const threeDaysBefore = new Date(appointmentDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    threeDaysBefore.setHours(20, 0, 0, 0);
    
    reminders.push({
      type: 'appointment',
      appointmentType: appointment.type,
      datetime: threeDaysBefore.toISOString(),
      date: threeDaysBefore.toISOString().split('T')[0],
      time: '20:00',
      title: `Nhắc tái khám: ${appointment.type}`,
      message: `Nhắc nhở: Còn 3 ngày nữa bạn có lịch ${appointment.type} vào ${appointment.date} lúc ${appointment.time || '08:00'}.\n${appointment.notes || ''}`
    });
    
    return reminders;
  }

  /**
   * Tạo tất cả reminders từ JSON
   */
  generateReminders(data, startDate = new Date()) {
    console.log('\n🔔 BẮT ĐẦU TẠO LỊCH NHẮC...');
    console.log(`   • Số thuốc: ${data.medications.length}`);
    console.log(`   • Số lịch khám: ${data.appointments.length}`);
    console.log(`   • Ngày bắt đầu: ${startDate.toISOString().split('T')[0]}`);
    
    const allReminders = {
      medications: [],
      appointments: [],
      summary: {
        totalMedications: 0,
        totalAppointments: 0,
        dateRange: {
          start: null,
          end: null
        }
      }
    };
    
    // Tạo reminders cho thuốc
    console.log('\n💊 TẠO LỊCH NHẮC UỐNG THUỐC:');
    for (const medication of data.medications) {
      const reminders = this.createMedicationReminders(medication, startDate);
      allReminders.medications.push(...reminders);
    }
    
    // Tạo reminders cho lịch khám
    console.log('\n📅 TẠO LỊCH NHẮC TÁI KHÁM:');
    for (const appointment of data.appointments) {
      const reminders = this.createAppointmentReminders(appointment);
      allReminders.appointments.push(...reminders);
      console.log(`   ✅ Lịch khám "${appointment.type}": ${reminders.length} reminders`);
    }
    
    // Sắp xếp theo thời gian
    allReminders.medications.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    allReminders.appointments.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    
    // Tính toán summary
    allReminders.summary.totalMedications = allReminders.medications.length;
    allReminders.summary.totalAppointments = allReminders.appointments.length;
    
    if (allReminders.medications.length > 0) {
      allReminders.summary.dateRange.start = allReminders.medications[0].date;
      allReminders.summary.dateRange.end = allReminders.medications[allReminders.medications.length - 1].date;
    }
    
    // Log summary
    console.log('\n📊 TỔNG KẾT:');
    console.log(`   • Tổng lịch nhắc uống thuốc: ${allReminders.summary.totalMedications}`);
    console.log(`   • Tổng lịch nhắc tái khám: ${allReminders.summary.totalAppointments}`);
    if (allReminders.summary.dateRange.start) {
      console.log(`   • Khoảng thời gian: ${allReminders.summary.dateRange.start} → ${allReminders.summary.dateRange.end}`);
    }
    
    return allReminders;
  }

  /**
   * Lọc reminders theo khoảng thời gian
   */
  filterRemindersByDateRange(reminders, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return {
      medications: reminders.medications.filter(r => {
        const date = new Date(r.datetime);
        return date >= start && date <= end;
      }),
      appointments: reminders.appointments.filter(r => {
        const date = new Date(r.datetime);
        return date >= start && date <= end;
      })
    };
  }

  /**
   * Nhóm reminders theo ngày
   */
  groupRemindersByDate(reminders) {
    const grouped = {};
    
    // Nhóm medication reminders
    for (const reminder of reminders.medications) {
      const date = reminder.date;
      if (!grouped[date]) {
        grouped[date] = { medications: [], appointments: [] };
      }
      grouped[date].medications.push(reminder);
    }
    
    // Nhóm appointment reminders
    for (const reminder of reminders.appointments) {
      const date = reminder.date;
      if (!grouped[date]) {
        grouped[date] = { medications: [], appointments: [] };
      }
      grouped[date].appointments.push(reminder);
    }
    
    return grouped;
  }
}

module.exports = new ReminderAIService();
