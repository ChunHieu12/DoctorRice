/**
 * Gemini AI Service
 * Google Gemini 2.5 Flash Lite integration for rice disease consultation
 */
import axios from "axios";
import Constants from "expo-constants";

const DEFAULT_GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiConfigError";
  }
}

const resolveGeminiConfig = () => {
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    (Constants.expoConfig?.extra?.geminiApiKey as string) ||
    "";
  const apiUrl =
    process.env.EXPO_PUBLIC_GEMINI_API_URL ||
    (Constants.expoConfig?.extra?.geminiApiUrl as string) ||
    DEFAULT_GEMINI_API_URL;

  if (!apiKey) {
    throw new GeminiConfigError(
      "Gemini API key is missing. Please set EXPO_PUBLIC_GEMINI_API_KEY."
    );
  }

  return { apiKey, apiUrl };
};

// Processed weather data for AI context
export interface ProcessedWeatherData {
  current: {
    temp: number;
    humidity: number;
    description: string;
  };
  forecast: {
    date: string;
    temp: number;
    humidity: number;
    rain: number;
    description: string;
  }[];
}

export interface DiseaseContext {
  diseaseClass: string;
  diseaseVi: string;
  diseaseEn?: string; // English disease name (for healthy check)
  confidence: number;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: number;
  sensors?: {
    temperature?: number;
    humidity?: number;
    ph?: number;
    soilMoisture?: number;
    lux?: number;
    windSpeed?: number;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  imageUrl?: string; // Optional image attachment
}

/**
 * Generate AI response using Gemini
 */
export const generateAIResponse = async (
  userMessage: string,
  diseaseContext?: DiseaseContext | string,
  weatherData?: ProcessedWeatherData,
  chatHistory: ChatMessage[] = []
): Promise<string> => {
  let geminiConfig: { apiKey: string; apiUrl: string };

  try {
    geminiConfig = resolveGeminiConfig();
  } catch (error) {
    if (error instanceof GeminiConfigError) {
      console.error("❌ Gemini configuration error:", error.message);
      throw new Error(
        "Ứng dụng thiếu cấu hình Gemini AI. Vui lòng cập nhật EXPO_PUBLIC_GEMINI_API_KEY."
      );
    }

    throw error;
  }

  try {
    console.log("🤖 Generating AI response...");

    // Build conversation history for context
    const conversationHistory = chatHistory.slice(-10).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(diseaseContext, weatherData);

    // Add system prompt as first message
    const messages = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Tôi hiểu rõ. Tôi là Bác sĩ Lúa, chuyên gia tư vấn về bệnh lúa và canh tác. Tôi sẽ giúp anh/chị.",
          },
        ],
      },
      ...conversationHistory,
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    const response = await axios.post(
      `${geminiConfig.apiUrl}?key=${geminiConfig.apiKey}`,
      {
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024, // Reduced from 2048 to encourage shorter responses
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const aiText = response.data.candidates[0]?.content?.parts[0]?.text;

    if (!aiText) {
      throw new Error("No response from AI");
    }

    console.log("✅ AI response generated");
    return aiText;
  } catch (error: any) {
    const errorPayload = error.response?.data;
    const geminiMessage: string | undefined = errorPayload?.error?.message;
    const status: number | undefined = error.response?.status;

    console.error("❌ Gemini API error:", errorPayload || error.message);

    if (
      status === 403 &&
      geminiMessage?.toLowerCase().includes("reported as leaked")
    ) {
      throw new Error(
        "Khóa Gemini đã bị Google thu hồi vì lộ thông tin. Vui lòng tạo API key mới, cập nhật EXPO_PUBLIC_GEMINI_API_KEY và build lại ứng dụng."
      );
    }

    if (status === 403) {
      throw new Error(
        "Gemini từ chối yêu cầu. Kiểm tra quyền truy cập API key hoặc hạn mức sử dụng."
      );
    }

    throw new Error("Xin lỗi, tôi gặp lỗi khi xử lý. Vui lòng thử lại.");
  }
};

