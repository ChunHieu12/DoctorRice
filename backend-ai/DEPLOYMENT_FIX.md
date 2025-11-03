# 🔧 Render Deployment Fix

## Vấn đề phát hiện

1. **Port binding issue**: Dockerfile hardcode port 5000 thay vì sử dụng `$PORT` environment variable của Render
2. **Model not loaded**: Khi chạy với gunicorn, model không được load vì code trong `if __name__ == '__main__'` không chạy
3. **Workers too many**: Free tier có 512MB RAM, 2 workers + 4 threads mỗi worker quá nhiều

## Các thay đổi đã thực hiện

### 1. Fixed Dockerfile

**Changes:**
- ✅ CMD sử dụng shell form để expand `$PORT` variable
- ✅ Giảm workers: `--workers 1 --threads 2` (phù hợp free tier)
- ✅ Tăng timeout: `--timeout 300` (cho phép TensorFlow load chậm)
- ✅ Removed HEALTHCHECK (Render có health check riêng)
- ✅ Added model verification step trong build

**Before:**
```dockerfile
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "4", "--timeout", "120", "app:app"]
```

**After:**
```dockerfile
CMD gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 300 --log-level info app:app
```

### 2. Fixed app.py

**Changes:**
- ✅ Model được load ngay khi module được import (ngoài `if __name__ == '__main__'`)
- ✅ Thêm logging chi tiết để debug
- ✅ Model load trước khi gunicorn workers start

**Before:**
```python
if __name__ == '__main__':
    if not load_model():
        exit(1)
    app.run(...)
```

**After:**
```python
# Load model immediately when module is imported
logger.info("🌾 Rice Leaf Disease Detection API Starting...")
if not load_model():
    logger.error("❌ CRITICAL: Failed to load model on startup!")
else:
    logger.info("✅ Model loaded successfully, API ready!")
```

## Next Steps

1. **Commit changes:**
```bash
git add backend-ai/
git commit -m "fix: Render deployment - port binding and model loading"
git push origin main
```

2. **Render sẽ auto-deploy** (nếu enable auto-deploy)

3. **Theo dõi logs trên Render:**
   - Xem log để confirm: "✅ Model loaded successfully"
   - Kiểm tra: "Your service is live 🎉"

4. **Test sau khi deploy:**
```bash
# Health check
curl https://doctorrice-ai-service.onrender.com/health

# Should return: {"status": "healthy", "model_loaded": true}
```

## Expected Logs (Success)

```
[INFO] Starting gunicorn 21.2.0
[INFO] Listening at: http://0.0.0.0:10000 (1)  # Render's dynamic port
============================================================
🌾 Rice Leaf Disease Detection API Starting...
📁 Model path: model/model.tflite
🔌 Port: 10000
============================================================
✅ Model loaded successfully, API ready!
[INFO] Booting worker with pid: 24
==> Your service is live 🎉
```

## Expected Logs (Failure)

```
❌ CRITICAL: Failed to load model on startup!
❌ Make sure model/model.tflite exists and is a valid TFLite model
```

## Troubleshooting

### If model still not found:

1. **Check build logs** trên Render để xem:
```
✅ Model file found: 17M model/model.tflite
```

2. **If build fails** với "model.tflite not found":
   - Verify file exists locally: `ls -lh backend-ai/model/model.tflite`
   - Verify file in Git: `git ls-files backend-ai/model/model.tflite`
   - Check .gitignore không ignore file này

3. **If service crashes** with OOM (Out of Memory):
   - Giảm workers xuống 1
   - Consider upgrading to paid tier

## Configuration Summary

### Free Tier Limits:
- RAM: 512MB
- CPU: Shared
- Sleep: After 15 min inactivity
- Cold start: 10-20 seconds

### Optimized Config:
- Workers: 1 (multi-process)
- Threads: 2 (multi-thread per worker)
- Timeout: 300s (for slow TF loading)
- Max upload: 10MB

---

**Status**: Ready to deploy ✅

