/**
 * Result Screen - Display uploaded photo with AI prediction results
 * Shows watermarked image, disease prediction, and navigation options
 */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatbotModal from "../src/components/ChatbotModal";
import FormattedAIText from "../src/components/FormattedAIText";
import SensorBadges from "../src/components/IoT/SensorBadges";
import { useHasIoTFields } from "../src/hooks/useHasIoTFields";
import FieldSelectionModal from "../src/screens/IoT/FieldSelectionModal";
import TreatmentSendModal from "../src/screens/IoT/TreatmentSendModal";
import { apiPost, getAccessToken } from "../src/services/api";
import { generateMonitoringPlan } from "../src/services/gemini.service";
import { Photo, getPhotoById } from "../src/services/photo.service";
import { getWeatherForecast } from "../src/services/weather.service";
import type { Field } from "../src/types";

const { width } = Dimensions.get("window");

export default function ResultScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    photoId?: string;
    source?: string;
    captureId?: string;
    imageUrl?: string;
    gps?: string;
    sensors?: string;
    deviceId?: string;
  }>();

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null);
  const [isSendingToIoT, setIsSendingToIoT] = useState(false);
  const [treatmentSent, setTreatmentSent] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFieldSelection, setShowFieldSelection] = useState(false);
  const [monitoringPlan, setMonitoringPlan] = useState("");
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  // Check IoT fields
  const { hasIoTFields, loading: iotLoading } = useHasIoTFields();

  // Prevent infinite loop - track loading state
  const hasLoadedRef = useRef(false);
  const lastIdRef = useRef<string>("");

  useEffect(() => {
    // Get current ID (either photoId or captureId)
    const currentId = params.photoId || params.captureId || "";

    // If ID changed, reset loaded flag
    if (currentId !== lastIdRef.current) {
      hasLoadedRef.current = false;
      lastIdRef.current = currentId;
    }

    // Only load if not already loaded
    if (hasLoadedRef.current) {
      return;
    }

    if (params.source === "iot" && params.imageUrl && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      // Decode imageUrl ONLY ONCE to get correct Firebase Storage URL
      // Firebase URLs from IoTImageDetailModal are encoded twice to survive router.push
      const decodedImageUrl = decodeURIComponent(params.imageUrl);

      // Check if URL has correct %2F encoding for Firebase Storage
      const hasCorrectEncoding = decodedImageUrl.includes("%2F");
      console.log("📸 Image URL check:", {
        hasCorrectEncoding,
        urlPreview: decodedImageUrl.substring(0, 80) + "...",
      });

      setFallbackImageUrl(decodedImageUrl);
      loadIoTImage();
    } else if (params.photoId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadPhoto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.source, params.imageUrl, params.photoId, params.captureId]); // Only depend on primitive values, functions are stable with ref guards

  /**
   * Load IoT image and analyze with AI
   */
  const loadIoTImage = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use fallbackImageUrl which has correct encoding (decoded from router params)
      const imageUrl = fallbackImageUrl || params.imageUrl;

      console.log("🔬 Analyzing IoT image:", {
        captureId: params.captureId,
        imageUrl: imageUrl?.substring(0, 60) + "...",
        hasCorrectEncoding: imageUrl?.includes("%2F"),
      });

      // Get auth token
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Try to download image from Firebase Storage (client-side)

      console.log("📥 Attempting to download image from Firebase...");
      console.log("Full URL:", imageUrl);
      console.log("URL length:", imageUrl?.length);
      console.log("Has %2F encoding:", imageUrl?.includes("%2F"));

      let imageBase64: string | undefined;

      try {
        const imageDownloadStart = Date.now();

        // Try direct fetch
        const imageResponse = await fetch(imageUrl!, {
          method: "GET",
          headers: {
            Accept: "image/*",
          },
        });

        if (!imageResponse.ok) {
          throw new Error(
            `HTTP ${imageResponse.status}: ${imageResponse.statusText}`
          );
        }

        const imageBlob = await imageResponse.blob();
        const imageDownloadDuration = Date.now() - imageDownloadStart;
        console.log(
          `✅ Image downloaded in ${(imageDownloadDuration / 1000).toFixed(
            1
          )}s, size: ${(imageBlob.size / 1024).toFixed(1)} KB`
        );

        // Convert to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageBlob);
        });

        imageBase64 = await base64Promise;
        console.log(
          `📦 Image converted to base64, length: ${imageBase64.length}`
        );
      } catch (downloadError: any) {
        console.warn(`⚠️ Client download failed: ${downloadError.message}`);
        console.log(`🔄 Will let backend download directly from URL`);
        // imageBase64 remains undefined, backend will use URL
      }

      // Call IoT analyze API
      const response = await fetch(
        `${
          process.env.EXPO_PUBLIC_API_URL ||
          "https://doctorrice-xdhp.onrender.com/api"
        }/iot/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            imageUrl, // Use decoded URL with correct encoding
            imageBase64: imageBase64 || undefined, // Send base64 if available
            captureId: params.captureId,
            gps: params.gps ? JSON.parse(params.gps) : null,
            sensors: params.sensors ? JSON.parse(params.sensors) : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      console.log("✅ IoT analysis result:", result);

      // Backend now saves to MongoDB and returns photoId
      if (result.data.photoId) {
        console.log(
          "📥 Loading photo from MongoDB with photoId:",
          result.data.photoId
        );

        // Load full photo data from MongoDB using photoId
        const photoData = await getPhotoById(result.data.photoId);

        console.log("📸 IoT Photo loaded from MongoDB:", {
          _id: photoData._id,
          imageUrl: photoData.originalUrl,
          disease: photoData.prediction?.classVi,
          confidence: photoData.prediction?.confidence,
          hasMetadata: !!photoData.metadata,
          source: (photoData as any)?.source, // ✅ Top-level field
          fieldId: (photoData as any).fieldId,
          hasFieldId: !!(photoData as any).fieldId,
          hasIotMetadata: !!(photoData as any)?.iotMetadata, // ✅ Check iotMetadata
          iotMetadataSensors: (photoData as any)?.iotMetadata?.sensors, // ✅ Read from iotMetadata
        });

        // ❌ REMOVED: Don't use treatmentText from backend - will generate from AI instead
        // (photoData as any).treatmentText = result.data.treatment || null;

        // Also add fieldId from response if available
        if (result.data.fieldId) {
          (photoData as any).fieldId = result.data.fieldId;
          console.log(
            "✅ Added fieldId from API response:",
            result.data.fieldId
          );
        }

        setPhoto(photoData);
        loadMonitoringPlanForResult(photoData);

        // ✅ Auto-generate treatment data immediately for IoT images
        // This ensures treatment is personalized based on disease + weather + sensors
        const hasPrediction =
          !!photoData.prediction && photoData.prediction.class;
        const notHealthy = photoData.prediction?.class !== "healthy";
        const hasTreatmentData = !!(photoData as any)?.treatmentData;

        // ✅ Check if existing treatment data matches current disease
        const existingTreatmentData = (photoData as any)?.treatmentData;
        const existingDisease =
          existingTreatmentData?.disease?.nameEn ||
          existingTreatmentData?.disease?.name;
        const currentDisease = photoData.prediction?.class;
        const treatmentMatchesDisease = existingDisease === currentDisease;

        console.log("🔍 IoT image treatment check:", {
          hasPrediction,
          notHealthy,
          hasTreatmentData,
          diseaseClass: photoData.prediction?.class,
          existingDisease,
          currentDisease,
          treatmentMatchesDisease,
          existingPesticide:
            existingTreatmentData?.pesticides?.[0]?.name || "N/A",
          existingScheduleCount: existingTreatmentData?.schedule?.length || 0,
        });

        console.log("🔍 IoT image treatment check:", {
          hasPrediction,
          notHealthy,
          hasTreatmentData,
          diseaseClass: photoData.prediction?.class,
          existingDisease,
          currentDisease,
          treatmentMatchesDisease,
          existingPesticide:
            existingTreatmentData?.pesticides?.[0]?.name || "N/A",
          existingScheduleCount: existingTreatmentData?.schedule?.length || 0,
        });

        if (hasPrediction && notHealthy) {
          if (!treatmentMatchesDisease && hasTreatmentData) {
            console.log(
              `⚠️ Treatment data exists but doesn't match disease (${existingDisease} vs ${currentDisease}), regenerating...`
            );
          } else {
            console.log(
              "🤖 Auto-generating personalized treatment plan for IoT image (disease + weather + sensors)..."
            );
          }
          // Generate immediately and wait for it to complete
          try {
            const generated = await generateMonitoringPlanBackground(photoData);
            if (generated) {
              console.log(
                "✅ Treatment data generated successfully, reloading photo..."
              );
              const { getPhotoById } = await import("@/services/photo.service");
              const updatedPhoto = await getPhotoById(photoData._id);
              setPhoto(updatedPhoto);
            } else {
              console.warn("⚠️ Treatment data generation returned false");
            }
          } catch (err: any) {
            console.error("❌ Failed to generate treatment plan:", err);
          }
        }
      } else {
        // Fallback: if backend didn't return photoId (shouldn't happen)
        console.warn("⚠️ No photoId in response, using temporary photo object");

        const gpsData = params.gps
          ? JSON.parse(params.gps)
          : { lat: 0, lng: 0 };
        const photoData: Photo = {
          _id: params.captureId || "iot-temp",
          userId: "iot-user",
          originalUrl: params.imageUrl || "",
          watermarkedUrl: params.imageUrl || "",
          status: "completed",
          fileSize: 0,
          prediction: {
            class: result.data.diseaseEn || result.data.disease || "Unknown",
            classVi: result.data.disease || "Không xác định",
            confidence: result.data.confidence || 0,
          },
          metadata: {
            lat: gpsData.lat,
            lng: gpsData.lng,
            timestamp: Date.now(),
            device: params.deviceId || "IoT Device",
            orientation: "landscape",
            address: "IoT Field",
          },
          createdAt: result.data.detectedAt || new Date().toISOString(),
          updatedAt: result.data.detectedAt || new Date().toISOString(),
        };

        (photoData as any).source = "iot";
        // ❌ REMOVED: Don't use treatmentText from backend - will generate from AI instead
        // (photoData as any).treatmentText = result.data.treatment || null;

        setPhoto(photoData);
        loadMonitoringPlanForResult(photoData);

        // ✅ Auto-generate treatment data immediately for IoT images (fallback case)
        const hasPrediction =
          !!photoData.prediction && photoData.prediction.class;
        const notHealthy = photoData.prediction?.class !== "healthy";
        const hasTreatmentData = !!(photoData as any)?.treatmentData;
        const existingTreatmentData = (photoData as any)?.treatmentData;
        const existingDisease =
          existingTreatmentData?.disease?.nameEn ||
          existingTreatmentData?.disease?.name;
        const currentDisease = photoData.prediction?.class;
        const treatmentMatchesDisease = existingDisease === currentDisease;

        if (
          hasPrediction &&
          notHealthy &&
          (!hasTreatmentData || !treatmentMatchesDisease)
        ) {
          if (!treatmentMatchesDisease && hasTreatmentData) {
            console.log(
              `⚠️ Treatment data exists but doesn't match disease (${existingDisease} vs ${currentDisease}), regenerating (fallback case)...`
            );
          } else {
            console.log(
              "🤖 Auto-generating personalized treatment plan for IoT image (fallback case)..."
            );
          }
          // Generate immediately to ensure treatment is ready
          generateMonitoringPlanBackground(photoData).catch((err) => {
            console.warn("⚠️ Failed to generate treatment plan:", err);
          });
        }
      }
    } catch (err: any) {
      console.error("❌ Failed to analyze IoT image:", err);
      setError(err.message || "Failed to analyze image");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load MongoDB photo
   */
  const loadPhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const photoData = await getPhotoById(params.photoId!);
      console.log("📸 Photo loaded:", {
        id: photoData._id,
        watermarkedUrl: photoData.watermarkedUrl,
        hasPrediction: !!photoData.prediction,
        predictionClass: photoData.prediction?.class,
        source: (photoData as any)?.source, // ✅ Top-level field
        fieldId: (photoData as any).fieldId,
        hasIotMetadata: !!(photoData as any)?.iotMetadata, // ✅ Check iotMetadata
        iotMetadataSensors: (photoData as any)?.iotMetadata?.sensors, // ✅ Read from iotMetadata
        hasTreatmentData: !!(photoData as any)?.treatmentData,
      });
      // Determine source & disease state up front
      const photoSource = params.source || (photoData as any)?.source;
      const isFromIoT = photoSource === "iot";
      const hasPrediction =
        !!photoData.prediction && photoData.prediction.class;
      const notHealthy = photoData.prediction?.class !== "healthy";

      setPhoto(photoData);

      if (hasPrediction && notHealthy) {
        loadMonitoringPlanForResult(photoData);
      } else {
        setIsLoadingPlan(false);
        setMonitoringPlan("");
      }

      // Check existing treatment data to detect mismatches between diseases
      const hasTreatmentData = !!(photoData as any)?.treatmentData;
      const existingTreatmentData = (photoData as any)?.treatmentData;
      const existingDisease =
        existingTreatmentData?.disease?.nameEn ||
        existingTreatmentData?.disease?.name;
      const currentDisease = photoData.prediction?.class;
      const treatmentMatchesDisease = existingDisease === currentDisease;

      if (isFromIoT && hasPrediction && notHealthy) {
        if (!treatmentMatchesDisease && hasTreatmentData) {
          console.log(
            `⚠️ Treatment data exists but doesn't match disease (${existingDisease} vs ${currentDisease}), regenerating...`
          );
        } else {
          console.log(
            "🤖 Auto-generating treatment plan for IoT image (disease + weather + sensors)..."
          );
        }
        // Always regenerate (don't rely on backend defaults)
        generateMonitoringPlanBackground(photoData).catch((err) => {
          console.warn("⚠️ Failed to generate treatment plan:", err);
        });
      } else if (!isFromIoT && hasPrediction && notHealthy) {
        console.log(
          "🤖 Auto-generating treatment plan for camera/upload image..."
        );
        generateMonitoringPlanBackground(photoData).catch((err) => {
          console.warn("⚠️ Failed to generate treatment plan:", err);
        });
      }
    } catch (err: any) {
      console.error("❌ Failed to load photo:", err);
      setError(err.message || "Failed to load photo");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Convert weather response to ProcessedWeatherData format (shared with photo-detail)
   */
  const convertWeatherDataForPlan = (weatherResponse: any): any => {
    const forecastByDay: { [key: string]: any[] } = {};

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
          items.reduce((sum, item) => sum + item.main.humidity, 0) /
          items.length;
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

  /**
   * Load monitoring plan text for IoT images (same as photo-detail)
   */
  const loadMonitoringPlanForResult = async (photoData: Photo) => {
    const hasPrediction = !!photoData.prediction && photoData.prediction.class;
    const notHealthy = photoData.prediction?.class !== "healthy";

    if (!hasPrediction || !notHealthy) {
      setIsLoadingPlan(false);
      setMonitoringPlan("");
      return;
    }

    try {
      setIsLoadingPlan(true);
      const isFromIoT = (photoData as any).source === "iot";
      const iotMetadata = isFromIoT
        ? (photoData as any).iotMetadata
        : undefined;
      const rawSensors = iotMetadata?.sensors;
      const sensors = rawSensors
        ? {
            temperature: rawSensors.temp,
            humidity: rawSensors.humidity,
            ph: rawSensors.ph,
            soilMoisture: rawSensors.soil,
            lux: rawSensors.lux,
            windSpeed: rawSensors.wind,
          }
        : undefined;

      const weatherResponse = await getWeatherForecast(
        photoData.metadata.lat || 0,
        photoData.metadata.lng || 0
      );
      const weatherData = convertWeatherDataForPlan(weatherResponse);

      const plan = await generateMonitoringPlan(
        {
          diseaseClass: photoData.prediction!.class,
          diseaseVi: photoData.prediction!.classVi,
          diseaseEn: photoData.prediction!.class,
          confidence: photoData.prediction!.confidence,
          location: {
            lat: photoData.metadata.lat || 0,
            lng: photoData.metadata.lng || 0,
          },
          timestamp: new Date(photoData.createdAt).getTime(),
          sensors,
        },
        weatherData
      );

      setMonitoringPlan(plan);
    } catch (err: any) {
      console.error("❌ Failed to load monitoring plan (result):", err);
      setMonitoringPlan(
        t("photoDetail.loadingPlan", {
          defaultValue: "Không thể tải kế hoạch giám sát. Vui lòng thử lại.",
        })
      );
    } finally {
      setIsLoadingPlan(false);
    }
  };

  /**
   * Handle recapture button press
   * Check IoT fields and show field selection if needed
   */
  const handleRecapture = () => {
    if (iotLoading) {
      // Still loading, just open camera
      router.push("/camera-modal" as any);
      return;
    }

    if (hasIoTFields) {
      // User has IoT fields - Show field selection modal
      setShowFieldSelection(true);
    } else {
      // No IoT fields - Open camera directly
      router.push("/camera-modal" as any);
    }
  };

  /**
   * Handle field selected from FieldSelectionModal
   */
  const handleFieldSelected = (field: Field) => {
    setShowFieldSelection(false);
    // Navigate to IoT Gallery with selected field
    router.push({
      pathname: "/iot-gallery",
      params: {
        fieldId: field._id,
        fieldName: field.name,
      },
    } as any);
  };

  /**
   * Generate monitoring plan from chatbot AI (background call)
   */
  const generateMonitoringPlanBackground = async (
    photoData?: Photo
  ): Promise<boolean> => {
    const targetPhoto = photoData || photo;
    if (!targetPhoto || !targetPhoto.prediction) {
      return false;
    }

    try {
      console.log("🤖 Generating monitoring plan in background...");

      // Import required services
      const { generateMonitoringPlan } = await import(
        "@/services/gemini.service"
      );
      const { getWeatherForecast } = await import("@/services/weather.service");
      const { parseMonitoringPlanResponse } = await import(
        "@/utils/treatment-parser.utils"
      );
      const { updatePhotoTreatment, getPhotoById } = await import(
        "@/services/photo.service"
      );

      // Get disease context
      const diseaseContext = {
        diseaseClass: targetPhoto.prediction.class,
        diseaseVi:
          targetPhoto.prediction.classVi || targetPhoto.prediction.class,
        diseaseEn: targetPhoto.prediction.class,
        confidence: targetPhoto.prediction.confidence || 0,
        location: {
          lat: targetPhoto.metadata.lat,
          lng: targetPhoto.metadata.lng,
        },
        timestamp: targetPhoto.metadata.timestamp || Date.now(),
        sensors: (targetPhoto as any).iotMetadata?.sensors
          ? {
              temperature: (targetPhoto as any).iotMetadata.sensors.temp,
              humidity: (targetPhoto as any).iotMetadata.sensors.humidity,
              ph: (targetPhoto as any).iotMetadata.sensors.ph,
              soilMoisture: (targetPhoto as any).iotMetadata.sensors.soil,
              lux: (targetPhoto as any).iotMetadata.sensors.lux,
              windSpeed: (targetPhoto as any).iotMetadata.sensors.wind,
            }
          : undefined,
      };

      // ✅ Log disease context to debug
      console.log("🔍 Generating treatment for disease:", {
        diseaseClass: diseaseContext.diseaseClass,
        diseaseVi: diseaseContext.diseaseVi,
        diseaseEn: diseaseContext.diseaseEn,
        confidence: diseaseContext.confidence,
        photoId: targetPhoto._id,
        hasSensors: !!diseaseContext.sensors,
      });

      // Get weather data and convert to ProcessedWeatherData format
      const gps = targetPhoto.metadata;
      const weatherResponse = await getWeatherForecast(gps.lat, gps.lng);

      // Convert WeatherResponse to ProcessedWeatherData
      const convertWeatherData = (weatherResponse: any): any => {
        // Group forecast by day
        const forecastByDay: { [key: string]: any[] } = {};

        weatherResponse.forecast.list.forEach((item: any) => {
          const date = new Date(item.dt * 1000).toLocaleDateString("vi-VN");
          if (!forecastByDay[date]) {
            forecastByDay[date] = [];
          }
          forecastByDay[date].push(item);
        });

        // Calculate daily summaries
        const forecast = Object.entries(forecastByDay)
          .slice(0, 3)
          .map(([date, items]: [string, any[]]) => {
            const avgTemp =
              items.reduce((sum, item) => sum + item.main.temp, 0) /
              items.length;
            const avgHumidity =
              items.reduce((sum, item) => sum + item.main.humidity, 0) /
              items.length;
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

      const weatherData = convertWeatherData(weatherResponse);

      // Generate monitoring plan
      const aiResponse = await generateMonitoringPlan(
        diseaseContext,
        weatherData
      );
      console.log(
        "✅ Monitoring plan generated for disease:",
        diseaseContext.diseaseVi,
        "Response preview:",
        aiResponse.substring(0, 150)
      );

      // Parse treatment data
      const parsedTreatment = parseMonitoringPlanResponse(
        aiResponse,
        diseaseContext.diseaseVi,
        diseaseContext.diseaseEn,
        diseaseContext.confidence,
        diseaseContext.sensors
      );

      // ✅ Log parsed treatment to verify it's different for each disease
      console.log("📋 Parsed treatment data:", {
        disease: parsedTreatment.disease.name,
        diseaseEn: parsedTreatment.disease.nameEn,
        hasPesticides: parsedTreatment.pesticides.length > 0,
        pesticideName: parsedTreatment.pesticides[0]?.name || "N/A",
        hasFertilizers: parsedTreatment.fertilizers.length > 0,
        fertilizerName: parsedTreatment.fertilizers[0]?.name || "N/A",
        scheduleCount: parsedTreatment.schedule.length,
        scheduleDates: parsedTreatment.schedule.map((s) => s.date),
      });

      // Check if parsed treatment has actual content before updating
      const hasTreatmentContent =
        (parsedTreatment.pesticides && parsedTreatment.pesticides.length > 0) ||
        (parsedTreatment.fertilizers &&
          parsedTreatment.fertilizers.length > 0) ||
        (parsedTreatment.schedule && parsedTreatment.schedule.length > 0);

      if (!hasTreatmentContent) {
        console.warn(
          "⚠️ Generated treatment data is empty, skipping update to preserve existing display"
        );
        return false;
      }

      // Update photo treatment data only if it has content
      console.log("💾 Saving treatment data to DB:", {
        photoId: targetPhoto._id,
        disease: parsedTreatment.disease.nameEn,
        pesticide: parsedTreatment.pesticides[0]?.name || "N/A",
        fertilizer: parsedTreatment.fertilizers[0]?.name || "N/A",
        scheduleCount: parsedTreatment.schedule.length,
      });

      const updateResult = await updatePhotoTreatment(
        targetPhoto._id,
        parsedTreatment
      );
      if (updateResult.success) {
        console.log(
          "✅ Treatment data updated from background AI call for disease:",
          {
            disease: parsedTreatment.disease.nameEn,
            photoId: targetPhoto._id,
          }
        );

        // Only reload photo if we successfully updated with content
        // This prevents losing existing treatment display
        const updatedPhoto = await getPhotoById(targetPhoto._id);

        // Merge with current photo state to preserve any UI state
        setPhoto((prevPhoto) => {
          if (!prevPhoto) return updatedPhoto;
          // Preserve current photo but update treatment data
          return {
            ...prevPhoto,
            ...updatedPhoto,
            // Ensure treatment data is from updated photo
            treatmentData: (updatedPhoto as any).treatmentData,
          };
        });

        return true;
      } else {
        console.warn("⚠️ Failed to update treatment data:", updateResult.error);
        return false;
      }
    } catch (error: any) {
      console.error(
        "❌ Error generating monitoring plan in background:",
        error
      );
      return false;
    }
  };

  /**
   * Send treatment to IoT device
   * ✅ Same logic as photo-detail.tsx (100% identical)
   */
  const handleSendToIoT = async () => {
    const fieldId =
      (photo as any)?.fieldId || (photo as any)?.iotMetadata?.fieldId;

    if (!photo || !photo._id || !fieldId) {
      console.error("❌ Missing photo ID or field ID", {
        hasPhoto: !!photo,
        photoId: photo?._id,
        fieldId,
      });
      return;
    }

    if (treatmentSent) {
      return; // Already sent
    }

    try {
      setIsSendingToIoT(true);

      // Step 1: Ensure treatment data exists (generate if needed)
      // Always reload from DB first to get latest data (same as photo-detail.tsx)
      const { getPhotoById } = await import("@/services/photo.service");
      let currentPhoto = await getPhotoById(photo._id);
      let hasTreatmentData = !!(currentPhoto as any)?.treatmentData;

      const existingDisease =
        (currentPhoto as any)?.treatmentData?.disease?.nameEn ||
        (currentPhoto as any)?.treatmentData?.disease?.name;
      const currentDisease = currentPhoto.prediction?.class;
      let treatmentMatchesDisease =
        existingDisease && currentDisease
          ? existingDisease === currentDisease
          : false;

      console.log("🔍 Treatment data check before send (result):", {
        photoId: currentPhoto._id,
        hasTreatmentData,
        existingDisease,
        currentDisease,
        treatmentMatchesDisease,
        treatmentDataKeys: hasTreatmentData
          ? Object.keys((currentPhoto as any).treatmentData)
          : null,
        diseaseClass: currentPhoto.prediction?.class,
        source: (currentPhoto as any).source,
      });

      if (!hasTreatmentData) {
        console.log("🔄 Step 1: Generating treatment data (result)...");
        const generated = await generateMonitoringPlanBackground(currentPhoto);
        if (!generated) {
          console.warn("⚠️ Failed to generate treatment data");
          // Reload anyway to check if it was saved
          currentPhoto = await getPhotoById(photo._id);
          hasTreatmentData = !!(currentPhoto as any)?.treatmentData;
          if (!hasTreatmentData) {
            throw new Error(
              "Không thể tạo dữ liệu điều trị. Vui lòng thử lại sau."
            );
          }
        } else {
          // Reload photo to get updated treatment data
          currentPhoto = await getPhotoById(photo._id);
          setPhoto(currentPhoto);
          hasTreatmentData = !!(currentPhoto as any)?.treatmentData;
          treatmentMatchesDisease =
            ((currentPhoto as any)?.treatmentData?.disease?.nameEn ||
              (currentPhoto as any)?.treatmentData?.disease?.name) ===
            currentDisease;
          console.log("✅ Treatment data generated and reloaded (result):", {
            hasTreatmentData,
            treatmentDataKeys: hasTreatmentData
              ? Object.keys((currentPhoto as any).treatmentData)
              : null,
            treatmentMatchesDisease,
          });
        }
      } else if (!treatmentMatchesDisease) {
        console.log(
          `⚠️ Treatment data exists but doesn't match disease (${existingDisease} vs ${currentDisease}), regenerating before send...`
        );
        const regenerated = await generateMonitoringPlanBackground(
          currentPhoto
        );
        currentPhoto = await getPhotoById(photo._id);
        setPhoto(currentPhoto);
        hasTreatmentData = !!(currentPhoto as any)?.treatmentData;
        treatmentMatchesDisease =
          ((currentPhoto as any)?.treatmentData?.disease?.nameEn ||
            (currentPhoto as any)?.treatmentData?.disease?.name) ===
          currentDisease;
        if (!regenerated || !hasTreatmentData || !treatmentMatchesDisease) {
          throw new Error(
            "Không thể cập nhật phác đồ điều trị tương ứng với bệnh hiện tại."
          );
        }
      } else {
        console.log("✅ Treatment data already exists and matches disease");
      }

      // Step 2: Verify treatment data exists and has content before sending
      if (!hasTreatmentData) {
        throw new Error(
          "Không có dữ liệu điều trị. Vui lòng đợi hệ thống tạo phác đồ điều trị."
        );
      }

      // Verify treatment data has actual content
      const treatmentData = (currentPhoto as any).treatmentData;
      const hasContent =
        (treatmentData.pesticides && treatmentData.pesticides.length > 0) ||
        (treatmentData.fertilizers && treatmentData.fertilizers.length > 0) ||
        (treatmentData.schedule && treatmentData.schedule.length > 0);

      if (!hasContent) {
        throw new Error(
          "Dữ liệu điều trị chưa đầy đủ. Vui lòng đợi hệ thống hoàn tất."
        );
      }

      console.log("✅ Treatment data verified (result):", {
        hasPesticides: !!(
          treatmentData.pesticides && treatmentData.pesticides.length > 0
        ),
        hasFertilizers: !!(
          treatmentData.fertilizers && treatmentData.fertilizers.length > 0
        ),
        hasSchedule: !!(
          treatmentData.schedule && treatmentData.schedule.length > 0
        ),
      });

      // Step 3: Send treatment to IoT
      console.log("🔄 Step 2: Sending treatment to IoT (result)...");
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      const response = await apiPost("/iot/treatment/send", {
        photoId: currentPhoto._id,
        fieldId,
      });

      if (response.success) {
        console.log("✅ Treatment sent successfully from result");
        setTreatmentSent(true);
        setShowSuccessModal(true);
      } else {
        const errorMessage =
          typeof response.error === "string"
            ? response.error
            : response.error?.message || "Gửi thất bại";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("❌ Send treatment error:", error);
      alert(
        error.message || "Không thể gửi thông tin điều trị. Vui lòng thử lại."
      );
    } finally {
      setIsSendingToIoT(false);
    }
  };

  const getDiseaseIcon = (diseaseClass: string) => {
    if (diseaseClass === "healthy") {
      return "🎉";
    }
    return "⚠️";
  };

  const getDiseaseColor = (diseaseClass: string) => {
    if (diseaseClass === "healthy") {
      return "#4CAF50";
    }
    return "#FF5722";
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>
          {t("result.loading", { defaultValue: "Đang tải kết quả..." })}
        </Text>
      </View>
    );
  }

  if (error || !photo) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error || "Photo not found"}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.buttonText}>
            {t("common.back", { defaultValue: "Quay lại" })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("result.title", { defaultValue: "Kết quả phân tích" })}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: (() => {
                const baseUrl =
                  imageLoadError && fallbackImageUrl
                    ? fallbackImageUrl
                    : photo.watermarkedUrl || photo.originalUrl;
                // Add timestamp to bypass cache (Firebase doesn't accept custom headers)
                return `${baseUrl}${
                  baseUrl?.includes("?") ? "&" : "?"
                }_t=${Date.now()}`;
              })(),
            }}
            style={styles.image}
            contentFit="cover"
            transition={300}
            onError={(error) => {
              console.log("⚠️ Image failed to load:", error);
              console.log(
                "Current URL:",
                imageLoadError && fallbackImageUrl
                  ? fallbackImageUrl
                  : photo.watermarkedUrl || photo.originalUrl
              );
              console.log("Fallback available:", !!fallbackImageUrl);

              // Try fallback URL if available and not already tried
              if (!imageLoadError && fallbackImageUrl) {
                console.log("🔄 Trying fallback URL from params...");
                setImageLoadError(true);
              }
            }}
            onLoad={() => {
              console.log("✅ Image loaded successfully in result screen");
              setImageLoadError(false);
            }}
          />
          {!photo.watermarkedUrl && (
            <View style={styles.noWatermarkBadge}>
              <Text style={styles.noWatermarkText}>Original</Text>
            </View>
          )}
        </View>

        {/* Result Card */}
        {photo.prediction &&
        photo.prediction.class &&
        photo.prediction.classVi ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>
                {getDiseaseIcon(photo.prediction.class)}
              </Text>
              <Text
                style={[
                  styles.diseaseName,
                  { color: getDiseaseColor(photo.prediction.class) },
                ]}
              >
                {photo.prediction.classVi}
              </Text>
            </View>

            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>
                {t("result.confidence", { defaultValue: "Độ tin cậy" })}:
              </Text>
              <Text style={styles.confidenceValue}>
                {photo.prediction.confidence?.toFixed(1) || "0.0"}%
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${photo.prediction.confidence || 0}%`,
                    backgroundColor: getDiseaseColor(photo.prediction.class),
                  },
                ]}
              />
            </View>

            {/* Location Info */}
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>
                {photo.metadata.lat.toFixed(6)}°N,{" "}
                {photo.metadata.lng.toFixed(6)}°E
              </Text>
            </View>

            {/* Date Info */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.infoText}>
                {new Date(photo.createdAt).toLocaleString("vi-VN")}
              </Text>
            </View>

            {/* IoT Source Badge (if IoT image) */}
            {(photo as any).source === "iot" && (
              <View style={styles.iotBadgeContainer}>
                <Ionicons name="hardware-chip" size={18} color="#2196F3" />
                <Text style={styles.iotBadgeText}>{t("result.iotImage")}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.resultCard}>
            <Text style={styles.noPredictionText}>
              {t("result.noPrediction", {
                defaultValue: "Không có kết quả phân tích",
              })}
            </Text>
          </View>
        )}

        {/* IoT Sensor Data (if IoT image with sensors) */}
        {(photo as any).source === "iot" &&
          (photo as any).iotMetadata?.sensors &&
          (() => {
            const dbSensors = (photo as any).iotMetadata.sensors;
            // ✅ Transform DB field names (temp, soil, wind) to frontend field names (temperature, soilMoisture, windSpeed)
            const frontendSensors = {
              temperature: dbSensors.temp,
              humidity: dbSensors.humidity,
              ph: dbSensors.ph,
              soilMoisture: dbSensors.soil,
              lux: dbSensors.lux,
              windSpeed: dbSensors.wind,
            };

            return (
              <View style={styles.sensorCard}>
                <View style={styles.sensorHeader}>
                  <Ionicons name="analytics" size={24} color="#4CAF50" />
                  <Text style={styles.sensorTitle}>
                    {t("result.sensorData")}
                  </Text>
                </View>
                <SensorBadges sensors={frontendSensors} compact={false} />
              </View>
            );
          })()}

        {/* Treatment Info (AI-generated for all diseased photos) */}
        {photo.prediction?.class && photo.prediction.class !== "healthy" && (
          <View style={styles.treatmentCard}>
            <View style={styles.treatmentHeader}>
              <Ionicons name="medical" size={24} color="#4CAF50" />
              <Text style={styles.treatmentTitle}>
                {t("result.treatmentGuide")}
              </Text>
            </View>

            <View style={styles.treatmentContent}>
              {isLoadingPlan ? (
                <>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text
                    style={[
                      styles.treatmentText,
                      { marginTop: 12, textAlign: "center", color: "#666" },
                    ]}
                  >
                    {t("photoDetail.loadingPlan", {
                      defaultValue: "Đang tạo kế hoạch giám sát...",
                    })}
                  </Text>
                </>
              ) : (
                <FormattedAIText
                  text={
                    monitoringPlan ||
                    t("photoDetail.loadingPlan", {
                      defaultValue:
                        "Không thể tải kế hoạch giám sát. Vui lòng thử lại.",
                    })
                  }
                />
              )}
            </View>

            <View style={styles.treatmentNote}>
              <Ionicons name="information-circle" size={20} color="#2196F3" />
              <Text style={styles.treatmentNoteText}>
                {t("result.treatmentNote")}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.mapButton]}
            onPress={() => router.push("/(tabs)/mapFarm")}
          >
            <Ionicons name="map" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>
              {t("result.viewOnMap", { defaultValue: "Xem trên bản đồ" })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.recaptureButton]}
            onPress={handleRecapture}
          >
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>
              {t("result.recapture", { defaultValue: "Chụp lại" })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Details Button (if disease detected) */}
        {photo.prediction &&
          photo.prediction.class &&
          photo.prediction.class !== "healthy" && (
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => router.push(`/photo-detail?id=${photo._id}`)}
            >
              <Text style={styles.detailsButtonText}>
                {t("result.viewDetails", {
                  defaultValue: "Xem chi tiết về bệnh và cách điều trị",
                })}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#4CAF50" />
            </TouchableOpacity>
          )}

        {/* Send Treatment to IoT Button - Simple: Show if source === 'iot', hide otherwise */}
        {(() => {
          // ✅ Simple logic: if photo is from IoT device, show button
          const photoSource = params.source || (photo as any).source;
          const isFromIoT = photoSource === "iot";
          const fieldId =
            (photo as any).fieldId || (photo as any).iotMetadata?.fieldId;
          const hasPrediction = !!photo.prediction;
          const notHealthy = photo.prediction?.class !== "healthy";

          console.log("🔘 Result screen - Send to IoT button check:", {
            photoSource,
            isFromIoT,
            fieldId,
            hasPrediction,
            diseaseClass: photo.prediction?.class,
            notHealthy,
            shouldShow: isFromIoT && hasPrediction && notHealthy && !!fieldId,
          });

          // Show button if: IoT image + has disease + has fieldId
          return (
            isFromIoT &&
            hasPrediction &&
            notHealthy &&
            !!fieldId && (
              <TouchableOpacity
                style={[
                  styles.sendToIoTButtonMain,
                  (isSendingToIoT || treatmentSent) &&
                    styles.sendToIoTButtonDisabled,
                ]}
                onPress={handleSendToIoT}
                disabled={isSendingToIoT || treatmentSent}
              >
                {isSendingToIoT ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.sendToIoTButtonMainText}>
                      {treatmentSent
                        ? t("result.sentToIoT")
                        : t("result.sendToIoT")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )
          );
        })()}

        {/* Chat with Doctor Rice Button */}
        {photo.prediction && photo.prediction.class && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => setIsChatbotVisible(true)}
          >
            <Image
              source={require("../src/assets/images/text-logo.png")}
              style={styles.chatButtonIcon}
              resizeMode="contain"
            />
            <Text style={styles.chatButtonText}>
              {t("result.chatWithDoctor", {
                defaultValue: "Chat với Bác sĩ Lúa",
              })}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Treatment Send Modal */}
      {(photo as any).treatmentData && (
        <Modal
          visible={showTreatmentModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowTreatmentModal(false)}
        >
          <TreatmentSendModal
            photoId={photo._id}
            treatmentData={(photo as any).treatmentData}
            onSuccess={() => {
              setShowTreatmentModal(false);
            }}
            onCancel={() => setShowTreatmentModal(false)}
          />
        </Modal>
      )}

      {/* Chatbot Modal */}
      {photo.prediction &&
        (() => {
          // ✅ Get sensors from iotMetadata (not metadata)
          const iotMetadata = (photo as any).iotMetadata;
          const rawSensors = iotMetadata?.sensors;

          // Transform sensor field names from DB schema (temp, soil, wind) to frontend (temperature, soilMoisture, windSpeed)
          const sensors = rawSensors
            ? {
                temperature: rawSensors.temp,
                humidity: rawSensors.humidity,
                ph: rawSensors.ph,
                soilMoisture: rawSensors.soil,
                lux: rawSensors.lux,
                windSpeed: rawSensors.wind,
              }
            : undefined;

          console.log("📊 Passing sensors to ChatbotModal:", {
            hasIotMetadata: !!iotMetadata,
            hasRawSensors: !!rawSensors,
            rawSensors,
            transformedSensors: sensors,
          });

          return (
            <ChatbotModal
              visible={isChatbotVisible}
              onClose={() => setIsChatbotVisible(false)}
              diseaseContext={{
                diseaseClass: photo.prediction.class,
                diseaseVi: photo.prediction.classVi,
                diseaseEn: photo.prediction.class, // Added for healthy check
                confidence: photo.prediction.confidence,
                location: {
                  lat: photo.metadata.lat,
                  lng: photo.metadata.lng,
                },
                timestamp: new Date(photo.createdAt).getTime(),
                sensors: sensors, // Include sensor data for IoT images
              }}
              initialImage={(() => {
                // Get image URL and ensure it has correct Firebase Storage encoding (%2F not /)
                let imageUrl =
                  fallbackImageUrl || photo.watermarkedUrl || photo.originalUrl;

                // If URL has / instead of %2F in the path (after /o/), fix it
                if (
                  imageUrl &&
                  imageUrl.includes("firebasestorage.googleapis.com/v0/b/") &&
                  !imageUrl.match(/\/o\/[^?]*%2F/)
                ) {
                  console.log("⚠️ Image URL missing %2F encoding, fixing...");
                  // Re-encode the path part (between /o/ and ?)
                  const urlParts = imageUrl.split("/o/");
                  if (urlParts.length === 2) {
                    const pathAndQuery = urlParts[1].split("?");
                    const path = pathAndQuery[0];
                    const query = pathAndQuery[1] || "";
                    const encodedPath = path
                      .split("/")
                      .map(encodeURIComponent)
                      .join("%2F");
                    imageUrl = `${urlParts[0]}/o/${encodedPath}${
                      query ? "?" + query : ""
                    }`;
                    console.log(
                      "✅ Fixed URL:",
                      imageUrl.substring(0, 80) + "..."
                    );
                  }
                }

                console.log("📤 Passing image to ChatbotModal:", {
                  hasUrl: !!imageUrl,
                  urlPreview: imageUrl?.substring(0, 80) + "...",
                  hasCorrectEncoding: imageUrl?.includes("%2F"),
                });

                return imageUrl;
              })()} // ✅ Use fallback with correct encoding
              photoId={photo._id} // For sending treatment to IoT
              fieldId={(photo as any).fieldId} // Field ID from IoT connection
              source={params.source || (photo as any).source} // ✅ 'iot' or 'upload' from top-level
            />
          );
        })()}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.successModalTitle}>Thành công!</Text>
            <Text style={styles.successModalMessage}>
              {t("result.treatmentSentSuccess")}
            </Text>
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successModalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Field Selection Modal (for recapture with IoT fields) */}
      <Modal
        visible={showFieldSelection}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFieldSelection(false)}
      >
        <FieldSelectionModal
          onFieldSelected={handleFieldSelected}
          onCancel={() => setShowFieldSelection(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: "#E0E0E0",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  noWatermarkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  noWatermarkText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  resultCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  resultIcon: {
    fontSize: 40,
  },
  diseaseName: {
    flex: 1,
    fontSize: 22,
    fontWeight: "bold",
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 16,
    color: "#666",
  },
  confidenceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  noPredictionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  mapButton: {
    backgroundColor: "#4CAF50",
  },
  recaptureButton: {
    backgroundColor: "#2196F3",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
    gap: 8,
  },
  detailsButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4CAF50",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButtonIcon: {
    width: 28,
    height: 28,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  sendToIoTButtonMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#FF9800",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendToIoTButtonDisabled: {
    backgroundColor: "#BDBDBD",
  },
  sendToIoTButtonMainText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: width * 0.85,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  successModalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  successModalButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 120,
  },
  successModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  iotBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  iotBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2196F3",
  },
  sensorCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sensorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sensorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  treatmentCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  treatmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  treatmentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  treatmentContent: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  treatmentText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#333",
  },
  treatmentNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
  },
  treatmentNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: "#1976d2",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
