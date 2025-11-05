/**
 * Weather Types
 * Định nghĩa types cho dữ liệu thời tiết từ OpenWeatherMap API
 */

export interface WeatherCoordinates {
  lat: number;
  lon: number;
}

export interface WeatherMain {
  temp: number; // Nhiệt độ (°C)
  feels_like: number; // Cảm giác như
  temp_min: number; // Nhiệt độ thấp nhất
  temp_max: number; // Nhiệt độ cao nhất
  pressure: number; // Áp suất (hPa)
  humidity: number; // Độ ẩm (%)
}

export interface WeatherCondition {
  id: number;
  main: string; // Rain, Snow, Clear, Clouds, etc.
  description: string; // Mô tả chi tiết
  icon: string; // Icon code
}

export interface WeatherWind {
  speed: number; // Tốc độ gió (m/s)
  deg: number; // Hướng gió (độ)
}

export interface WeatherClouds {
  all: number; // Độ che phủ mây (%)
}

export interface WeatherRain {
  '1h'?: number; // Lượng mưa 1h (mm)
  '3h'?: number; // Lượng mưa 3h (mm)
}

export interface WeatherSnow {
  '1h'?: number; // Lượng tuyết 1h (mm)
  '3h'?: number; // Lượng tuyết 3h (mm)
}

export interface WeatherData {
  coord?: WeatherCoordinates;
  weather: WeatherCondition[];
  base?: string;
  main: WeatherMain;
  visibility?: number; // Tầm nhìn (m)
  wind: WeatherWind;
  clouds: WeatherClouds;
  rain?: WeatherRain;
  snow?: WeatherSnow;
  dt: number; // Timestamp
  sys?: {
    type?: number;
    id?: number;
    country?: string;
    sunrise?: number;
    sunset?: number;
  };
  timezone?: number;
  id?: number;
  name?: string; // Tên thành phố
  cod?: number;
}

export interface ForecastItem {
  dt: number; // Timestamp
  main: WeatherMain;
  weather: WeatherCondition[];
  clouds: WeatherClouds;
  wind: WeatherWind;
  visibility?: number;
  pop: number; // Xác suất mưa (0-1)
  rain?: WeatherRain;
  snow?: WeatherSnow;
  sys?: {
    pod: string; // Part of day (d/n)
  };
  dt_txt: string; // Ngày giờ dạng text
}

export interface ForecastData {
  cod: string;
  message: number;
  cnt: number; // Số lượng forecast
  list: ForecastItem[];
  city: {
    id: number;
    name: string;
    coord: WeatherCoordinates;
    country: string;
    population?: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

// Cảnh báo nông nghiệp
export type WarningLevel = 'low' | 'medium' | 'high' | 'critical';

export interface WeatherWarning {
  id: string;
  level: WarningLevel;
  title: string;
  description: string;
  recommendation: string;
  icon: string;
  color: string;
  diseases?: string[]; // Các bệnh liên quan
}

// Dữ liệu thời tiết tổng hợp
export interface WeatherState {
  current: WeatherData | null;
  forecast: ForecastData | null;
  warnings: WeatherWarning[];
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
  location: {
    name: string;
    coords: WeatherCoordinates;
  } | null;
}

// Location picker
export interface SavedLocation {
  id: string;
  name: string;
  coords: WeatherCoordinates;
  isDefault: boolean;
  createdAt: number;
}

