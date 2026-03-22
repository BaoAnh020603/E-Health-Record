# E-Health Record System - Test Cases (Dựa Trên Code Thực Tế)
---

## 🔍 Thông Tin Project Thực Tế

### Backend API Endpoints (từ server.js)
```
Server: http://localhost:3001
Endpoints:
- POST /api/ai-simplify
- POST /api/ai-predict  
- POST /api/medical-review
- POST /api/ministry-integration
- POST /api/ai-credibility
- POST /api/analyze-medical-record
- POST /api/analyze-patient-history
- POST /api/explain-medical-term
- POST /api/analyze-prescription
- POST /api/ocr/analyze
- POST /api/prescription/analyze
- POST /api/prescription/get-data
- POST /api/prescription/create-reminders
- POST /api/prescription/check-duplicates

Dashboards:
- /dashboard/medical-review-dashboard.html
- /dashboard/ministry-approval-dashboard.html
- /dashboard/patient-trust-dashboard.html
```

### AI Providers (từ .env)
- OpenAI (GPT-4) - Có phí
- Hugging Face - Miễn phí
- Gemini (Google) - Có quota

### Database (Supabase)
- medical_records
- medical_files
- share_tokens
- medication_reminders
- medication_history
- appointments
- medications

---

## TC_API_001: Health Check Endpoint

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_API_001 |
| **Test Priority** | Critical |
| **Module** | Backend API |
| **Test Title** | Kiểm tra server đang chạy |
| **Description** | Verify backend server is running and responding |
| **Pre-conditions** | Server started với `npm start` hoặc `npm run dev` |
| **Dependencies** | None |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Start backend server | Command: `cd Backend && npm start` | Server starts on port 3001 | | Not Tested | |
| 2 | Send GET request | URL: `http://localhost:3001/` | Response 200 OK | | Not Tested | |
| 3 | Check response body | | JSON với `status: "AI Medical Assistant API is running - MODIFIED TEST"` | | Not Tested | |
| 4 | Verify endpoints list | | Array chứa 14 endpoints | | Not Tested | |
| 5 | Verify dashboards list | | Array chứa 3 dashboard URLs | | Not Tested | |

---

## TC_API_002: AI Simplify Medical Text

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_API_002 |
| **Test Priority** | High |
| **Module** | AI Simplification |
| **Test Title** | Đơn giản hóa văn bản y tế |
| **Description** | Test API /api/ai-simplify với OpenAI hoặc Hugging Face |
| **Pre-conditions** | - Server running<br>- AI_PROVIDER configured trong .env.local<br>- API key valid |
| **Dependencies** | TC_API_001 |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Check .env.local | File: `Backend/.env.local` | AI_PROVIDER=openai hoặc huggingface | | Not Tested | |
| 2 | Check API key | | OPENAI_API_KEY hoặc HUGGINGFACE_API_KEY có giá trị | | Not Tested | |
| 3 | Send POST request | URL: `http://localhost:3001/api/ai-simplify`<br>Body: `{"technicalText": "Tăng huyết áp nguyên phát", "userName": "Nguyễn Văn A"}` | Response 200 OK | | Not Tested | |
| 4 | Check response structure | | JSON có `success: true`, `data` object | | Not Tested | |
| 5 | Verify simplifiedText | | Có field `simplifiedText` với lời chào "Xin chào Nguyễn Văn A!" | | Not Tested | |
| 6 | Verify keyPoints | | Array có ít nhất 3 điểm chính | | Not Tested | |
| 7 | Verify medicalTermsExplained | | Array giải thích thuật ngữ | | Not Tested | |

---

