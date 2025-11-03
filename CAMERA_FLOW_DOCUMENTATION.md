# 📸 Camera Flow - Tài liệu Chi tiết Tính năng Chụp và Upload Ảnh

## 🎯 Tổng quan Flow

```
User Click Camera Button 
    ↓
Camera Modal Mở (Full Screen)
    ↓
Request Permissions (Camera + Location)
    ↓
Hiển thị Camera View + GPS Realtime
    ↓
User Chụp Ảnh HOẶC Chọn từ Gallery
    ↓
Resize Image (1280px width, 80% quality)
    ↓
Upload to Backend với GPS metadata
    ↓
Backend: Save → Cloudinary Upload → Watermark → AI Prediction
    ↓
Navigate to Result Screen
    ↓
Hiển thị: Ảnh đã watermark + Kết quả AI
```

---

## 📋 Chi tiết từng Bước

### **BƯỚC 1: User Click Camera Button tại Tab Bar**

**File**: `src/components/ui/CustomTabBar.tsx`

```typescript
const handleCameraPress = async () => {
  // Check camera permission
  if (permissionsState.camera === 'granted') {
    router.push('/camera-modal'); // ✅ Mở camera
  } else {
    setShowPermissionModal(true); // ❌ Yêu cầu quyền
  }
};
```

**Kết quả**:
- ✅ Có quyền → Navigate to `/camera-modal`
- ❌ Chưa có quyền → Hiển thị `PermissionRequestModal`

---

### **BƯỚC 2: Camera Modal Khởi tạo**

**File**: `app/camera-modal.tsx`

#### **2.1 Request Camera Permission**
```typescript
const [permission, requestPermission] = useCameraPermissions();

useEffect(() => {
  if (permission && !permission.granted && permission.canAskAgain) {
    requestPermission(); // Auto request
  }
}, [permission]);
```

#### **2.2 Request Location Permission & Get GPS**
```typescript
useEffect(() => {
  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc); // ✅ Lưu GPS
    }
  })();
}, []);
```

**Kết quả**:
- Camera permission: Granted → Hiển thị camera
- Location permission: Granted → Lấy GPS và hiển thị realtime
- GPS Display: `📍 10.825123, 106.629456`

---

### **BƯỚC 3A: User CHỤP ẢNH (Capture)**

**Trigger**: Click vào nút chụp giữa (nút tròn lớn màu trắng)

```typescript
const handleCapture = async () => {
  // 1. Validate
  if (!cameraRef.current) {
    Alert.alert('Lỗi', 'Camera chưa sẵn sàng');
    return;
  }
  if (!location) {
    Alert.alert('Lỗi', 'Đang lấy vị trí GPS, vui lòng đợi...');
    return;
  }

  // 2. Capture photo
  setIsLoading(true);
  setLoadingMessage('Đang chụp ảnh...');
  
  const photo = await cameraRef.current.takePictureAsync({
    quality: 0.8, // 80% quality
  });
  
  console.log('📸 Photo captured:', photo.uri);
  
  // 3. Upload
  await uploadImage(photo.uri);
};
```

**Kết quả**:
- Ảnh được chụp với quality 80%
- Loading overlay hiển thị: "Đang chụp ảnh..."
- Tự động gọi `uploadImage()`

---

### **BƯỚC 3B: User CHỌN TỪ GALLERY (Pick Image)**

**Trigger**: Click vào nút gallery bên trái (icon images)

```typescript
const handlePickImage = async () => {
  // 1. Request media library permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền...');
    return;
  }

  // 2. Launch image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,   // ✅ Cho phép crop
    aspect: [4, 3],        // Tỷ lệ 4:3
    quality: 0.8,          // 80% quality
  });

  // 3. Upload if selected
  if (!result.canceled && result.assets[0]) {
    setIsLoading(true);
    setLoadingMessage('Đang xử lý ảnh...');
    await uploadImage(result.assets[0].uri);
  }
};
```