/**
 * Build system prompt with disease and weather context
 */
const buildSystemPrompt = (
  diseaseContext?: DiseaseContext | string,
  weatherData?: ProcessedWeatherData
): string => {
  let prompt = `Bạn là "Bác sĩ Lúa" - chuyên gia tư vấn về bệnh lúa và canh tác nông nghiệp.

🌾 NHIỆM VỤ:
- Tư vấn về 3 loại bệnh chính của lúa: Bệnh bạc lá vi khuẩn, Bệnh đạo ôn, Bệnh đốm nâu
- Phân tích nguyên nhân, triệu chứng, cách phòng ngừa và điều trị
- Đánh giá rủi ro dựa trên thời tiết (mưa, độ ẩm)
- Tư vấn lịch phun thuốc chi tiết (thời điểm, giờ, loại thuốc)
- Trả lời các câu hỏi chung về nông nghiệp

📋 KIẾN THỨC VỀ BỆNH LÚA:

1️⃣ BỆNH BẠC LÁ VI KHUẨN (Bacterial Leaf Blight)
- Nguyên nhân: Vi khuẩn Xanthomonas oryzae
- Triệu chứng: Lá vàng từ mép, lan theo gân lá, khô như bị cháy
- Điều kiện phát triển: Độ ẩm cao (>80%), nhiệt độ 25-30°C, mưa nhiều
- Cách điều trị:
  + Phun thuốc kháng sinh: Streptomycin, Oxolinic acid
  + Thời điểm: Sáng sớm (5-7h) hoặc chiều mát (16-18h)
  + Tần suất: 7-10 ngày/lần
  + Loại bỏ lá bệnh, tăng cường phân kali

2️⃣ BỆNH ĐẠO ÔN (Blast Disease)
- Nguyên nhân: Nấm Magnaporthe oryzae
- Triệu chứng: Đốm hình mắt cá, viền nâu, giữa xám trắng
- Điều kiện phát triển: Sương sớm, mưa phùn, độ ẩm cao, nhiệt độ 20-28°C
- Cách điều trị:
  + Thuốc fungicide: Tricyclazole, Azoxystrobin
  + Thời điểm: Trước khi mưa, hoặc sau mưa 2-3 ngày
  + Tần suất: 7-10 ngày/lần
  + Bón phân cân đối NPK

3️⃣ BỆNH ĐỐM NÂU (Brown Spot)
- Nguyên nhân: Nấm Bipolaris oryzae
- Triệu chứng: Đốm tròn màu nâu, giữa xám, lan khắp lá
- Điều kiện phát triển: Thiếu dinh dưỡng, đất chua, mưa kéo dài
- Cách điều trị:
  + Thuốc: Mancozeb, Propineb
  + Thời điểm: Giai đoạn đẻ nhánh và trỗ bông
  + Tần suất: 10-14 ngày/lần
  + Bổ sung phân hữu cơ, canxi

🌦️ ĐÁNH GIÁ RỦI RO THEO THỜI TIẾT:
- Lượng mưa > 50mm/3 ngày: Nguy cơ bệnh CAO
- Độ ẩm > 85%: Bệnh lây lan NHANH
- Độ ẩm 70-85%: Bệnh phát triển TRUNG BÌNH
- Độ ẩm < 70%: Bệnh GIẢM
`;

  // Add disease context if available
  if (diseaseContext) {
    if (typeof diseaseContext === "string") {
      // If diseaseContext is already a string (from weather detail screen)
      prompt += `\n\n${diseaseContext}`;
    } else {
      // If diseaseContext is an object (from disease detail screen)
      prompt += `\n\n📸 THÔNG TIN BỆNH PHÁT HIỆN:
- Loại bệnh: ${diseaseContext.diseaseVi} (${diseaseContext.diseaseClass})
- Độ tin cậy: ${diseaseContext.confidence.toFixed(1)}%
- Vị trí: ${diseaseContext.location.lat.toFixed(
        4
      )}°N, ${diseaseContext.location.lng.toFixed(4)}°E
- Thời gian: ${new Date(diseaseContext.timestamp).toLocaleString("vi-VN")}
`;
    }
  }

  // Add weather context if available
  if (
    weatherData &&
    weatherData.current &&
    weatherData.forecast &&
    Array.isArray(weatherData.forecast)
  ) {
    prompt += `\n\n🌤️ DỮ LIỆU THỜI TIẾT (3 NGÀY):
- Hiện tại: ${weatherData.current.temp}°C, Độ ẩm ${weatherData.current.humidity}%
- Dự báo:
`;
    weatherData.forecast.forEach(
      (day: ProcessedWeatherData["forecast"][0], idx: number) => {
        prompt += `  + Ngày ${idx + 1} (${day.date}): ${day.temp}°C, Độ ẩm ${
          day.humidity
        }%, Mưa ${day.rain}mm\n`;
      }
    );
  }

  prompt += `\n\n💬 QUY TẮC TRẢ LỜI:
- ⚡ NGẮN GỌN: Tối đa 150-200 từ, trừ khi được yêu cầu chi tiết
- 🎯 TRỌNG TÂM: Đi thẳng vào vấn đề chính, không lan man
- 📝 CẤU TRÚC: Dùng bullet points (•) cho các điểm chính
- 😊 THÂN THIỆN: Dùng emoji phù hợp nhưng không quá nhiều
- 🚫 FORMAT: KHÔNG sử dụng dấu * hoặc ** (sẽ được format riêng)
- 📋 DANH SÁCH: Dùng số (1., 2., 3.) hoặc emoji (•) thay vì dấu -
- ✅ ƯU TIÊN: Thông tin quan trọng nhất lên đầu
- 🌦️ KẾ HOẠCH GIÁM SÁT: Chỉ chi tiết khi được yêu cầu cụ thể

Hãy trả lời NGẮN GỌN, RÕ RÀNG bằng Tiếng Việt, KHÔNG dùng * hay **.`;

  return prompt;
};