## TC_API_003: AI Disease Prediction

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_API_003 |
| **Test Priority** | Critical |
| **Module** | AI Prediction |
| **Test Title** | Dự đoán nguy cơ bệnh từ triệu chứng |
| **Description** | Test API /api/ai-predict với clinical validation |
| **Pre-conditions** | - Server running<br>- AI provider configured<br>- userId valid |
| **Dependencies** | TC_API_001 |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Prepare request body | ```json<br>{<br>  "diseaseCode": "I10",<br>  "currentSymptoms": ["Đau đầu", "Chóng mặt"],<br>  "userId": "test-user-123",<br>  "medicalHistory": {"age": 45},<br>  "lifestyle": {}<br>}``` | Request body ready | | Not Tested | |
| 2 | Send POST request | URL: `http://localhost:3001/api/ai-predict` | Response 200 OK | | Not Tested | |
| 3 | Check success field | | `success: true` | | Not Tested | |
| 4 | Verify prediction data | | Object có `diseaseCode`, `diseaseName`, `flareUpProbability` | | Not Tested | |
| 5 | Check risk level | | `riskLevel` in ['low', 'moderate', 'high', 'critical'] | | Not Tested | |
| 6 | Verify clinical validation | | `clinicalValidation` object present | | Not Tested | |
| 7 | Check safety disclaimers | | Array `safetyDisclaimers` có ít nhất 5 items | | Not Tested | |
| 8 | Verify ministry compliance | | `ministry_compliance` object với `compliance_checked: true` | | Not Tested | |

---

## TC_API_004: Emergency Detection

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_API_004 |
| **Test Priority** | Critical |
| **Module** | AI Prediction - Emergency |
| **Test Title** | Phát hiện triệu chứng khẩn cấp |
| **Description** | Test emergency protocol detection trong ai-predict |
| **Pre-conditions** | Server running, AI configured |
| **Dependencies** | TC_API_003 |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Send emergency symptoms | ```json<br>{<br>  "diseaseCode": "I21",<br>  "currentSymptoms": ["Đau ngực dữ dội", "Khó thở"],<br>  "userId": "test-user-123"<br>}``` | Response 200 OK | | Not Tested | |
| 2 | Check emergency flag | | `isEmergency: true` | | Not Tested | |
| 3 | Verify emergency level | | `emergencyLevel` present | | Not Tested | |
| 4 | Check immediate actions | | `preventionAdvice` có category "Hành động khẩn cấp" | | Not Tested | |
| 5 | Verify recommendations | | Chứa "Gọi ngay 115", "Đến phòng cấp cứu" | | Not Tested | |
| 6 | Check requiresImmediateCare | | `requiresImmediateCare: true` | | Not Tested | |

---

## TC_API_005: OCR Analyze Text

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_API_005 |
| **Test Priority** | Critical |
| **Module** | OCR Processing |
| **Test Title** | Phân tích text đơn thuốc bằng DeepSeek |
| **Description** | Test API /api/ocr/analyze với DeepSeek OCR service |
| **Pre-conditions** | - Server running<br>- DeepSeek API configured |
| **Dependencies** | TC_API_001 |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Prepare OCR text | Text: `"Đơn thuốc\nParacetamol 500mg\n2 viên x 3 lần/ngày\nBác sĩ: Nguyễn Văn B"` | Text ready | | Not Tested | |
| 2 | Send POST request | URL: `http://localhost:3001/api/ocr/analyze`<br>Body: `{"text": "...", "userId": "test-123"}` | Response 200 OK | | Not Tested | |
| 3 | Check success | | `success: true` | | Not Tested | |
| 4 | Verify data object | | `data` có `medications` array | | Not Tested | |
| 5 | Check medication extracted | | Medication có `name: "Paracetamol 500mg"` | | Not Tested | |
| 6 | Verify dosage | | `dosage` hoặc `frequency` extracted | | Not Tested | |
| 7 | Check stats | | `stats` object với `originalLength`, `filteredLength`, `filterRate` | | Not Tested | |

---

## TC_API_006: Explain Medical Term

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_API_006 |
| **Test Priority** | High |
| **Module** | Medical Term Explanation |
| **Test Title** | Giải thích thuật ngữ y tế |
| **Description** | Test API /api/explain-medical-term với trusted sources |
| **Pre-conditions** | Server running |
| **Dependencies** | TC_API_001 |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Prepare request | ```json<br>{<br>  "user_id": "test-123",<br>  "term": "Tăng huyết áp",<br>  "include_videos": true,<br>  "language": "vietnamese"<br>}``` | Request ready | | Not Tested | |
| 2 | Send POST request | URL: `http://localhost:3001/api/explain-medical-term` | Response 200 OK | | Not Tested | |
| 3 | Check success | | `success: true` | | Not Tested | |
| 4 | Verify explanation object | | `explanation` có `term`, `simple_explanation`, `detailed_explanation` | | Not Tested | |
| 5 | Check key_points | | Array có ít nhất 3 điểm | | Not Tested | |
| 6 | Verify when_to_worry | | Array có dấu hiệu cảnh báo | | Not Tested | |
| 7 | Check video suggestions | | `video_suggestions` array (nếu include_videos=true) | | Not Tested | |
| 8 | Verify sources | | `sources` array với trusted medical sources | | Not Tested | |
| 9 | Check reliability score | | `reliability_score` >= 90 | | Not Tested | |