**Kết quả**:
- Gallery mở → User chọn ảnh → Cho phép crop
- Loading overlay hiển thị: "Đang xử lý ảnh..."
- Tự động gọi `uploadImage()`

---

### **BƯỚC 4: Upload Image to Backend**

**File**: `app/camera-modal.tsx` - Function `uploadImage()`

#### **4.1 Resize Image (Client-side optimization)**

```typescript
setLoadingMessage('Đang tối ưu ảnh...');

const resizedImage = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 1280 } }], // Max width 1280px
  { 
    compress: 0.8,                // 80% quality
    format: ImageManipulator.SaveFormat.JPEG 
  }
);
```

**Lý do**:
- Giảm kích thước file → Upload nhanh hơn
- Tiết kiệm băng thông
- Giữ đủ chất lượng cho watermark và AI

#### **4.2 Get Auth Token**

```typescript
const { getAccessToken } = await import('../src/services/api');
const token = await getAccessToken();

if (!token) {
  Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
  router.replace('/auth/login');
  return;
}
```

#### **4.3 Prepare FormData**

```typescript
const formData = new FormData();
const filename = resizedImage.uri.split('/').pop() || 'photo.jpg';

formData.append('photo', {
  uri: resizedImage.uri,
  type: 'image/jpeg',
  name: filename,
} as any);

formData.append('latitude', location.coords.latitude.toString());
formData.append('longitude', location.coords.longitude.toString());
formData.append('device', 'Android');
```

**Data gửi đi**:
- `photo`: File ảnh đã resize
- `latitude`: GPS latitude (ví dụ: 10.825123)
- `longitude`: GPS longitude (ví dụ: 106.629456)
- `device`: "Android" hoặc "iOS"

#### **4.4 Call Backend API**

```typescript
setLoadingMessage('Đang upload...');

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.114:5001';

const response = await fetch(`${API_URL}/api/photos/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.message || 'Upload failed');
}

console.log('✅ Upload success:', data);
```

**Backend Endpoint**: `POST /api/photos/upload`

---

### **BƯỚC 5: Backend Processing**

**File**: `backend/src/controllers/photo.controller.ts` - Function `uploadPhoto()`

#### **5.1 Validate Request**

```typescript
if (!req.file) {
  return res.status(400).json({
    success: false,
    message: 'No photo file provided',
  });
}

const { latitude, longitude, device } = req.body;

if (!latitude || !longitude) {
  return res.status(400).json({
    success: false,
    message: 'GPS coordinates are required',
  });
}
```

#### **5.2 Upload Original to Cloudinary**

```typescript
const originalUpload = await cloudinaryService.uploadImage(req.file.path, {
  folder: 'doctorrice/originals',
  public_id: `photo_${Date.now()}_${userId}`,
});

const originalUrl = originalUpload.secure_url;
const cloudinaryPublicId = originalUpload.public_id;
```

**Kết quả**: Ảnh gốc được lưu trên Cloudinary
- URL: `https://res.cloudinary.com/doivrdij4/image/upload/v123456/doctorrice/originals/photo_1234567890.jpg`

#### **5.3 Add Watermark (Cloudinary Transformation)**

```typescript
const watermarkText = `Lat: ${latitude}, Lng: ${longitude}`;

const watermarkedUrl = await cloudinaryService.addWatermark(
  cloudinaryPublicId,
  watermarkText,
  {
    position: 'south_east',
    fontSize: 32,
    color: '#FFFFFF',
    opacity: 90,
  }
);
```

**Kết quả**: URL ảnh có watermark
- URL: `https://res.cloudinary.com/.../l_text:Arial_32:Lat:%2010.825123,%20Lng:%20106.629456,co_rgb:FFFFFF,o_90/photo_1234567890.jpg`
- Watermark hiển thị ở góc dưới phải với text GPS

#### **5.4 Generate Thumbnail**

