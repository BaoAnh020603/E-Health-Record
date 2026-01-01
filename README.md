# 🏥 E-Health-Record

Hệ thống quản lý hồ sơ y tế điện tử thông minh với AI, OCR và nhắc nhở uống thuốc tự động cho Việt Nam.

## 📋 Tổng quan

E-Health-Record là một giải pháp toàn diện giúp người dùng quản lý hồ sơ y tế cá nhân một cách thông minh và an toàn. Hệ thống bao gồm:

- 📱 **Mobile App**: Ứng dụng di động React Native cho iOS/Android
- 🖥️ **Backend API**: Server Node.js/Express với tích hợp AI
- 🗄️ **Database**: Supabase (PostgreSQL) với real-time capabilities
- 🤖 **AI Integration**: Google Gemini, OpenAI, Groq SDK
- 📄 **OCR Engine**: Tesseract.js, PDF.js cho trích xuất văn bản

## ✨ Tính năng nổi bật

### 🤖 AI-Powered Features
- **Trợ lý y tế AI**: Chat với AI về các vấn đề sức khỏe
- **Dự đoán bệnh**: Phân tích triệu chứng và đưa ra dự đoán
- **Giải thích thuật ngữ y tế**: Hiểu rõ các thuật ngữ phức tạp
- **Đánh giá độ tin cậy**: Kiểm tra độ tin cậy thông tin y tế
- **Phân tích thông minh**: Đánh giá tổng quan tình trạng sức khỏe

### 📄 Quản lý hồ sơ y tế
- Tạo, xem, sửa, xóa hồ sơ y tế
- Upload file PDF/hình ảnh
- OCR tự động trích xuất thông tin
- Lưu trữ an toàn trên cloud
- Phân loại và tìm kiếm thông minh

### 💊 Quản lý thuốc & Nhắc nhở
- OCR đơn thuốc tự động
- AI tạo lịch uống thuốc thông minh
- Push notification nhắc nhở đúng giờ
- Theo dõi lịch sử dùng thuốc
- Cảnh báo tương tác thuốc

### 🔗 Chia sẻ & Tích hợp
- QR Code để chia sẻ hồ sơ an toàn
- Token-based sharing với kiểm soát quyền
- Tích hợp với Bộ Y tế Việt Nam
- ICD-10 Vietnam compliance
- Clinical validation

### 🔐 Bảo mật & Quyền riêng tư
- OAuth 2.0 với Google
- End-to-end encryption
- HIPAA-compliant storage
- Audit logging
- Role-based access control

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)             │
│  - iOS/Android/Web                                       │
│  - User Interface                                        │
│  - Local Storage                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTPS/REST API
                 │
┌────────────────▼────────────────────────────────────────┐
│              Backend API (Node.js/Express)               │
│  - Authentication                                        │
│  - Business Logic                                        │
│  - AI Integration                                        │
│  - OCR Processing                                        │
└────────────┬───────────────┬────────────────────────────┘
             │               │
             │               │
    ┌────────▼──────┐   ┌───▼──────────────────┐
    │   Supabase    │   │   AI Services        │
    │  (PostgreSQL) │   │  - Google Gemini     │
    │  - Auth       │   │  - OpenAI GPT        │
    │  - Storage    │   │  - Groq SDK          │
    │  - Real-time  │   │  - DeepSeek          │
    └───────────────┘   └──────────────────────┘
```

## 📁 Cấu trúc dự án

```
E-Health-Record/
├── Backend/                  # Backend API Server
│   ├── api/                 # API endpoints
│   ├── services/            # Business logic
│   ├── database/            # Database schemas
│   ├── public/              # Static files & dashboards
│   ├── server.js            # Main server file
│   └── README.md            # Backend documentation
│
├── MobileApp/               # React Native Mobile App
│   ├── screens/             # App screens
│   ├── components/          # Reusable components
│   ├── services/            # API services
│   ├── navigation/          # Navigation setup
│   ├── lib/                 # Core libraries
│   ├── App.tsx              # Main app component
│   └── README.md            # Mobile app documentation
│
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.x
- npm hoặc yarn
- Expo CLI (cho mobile app)
- Supabase account
- API keys cho AI services (Gemini, OpenAI, etc.)

### 1. Clone Repository
```bash
git clone https://github.com/BaoAnh020603/E-Health-Record.git
cd E-Health-Record
```

### 2. Setup Backend

```bash
cd Backend
npm install

# Tạo file .env.local từ .env.example
cp .env.example .env.local

# Chỉnh sửa .env.local với thông tin của bạn
# Khởi động server
node server.js
```

Backend sẽ chạy tại `http://localhost:3001`


### 3. Setup Mobile App

```bash
cd MobileApp
npm install

# Cấu hình Supabase trong config.ts
# Khởi động app
npm start
```

## 🔧 Configuration

### Backend Environment Variables
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Server
PORT=3001
NODE_ENV=development
```

### Mobile App Configuration
```typescript
// config.ts
export const SUPABASE_URL = 'your_supabase_url'
export const SUPABASE_ANON_KEY = 'your_supabase_anon_key'
export const BACKEND_URL = 'http://localhost:3001'
```

## 📊 Database Schema

### Core Tables
- `profiles`: Thông tin người dùng
- `medical_records`: Hồ sơ y tế
- `medications`: Danh sách thuốc
- `medication_reminders`: Lịch nhắc nhở
- `prescriptions`: Đơn thuốc
- `share_tokens`: Token chia sẻ
- `audit_logs`: Logs kiểm toán

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/logout` - Đăng xuất