---

## TC_DB_001: Medical Records Table

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_DB_001 |
| **Test Priority** | Critical |
| **Module** | Database - Medical Records |
| **Test Title** | Insert và query medical record |
| **Description** | Test medical_records table với RLS policies |
| **Pre-conditions** | - Supabase configured<br>- User authenticated |
| **Dependencies** | None |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Connect to Supabase | URL từ .env.local | Connection successful | | Not Tested | |
| 2 | Authenticate user | User credentials | Auth token received | | Not Tested | |
| 3 | Insert medical record | ```json<br>{<br>  "user_id": "auth-user-id",<br>  "ngay_kham": "2026-03-20",<br>  "ten_benh_vien": "BV Chợ Rẫy",<br>  "chan_doan_vao": "Tăng huyết áp"<br>}``` | Insert successful, ma_hsba auto-generated | | Not Tested | |
| 4 | Verify ma_hsba format | | Format: `HSB26XXXXXX` (HSB + year + 6 digits) | | Not Tested | |
| 5 | Query own records | SELECT * FROM medical_records WHERE user_id = current_user | Returns only user's records | | Not Tested | |
| 6 | Try query other user's records | SELECT * FROM medical_records WHERE user_id != current_user | Returns empty (RLS blocks) | | Not Tested | |

---

## TC_DB_002: Medication Reminders

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_DB_002 |
| **Test Priority** | High |
| **Module** | Database - Medication Reminders |
| **Test Title** | Tạo và query medication reminder |
| **Description** | Test medication_reminders table với auto next_reminder_at |
| **Pre-conditions** | - Database connected<br>- User authenticated |
| **Dependencies** | TC_DB_001 |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Insert medication reminder | ```json<br>{<br>  "user_id": "auth-user-id",<br>  "medication_name": "Paracetamol 500mg",<br>  "dosage": "2 viên",<br>  "frequency": "3 lần/ngày",<br>  "reminder_time": "08:00:00",<br>  "doctor_name": "BS. Nguyễn Văn B"<br>}``` | Insert successful | | Not Tested | |
| 2 | Verify next_reminder_at | | `next_reminder_at` auto-calculated (today 08:00 hoặc tomorrow 08:00) | | Not Tested | |
| 3 | Check default values | | `is_active: true`, `total_reminders: 0`, `completed_count: 0` | | Not Tested | |
| 4 | Query active reminders | SELECT * WHERE is_active = true | Returns active reminders only | | Not Tested | |
| 5 | Update reminder_time | UPDATE reminder_time = '13:00:00' | `next_reminder_at` auto-updates via trigger | | Not Tested | |

---

## TC_DB_003: Share Tokens

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_DB_003 |
| **Test Priority** | High |
| **Module** | Database - Share Tokens |
| **Test Title** | Tạo và validate share token |
| **Description** | Test share_tokens table cho chia sẻ hồ sơ |
| **Pre-conditions** | - Database connected<br>- Medical record exists |
| **Dependencies** | TC_DB_001 |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Generate random token | Token: UUID hoặc random string | Token generated | | Not Tested | |
| 2 | Insert share token | ```json<br>{<br>  "user_id": "owner-id",<br>  "token": "generated-token",<br>  "record_ids": ["record-uuid-1"],<br>  "expires_at": "2026-03-29",<br>  "shared_with_name": "Bác sĩ Nguyễn"<br>}``` | Insert successful | | Not Tested | |
| 3 | Query by token | SELECT * WHERE token = 'generated-token' | Returns token info | | Not Tested | |
| 4 | Check expiration | WHERE expires_at > NOW() | Returns only non-expired tokens | | Not Tested | |
| 5 | Increment access_count | UPDATE access_count = access_count + 1 | Count incremented | | Not Tested | |
| 6 | Check max_access_count | WHERE access_count < max_access_count | Token still valid | | Not Tested | |