```typescript
const thumbnailUrl = await cloudinaryService.generateThumbnail(
  cloudinaryPublicId,
  { width: 200, height: 200 }
);
```

**Kết quả**: Thumbnail 200x200px cho map markers

#### **5.5 Call AI Service for Prediction**

```typescript
const prediction = await aiService.predictImage(req.file.path);
```

**AI Service Endpoint**: `POST https://doctorrice-ai-service.onrender.com/predict`

**AI Service Response**:
```json
{
  "success": true,
  "prediction": {
    "class": "blast",                    // English label
    "classVi": "Bệnh đạo ôn",            // Vietnamese label
    "confidence": 87.5,                  // Confidence %
    "all_predictions": {
      "bacterial_leaf_blight": 2.3,
      "blast": 87.5,
      "brown_spot": 8.1,
      "healthy": 2.1
    }
  }
}
```

**AI Processing (Python - TFLite Model)**:
1. Load `model/model.tflite`
2. Resize image to 224x224
3. Normalize pixels to [0,1]
4. Run inference
5. Get prediction class và confidence
6. Translate to Vietnamese:
   - `bacterial_leaf_blight` → `Bệnh bạc lá vi khuẩn`
   - `blast` → `Bệnh đạo ôn`
   - `brown_spot` → `Bệnh đốm nâu`
   - `healthy` → `Lá khỏe mạnh`

#### **5.6 Reverse Geocoding (Get Address from GPS)**

```typescript
const reverseGeoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
const geoResponse = await fetch(reverseGeoUrl, {
  headers: {
    'User-Agent': 'DoctorRice-App',
  },
});
const geoData = await geoResponse.json();
const address = geoData.display_name || 'Unknown location';
```

**Kết quả**: Địa chỉ đầy đủ từ GPS
- Ví dụ: "123 Nguyen Hue, District 1, Ho Chi Minh City, Vietnam"

#### **5.7 Save to MongoDB**

```typescript
const photo = await Photo.create({
  userId,
  originalUrl,
  watermarkedUrl,
  thumbnailUrl,
  cloudinaryPublicId,
  metadata: {
    lat: parseFloat(latitude),
    lng: parseFloat(longitude),
    timestamp: Date.now(),
    device: device || 'Unknown',
    orientation: 'portrait',
    address: address,
  },
  prediction: prediction.prediction,
  status: 'completed',
  fileSize: req.file.size,
});
```

**MongoDB Document**:
```json
{
  "_id": "67890abcdef",
  "userId": "12345user",
  "originalUrl": "https://res.cloudinary.com/.../original.jpg",
  "watermarkedUrl": "https://res.cloudinary.com/.../watermarked.jpg",
  "thumbnailUrl": "https://res.cloudinary.com/.../thumb.jpg",
  "cloudinaryPublicId": "photo_1234567890",
  "metadata": {
    "lat": 10.825123,
    "lng": 106.629456,
    "timestamp": 1699234567890,
    "device": "Android",
    "orientation": "portrait",
    "address": "123 Nguyen Hue, District 1, HCMC, Vietnam"
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
  "updatedAt": "2024-11-06T12:30:00.000Z"
}
```

#### **5.8 Return Response to App**

```typescript
res.status(201).json({
  success: true,
  message: 'Photo uploaded and analyzed successfully',
  data: {
    photo: photo,
  },
});
```

---

### **BƯỚC 6: Navigate to Result Screen**

**File**: `app/camera-modal.tsx`

```typescript
router.push({
  pathname: '/result',
  params: { photoId: data.data.photo._id },
} as any);
```

**Kết quả**: App navigate đến `/result?photoId=67890abcdef`

---

### **BƯỚC 7: Result Screen Display**

**File**: `app/result.tsx`

#### **7.1 Fetch Photo Details**

```typescript
const { photoId } = useLocalSearchParams();

useEffect(() => {
  const fetchPhoto = async () => {
    const response = await fetch(`${API_URL}/api/photos/${photoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    setPhoto(data.data.photo);
  };
  fetchPhoto();
}, [photoId]);
```

#### **7.2 Display Watermarked Image**

```typescript
<Image
  source={{ uri: photo.watermarkedUrl }}
  style={styles.image}
  resizeMode="contain"
