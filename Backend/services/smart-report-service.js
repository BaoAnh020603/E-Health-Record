/**
 * Smart Report Service - Phân tích JSON và tạo báo cáo thông minh
 * Trả về OPTIONS cho người dùng chọn thay vì render hết
 */

class SmartReportService {
  /**
   * Phân tích dữ liệu và tạo báo cáo tổng quan
   */
  analyzeData(data) {
    const analysis = {
      summary: this.createSummary(data),
      insights: this.generateInsights(data),
      warnings: this.detectWarnings(data),
      recommendations: this.generateRecommendations(data),
      options: this.createReportOptions(data)
    };
    
    return analysis;
  }

  /**
   * Tạo tóm tắt
   */
  createSummary(data) {
    const { medications, appointments, instructions } = data.ocr;
    const { reminders } = data;
    
    return {
      totalMedications: medications.length,
      totalAppointments: appointments.length,
      totalInstructions: instructions.length,
      totalReminders: reminders.summary.totalMedications + reminders.summary.totalAppointments,
      dateRange: reminders.summary.dateRange,
      processingTime: data.generatedAt
    };
  }

  /**
   * Tạo insights (phân tích thông minh)
   */
  generateInsights(data) {
    const insights = [];
    const { medications, appointments } = data.ocr;
    
    // Insight 1: Số lượng thuốc
    if (medications.length > 10) {
      insights.push({
        type: 'medication_count',
        level: 'warning',
        title: 'Số lượng thuốc nhiều',
        message: `Bạn đang dùng ${medications.length} loại thuốc. Hãy chú ý uống đúng giờ và theo dõi tác dụng phụ.`,
        icon: '⚠️'
      });
    } else if (medications.length > 5) {
      insights.push({
        type: 'medication_count',
        level: 'info',
        title: 'Số lượng thuốc trung bình',
        message: `Bạn đang dùng ${medications.length} loại thuốc. Nhớ uống đúng giờ nhé!`,
        icon: 'ℹ️'
      });
    }
    
    // Insight 2: Tần suất uống thuốc
    const medicationsWithFrequency = medications.filter(m => m.frequency);
    const highFrequency = medicationsWithFrequency.filter(m => 
      m.frequency && (m.frequency.includes('3 lần') || m.frequency.includes('4 lần'))
    );
    
    if (highFrequency.length > 0) {
      insights.push({
        type: 'high_frequency',
        level: 'info',
        title: 'Thuốc uống nhiều lần/ngày',
        message: `Có ${highFrequency.length} loại thuốc cần uống 3-4 lần/ngày. Đặt nhắc nhở để không quên!`,
        icon: '⏰',
        details: {
          count: highFrequency.length,
          medications: highFrequency.map(m => m.name)
        }
      });
    }
    
    // Insight 3: Lịch tái khám
    const upcomingAppointments = appointments.filter(a => a.date);
    if (upcomingAppointments.length > 0) {
      const nearestDate = upcomingAppointments[0].date;
      const daysUntil = this.calculateDaysUntil(nearestDate);
      
      insights.push({
        type: 'appointment',
        level: daysUntil <= 3 ? 'warning' : 'info',
        title: 'Lịch tái khám sắp tới',
        message: `Bạn có lịch tái khám vào ${nearestDate} (còn ${daysUntil} ngày). Nhớ chuẩn bị đầy đủ giấy tờ!`,
        icon: '📅',
        details: {
          date: nearestDate,
          daysUntil: daysUntil,
          appointments: upcomingAppointments
        }
      });
    }
    
    // Insight 4: Thời gian điều trị
    const medicationsWithDuration = medications.filter(m => m.duration);
    if (medicationsWithDuration.length > 0) {
      const durations = medicationsWithDuration.map(m => {
        const match = m.duration.match(/(\d+)\s*ngày/i);
        return match ? parseInt(match[1]) : 7;
      });
      const maxDuration = Math.max(...durations);
      
      insights.push({
        type: 'treatment_duration',
        level: 'info',
        title: 'Thời gian điều trị',
        message: `Liệu trình điều trị kéo dài ${maxDuration} ngày. Hãy kiên trì uống thuốc đầy đủ!`,
        icon: '📆',
        details: {
          maxDuration: maxDuration,
          medicationsCount: medicationsWithDuration.length
        }
      });
    }
    
    return insights;
  }

