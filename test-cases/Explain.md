# Hướng Dẫn Test - Ngắn Gọn Dễ Hiểu

## 🎯 Project Này Có Gì?

### Backend API (Node.js + Express)
```
Server chạy ở: http://localhost:3001
```

**14 API endpoints:**
1. `/api/ai-simplify` - Đơn giản hóa văn bản y tế
2. `/api/ai-predict` - Dự đoán nguy cơ bệnh
3. `/api/explain-medical-term` - Giải thích thuật ngữ y tế
4. `/api/ocr/analyze` - Đọc chữ từ đơn thuốc
5. `/api/prescription/*` - Quản lý đơn thuốc
6. ... và 9 endpoints khác

**3 Dashboards (HTML):**
- Medical Review Dashboard
- Ministry Approval Dashboard  
- Patient Trust Dashboard

**Database (Supabase):**
- `medical_records` - Hồ sơ bệnh án
- `medication_reminders` - Nhắc nhở uống thuốc
- `share_tokens` - Chia sẻ hồ sơ

---

## 🚀 Cách Chạy Test (3 Bước)

### Bước 1: Khởi động server
```bash
cd Backend
npm install
npm start
```
→ Server chạy ở `http://localhost:3001`

### Bước 2: Test bằng Postman hoặc curl

**Ví dụ 1: Kiểm tra server**
```bash
curl http://localhost:3001/
```
Kết quả đúng: JSON với `status: "AI Medical Assistant API is running"`

**Ví dụ 2: Test AI đơn giản hóa văn bản**
```bash
curl -X POST http://localhost:3001/api/ai-simplify \
  -H "Content-Type: application/json" \
  -d '{"technicalText": "Tăng huyết áp", "userName": "Nguyễn Văn A"}'
```
Kết quả đúng: JSON với `success: true` và `simplifiedText`

**Ví dụ 3: Test AI dự đoán bệnh**
```bash
curl -X POST http://localhost:3001/api/ai-predict \
  -H "Content-Type: application/json" \
  -d '{
    "diseaseCode": "I10",
    "currentSymptoms": ["Đau đầu", "Chóng mặt"],
    "userId": "test-123"
  }'
```
Kết quả đúng: JSON với `flareUpProbability`, `riskLevel`, `preventionAdvice`

### Bước 3: Ghi kết quả vào bảng test case

| Test | Kết quả mong đợi | Kết quả thực tế | Pass/Fail |
|------|------------------|-----------------|-----------|
| Health check | Response 200 OK | ✅ 200 OK | Pass |
| AI simplify | success: true | ✅ success: true | Pass |
| AI predict | có riskLevel | ❌ Error 500 | Fail |

---

## 📝 18 Test Cases Chính

### Nhóm 1: API Cơ Bản (3 test)
- **TC_API_001**: Server có chạy không?
- **TC_API_002**: AI đơn giản hóa văn bản
- **TC_API_003**: AI dự đoán bệnh

### Nhóm 2: Tính Năng Đặc Biệt (3 test)
- **TC_API_004**: Phát hiện triệu chứng khẩn cấp
- **TC_API_005**: OCR đọc đơn thuốc
- **TC_API_006**: Giải thích thuật ngữ y tế

### Nhóm 3: Database (3 test)
- **TC_DB_001**: Lưu hồ sơ bệnh án
- **TC_DB_002**: Tạo nhắc nhở uống thuốc
- **TC_DB_003**: Tạo link chia sẻ

### Nhóm 4: Cấu Hình & Lỗi (6 test)
- **TC_ENV_001**: Kiểm tra file .env.local
- **TC_ERROR_001**: Test lỗi thiếu dữ liệu
- **TC_ERROR_002**: Test file quá lớn

### Nhóm 5: Dashboards (3 test)
- **TC_DASHBOARD_001**: Medical Review
- **TC_DASHBOARD_002**: Ministry Approval
- **TC_DASHBOARD_003**: Patient Trust

---

## 🔧 Chuẩn Bị Trước Khi Test

### 1. Kiểm tra file `.env.local`
```bash
cd Backend
cat .env.local
```

Phải có:
```
AI_PROVIDER=openai          # hoặc huggingface
OPENAI_API_KEY=sk-...       # API key thật
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
PORT=3001
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Test kết nối database
```bash
# Mở Supabase dashboard
# Kiểm tra tables: medical_records, medication_reminders
```

---

## 📊 Ví Dụ Test Thực Tế

### Test Case: TC_API_002 (AI Simplify)

**Mục đích**: Kiểm tra AI có đơn giản hóa văn bản y tế không

**Các bước:**

1. **Khởi động server**
   ```bash
   npm start
   ```
   ✅ Thấy: "AI Medical Assistant API running on port 3001"

2. **Gửi request**
   ```bash
   curl -X POST http://localhost:3001/api/ai-simplify \
     -H "Content-Type: application/json" \
     -d '{"technicalText": "Tăng huyết áp nguyên phát", "userName": "Nguyễn Văn A"}'
   ```

3. **Kiểm tra response**
   
   ✅ **PASS** nếu nhận được:
   ```json
   {
     "success": true,
     "data": {
       "simplifiedText": "Xin chào Nguyễn Văn A! Tăng huyết áp...",
       "keyPoints": ["Điểm 1", "Điểm 2", "Điểm 3"],
       "medicalTermsExplained": [...]
     }
   }
   ```

   ❌ **FAIL** nếu:
   - Response 500 (lỗi server)
   - Response 400 (thiếu dữ liệu)
   - `success: false`
   - Không có field `simplifiedText`

4. **Ghi kết quả**
   
   Vào file Excel hoặc bảng:
   ```
   TC_API_002 | AI Simplify | PASS | Response đúng format
   ```

---

## 🐛 Các Lỗi Thường Gặp

### Lỗi 1: Server không chạy
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```
**Giải pháp**: Chạy `npm start` trong folder Backend

