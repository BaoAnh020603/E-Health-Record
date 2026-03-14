# 🏥 E-Health-Record

Intelligent Electronic Health Record Management System with AI, OCR, and Automated Medication Reminders for Vietnam.

## 📋 Overview

E-Health-Record is a comprehensive solution that helps users manage their personal medical records intelligently and securely. The system includes:

- 📱 **Mobile App**: React Native (Expo) application for iOS/Android
- 🖥️ **Backend API**: Node.js/Express server with AI integration
- 🗄️ **Database**: Supabase (PostgreSQL) with real-time capabilities
- 🤖 **AI Integration**: Google Gemini, OpenAI GPT-4, Groq, DeepSeek
- 📄 **OCR Engine**: Tesseract.js, Google Gemini Vision, GPT-4 Vision, PDF.js

## ✨ Key Features

### 📄 Medical Records Management
- ✅ Create, read, update, delete medical records (CRUD)
- ✅ Upload PDF files and images as attachments
- ✅ Manage attachments (view, download, delete)
- ✅ Secure storage on Supabase Storage
- ✅ View record statistics (total count, categorized by visit type)
- ✅ Automatic OCR for medical records (PDF and images)

### 🤖 AI-Powered Features
- ✅ **AI Medical Assistant**: Intelligent chat about health concerns
- ✅ **Medical Text Simplification**: Convert complex medical terminology into easy-to-understand language
- ✅ **Disease Prediction**: Analyze symptoms and provide predictions
- ✅ **Medical Term Explanation**: Explain specialized medical terminology
- ✅ **Medical Record Analysis**: Analyze individual or multiple records comprehensively
- ✅ **Patient History Analysis**: Comprehensive health status assessment
- ✅ **Credibility Assessment**: Verify reliability of medical information

### 💊 Medication Management & Reminders
- ✅ **Multi-layer Prescription OCR**:
  - Tesseract.js with 5 preprocessing strategies
  - Google Gemini Vision (most accurate, reads handwriting)
  - GPT-4 Vision (fallback)
  - DeepSeek OCR
  - Automatic selection of best results
- ✅ **AI Smart Reminder Creation**: Analyze prescriptions and automatically create schedules
- ✅ View reminder list
- ✅ Mark medication as taken
- ✅ View medication history
- ✅ Push notifications at scheduled times
- ✅ Duplicate prescription detection

### 🔗 Record Sharing
- ✅ Generate QR Code for secure record sharing
- ✅ Scan QR Code to receive records
- ✅ Token-based sharing with access control
- ✅ Expiration time control
- ✅ Access limit restrictions

### 🔐 Security & Authentication
- ✅ OAuth 2.0 with Google
- ✅ JWT Token Management
- ✅ Supabase Auth Service
- ✅ Row Level Security (RLS) on database
- ✅ Sensitive data encryption

### ✅ Medical Validation & Integration
- ✅ Clinical Validation Service
- ✅ Medical Validation Service
- ✅ Ministry Integration (Vietnam Ministry of Health)
- ✅ ICD-10 Vietnam Service
- ✅ Prescription Validator Service

### 📊 Professional Dashboards
- ✅ Medical Review Dashboard
- ✅ Ministry Approval Dashboard
- ✅ Ministry Dashboard
- ✅ Patient Trust Dashboard

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Mobile App (React Native + Expo)                 │
│  - iOS/Android/Web                                       │
│  - TypeScript                                            │
│  - React Navigation                                      │
└────────────────┬────────────────────────────────────────┘
                 │ HTTPS/REST API
┌────────────────▼────────────────────────────────────────┐
│              Backend API (Node.js/Express)               │
│  - Authentication & Authorization                        │
│  - Business Logic                                        │
│  - AI Integration                                        │
│  - OCR Processing                                        │
│  - File Management                                       │
└────────────────┬───────────────┬────────────────────────┘
                 │               │
    ┌────────────▼──────┐   ┌───▼──────────────────┐
    │   Supabase        │   │   AI Services        │
    │  (PostgreSQL)     │   │  - Google Gemini     │
    │  - Auth           │   │  - OpenAI GPT-4      │
    │  - Storage        │   │  - Groq SDK          │
    │  - Real-time      │   │  - DeepSeek OCR      │
    │  - Edge Functions │   │  - Tesseract.js      │
    └───────────────────┘   └──────────────────────┘