  /**
   * Phát hiện cảnh báo - CẢI THIỆN: Thêm warning cho thuốc dùng lịch mặc định
   */
  detectWarnings(data) {
    const warnings = [];
    const { medications, appointments } = data.ocr;
    const { reminders } = data;
    
    // Warning 1: Thuốc dùng lịch nhắc MẶC ĐỊNH (thiếu timing/frequency)
    if (reminders.summary.medicationsWithDefaultSchedule > 0) {
      warnings.push({
        type: 'default_schedule',
        level: 'info',
        title: 'Lịch nhắc mặc định',
        message: `${reminders.summary.medicationsWithDefaultSchedule} loại thuốc đang dùng lịch nhắc MẶC ĐỊNH (3 lần/ngày: 7:00, 12:00, 20:00) do thiếu thông tin thời gian uống. Vui lòng xem lại và điều chỉnh cho phù hợp.`,
        icon: 'ℹ️',
        details: {
          medications: reminders.summary.medicationsNeedingReview || []
        }
      });
    }
    
    // Warning 2: Thuốc không có liều lượng
    const noDosage = medications.filter(m => !m.dosage || m.dosage.length === 0);
    if (noDosage.length > 0) {
      warnings.push({
        type: 'missing_dosage',
        level: 'warning',
        title: 'Thiếu thông tin liều lượng',
        message: `${noDosage.length} loại thuốc không có thông tin liều lượng rõ ràng. Hãy hỏi bác sĩ!`,
        icon: '⚠️',
        details: {
          medications: noDosage.map(m => m.name)
        }
      });
    }
    
    // Warning 3: Lịch khám không có ngày giờ
    const noDateTime = appointments.filter(a => !a.date || !a.time);
    if (noDateTime.length > 0) {
      warnings.push({
        type: 'missing_appointment_time',
        level: 'warning',
        title: 'Lịch khám thiếu thông tin',
        message: `${noDateTime.length} lịch khám chưa có ngày giờ cụ thể. Hãy liên hệ bệnh viện để xác nhận!`,
        icon: '⚠️',
        details: {
          appointments: noDateTime.map(a => a.type)
        }
      });
    }
    
    return warnings;
  }

  /**
   * Tạo khuyến nghị
   */
  generateRecommendations(data) {
    const recommendations = [];
    const { medications, appointments, instructions } = data.ocr;
    
    // Recommendation 1: Đặt nhắc nhở
    recommendations.push({
      type: 'set_reminders',
      priority: 'high',
      title: 'Đặt nhắc nhở',
      message: 'Bật thông báo để nhận nhắc nhở uống thuốc và tái khám đúng giờ.',
      action: 'enable_notifications',
      icon: '🔔'
    });
    
    // Recommendation 2: Chuẩn bị tái khám
    if (appointments.length > 0) {
      recommendations.push({
        type: 'prepare_appointment',
        priority: 'high',
        title: 'Chuẩn bị tái khám',
        message: 'Mang theo đơn thuốc, kết quả xét nghiệm, X-quang khi đi tái khám.',
        action: 'view_appointment_checklist',
        icon: '📋'
      });
    }
    
    // Recommendation 3: Theo dõi tác dụng phụ
    if (medications.length > 5) {
      recommendations.push({
        type: 'track_side_effects',
        priority: 'medium',
        title: 'Theo dõi tác dụng phụ',
        message: 'Ghi chú lại nếu có triệu chứng bất thường sau khi uống thuốc. Nếu thấy có dấu hiệu bất thường, hãy ngưng thuốc và đến phòng khám gần nhất ngay.',
        action: 'open_health_diary',
        icon: '📝'
      });
    }
    
    // Recommendation 4: Lưu trữ đơn thuốc
    recommendations.push({
      type: 'save_prescription',
      priority: 'medium',
      title: 'Lưu trữ đơn thuốc',
      message: 'Lưu đơn thuốc vào hồ sơ sức khỏe để dễ tra cứu sau này.',
      action: 'save_to_records',
      icon: '💾'
    });
    
    return recommendations;
  }

