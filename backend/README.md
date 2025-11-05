# 🌾 Bác sĩ Lúa - Backend API

Backend REST API for DoctorRice mobile app. Handles photo upload, GPS watermarking, user authentication, and more.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env-example .env

# Edit .env with your config
nano .env

# Run development server
npm run dev
```

### Build & Deploy

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts  # MongoDB connection
│   │   └── swagger.ts   # Swagger setup
│   ├── models/          # Mongoose models
│   │   ├── User.ts
│   │   ├── Photo.ts
│   │   └── Session.ts
│   ├── controllers/     # Route controllers
│   │   ├── auth.controller.ts
│   │   └── photo.controller.ts
│   ├── services/        # Business logic
│   │   └── watermark.service.ts
│   ├── routes/          # Express routes
│   │   ├── auth.routes.ts
│   │   ├── photo.routes.ts
│   │   └── index.ts
│   ├── middleware/      # Custom middleware
│   │   ├── auth.middleware.ts
│   │   └── rateLimiter.middleware.ts
│   ├── utils/           # Helper functions
│   │   ├── logger.ts
│   │   └── responses.ts
│   ├── jobs/            # Cron jobs
│   │   └── keepAlive.ts
│   └── server.ts        # Express app entry
├── uploads/             # Photo storage
├── dist/                # Compiled JS (build output)
├── logs/                # Log files
├── package.json
├── tsconfig.json
└── .env
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/refresh` | Refresh access token | No |

### Photos

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/photos/upload` | Upload photo with AI analysis | Yes |
| GET | `/api/photos` | Get user photos (paginated) | Yes |
| GET | `/api/photos/:id` | Get single photo by ID | Yes |
| GET | `/api/photos/map` | Get all photos for map view | Yes |
| GET | `/api/photos/stats` | Get photo statistics | Yes |
| DELETE | `/api/photos/:id` | Delete photo | Yes |

### Utility

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Root health check | No |
| GET | `/api/health` | API health check | No |
| GET | `/api/docs` | Swagger UI documentation | No |

---

## 📚 API Documentation (Swagger)

Full interactive API documentation is available at `/api/docs` when the server is running.

**Access Swagger UI:**
- Local: http://localhost:3000/api/docs
- Production: https://doctorrice.onrender.com/api/docs

**Features:**
- ✅ Complete endpoint documentation
- ✅ Request/response schemas
- ✅ Try out API calls directly
- ✅ Authentication support (Bearer token)
- ✅ Example requests and responses
- ✅ Data model schemas

**Main Schemas Available:**
- `Photo` - Complete photo object with AI prediction
- `PhotoMetadata` - GPS and device information
- `Prediction` - AI disease detection result
- `MapMarker` - Photo location data for maps
- `PhotoStats` - Statistics and analytics
- `Error` - Error response format

**Testing Endpoints:**
1. Go to `/api/docs`
2. Click "Authorize" button
3. Enter your Bearer token
4. Try endpoints with "Try it out"

---

## 🔐 Authentication

API uses JWT Bearer tokens:

```bash
Authorization: Bearer <access_token>
```

### Flow:
1. Register/Login → Get `accessToken` + `refreshToken`
2. Use `accessToken` for authenticated requests
3. When expired → Use `refreshToken` to get new `accessToken`

---

## 📸 Photo Upload Example

### Option 1: With JSON metadata (API clients)

```bash
curl -X POST http://localhost:3000/api/photos/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@rice_leaf.jpg" \
  -F 'metadata={"lat":10.825123,"lng":106.629456,"timestamp":1699234567890,"device":"Android","orientation":"portrait"}'
```

### Option 2: With individual fields (Mobile apps)

```bash
curl -X POST http://localhost:3000/api/photos/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@rice_leaf.jpg" \
  -F "latitude=10.825123" \
  -F "longitude=106.629456" \
  -F "device=Android"
