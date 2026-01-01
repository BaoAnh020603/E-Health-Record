/**
 * Prescription OCR API - Phân tích đơn thuốc và tạo lịch nhắc
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParserService = require('../services/pdf-parser-service');
const duplicateChecker = require('../services/duplicate-checker-service');
const reminderAI = require('../services/reminder-ai-service');
const smartReport = require('../services/smart-report-service');
const prescriptionValidator = require('../services/prescription-validator-service');
const imageOCR = require('../services/image-ocr-service');

/**
 * Helper: Xóa file an toàn với retry logic
 * Xử lý lỗi EPERM trên Windows khi file đang được sử dụng
 */
async function safeDeleteFile(filePath, maxRetries = 5, delayMs = 500) {
  if (!filePath || !fs.existsSync(filePath)) {
    return;
  }
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Đợi một chút để đảm bảo file không còn được sử dụng
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs * i));
      }
      
      fs.unlinkSync(filePath);
      console.log(`🧹 File deleted: ${path.basename(filePath)}`);
      return;
    } catch (error) {
      if (error.code === 'EPERM' && i < maxRetries - 1) {
        console.log(`⚠️  File locked, retry ${i + 1}/${maxRetries}...`);
        continue;
      }
      
      // Nếu vẫn lỗi sau tất cả retry, log nhưng không throw
      console.warn(`⚠️  Could not delete file: ${error.message}`);
      
      // Thử xóa async sau 5 giây
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🧹 File deleted (delayed): ${path.basename(filePath)}`);
          }
        } catch (err) {
          console.warn(`⚠️  Could not delete file (delayed): ${err.message}`);
        }
      }, 5000);
      
      return;
    }
  }
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prescription-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF, JPG, PNG'));
    }
  }
});

/**
 * POST /api/prescription/analyze
 * Upload và phân tích đơn thuốc
 */
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    console.log('📄 Prescription OCR analysis request received');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không tìm thấy file. Vui lòng upload file PDF/ảnh đơn thuốc.'
      });
    }
    
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png'].includes(fileExt);
    
    console.log(`📁 File uploaded: ${filePath} (${isImage ? 'Image' : 'PDF'})`);
    
    let parseResult;
    
    // Bước 1: OCR - Phân tích PDF hoặc Image
    if (isImage) {
      console.log('🔍 Bước 1: OCR Image (Tesseract)...');
      parseResult = await imageOCR.processImage(filePath);
    } else {
      console.log('🔍 Bước 1: Phân tích PDF...');
      parseResult = await pdfParserService.parse(filePath);
    }
    
    if (!parseResult.success) {
      // Xóa file an toàn
      await safeDeleteFile(filePath);
      return res.status(500).json({
        success: false,
        error: 'Không thể phân tích đơn thuốc',
        details: parseResult.error
      });
    }
    
    const data = parseResult.data;
    
    // Bước 1.5: VALIDATION - Kiểm tra có phải đơn thuốc không
    console.log('✅ Bước 1.5: Validation...');
    const validation = prescriptionValidator.validatePrescription(data);
    
    if (!validation.isValid) {
      // Xóa file an toàn
      await safeDeleteFile(filePath);
      return res.status(400).json({
        success: false,
        error: 'File không phải đơn thuốc hợp lệ',
        validation: {
          confidence: validation.confidence,
          reasons: validation.reasons,
          warnings: validation.warnings
        },
        suggestion: 'Vui lòng upload file đơn thuốc từ bệnh viện/phòng khám.'
      });
    }
    
    // Log validation result
    console.log(`✅ Validation passed: ${validation.confidence}% confidence`);
    if (validation.warnings.length > 0) {
      console.log('⚠️  Warnings:', validation.warnings);
    }
    
    // Bước 2: Kiểm tra trùng lặp
    console.log('🔍 Bước 2: Kiểm tra trùng lặp...');
    const cleanData = duplicateChecker.cleanData(data);
    
    // Bước 3: Phân tích thông minh (KHÔNG tạo reminders tự động)
    console.log('📊 Bước 3: Phân tích thông minh...');
    const fullData = {
      ocr: cleanData,
      reminders: {
        medications: [],
        appointments: [],
        summary: {
          totalMedications: 0,
          totalAppointments: 0,
          totalReminders: 0
        }
      },
      generatedAt: new Date().toISOString()
    };
    
    const analysis = smartReport.analyzeData(fullData);
    
    // Xóa file sau khi xử lý - AN TOÀN
    await safeDeleteFile(filePath);
    
    console.log('✅ Prescription analysis completed successfully');
    
    res.json({
      success: true,
      data: {
        summary: analysis.summary,
        insights: analysis.insights,
        warnings: analysis.warnings,
        recommendations: analysis.recommendations,
        options: analysis.options,
        validation: {
          confidence: validation.confidence,
          warnings: validation.warnings
        },
        // Include raw data for detail views
        medications: cleanData.medications,
        appointments: cleanData.appointments,
        instructions: cleanData.instructions,
        // Include full data structure for get-data endpoint
        _fullData: fullData
      },
      message: 'Phân tích đơn thuốc thành công',
      processingTime: parseResult.stats?.processingTime || 0
    });
    
  } catch (error) {
    console.error('❌ Prescription OCR error:', error);
    
    // Xóa file nếu có lỗi - AN TOÀN
    if (req.file && fs.existsSync(req.file.path)) {
      await safeDeleteFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Lỗi khi phân tích đơn thuốc',
      details: error.message
    });
  }
});

/**
 * POST /api/prescription/get-data
 * Lấy dữ liệu theo option được chọn
 */
router.post('/get-data', async (req, res) => {
  try {
    const { optionId, data } = req.body;
    
    if (!optionId || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: optionId, data'
      });
    }
    
    console.log(`📊 Getting data for option: ${optionId}`);
    console.log(`📦 Data structure:`, {
      hasOcr: !!data.ocr,
      hasReminders: !!data.reminders,
      hasMedications: !!(data.ocr?.medications),
      hasAppointments: !!(data.ocr?.appointments),
      dataKeys: Object.keys(data)
    });
    
    // If data doesn't have ocr structure, try to use _fullData or construct it
    let processedData = data;
    if (!data.ocr && data._fullData) {
      console.log('📦 Using _fullData from analysis');
      processedData = data._fullData;
    } else if (!data.ocr && data.medications) {
      // Construct fullData structure from flat analysis
      console.log('📦 Constructing fullData from flat structure');
      processedData = {
        ocr: {
          medications: data.medications || [],
          appointments: data.appointments || [],
          instructions: data.instructions || []
        },
        reminders: {
          medications: [],
          appointments: []
        }
      };
    }
    
    const result = smartReport.getDataByOption(processedData, optionId);
    
    if (result === null) {
      return res.status(404).json({
        success: false,
        error: 'Option không tồn tại'
      });
    }
    
    res.json({
      success: true,
      optionId: optionId,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Get data error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy dữ liệu',
      details: error.message
    });
  }
});

/**
 * POST /api/prescription/create-reminders
 * Tạo lịch nhắc từ dữ liệu đã phân tích
 */
router.post('/create-reminders', async (req, res) => {
  try {
    const { medications, appointments, startDate } = req.body;
    
    if (!medications || !Array.isArray(medications)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: medications (array)'
      });
    }
    
    console.log('🔔 Creating reminders...');
    
    const start = startDate ? new Date(startDate) : new Date();
    const data = {
      medications: medications,
      appointments: appointments || []
    };
    
    const reminders = reminderAI.generateReminders(data, start);
    
    res.json({
      success: true,
      reminders: reminders,
      message: `Đã tạo ${reminders.summary.totalMedications + reminders.summary.totalAppointments} nhắc nhở`
    });
    
  } catch (error) {
    console.error('❌ Create reminders error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo lịch nhắc',
      details: error.message
    });
  }
});

/**
 * POST /api/prescription/check-duplicates
 * Kiểm tra trùng lặp thuốc/lịch khám
 */
router.post('/check-duplicates', async (req, res) => {
  try {
    const { medications, appointments } = req.body;
    
    if (!medications || !Array.isArray(medications)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: medications (array)'
      });
    }
    
    console.log('🔍 Checking duplicates...');
    
    const data = {
      medications: medications,
      appointments: appointments || []
    };
    
    const report = duplicateChecker.checkDuplicates(data);
    const cleanData = duplicateChecker.cleanData(data);
    
    res.json({
      success: true,
      report: report,
      cleanData: cleanData,
      message: `Tìm thấy ${report.medications.duplicates.length} thuốc trùng, ${report.appointments.duplicates.length} lịch khám trùng`
    });
    
  } catch (error) {
    console.error('❌ Check duplicates error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi kiểm tra trùng lặp',
      details: error.message
    });
  }
});

/**
 * GET /api/prescription/health
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Prescription OCR API',
    status: 'running',
    features: [
      'PDF/Image OCR',
      'Medication extraction',
      'Appointment detection',
      'Duplicate checking',
      'AI reminder generation',
      'Smart analysis'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