/>
```

**Hiển thị**: Ảnh đã có watermark với GPS coordinates

#### **7.3 Display AI Prediction**

```typescript
<View style={styles.resultCard}>
  <Text style={styles.resultTitle}>Kết quả phân tích:</Text>
  <Text style={styles.disease}>
    {photo.prediction.classVi}
  </Text>
  <View style={styles.confidenceBar}>
    <View 
      style={[
        styles.confidenceFill, 
        { width: `${photo.prediction.confidence}%` }
      ]} 
    />
  </View>
  <Text style={styles.confidenceText}>
    Độ chính xác: {photo.prediction.confidence.toFixed(1)}%
  </Text>
</View>
```

**Hiển thị**:
- **Bệnh đạo ôn** (nếu `classVi = "Bệnh đạo ôn"`)
- Thanh progress bar hiển thị confidence: 87.5%
- Text: "Độ chính xác: 87.5%"

#### **7.4 Display Actions**

```typescript
<TouchableOpacity onPress={() => router.back()}>
  <Text>Chụp lại</Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => router.push('/(tabs)/farming')}>
  <Text>Xem trên bản đồ</Text>
</TouchableOpacity>
```

---

## 📊 Summary Flow Chart

```
┌─────────────────────────────────────────────────────────────┐
│                    USER CLICK CAMERA BUTTON                 │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│               OPEN CAMERA MODAL (Full Screen)               │
│  • Request Camera Permission                                │
│  • Request Location Permission                              │
│  • Get GPS Coordinates (Realtime Display)                   │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
        ┌──────────────┴──────────────┐
        ↓                             ↓
┌──────────────┐              ┌──────────────┐
│ CAPTURE      │              │ PICK FROM    │
│ PHOTO        │              │ GALLERY      │
└──────┬───────┘              └──────┬───────┘
       │                             │
       └──────────────┬──────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                   RESIZE IMAGE (Client)                     │
│  • Max width: 1280px                                        │
│  • Compress: 80%                                            │
│  • Format: JPEG                                             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              UPLOAD TO BACKEND (FormData)                   │
│  • photo: File                                              │
│  • latitude: 10.825123                                      │
│  • longitude: 106.629456                                    │
│  • device: "Android"                                        │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND PROCESSING                        │
│  1. Upload original to Cloudinary                           │
│  2. Add watermark (GPS text)                                │
│  3. Generate thumbnail (200x200)                            │
│  4. Call AI Service (Python + TFLite)                       │
│     • Load model.tflite                                     │
│     • Predict disease class                                 │
│     • Translate to Vietnamese                               │
│  5. Reverse geocoding (GPS → Address)                       │
│  6. Save to MongoDB                                         │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                RETURN RESPONSE TO APP                       │
│  • photoId                                                  │
│  • watermarkedUrl                                           │
│  • prediction { class, classVi, confidence }                │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              NAVIGATE TO RESULT SCREEN                      │
│  • Display watermarked image                                │
│  • Display AI prediction (Vietnamese)                       │
│  • Display confidence %                                     │
│  • Actions: "Chụp lại" | "Xem trên bản đồ"                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Kiểm tra Flow theo Yêu cầu

### ✅ **Yêu cầu 1: Mở camera trực tiếp khi click**
- **Đã implement**: Click camera button → `router.push('/camera-modal')` → CameraView hiển thị ngay

### ✅ **Yêu cầu 2: Ghi nhận GPS ngay lập tức**
- **Đã implement**: `useEffect` gọi `Location.getCurrentPositionAsync()` ngay khi modal mount
- Hiển thị realtime: `📍 10.825123, 106.629456`

