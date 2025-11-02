# 🌾 Bác sĩ Lúa - Complete Implementation Guide

## 📚 Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Installation](#installation)
4. [Architecture](#architecture)
5. [Features](#features)
6. [Deployment](#deployment)
7. [API Documentation](#api-documentation)
8. [Testing](#testing)

---

## 🎯 Overview

**Bác sĩ Lúa (Doctor Rice)** là ứng dụng AI-powered giúp nông dân phát hiện bệnh lúa thông qua phân tích hình ảnh. Ứng dụng sử dụng machine learning để nhận diện 4 trạng thái:
- 🦠 Bệnh bạc lá vi khuẩn (Bacterial Leaf Blight)
- 🔥 Bệnh đạo ôn (Blast)
- 🟤 Bệnh đốm nâu (Brown Spot)
- ✅ Lá khỏe mạnh (Healthy)

---

## 🛠 Tech Stack

### **Frontend (React Native + Expo)**
- **Framework**: Expo SDK 54 (Managed Workflow)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Hooks + Context
- **i18n**: i18next + expo-localization
- **Camera**: expo-camera, expo-image-picker
- **Location**: expo-location
- **Maps**: react-native-maps
- **Image**: expo-image, expo-image-manipulator
- **Storage**: expo-secure-store
- **UI**: React Native, @expo/vector-icons

### **Backend (Node.js)**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Image Storage**: Cloudinary
- **Authentication**: JWT + Firebase Admin SDK
- **API Docs**: Swagger (OpenAPI 3)
- **Logging**: Winston

### **AI Service (Python)**
- **Framework**: Flask
- **AI/ML**: TensorFlow Lite 2.18.0
- **Model**: EfficientNet-based (TFLite format)
- **Image Processing**: Pillow, NumPy
- **Server**: Gunicorn

### **Deployment**
- **Frontend**: Expo Application Services (EAS)
- **Backend Node.js**: Render.com (Free tier)
- **AI Python Service**: Render.com (Docker)
- **Database**: MongoDB Atlas
- **Image CDN**: Cloudinary

---

## 📦 Installation

### **Prerequisites**
- Node.js >= 18.0.0
- npm >= 9.0.0
- Python 3.11+ (for AI service)
- MongoDB (local or Atlas)
- Cloudinary account
- Expo account (for mobile development)

### **1. Clone Repository**
```bash
git clone <repository-url>
cd DoctorRice
```

### **2. Install Frontend Dependencies**
```bash
# Root directory (React Native app)
npm install

# Update Expo SDK if needed
npx expo install --fix
```

### **3. Install Backend Dependencies**
```bash
cd backend
npm install
```

### **4. Install AI Service Dependencies**
```bash
cd backend-ai
pip install -r requirements.txt
```

### **5. Setup Environment Variables**

**Frontend**: Create `.env` (optional, use app.json for API URL)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Backend**: Copy and configure
```bash
cd backend
cp .env-example .env
# Edit .env with your values
```

Required variables:
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: 616512921233148
- `CLOUDINARY_API_SECRET`: 8AjYrlt8GOt9TvbBv7MIFB4gdxk
- `AI_SERVICE_URL`: Python AI service URL

**AI Service**: Copy and configure
```bash
cd backend-ai
cp .env-example .env
# Add model.tflite to backend-ai/model/
```

### **6. Run Services**

**Terminal 1 - MongoDB** (if local):
```bash
mongod
```

**Terminal 2 - Backend Node.js**:
```bash
cd backend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 3 - AI Service**:
```bash
cd backend-ai
python app.py
# Runs on http://localhost:5000
```

**Terminal 4 - Frontend**:
```bash
npx expo start
# Or: npm start
```

---

## 🏗 Architecture

### **System Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                   Mobile App (Expo)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Camera  │  │  Result  │  │   Map    │  │ Detail │  │
│  │  Screen  │  │  Screen  │  │  Screen  │  │ Screen │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│         │              │             │           │       │
│         └──────────────┴─────────────┴───────────┘       │
│                        │                                 │
│                   API Service                            │
└────────────────────────┼────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│           Backend Node.js API (Express)                 │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ Auth Routes │  │ Photo Routes  │  │ User Routes  │  │
│  └─────────────┘  └───────────────┘  └──────────────┘  │
│         │                  │                │           │
│    ┌────┴────────┬─────────┴────────┬───────┘           │
│    ▼             ▼                  ▼                    │
│  JWT Auth    Cloudinary        AI Service               │
│              Upload             (Python/TFLite)          │
│    │             │                  │                    │
│    └─────────────┴──────────────────┘                   │
│                  │                                       │
│                  ▼                                       │
│            MongoDB Atlas                                 │
└─────────────────────────────────────────────────────────┘
```

### **Photo Upload Flow**

```
1. User captures photo → expo-camera
2. Get GPS coordinates → expo-location  
3. Resize image → expo-image-manipulator (max width 1280px)
4. Upload to backend → FormData (photo + metadata)
5. Backend uploads to Cloudinary (original)
6. Backend calls AI service → disease prediction
7. Cloudinary adds watermark (GPS coordinates + timestamp)
8. Save to MongoDB (all URLs + prediction)
9. Return result to app → navigate to ResultScreen
```

---

## ✨ Features

### **1. Camera with GPS Watermarking**
- **Location**: `src/screens/Camera/CameraScreen.tsx`
- **Hook**: `src/hooks/useCameraFlow.tsx`

**Features**:
- Full-screen camera view với rounded frame corners
- Real-time GPS coordinates display
- Flash toggle
- 4-corner white borders (design như ảnh mẫu)
- Gallery picker
- Tips modal
- Auto-resize images before upload
- Progress indicator during upload

**Permissions**:
- Camera (expo-camera)
- Location (expo-location)
- Media Library (expo-media-library)

### **2. AI Disease Detection**
- **Backend**: `backend/src/services/ai.service.ts`
- **AI Service**: `backend-ai/app.py`

**Model**:
- TFLite model (EfficientNet-based)
- Input size: 224x224
- 4 classes detection
- Vietnamese labels mapping

**API**:
- `POST /predict` - Image → Disease prediction
- Response includes class, confidence, all predictions

### **3. Result Screen**
- **Location**: `app/result.tsx`

**Features**:
- Display watermarked image
- Show disease name (Vietnamese)
- Confidence meter with progress bar
- GPS coordinates display
- Action buttons:
  - View on Map
  - Capture Again
  - View Details (if diseased)

### **4. Map Farm Screen**
- **Location**: `src/screens/MapFarm/MapFarmScreen.tsx`

**Features**:
- OpenStreetMap with react-native-maps
- Custom markers with photo thumbnails
- Disease indicator (green/red)
- Marker detail card on tap
- Auto-fit to show all markers
- Stats bar (total locations)
- Floating capture button
- Empty state với call-to-action

### **5. Photo Detail Screen**
- **Location**: `app/photo-detail.tsx`

**Features**:
- Full image display
- Disease status card
- **Tabs**:
  - **Thông tin bệnh**: Disease information, symptoms, causes
  - **Cách trị bệnh**: Treatment methods, prevention, schedule
- Comprehensive disease database (Vietnamese)
- Navigation to map or new capture

**Disease Database**:
- Bacterial Leaf Blight
- Blast Disease  
- Brown Spot
- Healthy (maintenance tips)

### **6. Backend APIs**

**Photo Endpoints**:
- `POST /api/photos/upload` - Upload + AI + Watermark
- `GET /api/photos` - List with pagination
- `GET /api/photos/:id` - Get single photo
- `GET /api/photos/map` - Get markers for map
- `GET /api/photos/stats` - User statistics
- `DELETE /api/photos/:id` - Delete photo

**Auth Endpoints** (existing):
- `/api/auth/register` - Email/Phone registration
- `/api/auth/login` - Email/Phone login
- `/api/auth/social` - Google/Facebook login
- `/api/auth/refresh` - Refresh token

---

## 🚀 Deployment

### **1. Deploy AI Service to Render**

```bash
# Push code to GitHub
git add backend-ai/
git commit -m "Add AI service"
git push origin main

# On Render Dashboard:
# 1. New Web Service
# 2. Connect GitHub repo
# 3. Root Directory: backend-ai
# 4. Environment: Docker
# 5. Add model.tflite to backend-ai/model/
# 6. Deploy
```

**Environment Variables**:
```
PORT=5000
MODEL_PATH=model/model.tflite
```

**Result**: `https://doctorrice-ai-service.onrender.com` ✅ **DEPLOYED**

### **2. Deploy Backend Node.js to Render**

```bash
# Update backend/.env with:
AI_SERVICE_URL=https://doctorrice-ai-service.onrender.com
CLOUDINARY_CLOUD_NAME=doivrdij4
CLOUDINARY_API_KEY=616512921233148
CLOUDINARY_API_SECRET=8AjYrlt8GOt9TvbBv7MIFB4gdxk
MONGO_URI=<your-mongodb-atlas-uri>

# On Render:
# 1. New Web Service
# 2. Root Directory: backend
# 3. Build: npm install && npm run build
# 4. Start: npm start
# 5. Add all environment variables
```

**Result**: `https://doctorrice-backend.onrender.com`

### **3. Build Mobile App**

**Update app.json**:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://doctorrice-backend.onrender.com/api"
    }
  }
}
```

**EAS Build**:
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

---

## 📖 API Documentation

### **Base URL**
```
Production: https://doctorrice-backend.onrender.com/api
Development: http://localhost:3000/api
```

### **Authentication**
All photo endpoints require JWT token:
```http
Authorization: Bearer <access_token>
```

### **Upload Photo**
```http
POST /api/photos/upload
Content-Type: multipart/form-data

Body:
- photo: File (image/jpeg, image/png)
- metadata: JSON string
  {
    "lat": 10.8231,
    "lng": 106.6297,
    "timestamp": 1234567890000,
    "device": "iOS 17.0",
    "orientation": "portrait"
  }

Response 201:
{
  "success": true,
  "data": {
    "photoId": "...",
    "originalUrl": "https://res.cloudinary.com/...",
    "watermarkedUrl": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "metadata": { ... },
    "prediction": {
      "class": "blast",
      "classVi": "Bệnh đạo ôn",
      "confidence": 99.4,
      "allPredictions": { ... }
    },
    "status": "completed",
    "createdAt": "2025-11-02T..."
  }
}
```

### **Get Photos for Map**
```http
GET /api/photos/map

Response 200:
{
  "success": true,
  "data": {
    "markers": [
      {
        "id": "...",
        "latitude": 10.8231,
        "longitude": 106.6297,
        "thumbnail": "...",
        "image": "...",
        "prediction": { ... },
        "createdAt": "..."
      }
    ],
    "total": 10
  }
}
```

**Full API Documentation**: `/api/docs` (Swagger UI)

---

## 🧪 Testing

### **Manual Testing Checklist**

**Camera Flow**:
- [ ] Camera opens successfully
- [ ] GPS coordinates display in real-time
- [ ] Flash toggle works
- [ ] Frame corners visible
- [ ] Capture photo works
- [ ] Gallery picker works
- [ ] Upload progress shows
- [ ] Navigates to result screen

**Result Screen**:
- [ ] Watermarked image displays
- [ ] Disease prediction shows correctly
- [ ] Confidence meter accurate
- [ ] View on Map button works
- [ ] Capture Again button works
- [ ] View Details button works (if diseased)

**Map Screen**:
- [ ] Map loads with markers
- [ ] Markers show thumbnails
- [ ] Tap marker shows detail card
- [ ] Map fits to show all markers
- [ ] Navigate to detail works
- [ ] Empty state shows when no photos

**Photo Detail Screen**:
- [ ] Image displays correctly
- [ ] Tabs switch properly
- [ ] Disease info displays
- [ ] Treatment info displays
- [ ] Action buttons work

---

## 📝 Notes

### **Cloudinary Configuration**
- Cloud Name: `doivrdij4`
- API Key: `616512921233148`
- API Secret: `8AjYrlt8GOt9TvbBv7MIFB4gdxk`
- Free tier: 25GB storage, 25GB bandwidth/month
- Watermark added via transformation URL

### **Model File**
- Place `model.tflite` in `backend-ai/model/`
- Size: Should be < 100MB for faster deployment
- Format: TensorFlow Lite
- Input: 224x224x3 RGB image
- Output: 4 class probabilities

### **Render Free Tier Limitations**
- Services sleep after 15 minutes inactivity
- First request after sleep: 10-20 seconds
- Solution: Implement keep-alive ping (already included in backend)
- Alternative: Upgrade to paid tier for always-on

---

## 🎯 Next Steps

### **Enhancements**
1. **Caching**: Add Redis for API response caching
2. **Offline Mode**: Store photos locally, sync when online
3. **Push Notifications**: Alert users about disease trends
4. **Weather Integration**: Weather forecasting for farmers
5. **Community**: Forum for farmers to share experiences
6. **Analytics**: Track disease patterns by region

### **Performance**
1. Image optimization (WebP format)
2. Lazy loading for maps
3. API response compression
4. CDN for static assets

### **Security**
1. Rate limiting per user
2. Image upload size validation
3. CORS whitelist
4. API key rotation

---

## 📞 Support

For issues or questions:
1. Check logs: Backend (`logs/error.log`), AI Service (Render dashboard)
2. Test endpoints: `/health`, `/api/docs`
3. Verify environment variables
4. Check Cloudinary quota

---

**Built with ❤️ for Vietnamese farmers** 🌾

*Last updated: November 2, 2025*

