# 📱 MEDICAL RECORDS - GIỚI THIỆU DỰ ÁN

## 🎯 DỰ ÁN LÀ GÌ?

**Medical Records** là ứng dụng di động giúp:
- 📋 Lưu hồ sơ khám bệnh trên điện thoại
- 💊 Nhắc nhở uống thuốc tự động
- 📸 Chụp đơn thuốc và AI đọc thông tin
- 🤖 Hỏi AI về y tế (tra cứu, phân tích, dự đoán)
- 🔗 Chia sẻ hồ sơ qua mã QR

**Giống như**: Sổ khám bệnh điện tử + Trợ lý AI y tế

---

## 🏗️ DỰ ÁN GỒM 3 PHẦN

```
┌─────────────────────────────────────────────────────┐
│  1. ỨNG DỤNG DI ĐỘNG (Mobile App)                   │
│     - Cái người dùng thấy và dùng                   │
│     - Chạy trên điện thoại Android/iPhone           │
│     - Giao diện đẹp, dễ dùng                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  2. MÁY CHỦ (Backend Server)                        │
│     - Xử lý các tính năng thông minh (AI)          │
│     - Đọc đơn thuốc bằng AI                         │
│     - Dự đoán bệnh bằng AI                          │
│     - Người dùng không thấy phần này                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  3. CƠ SỞ DỮ LIỆU (Database)                        │
│     - Nơi lưu trữ tất cả thông tin                  │
│     - Hồ sơ khám bệnh, thuốc, nhắc nhở             │
│     - An toàn, bảo mật                              │
└─────────────────────────────────────────────────────┘
```

---

## 👥 AI DÙNG?

### Bệnh nhân
- Đăng nhập Google
- Lưu hồ sơ khám bệnh
- Chụp đơn thuốc
- Nhận nhắc nhở uống thuốc
- Hỏi AI về y tế

---

## ✨ TÍNH NĂNG CHÍNH

### 1. 📋 Quản lý hồ sơ
- Lưu thông tin khám bệnh
- Đính kèm ảnh, file PDF
- Xem lịch sử khám
- Tìm kiếm hồ sơ

### 2. 📸 Chụp đơn thuốc
1. Chụp ảnh đơn thuốc
2. AI đọc: tên thuốc, liều dùng, tần suất
3. Tự động tạo lịch nhắc nhở

**Ví dụ:**
```
Đơn thuốc: "Paracetamol 500mg, 3 lần/ngày"
→ AI tạo nhắc: 8:00, 12:00, 18:00
```

### 3. 💊 Nhắc nhở uống thuốc
- Báo thức đúng giờ
- Bấm "Đã uống" hoặc "Bỏ qua"
- Ghi lịch sử uống thuốc
- Thống kê tỷ lệ tuân thủ

### 4. 🤖 AI Trợ lý Y tế (3 tính năng)

**4.1. Tra cứu Y khoa**
- Giải thích thuật ngữ y tế
- Giải thích bệnh đơn giản
- Ví dụ: "Viêm phế quản là gì?"

**4.2. Phân tích Hồ sơ**
- Phân tích hồ sơ khám bệnh
- Tạo nhắc nhở từ đơn thuốc
- Giải thích chẩn đoán

**4.3. Dự đoán & Phòng ngừa**
- Dự đoán nguy cơ tái phát
- Lời khuyên phòng ngừa
- Dấu hiệu cảnh báo

### 5. 🔗 Chia sẻ hồ sơ
- Tạo mã QR
- Bác sĩ quét mã để xem
- Mã có thời hạn, an toàn

---

## 🔐 BẢO MẬT & AN TOÀN

### Đăng nhập
- Dùng tài khoản Google (an toàn)
- Không cần tạo mật khẩu mới
- Tự động đăng xuất khi lâu không dùng

### Dữ liệu
- Lưu trên máy chủ an toàn (Supabase)
- Mã hóa khi truyền tải
- Chỉ bạn xem được hồ sơ của mình
- Không ai khác truy cập được

### Chia sẻ
- Bạn kiểm soát hoàn toàn
- Mã QR có thời hạn
- Có thể hủy bất cứ lúc nào

---

## 📱 GIAO DIỆN ỨNG DỤNG

### 5 màn hình chính

**1. Trang chủ**
- Thống kê: Tổng hồ sơ, ngoại trú, nội trú, cấp cứu
- Thao tác nhanh: Tạo hồ sơ, Xem hồ sơ, Phân tích đơn thuốc, Chia sẻ, Quét QR

**2. Hồ sơ**
- Danh sách hồ sơ khám bệnh
- Tìm kiếm, lọc
- Tạo/sửa hồ sơ

**3. AI Hub (3 tính năng)**
- Tra cứu Y khoa
- Phân tích Hồ sơ & Nhắc nhở
- Dự đoán & Phòng ngừa

**4. Chia sẻ**
- Tạo mã QR chia sẻ
- Quản lý mã đã tạo
- Quét QR

**5. Cá nhân**
- Thông tin: Họ tên, CCCD, BHYT, SĐT
- Cài đặt
- Đăng xuất

---

## 🎬 SỬ DỤNG THỰC TẾ

### Kịch bản 1: Đi khám bệnh
1. Đi khám → Bác sĩ kê đơn
2. Về nhà → Tạo hồ sơ trong app
3. Chụp đơn thuốc → AI đọc và tạo nhắc nhở
4. Uống thuốc đúng giờ → Bấm "Đã uống"

### Kịch bản 2: Tái khám
1. Xem lại hồ sơ cũ
2. Tạo mã QR chia sẻ
3. Bác sĩ quét QR → Xem lịch sử
4. Lưu hồ sơ mới

### Kịch bản 3: Hỏi AI
1. Mở AI Hub → Chọn tính năng
2. Nhập triệu chứng/câu hỏi
3. AI phân tích và trả lời
4. Đọc lời khuyên

---

## 🌟 LỢI ÍCH

✅ Không quên uống thuốc  
✅ Lưu hồ sơ gọn gàng  
✅ Chia sẻ dễ dàng  
✅ Hiểu rõ bệnh  
✅ Tiết kiệm thời gian  

---

## ❓ CÂU HỎI THƯỜNG GẶP

**Q: App có mất phí không?**  
A: Miễn phí. Chỉ cần tài khoản Google.

**Q: Dữ liệu có an toàn không?**  
A: An toàn. Lưu trên Supabase (mã hóa), chỉ bạn truy cập.

**Q: AI có chính xác không?**  
A: AI chỉ hỗ trợ, không thay thế bác sĩ. Luôn tham khảo bác sĩ.

**Q: Có cần internet không?**  
A: Cần internet để đồng bộ và dùng AI.

**Q: Hỗ trợ điện thoại nào?**  
A: Android và iPhone.