  /**
   * Tạo options cho báo cáo (để người dùng chọn)
   */
  createReportOptions(data) {
    const options = {
      viewOptions: [
        {
          id: 'summary',
          label: 'Xem tóm tắt',
          description: 'Thông tin tổng quan về thuốc và lịch khám',
          icon: '📊',
          dataSize: 'small'
        },
        {
          id: 'medications',
          label: 'Danh sách thuốc',
          description: `${data.ocr.medications.length} loại thuốc`,
          icon: '💊',
          dataSize: 'medium',
          count: data.ocr.medications.length
        },
        {
          id: 'appointments',
          label: 'Lịch tái khám',
          description: `${data.ocr.appointments.length} lịch khám`,
          icon: '📅',
          dataSize: 'small',
          count: data.ocr.appointments.length
        },
        {
          id: 'reminders_today',
          label: 'Nhắc nhở hôm nay',
          description: 'Lịch uống thuốc và tái khám hôm nay',
          icon: '🔔',
          dataSize: 'small'
        },
        {
          id: 'reminders_week',
          label: 'Nhắc nhở 7 ngày tới',
          description: `${data.reminders.summary.totalMedications + data.reminders.summary.totalAppointments} nhắc nhở`,
          icon: '📆',
          dataSize: 'large',
          count: data.reminders.summary.totalMedications + data.reminders.summary.totalAppointments
        },
        {
          id: 'calendar',
          label: 'Lịch uống thuốc',
          description: 'Xem lịch theo dạng calendar',
          icon: '📅',
          dataSize: 'medium'
        },
        {
          id: 'instructions',
          label: 'Lời dặn bác sĩ',
          description: `${data.ocr.instructions.length} lời dặn`,
          icon: '📝',
          dataSize: 'small',
          count: data.ocr.instructions.length
        }
      ],
      exportOptions: [
        {
          id: 'export_pdf',
          label: 'Xuất PDF',
          description: 'Tải báo cáo dạng PDF',
          icon: '📄',
          format: 'pdf'
        },
        {
          id: 'export_json',
          label: 'Xuất JSON',
          description: 'Tải dữ liệu dạng JSON',
          icon: '📋',
          format: 'json'
        },
        {
          id: 'share',
          label: 'Chia sẻ',
          description: 'Chia sẻ với bác sĩ hoặc người thân',
          icon: '📤',
          format: 'share'
        }
      ],
      actionOptions: [
        {
          id: 'enable_notifications',
          label: 'Bật thông báo',
          description: 'Nhận nhắc nhở uống thuốc',
          icon: '🔔',
          action: 'enable_notifications'
        },
        {
          id: 'add_to_calendar',
          label: 'Thêm vào lịch',
          description: 'Đồng bộ với Google Calendar',
          icon: '📅',
          action: 'sync_calendar'
        },
        {
          id: 'set_alarm',
          label: 'Đặt báo thức',
          description: 'Tạo báo thức cho từng lần uống thuốc',
          icon: '⏰',
          action: 'create_alarms'
        }
      ]
    };
    
    return options;
  }

  /**
   * Lấy dữ liệu theo option được chọn
   */
  getDataByOption(data, optionId) {
    const today = new Date().toISOString().split('T')[0];
    
    switch (optionId) {
      case 'summary':
        return this.createSummary(data);
        
      case 'medications':
        return data.ocr.medications;
        
      case 'appointments':
        return data.ocr.appointments;
        
      case 'reminders_today':
        return {
          medications: data.reminders.medications.filter(r => r.date === today),
          appointments: data.reminders.appointments.filter(r => r.date === today)
        };
        
      case 'reminders_week':
        const weekLater = new Date();
        weekLater.setDate(weekLater.getDate() + 7);
        const weekLaterStr = weekLater.toISOString().split('T')[0];
        
        return {
          medications: data.reminders.medications.filter(r => r.date >= today && r.date <= weekLaterStr),
          appointments: data.reminders.appointments.filter(r => r.date >= today && r.date <= weekLaterStr)
        };
        
      case 'calendar':
        return this.groupRemindersByDate(data.reminders);
        
      case 'instructions':
        return data.ocr.instructions;
        
      default:
        return null;
    }
  }

  /**
   * Nhóm reminders theo ngày
   */
  groupRemindersByDate(reminders) {
    const grouped = {};
    
    for (const reminder of reminders.medications) {
      const date = reminder.date;
      if (!grouped[date]) {
        grouped[date] = { medications: [], appointments: [] };
      }
      grouped[date].medications.push(reminder);
    }
    
    for (const reminder of reminders.appointments) {
      const date = reminder.date;
      if (!grouped[date]) {
        grouped[date] = { medications: [], appointments: [] };
      }
      grouped[date].appointments.push(reminder);
    }
    
    return grouped;
  }

  /**
   * Tính số ngày còn lại
   */
  calculateDaysUntil(dateStr) {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Tạo báo cáo đầy đủ (chỉ gọi khi người dùng chọn)
   */
  generateFullReport(data) {
    return {
      analysis: this.analyzeData(data),
      data: data,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = new SmartReportService();
