# 🌾 Rice Leaf Disease Detection API (Python Microservice)

Python Flask microservice for AI-powered rice leaf disease detection using TensorFlow Lite.

## 📋 Features

- **TFLite Model Inference**: Fast and efficient disease prediction
- **4 Disease Classes**:
  - 🦠 Bệnh bạc lá vi khuẩn (Bacterial Leaf Blight)
  - 🔥 Bệnh đạo ôn (Blast)
  - 🟤 Bệnh đốm nâu (Brown Spot)
  - ✅ Lá khỏe mạnh (Healthy)
- **REST API**: Simple HTTP endpoints
- **Docker Support**: Containerized deployment
- **Render.com Ready**: Easy cloud deployment

---

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.11+
- pip
- Your trained `model.tflite` file

### 2. Installation

```bash
# Clone/navigate to backend-ai directory
cd backend-ai

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Setup Model

Place your trained TFLite model:

```
backend-ai/
├── model/
│   └── model.tflite   ← Put your model here
├── app.py
└── ...
```

### 4. Run Locally

```bash
# Set environment variables (optional)
export PORT=5000
export MODEL_PATH=model/model.tflite

# Run the server
python app.py
```

Server will start at `http://localhost:5000`

---

## 📡 API Endpoints

### 1. Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "service": "rice-disease-detection"
}
```

### 2. Get API Info

```http
GET /
```

**Response:**
```json
{
  "service": "Rice Leaf Disease Detection API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "predict": "/predict (POST with image file)"
  },
  "model": {
    "classes": {
      "bacterial_leaf_blight": "Bệnh bạc lá vi khuẩn",
      "blast": "Bệnh đạo ôn",
      "brown_spot": "Bệnh đốm nâu",
      "healthy": "Lá khỏe mạnh"
    },
    "input_size": "224x224",
    "format": "TFLite"
  }
}
```

### 3. Predict Disease

```http
POST /predict
Content-Type: multipart/form-data
```

**Body (form-data):**
- `image`: Image file (PNG, JPG, JPEG)

**Example using cURL:**
```bash
curl -X POST http://localhost:5000/predict \
  -F "image=@/path/to/rice_leaf.jpg"
```

**Success Response:**
```json
{
  "success": true,
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
  }
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t doctorrice-ai .
```

### Run Container

```bash
docker run -p 5000:5000 doctorrice-ai
```

---

## ☁️ Deploy to Render.com (FREE)

### Step 1: Prepare Repository

1. **Upload model file** to `backend-ai/model/model.tflite`
2. **Commit and push** to GitHub:

```bash
git add backend-ai/
git commit -m "Add Python AI microservice"
git push origin main
```

### Step 2: Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository

### Step 3: Configure Service

**Basic Settings:**
- **Name**: `doctorrice-ai-service` (or any name you prefer)
- **Region**: `Singapore` (recommended for Asia)
- **Branch**: `main`
- **Root Directory**: `backend-ai`

**Build Settings:**
- **Environment**: `Docker`
- **Dockerfile Path**: `./Dockerfile`
- **Docker Context**: `.`

**Instance Type:**
- **Plan**: `Free` (512MB RAM, sleep after 15 min inactivity)

**Environment Variables:**
```
PORT=5000
MODEL_PATH=model/model.tflite
```

**Advanced Settings:**
- **Health Check Path**: `/health`
- **Auto-Deploy**: `Yes` (optional)

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for build to complete (~5-10 minutes)
3. Your service URL: `https://doctorrice-ai-service.onrender.com`

### Step 5: Test Deployment

```bash
# Health check
curl https://doctorrice-ai-service.onrender.com/health

# Test prediction
curl -X POST https://doctorrice-ai-service.onrender.com/predict \
  -F "image=@test_image.jpg"
```

---

## 🔗 Integrate with Node.js Backend

In your Node.js backend (main API), configure the AI service URL:

**backend/.env:**
```env
AI_SERVICE_URL=https://doctorrice-ai-service.onrender.com
```

**Example Node.js code:**
```javascript
const FormData = require('form-data');
const axios = require('axios');

async function predictDisease(imageBuffer) {
  const formData = new FormData();
  formData.append('image', imageBuffer, 'image.jpg');
  
  const response = await axios.post(
    `${process.env.AI_SERVICE_URL}/predict`,
    formData,
    {
      headers: formData.getHeaders(),
      timeout: 30000
    }
  );
  
  return response.data.prediction;
}
```

---

## 📊 Performance

- **Cold Start**: ~10-20 seconds (free tier)
- **Inference Time**: ~200-500ms per image
- **Max Image Size**: 10MB
- **Supported Formats**: PNG, JPG, JPEG

---

## 🛠️ Troubleshooting

### Issue: Model not found

**Solution:**
```bash
# Check model file exists
ls -lh model/model.tflite

# If missing, add your model file to backend-ai/model/
```

### Issue: Import errors

**Solution:**
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### Issue: Out of memory on Render

**Solution:**
- Free tier has 512MB RAM limit
- Reduce batch size or optimize model
- Consider upgrading to paid tier

### Issue: Service sleeping on Render

**Solution:**
- Implement keep-alive ping from Node.js backend
- Or upgrade to paid tier for always-on service

---

## 📝 Notes

- **Free Tier Limitations**: Service sleeps after 15 minutes of inactivity
- **Wake Time**: First request after sleep takes ~10-20 seconds
- **Model Size**: Keep model file < 100MB for faster builds
- **Security**: Add authentication if needed for production

---

## 🔄 Update Model

To update the model:

```bash
# 1. Replace model file
cp new_model.tflite backend-ai/model/model.tflite

# 2. Commit and push
git add backend-ai/model/model.tflite
git commit -m "Update TFLite model"
git push origin main

# 3. Render will auto-deploy (if enabled)
```

---

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [TensorFlow Lite Guide](https://www.tensorflow.org/lite/guide)
- [Render Documentation](https://render.com/docs)

---

## 🤝 Support

For issues or questions, check:
1. Server logs on Render dashboard
2. Health check endpoint: `/health`
3. API info endpoint: `/`

---

**Created for Project "Bác sĩ Lúa" 🌾**

