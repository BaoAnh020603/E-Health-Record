# 📱 Medical Records Mobile App

Ứng dụng di động quản lý hồ sơ y tế thông minh với AI, OCR và nhắc nhở uống thuốc tự động.

## 📋 Tổng quan

Ứng dụng mobile được xây dựng bằng React Native (Expo) cung cấp:
- 📄 Quản lý hồ sơ y tế cá nhân
- 🤖 Trợ lý y tế AI thông minh
- 📸 OCR đơn thuốc và hồ sơ y tế
- 💊 Nhắc nhở uống thuốc tự động
- 🔍 Dự đoán bệnh từ triệu chứng
- 📚 Giải thích thuật ngữ y tế
- 🔐 Xác thực an toàn với Google OAuth
- 📊 Phân tích lịch sử bệnh án
- 🔗 Chia sẻ hồ sơ qua QR Code

## 🚀 Công nghệ sử dụng

- **Framework**: React Native + Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Google OAuth
- **State Management**: React Hooks
- **UI Components**: Custom components với Expo Vector Icons
- **Notifications**: Expo Notifications
- **File Handling**: Expo Document Picker, Image Picker, File System
- **QR Code**: react-native-qrcode-svg

## 📦 Cài đặt

### Yêu cầu hệ thống
- Node.js >= 16.x
- npm hoặc yarn
- Expo CLI
- iOS Simulator (Mac) hoặc Android Emulator
- Expo Go app (cho testing trên thiết bị thật)

### Các bước cài đặt

1. **Di chuyển vào thư mục MobileApp**
```bash
cd MobileApp
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Cấu hình Supabase**

Tạo file `config.ts` với thông tin Supabase của bạn:
```typescript
export const SUPABASE_URL = 'your_supabase_url'
export const SUPABASE_ANON_KEY = 'your_supabase_anon_key'
export const BACKEND_URL = 'http://192.168.1.172:3001'
```

4. **Khởi động ứng dụng**

```bash
# Khởi động Expo development server
npm start

# Chạy trên Android
npm run android

# Chạy trên iOS (chỉ Mac)
npm run ios

# Chạy trên web
npm run web
```

## 📱 Tính năng chính

### 🏠 Màn hình chính (Home)
- Dashboard tổng quan
- Thống kê hồ sơ y tế
- Truy cập nhanh các tính năng

### 📄 Quản lý hồ sơ y tế
- **Tạo hồ sơ mới**: Nhập thông tin hoặc upload file
- **Xem chi tiết**: Hiển thị đầy đủ thông tin hồ sơ
- **Chỉnh sửa**: Cập nhật thông tin hồ sơ
- **Xóa**: Quản lý hồ sơ không cần thiết
- **OCR**: Quét và trích xuất thông tin từ ảnh/PDF

### 🤖 AI Hub
- **Trợ lý y tế AI**: Chat với AI về vấn đề sức khỏe
- **Dự đoán bệnh**: Phân tích triệu chứng và đưa ra dự đoán
- **Giải thích thuật ngữ**: Hiểu rõ các thuật ngữ y tế phức tạp
- **Phân tích thông minh**: Đánh giá tổng quan tình trạng sức khỏe
- **Đánh giá độ tin cậy**: Kiểm tra độ tin cậy thông tin y tế

### 💊 Quản lý thuốc
- **Phân tích đơn thuốc**: OCR tự động từ ảnh đơn thuốc
- **Nhắc nhở thông minh**: AI tạo lịch uống thuốc tự động
- **Danh sách nhắc nhở**: Quản lý tất cả lời nhắc
- **Thông báo**: Push notification đúng giờ

### 🔗 Chia sẻ & QR Code
- **Tạo QR Code**: Chia sẻ hồ sơ y tế an toàn
- **Quét QR**: Nhận hồ sơ từ người khác
- **Token chia sẻ**: Kiểm soát quyền truy cập

### 👤 Hồ sơ cá nhân
- Thông tin người dùng
- Cài đặt ứng dụng
- Quản lý tài khoản
- Đăng xuất

## 🗂️ Cấu trúc thư mục

```
MobileApp/
├── assets/                       # Hình ảnh, icons
│   ├── icon.png
│   ├── splash-icon.png
│   └── adaptive-icon.png
├── components/                   # Reusable components
│   ├── CustomTabBar.tsx
│   ├── NotificationBadge.tsx
│   └── CreateMedicationReminders.tsx
├── config/                       # Configuration files
│   └── logging.ts
├── lib/                          # Core libraries
│   ├── supabase.ts              # Supabase client
│   ├── logger.ts                # Logging utility
│   └── validation.ts            # Input validation
├── navigation/                   # Navigation setup
│   └── AppNavigator.tsx
├── screens/                      # App screens
│   ├── auth/
│   │   └── LoginScreen.tsx
│   ├── main/
│   │   ├── HomeScreen.tsx
│   │   ├── MedicalRecordsScreen.tsx
│   │   ├── AIHubScreen.tsx
│   │   ├── AIMedicalAssistantScreen.tsx
│   │   ├── DiseasePredictionScreen.tsx
│   │   ├── MedicalTermExplainerScreen.tsx
│   │   ├── IntelligentMedicalAnalysisScreen.tsx
│   │   ├── MedicationRemindersScreen.tsx
│   │   ├── SmartRemindersScreen.tsx
│   │   ├── QRCodeDisplayScreen.tsx
│   │   ├── QRScannerScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── WelcomeScreen.tsx
│   ├── OCRScanScreen.tsx
│   ├── PrescriptionUploadScreen.tsx
│   └── PrescriptionAnalysisScreen.tsx
├── services/                     # Business logic & API calls
│   ├── auth.ts                  # Authentication
│   ├── medicalRecords.ts        # Medical records CRUD
│   ├── aiMedicalAssistant.ts   # AI chat service
│   ├── aiCredibilityService.ts # Credibility check
│   ├── medicalTermExplainer.ts # Term explanation
│   ├── intelligentMedicalAnalysis.ts
│   ├── prescriptionOCRService.ts
│   ├── medicationReminderService.ts
│   ├── smartReminders.ts
│   ├── notificationService.ts
│   ├── qrService.ts
│   └── shareToken.ts
├── App.tsx                       # Main app component
├── app.json                      # Expo configuration
├── package.json
└── tsconfig.json
```

## 🔐 Authentication Flow

1. **Welcome Screen**: Màn hình chào mừng
2. **Login Screen**: Đăng nhập với Google OAuth
3. **Profile Setup**: Thiết lập thông tin cá nhân (lần đầu)
4. **Main App**: Truy cập đầy đủ tính năng

## 📸 Screenshots

[Thêm screenshots của ứng dụng]

## 🧪 Testing

```bash
# Test authentication
node test-auth.js

