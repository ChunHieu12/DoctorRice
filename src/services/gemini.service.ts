/**
 * Gemini AI Service
 * Google Gemini 2.5 Flash Lite integration for rice disease consultation
 */
import axios from 'axios';
import Constants from 'expo-constants';
import { WeatherData } from './weather.service';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey || 'AIzaSyDbmXck740HiiKfPavBI4WFjB1p0MfCbXs';
const GEMINI_API_URL = Constants.expoConfig?.extra?.geminiApiUrl || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export interface DiseaseContext {
  diseaseClass: string;
  diseaseVi: string;
  confidence: number;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Generate AI response using Gemini
 */
export const generateAIResponse = async (
  userMessage: string,
  diseaseContext?: DiseaseContext,
  weatherData?: WeatherData,
  chatHistory: ChatMessage[] = []
): Promise<string> => {
  try {
    console.log('🤖 Generating AI response...');

    // Build conversation history for context
    const conversationHistory = chatHistory.slice(-10).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(diseaseContext, weatherData);

    // Add system prompt as first message
    const messages = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'Tôi hiểu rõ. Tôi là Bác sĩ Lúa, chuyên gia tư vấn về bệnh lúa và canh tác. Tôi sẽ giúp anh/chị.' }],
      },
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const aiText = response.data.candidates[0]?.content?.parts[0]?.text;
    
    if (!aiText) {
      throw new Error('No response from AI');
    }

    console.log('✅ AI response generated');
    return aiText;

  } catch (error: any) {
    console.error('❌ Gemini API error:', error.response?.data || error.message);
    throw new Error('Xin lỗi, tôi gặp lỗi khi xử lý. Vui lòng thử lại.');
  }
};

/**
 * Build system prompt with disease and weather context
 */
const buildSystemPrompt = (
  diseaseContext?: DiseaseContext,
  weatherData?: WeatherData
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
    prompt += `\n\n📸 THÔNG TIN BỆNH PHÁT HIỆN:
- Loại bệnh: ${diseaseContext.diseaseVi} (${diseaseContext.diseaseClass})
- Độ tin cậy: ${diseaseContext.confidence.toFixed(1)}%
- Vị trí: ${diseaseContext.location.lat.toFixed(4)}°N, ${diseaseContext.location.lng.toFixed(4)}°E
- Thời gian: ${new Date(diseaseContext.timestamp).toLocaleString('vi-VN')}
`;
  }

  // Add weather context if available
  if (weatherData) {
    prompt += `\n\n🌤️ DỮ LIỆU THỜI TIẾT (3 NGÀY):
- Hiện tại: ${weatherData.current.temp}°C, Độ ẩm ${weatherData.current.humidity}%
- Dự báo:
`;
    weatherData.forecast.forEach((day, idx) => {
      prompt += `  + Ngày ${idx + 1} (${day.date}): ${day.temp}°C, Độ ẩm ${day.humidity}%, Mưa ${day.rain}mm\n`;
    });
  }

  prompt += `\n\n💬 QUY TẮC TRẢ LỜI:
- Thân thiện, dễ hiểu, ngắn gọn
- Dùng emoji cho sinh động
- QUAN TRỌNG: Không sử dụng dấu * hoặc ** để format text (sẽ được format riêng)
- Sử dụng cấu trúc rõ ràng: Tiêu đề chính, sau đó nội dung chi tiết
- Mỗi phần riêng biệt cách nhau bởi dòng trống
- Danh sách sử dụng số thứ tự (1., 2., 3.) hoặc emoji thay vì dấu -
- Nếu được hỏi về "Kế hoạch giám sát tự động", phân tích chi tiết dựa trên thời tiết và đưa ra lịch trình phun thuốc cụ thể

Hãy trả lời bằng Tiếng Việt với format sạch đẹp, KHÔNG dùng * hay **.`;

  return prompt;
};

/**
 * Generate "Automatic Monitoring Plan" response
 */
export const generateMonitoringPlan = async (
  diseaseContext: DiseaseContext,
  weatherData: WeatherData
): Promise<string> => {
  const prompt = `Tôi cần một KẾ HOẠCH GIÁM SÁT TỰ ĐỘNG chi tiết cho bệnh "${diseaseContext.diseaseVi}".

Hãy phân tích và trả lời theo cấu trúc sau:

📊 ĐÁNH GIÁ RỦI RO
- Dựa trên thời tiết 3 ngày tới (nhiệt độ, độ ẩm, lượng mưa)
- Kết luận: Bệnh sẽ MẠNH / GIẢM / LÂY LAN

⚠️ KẾ HOẠCH HÀNH ĐỘNG
1. Ngày 1 (hôm nay ${new Date().toLocaleDateString('vi-VN')}):
   - Giờ: [cụ thể]
   - Hành động: [làm gì]
   - Loại thuốc: [tên thuốc + liều lượng]

2. Ngày 2:
   - [tương tự]

3. Ngày 3:
   - [tương tự]

📝 THEO DÕI SAU ĐIỀU TRỊ
- Kiểm tra sau [bao lâu]
- Dấu hiệu cần lưu ý
- Khi nào cần phun lại

Hãy trả lời chi tiết, cụ thể về giờ và loại thuốc.`;

  return generateAIResponse(prompt, diseaseContext, weatherData);
};

