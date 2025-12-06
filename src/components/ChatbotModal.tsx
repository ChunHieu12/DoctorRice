/**
 * ChatbotModal - AI Chat Assistant "Bác sĩ Lúa"
 * Features: Typing effect, suggestions, 24h history, auto-monitoring plan
 */
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { apiPost, getAccessToken } from "../services/api";
import {
  addMessageToConversation,
  createNewConversation,
  getConversationById,
  getCurrentConversation,
} from "../services/chat-history.service";
import {
  ChatMessage,
  DiseaseContext,
  generateAIResponse,
  generateMonitoringPlan,
  ProcessedWeatherData,
} from "../services/gemini.service";
import { getWeatherForecast } from "../services/weather.service";
import FormattedAIText from "./FormattedAIText";

const { width } = Dimensions.get("window");

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
  diseaseContext?: DiseaseContext;
  weatherContext?: string;
  prefillQuestion?: string;
  initialConversationId?: string | null;
  initialImage?: string; // Image URL to display in chat
  photoId?: string; // Photo ID for sending treatment to IoT
  fieldId?: string; // Field ID for sending treatment to IoT
  source?: string; // Source: 'iot' | 'camera'
}

export default function ChatbotModal({
  visible,
  onClose,
  diseaseContext,
  weatherContext,
  prefillQuestion,
  initialConversationId,
  initialImage,
  photoId,
  fieldId,
  source,
}: ChatbotModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userId = user?.id || null;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [weatherData, setWeatherData] = useState<ProcessedWeatherData | null>(
    null
  );
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestionsPosition, setSuggestionsPosition] = useState<
    "bottom" | "top"
  >("bottom");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showSendToIoTButton, setShowSendToIoTButton] = useState(false);
  const [isSendingToIoT, setIsSendingToIoT] = useState(false);
  const [treatmentSent, setTreatmentSent] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Suggestions
  const getSuggestions = () => {
    const defaultDiseaseLabel = t("chatbot.suggestions.defaultDiseaseLabel");
    const diseaseName = diseaseContext?.diseaseVi || defaultDiseaseLabel;
    const noDiseaseContext = !diseaseContext;
    const isHealthy =
      noDiseaseContext ||
      diseaseContext?.diseaseEn === "healthy" ||
      diseaseContext?.diseaseClass === "healthy";

    // Different suggestions for healthy vs diseased plants
    if (isHealthy) {
      return [
        t("chatbot.suggestions.monitoringPlan"),
        t("chatbot.suggestions.keepHealthy"),
        t("chatbot.suggestions.preventDisease"),
        t("chatbot.suggestions.whatNext"),
        t("chatbot.suggestions.bestCare"),
      ];
    }

    return [
      t("chatbot.suggestions.monitoringPlan"),
      t("chatbot.suggestions.diseaseDanger", { disease: diseaseName }),
      t("chatbot.suggestions.preventSpecific", { disease: diseaseName }),
      t("chatbot.suggestions.whatNext"),
      t("chatbot.suggestions.diseaseCause", { disease: diseaseName }),
    ];
  };

  const suggestions = getSuggestions();

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Load chat history and weather on mount
  useEffect(() => {
    if (visible) {
      console.log("🤖 ChatbotModal opened with props:");
      console.log("  initialImage:", initialImage?.substring(0, 60) + "...");
      console.log("  Has image URL:", !!initialImage);
      console.log("  photoId:", photoId);
      console.log("  fieldId:", fieldId);
      console.log("  source:", source);
      console.log("  diseaseContext.sensors:", diseaseContext?.sensors);
      loadChatHistory();
      loadWeatherData();
      // Set prefill question if provided
      if (prefillQuestion) {
        setInputText(prefillQuestion);
      }
    } else {
      // Dismiss keyboard when closing modal
      Keyboard.dismiss();
      setKeyboardHeight(0);
      // Clear input when closing
      setInputText("");
      // Reset button state when closing
      setShowSendToIoTButton(false);
      setTreatmentSent(false);
      // NOTE: We don't reset conversationId here to maintain conversation between modal opens
    }
  }, [visible, prefillQuestion, initialImage, userId]); // Add userId to reload when user changes

  const loadChatHistory = async () => {
    try {
      console.log(
        "📚 Loading chat history... Current conversationId:",
        conversationId
      );

      // If initialConversationId is provided, load that specific conversation
      if (initialConversationId) {
        console.log("🔄 Loading specific conversation:", initialConversationId);
        const conversation = await getConversationById(
          initialConversationId,
          userId
        );
        if (conversation) {
          setConversationId(conversation.id);
          setMessages(conversation.messages);
          return;
        }
      }

      // Otherwise, load current/last conversation or create new one
      const conversation = await getCurrentConversation(userId);
      console.log("📖 Current conversation:", conversation?.id || "none");

      if (!conversation || conversation.messages.length === 0) {
        const messagesToSet: ChatMessage[] = [];

        // If initialImage provided, add it as first message
        if (initialImage) {
          messagesToSet.push({
            role: "user",
            content: "Đây là ảnh lá lúa của tôi. Vui lòng giúp tôi phân tích.",
            imageUrl: initialImage,
            timestamp: Date.now(),
          });
        }

        // Add welcome message
        const welcomeMessage: ChatMessage = {
          role: "assistant",
          content: initialImage
            ? t("chatbot.welcomeWithImage")
            : t("chatbot.welcomeMessage"),
          timestamp: Date.now(),
        };
        messagesToSet.push(welcomeMessage);

        console.log("🆕 Creating new conversation...");
        const newConv = await createNewConversation(
          t("chatbot.newConversation"),
          userId
        );
        setConversationId(newConv.id);
        setMessages(messagesToSet);
        console.log("✅ New conversation created:", newConv.id);

        // Save messages to conversation
        for (const msg of messagesToSet) {
          await addMessageToConversation(newConv.id, msg, userId);
        }
      } else {
        // Load existing conversation
        console.log("♻️  Reusing existing conversation:", conversation.id);
        setConversationId(conversation.id);
        setMessages(conversation.messages);

        // If initialImage provided, check if it needs to be added
        if (initialImage) {
          // Check if this exact image is already in the last few messages
          const recentMessages = conversation.messages.slice(-3); // Check last 3 messages
          const imageExists = recentMessages.some(
            (msg) => msg.imageUrl === initialImage
          );

          if (!imageExists) {
            console.log(
              "📸 Adding new image to existing conversation:",
              initialImage?.substring(0, 60) + "..."
            );
            const imageMessage: ChatMessage = {
              role: "user",
              content: t("chatbot.newImageMessage"),
              imageUrl: initialImage,
              timestamp: Date.now(),
            };

            // Add to local state
            setMessages((prev) => [...prev, imageMessage]);

            // Save to conversation
            await addMessageToConversation(
              conversation.id,
              imageMessage,
              userId
            );
            console.log("💾 Image added to conversation:", conversation.id);

            // Auto-scroll to new image
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          } else {
            console.log("ℹ️  Image already in recent messages, skipping");
          }
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  // Convert weather data to ProcessedWeatherData format
  const convertWeatherData = (weatherResponse: any): ProcessedWeatherData => {
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

  const loadWeatherData = async () => {
    if (!diseaseContext) return;

    try {
      const weatherResponse = await getWeatherForecast(
        diseaseContext.location.lat,
        diseaseContext.location.lng
      );

      const processedData = convertWeatherData(weatherResponse);
      setWeatherData(processedData);
      console.log("☁️ Weather data loaded for chatbot");
    } catch (error) {
      console.warn("⚠️ Failed to load weather data:", error);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();

    if (!messageText) return;

    // Check if this is a monitoring plan request
    const isMonitoringRequest = messageText.includes(
      t("chatbot.suggestions.monitoringPlan")
    );

    // Move suggestions to top after first message
    if (suggestionsPosition === "bottom") {
      setSuggestionsPosition("top");
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Ensure conversation exists before saving
    let currentConvId = conversationId;
    if (!currentConvId) {
      console.warn("⚠️  No conversation ID, creating new conversation...");
      const newConv = await createNewConversation(
        t("chatbot.newConversation"),
        userId
      );
      currentConvId = newConv.id;
      setConversationId(currentConvId);
    }

    // Save user message to conversation
    await addMessageToConversation(currentConvId, userMessage, userId);

    setInputText("");
    setIsLoading(true);

    try {
      let aiResponse: string;
      let parsedTreatment: any = null;

      // Generate monitoring plan if requested
      if (isMonitoringRequest && diseaseContext && weatherData) {
        aiResponse = await generateMonitoringPlan(diseaseContext, weatherData);

        // ✅ Parse and format response for IoT images BEFORE adding to messages
        if (source === "iot" && diseaseContext && photoId) {
          try {
            const { parseMonitoringPlanResponse } = await import(
              "@/utils/treatment-parser.utils"
            );
            const { updatePhotoTreatment } = await import(
              "@/services/photo.service"
            );

            // Parse AI response to extract treatment data
            parsedTreatment = parseMonitoringPlanResponse(
              aiResponse,
              diseaseContext.diseaseVi,
              diseaseContext.diseaseEn || diseaseContext.diseaseVi,
              diseaseContext.confidence || 0,
              diseaseContext.sensors
            );

            console.log("📝 Parsed treatment data from chatbot:", {
              disease: parsedTreatment.disease.name,
              hasPesticides: parsedTreatment.pesticides.length > 0,
              hasFertilizers: parsedTreatment.fertilizers.length > 0,
              scheduleCount: parsedTreatment.schedule.length,
            });

            // Update photo treatment data in database
            const updateResult = await updatePhotoTreatment(
              photoId,
              parsedTreatment
            );
            if (updateResult.success) {
              console.log("✅ Treatment data saved to photo:", photoId);

              // ✅ Format response to show structured data like photo-detail.tsx
              let formattedResponse = "📋 KẾ HOẠCH GIÁM SÁT VÀ ĐIỀU TRỊ\n\n";

              // Add pesticides section
              if (
                parsedTreatment.pesticides &&
                parsedTreatment.pesticides.length > 0
              ) {
                formattedResponse += "💊 THUỐC TRỪ BỆNH:\n";
                parsedTreatment.pesticides.forEach((pesticide: any) => {
                  formattedResponse += `• ${pesticide.name}`;
                  if (pesticide.activeIngredient) {
                    formattedResponse += ` (${pesticide.activeIngredient})`;
                  }
                  formattedResponse += "\n";
                  if (pesticide.dosage) {
                    formattedResponse += `  - Liều lượng: ${pesticide.dosage}\n`;
                  }
                  if (pesticide.mixing) {
                    formattedResponse += `  - Cách dùng: ${pesticide.mixing}\n`;
                  }
                  if (pesticide.timing) {
                    formattedResponse += `  - Thời gian: ${pesticide.timing}\n`;
                  }
                  if (pesticide.frequency) {
                    formattedResponse += `  - Tần suất: ${pesticide.frequency}\n`;
                  }
                  formattedResponse += "\n";
                });
              }

              // Add fertilizers section
              if (
                parsedTreatment.fertilizers &&
                parsedTreatment.fertilizers.length > 0
              ) {
                formattedResponse += "🌾 PHÂN BÓN:\n";
                parsedTreatment.fertilizers.forEach((fertilizer: any) => {
                  formattedResponse += `• ${fertilizer.name}`;
                  if (fertilizer.type) {
                    formattedResponse += ` (${fertilizer.type})`;
                  }
                  formattedResponse += "\n";
                  if (fertilizer.dosage) {
                    formattedResponse += `  - Liều lượng: ${fertilizer.dosage}\n`;
                  }
                  if (fertilizer.mixing) {
                    formattedResponse += `  - Cách dùng: ${fertilizer.mixing}\n`;
                  }
                  if (fertilizer.timing) {
                    formattedResponse += `  - Thời gian: ${fertilizer.timing}\n`;
                  }
                  formattedResponse += "\n";
                });
              }

              // Add schedule section
              if (
                parsedTreatment.schedule &&
                parsedTreatment.schedule.length > 0
              ) {
                formattedResponse += "📅 LỊCH ĐIỀU TRỊ:\n";
                parsedTreatment.schedule.forEach((item: any) => {
                  formattedResponse += `• ${item.date} - ${item.task}`;
                  if (item.details) {
                    formattedResponse += ` (${item.details})`;
                  }
                  formattedResponse += "\n";
                });
              }

              // Update AI response with formatted version
              aiResponse = formattedResponse;
            } else {
              console.warn(
                "⚠️ Failed to save treatment data:",
                updateResult.error
              );
            }
          } catch (parseError: any) {
            console.error(
              "❌ Error parsing/saving treatment data:",
              parseError
            );
            // Don't show error to user - just log it
          }
        }
      } else {
        // Get chat history for context
        const conversation = await getCurrentConversation(userId);
        const history = conversation?.messages || [];
        // Use weatherContext if no diseaseContext
        const contextToUse = diseaseContext || weatherContext;
        aiResponse = await generateAIResponse(
          messageText,
          contextToUse,
          weatherData || undefined,
          history
        );
      }

      // Start typing effect
      setIsTyping(true);
      await typeMessage(aiResponse);

      // Add AI message
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: aiResponse,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Save AI message to conversation (use currentConvId from above)
      if (currentConvId) {
        await addMessageToConversation(currentConvId, aiMessage, userId);
      }

      // Show "Send to IoT" button if this was a monitoring plan request for IoT image
      // Also check if AI response contains monitoring/treatment keywords (user might ask differently)
      const monitoringKeywords = [
        "kế hoạch",
        "giám sát",
        "điều trị",
        "phác đồ",
        "thuốc",
        "phân bón",
        "lịch",
        "schedule",
        "treatment",
        "monitoring",
      ];
      const responseContainsMonitoring = monitoringKeywords.some((keyword) =>
        aiResponse.toLowerCase().includes(keyword.toLowerCase())
      );
      const isMonitoringRelated =
        isMonitoringRequest || responseContainsMonitoring;

      console.log(
        "🔘 ChatbotModal - Checking if should show Send to IoT button:",
        {
          isMonitoringRequest,
          responseContainsMonitoring,
          isMonitoringRelated,
          source,
          photoId: photoId?.substring(0, 20),
          fieldId: fieldId?.substring(0, 20),
          treatmentSent,
          shouldShow:
            isMonitoringRelated &&
            source === "iot" &&
            photoId &&
            fieldId &&
            !treatmentSent,
        }
      );

      if (
        isMonitoringRelated &&
        source === "iot" &&
        photoId &&
        fieldId &&
        !treatmentSent
      ) {
        console.log("✅ Showing Send to IoT button!");
        setShowSendToIoTButton(true);
      }
    } catch (error: any) {
      Alert.alert(
        t("chatbot.error"),
        error.message || t("chatbot.errorConnection")
      );
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  /**
   * Send treatment to IoT device
   */
  const handleSendToIoT = async () => {
    if (!photoId || !fieldId) {
      Alert.alert(t("chatbot.error"), t("chatbot.errorMissingInfo"));
      return;
    }

    try {
      setIsSendingToIoT(true);

      // Step 1: Ensure treatment data exists (check and generate if needed)
      const { getPhotoById } = await import("@/services/photo.service");
      let currentPhoto = await getPhotoById(photoId);
      const hasTreatmentData = !!(currentPhoto as any)?.treatmentData;

      if (!hasTreatmentData) {
        console.log("🔄 Step 1: Generating treatment data (chatbot)...");

        // Generate treatment data from AI response if available
        // Check last AI message for monitoring plan
        const lastAIMessage = messages
          .filter((m) => m.role === "assistant")
          .pop();

        if (lastAIMessage && diseaseContext) {
          try {
            const { parseMonitoringPlanResponse } = await import(
              "@/utils/treatment-parser.utils"
            );
            const { updatePhotoTreatment } = await import(
              "@/services/photo.service"
            );

            // Parse AI response to extract treatment data
            const parsedTreatment = parseMonitoringPlanResponse(
              lastAIMessage.content,
              diseaseContext.diseaseVi,
              diseaseContext.diseaseEn || diseaseContext.diseaseVi,
              diseaseContext.confidence || 0,
              diseaseContext.sensors
            );

            // Check if parsed treatment has content
            const hasContent =
              (parsedTreatment.pesticides &&
                parsedTreatment.pesticides.length > 0) ||
              (parsedTreatment.fertilizers &&
                parsedTreatment.fertilizers.length > 0) ||
              (parsedTreatment.schedule && parsedTreatment.schedule.length > 0);

            if (hasContent) {
              const updateResult = await updatePhotoTreatment(
                photoId,
                parsedTreatment
              );
              if (updateResult.success) {
                console.log(
                  "✅ Treatment data generated and saved from chatbot"
                );
                // Reload photo
                currentPhoto = await getPhotoById(photoId);
              }
            }
          } catch (parseError: any) {
            console.warn(
              "⚠️ Failed to parse treatment from AI response:",
              parseError
            );
          }
        }

        // If still no treatment data, try to generate from scratch
        if (!(currentPhoto as any)?.treatmentData && diseaseContext) {
          try {
            const { generateMonitoringPlan } = await import(
              "@/services/gemini.service"
            );
            const { getWeatherForecast } = await import(
              "@/services/weather.service"
            );
            const { parseMonitoringPlanResponse } = await import(
              "@/utils/treatment-parser.utils"
            );
            const { updatePhotoTreatment } = await import(
              "@/services/photo.service"
            );

            // Get weather data
            const weatherResponse = await getWeatherForecast(
              diseaseContext.location.lat,
              diseaseContext.location.lng
            );

            // Convert weather data (simplified - you may need to adjust based on your weather service)
            const weatherData = {
              current: {
                temp: weatherResponse.current.main.temp,
                humidity: weatherResponse.current.main.humidity,
                description: weatherResponse.current.weather[0].description,
              },
              forecast: weatherResponse.forecast.list
                .slice(0, 3)
                .map((item: any) => ({
                  date: new Date(item.dt * 1000).toLocaleDateString("vi-VN"),
                  temp: item.main.temp,
                  humidity: item.main.humidity,
                  rain: item.rain?.["3h"] || 0,
                  description: item.weather[0].description,
                })),
            };

            // Generate monitoring plan
            const aiResponse = await generateMonitoringPlan(
              diseaseContext,
              weatherData
            );

            // Parse and save
            const parsedTreatment = parseMonitoringPlanResponse(
              aiResponse,
              diseaseContext.diseaseVi,
              diseaseContext.diseaseEn || diseaseContext.diseaseVi,
              diseaseContext.confidence || 0,
              diseaseContext.sensors
            );

            const updateResult = await updatePhotoTreatment(
              photoId,
              parsedTreatment
            );
            if (updateResult.success) {
              console.log("✅ Treatment data generated from scratch");
              currentPhoto = await getPhotoById(photoId);
            }
          } catch (genError: any) {
            console.warn("⚠️ Failed to generate treatment data:", genError);
          }
        }
      } else {
        console.log("✅ Treatment data already exists, skipping generation");
      }

      // Step 2: Verify treatment data exists before sending
      const hasTreatmentDataNow = !!(currentPhoto as any)?.treatmentData;
      if (!hasTreatmentDataNow) {
        Alert.alert(
          t("chatbot.error"),
          "Không có dữ liệu điều trị. Vui lòng đợi hệ thống tạo phác đồ điều trị."
        );
        return;
      }

      // Step 3: Send treatment to IoT
      console.log("🔄 Step 2: Sending treatment to IoT (chatbot)...");
      const token = await getAccessToken();
      if (!token) {
        Alert.alert(t("chatbot.error"), t("chatbot.errorLogin"));
        return;
      }

      const response = await apiPost("/iot/treatment/send", {
        photoId,
        fieldId,
      });

      if (response.success) {
        setTreatmentSent(true);
        setShowSendToIoTButton(false);
        Alert.alert(
          t("chatbot.success"),
          (response.data as any)?.message || t("result.treatmentSentSuccess"),
          [{ text: t("common.ok") }]
        );
      } else {
        const errorMessage =
          typeof response.error === "string"
            ? response.error
            : response.error?.message || t("chatbot.sendFailed");
        Alert.alert(t("chatbot.error"), errorMessage);
      }
    } catch (error: any) {
      Alert.alert(
        t("chatbot.error"),
        error.message || t("chatbot.errorSendFailed")
      );
    } finally {
      setIsSendingToIoT(false);
    }
  };

  const typeMessage = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setTypingText("");
      let currentIndex = 0;

      typingIntervalRef.current = setInterval(() => {
        if (currentIndex < text.length) {
          setTypingText(text.substring(0, currentIndex + 1));
          currentIndex++;

          // Auto-scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 50);
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
          }
          setTypingText("");
          resolve();
        }
      }, 10); // 10ms per character - 2x faster while keeping smooth typing effect
    });
  };

  const handleClearHistory = () => {
    Alert.alert(
      t("chatbot.clearHistoryTitle"),
      t("chatbot.clearHistoryMessage"),
      [
        { text: t("chatbot.clearHistoryCancel"), style: "cancel" },
        {
          text: t("chatbot.clearHistoryConfirm"),
          style: "default",
          onPress: async () => {
            // Create new conversation
            const newConv = await createNewConversation(
              t("chatbot.newConversation"),
              userId
            );
            setConversationId(newConv.id);

            const welcomeMessage: ChatMessage = {
              role: "assistant",
              content: t("chatbot.welcomeMessage"),
              timestamp: Date.now(),
            };
            setMessages([welcomeMessage]);
            setSuggestionsPosition("bottom");
          },
        },
      ]
    );
  };

  const handleSuggestionPress = (suggestion: string) => {
    // Remove emoji prefix
    const cleanText = suggestion.replace(/^[^\s]+ /, "");
    handleSend(cleanText);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!isUser && (
          <Image
            source={require("../assets/images/text-logo.png")}
            style={styles.aiAvatar}
            resizeMode="contain"
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          {/* Render image if present */}
          {item.imageUrl && (
            <ExpoImage
              source={{
                uri: (() => {
                  // Add timestamp to bypass cache (Firebase doesn't accept custom headers)
                  const url = item.imageUrl;
                  return `${url}${
                    url.includes("?") ? "&" : "?"
                  }_t=${Date.now()}`;
                })(),
              }}
              style={styles.messageImage}
              contentFit="cover"
              transition={200}
              onError={(error) => {
                console.log("⚠️ ChatBot image failed to load:", error);
                console.log("Image URL:", item.imageUrl);
              }}
              onLoad={() => {
                console.log(
                  "✅ ChatBot image loaded:",
                  item.imageUrl?.substring(0, 60) + "..."
                );
              }}
            />
          )}

          {/* Render text content */}
          {item.content &&
            (isUser ? (
              <Text style={styles.userMessageText}>{item.content}</Text>
            ) : (
              <FormattedAIText text={item.content} />
            ))}

          {/* Show "Send to IoT" button after last AI message if monitoring plan was generated */}
          {(() => {
            const isLastMessage = item === messages[messages.length - 1];
            const shouldShowButton =
              !isUser && showSendToIoTButton && isLastMessage;

            if (!isUser && isLastMessage) {
              console.log("🔘 ChatbotModal - Render button check:", {
                showSendToIoTButton,
                isLastMessage,
                shouldShowButton,
                messageContent: item.content?.substring(0, 50),
              });
            }

            return (
              shouldShowButton && (
                <TouchableOpacity
                  style={[
                    styles.sendToIoTButton,
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
                      <Ionicons name="send" size={18} color="#fff" />
                      <Text style={styles.sendToIoTButtonText}>
                        {treatmentSent
                          ? t("result.sentToIoT")
                          : t("chatbot.sendToIoT")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )
            );
          })()}
        </View>
      </View>
    );
  };

  const renderSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsScroll}
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => handleSuggestionPress(suggestion)}
            disabled={isLoading || isTyping}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Image
              source={require("../assets/images/text-logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.headerTitle}>Bác sĩ Lúa</Text>
              <Text style={styles.headerSubtitle}>
                Tư vấn bệnh lúa & nông nghiệp
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleClearHistory}
            style={styles.clearButton}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Suggestions at top (after first message) */}
        {suggestionsPosition === "top" && renderSuggestions()}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `${item.timestamp}-${index}`}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.messageContainer}>
                <Image
                  source={require("../assets/images/text-logo.png")}
                  style={styles.aiAvatar}
                  resizeMode="contain"
                />
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <FormattedAIText text={typingText} />
                  <Text style={styles.typingCursor}>▌</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Suggestions at bottom (initial) */}
        {suggestionsPosition === "bottom" && renderSuggestions()}

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom:
                Platform.OS === "android"
                  ? Math.max(insets.bottom, 12)
                  : insets.bottom || 12,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Nhập câu hỏi..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading && !isTyping}
            onFocus={() => {
              // Scroll to bottom when input is focused
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading || isTyping) &&
                styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading || isTyping}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#4CAF50",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    gap: 12,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  timeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "600",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  aiMessageContainer: {
    justifyContent: "flex-start",
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: "#4CAF50",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
    marginBottom: 8,
  },
  userMessageText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
  },
  typingCursor: {
    fontSize: 18,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  suggestionsContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  suggestionText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    alignItems: "flex-end",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    color: "#333",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#BDBDBD",
  },
  sendToIoTButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9800",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  sendToIoTButtonDisabled: {
    backgroundColor: "#BDBDBD",
  },
  sendToIoTButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
