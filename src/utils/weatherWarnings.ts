/**
 * Weather Warnings Logic
 * Tính toán cảnh báo nông nghiệp dựa trên thời tiết
 */

import type {
    ForecastData,
    ForecastItem,
    WarningLevel,
    WeatherData,
    WeatherWarning,
} from '@/types/weather.types';

interface DailyWeatherSummary {
  date: string;
  avgTemp: number;
  avgHumidity: number;
  totalRain: number;
  maxTemp: number;
  minTemp: number;
  description: string;
}

/**
 * Tính toán cảnh báo nông nghiệp từ dữ liệu thời tiết
 */
export const calculateWeatherWarnings = (
  current: WeatherData,
  forecast: ForecastData
): WeatherWarning[] => {
  const warnings: WeatherWarning[] = [];

  // Tính toán summary cho 3 ngày tới
  const dailySummaries = calculateDailySummaries(forecast);
  
  // Current weather analysis
  const currentHumidity = current.main.humidity;
  const currentTemp = current.main.temp;
  const currentRain = current.rain?.['1h'] || 0;

  // Check 1: High humidity + rain = Bệnh đạo ôn risk
  if (currentHumidity > 85 && currentRain > 5) {
    warnings.push({
      id: 'blast-critical',
      level: 'critical',
      title: '🚨 Nguy cơ bệnh đạo ôn RẤT CAO',
      description: `Độ ẩm ${currentHumidity}% kết hợp mưa ${currentRain.toFixed(1)}mm - Điều kiện lý tưởng cho bệnh đạo ôn phát triển.`,
      recommendation: 'KHẨN CẤP: Phun thuốc Tricyclazole hoặc Tebuconazole NGAY trong 24h. Tăng cường thoát nước.',
      icon: '⚠️',
      color: '#D32F2F',
      diseases: ['Đạo ôn'],
    });
  } else if (currentHumidity > 80) {
    warnings.push({
      id: 'blast-high',
      level: 'high',
      title: '⚠️ Nguy cơ bệnh đạo ôn CAO',
      description: `Độ ẩm ${currentHumidity}% - Môi trường thuận lợi cho bệnh đạo ôn.`,
      recommendation: 'Phun thuốc phòng ngừa trong 48h. Theo dõi sát ruộng lúa.',
      icon: '⚠️',
      color: '#F57C00',
      diseases: ['Đạo ôn'],
    });
  }

  // Check 2: High humidity + moderate rain = Bệnh đốm nâu risk
  const next3DaysRain = dailySummaries.reduce((sum, day) => sum + day.totalRain, 0);
  const avgHumidity3Days = dailySummaries.reduce((sum, day) => sum + day.avgHumidity, 0) / 3;

  if (avgHumidity3Days > 80 && next3DaysRain > 30) {
    warnings.push({
      id: 'brownspot-high',
      level: 'high',
      title: '⚠️ Nguy cơ bệnh đốm nâu CAO',
      description: `Độ ẩm TB 3 ngày: ${avgHumidity3Days.toFixed(0)}%, mưa tích lũy: ${next3DaysRain.toFixed(1)}mm.`,
      recommendation: 'Phun thuốc Mancozeb hoặc Validamycin. Bổ sung phân Kali tăng sức đề kháng.',
      icon: '🟤',
      color: '#F57C00',
      diseases: ['Đốm nâu'],
    });
  } else if (avgHumidity3Days > 75) {
    warnings.push({
      id: 'brownspot-medium',
      level: 'medium',
      title: '🔶 Nguy cơ bệnh đốm nâu TRUNG BÌNH',
      description: `Độ ẩm TB 3 ngày: ${avgHumidity3Days.toFixed(0)}%.`,
      recommendation: 'Theo dõi sát. Chuẩn bị thuốc phun nếu thấy triệu chứng.',
      icon: '🟠',
      color: '#FFA726',
      diseases: ['Đốm nâu'],
    });
  }

  // Check 3: Continuous rain = Bệnh bạc lá risk
  const continuousRainDays = dailySummaries.filter(day => day.totalRain > 10).length;
  
  if (continuousRainDays >= 2 && avgHumidity3Days > 85) {
    warnings.push({
      id: 'bacterialleaf-high',
      level: 'high',
      title: '⚠️ Nguy cơ bệnh bạc lá CAO',
      description: `Mưa liên tục ${continuousRainDays} ngày, độ ẩm trên 85%.`,
      recommendation: 'Phun thuốc kháng sinh nông nghiệp (Validamycin A hoặc Kasugamycin). Cắt bỏ lá bệnh.',
      icon: '🍃',
      color: '#F57C00',
      diseases: ['Bạc lá'],
    });
  }

  // Check 4: High temperature = Heat stress
  const maxTemp3Days = Math.max(...dailySummaries.map(day => day.maxTemp));
  
  if (maxTemp3Days > 36) {
    warnings.push({
      id: 'heatstress-high',
      level: 'high',
      title: '🌡️ Cảnh báo NẮNG NÓNG',
      description: `Nhiệt độ cao nhất: ${maxTemp3Days.toFixed(1)}°C - Nguy cơ cháy lúa.`,
      recommendation: 'Tưới nước buổi sáng sớm/chiều mát. Tăng mực nước ruộng 5-7cm.',
      icon: '☀️',
      color: '#D32F2F',
      diseases: [],
    });
  } else if (maxTemp3Days > 34) {
    warnings.push({
      id: 'heatstress-medium',
      level: 'medium',
      title: '🔶 Nắng nóng vừa phải',
      description: `Nhiệt độ cao nhất: ${maxTemp3Days.toFixed(1)}°C.`,
      recommendation: 'Duy trì mực nước ổn định. Tưới nước buổi sáng sớm.',
      icon: '🌤️',
      color: '#FFA726',
      diseases: [],
    });
  }

  // Check 5: Heavy rain = Flooding risk
  const heavyRainDay = dailySummaries.find(day => day.totalRain > 50);
  
  if (heavyRainDay) {
    warnings.push({
      id: 'flooding-critical',
      level: 'critical',
      title: '🌊 CẢNH BÁO MƯA LỚN',
      description: `Mưa dự báo: ${heavyRainDay.totalRain.toFixed(1)}mm - Nguy cơ ngập úng.`,
      recommendation: 'KHẨN CẤP: Kiểm tra hệ thống thoát nước. Đắp bờ bao. Theo dõi mực nước 24/7.',
      icon: '🌧️',
      color: '#D32F2F',
      diseases: [],
    });
  } else if (next3DaysRain > 80) {
    warnings.push({
      id: 'flooding-high',
      level: 'high',
      title: '⚠️ Mưa nhiều 3 ngày tới',
      description: `Tổng lượng mưa: ${next3DaysRain.toFixed(1)}mm.`,
      recommendation: 'Kiểm tra hệ thống thoát nước. Chuẩn bị phương án úng ngập.',
      icon: '🌧️',
      color: '#F57C00',
      diseases: [],
    });
  }

  // Check 6: Low risk - Good conditions
  if (warnings.length === 0) {
    warnings.push({
      id: 'good-conditions',
      level: 'low',
      title: '✅ Thời tiết thuận lợi',
      description: `Nhiệt độ ${currentTemp.toFixed(1)}°C, độ ẩm ${currentHumidity}% - Điều kiện tốt cho lúa phát triển.`,
      recommendation: 'Duy trì chế độ chăm sóc thường xuyên. Theo dõi sâu bệnh.',
      icon: '✅',
      color: '#4CAF50',
      diseases: [],
    });
  }

  // Sort by severity
  const severityOrder: { [key in WarningLevel]: number } = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return warnings.sort((a, b) => severityOrder[a.level] - severityOrder[b.level]);
};

