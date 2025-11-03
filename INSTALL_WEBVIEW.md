# Cài Đặt React Native WebView cho OpenStreetMap

## 📦 Bước 1: Cài Package

```bash
npx expo install react-native-webview
```

## 🔧 Bước 2: Rebuild App (Nếu Cần)

```bash
# Clear cache
npx expo start --clear

# Hoặc rebuild native app
npx expo run:android
```

## ✅ Hoàn Thành!

Map mới sẽ sử dụng:
- **OpenStreetMap** qua Leaflet
- **Hoàn toàn FREE** - không cần API key
- **Không giới hạn** số lượng request
- **Hiển thị qua WebView** - nhẹ và nhanh

---

## 🎯 Tính Năng Map

✅ Hiển thị tất cả ảnh đã chụp trên bản đồ
✅ Marker là thumbnail của ảnh
✅ Click marker xem thông tin chi tiết
✅ Tự động zoom về vị trí có ảnh
✅ Nút "Chụp ngay" nếu chưa có ảnh
✅ Nút refresh để cập nhật markers mới

---

## 🚨 Nếu Gặp Lỗi

### Lỗi: "Could not resolve react-native-webview"
```bash
npm install react-native-webview
expo prebuild --clean
npx expo run:android
```

### Lỗi: WebView không hiển thị
- Check internet connection
- Clear app cache
- Rebuild app

### Map load chậm
- Đợi 2-3 giây để Leaflet load
- Kiểm tra network speed

---

## 📝 So Sánh

| Feature | Google Maps | OpenStreetMap |
|---------|-------------|---------------|
| **API Key** | ✅ Required | ❌ Not Required |
| **Free** | ⚠️ Limited | ✅ Unlimited |
| **Setup** | Complex | Simple |
| **Speed** | Fast | Good |
| **Offline** | ❌ No | ❌ No |

---

**OpenStreetMap** là lựa chọn tốt nhất cho dự án không cần Google Maps features phức tạp!

