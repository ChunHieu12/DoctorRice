/**
 * Treatment Generator Utilities
 * Generate structured treatment data from AI predictions and sensor data
 */

interface SensorData {
  temperature?: number;
  humidity?: number;
  ph?: number;
  soilMoisture?: number;
  lux?: number;
  windSpeed?: number;
}

interface AIPrediction {
  class: string;
  classVi: string;
  confidence: number;
}

interface TreatmentData {
  disease: {
    name: string;
    nameEn: string;
    confidence: number;
    severity: string;
  };
  currentConditions: {
    temp: number;
    humidity: number;
    ph: number;
    soil: number;
    riskLevel: string;
  };
  pesticides: Array<{
    name: string;
    activeIngredient: string;
    dosage: string;
    mixing: string;
    timing: string;
    frequency: string;
    notes: string;
  }>;
  fertilizers: Array<{
    name: string;
    type: string;
    dosage: string;
    mixing: string;
    timing: string;
    reason: string;
  }>;
  wateringSchedule: Array<{
    date: string;
    time: string;
    action: string;
    targetLevel: string;
    duration: string;
    reason: string;
  }>;
  schedule: Array<{
    date: string;
    time: string;
    task: string;
    details: string;
  }>;
}

/**
 * Disease treatment database
 * Pesticides, fertilizers, and schedules for each disease
 */