/**
 * Tính toán summary cho từng ngày
 */
const calculateDailySummaries = (forecast: ForecastData): DailyWeatherSummary[] => {
  const forecastByDay: { [key: string]: ForecastItem[] } = {};
  
  // Group by day
  forecast.list.forEach((item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString('vi-VN');
    if (!forecastByDay[date]) {
      forecastByDay[date] = [];
    }
    forecastByDay[date].push(item);
  });

  // Calculate daily summaries
  return Object.entries(forecastByDay)
    .slice(0, 3) // Only take 3 days
    .map(([date, items]) => {
      const temps = items.map(item => item.main.temp);
      const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
      const maxTemp = Math.max(...temps);
      const minTemp = Math.min(...temps);
      
      const avgHumidity = items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length;
      const totalRain = items.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0);
      const description = items[0].weather[0].description;

      return {
        date,
        avgTemp: Math.round(avgTemp * 10) / 10,
        avgHumidity: Math.round(avgHumidity),
        totalRain: Math.round(totalRain * 10) / 10,
        maxTemp: Math.round(maxTemp * 10) / 10,
        minTemp: Math.round(minTemp * 10) / 10,
        description,
      };
    });
};

/**
 * Get weather icon emoji
 */
export const getWeatherIcon = (iconCode: string, description: string): string => {
  // OpenWeatherMap icon codes
  if (iconCode.startsWith('01')) return '☀️'; // Clear sky
  if (iconCode.startsWith('02')) return '🌤️'; // Few clouds
  if (iconCode.startsWith('03')) return '⛅'; // Scattered clouds
  if (iconCode.startsWith('04')) return '☁️'; // Broken clouds
  if (iconCode.startsWith('09')) return '🌧️'; // Shower rain
  if (iconCode.startsWith('10')) return '🌦️'; // Rain
  if (iconCode.startsWith('11')) return '⛈️'; // Thunderstorm
  if (iconCode.startsWith('13')) return '❄️'; // Snow
  if (iconCode.startsWith('50')) return '🌫️'; // Mist
  
  // Fallback based on description
  const desc = description.toLowerCase();
  if (desc.includes('rain') || desc.includes('mưa')) return '🌧️';
  if (desc.includes('cloud') || desc.includes('mây')) return '☁️';
  if (desc.includes('clear') || desc.includes('quang')) return '☀️';
  if (desc.includes('storm') || desc.includes('giông')) return '⛈️';
  
  return '🌤️'; // Default
};

/**
 * Format temperature
 */
export const formatTemp = (temp: number): string => {
  return `${Math.round(temp)}°C`;
};

/**
 * Format humidity
 */
export const formatHumidity = (humidity: number): string => {
  return `${Math.round(humidity)}%`;
};

/**
 * Format rain
 */
export const formatRain = (rain: number): string => {
  if (rain === 0) return '0mm';
  return `${rain.toFixed(1)}mm`;
};