### Medical Records
- `GET /api/medical-records` - Lấy danh sách hồ sơ
- `POST /api/medical-records` - Tạo hồ sơ mới
- `PUT /api/medical-records/:id` - Cập nhật hồ sơ
- `DELETE /api/medical-records/:id` - Xóa hồ sơ

### AI Services
- `POST /api/ai-simplify` - Đơn giản hóa văn bản y tế
- `POST /api/ai-predict` - Dự đoán bệnh
- `POST /api/explain-medical-term` - Giải thích thuật ngữ
- `POST /api/ai-credibility` - Đánh giá độ tin cậy

### OCR Services
- `POST /api/ocr/analyze` - Phân tích hồ sơ y tế
- `POST /api/prescription/analyze` - Phân tích đơn thuốc


## 🧪 Testing

### Backend Tests
```bash
cd Backend
node test-connection.js
node test-ai-integration.js
node test-ocr.js
```

### Mobile App Tests
```bash
cd MobileApp
node test-auth.js
node test-google-oauth.js
```

## 📱 Supported Platforms

- ✅ iOS (iPhone & iPad)
- ✅ Android (Phone & Tablet)
- ✅ Web (Limited features)

## 🌐 Tech Stack

### Frontend (Mobile)
- React Native 0.81
- Expo SDK 54
- TypeScript
- React Navigation
- Expo Notifications

### Backend
- Node.js
- Express.js
- Supabase (PostgreSQL)
- Tesseract.js (OCR)
- PDF.js
- Sharp (Image processing)

### AI & ML
- Google Gemini AI
- OpenAI GPT-4
- Groq SDK
- DeepSeek

### DevOps & Tools
- Git
- npm/yarn
- EAS Build (Expo)
- Supabase CLI

## 🔒 Security Features

- ✅ OAuth 2.0 Authentication
- ✅ JWT Token Management
- ✅ Data Encryption at Rest
- ✅ HTTPS/TLS in Transit
- ✅ Input Validation & Sanitization
- ✅ Rate Limiting
- ✅ CORS Protection
- ✅ SQL Injection Prevention
- ✅ XSS Protection
- ✅ Audit Logging

## 📈 Performance

- Lazy loading cho screens
- Image optimization với Sharp
- Database indexing
- Caching strategies
- Background task processing
- Efficient re-renders

## 🌍 Localization

- 🇻🇳 Tiếng Việt (Primary)
- 🇬🇧 English (Coming soon)

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Basic medical records management
- ✅ AI medical assistant
- ✅ OCR for prescriptions
- ✅ Medication reminders

### Phase 2 (In Progress)
- 🔄 Ministry of Health integration
- 🔄 Hospital system integration
- 🔄 Telemedicine features
- 🔄 Family account sharing

### Phase 3 (Planned)
- 📋 Appointment scheduling
- 📋 Lab results integration
- 📋 Health insurance integration
- 📋 Wearable device sync


### Development Workflow
1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: [NguyenNhatBaoAnh]
- **Backend Developer**: [NguyenNhatBaoAnh]
- **Mobile Developer**: [TrinhDuyNghia]
- **AI/ML Engineer**: [NguyenNhatBaoAnh]
- **UI/UX Designer**: [TrinhDuyNghia]

## 📞 Contact & Support

- 📧 Email: baoanh020603@gmail.com

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - React Native framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Google AI](https://ai.google.dev/) - Gemini AI
- [OpenAI](https://openai.com/) - GPT models
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine
- Bộ Y tế Việt Nam - Medical standards & guidelines
- Vietnamese healthcare community

## 📚 Documentation

- [Backend API Documentation](./Backend/README.md)
- [Mobile App Documentation](./MobileApp/README.md)
- [API Reference](./docs/API.md) (Coming soon)
- [Database Schema](./docs/DATABASE.md) (Coming soon)
- [Deployment Guide](./docs/DEPLOYMENT.md) (Coming soon)

## 🎯 Use Cases

### Cho bệnh nhân
- Quản lý hồ sơ y tế cá nhân
- Theo dõi lịch sử khám bệnh
- Nhắc nhở uống thuốc
- Tư vấn sức khỏe từ AI

### Cho bác sĩ
- Truy cập nhanh hồ sơ bệnh nhân
- Phân tích lịch sử bệnh án
- Hỗ trợ chẩn đoán với AI
- Kê đơn thuốc điện tử

### Cho bệnh viện
- Quản lý hồ sơ tập trung
- Tích hợp hệ thống HIS
- Báo cáo và thống kê
- Tuân thủ quy định Bộ Y tế

## 📊 Statistics

- 📱 Mobile App: React Native + TypeScript
- 🖥️ Backend: Node.js + Express
- 🗄️ Database: PostgreSQL (Supabase)
- 🤖 AI Models: Gemini, GPT-4, Groq
- 📄 OCR: Tesseract.js + PDF.js
- 🔐 Auth: OAuth 2.0 + JWT

---


**⭐ Nếu dự án này hữu ích, hãy cho chúng tôi một star trên GitHub!**