/**
 * Generate "Automatic Monitoring Plan" response
 */
export const generateMonitoringPlan = async (
  diseaseContext: DiseaseContext,
  weatherData: ProcessedWeatherData
): Promise<string> => {
  // Extract sensor data if available
  console.log("🔍 generateMonitoringPlan - Received diseaseContext:", {
    diseaseVi: diseaseContext.diseaseVi,
    hasSensors: !!diseaseContext.sensors,
    sensors: diseaseContext.sensors,
  });

  const sensors = diseaseContext.sensors || {};
  const temp = sensors.temperature || 0;
  const humidity = sensors.humidity || 0;
  const soil = sensors.soilMoisture || 0;
  const wind = sensors.windSpeed || 0;
  const ph = sensors.ph || 0;
  const lux = sensors.lux || 0;

  // Check if ALL sensors are zero (skip only if ALL = 0)
  const allSensorsZero =
    temp === 0 &&
    humidity === 0 &&
    soil === 0 &&
    wind === 0 &&
    ph === 0 &&
    lux === 0;
  const hasSensorData = !allSensorsZero;

  console.log("📊 Extracted sensor values for AI prompt:", {
    temp,
    humidity,
    soil,
    wind,
    ph,
    lux,
    allSensorsZero,
    hasSensorData,
  });

  // Format weather summary
  const weatherSummary = weatherData.forecast
    .map(
      (day, i) =>
        `Ngày ${i + 1}: ${day.temp}°C, độ ẩm ${day.humidity}%, mưa ${
          day.rain
        }mm (${day.description})`
    )
    .join("\n");

  // Build prompt with or without sensor data
  let environmentalConditions = "";

  if (hasSensorData) {
    // Include sensor data in analysis
    environmentalConditions = `
📊 ĐIỀU KIỆN MÔI TRƯỜNG HIỆN TẠI (từ cảm biến IoT):
• Nhiệt độ: ${temp}°C
• Độ ẩm không khí: ${humidity}%
• Độ ẩm đất: ${soil}%
• Độ PH đất: ${ph}
• Ánh sáng: ${lux} lux
• Tốc độ gió: ${wind} m/s`;
  } else {
    // No sensor data - rely on weather forecast only
    environmentalConditions = `
📊 ĐIỀU KIỆN MÔI TRƯỜNG:
Dựa vào dự báo thời tiết 3 ngày (không có dữ liệu cảm biến IoT)`;
  }

  const prompt = `Phân tích bệnh "${
    diseaseContext.diseaseVi
  }" với điều kiện môi trường:
${environmentalConditions}

🌤️ THỜI TIẾT 3 NGÀY TỚI:
${weatherSummary}

Trả lời theo cấu trúc:

📋 THUỐC TRỊ BỆNH:
- Tên: [tên + hoạt chất]
- Liều lượng: [X g/L]
- Cách dùng: [ngắn gọn]

🌾 PHÂN BÓN PHỤC HỒI:
- Tên: [loại phân]
- Liều lượng: [X kg/sào]
- Cách dùng: [ngắn gọn]

📅 KẾ HOẠCH:
• Ngày 1 (${new Date().toLocaleDateString("vi-VN")}): Phun thuốc lần 1
• Ngày 7-10: Phun lại nếu cần
• Ngày 14: Bón phân
• Ngày 21: Kiểm tra

⚠️ KẾT LUẬN:
${
  hasSensorData
    ? `Phân tích tất cả 6 chỉ số môi trường (nhiệt độ ${temp}°C, độ ẩm không khí ${humidity}%, độ ẩm đất ${soil}%, pH ${ph}, ánh sáng ${lux} lux, gió ${wind} m/s) + thời tiết 3 ngày → Bệnh sẽ [MẠNH/GIẢM/LÂY LAN] vì [lý do dựa trên CÁC CHỈ SỐ TRÊN].`
    : `Dựa vào dự báo thời tiết 3 ngày → Bệnh sẽ [MẠNH/GIẢM/LÂY LAN] vì [lý do dựa trên thời tiết].`
}

Trả lời NGẮN GỌN, tối đa 200 từ.`;

  return generateAIResponse(prompt, diseaseContext, weatherData);
};

