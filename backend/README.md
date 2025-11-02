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
| POST | `/api/photos/upload` | Upload & watermark photo | Yes |
| GET | `/api/photos` | Get user photos | Yes |
| DELETE | `/api/photos/:id` | Delete photo | Yes |

### Utility

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | No |
| GET | `/api/docs` | Swagger UI | No |

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

```bash
curl -X POST http://localhost:3000/api/photos/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@image.jpg" \
  -F 'metadata={"lat":10.762622,"lng":106.660172,"timestamp":1698765432000,"device":"Samsung S21"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "photoId": "64a1b2c3...",
    "originalUrl": "/uploads/photo-123.jpg",
    "watermarkedUrl": "/uploads/watermarked_photo-123.jpg",
    "metadata": {
      "lat": 10.762622,
      "lng": 106.660172,
      "timestamp": 1698765432000
    }
  }
}
```

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
  userId: ObjectId;
  originalUrl: string;
  watermarkedUrl: string;
  metadata: {
    lat: number;
    lng: number;
    timestamp: number;
    device: string;
    orientation: 'portrait' | 'landscape';
  };
  status: 'processing' | 'completed' | 'failed';
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
}
```

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