### Lỗi 2: API key không hợp lệ
```json
{
  "success": false,
  "error": "API key không hợp lệ"
}
```
**Giải pháp**: Kiểm tra OPENAI_API_KEY trong .env.local

### Lỗi 3: Thiếu dữ liệu
```json
{
  "success": false,
  "error": "Văn bản y tế không được để trống"
}
```
**Giải pháp**: Đây là test case hợp lệ (TC_ERROR_001)

### Lỗi 4: Database không kết nối
```
Error: Invalid Supabase URL
```
**Giải pháp**: Kiểm tra SUPABASE_URL và SUPABASE_ANON_KEY

---

## 📱 Test Bằng Postman (Dễ Hơn Curl)

### Bước 1: Tạo Collection mới
- Tên: "E-Health API Tests"

### Bước 2: Thêm Request

**Request 1: Health Check**
```
Method: GET
URL: http://localhost:3001/
```

**Request 2: AI Simplify**
```
Method: POST
URL: http://localhost:3001/api/ai-simplify
Headers: Content-Type: application/json
Body (raw JSON):
{
  "technicalText": "Tăng huyết áp",
  "userName": "Nguyễn Văn A"
}
```

**Request 3: AI Predict**
```
Method: POST
URL: http://localhost:3001/api/ai-predict
Body (raw JSON):
{
  "diseaseCode": "I10",
  "currentSymptoms": ["Đau đầu", "Chóng mặt"],
  "userId": "test-123",
  "medicalHistory": {"age": 45}
}
```

### Bước 3: Chạy và kiểm tra
- Click "Send"
- Xem tab "Body" để kiểm tra response
- Status 200 = OK, 400/500 = Lỗi

---

## 🎯 Phân Công Test Trong Nhóm

### Người 1: Test API Cơ Bản
- TC_API_001: Health check
- TC_API_002: AI simplify
- TC_API_003: AI predict

### Người 2: Test Tính Năng Đặc Biệt
- TC_API_004: Emergency detection
- TC_API_005: OCR analyze
- TC_API_006: Explain medical term

### Người 3: Test Database
- TC_DB_001: Medical records
- TC_DB_002: Medication reminders
- TC_DB_003: Share tokens

### Người 4: Test Lỗi & Config
- TC_ENV_001: Environment config
- TC_ERROR_001: Missing fields
- TC_ERROR_002: File size limit

### Người 5: Test Dashboards
- TC_DASHBOARD_001: Medical review
- TC_DASHBOARD_002: Ministry approval
- TC_DASHBOARD_003: Patient trust

---

## ✅ Checklist Trước Khi Bắt Đầu

- [ ] Đã cài Node.js
- [ ] Đã chạy `npm install` trong folder Backend
- [ ] File `.env.local` có đầy đủ API keys
- [ ] Server chạy được (`npm start`)
- [ ] Có Postman hoặc biết dùng curl
- [ ] Đã đọc hướng dẫn này

---

## 📞 Khi Cần Hỗ Trợ

**Lỗi về server:**
- Kiểm tra `npm start` có báo lỗi không
- Xem log trong terminal

**Lỗi về API:**
- Kiểm tra request body có đúng format không
- Xem response error message

**Lỗi về database:**
- Vào Supabase dashboard kiểm tra
- Xem RLS policies có đúng không

**Không biết test gì:**
- Đọc lại file TEST_CASES_REAL_PROJECT.md
- Hỏi người đã test xong

---

## 🎓 Tóm Tắt Siêu Ngắn

1. **Chạy server**: `cd Backend && npm start`
2. **Test API**: Dùng Postman hoặc curl
3. **Kiểm tra kết quả**: Response có `success: true` không?
4. **Ghi vào bảng**: Pass/Fail + ghi chú
5. **Báo bug**: Nếu Fail, chụp ảnh + copy error message

**Mục tiêu**: Test 18 test cases, ghi kết quả, tìm bug!

---

**Tài liệu này**: Ngắn gọn, đi thẳng vào việc test  
**Đọc thêm**: TEST_CASES_REAL_PROJECT.md (chi tiết hơn)  
**Cập nhật**: 2026-03-22