---

## TC_ENV_001: Environment Configuration

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_ENV_001 |
| **Test Priority** | Critical |
| **Module** | Configuration |
| **Test Title** | Kiểm tra .env.local configuration |
| **Description** | Verify all required environment variables |
| **Pre-conditions** | .env.local file exists |
| **Dependencies** | None |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Check file exists | File: `Backend/.env.local` | File exists | | Not Tested | |
| 2 | Check AI_PROVIDER | | Value: 'openai' hoặc 'huggingface' hoặc 'gemini' | | Not Tested | |
| 3 | Check API keys | | OPENAI_API_KEY hoặc HUGGINGFACE_API_KEY hoặc GEMINI_API_KEY có giá trị | | Not Tested | |
| 4 | Check Supabase URL | | SUPABASE_URL có format https://xxx.supabase.co | | Not Tested | |
| 5 | Check Supabase keys | | SUPABASE_ANON_KEY và SUPABASE_SERVICE_ROLE_KEY có giá trị | | Not Tested | |
| 6 | Check PORT | | PORT=3001 (hoặc custom port) | | Not Tested | |

---

## TC_ERROR_001: Missing Required Fields

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_ERROR_001 |
| **Test Priority** | High |
| **Module** | Error Handling |
| **Test Title** | Test error khi thiếu required fields |
| **Description** | Verify API returns proper error messages |
| **Pre-conditions** | Server running |
| **Dependencies** | TC_API_001 |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Call ai-simplify without text | Body: `{}` | Response 400 Bad Request | | Not Tested | |
| 2 | Check error message | | `error: "Văn bản y tế không được để trống"` | | Not Tested | |
| 3 | Call ai-predict without diseaseCode | Body: `{"userId": "123"}` | Response 400 | | Not Tested | |
| 4 | Check error message | | `error: "Thông tin không đầy đủ để dự đoán"` | | Not Tested | |
| 5 | Call explain-medical-term without term | Body: `{"user_id": "123"}` | Response 400 | | Not Tested | |
| 6 | Check error message | | `error: "Missing required fields: user_id, term"` | | Not Tested | |

---

## TC_ERROR_002: File Size Limit

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_ERROR_002 |
| **Test Priority** | Medium |
| **Module** | Error Handling - File Upload |
| **Test Title** | Test file size limit (50MB) |
| **Description** | Verify Multer error handling cho file quá lớn |
| **Pre-conditions** | Server running với Multer middleware |
| **Dependencies** | TC_API_001 |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Prepare large file | File size: 51MB (> 50MB limit) | File ready | | Not Tested | |
| 2 | Upload file | POST to upload endpoint | Response 400 Bad Request | | Not Tested | |
| 3 | Check error code | | `error.code: "LIMIT_FILE_SIZE"` | | Not Tested | |
| 4 | Check error message | | `error: "File quá lớn. Vui lòng chọn file nhỏ hơn 50MB."` | | Not Tested | |

---

## TC_DASHBOARD_001: Medical Review Dashboard

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_DASHBOARD_001 |
| **Test Priority** | Medium |
| **Module** | Dashboard |
| **Test Title** | Truy cập Medical Review Dashboard |
| **Description** | Test static HTML dashboard serving |
| **Pre-conditions** | Server running |
| **Dependencies** | TC_API_001 |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Open dashboard URL | URL: `http://localhost:3001/dashboard/medical-review-dashboard.html` | HTML page loads | | Not Tested | |
| 2 | Check page title | | Title chứa "Medical Review" | | Not Tested | |
| 3 | Verify static files | | CSS, JS files load correctly | | Not Tested | |

---

## TC_DASHBOARD_002: Ministry Approval Dashboard

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_DASHBOARD_002 |
| **Test Priority** | Medium |
| **Module** | Dashboard |
| **Test Title** | Truy cập Ministry Approval Dashboard |
| **Description** | Test ministry dashboard |
| **Pre-conditions** | Server running |
| **Dependencies** | TC_API_001 |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Open dashboard URL | URL: `http://localhost:3001/dashboard/ministry-approval-dashboard.html` | HTML page loads | | Not Tested | |
| 2 | Check page content | | Dashboard displays ministry approval info | | Not Tested | |