# Test Google OAuth
node test-google-oauth.js

# Test file access
node test-file-access.js

# Test medication tables
node test-medication-tables.js

# Test personalized AI
node test-personalized-ai.js
```

## 🔧 Scripts hữu ích

```bash
# Khởi động với port 8081
start-port-8081.bat

# Fix pending files
node fix-pending-files.js
```

## 📊 Database Schema

Ứng dụng sử dụng Supabase với các bảng chính:
- `profiles`: Thông tin người dùng
- `medical_records`: Hồ sơ y tế
- `medications`: Danh sách thuốc
- `medication_reminders`: Lịch nhắc nhở
- `share_tokens`: Token chia sẻ hồ sơ

## 🔔 Push Notifications

Ứng dụng sử dụng Expo Notifications để:
- Nhắc nhở uống thuốc đúng giờ
- Thông báo kết quả phân tích
- Cảnh báo sức khỏe quan trọng

### Cấu hình notifications:
```typescript
// Đăng ký nhận notifications
await Notifications.requestPermissionsAsync()

// Lên lịch notification
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Nhắc nhở uống thuốc",
    body: "Đã đến giờ uống thuốc..."
  },
  trigger: { hour: 8, minute: 0, repeats: true }
})
```

## 🌐 API Integration

Ứng dụng kết nối với Backend API:

```typescript
const BACKEND_URL = 'http://192.168.1.172:3001'

// Example API call
const response = await fetch(`${BACKEND_URL}/api/ai-simplify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id, medical_text })
})
```

## 🎨 Theming & Styling

- Custom color scheme cho medical app
- Responsive design cho mọi kích thước màn hình
- Dark mode support (coming soon)

## 🔒 Bảo mật

- ✅ OAuth 2.0 với Google
- ✅ Secure token storage với AsyncStorage
- ✅ HTTPS cho production
- ✅ Input validation
- ✅ Secure file handling
- ✅ Session management

## 📱 Platform Support

- ✅ iOS (iPhone & iPad)
- ✅ Android
- ✅ Web (limited features)

## 🚀 Build & Deploy

### Development Build
```bash
expo build:android
expo build:ios
```

### EAS Build (Recommended)
```bash
eas build --platform android
eas build --platform ios
```

### Submit to Stores
```bash
eas submit --platform android
eas submit --platform ios
```

## 🐛 Troubleshooting

### Common Issues:

**1. Metro bundler không khởi động**
```bash
npx expo start --clear
```

**2. Lỗi kết nối Backend**
- Kiểm tra Backend đang chạy
- Kiểm tra BACKEND_URL trong config.ts
- Đảm bảo thiết bị và máy tính cùng mạng

**3. Lỗi OAuth**
- Kiểm tra redirect URL trong Supabase dashboard
- Đảm bảo scheme được cấu hình đúng trong app.json

## 📈 Performance

- Lazy loading cho screens
- Image optimization
- Efficient re-renders với React.memo
- Background task handling

