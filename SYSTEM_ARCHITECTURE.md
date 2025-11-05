# 🌾 Bác sĩ Lúa - System Architecture Documentation

> **Tổng quan kiến trúc và flow hoạt động của hệ thống Bác sĩ Lúa**  
> Bao gồm: App Android (React Native + Expo), Backend Node.js, Backend AI (Python + TensorFlow)

---

## 📋 Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [App Android - Frontend](#3-app-android---frontend)
4. [Backend Node.js](#4-backend-nodejs)
5. [Backend AI - Python](#5-backend-ai---python)
6. [Database Schema](#6-database-schema)
7. [Flow hoạt động chính](#7-flow-hoạt-động-chính)
8. [API Documentation](#8-api-documentation)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Environment Variables](#10-environment-variables)
11. [Security & Best Practices](#11-security--best-practices)

---

## 1. Tổng quan hệ thống

### 1.1 Mục đích
**Bác sĩ Lúa** là ứng dụng di động (Android-first) giúp nông dân:
- 📸 Chụp ảnh lúa và phát hiện bệnh tự động bằng AI
- 🗺️ Xem bản đồ các điểm chụp với thông tin dịch bệnh
- 📊 Theo dõi lịch sử chụp ảnh và phân tích
- 🌤️ Xem thông tin thời tiết
- 👤 Quản lý tài khoản cá nhân

### 1.2 Tech Stack

#### **Frontend (App Android)**
- **Framework**: React Native + Expo SDK 54
- **Routing**: Expo Router (file-based)
- **Language**: TypeScript
- **State**: React Hooks + Context API
- **UI**: Custom components + React Native core
- **Camera**: expo-camera, expo-location, expo-image-manipulator
- **Map**: react-native-webview + Leaflet.js (OpenStreetMap)
- **i18n**: react-i18next + expo-localization

#### **Backend (Node.js)**
- **Runtime**: Node.js 20+ (TypeScript)
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Storage**: Cloudinary (images + watermarking)
- **Auth**: Firebase Authentication + JWT
- **API Docs**: Swagger/OpenAPI
- **Hosting**: Render.com

#### **Backend AI (Python)**
- **Runtime**: Python 3.11+
- **Framework**: Flask
- **AI Model**: TensorFlow Lite (model.tflite)
- **Image Processing**: Pillow + NumPy
- **Server**: Gunicorn
- **Hosting**: Render.com (Docker)

---

## 2. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                     USER (Nông dân)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              APP ANDROID (React Native + Expo)              │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │  Home    │ Weather  │ Camera   │  MapFarm │ Account  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│                                                              │
│  Components: CameraScreen, ResultScreen, MapScreen          │
│  Hooks: useAuth, usePermissions, useCameraFlow              │
│  Services: api.ts (Axios client)                            │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           BACKEND NODE.JS (Express + MongoDB)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ API Routes:                                            │ │
│  │ - /api/auth/* (login, register, social)               │ │
│  │ - /api/photos/* (upload, list, stats, map)            │ │
│  │ - /api/health (health check)                          │ │
│  │ - /api/docs (Swagger UI)                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Services:                                                   │
│  ├─ cloudinary.service.ts → Cloudinary API                  │
│  ├─ ai.service.ts → Backend AI                              │
│  └─ firebase.service.ts → Firebase Auth                     │
│                                                              │
│  Database: MongoDB Atlas                                     │
│  Collections: users, photos, sessions                        │
└────────┬───────────────────────────────┬────────────────────┘
         │                               │
         ▼                               ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│  CLOUDINARY          │    │  BACKEND AI (Python Flask)   │
│  - Image storage     │    │  ┌────────────────────────┐  │
│  - Watermarking      │    │  │ TensorFlow Lite Model  │  │
│  - Thumbnails        │    │  │ - 4 classes detection  │  │
│  - Transformations   │    │  │ - Preprocessing        │  │
└──────────────────────┘    │  │ - Prediction API       │  │
                            │  └────────────────────────┘  │
                            │  Gunicorn + Docker           │
                            └──────────────────────────────┘
```

---

## 3. App Android - Frontend

### 3.1 Cấu trúc Project (Hybrid Architecture)

```
DoctorRice/
├── app/                          # Expo Router (file-based routing)
│   ├── (tabs)/                   # Tab Navigator
│   │   ├── _layout.tsx           # Tab layout config
│   │   ├── index.tsx             # Home tab
│   │   ├── weather.tsx           # Weather tab
│   │   ├── camera.tsx            # Camera placeholder (hidden)
│   │   ├── mapFarm.tsx           # Map tab ✅
│   │   └── account.tsx           # Account tab
│   ├── camera-modal.tsx          # Full-screen camera modal
│   ├── result.tsx                # Photo result screen
│   ├── photo-detail.tsx          # Photo detail screen
│   └── _layout.tsx               # Root layout
│
├── src/                          # Business logic
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # UI primitives
│   │   │   ├── AppHeader.tsx     # Global header
│   │   │   ├── CustomTabBar.tsx  # Custom 5-tab bar
│   │   │   └── PermissionRequestModal.tsx
│   │   └── skeletons/            # Loading skeletons
│   │
│   ├── screens/                  # Screen components
│   │   ├── Camera/
│   │   │   └── CameraScreen.tsx  # Camera logic
│   │   ├── Result/
│   │   │   └── ResultScreen.tsx  # Result display
│   │   ├── MapFarm/
│   │   │   └── MapFarmScreenWebView.tsx  # OpenStreetMap
│   │   └── Account/
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.tsx           # Authentication
│   │   ├── usePermissions.tsx    # Runtime permissions
│   │   └── useCameraFlow.tsx     # Camera workflow
│   │
│   ├── services/                 # API clients
│   │   ├── api.ts                # Axios instance + config
│   │   ├── auth.service.ts       # Auth API calls
│   │   └── storage.service.ts    # AsyncStorage wrapper
│   │
│   ├── i18n/                     # Internationalization
│   │   ├── index.ts              # i18next config
│   │   └── locales/
│   │       ├── vi.json           # Vietnamese (default)
│   │       └── en.json           # English
│   │
│   ├── constants/                # App constants
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   └── keys.ts               # AsyncStorage keys
│   │
│   ├── types/                    # TypeScript types
│   │   └── index.ts
│   │
│   └── assets/                   # Images, fonts, icons
│
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

### 3.2 Navigation Flow

```
App Start
   │
   ▼
Root Layout (_layout.tsx)
   │
   ├─→ Auth Check (useAuth hook)
   │   ├─ Logged in → Main Tabs
   │   └─ Not logged in → Login Screen
   │
   ▼
Tab Navigator (tabs/_layout.tsx)
   │
   ├─→ index        (Home Screen)
   ├─→ weather      (Weather Screen)
   ├─→ camera       (Hidden, triggers modal)
   ├─→ mapFarm      (Map Screen) ✅
   └─→ account      (Account Screen)
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

#### **A. CustomTabBar.tsx**
- **Chức năng**: Custom 5-tab navigation với camera button nổi giữa
- **Tabs**:
  1. `index` - Trang chủ (Home icon)
  2. `weather` - Thời tiết (Sun icon)
  3. `camera` - Camera (Floating green button) ✅
  4. `mapFarm` - Bản đồ (Map icon) ✅
  5. `account` - Tài khoản (Avatar/Person icon)

#### **B. CameraScreen.tsx** (via `camera-modal.tsx`)
- **Permissions**: Camera + Location (GPS)
- **Features**:
  - Chụp ảnh với camera thiết bị
  - Chọn ảnh từ thư viện
  - Hiển thị GPS thời gian thực
  - Resize ảnh trước khi upload (max width 1280px)
  - Upload với FormData (multipart/form-data)
  - Loading states & error handling

**Flow**:
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
   ↓
6. Create FormData:
   - file: image blob
   - latitude, longitude
   - timestamp, device, orientation
   ↓
7. POST /api/photos/upload
   ↓
8. Navigate to result.tsx với photoId
```

#### **C. ResultScreen.tsx**
- Hiển thị ảnh đã watermark (hoặc original nếu watermark fail)
- Hiển thị kết quả AI prediction:
  - Class name (English)
  - Class name (Vietnamese)
  - Confidence %
  - Hành động khuyến nghị
- Buttons:
  - "Chụp lại" → camera-modal
  - "Xem bản đồ" → mapFarm tab
  - "Chi tiết" → photo-detail

#### **D. MapFarmScreenWebView.tsx**
- **Map Engine**: Leaflet.js qua WebView (OpenStreetMap)
- **Features**:
  1. Load tất cả photos từ `/api/photos`
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

**Clustering Logic**:
```javascript
// Tính khoảng cách giữa 2 điểm GPS (Haversine formula)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
}

// Khi click marker
if (nearbyMarkers.length === 1) {
  // Navigate to photo detail
  router.push(`/photo-detail?photoId=${marker._id}`);
} else {
  // Show cluster modal với danh sách nearby photos
  setShowClusterModal(true);
}
```

### 3.4 Hooks

#### **useAuth()**
```typescript
const { user, token, login, logout, isLoading } = useAuth();

// Login flow
await login(email, password);
// or
await loginWithGoogle(googleToken);

// Logout
await logout();
```

#### **usePermissions()**
```typescript
const {
  permissionsState,
  requestCameraPermission,
  requestLocationPermission,
} = usePermissions();

// Check status
if (permissionsState.camera === 'granted') {
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
} = useCameraFlow();

// Capture
const photoId = await capturePhoto();
router.push(`/result?photoId=${photoId}`);
```

### 3.5 API Service (`src/services/api.ts`)

```typescript
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL; // https://doctorrice.onrender.com/api

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
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
│   │   └── Session.ts       # Session schema
│   │
│   ├── controllers/         # Route controllers
│   │   ├── auth.controller.ts
│   │   └── photo.controller.ts
│   │
│   ├── routes/              # Express routes
│   │   ├── auth.routes.ts   # /api/auth/*
│   │   └── photo.routes.ts  # /api/photos/*
│   │
│   ├── services/            # Business logic
│   │   ├── cloudinary.service.ts  # Image upload + watermark
│   │   ├── ai.service.ts          # AI prediction client
│   │   └── firebase.service.ts    # Firebase auth
│   │
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.ts     # JWT verification
│   │   ├── rateLimiter.middleware.ts
│   │   └── upload.middleware.ts   # Multer config
│   │
│   ├── utils/               # Helper functions
│   │   ├── logger.ts
│   │   └── validators.ts
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

```typescript
export async function uploadPhotoWithWatermark(
  fileBuffer: Buffer,
  userId: string,
  metadata: {
    lat: number;
    lng: number;
    timestamp: number;
    device: string;
    orientation: string;
  }
): Promise<{
  originalUrl: string;
  watermarkedUrl: string;
  thumbnailUrl: string;
  publicId: string;
  fileSize: number;
}> {
  const timestamp = Date.now();
  const publicId = `doctorrice/photos/photo_${userId}_${timestamp}`;

  // 1. Upload original
  const uploadResult = await cloudinary.uploader.upload(fileBuffer, {
    public_id: publicId,
    folder: 'doctorrice/photos',
    resource_type: 'image',
    // ... config
  });

  // 2. Create watermark URL
  const date = new Date(metadata.timestamp);
  const gpsText = `Lat: ${metadata.lat.toFixed(6)}°N, ${metadata.lng.toFixed(6)}°E`;
  const dateText = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
  
  const watermarkedUrl = cloudinary.url(publicId, {
    transformation: [
      { width: 'iw', height: 60, crop: 'scale', overlay: 'black', opacity: 40, gravity: 'south', y: 0 },
      { overlay: { font_family: 'Arial', font_size: 24, font_weight: 'bold', text: `${gpsText} | ${dateText} | Bác sĩ Lúa` }, color: 'white', gravity: 'south_west', x: 20, y: 20 },
      { overlay: { font_family: 'Arial', font_size: 20, font_weight: 'bold', text: 'Bac si Lua' }, color: '#4CAF50', gravity: 'south_east', x: 15, y: 15 },
    ],
    fetch_format: 'auto',
    quality: 'auto:good',
  });

  // 3. Create thumbnail
  const thumbnailUrl = cloudinary.url(publicId, {
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'auto' },
    ],
    fetch_format: 'auto',
    quality: 'auto:good',
  });

  return {
    originalUrl: uploadResult.secure_url,
    watermarkedUrl,
    thumbnailUrl,
    publicId,
    fileSize: uploadResult.bytes,
  };
}
```

#### **B. AI Service** (`ai.service.ts`)

**Chức năng**: Gọi Backend AI để phân tích ảnh

```typescript
export async function predictDiseaseFromBuffer(
  imageBuffer: Buffer
): Promise<{
  class: string;
  classVi: string;
  confidence: number;
  allPredictions: Record<string, number>;
}> {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL; // https://doctorrice-ai-service.onrender.com
  const AI_REQUEST_TIMEOUT = 60000; // 60s (for Render cold start)

  const formData = new FormData();
  formData.append('file', imageBuffer, { filename: 'image.jpg' });

  const response = await axios.post(`${AI_SERVICE_URL}/predict`, formData, {
    headers: formData.getHeaders(),
    timeout: AI_REQUEST_TIMEOUT,
  });

  return {
    class: response.data.class,
    classVi: response.data.class_vi,
    confidence: response.data.confidence,
    allPredictions: response.data.all_predictions,
  };
}
```

### 4.3 API Endpoints

#### **Authentication Routes** (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới | ❌ |
| POST | `/api/auth/login` | Đăng nhập email/password | ❌ |
| POST | `/api/auth/social/google` | Đăng nhập Google | ❌ |
| POST | `/api/auth/refresh` | Refresh JWT token | ✅ |
| POST | `/api/auth/logout` | Đăng xuất | ✅ |

#### **Photo Routes** (`/api/photos`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/photos/upload` | Upload ảnh + AI prediction | ✅ |
| GET | `/api/photos` | Lấy danh sách photos (pagination) | ✅ |
| GET | `/api/photos/:id` | Lấy chi tiết 1 photo | ✅ |
| GET | `/api/photos/stats` | Thống kê photos của user | ✅ |
| GET | `/api/photos/map` | Lấy markers cho map | ✅ |
| DELETE | `/api/photos/:id` | Xóa photo | ✅ |

### 4.4 Photo Upload Flow (Backend)

```
Client POST /api/photos/upload
   ↓
1. Auth Middleware → Verify JWT token
   ↓
2. Multer Middleware → Parse multipart/form-data
   ↓
3. Photo Controller:
   │
   ├─→ Parse metadata (lat, lng, timestamp, device, orientation)
   │
   ├─→ Create Photo document (status: 'processing')
   │   - originalUrl: ''
   │   - watermarkedUrl: ''
   │
   ├─→ Upload to Cloudinary Service
   │   ├─ Upload original image
   │   ├─ Generate watermark URL
   │   └─ Generate thumbnail URL
   │
   ├─→ Call AI Service (parallel)
   │   ├─ POST to backend-ai /predict
   │   └─ Receive prediction { class, classVi, confidence, allPredictions }
   │
   ├─→ Update Photo document
   │   - originalUrl: cloudinary URL
   │   - watermarkedUrl: cloudinary URL with transformations
   │   - thumbnailUrl: cloudinary thumbnail
   │   - prediction: AI result
   │   - status: 'completed'
   │
   └─→ Return response to client
       {
         success: true,
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

---

## 5. Backend AI - Python

### 5.1 Cấu trúc Project

```
backend-ai/
├── app.py                  # Flask app entry point
├── model.tflite            # TensorFlow Lite model (4 classes)
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
1. `bacterial_leaf_blight` → `Bệnh bạc lá vi khuẩn`
2. `blast` → `Bệnh đạo ôn`
3. `brown_spot` → `Bệnh đốm nâu`
4. `healthy` → `Lá khỏe mạnh`

### 5.3 Flask API (`app.py`)

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from PIL import Image
import numpy as np
import io

app = Flask(__name__)
CORS(app)

# Load model at startup
interpreter = None

def load_model():
    global interpreter
    interpreter = tf.lite.Interpreter(model_path='model.tflite')
    interpreter.allocate_tensors()
    print("✅ Model loaded successfully")

load_model()  # Load outside if __name__ == '__main__' for Gunicorn workers

# Class mapping
CLASS_NAMES = {
    0: 'bacterial_leaf_blight',
    1: 'blast',
    2: 'brown_spot',
    3: 'healthy'
}

CLASS_NAMES_VI = {
    'bacterial_leaf_blight': 'Bệnh bạc lá vi khuẩn',
    'blast': 'Bệnh đạo ôn',
    'brown_spot': 'Bệnh đốm nâu',
    'healthy': 'Lá khỏe mạnh'
}

@app.route('/predict', methods=['POST'])
def predict():
    if interpreter is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    try:
        # 1. Read image
        image = Image.open(io.BytesIO(file.read()))
        
        # 2. Preprocess
        image = image.convert('RGB')
        image = image.resize((224, 224))
        image_array = np.array(image, dtype=np.float32)
        image_array = image_array / 255.0  # Normalize
        image = image.convert('RGB')
        image = image.resize((224, 224))
        image_array = np.array(image, dtype=np.float32)
        image_array = image_array / 255.0  # Normalize
        image_array = np.expand_dims(image_array, axis=0)
        
        # 3. Run prediction
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        
        interpreter.set_tensor(input_details[0]['index'], image_array)
        interpreter.invoke()
        predictions = interpreter.get_tensor(output_details[0]['index'])
        
        # 4. Process results
        pred_idx = np.argmax(predictions, axis=1)[0]
        pred_class = CLASS_NAMES[pred_idx]
        confidence = float(np.max(predictions)) * 100
        
        # All class probabilities
        all_predictions = {
            CLASS_NAMES[i]: float(predictions[0][i] * 100)
            for i in range(len(CLASS_NAMES))
        }
        
        return jsonify({
            'class': pred_class,
            'class_vi': CLASS_NAMES_VI[pred_class],
            'confidence': round(confidence, 2),
            'all_predictions': all_predictions
        }), 200
        
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': interpreter is not None
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
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
COPY model.tflite .

# Verify model exists
RUN test -f model.tflite && echo "✅ Model file found"

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

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| POST | `/predict` | Phân tích ảnh lúa | `{ class, class_vi, confidence, all_predictions }` |
| GET | `/health` | Health check | `{ status: 'healthy' }` |

---

## 6. Database Schema

### 6.1 MongoDB Collections

#### **A. Users Collection**

```typescript
interface User {
  _id: ObjectId;
  email?: string;              // Optional (for future)
  phone?: string;              // Primary identifier (format: 0xxxxxxxxx)
  username?: string;
  passwordHash?: string;       // bcrypt hash
  displayName: string;         // Required
  avatar?: string;             // URL
  socialIds?: {
    google?: string
  };
  roles: ('user' | 'admin')[];
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

#### **B. Photos Collection**

```typescript
interface Photo {
  _id: ObjectId;
  userId: ObjectId;            // ref: User
  originalUrl: string;         // Cloudinary URL
  watermarkedUrl: string;      // Cloudinary URL with transformations
  thumbnailUrl?: string;       // Cloudinary thumbnail
  cloudinaryPublicId?: string; // For deletion
  metadata: {
    lat: number;               // GPS latitude
    lng: number;               // GPS longitude
    timestamp: number;         // Unix timestamp (ms)
    device: string;            // 'Android' | 'iOS'
    orientation: 'portrait' | 'landscape';
    address?: string;          // Reverse geocoded address
  };
  prediction?: {
    class: 'bacterial_leaf_blight' | 'blast' | 'brown_spot' | 'healthy';
    classVi: string;           // Vietnamese label
    confidence: number;        // 0-100
    allPredictions?: Record<string, number>;
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

#### **C. Sessions Collection** (Optional - for refresh tokens)

```typescript
interface Session {
  _id: ObjectId;
  userId: ObjectId;
  refreshToken: string;        // Hashed refresh token
  deviceInfo?: {
    platform: string;
    model: string;
  };
  expiresAt: Date;
  createdAt: Date;
}
```

**Indexes**:
- `{ userId: 1 }`
- `{ refreshToken: 1 }` (unique)
- `{ expiresAt: 1 }` (TTL index for auto-cleanup)

---

## 7. Flow hoạt động chính

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
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 3. APP: Show Camera Screen                                  │
│    - Camera preview                                         │
│    - GPS overlay (real-time lat/lng)                        │
│    - Capture button                                         │
│    - Gallery button                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 4. USER: Capture/Pick Image                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 5. APP: Prepare Upload                                      │
│    a) Resize image (max width 1280px)                       │
│    b) Get current GPS coordinates                           │
│    c) Create FormData:                                      │
│       - file: image blob                                    │
│       - latitude: number                                    │
│       - longitude: number                                   │
│       - timestamp: unix ms                                  │
│       - device: 'Android'                                   │
│       - orientation: 'portrait'                             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS POST
┌────────────────────▼────────────────────────────────────────┐
│ 6. BACKEND: /api/photos/upload                              │
│    ↓                                                         │
│    Auth Middleware → Verify JWT                             │
│    ↓                                                         │
│    Multer Middleware → Parse multipart/form-data            │
│    ↓                                                         │
│    Photo Controller:                                        │
│      ├─→ Parse metadata                                     │
│      ├─→ Create Photo doc (status: 'processing')            │
│      ├─→ Upload to Cloudinary ──────────────────────┐       │
│      │     ├─ Original URL                          ▼       │
│      │     ├─ Watermark URL              ┌──────────────┐   │
│      │     └─ Thumbnail URL              │ CLOUDINARY   │   │
│      │                                    │ - Storage    │   │
│      └─→ Call AI Service ──────────┐     │ - Watermark  │   │
│            ├─ Send image buffer     │     └──────────────┘   │
│            └─ Receive prediction    ▼                        │
│                           ┌──────────────────┐               │
│                           │ BACKEND AI       │               │
│                           │ - Preprocess     │               │
│                           │ - TFLite Model   │               │
│                           │ - Return result  │               │
│                           └──────────────────┘               │
│      ↓                                                       │
│    Update Photo doc:                                        │
│      - originalUrl, watermarkedUrl, thumbnailUrl            │
│      - prediction { class, classVi, confidence }            │
│      - status: 'completed'                                  │
│      ↓                                                       │
│    Return response                                          │
└────────────────────┬────────────────────────────────────────┘
                     │ JSON Response
┌────────────────────▼────────────────────────────────────────┐
│ 7. APP: Receive Response                                    │
│    {                                                         │
│      success: true,                                         │
│      data: {                                                │
│        photo: {                                             │
│          _id: "...",                                        │
│          watermarkedUrl: "...",                             │
│          prediction: { class, classVi, confidence }         │
│        }                                                    │
│      }                                                      │
│    }                                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 8. APP: Navigate to Result Screen                           │
│    - Display watermarked image                              │
│    - Show prediction result                                 │
│    - Show action buttons                                    │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Authentication Flow

**Firebase Auth Flow**:
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
   ↓
Backend:
  - Verify idToken with Firebase Admin SDK
  - Check if user exists (by phone)
  - If not exists: create new User
  - Generate JWT token (expires 7d)
  - Return { token, refreshToken, user }
   ↓
App:
  - Save token to SecureStore
  - Set axios default header
  - Navigate to main app
```

### 7.3 Map View Flow

```
User opens MapFarm tab
   ↓
App → GET /api/photos?limit=1000
   ↓
Backend returns photos array with:
  - _id, metadata.lat, metadata.lng
  - prediction.class, prediction.classVi
   ↓
App generates Leaflet map HTML:
  ├─ Create markers for each photo
  │  ├─ Green border if healthy
  │  └─ Red border if diseased
  │
  ├─ For diseased markers:
  │  ├─ Draw yellow circle (30m radius)
  │  └─ Connect nearby diseased markers with red lines
  │
  └─ If ≥3 diseased markers within 50m:
     └─ Draw red polygon around cluster
   ↓
User clicks marker
   ↓
App calculates nearby markers (≤50m)
   ↓
If 1 marker:
  → Navigate to photo-detail
If multiple markers:
  → Show ClusterModal with list
```

---

## 8. API Documentation

### 8.1 Swagger/OpenAPI

**Access**: `https://doctorrice.onrender.com/api/docs`

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
        "device": "Android",
        "orientation": "portrait"
      },
      "prediction": {
        "class": "bacterial_leaf_blight",
        "classVi": "Bệnh bạc lá vi khuẩn",
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
      { /* photo object */ },
      { /* photo object */ }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
```

#### **AI Prediction Response**

```json
{
  "class": "blast",
  "class_vi": "Bệnh đạo ôn",
  "confidence": 95.67,
  "all_predictions": {
    "bacterial_leaf_blight": 2.15,
    "blast": 95.67,
    "brown_spot": 1.82,
    "healthy": 0.36
  }
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
│  │ https://doctorrice.onrender.com                │    │
│  │                                                 │    │
│  │ - Web Service (Node 20)                        │    │
│  │ - Auto-deploy from GitHub                      │    │
│  │ - Free tier (sleeps after 15min inactivity)    │    │
│  │ - Environment variables configured             │    │
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
│  - 10K verifications/month                              │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Cold Start Optimization

**Problem**: Render free tier sleeps after 15min inactivity  
**Solutions**:

1. **Backend Node.js**: Increased timeout to 60s for AI requests
2. **Backend AI**: Optimized Gunicorn workers (1 worker, 2 threads)
3. **App**: Show loading skeleton during cold start
4. **Optional**: External uptime monitor (e.g., UptimeRobot) to ping `/health` every 5min

---

## 10. Environment Variables

### 10.1 App Android (`.env`)

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://doctorrice.onrender.com/api

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

# Firebase
FIREBASE_PROJECT_ID=doctorrice-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@doctorrice.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret

# AI Service
AI_SERVICE_URL=https://doctorrice-ai-service.onrender.com

# CORS (optional)
FRONTEND_URL=*
```

### 10.3 Backend AI (`.env`)

```bash
PORT=5000
FLASK_ENV=production
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

⚠️ **Recommendations**:
- Implement token rotation
- Add device fingerprinting
- Rate limit login attempts (429 after 5 failed attempts)
- Add 2FA for admin accounts

### 11.2 API Security

✅ **Implemented**:
- Rate limiting (100 requests/15min per IP)
- CORS configured (allow specific origins in production)
- Input validation (Joi/Zod schemas)
- File upload size limits (10MB max)
- Helmet.js for HTTP headers
- Render proxy trust (`app.set('trust proxy', 1)`)

⚠️ **Recommendations**:
- Add API key for mobile app
- Implement request signing
- Add DDoS protection (Cloudflare)

### 11.3 Data Security

✅ **Implemented**:
- HTTPS only (enforced by Render)
- MongoDB connection encrypted (TLS)
- Sensitive data not logged
- User passwords excluded from queries (`select: false`)
- Cloudinary signed URLs (time-limited)

⚠️ **Recommendations**:
- Encrypt GPS coordinates at rest
- GDPR compliance (data export/deletion)
- Regular security audits

### 11.4 Image Security

✅ **Implemented**:
- File type validation (only JPEG, PNG)
- Image size limits (10MB)
- Malicious file scanning (basic MIME check)
- Cloudinary auto-moderation

⚠️ **Recommendations**:
- Add virus scanning (ClamAV)
- Content moderation API
- Watermark removal detection

---

## 12. Monitoring & Logging

### 12.1 Backend Logging

**Winston Logger** (structured logging):
```typescript
logger.info('Photo upload started', {
  userId: req.user._id,
  fileSize: req.file.size,
  metadata: metadata
});

logger.error('AI prediction failed', {
  error: error.message,
  photoId: photo._id
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
1. Open https://doctorrice.onrender.com/api/docs
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
EXPO_PUBLIC_API_URL=https://doctorrice.onrender.com/api  # ✅ Correct
# NOT: https://doctorrice.onrender.com/api/api  # ❌ Wrong
```

#### **Issue**: AI prediction timeout
**Solution**:
- Backend AI on Render may be sleeping (cold start ~30-60s)
- Increase timeout in `ai.service.ts` to 60s
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

4. **Social Features**:
   - Share photos with community
   - Disease alerts for nearby farmers
   - Expert consultation

5. **Analytics Dashboard**:
   - Disease trends over time
   - Region-based statistics
   - Prediction accuracy tracking

---

## 📚 Additional Resources

- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **Mongoose**: https://mongoosejs.com
- **Cloudinary**: https://cloudinary.com/documentation
- **TensorFlow Lite**: https://www.tensorflow.org/lite
- **Leaflet.js**: https://leafletjs.com
- **Render Docs**: https://render.com