---

## TC_DASHBOARD_003: Patient Trust Dashboard

| Field | Value |
|-------|-------|
| **Test Case ID** | TC_DASHBOARD_003 |
| **Test Priority** | Medium |
| **Module** | Dashboard |
| **Test Title** | Truy cập Patient Trust Dashboard |
| **Description** | Test patient trust dashboard |
| **Pre-conditions** | Server running |
| **Dependencies** | TC_API_001 |

### Test Steps

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|------------|-----------|-----------------|---------------|--------|-------|
| 1 | Open dashboard URL | URL: `http://localhost:3001/dashboard/patient-trust-dashboard.html` | HTML page loads | | Not Tested | |
| 2 | Check page content | | Dashboard displays patient trust metrics | | Not Tested | |

---

## Test Execution Summary

| Metric | Value |
|--------|-------|
| **Total Test Cases** | 18 |
| **Critical Priority** | 9 |
| **High Priority** | 5 |
| **Medium Priority** | 4 |
| **Executed** | 0 |
| **Passed** | 0 |
| **Failed** | 0 |
| **Not Tested** | 18 |

---

## Test Data Requirements (Thực Tế Từ Code)

### Environment Variables (.env.local)
```bash
# AI Provider (chọn 1 trong 3)
AI_PROVIDER=openai  # hoặc huggingface hoặc gemini
AI_MODEL=gpt-4

# API Keys
OPENAI_API_KEY=sk-...
HUGGINGFACE_API_KEY=hf_...
GEMINI_API_KEY=...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Server
PORT=3001
```

### Test API Requests (Curl Examples)

**Health Check:**
```bash
curl http://localhost:3001/
```

**AI Simplify:**
```bash
curl -X POST http://localhost:3001/api/ai-simplify \
  -H "Content-Type: application/json" \
  -d '{"technicalText": "Tăng huyết áp nguyên phát", "userName": "Nguyễn Văn A"}'
```

**AI Predict:**
```bash
curl -X POST http://localhost:3001/api/ai-predict \
  -H "Content-Type: application/json" \
  -d '{
    "diseaseCode": "I10",
    "currentSymptoms": ["Đau đầu", "Chóng mặt"],
    "userId": "test-user-123",
    "medicalHistory": {"age": 45},
    "lifestyle": {}
  }'
```

**OCR Analyze:**
```bash
curl -X POST http://localhost:3001/api/ocr/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Đơn thuốc\nParacetamol 500mg\n2 viên x 3 lần/ngày",
    "userId": "test-123"
  }'
```

**Explain Medical Term:**
```bash
curl -X POST http://localhost:3001/api/explain-medical-term \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-123",
    "term": "Tăng huyết áp",
    "include_videos": true,
    "language": "vietnamese"
  }'
```

---

## Ghi Chú Quan Trọng

### Những Gì CÓ Trong Code:
✅ Backend API server (Express.js)
✅ AI endpoints: simplify, predict, explain-medical-term
✅ OCR service với DeepSeek
✅ Database schema: medical_records, medication_reminders, share_tokens
✅ Clinical validation service
✅ Ministry integration service
✅ 3 HTML dashboards
✅ RLS policies cho security
✅ Auto-generate ma_hsba (medical record number)
✅ Error handling cho file size, missing fields

### Những Gì KHÔNG CÓ (không test):
❌ Frontend React/Next.js app (chỉ có backend)
❌ User registration/login UI (chỉ có Supabase auth)
❌ File upload UI (chỉ có API endpoint)
❌ Mobile app (chỉ có API cho mobile)

### Cách Chạy Test:
1. Start server: `cd Backend && npm start`
2. Dùng Postman hoặc curl để test API
3. Dùng Supabase dashboard để test database
4. Mở browser để test dashboards

---

**Document Version**: 1.0 (Based on Real Code)  
**Created**: 2026-03-22  
**Code Review Date**: 2026-03-22
