# 🔧 Environment Setup

## Tạo file `.env`

Tạo file **`.env`** trong folder `backend/` với nội dung sau:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb://localhost:27017/doctorrice

# JWT Configuration
JWT_SECRET=my-super-secret-jwt-key-change-this-in-production
REFRESH_TOKEN_SECRET=my-refresh-secret-change-this-in-production
JWT_EXPIRES=1d
REFRESH_TOKEN_EXPIRES=7d

# CORS Origins (comma separated)
CORS_ORIGINS=http://localhost:8081,exp://192.168.1.100:8081

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Render Deployment (for production only)
# RENDER_INTERNAL_URL=https://your-app.onrender.com
# CRON_SECRET=your-cron-secret-key
```

## MongoDB Setup

### Option 1: MongoDB Local (Recommended for Development)

1. Download: https://www.mongodb.com/try/download/community
2. Install và start MongoDB service
3. Database sẽ tự động tạo khi app chạy

### Option 2: MongoDB Atlas (Cloud - Free)

1. Đăng ký tại: https://www.mongodb.com/cloud/atlas
2. Tạo Free Cluster (M0)
3. Create Database User
4. Whitelist IP: `0.0.0.0/0` (cho phép all IPs)
5. Get Connection String
6. Update `MONGO_URI` trong `.env`:

```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctorrice?retryWrites=true&w=majority
```

## Quick Start

```bash
# Tạo .env file
notepad .env
# Copy nội dung bên trên và save

# Run backend
npm run dev
```

Backend sẽ chạy tại: **http://localhost:3000**