### ✅ **Yêu cầu 3: UI Camera đầy đủ**
- ✅ Nút X đóng modal
- ✅ 4 góc viền trắng bo tròn
- ✅ Text hướng dẫn: "Đặt cây của bạn vào giữa khung hình"
- ✅ Nút flash bật/tắt
- ✅ Bottom bar màu #4CAF50
- ✅ 3 nút: Gallery | Capture | Tips
- ✅ Safe area insets (không bị navigation bar đè)

### ✅ **Yêu cầu 4: Lưu ảnh và GPS**
- **Đã implement**: 
  - Upload to Cloudinary (free platform)
  - Lưu originalUrl, watermarkedUrl, thumbnailUrl
  - Lưu GPS: latitude, longitude, address

### ✅ **Yêu cầu 5: Gán watermark với GPS**
- **Đã implement**: Cloudinary transformation với text overlay
- Text: `Lat: 10.825123, Lng: 106.629456`
- Position: Góc dưới phải (south_east)
- Style: Font Arial 32px, màu trắng, opacity 90%

### ✅ **Yêu cầu 6: Sử dụng model TFLite để nhận diện**
- **Đã implement**:
  - Python AI Service (Flask)
  - Load `model/model.tflite`
  - 4 classes: bacterial_leaf_blight, blast, brown_spot, healthy
  - Translate sang tiếng Việt
  - Return confidence score

### ✅ **Yêu cầu 7: Chuyển sang Result Screen**
- **Đã implement**: `router.push('/result?photoId=xxx')`
- Hiển thị ảnh watermarked + kết quả AI
- Nút "Xem trên bản đồ"

### ✅ **Yêu cầu 8: Map với markers**
- **Đã implement**: MapFarmScreen với OpenStreetMap
- Markers hiển thị thumbnail ảnh
- Click marker → Navigate to PhotoDetailScreen

### ✅ **Yêu cầu 9: Photo Detail với tabs**
- **Đã implement**: PhotoDetailScreen
- Tabs: "Thông tin bệnh" | "Cách trị bệnh"
- Hiển thị icon phù hợp với trạng thái

### ✅ **Yêu cầu 10: Deploy AI service trên Render**
- **Đã implement**: 
  - Dockerfile cho Python service
  - Deploy URL: `https://doctorrice-ai-service.onrender.com`
  - Backend gọi AI service qua HTTP

---

## 🔧 Environment Variables Required

```env
# Frontend (.env)
EXPO_PUBLIC_API_URL=http://192.168.1.114:5001

# Backend (backend/.env)
CLOUDINARY_CLOUD_NAME=doivrdij4
CLOUDINARY_API_KEY=616512921233148
CLOUDINARY_API_SECRET=8AjYrlt8GOt9TvbBv7MIFB4gdxk
AI_SERVICE_URL=https://doctorrice-ai-service.onrender.com

# AI Service (backend-ai/.env)
FLASK_ENV=production
MODEL_PATH=model/model.tflite
```

---

## 🎉 Kết luận

**Flow đã implement ĐÚNG và ĐẦY ĐỦ theo yêu cầu:**

1. ✅ Camera mở trực tiếp khi click
2. ✅ GPS được ghi nhận realtime
3. ✅ UI camera hoàn chỉnh với safe area
4. ✅ Chụp ảnh hoặc chọn từ gallery
5. ✅ Resize ảnh client-side để tối ưu
6. ✅ Upload to backend với GPS metadata
7. ✅ Lưu ảnh lên Cloudinary
8. ✅ Gán watermark với GPS coordinates
9. ✅ AI prediction với TFLite model (4 classes tiếng Việt)
10. ✅ Reverse geocoding (GPS → Address)
11. ✅ Lưu MongoDB với đầy đủ metadata
12. ✅ Navigate to Result Screen
13. ✅ Map view với markers (thumbnails)
14. ✅ Photo detail với tabs (Thông tin bệnh | Cách trị bệnh)

**Tất cả components, services, và backend đã hoạt động đồng bộ!** 🚀