```

## 📁 Project Structure

```
E-Health-Record/
├── Backend/                  # Backend API Server
│   ├── api/                 # API endpoints
│   │   ├── ai-credibility.js
│   │   ├── ai-huggingface.js
│   │   ├── ai-predict.js
│   │   ├── ai-simplify.js
│   │   ├── analyze-medical-record.js
│   │   ├── analyze-patient-history.js
│   │   ├── analyze-prescription.js
│   │   ├── explain-medical-term.js
│   │   ├── medical-review.js
│   │   ├── ministry-integration.js
│   │   ├── ocr.js
│   │   └── prescription-ocr.js
│   ├── services/            # Business logic services
│   │   ├── ai-credibility-service.js
│   │   ├── ai-vision-ocr-service.js
│   │   ├── clinical-validation-service.js
│   │   ├── deepseek-ocr-service.js
│   │   ├── duplicate-checker-service.js
│   │   ├── icd10-vietnam-service.js
│   │   ├── image-ocr-service.js
│   │   ├── image-preprocessor.js
│   │   ├── medicalValidationService.js
│   │   ├── pdf-parser-service.js
│   │   ├── prescription-validator-service.js
│   │   ├── reminder-ai-service.js
│   │   ├── smart-report-service.js
│   │   └── ultimate-ocr-service.js
│   ├── database/            # Database schemas & migrations
│   ├── lib/                 # Core libraries
│   │   ├── api/            # API utilities
│   │   ├── config/         # Configuration
│   │   └── utils/          # Utility functions
│   ├── public/              # Static files & dashboards
│   ├── supabase/            # Supabase functions & migrations
│   ├── server.js            # Main server file
│   └── README.md            # Backend documentation
│
├── MobileApp/               # React Native Mobile App
│   ├── screens/             # App screens
│   │   ├── auth/           # Authentication screens
│   │   │   └── LoginScreen.tsx
│   │   ├── main/           # Main app screens
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── MedicalRecordsScreen.tsx
│   │   │   ├── CreateRecordScreen.tsx
│   │   │   ├── EditRecordScreen.tsx
│   │   │   ├── RecordDetailScreen.tsx
│   │   │   ├── FileManagementScreen.tsx
│   │   │   ├── AIHubScreen.tsx
│   │   │   ├── AIMedicalAssistantScreen.tsx
│   │   │   ├── DiseasePredictionScreen.tsx
│   │   │   ├── MedicalTermExplainerScreen.tsx
│   │   │   ├── IntelligentMedicalAnalysisScreen.tsx
│   │   │   ├── MedicalRecordAnalysisScreen.tsx
│   │   │   ├── MedicationRemindersScreen.tsx
│   │   │   ├── SmartRemindersScreen.tsx
│   │   │   ├── QRCodeDisplayScreen.tsx
│   │   │   ├── QRScannerScreen.tsx
│   │   │   ├── ShareScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── ProfileSetupScreen.tsx
│   │   ├── OCRScanScreen.tsx
│   │   ├── PrescriptionUploadScreen.tsx
│   │   ├── PrescriptionAnalysisScreen.tsx
│   │   ├── PrescriptionDetailScreen.tsx
│   │   ├── ReminderConfirmationScreen.tsx
│   │   ├── ReminderReviewScreen.tsx
│   │   ├── RemindersListScreen.tsx
│   │   └── WelcomeScreen.tsx
│   ├── components/          # Reusable components
│   │   ├── CustomTabBar.tsx
│   │   ├── NotificationBadge.tsx
│   │   └── CreateMedicationReminders.tsx
│   ├── services/            # API services
│   │   ├── auth.ts
│   │   ├── medicalRecords.ts
│   │   ├── fileUpload.ts
│   │   ├── aiMedicalAssistant.ts
│   │   ├── aiCredibilityService.ts
│   │   ├── medicalTermExplainer.ts
│   │   ├── intelligentMedicalAnalysis.ts
│   │   ├── medicalRecordAnalysis.ts
│   │   ├── prescriptionOCRService.ts
│   │   ├── medicationReminderService.ts
│   │   ├── smartReminders.ts
│   │   ├── aiReminderAnalysis.ts
│   │   ├── notificationService.ts
│   │   ├── qrService.ts
│   │   ├── shareToken.ts
│   │   └── welcomeService.ts
│   ├── navigation/          # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── lib/                 # Core libraries
│   │   ├── supabase.ts
│   │   ├── logger.ts
│   │   └── validation.ts
│   ├── config/              # Configuration
│   │   └── logging.ts
│   ├── theme/               # Theme configuration
│   │   └── medicalTheme.ts
│   ├── assets/              # Images, icons
│   ├── App.tsx              # Main app component
│   ├── app.json             # Expo configuration
│   ├── config.ts            # App configuration
│   └── README.md            # Mobile app documentation
│
├── diagrams/                # Architecture diagrams
├── docs/                    # Documentation
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.x
- npm or yarn
- Expo CLI (for mobile app)
- Supabase account
- API keys for AI services (Gemini, OpenAI - optional)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/E-Health-Record.git
cd E-Health-Record
```

### 2. Setup Backend
```bash
cd Backend
npm install

