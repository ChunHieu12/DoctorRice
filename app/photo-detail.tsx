/**
 * PhotoDetailScreen - Detailed view of photo with disease information tabs
 * Tabs: Thông tin bệnh | Cách trị bệnh
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Photo, getPhotoById } from '../src/services/photo.service';

const { width } = Dimensions.get('window');

type TabKey = 'info' | 'treatment';

// Disease information database (will be updated by user later)
const DISEASE_INFO: Record<string, { info: string; treatment: string; infoVi: string; treatmentVi: string }> = {
  bacterial_leaf_blight: {
    infoVi: `**Bệnh bạc lá vi khuẩn** (Bacterial Leaf Blight)

🦠 **Nguyên nhân:**
- Vi khuẩn Xanthomonas oryzae pv. oryzae
- Phát triển mạnh trong điều kiện ẩm ướt, nhiệt độ 25-30°C

📋 **Triệu chứng:**
- Lá có các vệt dài màu vàng nhạt đến xám trắng
- Vệt bệnh thường xuất hiện ở rìa lá
- Lá khô, chết dần từ đầu lá
- Có thể gây thiệt hại nặng nếu không xử lý kịp thời

⚠️ **Mức độ nguy hiểm:** Cao
🌾 **Giai đoạn dễ nhiễm:** Đẻ nhánh đến trỗ bông`,
    
    treatmentVi: `**Cách phòng trừ Bệnh bạc lá vi khuẩn:**

✅ **Phòng ngừa:**
1. Chọn giống lúa kháng bệnh
2. Xử lý hạt giống trước khi gieo bằng nước nóng 52-54°C trong 10 phút
3. Tăng cường thoát nước, tránh ngập úng kéo dài
4. Bón phân cân đối, không bón quá nhiều đạm
5. Dọn sạch rơm rạ sau thu hoạch

💊 **Điều trị khi bị bệnh:**
1. **Thuốc kháng sinh:**
   - Validamycin 5% (30ml/20 lít nước)
   - Kasugamycin 2% (40ml/20 lít nước)

2. **Thuốc đồng:**
   - Đồng Hydroxide 77% WP (20g/20 lít nước)
   - Phun cách 7-10 ngày

3. **Biện pháp nông nghiệp:**
   - Cắt bỏ lá bệnh, tiêu hủy xa ruộng
   - Tăng phân kali để tăng sức đề kháng
   - Tránh tưới nước ngập lúa vào buổi chiều

📅 **Lịch phun:** 2-3 lần, cách nhau 7-10 ngày`,
    info: 'Bacterial Leaf Blight info (English placeholder)',
    treatment: 'Bacterial Leaf Blight treatment (English placeholder)',
  },
  blast: {
    infoVi: `**Bệnh đạo ôn** (Blast Disease)

🦠 **Nguyên nhân:**
- Nấm Pyricularia oryzae (Magnaporthe oryzae)
- Bệnh nguy hiểm nhất trên lúa

📋 **Triệu chứng:**
- **Bệnh đạo ôn lá:** Các vết bệnh hình thoi, viền nâu, tâm xám trắng
- **Bệnh đạo ôn cổ bông:** Cổ bông gãy, bông chết non
- **Bệnh đạo ôn hạt:** Hạt lép, giảm năng suất

⚠️ **Mức độ nguy hiểm:** Rất cao
🌾 **Giai đoạn dễ nhiễm:** Mọi giai đoạn, đặc biệt là đẻ nhánh và trỗ bông

💧 **Điều kiện phát bệnh:**
- Nhiệt độ 20-30°C
- Độ ẩm cao > 90%
- Sương mù, mưa phùn
- Bón nhiều đạm, thiếu kali`,
    
    treatmentVi: `**Cách phòng trừ Bệnh đạo ôn:**

✅ **Phòng ngừa:**
1. Chọn giống lúa kháng bệnh cao
2. Bón phân cân đối NPK, tăng cường K và Si
3. Tránh bón đạm quá liều, bón muộn
4. Khoảng cách hàng lúa hợp lý (thoáng, đủ ánh sáng)
5. Xử lý hạt giống bằng thuốc trước khi gieo

💊 **Điều trị khi bị bệnh:**
1. **Thuốc hệ Triazole:**
   - Tricyclazole 75% WP (15-20g/20 lít nước)
   - Propiconazole 25% EC (20ml/20 lít nước)

2. **Thuốc hệ Strobilurin:**
   - Azoxystrobin 25% SC (20ml/20 lít nước)

3. **Thuốc phối hợp:**
   - Tricyclazole + Hexaconazole (20g/20 lít nước)

4. **Khi bệnh nặng:**
   - Phun 3-4 lần, cách 5-7 ngày
   - Luân phiên các loại thuốc tránh kháng thuốc

📅 **Thời điểm phun:**
- Giai đoạn đẻ nhánh: phun phòng ngừa
- Khi phát hiện bệnh: phun ngay lập tức
- Trước trỗ bông 7-10 ngày: phun bảo vệ cổ bông

⚠️ **Lưu ý:** Đạo ôn cổ bông rất nguy hiểm, cần phòng trước khi trỗ!`,
    info: 'Blast Disease info (English placeholder)',
    treatment: 'Blast Disease treatment (English placeholder)',
  },
  brown_spot: {
    infoVi: `**Bệnh đốm nâu** (Brown Spot Disease)

🦠 **Nguyên nhân:**
- Nấm Bipolaris oryzae (Helminthosporium oryzae)
- Phổ biến ở các vùng thiếu dinh dưỡng

📋 **Triệu chứng:**
- Các đốm nhỏ hình tròn hoặc bầu dục màu nâu
- Đốm có viền vàng, tâm màu nâu xám
- Lá có nhiều đốm, khô dần, giảm quang hợp
- Hạt bị nhiễm có màu nâu đen

⚠️ **Mức độ nguy hiểm:** Trung bình
🌾 **Giai đoạn dễ nhiễm:** Từ đẻ nhánh đến chín

💧 **Điều kiện phát bệnh:**
- Thiếu dinh dưỡng (đặc biệt thiếu N, P, K, Si)
- Độ ẩm cao 80-90%
- Nhiệt độ 25-30°C
- Đất chua, nghèo dinh dưỡng`,
    
    treatmentVi: `**Cách phòng trừ Bệnh đốm nâu:**

✅ **Phòng ngừa:**
1. Bón phân cân đối, đầy đủ NPK
2. Bón bổ sung phân lân, kali và silic
3. Cải tạo đất chua bằng vôi bột
4. Sử dụng giống lúa khỏe, kháng bệnh
5. Xử lý hạt giống trước khi gieo

💊 **Điều trị khi bị bệnh:**
1. **Thuốc diệt nấm:**
   - Mancozeb 80% WP (30-40g/20 lít nước)
   - Edifenphos 50% EC (30ml/20 lít nước)
   - Isoprothiolane 40% EC (30ml/20 lít nước)

2. **Phun phối hợp:**
   - Thuốc diệt nấm + phân bón lá (NPK)
   - Bổ sung kẽm và silic qua lá

3. **Bón phân bổ sung:**
   - Phân NPK cân đối
   - Phân kali (tăng sức đề kháng)
   - Vôi bột nếu đất chua

📅 **Lịch phun:** 2 lần, cách nhau 10 ngày

💡 **Mẹo:** Bệnh đốm nâu thường do thiếu dinh dưỡng. Cải thiện dinh dưỡng là cách tốt nhất!`,
    info: 'Brown Spot info (English placeholder)',
    treatment: 'Brown Spot treatment (English placeholder)',
  },
  healthy: {
    infoVi: `**Lá lúa khỏe mạnh** 🎉

✅ **Đánh giá:**
Cây lúa của bạn đang trong tình trạng tốt, không phát hiện dấu hiệu bệnh!

🌿 **Đặc điểm lá khỏe:**
- Màu xanh đậm, đều màu
- Bề mặt lá không có vết đốm hay vệt bệnh
- Lá cứng cáp, đứng thẳng
- Không có hiện tượng khô, héo

📊 **Tiếp tục duy trì:**
1. Bón phân đúng liều, đúng thời điểm
2. Quản lý nước hợp lý
3. Theo dõi sâu bệnh thường xuyên
4. Vệ sinh đồng ruộng sạch sẽ

🎯 **Khuyến nghị:**
- Tiếp tục giữ gìn chất lượng chăm sóc hiện tại
- Quan sát định kỳ để phát hiện sớm nếu có bệnh
- Chụp ảnh theo dõi sự phát triển của cây`,
    
    treatmentVi: `**Biện pháp duy trì sức khỏe cây lúa:**

✅ **Chăm sóc định kỳ:**

1. **Bón phân cân đối:**
   - Đạm: Chia 3 lần (lót, đẻ nhánh, trỗ bông)
   - Lân: Bón lót toàn bộ
   - Kali: Chia 2 lần (lót và trỗ bông)
   - Silic: 100-150 kg/ha (tăng sức đề kháng)

2. **Quản lý nước:**
   - Giai đoạn đẻ nhánh: Tưới nước cạn
   - Phơi ruộng đúng lúc
   - Giữ nước sâu 5-7cm giai đoạn trỗ bông

3. **Phòng ngừa sâu bệnh:**
   - Kiểm tra ruộng 2-3 lần/tuần
   - Dùng bẫy đèn diệt sâu đêm
   - Phun phòng bệnh nếu thời tiết xấu

4. **Vệ sinh đồng ruộng:**
   - Dọn cỏ dại thường xuyên
   - Vệ sinh bờ mương
   - Tiêu hủy cây bệnh nếu có

📅 **Lịch chăm sóc:**
- Tuần 1-3: Theo dõi cây con, bón lót
- Tuần 4-6: Giai đoạn đẻ nhánh, bón đạm lần 2
- Tuần 7-8: Phơi ruộng
- Tuần 9-10: Trỗ bông, bón kali
- Tuần 11-14: Chín, thu hoạch

🏆 **Chúc mừng!** Tiếp tục chăm sóc tốt như vậy!`,
    info: 'Healthy rice plant (English placeholder)',
    treatment: 'Maintenance tips (English placeholder)',
  },
};

export default function PhotoDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  useEffect(() => {
    if (id) {
      loadPhoto();
    }
  }, [id]);

  const loadPhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const photoData = await getPhotoById(id);
      setPhoto(photoData);
    } catch (err: any) {
      setError(err.message || 'Failed to load photo');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>
          {t('photoDetail.loading', { defaultValue: 'Đang tải...' })}
        </Text>
      </View>
    );
  }

  if (error || !photo || !photo.prediction) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error || 'Photo not found'}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>
            {t('common.back', { defaultValue: 'Quay lại' })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diseaseClass = photo.prediction.class;
  const diseaseData = DISEASE_INFO[diseaseClass] || DISEASE_INFO.healthy;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('photoDetail.title', { defaultValue: 'Chi tiết phân tích' })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photo.watermarkedUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        </View>

        {/* Disease Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>
              {diseaseClass === 'healthy' ? '🎉' : '⚠️'}
            </Text>
            <View style={styles.statusInfo}>
              <Text
                style={[
                  styles.diseaseName,
                  { color: diseaseClass === 'healthy' ? '#4CAF50' : '#F44336' },
                ]}
              >
                {photo.prediction.classVi}
              </Text>
              <Text style={styles.confidenceText}>
                {t('photoDetail.confidence', { defaultValue: 'Độ tin cậy' })}:{' '}
                {photo.prediction.confidence.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs - Only show for diseased plants */}
        {diseaseClass !== 'healthy' && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'info' && styles.activeTab]}
              onPress={() => setActiveTab('info')}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={activeTab === 'info' ? '#4CAF50' : '#999'}
              />
              <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
                {t('photoDetail.diseaseInfo', { defaultValue: 'Thông tin bệnh' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'treatment' && styles.activeTab]}
              onPress={() => setActiveTab('treatment')}
            >
              <Ionicons
                name="medical"
                size={20}
                color={activeTab === 'treatment' ? '#4CAF50' : '#999'}
              />
              <Text style={[styles.tabText, activeTab === 'treatment' && styles.activeTabText]}>
                {t('photoDetail.treatment', { defaultValue: 'Cách trị bệnh' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.contentText}>
            {activeTab === 'info' ? diseaseData.infoVi : diseaseData.treatmentVi}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.mapButton]}
            onPress={() => router.push('/farming')}
          >
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              {t('photoDetail.viewOnMap', { defaultValue: 'Xem bản đồ' })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.recaptureButton]}
            onPress={() => router.push('/camera')}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              {t('photoDetail.newPhoto', { defaultValue: 'Chụp mới' })}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageContainer: {
    width: width,
    height: width * 0.75,
    backgroundColor: '#E0E0E0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    fontSize: 48,
  },
  statusInfo: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#4CAF50',
  },
  contentContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  mapButton: {
    backgroundColor: '#4CAF50',
  },
  recaptureButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