const DISEASE_TREATMENTS: Record<string, any> = {
  'Bacterial leaf blight': {
    pesticides: [
      {
        name: 'Beam 75WP',
        activeIngredient: 'Tricyclazole',
        dosage: '20-30g/20L nước',
        mixing: 'Hòa tan thuốc trong nước sạch, khuấy đều 2-3 phút',
        timing: 'Sáng sớm (6-8h) hoặc chiều mát (16-18h)',
        frequency: 'Phun 2-3 lần, cách nhau 7-10 ngày',
        notes: 'Tránh phun khi trời mưa hoặc nắng gắt. Đeo bảo hộ khi phun.',
      },
    ],
    fertilizers: [
      {
        name: 'NPK 16-16-8',
        type: 'Phân bón tổng hợp',
        dosage: '30kg/sào (500m²)',
        mixing: 'Rải đều hoặc hòa tan trong nước tưới',
        timing: '2 tuần sau xử lý thuốc',
        reason: 'Phục hồi dinh dưỡng, tăng sức đề kháng',
      },
      {
        name: 'Phân hữu cơ vi sinh',
        type: 'Phân bón lá',
        dosage: '5-10ml/L nước',
        mixing: 'Pha loãng theo hướng dẫn, phun đều',
        timing: '1 tuần 1 lần trong 3 tuần',
        reason: 'Cải thiện hệ vi sinh đất, tăng hấp thu dinh dưỡng',
      },
    ],
  },
  'Brown spot': {
    pesticides: [
      {
        name: 'Amistar 250SC',
        activeIngredient: 'Azoxystrobin',
        dosage: '15-20ml/20L nước',
        mixing: 'Lắc đều trước khi pha, khuấy trong nước',
        timing: 'Sáng sớm hoặc chiều mát',
        frequency: 'Phun 2-3 lần, cách 7-10 ngày',
        notes: 'Luân phiên với nhóm thuốc khác để tránh kháng',
      },
    ],
    fertilizers: [
      {
        name: 'Kali Sulfate (K2SO4)',
        type: 'Phân Kali',
        dosage: '25kg/sào',
        mixing: 'Rải khi đất ẩm, tránh ngập sâu',
        timing: '1-2 tuần sau xử lý bệnh',
        reason: 'Tăng khả năng chống chịu bệnh, cải thiện chất lượng hạt',
      },
    ],
  },
  'Leaf smut': {
    pesticides: [
      {
        name: 'Topas 100EC',
        activeIngredient: 'Penconazole',
        dosage: '10ml/20L nước',
        mixing: 'Pha loãng đều trong nước, khuấy kỹ',
        timing: 'Sáng sớm (6-7h) hoặc xế chiều (17-18h)',
        frequency: 'Phun 2 lần, cách 10 ngày',
        notes: 'Phun kỹ cả mặt trên và dưới lá',
      },
    ],
    fertilizers: [
      {
        name: 'Urê',
        type: 'Phân đạm',
        dosage: '20kg/sào (giảm 20% so với bình thường)',
        mixing: 'Rải đều khi đất ẩm',
        timing: 'Sau khi bệnh được kiểm soát',
        reason: 'Phục hồi sinh trưởng, nhưng không thúc quá mạnh',
      },
    ],
  },
  'Blast': {
    pesticides: [
      {
        name: 'Beam 75WP',
        activeIngredient: 'Tricyclazole',
        dosage: '25-30g/20L nước',
        mixing: 'Hòa tan hoàn toàn trong nước, khuấy đều 3-5 phút',
        timing: 'Sáng sớm (6-8h) hoặc chiều mát (16-18h)',
        frequency: 'Phun 2-3 lần, cách 7 ngày',
        notes: 'Xử lý ngay khi phát hiện, phun đều toàn bộ ruộng',
      },
    ],
    fertilizers: [
      {
        name: 'NPK 20-20-15',
        type: 'Phân bón tổng hợp',
        dosage: '35kg/sào',
        mixing: 'Rải đều hoặc hòa tan trong nước',
        timing: '2 tuần sau xử lý bệnh',
        reason: 'Tăng sức đề kháng, phục hồi dinh dưỡng nhanh',
      },
      {
        name: 'Silic (K2SiO3)',
        type: 'Phân bón lá',
        dosage: '200ml/20L nước',
        mixing: 'Pha loãng, phun đều lên lá',
        timing: '1 tuần 1 lần trong 4 tuần',
        reason: 'Tăng độ cứng thành tế bào, chống xâm nhập nấm bệnh',
      },
    ],
  },
  'Hispa': {
    pesticides: [
      {
        name: 'Bassa 50EC',
        activeIngredient: 'Fenobucarb',
        dosage: '30ml/20L nước',
        mixing: 'Lắc đều trước khi pha, khuấy trong nước sạch',
        timing: 'Sáng sớm (6-7h) hoặc chiều mát (17-18h)',
        frequency: 'Phun 2 lần, cách 7-10 ngày',
        notes: 'Phun kỹ cả trong lòng lá và bẹ lá nơi ấu trùng ẩn náu',
      },
    ],
    fertilizers: [
      {
        name: 'NPK 16-16-8',
        type: 'Phân bón tổng hợp',
        dosage: '30kg/sào',
        mixing: 'Rải đều khi đất ẩm',
        timing: 'Sau khi kiểm soát sâu',
        reason: 'Phục hồi sinh trưởng, bù đắp dinh dưỡng mất do sâu gặm',
      },
      {
        name: 'Phân hữu cơ vi sinh',
        type: 'Phân bón lá',
        dosage: '10ml/L nước',
        mixing: 'Pha loãng, phun đều',
        timing: '1 tuần 1 lần trong 3 tuần',
        reason: 'Kích thích lá phục hồi nhanh, tăng sức đề kháng',
      },
    ],
  },
  'Tungro': {
    pesticides: [
      {
        name: 'Admire 200SL',
        activeIngredient: 'Imidacloprid',
        dosage: '20ml/20L nước',
        mixing: 'Lắc đều trước khi pha, khuấy trong nước',
        timing: 'Sáng sớm, phun phòng trừ rầy truyền bệnh',
        frequency: 'Phun 2-3 lần, cách 7 ngày',
        notes: 'Tungro do virus, cần diệt rầy truyền bệnh. Nhổ bỏ cây bệnh nặng.',
      },
    ],
    fertilizers: [
      {
        name: 'Kali Sulfate',
        type: 'Phân Kali',
        dosage: '25kg/sào',
        mixing: 'Rải đều khi đất ẩm',
        timing: 'Ngay sau khi phát hiện bệnh',
        reason: 'Tăng sức chống chịu, giảm thiệt hại do virus',
      },
      {
        name: 'Phân hữu cơ Amino acid',
        type: 'Phân bón lá',
        dosage: '15ml/L nước',
        mixing: 'Pha loãng, phun đều',
        timing: '2 tuần 1 lần',
        reason: 'Bổ sung dinh dưỡng, hỗ trợ cây chống chọi với virus',
      },
    ],
  },
  'Healthy': {
    pesticides: [],
    fertilizers: [
      {
        name: 'NPK 16-16-8',
        type: 'Phân bón tổng hợp',
        dosage: '30kg/sào',
        mixing: 'Rải đều theo chu kỳ',
        timing: 'Định kỳ theo giai đoạn sinh trưởng',
        reason: 'Duy trì dinh dưỡng cân đối, phát triển khỏe mạnh',
      },
      {
        name: 'Phân hữu cơ vi sinh',
        type: 'Phân bón lá',
        dosage: '5-10ml/L nước',
        mixing: 'Pha loãng, phun định kỳ',
        timing: '2 tuần 1 lần',
        reason: 'Tăng cường miễn dịch, phòng ngừa bệnh',
      },
    ],
  },
};