# Create .env.local from .env.example
cp .env.example .env.local

# Edit .env.local with your credentials
# Start the server
node server.js
```

Backend will run at `http://localhost:3001`

### 3. Setup Mobile App
```bash
cd MobileApp
npm install

# Configure Supabase in config.ts
# Start the app
npm start
```

## 🔧 Configuration

### Backend Environment Variables
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services (Optional)
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
AI_PROVIDER=openai
AI_MODEL=gpt-4

# Server
PORT=3001
NODE_ENV=development

# Medical Validation
ENABLE_MEDICAL_VALIDATION=true
CLINICAL_VALIDATION_ENABLED=true
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
- `users_profile`: User information
- `medical_records`: Medical records
- `medical_files`: File attachments
- `medications`: Medication list
- `medication_reminders`: Medication reminder schedules
- `medication_history`: Medication intake history
- `share_tokens`: Record sharing tokens
- `ai_predictions`: AI disease predictions
- `ai_credibility_scores`: Credibility assessment scores
- `clinical_validations`: Clinical validations
- `medical_validations`: Medical validations
- `ministry_validations`: Ministry of Health validations

## 🔌 API Endpoints

### Medical Records
- `GET /api/medical-records` - Get list of records
- `POST /api/medical-records` - Create new record
- `PUT /api/medical-records/:id` - Update record
- `DELETE /api/medical-records/:id` - Delete record

### AI Services
- `POST /api/ai-simplify` - Simplify medical text
- `POST /api/ai-predict` - Predict diseases
- `POST /api/explain-medical-term` - Explain medical terms
- `POST /api/ai-credibility` - Assess credibility
- `POST /api/analyze-medical-record` - Analyze medical record
- `POST /api/analyze-patient-history` - Analyze patient history

### OCR Services
- `POST /api/ocr/analyze` - Analyze medical record (OCR)
- `POST /api/prescription/analyze` - Analyze prescription
- `POST /api/prescription/create-reminders` - Create reminders
- `POST /api/prescription/check-duplicates` - Check duplicates

### Validation & Integration
- `POST /api/ministry-integration` - Ministry of Health integration
- `POST /api/medical-review` - Medical review

## 🌐 Tech Stack

### Frontend (Mobile)
- React Native 0.81
- Expo SDK 54
- TypeScript 5.9
- React Navigation 6
- Expo Notifications
- React Native QR Code SVG
- React Native PDF

### Backend
- Node.js
- Express.js 5
- Supabase (PostgreSQL)
- Tesseract.js 7
- PDF.js 3
- Sharp 0.33 (Image processing)
- Multer 2 (File upload)

### AI & ML
- Google Gemini AI (@google/generative-ai)
- OpenAI GPT-4 (openai)
- Groq SDK
- DeepSeek OCR

### Database & Auth
- Supabase (@supabase/supabase-js)
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions

## 🔒 Security Features
- ✅ OAuth 2.0 Authentication (Google)
- ✅ JWT Token Management
- ✅ Data Encryption at Rest
- ✅ HTTPS/TLS in Transit
- ✅ Input Validation & Sanitization
- ✅ Row Level Security (RLS)
- ✅ Secure File Upload
- ✅ Token-based Sharing
- ✅ Audit Logging

## 📱 Supported Platforms
- ✅ iOS (iPhone & iPad)
- ✅ Android (Phone & Tablet)
- ✅ Web (Limited features)

## 📊 Professional Dashboards

Access professional dashboards at:
- Medical Review Dashboard: `http://localhost:3001/dashboard/medical-review-dashboard.html`
- Ministry Approval Dashboard: `http://localhost:3001/dashboard/ministry-approval-dashboard.html`
- Ministry Dashboard: `http://localhost:3001/dashboard/ministry-dashboard.html`
- Patient Trust Dashboard: `http://localhost:3001/dashboard/patient-trust-dashboard.html`

## 🧪 Testing

Backend includes test scripts for:
- Database connection
- OCR functionality
- AI integration
- Full flow testing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: NguyenNhatBaoAnh
- **Backend Developer**: NguyenNhatBaoAnh
- **Mobile Developer**: TrinhDuyNghia
- **AI/ML Engineer**: NguyenNhatBaoAnh
- **UI/UX Designer**: TrinhDuyNghia

## 📞 Contact & Support

- 📧 Email: baoanh020603@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/E-Health-Record/issues)

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - React Native framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Google AI](https://ai.google.dev/) - Gemini Vision
- [OpenAI](https://openai.com/) - GPT-4 Vision
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine
- [React Navigation](https://reactnavigation.org/) - Navigation library

---

**⭐ If you find this project useful, please give us a star on GitHub!**
