# 🚀 Quick Start: Firebase Phone Auth Migration


---

## 📦 Step 1: Install (2 phút)

### Frontend (App Android):
```bash
cd C:\Users\.Freelancer\CAMERAAPP\DoctorRice
npx expo install firebase expo-firebase-recaptcha
```

### Backend:
```bash
cd backend
npm install firebase-admin
```

---

## 📁 Step 2: Move File (30 giây)

```bash
# Tạo folder
mkdir android\app

# Di chuyển google-services.json
move src\utils\google-services.json android\app\google-services.json
```

---

## 🔑 Step 3: Download Firebase Service Account (2 phút)

1. Vào https://console.firebase.google.com/
2. Chọn project **doctorrice-4e19f**
3. **Project Settings** → **Service Accounts** tab
4. Click **Generate new private key**
5. Download → Lưu vào `backend/firebase-service-account.json`

---

## ⚙️ Step 4: Update Config (1 phút)

### File: `app.json`
Thêm dòng này vào `android`:
```json
{
  "expo": {
    "android": {
      "package": "app.com",
      "googleServicesFile": "./android/app/google-services.json"
    }
  }
}
```

---

## 🚀 Step 5: Start Backend (1 phút)

```bash
cd backend
npm run dev
```

Xem log, phải thấy:
```
🔥 Firebase Admin initialized successfully
```

---

## 📱 Step 6: Start App (1 phút)

```bash
npx expo start --clear
```

---

## 🧪 Step 7: Test

1. Mở app → OTP Login
2. Nhập SĐT: `0123456789`
3. Click "Gửi mã OTP"
4. Kiểm tra SMS → Nhập mã
5. ✅ Done!

---

## ✅ Files đã tạo sẵn

- ✅ `src/services/firebase.ts` - Firebase config
- ✅ `src/screens/Auth/OTPLoginScreen.tsx` - Updated với Firebase + CustomAlert
- ✅ `backend/src/services/firebase-admin.service.ts` - Firebase Admin service
- ⏳ `backend/src/controllers/auth.controller.ts` - Đang update...
- ⏳ `backend/src/server.ts` - Đang update...

---

## ⚠️ Lưu ý

1. **Package name** trong `app.json` PHẢI là `app.com` (match với google-services.json)
2. **firebase-service-account.json** KHÔNG commit lên Git (đã thêm vào .gitignore)
3. **Phone format**: `+84...` (phải có +84)

---

## 🐛 Nếu lỗi?

### Backend lỗi "Firebase Admin failed"
→ Check file `backend/firebase-service-account.json` có đúng không

### App lỗi "Firebase not initialized"
→ Run `npx expo start --clear`

### Không nhận được SMS
→ Enable Phone Auth trong Firebase Console:
   - Authentication → Sign-in method → Phone (Enable)

---

**Tổng thời gian: ~7 phút** ⏱️

**Chạy 2 lệnh chính:**
1. `npx expo install firebase expo-firebase-recaptcha`
2. Download `firebase-service-account.json`

**Còn lại tôi đã code sẵn!** 🎉

