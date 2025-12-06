import {
  generateDiseaseInfo,
  generateMonitoringPlan,
  type ProcessedWeatherData,
} from "@/services/gemini.service";
import type { Photo } from "@/services/photo.service";
import { getPhotoById, updatePhotoTreatment } from "@/services/photo.service";
import { getWeatherForecast } from "@/services/weather.service";
import { parseMonitoringPlanResponse } from "@/utils/treatment-parser.utils";

type ForecastSummary = {
  date: string;
  label: string;
  temp: number;
  humidity: number;
  rain: number;
  description: string;
};

export type TreatmentContent = {
  structuredTreatment?: any;
  treatmentPlan?: string;
  diseaseSummary?: string;
  forecast?: ForecastSummary[];
};
// Export for UI schedule key building
export const buildScheduleKey = (item: any, idx: number) =>
  `${item.date || item.dayLabel || idx}-${item.task?.slice(0, 20) || ""}`;

const convertWeatherData = (weatherResponse: any): ProcessedWeatherData => {
  const forecastByDay: Record<string, any[]> = {};
  weatherResponse.forecast.list.forEach((item: any) => {
    const date = new Date(item.dt * 1000).toLocaleDateString("vi-VN");
    if (!forecastByDay[date]) {
      forecastByDay[date] = [];
    }
    forecastByDay[date].push(item);
  });

  const forecast = Object.entries(forecastByDay)
    .slice(0, 3)
    .map(([date, items]: [string, any[]]) => {
      const avgTemp =
        items.reduce((sum, item) => sum + item.main.temp, 0) / items.length;
      const avgHumidity =
        items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length;
      const totalRain = items.reduce(
        (sum, item) => sum + (item.rain?.["3h"] || 0),
        0
      );

      return {
        date,
        temp: Math.round(avgTemp),
        humidity: Math.round(avgHumidity),
        rain: Math.round(totalRain * 10) / 10,
        description: items[0].weather[0].description,
      };
    });

  return {
    current: {
      temp: weatherResponse.current.main.temp,
      humidity: weatherResponse.current.main.humidity,
      description: weatherResponse.current.weather[0].description,
    },
    forecast,
  };
};

export const buildDiseaseContext = (photo: Photo, sensors?: any) => ({
  diseaseClass: photo.prediction?.class || "unknown",
  diseaseVi:
    photo.prediction?.classVi || photo.prediction?.class || "Không xác định",
  diseaseEn: photo.prediction?.class || "unknown",
  confidence: photo.prediction?.confidence || 0,
  location: {
    lat: photo.metadata.lat,
    lng: photo.metadata.lng,
  },
  timestamp: photo.metadata.timestamp || Date.now(),
  sensors,
});

export const fetchTreatmentContent = async (
  photo: Photo,
  options?: { forceRegenerate?: boolean }
): Promise<TreatmentContent> => {
  const isIoT = (photo as any).source === "iot";
  const hasStructured = !!(photo as any).treatmentData;

  const sensors = (photo as any).iotMetadata?.sensors
    ? {
        temperature: (photo as any).iotMetadata.sensors.temp,
        humidity: (photo as any).iotMetadata.sensors.humidity,
        ph: (photo as any).iotMetadata.sensors.ph,
        soilMoisture: (photo as any).iotMetadata.sensors.soil,
        lux: (photo as any).iotMetadata.sensors.lux,
        windSpeed: (photo as any).iotMetadata.sensors.wind,
      }
    : undefined;

  const weatherResponse = await getWeatherForecast(
    photo.metadata.lat || 0,
    photo.metadata.lng || 0
  );
  const weatherData = convertWeatherData(weatherResponse);

  const treatmentResult: TreatmentContent = {
    structuredTreatment: (photo as any).treatmentData,
  };

  const needsRegenerate =
    options?.forceRegenerate ||
    !isIoT ||
    !hasStructured ||
    ((photo as any).treatmentData?.disease?.nameEn &&
      (photo as any).treatmentData?.disease?.nameEn !==
        photo.prediction?.class);

  if (needsRegenerate && photo.prediction?.class) {
    const monitoringPlan = await generateMonitoringPlan(
      buildDiseaseContext(photo, sensors),
      weatherData
    );

    if (isIoT || hasStructured) {
      const parsedTreatment = parseMonitoringPlanResponse(
        monitoringPlan,
        photo.prediction.classVi || photo.prediction.class,
        photo.prediction.class,
        photo.prediction.confidence || 0,
        sensors
      );

      const updateResult = await updatePhotoTreatment(
        photo._id,
        parsedTreatment
      );

      if (updateResult.success) {
        const refreshed = await getPhotoById(photo._id);
        treatmentResult.structuredTreatment = (refreshed as any).treatmentData;
      }
    } else {
      treatmentResult.treatmentPlan = monitoringPlan;
    }
  }

  if (!isIoT && photo.prediction?.class) {
    const diseaseInfo = await generateDiseaseInfo(
      buildDiseaseContext(photo),
      weatherData
    );
    treatmentResult.diseaseSummary = diseaseInfo;
  }

  treatmentResult.forecast = weatherData.forecast.map((item) => ({
    date: item.date,
    label: item.date,
    temp: item.temp,
    humidity: item.humidity,
    rain: item.rain,
    description: item.description,
  }));

  return treatmentResult;
};
