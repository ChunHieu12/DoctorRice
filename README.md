# 🌾 Bác sĩ Lúa - DoctorRice

> Ứng dụng chụp ảnh cây lúa với watermark GPS tự động

[![Expo](https://img.shields.io/badge/Expo-~54.0-blue.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-green.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

## 📱 Giới thiệu

**Bác sĩ Lúa** là ứng dụng mobile giúp nông dân và chuyên gia nông nghiệp chụp ảnh cây lúa với watermark chứa thông tin GPS và thời gian tự động. Ảnh được xử lý trên backend để đảm bảo tính nhất quán và chất lượng.

### ✨ Tính năng chính

- 📸 Chụp ảnh với camera tích hợp
- 🗺️ Tự động gán watermark GPS + timestamp
- 🔐 Đăng nhập đa phương thức (Email, Phone/OTP, Google, Facebook)
- 🌐 Hỗ trợ đa ngôn ngữ (Tiếng Việt, English)
- 📦 Lưu trữ và quản lý ảnh
- 🎨 UI/UX hiện đại với skeleton loading

---

## 🏗️ Kiến trúc

### **Tech Stack**

**Frontend:**
- React Native + Expo Router (Managed Workflow)
- TypeScript
- i18next (Internationalization)
- Axios (HTTP client với retry logic)
- Moti/Reanimated (Animations)
- Expo Camera, Location, SecureStore

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Sharp (Image processing)
- Swagger/OpenAPI 3.0

**Deploy:**
- Frontend: Expo EAS Build
- Backend: Render.com (với anti-sleep cron job)

---

## 📁 Cấu trúc Project

```
DoctorRice/
├── app/                      # Expo Router screens (file-based routing)
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # Home screen
│   ├── (tabs)/              # Tab navigation
│   └── modal.tsx            # Modal screens
│
├── src/                      # Business logic
│   ├── components/          # Reusable components
│   │   ├── skeletons/      # Loading skeletons
│   │   └── ui/             # UI components
│   ├── hooks/              # Custom hooks
│   ├── services/           # API clients
│   │   └── api.ts         # Axios instance với retry
│   ├── constants/          # App constants
│   ├── i18n/               # Internationalization
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── vi.json
│   │       └── en.json
│   ├── utils/              # Helper functions
│   ├── types/              # TypeScript types
│   └── assets/             # Images, icons, fonts
│
├── .env-example            # Environment template
├── app.json                # Expo configuration
├── tsconfig.json           # TypeScript config
├── AppLogicConfig.Md       # App documentation
├── BackendConfig.Md        # Backend API documentation
└── README.md
```

---

## 🚀 Bắt đầu

### **Yêu cầu**

- Node.js 18+ LTS
- npm hoặc yarn
- Expo CLI
- Android Studio / Xcode (optional, cho native builds)

### **Cài đặt**

1. **Clone repository:**
```bash
git clone https://github.com/your-username/DoctorRice.git
cd DoctorRice
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Tạo file `.env`:**
```bash
cp .env-example .env
```

Cập nhật các biến môi trường trong `.env` (xem `.env-example` để biết chi tiết).

4. **Chạy app:**
```bash
# Development
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

---

## 🔧 Configuration

### **Path Aliases**

Project sử dụng path aliases để import dễ dàng hơn:

```typescript
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { COLORS } from '@/constants/colors';
```

### **Environment Variables**

Xem file `.env-example` để biết danh sách đầy đủ. Một số biến quan trọng:

```bash
# App
API_URL=http://localhost:3000
APP_ENV=development

# OAuth
GOOGLE_CLIENT_ID_ANDROID=your-google-client-id
FACEBOOK_APP_ID=your-facebook-app-id

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

---

## 📚 Documentation

### **Tài liệu chi tiết:**

- [AppLogicConfig.Md](./AppLogicConfig.Md) - App architecture, flows, screens
- [BackendConfig.Md](./BackendConfig.Md) - API endpoints, database schemas

### **API Documentation:**

Backend expose Swagger UI tại: `https://your-api.onrender.com/api/docs`

---

## 🌐 Internationalization (i18n)

App hỗ trợ đa ngôn ngữ với `i18next`:

**Ngôn ngữ mặc định:** Tiếng Việt (`vi`)

**Thay đổi ngôn ngữ:**
```typescript
import { changeLanguage } from '@/i18n';

await changeLanguage('en'); // Switch to English
```

**Sử dụng trong component:**
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <Text>{t('common.appName')}</Text>;
}
```

---

## 📸 Camera + Watermark Flow

1. User mở camera
2. App request quyền Camera + Location
3. User chụp ảnh
4. App lấy GPS coordinates
5. Resize ảnh (max 1280px)
6. Upload lên backend với metadata
7. Backend xử lý watermark
8. Backend trả về ảnh đã watermark
9. App lưu ảnh local

**Watermark bao gồm:**
- GPS coordinates (lat, lng)
- Timestamp
- Device info (optional)

---

## 🔐 Authentication

### **Phương thức đăng nhập:**

1. **Email + Password**
2. **Phone + OTP (SMS)**
3. **Google OAuth**
4. **Facebook OAuth**

### **Token Management:**

- **Access Token:** 1 hour (short-lived)
- **Refresh Token:** 7 days (long-lived)
- Storage: Expo SecureStore (encrypted)

---

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## 📦 Build & Deploy

### **Development Build:**

```bash
eas build --profile development --platform android
```

### **Production Build:**

```bash
# Android
eas build --profile production --platform android

# iOS
eas build --profile production --platform ios
```

### **Checklist trước khi release:**

- [ ] Version bump trong `app.json`
- [ ] Update `AppLogicConfig.Md` và `BackendConfig.Md`
- [ ] Chạy `npm run lint`
- [ ] Test trên Android device
- [ ] Test permissions flow
- [ ] Test camera + watermark
- [ ] Test i18n (vi + en)
- [ ] Kiểm tra bundle size

---

## 🐛 Debugging

### **Expo Developer Tools:**

```bash
npm start
```

Press `d` để mở DevTools, `r` để reload.

### **React Native Debugger:**

Sử dụng [React Native Debugger](https://github.com/jhen0409/react-native-debugger) để debug Redux, Network, etc.

### **Logs:**

```bash
# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

---

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m '[DOCS] Add amazing feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

**Commit message format:**
- `[FEAT]` - New feature
- `[FIX]` - Bug fix
- `[DOCS]` - Documentation update
- `[REFACTOR]` - Code refactoring
- `[STYLE]` - Code style changes

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 👥 Team

- **Developer:** Your Name
- **Designer:** Designer Name
- **Project Manager:** PM Name

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [i18next](https://www.i18next.com/)
- [Axios](https://axios-http.com/)

---

## 📞 Support

- Email: support@doctorrice.com
- Issues: [GitHub Issues](https://github.com/your-username/DoctorRice/issues)
- Docs: [Documentation](./AppLogicConfig.Md)

---

**Made with ❤️ for Vietnamese farmers**