/**
 * Get severity level from confidence score
 */
function getSeverity(confidence: number): string {
  if (confidence >= 85) return 'high';
  if (confidence >= 70) return 'medium';
  return 'low';
}

/**
 * Get risk level from sensor data
 */
function getRiskLevel(sensors: SensorData): string {
  const temp = sensors.temperature || 0;
  const humidity = sensors.humidity || 0;
  
  // High temperature + high humidity = high risk
  if (temp > 30 && humidity > 85) return 'high';
  if (temp > 28 && humidity > 80) return 'medium';
  return 'low';
}

/**
 * Generate watering schedule based on disease and conditions
 */
function generateWateringSchedule(disease: string, sensors: SensorData): any[] {
  const schedule = [];
  const today = new Date();
  
  // Day 1: Reduce water level
  schedule.push({
    date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '06:00',
    action: 'Giảm mức nước',
    targetLevel: '3-5cm',
    duration: '2 ngày',
    reason: 'Giảm độ ẩm, hạn chế phát triển bệnh',
  });
  
  // Day 4: Resume normal irrigation
  schedule.push({
    date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '06:00',
    action: 'Tưới bình thường',
    targetLevel: '5-10cm',
    duration: 'Duy trì',
    reason: 'Cung cấp nước cho sinh trưởng sau khi xử lý bệnh',
  });
  
  return schedule;
}

/**
 * Generate task schedule
 */
function generateTaskSchedule(disease: string): any[] {
  const schedule = [];
  const today = new Date();
  
  // Day 0: Apply pesticide
  schedule.push({
    date: today.toISOString().split('T')[0],
    time: '07:00',
    task: 'Phun thuốc trị bệnh',
    details: 'Phun đều toàn bộ ruộng, tập trung vùng nhiễm nặng',
  });
  
  // Day 7: Second spray
  schedule.push({
    date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '07:00',
    task: 'Phun thuốc lần 2',
    details: 'Kiểm tra và phun lại nếu còn bệnh',
  });
  
  // Day 14: Apply fertilizer
  schedule.push({
    date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '08:00',
    task: 'Bón phân phục hồi',
    details: 'Bón đều theo liều lượng khuyến cáo',
  });
  
  // Day 21: Monitor
  schedule.push({
    date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '09:00',
    task: 'Giám sát tình hình',
    details: 'Kiểm tra bệnh có tái phát, đánh giá sinh trưởng',
  });
  
  return schedule;
}

/**
 * Generate comprehensive treatment data
 */
export function generateTreatmentData(
  aiPrediction: AIPrediction,
  sensors: SensorData = {}
): TreatmentData {
  const diseaseKey = aiPrediction.class;
  const treatment = DISEASE_TREATMENTS[diseaseKey] || DISEASE_TREATMENTS['Bacterial leaf blight'];
  
  return {
    disease: {
      name: aiPrediction.classVi,
      nameEn: aiPrediction.class,
      confidence: aiPrediction.confidence,
      severity: getSeverity(aiPrediction.confidence),
    },
    currentConditions: {
      temp: sensors.temperature || 0,
      humidity: sensors.humidity || 0,
      ph: sensors.ph || 0,
      soil: sensors.soilMoisture || 0,
      riskLevel: getRiskLevel(sensors),
    },
    pesticides: treatment.pesticides || [],
    fertilizers: treatment.fertilizers || [],
    wateringSchedule: generateWateringSchedule(diseaseKey, sensors),
    schedule: generateTaskSchedule(diseaseKey),
  };
}