/**
 * Generate disease information (symptoms, causes, prevention) from AI
 */
export const generateDiseaseInfo = async (
  diseaseContext: DiseaseContext,
  weatherData?: ProcessedWeatherData
): Promise<string> => {
  const prompt = `Hãy cung cấp thông tin chi tiết về bệnh "${
    diseaseContext.diseaseVi
  }" (${
    diseaseContext.diseaseClass
  }) với độ tin cậy ${diseaseContext.confidence.toFixed(1)}%.

Yêu cầu:
1. Nguyên nhân gây bệnh
2. Triệu chứng nhận biết
3. Điều kiện phát triển (nhiệt độ, độ ẩm, mưa)
4. Mức độ nguy hiểm
5. Cách phòng ngừa

${
  weatherData
    ? `\n🌤️ THỜI TIẾT HIỆN TẠI:
- Nhiệt độ: ${weatherData.current.temp}°C
- Độ ẩm: ${weatherData.current.humidity}%
- Mô tả: ${weatherData.current.description}

📅 DỰ BÁO 3 NGÀY:
${weatherData.forecast
  .map(
    (day, i) =>
      `Ngày ${i + 1} (${day.date}): ${day.temp}°C, độ ẩm ${
        day.humidity
      }%, mưa ${day.rain}mm`
  )
  .join("\n")}`
    : ""
}

Trả lời NGẮN GỌN, tối đa 150 từ, dùng bullet points (•), KHÔNG dùng * hay **.`;

  return generateAIResponse(prompt, diseaseContext, weatherData);
};
