Bác sĩ Lúa

Công nghệ: App Android (React Native + Expo), Backend Node.js, Backend AI (Python + TensorFlow Lite)

---

## 📋 Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [App Android - Frontend](#3-app-android---frontend)
4. [Backend Node.js](#4-backend-nodejs)
5. [Backend AI - Python](#5-backend-ai---python)
6. [Database Schema](#6-database-schema)
7. [Flow hoạt động chi tiết](#7-flow-hoạt-động-chi-tiết)
8. [API Documentation](#8-api-documentation)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Environment Variables](#10-environment-variables)
11. [Security & Best Practices](#11-security--best-practices)

---

## 1. Tổng quan hệ thống

- 📸 Chụp ảnh lúa và phát hiện bệnh tự động bằng AI
- 🗺️ Xem bản đồ các điểm chụp với thông tin dịch bệnh
- 📊 Theo dõi lịch sử chụp ảnh và phân tích
- 🌤️ Xem thông tin thời tiết
- 💬 Chat với AI và chuyên gia
- 🌾 Quản lý ruộng lúa và IoT devices
- 👤 Quản lý tài khoản cá nhân

### 1.2 Tech Stack

Frontend (App Android)

- **Framework**: React Native + Expo SDK 54
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript
- **State**: React Hooks + Context API
- **UI**: Custom components + React Native core
- **Camera**: expo-camera, expo-location, expo-image-manipulator
- **Map**: react-native-webview + Leaflet.js (OpenStreetMap)
- **i18n**: react-i18next + expo-localization
- **Firebase**: @react-native-firebase (Auth, Database, Storage)
- **Real-time**: Socket.io-client

#### **Backend (Node.js)**

- **Runtime**: Node.js 20+ (TypeScript)
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Storage**: Cloudinary (images + watermarking)
- **Auth**: Firebase Authentication + JWT
- **Real-time**: Socket.io
- **API Docs**: Swagger/OpenAPI
- **Hosting**: Render.com

#### **Backend AI (Python)**

- **Runtime**: Python 3.11+
- **Framework**: Flask
- **AI Model**: TensorFlow Lite (model.tflite)
- **Image Processing**: Pillow + NumPy + TensorFlow
- **Server**: Gunicorn
- **Hosting**: Render.com (Docker)

---

## 2. Kiến trúc tổng thể

┌─────────────────────────────────────────────────────────────┐
│ USER (Nông dân) │
└────────────────────┬────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ APP ANDROID (React Native + Expo) │
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐ │
│ │ Home │ Weather │ Camera │ MapFarm │ Account │ │
│ └──────────┴──────────┴──────────┴──────────┴──────────┘ │
│ │
│ Components: CameraScreen, ResultScreen, MapScreen │
│ Hooks: useAuth, usePermissions, useCameraFlow │
│ Services: api.ts (Axios client), photo.service.ts │
│ Real-time: Socket.io client │
└────────────────────┬────────────────────────────────────────┘
│ HTTPS + WebSocket
▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND NODE.JS (Express + MongoDB) │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ API Routes: │ │
│ │ - /api/auth/_ (login, register, social, OTP) │ │
│ │ - /api/photos/_ (upload, list, stats, map) │ │
│ │ - /api/conversations/_ (AI chat, expert chat) │ │
│ │ - /api/experts/_ (expert list, reviews) │ │
│ │ - /api/fields/_ (field management) │ │
│ │ - /api/iot/_ (IoT device management) │ │
│ │ - /api/health (health check) │ │
│ │ - /api/docs (Swagger UI) │ │
│ └────────────────────────────────────────────────────────┘ │
│ │
│ Services: │
│ ├─ cloudinary.service.ts → Cloudinary API │
│ ├─ ai.service.ts → Backend AI │
│ ├─ firebase-admin.service.ts → Firebase Admin │
│ └─ socket.server.ts → Socket.io server │
│ │
│ Database: MongoDB Atlas │
│ Collections: users, photos, conversations, messages, │
│ experts, fields, iotConnections │
└────────┬───────────────────────────────┬────────────────────┘
│ │
▼ ▼
┌──────────────────────┐ ┌──────────────────────────────┐
│ CLOUDINARY │ │ BACKEND AI (Python Flask) │
│ - Image storage │ │ ┌────────────────────────┐ │
│ - Watermarking │ │ │ TensorFlow Lite Model │ │
│ - Thumbnails │ │ │ - 4 classes detection │ │
│ - Transformations │ │ │ - Preprocessing │ │
│ │ │ │ - Prediction API │ │
└──────────────────────┘ │ └────────────────────────┘ │
│ Gunicorn + Docker │
└──────────────────────────────┘

```

---

## 3. App Android - Frontend

```

DoctorRice/
├── app/ # Expo Router (file-based routing)
│ ├── (tabs)/ # Tab Navigator
│ │ ├── \_layout.tsx # Tab layout config
│ │ ├── index.tsx # Home tab
│ │ ├── weather.tsx # Weather tab
│ │ ├── camera.tsx # Camera placeholder (hidden)
│ │ ├── mapFarm.tsx # Map tab
│ │ ├── explore.tsx # Explore tab
│ │ └── account.tsx # Account tab
│ ├── camera-modal.tsx # Full-screen camera modal
│ ├── result.tsx # Photo result screen
│ ├── photo-detail.tsx # Photo detail screen
│ ├── photo-history.tsx # Photo history screen
│ ├── auth/ # Authentication screens
│ │ ├── login.tsx
│ │ ├── otp-login.tsx
│ │ └── complete-registration.tsx
│ ├── expert-_.tsx # Expert chat screens
│ ├── field-management.tsx # Field management
│ ├── iot-_.tsx # IoT device screens
│ └── \_layout.tsx # Root layout
│
├── src/ # Business logic
│ ├── components/ # Reusable UI components
│ │ ├── ui/ # UI primitives
│ │ │ ├── AppHeader.tsx
│ │ │ ├── CustomTabBar.tsx
│ │ │ ├── Button.tsx
│ │ │ └── Modal.tsx
│ │ ├── skeletons/ # Loading skeletons
│ │ ├── WeatherWidgets/ # Weather components
│ │ ├── IoT/ # IoT components
│ │ └── modals/ # Modal components
│ │
│ ├── screens/ # Screen components
│ │ ├── Camera/
│ │ │ └── CameraScreen.tsx
│ │ ├── Result/
│ │ │ └── ResultScreen.tsx
│ │ ├── MapFarm/
│ │ │ └── MapFarmScreenWebView.tsx
│ │ ├── Home/
│ │ │ └── HomeScreen.tsx
│ │ ├── Weather/
│ │ │ └── WeatherScreen.tsx
│ │ ├── Account/
│ │ │ └── AccountScreen.tsx
│ │ ├── Expert/
│ │ │ └── ExpertChatScreen.tsx
│ │ ├── IoT/
│ │ │ └── IoTGalleryScreen.tsx
│ │ └── Field/
│ │ └── FieldManagementScreen.tsx
│ │
│ ├── hooks/ # Custom React hooks
│ │ ├── useAuth.tsx # Authentication
│ │ ├── usePermissions.tsx # Runtime permissions
│ │ ├── useCameraFlow.tsx # Camera workflow
│ │ ├── useSocket.tsx # Socket.io connection
│ │ └── useI18n.tsx # i18n helper
│ │
│ ├── services/ # API clients
│ │ ├── api.ts # Axios instance + config
│ │ ├── auth.service.ts # Auth API calls
│ │ ├── photo.service.ts # Photo API calls
│ │ ├── conversation.service.ts
│ │ ├── expert.service.ts
│ │ ├── field.service.ts
│ │ ├── iot.service.ts
│ │ └── storage.service.ts # AsyncStorage wrapper
│ │
│ ├── i18n/ # Internationalization
│ │ ├── index.ts # i18next config
│ │ └── locales/
│ │ ├── vi.json # Vietnamese (default)
│ │ └── en.json # English
│ │
│ ├── constants/ # App constants
│ │ ├── colors.ts
│ │ ├── spacing.ts
│ │ ├── keys.ts # AsyncStorage keys
│ │ ├── config.ts # App config
│ │ └── firebase.ts # Firebase config
│ │
│ ├── types/ # TypeScript types
│ │ ├── index.ts
│ │ └── weather.types.ts
│ │
│ ├── contexts/ # React contexts
│ │ ├── ChatbotContext.tsx
│ │ └── TextSizeContext.tsx
│ │
│ └── assets/ # Images, fonts, icons
│
├── app.json # Expo configuration
├── package.json # Dependencies
└── tsconfig.json # TypeScript config

```

### 3.2 Navigation Flow

```

App Start
│
▼
Root Layout (\_layout.tsx)
│
├─→ Auth Check (useAuth hook)
│ ├─ Logged in → Main Tabs
│ └─ Not logged in → Login Screen
│
▼
Tab Navigator (tabs/\_layout.tsx)
│
├─→ index (Home Screen)
│ ├─ Recent photos
│ ├─ Quick actions
│ └─ Statistics
│
├─→ weather (Weather Screen)
│ ├─ Current weather
│ ├─ Forecast
│ └─ Weather alerts
│
├─→ camera (Hidden, triggers modal)
│
├─→ mapFarm (Map Screen)
│ ├─ OpenStreetMap via WebView
│ ├─ Photo markers
│ └─ Disease visualization
│
├─→ explore (Explore Screen)
│ ├─ News
│ ├─ Experts
│ └─ Community
│
└─→ account (Account Screen)
├─ Profile
├─ Settings
└─ Logout
│
└─→ Camera Button (Center) → camera-modal.tsx (Full screen)
│
├─ Capture Photo
├─ Pick from Gallery
│
▼
Upload to Backend
│
▼
result.tsx (Show prediction)
│
├─→ "Chụp lại" → Back to camera-modal
├─→ "Xem bản đồ" → mapFarm tab
└─→ "Chi tiết" → photo-detail.tsx

```

### 3.3 Key Components

**A. CustomTabBar.tsx**

- **Chức năng**: Custom 5-tab navigation với camera button nổi giữa
- **Tabs**:
  1. `index` - Trang chủ (Home icon)
  2. `weather` - Thời tiết (Sun icon)
  3. `camera` - Camera (Floating green button)
  4. `mapFarm` - Bản đồ (Map icon)
  5. `account` - Tài khoản (Avatar/Person icon)

**B. CameraScreen.tsx** (via `camera-modal.tsx`)

- **Permissions**: Camera + Location (GPS)
- **Features**:
  - Chụp ảnh với camera thiết bị
  - Chọn ảnh từ thư viện
  - Hiển thị GPS thời gian thực
  - Resize ảnh trước khi upload (max width 1280px)
  - Upload với FormData (multipart/form-data)
  - Loading states & error handling

**Flow chi tiết**:

```

1. Check permissions (camera + location)
   ↓
2. Request permissions if denied
   ↓
3. Show camera preview với GPS overlay
   ↓
4. User chụp/chọn ảnh
   ↓
5. Resize ảnh (expo-image-manipulator)
   - Max width: 1280px
   - Maintain aspect ratio
   - Compress: 0.8
     ↓
6. Get current GPS location
   - Accuracy: High
   - Timeout: 10s
     ↓
7. Create FormData:
   - photo: image blob
   - metadata: JSON string
     {
     lat: number,
     lng: number,
     timestamp: number,
     device: string,
     orientation: 'portrait' | 'landscape'
     }
     ↓
8. POST /api/photos/upload
   - Headers: Authorization Bearer token
   - Content-Type: multipart/form-data
   - Progress tracking
     ↓
9. Receive response:
   {
   success: true,
   data: {
   photo: {
   \_id: string,
   watermarkedUrl: string,
   prediction: {...}
   }
   }
   }
   ↓
10. Navigate to result.tsx với photoId

````

**C. ResultScreen.tsx**

- Hiển thị ảnh đã watermark (hoặc original nếu watermark fail)
- Hiển thị kết quả AI prediction:
  - Class name (English)
  - Class name (Vietnamese)
  - Confidence %
  - All predictions breakdown
  - Hành động khuyến nghị
- Buttons:
  - "Chụp lại" → camera-modal
  - "Xem bản đồ" → mapFarm tab
  - "Chi tiết" → photo-detail

**D. MapFarmScreenWebView.tsx**

- **Map Engine**: Leaflet.js qua WebView (OpenStreetMap)
- **Features**:
  1. Load tất cả photos từ `/api/photos/map`
  2. Hiển thị markers với icon động:
     - ✅ Green border: Healthy
     - 🔴 Red border: Diseased
  3. Marker click:
     - Nếu 1 marker → Navigate to photo-detail
     - Nếu nhiều markers gần nhau (≤50m) → Show ClusterModal
  4. **Disease Visualization**:
     - 🟡 Yellow circle (30m radius) quanh marker bệnh
     - 🔴 Red lines nối các markers bệnh gần nhau
     - 🔴 Red polygon nếu ≥3 markers bệnh gần nhau
  5. Buttons:
     - "📍 Vị trí của tôi" → Center map
     - "📸 Chụp ảnh" → camera-modal

### 3.4 Hooks

**useAuth()**

```typescript
const { user, token, login, logout, isLoading } = useAuth();

// Login flow
await login(phone, otpCode);
// or
await loginWithGoogle(googleToken);

// Logout
await logout();
````

**usePermissions()**

```typescript
const { permissionsState, requestCameraPermission, requestLocationPermission } =
  usePermissions();

// Check status
if (permissionsState.camera === "granted") {
  // Open camera
}

// Request
const granted = await requestCameraPermission();
```

#### **useCameraFlow()**

```typescript
const {
  cameraRef,
  location,
  isUploading,
  capturePhoto,
  pickImageFromGallery,
  uploadPhotoToServer,
  captureAndUpload,
} = useCameraFlow();

// Complete flow: capture and upload
const result = await captureAndUpload();
if (result) {
  router.push(`/result?photoId=${result.photoId}`);
}
```

### 3.5 API Service (`src/services/api.ts`)

```typescript
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://doctorrice-xdhp.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor (add auth token)
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired → logout
      await logout();
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 4. Backend Node.js

### 4.1 Cấu trúc Project

```
backend/
├── src/
│   ├── config/              # Configuration
│   │   ├── database.ts      # MongoDB connection
│   │   ├── cloudinary.ts    # Cloudinary SDK
│   │   ├── firebase.ts      # Firebase Admin SDK
│   │   └── swagger.ts       # Swagger/OpenAPI config
│   │
│   ├── models/              # Mongoose models
│   │   ├── User.ts          # User schema
│   │   ├── Photo.ts         # Photo schema
│   │   ├── Conversation.ts  # Conversation schema
│   │   ├── Message.ts       # Message schema
│   │   ├── ExpertReview.ts  # Expert review schema
│   │   ├── Field.ts         # Field schema
│   │   ├── IoTConnection.ts # IoT connection schema
│   │   └── Session.ts       # Session schema
│   │
│   ├── controllers/         # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── photo.controller.ts
│   │   ├── conversation.controller.ts
│   │   ├── expert.controller.ts
│   │   ├── field.controller.ts
│   │   └── iot.controller.ts
│   │
│   ├── routes/              # Express routes
│   │   ├── auth.routes.ts   # /api/auth/*
│   │   ├── photo.routes.ts  # /api/photos/*
│   │   ├── conversation.routes.ts
│   │   ├── expert.routes.ts
│   │   ├── field.routes.ts
│   │   ├── iot.routes.ts
│   │   └── index.ts         # Route aggregator
│   │
│   ├── services/            # Business logic
│   │   ├── cloudinary.service.ts  # Image upload + watermark
│   │   ├── ai.service.ts          # AI prediction client
│   │   ├── firebase-admin.service.ts # Firebase auth
│   │   └── gemini.service.ts       # Gemini AI chat
│   │
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.ts     # JWT verification
│   │   └── rateLimiter.middleware.ts
│   │
│   ├── jobs/                # Cron jobs
│   │   └── keepAlive.ts     # Keep Render.com awake
│   │
│   ├── socket/              # Socket.io
│   │   └── socket.server.ts # Socket.io server setup
│   │
│   ├── utils/               # Helper functions
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   └── responses.ts
│   │
│   └── server.ts            # Express app entry point
│
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

### 4.2 Core Services

#### **A. Cloudinary Service** (`cloudinary.service.ts`)

**Chức năng**:

1. Upload ảnh original lên Cloudinary
2. Tạo watermark với GPS + timestamp + branding
3. Generate thumbnail (300x300)

**Flow chi tiết**:

```typescript
// 1. Upload original image
const original = await cloudinary.uploader.upload(filePath, {
  folder: "doctorrice/photos",
  public_id: `photo_${userId}_${timestamp}`,
  resource_type: "image",
});

// 2. Generate watermark text
const vietnamDate = dateTime.toLocaleDateString("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const vietnamTime = dateTime.toLocaleTimeString("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const coordsText = `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
const dateTimeText = `${vietnamDate} ${vietnamTime}`;

// 3. Generate watermarked URL
const watermarkedUrl = cloudinary.url(original.public_id, {
  transformation: [
    {
      overlay: {
        font_family: "Arial",
        font_size: 28,
        font_weight: "bold",
        text_align: "right",
        text: `${coordsText} | ${dateTimeText}`,
      },
      gravity: "north_east",
      x: 20,
      y: 60,
      color: "white",
    },
    {
      overlay: {
        font_family: "Arial",
        font_size: 22,
        font_weight: "bold",
        text: "Bac si Lua",
      },
      gravity: "north_east",
      x: 20,
      y: 20,
      color: "rgb:4CAF50",
    },
    {
      quality: "auto:good",
      fetch_format: "auto",
    },
  ],
});

// 4. Generate thumbnail URL
const thumbnailUrl = cloudinary.url(original.public_id, {
  transformation: [
    {
      width: 300,
      height: 300,
      crop: "fill",
      gravity: "auto",
    },
    {
      quality: "auto:good",
      fetch_format: "auto",
    },
  ],
});
```

#### **B. AI Service** (`ai.service.ts`)

**Chức năng**: Gọi Backend AI để phân tích ảnh

**Flow chi tiết**:

```typescript
// 1. Health check (warm up service)
const isHealthy = await AIService.healthCheck();

// 2. Create FormData
const formData = new FormData();
formData.append("image", fs.createReadStream(imagePath));

// 3. Call AI service
const response = await axios.post(`${AI_SERVICE_URL}/predict`, formData, {
  headers: formData.getHeaders(),
  timeout: 120000, // 120s for Render cold start
});

// 4. Parse response
const prediction = {
  class: response.data.prediction.class,
  classVi: response.data.prediction.classVi,
  confidence: response.data.prediction.confidence,
  allPredictions: response.data.prediction.allPredictions,
};
```

### 4.3 API Endpoints

#### **Authentication Routes** (`/api/auth`)

| Method | Endpoint                  | Description                | Auth Required |
| ------ | ------------------------- | -------------------------- | ------------- |
| POST   | `/api/auth/register`      | Đăng ký tài khoản mới      | ❌            |
| POST   | `/api/auth/login`         | Đăng nhập email/password   | ❌            |
| POST   | `/api/auth/otp/send`      | Gửi OTP qua SMS            | ❌            |
| POST   | `/api/auth/otp/verify`    | Xác thực OTP               | ❌            |
| POST   | `/api/auth/firebase`      | Đăng nhập Firebase (phone) | ❌            |
| POST   | `/api/auth/social/google` | Đăng nhập Google           | ❌            |
| POST   | `/api/auth/refresh`       | Refresh JWT token          | ✅            |
| POST   | `/api/auth/logout`        | Đăng xuất                  | ✅            |

#### **Photo Routes** (`/api/photos`)

| Method | Endpoint                    | Description                       | Auth Required |
| ------ | --------------------------- | --------------------------------- | ------------- |
| POST   | `/api/photos/upload`        | Upload ảnh + AI prediction        | ✅            |
| GET    | `/api/photos`               | Lấy danh sách photos (pagination) | ✅            |
| GET    | `/api/photos/:id`           | Lấy chi tiết 1 photo              | ✅            |
| GET    | `/api/photos/stats`         | Thống kê photos của user          | ✅            |
| GET    | `/api/photos/map`           | Lấy markers cho map               | ✅            |
| PUT    | `/api/photos/:id/treatment` | Cập nhật treatment data           | ✅            |
| DELETE | `/api/photos/:id`           | Xóa photo                         | ✅            |

#### **Conversation Routes** (`/api/conversations`)

| Method | Endpoint                          | Description                 | Auth Required |
| ------ | --------------------------------- | --------------------------- | ------------- |
| GET    | `/api/conversations`              | Lấy danh sách conversations | ✅            |
| POST   | `/api/conversations`              | Tạo conversation mới        | ✅            |
| GET    | `/api/conversations/:id`          | Lấy chi tiết conversation   | ✅            |
| POST   | `/api/conversations/:id/messages` | Gửi message                 | ✅            |
| GET    | `/api/conversations/:id/messages` | Lấy messages                | ✅            |

#### **Expert Routes** (`/api/experts`)

| Method | Endpoint                   | Description            | Auth Required |
| ------ | -------------------------- | ---------------------- | ------------- |
| GET    | `/api/experts`             | Lấy danh sách experts  | ✅            |
| GET    | `/api/experts/:id`         | Lấy chi tiết expert    | ✅            |
| GET    | `/api/experts/:id/reviews` | Lấy reviews của expert | ✅            |
| POST   | `/api/experts/:id/reviews` | Tạo review             | ✅            |

#### **Field Routes** (`/api/fields`)

| Method | Endpoint          | Description          | Auth Required |
| ------ | ----------------- | -------------------- | ------------- |
| GET    | `/api/fields`     | Lấy danh sách fields | ✅            |
| POST   | `/api/fields`     | Tạo field mới        | ✅            |
| GET    | `/api/fields/:id` | Lấy chi tiết field   | ✅            |
| PUT    | `/api/fields/:id` | Cập nhật field       | ✅            |
| DELETE | `/api/fields/:id` | Xóa field            | ✅            |

#### **IoT Routes** (`/api/iot`)

| Method | Endpoint                   | Description                   | Auth Required |
| ------ | -------------------------- | ----------------------------- | ------------- |
| GET    | `/api/iot/connections`     | Lấy danh sách IoT connections | ✅            |
| POST   | `/api/iot/connections`     | Tạo IoT connection            | ✅            |
| GET    | `/api/iot/connections/:id` | Lấy chi tiết connection       | ✅            |
| POST   | `/api/iot/analyze`         | Phân tích ảnh IoT             | ✅            |

### 4.4 Photo Upload Flow (Backend)

```
Client POST /api/photos/upload
   ↓
1. Auth Middleware → Verify JWT token
   ↓
2. Multer Middleware → Parse multipart/form-data
   - Save file to /uploads temporarily
   ↓
3. Photo Controller:
   │
   ├─→ Parse metadata (lat, lng, timestamp, device, orientation)
   │   - Support both JSON object and individual form fields
   │   - GPS is OPTIONAL (for chat images)
   │
   ├─→ Create Photo document (status: 'processing')
   │   - originalUrl: ''
   │   - watermarkedUrl: ''
   │   - metadata: { lat, lng, timestamp, device, orientation }
   │
   ├─→ If GPS exists:
   │   ├─→ Warm up AI service (health check)
   │   │
   │   ├─→ Parallel processing:
   │   │   ├─→ Upload to Cloudinary Service
   │   │   │   ├─ Upload original image
   │   │   │   ├─ Generate watermark URL
   │   │   │   └─ Generate thumbnail URL
   │   │   │
   │   │   └─→ Call AI Service
   │   │       ├─ POST to backend-ai /predict
   │   │       └─ Receive prediction
   │   │           {
   │   │             class: 'bacterial_leaf_blight',
   │   │             classVi: 'Bệnh cháy bìa lá',
   │   │             confidence: 99.99,
   │   │             allPredictions: {...}
   │   │           }
   │   │
   └─→ If no GPS (chat image):
       └─→ Simple Cloudinary upload (no watermark, no AI)
   │
   ├─→ Update Photo document
   │   - originalUrl: cloudinary URL
   │   - watermarkedUrl: cloudinary URL with transformations
   │   - thumbnailUrl: cloudinary thumbnail
   │   - prediction: AI result (if available)
   │   - status: 'completed'
   │
   ├─→ Cleanup local file
   │
   └─→ Return response to client
       {
         success: true,
         message: 'Photo uploaded and processed successfully',
         data: {
           photo: { ...fullPhotoObject }
         }
       }
```

**Error Handling**:

- Cloudinary fail → Return 500 (critical)
- AI Service fail → Save photo with `prediction: null`, continue
- Invalid metadata → Return 400
- Unauthorized → Return 401
- File too large → Return 413

---

## 5. Backend AI - Python

### 5.1 Cấu trúc Project

```
backend-ai/
├── app.py                  # Flask app entry point
├── model/
│   └── model.tflite        # TensorFlow Lite model (4 classes)
├── requirements.txt        # Python dependencies
├── Dockerfile              # Docker configuration
├── render.yaml             # Render deployment config
└── README.md
```

### 5.2 Model Information

**Model Type**: TensorFlow Lite (Quantized)  
**Input**: 224x224 RGB image  
**Output**: 4 classes với confidence scores

**Classes**:

1. `bacterial_leaf_blight` → `Bệnh cháy bìa lá`
2. `blast` → `Bệnh đạo ôn`
3. `brown_spot` → `Bệnh đốm nâu`
4. `healthy` → `Lá khỏe mạnh`

### 5.3 Flask API (`app.py`)

**Flow chi tiết**:

```python
# 1. Load model at startup
interpreter = tf.lite.Interpreter(model_path='model/model.tflite')
interpreter.allocate_tensors()

# 2. Preprocess image
def preprocess_image(img_bytes, target_size=(224, 224)):
    img = Image.open(io.BytesIO(img_bytes))
    img = img.convert('RGB')
    img = img.resize(target_size, Image.LANCZOS)
    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    # Preprocess for EfficientNet
    img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
    return img_array.astype(np.float32)

# 3. Run prediction
def predict_disease(img_array):
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    interpreter.set_tensor(input_details[0]['index'], img_array)
    interpreter.invoke()
    predictions = interpreter.get_tensor(output_details[0]['index'])

    pred_idx = np.argmax(predictions, axis=1)[0]
    pred_class = CLASS_NAMES[pred_idx]
    confidence = float(np.max(predictions)) * 100

    all_predictions = {
        CLASS_NAMES[i]: float(predictions[0][i] * 100)
        for i in range(len(CLASS_NAMES))
    }

    return {
        'class': pred_class,
        'classVi': CLASS_NAMES_VI[pred_class],
        'confidence': round(confidence, 2),
        'allPredictions': all_predictions
    }

# 4. API endpoint
@app.route('/predict', methods=['POST'])
def predict():
    file = request.files['image']
    img_bytes = file.read()

    # Preprocess
    img_array = preprocess_image(img_bytes)

    # Predict
    result = predict_disease(img_array)

    return jsonify({
        'success': True,
        'prediction': result,
        'processingTime': round(total_time, 2)
    }), 200
```

### 5.4 Docker Deployment

**Dockerfile**:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copy files
COPY requirements.txt .
COPY app.py .
COPY model/ model/

# Verify model exists
RUN test -f model/model.tflite && echo "✅ Model file found"

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Run with Gunicorn (for production)
CMD gunicorn --bind 0.0.0.0:$PORT \
    --workers 1 \
    --threads 2 \
    --timeout 120 \
    app:app
```

### 5.5 API Endpoints

| Method | Endpoint   | Description       | Response                                  |
| ------ | ---------- | ----------------- | ----------------------------------------- |
| POST   | `/predict` | Phân tích ảnh lúa | `{ success, prediction, processingTime }` |
| GET    | `/health`  | Health check      | `{ status, model_loaded }`                |
| GET    | `/`        | API info          | `{ service, version, endpoints, model }`  |

---

## 6. Database Schema

### 6.1 MongoDB Collections

#### **A. Users Collection**

```typescript
interface User {
  _id: ObjectId;
  email?: string; // Optional
  phone?: string; // Primary identifier (format: 0xxxxxxxxx)
  username?: string;
  passwordHash?: string; // bcrypt hash
  displayName: string; // Required
  avatar?: string; // URL

  // Expert fields
  expertise?: string;
  experience?: string;
  education?: string;
  workHistory?: string;
  detailedWorkHistory?: Array<{
    position: string;
    organization: string;
    period: string;
    description?: string;
  }>;
  rating: number; // 0-5
  totalRatings: number;

  // Presence
  isOnline: boolean;
  lastActiveAt: Date;

  socialIds?: {
    google?: string;
    facebook?: string;
  };
  roles: ("user" | "admin" | "expert")[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:

- `{ email: 1 }` (unique, sparse)
- `{ phone: 1 }` (unique, sparse)
- `{ 'socialIds.google': 1 }` (sparse)
- `{ 'socialIds.facebook': 1 }` (sparse)

#### **B. Photos Collection**

```typescript
interface Photo {
  _id: ObjectId;
  userId: ObjectId;            // ref: User
  originalUrl: string;         // Cloudinary URL
  watermarkedUrl: string;      // Cloudinary URL with transformations
  thumbnailUrl?: string;        // Cloudinary thumbnail
  cloudinaryPublicId?: string; // For deletion

  source: 'upload' | 'iot';    // Source type

  metadata: {
    lat?: number;             // Optional for chat images
    lng?: number;              // Optional for chat images
    timestamp: number;         // Unix timestamp (ms)
    device: string;           // 'Android' | 'iOS'
    orientation: 'portrait' | 'landscape';
    address?: string;         // Reverse geocoded address
  };

  prediction?: {
    class: 'bacterial_leaf_blight' | 'blast' | 'brown_spot' | 'healthy';
    classVi: string;          // Vietnamese label
    confidence: number;       // 0-100
    allPredictions?: Record<string, number>;
  };

  // IoT metadata
  iotMetadata?: {
    deviceId: string;
    fieldId: ObjectId;
    captureId: string;
    firebaseUrl: string;
    sensors: {
      temp: number;
      humidity: number;
      ph: number;
      soil: number;
      lux: number;
      wind: number;
    };
    sensorTimestamp: string;
  };

  // Weather context
  weatherContext?: {
    current: {
      temp: number;
      humidity: number;
      description: string;
    };
    forecast: Array<{
      date: string;
      temp: number;
      humidity: number;
      rain: number;
      description: string;
    }>;
  };

  // AI analysis
  aiAnalysis?: {
    shouldShowSendButton: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    alerts: string[];
  };

  // Treatment data
  treatmentData?: {
    disease: {...};
    currentConditions: {...};
    pesticides: Array<{...}>;
    fertilizers: Array<{...}>;
    wateringSchedule: Array<{...}>;
    schedule: Array<{...}>;
  };

  status: 'processing' | 'completed' | 'failed';
  fileSize: number;            // Bytes
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:

- `{ userId: 1, createdAt: -1 }` (compound index for user queries)
- `{ status: 1 }`
- `{ source: 1 }`
- `{ 'iotMetadata.fieldId': 1 }`

#### **C. Conversations Collection**

```typescript
interface Conversation {
  _id: ObjectId;
  userId: ObjectId; // ref: User
  expertId?: ObjectId; // ref: User (if expert chat)
  type: "ai" | "expert"; // Conversation type
  title?: string; // Auto-generated or user-set
  lastMessage?: {
    content: string;
    timestamp: Date;
    sender: "user" | "expert" | "ai";
  };
  unreadCount: number; // Unread messages count
  createdAt: Date;
  updatedAt: Date;
}
```

#### **D. Messages Collection**

```typescript
interface Message {
  _id: ObjectId;
  conversationId: ObjectId; // ref: Conversation
  senderId: ObjectId; // ref: User
  senderType: "user" | "expert" | "ai";
  content: string;
  attachments?: Array<{
    type: "image" | "file";
    url: string;
    filename?: string;
  }>;
  readAt?: Date;
  createdAt: Date;
}
```

#### **E. Fields Collection**

```typescript
interface Field {
  _id: ObjectId;
  userId: ObjectId; // ref: User
  name: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  area: number; // m²
  cropType: string;
  plantingDate?: Date;
  iotConnections: ObjectId[]; // ref: IoTConnection
  createdAt: Date;
  updatedAt: Date;
}
```

#### **F. IoTConnections Collection**

```typescript
interface IoTConnection {
  _id: ObjectId;
  userId: ObjectId; // ref: User
  fieldId: ObjectId; // ref: Field
  deviceId: string; // Firebase device ID
  connectionCode: string; // Unique connection code
  name: string;
  isActive: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 7. Flow hoạt động chi tiết

### 7.1 Complete Photo Upload Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER OPENS CAMERA                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 2. APP: Request Permissions                                 │
│    - Camera permission                                      │
│    - Location permission                                    │
│    - Media library permission (optional)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 3. APP: Show Camera Screen                                  │
│    - Camera preview                                         │
│    - GPS overlay (real-time lat/lng)                        │
│    - Capture button                                         │
│    - Gallery button                                         │
│    - Flash toggle                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 4. USER: Capture/Pick Image                                 │
│    - Take photo OR pick from gallery                        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 5. APP: Prepare Upload                                      │
│    a) Resize image (max width 1280px)                       │
│       - Maintain aspect ratio                               │
│       - Compress: 0.8                                       │
│       - Format: JPEG                                        │
│    b) Get current GPS coordinates                           │
│       - Accuracy: High                                      │
│       - Timeout: 10s                                        │
│    c) Create FormData:                                      │
│       - photo: image blob                                  │
│       - metadata: JSON string                               │
│         {                                                   │
│           lat: number,                                      │
│           lng: number,                                      │
│           timestamp: number,                                │
│           device: string,                                   │
│           orientation: 'portrait'                           │
│         }                                                   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS POST
┌────────────────────▼────────────────────────────────────────┐
│ 6. BACKEND: /api/photos/upload                              │
│    ↓                                                         │
│    Auth Middleware → Verify JWT token                      │
│    ↓                                                         │
│    Multer Middleware → Parse multipart/form-data            │
│    - Save file to /uploads temporarily                      │
│    ↓                                                         │
│    Photo Controller:                                        │
│      ├─→ Parse metadata                                     │
│      │   - Support JSON object or individual fields         │
│      │   - Validate GPS coordinates                         │
│      │                                                       │
│      ├─→ Create Photo doc (status: 'processing')            │
│      │   - originalUrl: ''                                  │
│      │   - watermarkedUrl: ''                                │
│      │   - metadata: {...}                                  │
│      │                                                       │
│      ├─→ If GPS exists:                                     │
│      │   ├─→ Warm up AI service (health check)              │
│      │   │                                                   │
│      │   └─→ Parallel processing:                           │
│      │       ├─→ Upload to Cloudinary ───────────┐         │
│      │       │     ├─ Upload original image       │         │
│      │       │     ├─ Generate watermark URL       │         │
│      │       │     └─ Generate thumbnail URL        │         │
│      │       │                                       ▼         │
│      │       │                           ┌──────────────┐   │
│      │       │                           │ CLOUDINARY   │   │
│      │       │                           │ - Storage    │   │
│      │       │                           │ - Watermark  │   │
│      │       │                           │ - Transform  │   │
│      │       │                           └──────────────┘   │
│      │       │                                               │
│      │       └─→ Call AI Service ──────────┐               │
│      │             ├─ Send image buffer     │               │
│      │             └─ Receive prediction    │               │
│      │                                 ▼                      │
│      │                           ┌──────────────────┐       │
│      │                           │ BACKEND AI       │       │
│      │                           │ - Preprocess     │       │
│      │                           │ - TFLite Model   │       │
│      │                           │ - Return result  │       │
│      │                           └──────────────────┘       │
│      │                                                       │
│      └─→ If no GPS (chat image):                            │
│          └─→ Simple Cloudinary upload                       │
│              (no watermark, no AI)                           │
│      ↓                                                       │
│    Update Photo doc:                                        │
│      - originalUrl: cloudinary URL                          │
│      - watermarkedUrl: cloudinary URL with transformations  │
│      - thumbnailUrl: cloudinary thumbnail                   │
│      - prediction: AI result (if available)                  │
│      - status: 'completed'                                  │
│      ↓                                                       │
│    Cleanup local file                                       │
│      ↓                                                       │
│    Return response                                          │
└────────────────────┬────────────────────────────────────────┘
                     │ JSON Response
┌────────────────────▼────────────────────────────────────────┐
│ 7. APP: Receive Response                                    │
│    {                                                         │
│      success: true,                                         │
│      message: 'Photo uploaded and processed successfully',   │
│      data: {                                                │
│        photo: {                                             │
│          _id: "...",                                        │
│          originalUrl: "...",                                 │
│          watermarkedUrl: "...",                             │
│          thumbnailUrl: "...",                               │
│          prediction: {                                      │
│            class: 'bacterial_leaf_blight',                  │
│            classVi: 'Bệnh cháy bìa lá',                     │
│            confidence: 99.99,                               │
│            allPredictions: {...}                            │
│          },                                                 │
│          metadata: {...},                                    │
│          status: 'completed'                               │
│        }                                                    │
│      }                                                      │
│    }                                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 8. APP: Navigate to Result Screen                           │
│    - Display watermarked image                              │
│    - Show prediction result                                │
│    - Show action buttons                                    │
│      - "Chụp lại" → Back to camera-modal                    │
│      - "Xem bản đồ" → mapFarm tab                           │
│      - "Chi tiết" → photo-detail.tsx                       │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Authentication Flow

**Firebase Phone Auth Flow**:

```
User enters phone number
   ↓
App → Firebase.auth().signInWithPhoneNumber(phone)
   ↓
Firebase sends OTP → User's phone
   ↓
User enters OTP code
   ↓
App → Firebase.auth().confirmationResult.confirm(code)
   ↓
Firebase returns idToken
   ↓
App → Backend POST /api/auth/firebase
   Body: { idToken: string, phone: string, displayName?: string }
   ↓
Backend:
  - Verify idToken with Firebase Admin SDK
  - Extract phone number from token
  - Check if user exists (by phone)
  - If not exists: create new User
    {
      phone: phone,
      displayName: displayName || 'User',
      isPhoneVerified: true,
      roles: ['user']
    }
  - Generate JWT token (expires 7d)
  - Generate refresh token
  - Save refresh token to Session collection
  - Return { token, refreshToken, user }
   ↓
App:
  - Save token to SecureStore
  - Save refreshToken to SecureStore
  - Set axios default header: Authorization Bearer token
  - Navigate to main app
```

**Google Sign-In Flow**:

```
User taps "Sign in with Google"
   ↓
App → Google Sign-In SDK
   ↓
Google returns idToken
   ↓
App → Backend POST /api/auth/social/google
   Body: { idToken: string }
   ↓
Backend:
  - Verify idToken with Google OAuth2
  - Extract email, name, picture
  - Check if user exists (by email or socialIds.google)
  - If not exists: create new User
  - Update socialIds.google
  - Generate JWT token
  - Return { token, refreshToken, user }
   ↓
App:
  - Save token to SecureStore
  - Navigate to main app
```

### 7.3 Map View Flow

```
User opens MapFarm tab
   ↓
App → GET /api/photos/map
   Headers: Authorization Bearer token
   ↓
Backend returns photos array:
   [
     {
       id: "...",
       latitude: 10.5533812,
       longitude: 106.4544611,
       thumbnail: "https://...",
       image: "https://...",
       prediction: {
         class: 'bacterial_leaf_blight',
         classVi: 'Bệnh cháy bìa lá',
         confidence: 99.99
       },
       createdAt: "..."
     },
     ...
   ]
   ↓
App generates Leaflet map HTML:
   ├─ Create markers for each photo
   │  ├─ Green border if prediction.class === 'healthy'
   │  └─ Red border if prediction.class !== 'healthy'
   │
   ├─ For diseased markers:
   │  ├─ Draw yellow circle (30m radius) around marker
   │  └─ Connect nearby diseased markers with red lines
   │     (if distance ≤ 50m)
   │
   └─ If ≥3 diseased markers within 50m:
      └─ Draw red polygon around cluster
   ↓
User clicks marker
   ↓
App calculates nearby markers (≤50m using Haversine formula)
   ↓
If 1 marker:
  → Navigate to photo-detail?photoId={id}
If multiple markers:
  → Show ClusterModal with list of nearby photos
     User selects photo → Navigate to photo-detail
```

**Clustering Logic**:

```javascript
// Haversine formula: Calculate distance between two GPS points
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// When marker clicked
const nearbyMarkers = markers.filter(
  (m) => getDistance(clickedLat, clickedLng, m.latitude, m.longitude) <= 50
);

if (nearbyMarkers.length === 1) {
  router.push(`/photo-detail?photoId=${nearbyMarkers[0].id}`);
} else {
  setShowClusterModal(true);
  setClusterPhotos(nearbyMarkers);
}
```

### 7.4 AI Chat Flow

```
User opens AI Chat
   ↓
App → GET /api/conversations?type=ai
   ↓
Backend returns conversations list
   ↓
User selects conversation or creates new
   ↓
App → GET /api/conversations/:id/messages
   ↓
Backend returns messages array
   ↓
User sends message
   ↓
App → POST /api/conversations/:id/messages
   Body: { content: string, attachments?: [...] }
   ↓
Backend:
  - Save message to database
  - Call Gemini API for AI response
  - Save AI response as message
  - Emit Socket.io event (real-time update)
  - Return messages
   ↓
App:
  - Display user message
  - Display AI response
  - Update conversation list
```

### 7.5 Expert Chat Flow

```
User opens Expert Chat
   ↓
App → GET /api/experts
   ↓
Backend returns experts list with:
   - displayName, expertise, rating
   - isOnline status
   ↓
User selects expert
   ↓
App → GET /api/conversations?expertId={id}
   ↓
Backend returns existing conversation or null
   ↓
If conversation exists:
  → Load messages
If not:
  → Create new conversation
   ↓
User sends message
   ↓
App → POST /api/conversations/:id/messages
   ↓
Backend:
  - Save message to database
  - Emit Socket.io event to expert
  - Return message
   ↓
Expert receives Socket.io event
   ↓
Expert responds via Socket.io
   ↓
App receives Socket.io event
   ↓
App displays expert message
```

---

## 8. API Documentation

### 8.1 Swagger/OpenAPI

**Access**: `https://doctorrice-xdhp.onrender.com/api/docs`

**Features**:

- Interactive API testing
- Request/response schemas
- Authentication (Bearer token)
- Example requests

### 8.2 Key API Responses

#### **Photo Upload Response**

```json
{
  "success": true,
  "message": "Photo uploaded and processed successfully",
  "data": {
    "photo": {
      "_id": "6908c8037465450c5646f152",
      "userId": "690727fd224fd03f750c6fde",
      "originalUrl": "https://res.cloudinary.com/...",
      "watermarkedUrl": "https://res.cloudinary.com/...",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "metadata": {
        "lat": 10.5533812,
        "lng": 106.4544611,
        "timestamp": 1762183171352,
        "device": "Android 14",
        "orientation": "portrait"
      },
      "prediction": {
        "class": "bacterial_leaf_blight",
        "classVi": "Bệnh cháy bìa lá",
        "confidence": 99.99,
        "allPredictions": {
          "bacterial_leaf_blight": 99.99,
          "blast": 0.0008,
          "brown_spot": 0.00001,
          "healthy": 0.000002
        }
      },
      "status": "completed",
      "fileSize": 88446,
      "createdAt": "2025-11-03T15:19:31.354Z"
    }
  }
}
```

#### **Photos List Response**

```json
{
  "success": true,
  "data": {
    "photos": [
      {
        /* photo object */
      },
      {
        /* photo object */
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### **AI Prediction Response**

```json
{
  "success": true,
  "prediction": {
    "class": "blast",
    "classVi": "Bệnh đạo ôn",
    "confidence": 95.67,
    "allPredictions": {
      "bacterial_leaf_blight": 2.15,
      "blast": 95.67,
      "brown_spot": 1.82,
      "healthy": 0.36
    }
  },
  "processingTime": 1.23
}
```

---

## 9. Deployment Architecture

### 9.1 Hosting on Render.com

```
┌─────────────────────────────────────────────────────────┐
│                    RENDER.COM                           │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Backend Node.js                                │    │
│  │ https://doctorrice-xdhp.onrender.com            │    │
│  │                                                 │    │
│  │ - Web Service (Node 20)                        │    │
│  │ - Auto-deploy from GitHub                      │    │
│  │ - Free tier (sleeps after 15min inactivity)    │    │
│  │ - Environment variables configured             │    │
│  │ - Keep-alive cron job (every 2 minutes)        │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Backend AI (Python)                            │    │
│  │ https://doctorrice-ai-service.onrender.com     │    │
│  │                                                 │    │
│  │ - Docker container                             │    │
│  │ - Gunicorn + Flask                             │    │
│  │ - 1 worker, 2 threads                          │    │
│  │ - 120s timeout                                 │    │
│  │ - Free tier (sleeps after 15min inactivity)    │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              MONGODB ATLAS (Free Tier)                  │
│  - M0 Cluster (512MB storage)                           │
│  - Auto-backups                                         │
│  - IP whitelist: 0.0.0.0/0 (allow all for Render)      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              CLOUDINARY (Free Tier)                     │
│  - 25GB storage                                         │
│  - 25GB bandwidth/month                                 │
│  - Image transformations (watermark, resize)            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              FIREBASE (Spark Plan - Free)               │
│  - Phone Authentication                                 │
│  - Realtime Database                                    │
│  - Cloud Storage                                        │
│  - 10K verifications/month                              │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Cold Start Optimization

**Problem**: Render free tier sleeps after 15min inactivity  
**Solutions**:

1. **Backend Node.js**:

   - Keep-alive cron job (ping `/api/health` every 2 minutes)
   - Increased timeout to 120s for AI requests
   - Health check endpoint for monitoring

2. **Backend AI**:

   - Optimized Gunicorn workers (1 worker, 2 threads)
   - Model loaded at startup (not lazy)
   - Health check endpoint

3. **App**:

   - Show loading skeleton during cold start
   - Retry logic with exponential backoff
   - Timeout handling

4. **Optional**: External uptime monitor (e.g., UptimeRobot) to ping `/health` every 5min

---

## 10. Environment Variables

### 10.1 App Android (`.env`)

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://doctorrice-xdhp.onrender.com/api

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...

# Environment
APP_ENV=production
```

### 10.2 Backend Node.js (`.env`)

```bash
# Server
PORT=3000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/doctorrice

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# Firebase Admin
FIREBASE_PROJECT_ID=doctorrice-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@doctorrice.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret

# AI Service
AI_SERVICE_URL=https://doctorrice-ai-service.onrender.com

# Gemini AI
GEMINI_API_KEY=AIzaSyAywC7Rvl0llJY4Vl7At4wi5vGvX7Ug0JQ

# CORS
CORS_ORIGINS=*

# Keep-alive
CRON_SECRET=your-cron-secret
```

### 10.3 Backend AI (`.env`)

```bash
PORT=5000
FLASK_ENV=production
MODEL_PATH=model/model.tflite
```

---

## 11. Security & Best Practices

### 11.1 Authentication Security

✅ **Implemented**:

- JWT tokens (short-lived: 7 days)
- Refresh tokens (stored in database)
- Passwords hashed with bcrypt (cost factor: 10)
- Firebase phone verification (OTP)
- Bearer token authentication on all protected routes
- Token rotation on refresh

⚠️ **Recommendations**:

- Implement device fingerprinting
- Rate limit login attempts (429 after 5 failed attempts)
- Add 2FA for admin accounts
- Session timeout after inactivity

### 11.2 API Security

✅ **Implemented**:

- Rate limiting (100 requests/15min per IP)
- CORS configured (allow specific origins in production)
- Input validation (Joi schemas)
- File upload size limits (10MB max)
- Helmet.js for HTTP headers
- Render proxy trust (`app.set('trust proxy', 1)`)
- Request timeout (30s default)

⚠️ **Recommendations**:

- Add API key for mobile app
- Implement request signing
- Add DDoS protection (Cloudflare)
- IP whitelist for admin endpoints

### 11.3 Data Security

✅ **Implemented**:

- HTTPS only (enforced by Render)
- MongoDB connection encrypted (TLS)
- Sensitive data not logged
- User passwords excluded from queries (`select: false`)
- Cloudinary signed URLs (time-limited)
- SecureStore for tokens (app)

⚠️ **Recommendations**:

- Encrypt GPS coordinates at rest
- GDPR compliance (data export/deletion)
- Regular security audits
- Data retention policies

### 11.4 Image Security

✅ **Implemented**:

- File type validation (only JPEG, PNG, WebP)
- Image size limits (10MB)
- Malicious file scanning (basic MIME check)
- Cloudinary auto-moderation
- Watermark to prevent unauthorized use

⚠️ **Recommendations**:

- Add virus scanning (ClamAV)
- Content moderation API
- Watermark removal detection
- EXIF data stripping

---

## 12. Monitoring & Logging

### 12.1 Backend Logging

**Winston Logger** (structured logging):

```typescript
logger.info("Photo upload started", {
  userId: req.user._id,
  fileSize: req.file.size,
  metadata: metadata,
});

logger.error("AI prediction failed", {
  error: error.message,
  photoId: photo._id,
});
```

**Log Levels**:

- `error`: Critical errors (500, crashes)
- `warn`: Warnings (401, 400)
- `info`: Info (photo uploads, logins)
- `debug`: Debug (dev only)

### 12.2 Error Tracking

**Recommended**: Sentry.io

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### 12.3 Performance Monitoring

**Metrics to track**:

- API response times (target: <500ms)
- AI prediction times (target: <3s cold, <1s warm)
- Photo upload times (target: <5s)
- Database query times
- Error rates
- Cold start frequency

---

## 13. Development Workflow

### 13.1 Local Development

**Backend**:

```bash
cd backend
npm install
cp .env.example .env  # Configure environment
npm run dev           # Watch mode with nodemon
```

**Backend AI**:

```bash
cd backend-ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py             # Flask dev server
```

**App**:

```bash
npm install
npx expo start            # Start Expo dev server
npx expo run:android      # Run on Android device/emulator
```

### 13.2 Testing

**Backend**:

```bash
npm test                  # Jest unit tests
npm run test:integration  # API integration tests
```

**API Testing** (Swagger UI):

```
1. Open https://doctorrice-xdhp.onrender.com/api/docs
2. Click "Authorize" → Enter Bearer token
3. Test endpoints interactively
```

### 13.3 Deployment

**Backend (Render auto-deploy)**:

```bash
git push origin main      # Auto-deploys to Render
```

**App (EAS Build)**:

```bash
npx eas build --platform android --profile production
npx eas submit --platform android
```

---

## 14. Troubleshooting

### 14.1 Common Issues

#### **Issue**: App can't connect to backend

**Solution**:

```bash
# Check .env
EXPO_PUBLIC_API_URL=https://doctorrice-xdhp.onrender.com/api  # ✅ Correct
# NOT: https://doctorrice-xdhp.onrender.com/api/api  # ❌ Wrong
```

#### **Issue**: AI prediction timeout

**Solution**:

- Backend AI on Render may be sleeping (cold start ~30-60s)
- Increase timeout in `ai.service.ts` to 120s
- Optional: Use uptime monitor to keep service awake

#### **Issue**: Watermarked image not displaying (400 error)

**Solution**:

- Cloudinary URL too long/complex
- Simplify watermark text
- Check transformation syntax in `cloudinary.service.ts`

#### **Issue**: GPS coordinates not captured

**Solution**:

- Check location permission granted
- Wait for GPS to acquire signal (may take 10-30s)
- Disable capture button until GPS available

#### **Issue**: Firebase auth not working

**Solution**:

- Check `google-services.json` is in root
- Verify Firebase project ID matches
- Check Firebase Admin SDK credentials

---

## 15. Future Enhancements

### 15.1 Planned Features

1. **Offline Mode**:

   - Save photos locally
   - Sync when online
   - SQLite for offline storage

2. **Advanced Map**:

   - Heatmaps for disease density
   - Time-series animation
   - Export KML/GeoJSON

3. **AI Improvements**:

   - Multi-disease detection (1 image → multiple diseases)
   - Severity scoring (mild/moderate/severe)
   - Treatment recommendations
   - Disease progression tracking

4. **Social Features**:

   - Share photos with community
   - Disease alerts for nearby farmers
   - Expert consultation scheduling

5. **Analytics Dashboard**:

   - Disease trends over time
   - Region-based statistics
   - Prediction accuracy tracking
   - Yield prediction

6. **IoT Integration**:
   - Real-time sensor monitoring
   - Automated alerts
   - Irrigation scheduling
   - Weather-based recommendations

---

## 📚 Additional Resources

- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **Mongoose**: https://mongoosejs.com
- **Cloudinary**: https://cloudinary.com/documentation
- **TensorFlow Lite**: https://www.tensorflow.org/lite
- **Leaflet.js**: https://leafletjs.com
- **Render Docs**: https://render.com
- **Firebase**: https://firebase.google.com/docs

---
