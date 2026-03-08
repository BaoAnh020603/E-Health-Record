# 🏗️ KIẾN TRÚC HỆ THỐNG

## 📱 PHẦN 1: ỨNG DỤNG DI ĐỘNG

**Là gì?** Cái bạn thấy trên điện thoại

**Làm gì?**
- Hiển thị giao diện
- Nhận thông tin bạn nhập
- Gửi yêu cầu xử lý
- Hiển thị kết quả

**Công nghệ:**
- React Native 0.81.5 (viết 1 lần, chạy Android + iPhone)
- Expo SDK 54 (phát triển nhanh)
- TypeScript (lập trình an toàn)

**Ví dụ:**
```
Bạn mở app → Thấy màn hình
Bạn bấm "Đăng nhập" → App gửi yêu cầu
Thành công → Hiển thị trang chủ
```

## 🖥️ PHẦN 2: MÁY CHỦ (Backend)

**Là gì?** Máy tính chạy 24/7 xử lý yêu cầu

**Làm gì?**
- Nhận yêu cầu từ app
- Gọi AI phân tích
- Trả kết quả về app

**Công nghệ:**
- Node.js + Express
- JavaScript

**Ví dụ:**
```
App gửi: "Đọc ảnh đơn thuốc"
↓
Máy chủ gọi AI
↓
AI trả: "Paracetamol 500mg, 3 lần/ngày"
↓
Máy chủ gửi về app
```

## 🗄️ PHẦN 3: CƠ SỞ DỮ LIỆU

**Là gì?** Nơi lưu tất cả thông tin

**Lưu gì?**
- Thông tin cá nhân (họ tên, CCCD, BHYT)
- Hồ sơ khám bệnh
- Lịch nhắc nhở uống thuốc
- Lịch sử uống thuốc
- Mã QR chia sẻ

**Công nghệ:**
- Supabase (dịch vụ cloud)
- PostgreSQL (database)

**Tại sao Supabase?**
- Không cần quản lý máy chủ
- Bảo mật tốt
- Tự động backup
- Có sẵn đăng nhập Google

## 🤖 PHẦN 4: AI

### Google Gemini AI
**Làm gì?**
- Giải thích thuật ngữ y tế
- Dự đoán nguy cơ bệnh
- Trả lời câu hỏi y tế

### DeepSeek OCR
**Làm gì?**
- Đọc chữ trong ảnh đơn thuốc
- Nhận diện tên thuốc, liều dùng

**Ví dụ:**
```
Ảnh đơn thuốc → DeepSeek đọc → "Paracetamol 500mg, 3 lần/ngày"
```

## 🔄 LUỒNG HOẠT ĐỘNG

### Ví dụ: Chụp đơn thuốc

```
1. Bạn chụp ảnh
   ↓
2. App gửi ảnh lên máy chủ
   ↓
3. Máy chủ gửi cho DeepSeek AI
   ↓
4. AI đọc: "Paracetamol 500mg, 3 lần/ngày"
   ↓
5. Máy chủ gửi kết quả về app
   ↓
6. App hiển thị và hỏi: "Tạo nhắc nhở?"
   ↓
7. Bạn bấm "Có" → Lưu vào database
   ↓
8. Đúng giờ → App báo: "Uống thuốc!"
```

**Thời gian:** 3-5 giây

## 🔐 BẢO MẬT

### 1. Đăng nhập
- Dùng Google (an toàn)
- App không biết mật khẩu Google của bạn

### 2. Mã hóa dữ liệu
```
Dữ liệu gốc → Mã hóa → Truyền đi → Giải mã
```

### 3. Phân quyền
- Bạn chỉ xem được hồ sơ của mình
- Người khác không xem được
- Trừ khi bạn chia sẻ mã QR

### 4. Chia sẻ có kiểm soát
- Mã QR có thời hạn
- Chỉ xem được 1 lần

## 📊 TỐC ĐỘ

| Tác vụ | Thời gian |
|--------|-----------|
| Đăng nhập | 2-3 giây |
| Tạo hồ sơ | 1 giây |
| Xem hồ sơ | < 1 giây |
| Đọc đơn thuốc | 3-5 giây |
| Hỏi AI | 2-4 giây |

## 💰 CHI PHÍ

### Dịch vụ sử dụng:

**Supabase (Database)**
- Gói Free: 500MB, 2GB/tháng
- Đủ cho 1000+ người dùng

**Google Gemini AI**
- Gói Free: 60 requests/phút
- 1500 requests/ngày

**Máy chủ**
- Chạy local: Miễn phí

**Tổng:** $0-10/tháng

## 🎯 TÓM TẮT

**3 phần chính:**
1. App di động (giao diện)
2. Máy chủ (xử lý AI)
3. Database (lưu trữ)

**Luồng:**
```
Bạn → App → Máy chủ → AI/Database → Máy chủ → App → Bạn
```

**Ưu điểm:**
✅ Đơn giản, dễ hiểu  
✅ Dễ bảo trì  
✅ Chi phí thấp  
✅ Bảo mật tốt  
✅ Nhanh chóng
