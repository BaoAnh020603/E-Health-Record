# 🏥 Medical Records Backend API

Backend API cho ứng dụng quản lý hồ sơ y tế thông minh với tích hợp AI và OCR.

## 📋 Tổng quan

Hệ thống backend cung cấp các API để:
- 🤖 Phân tích và đơn giản hóa hồ sơ y tế bằng AI
- 📄 OCR (Optical Character Recognition) cho đơn thuốc và hồ sơ y tế
- 🔍 Dự đoán bệnh và đánh giá độ tin cậy
- 💊 Quản lý đơn thuốc và nhắc nhở uống thuốc
- ✅ Xác thực y tế và tích hợp với Bộ Y tế
- 📊 Phân tích lịch sử bệnh án

## 🚀 Công nghệ sử dụng

- **Runtime**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL)
- **AI Services**: 
  - Google Gemini AI
  - OpenAI GPT
  - Groq SDK
  - DeepSeek
- **OCR**: Tesseract.js, PDF.js
- **Image Processing**: Sharp
- **Authentication**: Supabase Auth

## 📦 Cài đặt

### Yêu cầu hệ thống
- Node.js >= 16.x
- npm hoặc yarn
- Supabase account

### Các bước cài đặt

1. **Clone repository và di chuyển vào thư mục Backend**
```bash
cd Backend
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Cấu hình biến môi trường**
```bash
cp .env.example .env.local
```

Chỉnh sửa file `.env.local` với thông tin của bạn:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Service Configuration
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
AI_MODEL=gpt-4

# Application Settings
NODE_ENV=development
PORT=3001

# Medical Validation
ENABLE_MEDICAL_VALIDATION=true
CLINICAL_VALIDATION_ENABLED=true
```

4. **Khởi động server**
```bash
node server.js
```

Server sẽ chạy tại `http://localhost:3001`

## 🔌 API Endpoints

### 🤖 AI Services

#### Đơn giản hóa hồ sơ y tế
```http
POST /api/ai-simplify
Content-Type: application/json

{
  "user_id": "uuid",
  "medical_text": "Nội dung hồ sơ y tế..."
}
```

#### Dự đoán bệnh
```http
POST /api/ai-predict
Content-Type: application/json

{
  "user_id": "uuid",
  "symptoms": ["triệu chứng 1", "triệu chứng 2"]
}
```

#### Giải thích thuật ngữ y tế
```http
POST /api/explain-medical-term
Content-Type: application/json

{
  "user_id": "uuid",
  "term": "thuật ngữ y tế",
  "language": "vietnamese"
}
```

### 📄 OCR Services

#### Phân tích hồ sơ y tế (OCR)
```http
POST /api/ocr/analyze
Content-Type: multipart/form-data

file: [PDF/Image file]
user_id: uuid
```

#### Phân tích đơn thuốc
```http
POST /api/prescription/analyze
Content-Type: multipart/form-data

file: [PDF/Image file]
user_id: uuid
```

### 📊 Medical Analysis

#### Phân tích hồ sơ y tế
```http
POST /api/analyze-medical-record
Content-Type: application/json

{
  "user_id": "uuid",
  "record_id": "uuid"
}
```

#### Phân tích lịch sử bệnh án
```http
POST /api/analyze-patient-history
Content-Type: application/json

{
  "user_id": "uuid"
}
```

### ✅ Validation & Integration

#### Đánh giá độ tin cậy
```http
POST /api/ai-credibility
Content-Type: application/json

{
  "user_id": "uuid",
  "content": "Nội dung cần đánh giá"
}
```

#### Tích hợp Bộ Y tế
```http
POST /api/ministry-integration
Content-Type: application/json

{
  "user_id": "uuid",
  "record_id": "uuid"
}
```

## 🗂️ Cấu trúc thư mục

```
Backend/
├── api/                          # API endpoints
│   ├── ai-credibility.js        # Đánh giá độ tin cậy
│   ├── ai-predict.js            # Dự đoán bệnh
│   ├── ai-simplify.js           # Đơn giản hóa văn bản y tế
│   ├── analyze-medical-record.js
│   ├── analyze-patient-history.js
│   ├── analyze-prescription.js
│   ├── ocr.js                   # OCR endpoints
│   └── prescription-ocr.js      # OCR đơn thuốc
├── services/                     # Business logic
│   ├── ai-credibility-service.js
│   ├── clinical-validation-service.js
│   ├── deepseek-ocr-service.js
│   ├── hybrid-parser-service.js
│   ├── image-ocr-service.js
│   ├── ministry-validation-service.js
│   ├── pdf-parser-service.js
│   ├── reminder-ai-service.js
│   └── smart-report-service.js
├── database/                     # Database schemas & migrations
├── public/                       # Static files & dashboards
├── uploads/                      # Temporary file uploads
├── server.js                     # Main server file
├── package.json
└── .env.example                 # Environment variables template
```

## 🧪 Testing

Chạy các test scripts:

```bash
# Test kết nối database
node test-connection.js

# Test OCR
node test-ocr.js

# Test AI integration
node test-ai-integration.js

# Test full flow
node test-full-flow.js
```

## 🔒 Bảo mật

- ✅ CORS được cấu hình
- ✅ Rate limiting cho AI APIs
- ✅ Xác thực qua Supabase Auth
- ✅ Validation dữ liệu đầu vào
- ✅ Mã hóa thông tin nhạy cảm

## 📊 Dashboards

Truy cập các dashboard chuyên nghiệp:

- Medical Review Dashboard: `http://localhost:3001/dashboard/medical-review-dashboard.html`
- Ministry Approval Dashboard: `http://localhost:3001/dashboard/ministry-approval-dashboard.html`
- Patient Trust Dashboard: `http://localhost:3001/dashboard/patient-trust-dashboard.html`

## 🛠️ Scripts hữu ích

```bash
# Khởi động lại server (Windows)
restart-server.bat

# Dọn dẹp file cũ
cleanup-old-files.bat

# Cài đặt Sharp (image processing)
install-sharp.bat
```

## 📝 Logging & Monitoring

- Logs được ghi chi tiết cho mỗi request
- Error tracking và reporting
- Performance monitoring
- Audit logging cho các thao tác y tế quan trọng