/**
 * Format treatment data for Firebase executions structure
 * Enhanced with disease info, image, sensors for IoT display
 */
export function formatForFirebase(treatmentData: TreatmentData, photoData: any) {
  const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  // Use milliseconds for unique timestamp (Option A)
  const baseTimestamp = Date.now();
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  
  const executions: any = {};
  
  // Treatment execution (pesticides)
  if (treatmentData.pesticides.length > 0) {
    const pesticide = treatmentData.pesticides[0];
    // Use milliseconds timestamp to ensure uniqueness even for multiple diseases on same day
    const treatmentTimestamp = baseTimestamp;
    executions.treatment = {
      [treatmentTimestamp]: {
        session_id: sessionId,
        // Add disease info at root level
        disease_name: treatmentData.disease.name,
        disease_name_en: treatmentData.disease.nameEn,
        confidence: treatmentData.disease.confidence,
        severity: treatmentData.disease.severity,
        // Add current conditions (sensors)
        current_conditions: {
          temperature: treatmentData.currentConditions.temp,
          humidity: treatmentData.currentConditions.humidity,
          ph: treatmentData.currentConditions.ph,
          soil_moisture: treatmentData.currentConditions.soil,
          risk_level: treatmentData.currentConditions.riskLevel,
        },
        payload: {
          farmer_id: 2, // Default farmer ID
          execution_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          gps_data: {
            lat: photoData.gps?.lat || 0,
            lon: photoData.gps?.lng || 0,
          },
          image_url: photoData.imageUrl || '',
          drug_name: pesticide.name,
          active_ingredient: pesticide.activeIngredient,
          total_volume: pesticide.dosage.split('/')[0], // Extract dosage
          mixing_instruction: pesticide.mixing,
          timing: pesticide.timing,
          frequency: pesticide.frequency,
          notes: pesticide.notes,
        },
      },
    };
  }
  
  // Fertilizer execution
  if (treatmentData.fertilizers.length > 0) {
    // Use milliseconds with offset to ensure uniqueness
    const fertilizerTimestamp = baseTimestamp + 1;
    executions.fertilizer = {
      [fertilizerTimestamp]: {
        session_id: sessionId,
        payload: {
          farmer_id: 2,
          execution_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
          gps_data: {
            lat: photoData.gps?.lat || 0,
            lon: photoData.gps?.lng || 0,
          },
          summary: 'Phục hồi dinh dưỡng sau khi xử lý bệnh',
          caution: 'Không bón khi trời mưa lớn hoặc ruộng ngập sâu',
          execution_stage: {
            fertilizers_to_apply: treatmentData.fertilizers.map(f => ({
              type: f.name,
              quantity_kg: parseInt(f.dosage) || 30,
              instructions: f.mixing,
            })),
          },
        },
      },
    };
  }
  
  // Watering execution
  if (treatmentData.wateringSchedule.length > 0) {
    const water = treatmentData.wateringSchedule[0];
    // Use milliseconds with offset to ensure uniqueness
    const waterTimestamp = baseTimestamp + 2;
    executions.water = {
      [waterTimestamp]: {
        session_id: sessionId,
        payload: {
          farmer_id: 2,
          execution_time: water.date + 'T' + water.time + ':00Z',
          gps_data: {
            lat: photoData.gps?.lat || 0,
            lon: photoData.gps?.lng || 0,
          },
          action: water.action,
          target_level: water.targetLevel,
        },
      },
    };
  }
  
  return {
    sessionId,
    dateStr, // YYYYMMDD format for /plans/{date}/ structure
    executions,
  };
}