```

### Response

```json
{
  "success": true,
  "message": "Photo uploaded and processed successfully",
  "data": {
    "photo": {
      "_id": "67890abcdef1234567890abc",
      "userId": "yTxXUSC5DLbB6JS6ckmZzV2kLZG2",
      "originalUrl": "https://res.cloudinary.com/doivrdij4/image/upload/v123/doctorrice/photos/photo_user123_1699234567890.jpg",
      "watermarkedUrl": "https://res.cloudinary.com/doivrdij4/image/upload/l_text:Arial_32:Lat%3A%2010.825123%2C%20Lng%3A%20106.629456,co_rgb:FFFFFF,g_south_east/v123/doctorrice/photos/photo_user123_1699234567890.jpg",
      "thumbnailUrl": "https://res.cloudinary.com/doivrdij4/image/upload/c_fill,w_200,h_200/doctorrice/photos/photo_user123_1699234567890.jpg",
      "cloudinaryPublicId": "doctorrice/photos/photo_user123_1699234567890",
      "metadata": {
        "lat": 10.825123,
        "lng": 106.629456,
        "timestamp": 1699234567890,
        "device": "Android",
        "orientation": "portrait",
        "address": "123 Nguyen Hue, District 1, Ho Chi Minh City, Vietnam"
      },
      "prediction": {
        "class": "blast",
        "classVi": "Bệnh đạo ôn",
        "confidence": 87.5,
        "allPredictions": {
          "bacterial_leaf_blight": 2.3,
          "blast": 87.5,
          "brown_spot": 8.1,
          "healthy": 2.1
        }
      },
      "status": "completed",
      "fileSize": 245678,
      "createdAt": "2024-11-06T12:30:00.000Z",
      "updatedAt": "2024-11-06T12:30:05.000Z"
    }
  }
}
```

---

## 🤖 AI Disease Detection

### AI Service Architecture

```
Mobile App (Photo Upload)
    ↓
Node.js Backend
    ↓ (parallel processing)
    ├─→ Cloudinary: Upload + Watermark
    └─→ Python AI Service: Disease Detection
    ↓
Response with Photo + Prediction
```

### AI Service Integration

**Python Microservice:**
- URL: `https://doctorrice-ai-service.onrender.com`
- Model: TensorFlow Lite
- Input: 224x224 RGB image
- Output: 4 disease classes with confidence scores

**Environment Variable:**
```env
AI_SERVICE_URL=https://doctorrice-ai-service.onrender.com
```

### Disease Classification

| English | Vietnamese | Description |
|---------|-----------|-------------|
| `bacterial_leaf_blight` | Bệnh bạc lá vi khuẩn | Bacterial infection causing white lesions |
| `blast` | Bệnh đạo ôn | Fungal disease causing diamond-shaped spots |
| `brown_spot` | Bệnh đốm nâu | Fungal disease with circular brown spots |
| `healthy` | Lá khỏe mạnh | No disease detected |

### Processing Flow

1. **Photo Upload** → Backend receives image + GPS
2. **Parallel Processing:**
   - Cloudinary: Upload original → Add GPS watermark → Generate thumbnail
   - AI Service: Analyze image → Return prediction
3. **Save to DB** → Store all URLs + prediction
4. **Return Response** → Photo with AI result

**Typical Processing Time:**
- Cloudinary: 3-5 seconds
- AI Service (cold start): 10-20 seconds
- AI Service (warm): 1-3 seconds
- **Total**: 5-25 seconds

---

## 🛠️ Development

```bash
# Run dev server with auto-reload
npm run dev

# Type checking
npm run typecheck

# Lint code
npm run lint

# Run tests
npm test
```

---

## 🚀 Deployment (Render.com)

### Steps:

1. Create new Web Service on Render
2. Connect GitHub repository
3. Set environment variables from `.env-example`
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`

### Environment Variables (Render):

Add all variables from `.env-example` to Render dashboard.

### Anti-Sleep (Free Tier):

Keep-alive cron job automatically pings `/api/health` every 2 minutes.

**Requirements:**
- Set `RENDER_INTERNAL_URL` to your app URL
- Set `CRON_SECRET` for security

---

## 📊 Database Schema

### Users Collection

```typescript
{
  email?: string;
  phone?: string;
  passwordHash?: string;
  displayName: string;
  avatar?: string;
  socialIds?: {
    google?: string;
    facebook?: string;
  };
  roles: ['user' | 'admin'];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Photos Collection

```typescript
{
  userId: ObjectId;                    // User ID reference
  originalUrl: string;                 // Cloudinary URL - original image
  watermarkedUrl: string;              // Cloudinary URL - with GPS watermark
  thumbnailUrl?: string;               // Cloudinary URL - thumbnail (200x200)
  cloudinaryPublicId?: string;         // Cloudinary public ID for transformations
  metadata: {
    lat: number;                       // Latitude (-90 to 90)
    lng: number;                       // Longitude (-180 to 180)
    timestamp: number;                 // Unix timestamp
    device: string;                    // Device type (Android, iOS)
    orientation: 'portrait' | 'landscape';
    address?: string;                  // Reverse geocoded address
  };
  prediction?: {                       // AI disease detection result
    class: 'bacterial_leaf_blight' | 'blast' | 'brown_spot' | 'healthy';
    classVi: string;                   // Vietnamese label
    confidence: number;                // 0-100
    allPredictions?: {                 // All class probabilities
      bacterial_leaf_blight: number;
      blast: number;
      brown_spot: number;
      healthy: number;
    };
  };
  status: 'processing' | 'completed' | 'failed';
  fileSize: number;                    // File size in bytes
  errorMessage?: string;               // Error if status is 'failed'
  createdAt: Date;
  updatedAt: Date;
}
```

**Disease Classes:**
- `bacterial_leaf_blight` → `Bệnh bạc lá vi khuẩn`
- `blast` → `Bệnh đạo ôn`
- `brown_spot` → `Bệnh đốm nâu`
- `healthy` → `Lá khỏe mạnh`

---

## 🔒 Security

- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Rate limiting (100 req/15min)
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ Input validation
- ✅ File type validation

---

## 📝 Scripts

```json
{
  "dev": "nodemon src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "lint": "eslint src/**/*.ts",
  "test": "jest",
  "typecheck": "tsc --noEmit"
}
```

---

## 📚 Documentation

- **API Docs:** http://localhost:3000/api/docs (Swagger UI)
- **Health Check:** http://localhost:3000/api/health

---

## 🐛 Troubleshooting

### MongoDB Connection Failed

```bash
# Check MongoDB is running
mongod --version

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod             # Linux
```

### Port Already in Use

```bash
# Change PORT in .env
PORT=3001
```

### TypeScript Errors

```bash
# Clean and rebuild
rm -rf dist
npm run build
```

---

## 📚 API Documentation (Swagger)

### Access Swagger UI

**Local:**
```
http://localhost:3000/api/docs
```

**Production:**
```
https://doctorrice.onrender.com/api/docs
```

### Available Endpoints

#### **Photos Endpoints** (NEW)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/photos/upload` | Upload photo with AI detection & watermark |
| `GET` | `/api/photos` | Get user photos (with pagination) |
| `GET` | `/api/photos/:id` | Get single photo details |
| `GET` | `/api/photos/map` | Get photos for map view |
| `GET` | `/api/photos/stats` | Get photo statistics |
| `DELETE` | `/api/photos/:id` | Delete photo |

#### **Auth Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register with email/phone |
| `POST` | `/api/auth/login` | Login with credentials |
| `POST` | `/api/auth/social` | Social login (Google/Facebook) |
| `POST` | `/api/auth/refresh` | Refresh access token |

### Testing with Swagger UI

1. **Open Swagger UI** at `/api/docs`
2. **Authorize**: Click "Authorize" button
3. **Enter JWT token**: `Bearer <your_access_token>`
4. **Try endpoints**: Click "Try it out" on any endpoint

### Upload Photo Example

```bash
curl -X POST http://localhost:3000/api/photos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "photo=@/path/to/image.jpg" \
  -F 'metadata={"lat":10.8231,"lng":106.6297,"timestamp":1698765432000,"device":"iOS 17.0","orientation":"portrait"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "photoId": "507f1f77bcf86cd799439011",
    "originalUrl": "https://res.cloudinary.com/...",
    "watermarkedUrl": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "prediction": {
      "class": "blast",
      "classVi": "Bệnh đạo ôn",
      "confidence": 99.4,
      "allPredictions": {
        "bacterial_leaf_blight": 0.2,
        "blast": 99.4,
        "brown_spot": 0.3,
        "healthy": 0.1
      }
    },
    "status": "completed",
    "createdAt": "2025-11-02T..."
  }
}
```

### External Services

- **AI Service**: https://doctorrice-ai-service.onrender.com
- **Cloudinary**: Image storage & watermarking
- **MongoDB Atlas**: Database

---

## 📞 Support

- **API Documentation:** `/api/docs` (Swagger UI)
- **Implementation Guide:** See `../IMPLEMENTATION_GUIDE.md`
- **Backend Config:** See `../BackendConfig.Md`
- **Issues:** GitHub Issues
- **Email:** support@doctorrice.com

---

**Built with ❤️ for Vietnamese farmers** 🌾

