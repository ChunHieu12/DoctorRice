/**
 * Sensor Analysis Utilities
 * Analyze IoT sensor data for risk assessment
 */

interface SensorData {
  temperature: number;  // Changed from 'temp' for consistency with frontend
  humidity: number;
  ph: number;
  soilMoisture: number; // Changed from 'soil' for consistency with frontend
  lux: number;
  windSpeed: number;    // Changed from 'wind' for consistency with frontend
}

/**
 * Analyze sensor data and generate alerts
 */
export function analyzeSensorData(sensors: SensorData): {
  riskLevel: 'low' | 'medium' | 'high';
  alerts: string[];
  shouldShowSendButton: boolean;
} {
  const alerts: string[] = [];
  let riskScore = 0;

  // Soil moisture analysis
  if (sensors.soilMoisture < 20) {
    alerts.push('⚠️ Độ ẩm đất thấp (' + sensors.soilMoisture + '%) - CẦN TƯỚI');
    riskScore += 2;
  }

  // pH analysis
  if (sensors.ph < 5.5) {
    alerts.push('⚠️ pH đất thấp (' + sensors.ph + ') - Đất chua');
    riskScore += 1;
  } else if (sensors.ph > 7.5) {
    alerts.push('⚠️ pH đất cao (' + sensors.ph + ') - Đất kiềm');
    riskScore += 1;
  }

  // Humidity analysis
  if (sensors.humidity > 85) {
    alerts.push('⚠️ Độ ẩm không khí cao (' + sensors.humidity + '%) - Nguy cơ bệnh nấm');
    riskScore += 2;
  }

  // Temperature analysis
  if (sensors.temperature > 35) {
    alerts.push('🌡️ Nhiệt độ cao (' + sensors.temperature + '°C) - Stress nhiệt');
    riskScore += 1;
  } else if (sensors.temperature < 15) {
    alerts.push('🌡️ Nhiệt độ thấp (' + sensors.temperature + '°C)');
    riskScore += 1;
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (riskScore >= 4) {
    riskLevel = 'high';
  } else if (riskScore >= 2) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  return {
    riskLevel,
    alerts,
    shouldShowSendButton: true, // Always show for IoT images
  };
}

/**
 * Build enhanced Gemini prompt with sensor data
 */
export function buildEnhancedGeminiPrompt(
  disease: { class: string; classVi: string; confidence: number },
  sensors: SensorData,
  weatherForecast: any
): string {
  const soilStatus = sensors.soilMoisture < 20 ? '❌ Khô' : sensors.soilMoisture < 50 ? '⚠️ Khá khô' : '✅ Ẩm';
  const phStatus = sensors.ph < 5.5 ? '⚠️ Chua' : sensors.ph > 7.5 ? '⚠️ Kiềm' : '✅ Bình thường';

  return `Bạn là "Bác sĩ Lúa" - chuyên gia nông nghiệp. Hãy phân tích và đưa ra phác đồ điều trị CHI TIẾT.

📸 BỆNH PHÁT HIỆN: ${disease.classVi} (${disease.class})
🎯 Độ tin cậy: ${disease.confidence.toFixed(1)}%

🔬 DỮ LIỆU CẢM BIẾN REALTIME (TẠI RUỘNG):
- Nhiệt độ: ${sensors.temperature}°C
- Độ ẩm KK: ${sensors.humidity}%
- pH đất: ${sensors.ph} ${phStatus}
- Độ ẩm đất: ${sensors.soilMoisture}% ${soilStatus}
- Ánh sáng: ${sensors.lux} lux
- Gió: ${sensors.windSpeed} m/s

🌤️ DỰ BÁO THỜI TIẾT 3 NGÀY:
${formatWeather(weatherForecast)}

⚡ YÊU CẦU: Trả về ĐÚNG format JSON sau:

{
  "textResponse": "[Text hiển thị cho user - tự nhiên, thân thiện, có emoji]",
  "structuredData": {
    "disease": {
      "name": "${disease.classVi}",
      "nameEn": "${disease.class}",
      "confidence": ${disease.confidence},
      "severity": "low|medium|high"
    },
    "currentConditions": {
      "temperature": ${sensors.temperature},
      "humidity": ${sensors.humidity},
      "ph": ${sensors.ph},
      "soilMoisture": ${sensors.soilMoisture},
      "riskLevel": "low|medium|high"
    },
    "pesticides": [
      {
        "name": "Tên thuốc",
        "activeIngredient": "Hoạt chất",
        "dosage": "Liều lượng (VD: 20g/16 lít)",
        "mixing": "Cách pha chi tiết",
        "timing": "Thời điểm phun cụ thể",
        "frequency": "Tần suất",
        "notes": "Lưu ý"
      }
    ],
    "fertilizers": [
      {
        "name": "Tên phân bón",
        "type": "pH adjuster|recovery|preventive",
        "dosage": "Liều lượng",
        "mixing": "Cách pha/bón",
        "timing": "Thời điểm",
        "reason": "Lý do"
      }
    ],
    "wateringSchedule": [
      {
        "date": "YYYY-MM-DD",
        "time": "HH:MM",
        "action": "Tưới nước|Tưới nhẹ",
        "targetLevel": "Mức nước",
        "duration": "Thời gian",
        "reason": "Lý do"
      }
    ],
    "schedule": [
      {
        "date": "YYYY-MM-DD",
        "time": "HH:MM",
        "task": "Công việc",
        "details": "Chi tiết"
      }
    ]
  }
}

${sensors.soilMoisture < 20 ? '\n⚠️ QUAN TRỌNG: Độ ẩm đất RẤT THẤP - PHẢI TƯỚI trước khi điều trị!\n' : ''}
${sensors.ph < 5.5 ? '\n⚠️ ƯU TIÊN: Điều chỉnh pH đất (vôi bột) trước!\n' : ''}

Trả về ĐÚNG JSON format, KHÔNG thêm markdown. Text response phải TỰ NHIÊN, THÂN THIỆN.`;
}

function formatWeather(weather: any): string {
  if (!weather || !weather.forecast) return 'Không có dữ liệu';
  
  return weather.forecast.slice(0, 3).map((day: any, idx: number) => 
    `  • Ngày ${idx + 1}: ${day.temp}°C, Độ ẩm ${day.humidity}%, Mưa ${day.rain || 0}mm`
  ).join('\n');
}

