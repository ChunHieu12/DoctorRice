# ✅ API URL Configuration Summary

**Date**: 2025-10-31  
**Update**: Đảm bảo app Android sử dụng đúng API URL từ backend

---

## 🔧 Thay đổi đã thực hiện

### 1. **app.json** - Production API URL
```json
{
  "extra": {
    "apiUrl": "https://doctorrice.onrender.com/api"  // ← Đã thêm /api
  }
}
```

### 2. **src/services/api.ts** - Default Fallback URL
```typescript
// Before:
return 'https://doctorrice.onrender.com';

// After:
return 'https://doctorrice.onrender.com/api';
```

### 3. **src/constants/config.ts** - Config Constants
```typescript
BASE_URL: Constants.expoConfig?.extra?.apiUrl || 'https://doctorrice.onrender.com/api'
```

### 4. **.env-example** - Updated Example
```env
# Development: Use local backend
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Production: Use deployed backend (uncomment to override app.json)
# EXPO_PUBLIC_API_URL=https://doctorrice.onrender.com/api
```

---

## 📡 API URL Priority

App sẽ chọn API URL theo thứ tự ưu tiên:

1. **Environment Variable** (highest priority)
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3000/api
   ```
   
2. **app.json extra.apiUrl**
   ```json
   "extra": {
     "apiUrl": "https://doctorrice.onrender.com/api"
   }
   ```
   
3. **Default Fallback** (lowest priority)
   ```typescript
   'https://doctorrice.onrender.com/api'
   ```

---

## 🎯 API Endpoints

Tất cả endpoints giờ sẽ có format:

```
https://doctorrice.onrender.com/api/{endpoint}
```

**Examples:**
- `https://doctorrice.onrender.com/api/auth/login`
- `https://doctorrice.onrender.com/api/auth/send-otp`
- `https://doctorrice.onrender.com/api/auth/verify-otp`
- `https://doctorrice.onrender.com/api/health`
- `https://doctorrice.onrender.com/api/docs` (Swagger UI)

---

## 🛠️ Setup cho Development

### Tạo file `.env` (Local Development)

```bash
# Copy từ .env-example
cp .env-example .env
```

**Nội dung `.env` cho local development:**
```env
# API Base URL - Local Backend
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Uncomment để test với production API
# EXPO_PUBLIC_API_URL=https://doctorrice.onrender.com/api
```

⚠️ **Lưu ý**: File `.env` **KHÔNG được commit** vào Git (đã có trong `.gitignore`)

---

## ✅ Verification

### 1. **Check API URL khi app start**

Mở app và xem console logs:

```
📡 API URL from app.json: https://doctorrice.onrender.com/api
```

hoặc (nếu có `.env`):

```
📡 API URL from env: http://localhost:3000/api
```

### 2. **Test API Call**

```bash
# Chạy app
npx expo start --clear

# Thử login và kiểm tra Network tab
# Endpoint phải là: https://doctorrice.onrender.com/api/auth/login
```

### 3. **Backend Health Check**

```bash
# Test backend trực tiếp
curl https://doctorrice.onrender.com/api/health

# Expected response:
{
  "success": true,
  "data": {
    "message": "API is running",
    "timestamp": "2025-10-31T...",
    "environment": "production"
  }
}
```

---

## 🚀 Production Build

Khi build app cho production (Android APK/AAB):

```bash
# Build với EAS
eas build --platform android --profile production

# API URL sẽ tự động sử dụng từ app.json:
# https://doctorrice.onrender.com/api
```

**Không cần** thay đổi gì khi build production. App sẽ tự động dùng URL từ `app.json`.

---

## 🧪 Testing Scenarios

### Scenario 1: Development (Local Backend)
**Setup:**
```env
# .env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Result:** App → `http://localhost:3000/api/auth/login`

---

### Scenario 2: Development (Production Backend)
**Setup:**
```env
# .env
EXPO_PUBLIC_API_URL=https://doctorrice.onrender.com/api
```

**Result:** App → `https://doctorrice.onrender.com/api/auth/login`

---

### Scenario 3: Production Build (No .env)
**Setup:**
- File `.env` bị ignore khi build
- Sử dụng `app.json`

**Result:** App → `https://doctorrice.onrender.com/api/auth/login`

---

## 📋 Checklist

- [x] Cập nhật `app.json` → `extra.apiUrl` thành `https://doctorrice.onrender.com/api`
- [x] Cập nhật `src/services/api.ts` → Default fallback URL
- [x] Cập nhật `src/constants/config.ts` → API_CONFIG.BASE_URL
- [x] Cập nhật `.env-example` → Add local development example
- [x] Hướng dẫn tạo file `.env` local

---

## 🔍 Debug API URL Issues

Nếu app không kết nối được backend:

### 1. **Check console logs**
```javascript
// Trong src/services/api.ts đã có log:
console.log('📡 API URL from app.json:', configUrl);
console.log('📡 API URL from env:', process.env.EXPO_PUBLIC_API_URL);
```

### 2. **Check Network Inspector**
- Expo DevTools → Network tab
- Xem request URL có đúng format không

### 3. **Test Backend Health**
```bash
curl https://doctorrice.onrender.com/api/health
```

### 4. **Check CORS**
Backend `CORS_ORIGINS` phải include domain của app:
```env
# backend/.env
CORS_ORIGINS=http://localhost:8081,exp://192.168.1.100:8081
```

---

## 📞 Support

Nếu gặp vấn đề:
1. Check logs trong Expo DevTools
2. Test backend health endpoint
3. Verify `.env` file format
4. Clear cache: `npx expo start --clear`

---

## ✅ Summary

**Before:**
- App URL: `https://doctorrice.onrender.com` ❌
- Backend routes: `/api/auth/login` ❌
- Result: `https://doctorrice.onrender.com/auth/login` ❌ (404 Not Found)

**After:**
- App URL: `https://doctorrice.onrender.com/api` ✅
- Backend routes: `/auth/login` ✅
- Result: `https://doctorrice.onrender.com/api/auth/login` ✅ (Works!)

---

**Last Updated**: 2025-10-31  
**Status**: ✅ Complete

