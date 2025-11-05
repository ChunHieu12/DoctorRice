/**
 * ChatbotModal - AI Chat Assistant "Bác sĩ Lúa"
 * Features: Typing effect, suggestions, 24h history, auto-monitoring plan
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    clearChatHistory,
    getChatHistory,
    getTimeRemaining,
    saveChatMessage,
} from '../services/chat-history.service';
import {
    ChatMessage,
    DiseaseContext,
    generateAIResponse,
    generateMonitoringPlan,
    ProcessedWeatherData,
} from '../services/gemini.service';
import { getWeatherForecast } from '../services/weather.service';
import FormattedAIText from './FormattedAIText';

const { width, height } = Dimensions.get('window');

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
  diseaseContext?: DiseaseContext;
}

export default function ChatbotModal({
  visible,
  onClose,
  diseaseContext,
}: ChatbotModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [weatherData, setWeatherData] = useState<ProcessedWeatherData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(24);
  const [suggestionsPosition, setSuggestionsPosition] = useState<'bottom' | 'top'>('bottom');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const flatListRef = useRef<FlatList>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Suggestions
  const getSuggestions = () => {
    const diseaseName = diseaseContext?.diseaseVi || 'lúa';
    return [
      '🔍 Kế hoạch giám sát tự động',
      `⚠️ Bệnh ${diseaseName} có nguy hiểm không?`,
      `🛡️ Cách phòng ngừa bệnh ${diseaseName}?`,
      '📋 Tôi nên làm gì tiếp theo?',
      `💡 Nguyên nhân gây ra bệnh ${diseaseName}?`,
    ];
  };

  const suggestions = getSuggestions();

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
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
      loadChatHistory();
      loadWeatherData();
      updateTimeRemaining();
    } else {
      // Dismiss keyboard when closing modal
      Keyboard.dismiss();
      setKeyboardHeight(0);
    }
  }, [visible]);

  // Update time remaining every minute
  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      updateTimeRemaining();
    }, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, [visible]);

  const updateTimeRemaining = async () => {
    const remaining = await getTimeRemaining();
    setTimeRemaining(remaining);
  };

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory();
      
      if (history.length === 0) {
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          role: 'assistant',
          content: 'Chào mừng đến Bác sĩ Lúa, Anh/Chị cần hổ trợ về vấn đề nào ạ?',
          timestamp: Date.now(),
        };
        setMessages([welcomeMessage]);
      } else {
        setMessages(history);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  // Convert weather data to ProcessedWeatherData format
  const convertWeatherData = (weatherResponse: any): ProcessedWeatherData => {
    // Group forecast by day
    const forecastByDay: { [key: string]: any[] } = {};
    
    weatherResponse.forecast.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toLocaleDateString('vi-VN');
      if (!forecastByDay[date]) {
        forecastByDay[date] = [];
      }
      forecastByDay[date].push(item);
    });

    // Calculate daily summaries
    const forecast = Object.entries(forecastByDay)
      .slice(0, 3)
      .map(([date, items]: [string, any[]]) => {
        const avgTemp = items.reduce((sum, item) => sum + item.main.temp, 0) / items.length;
        const avgHumidity = items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length;
        const totalRain = items.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0);
        
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
      console.log('☁️ Weather data loaded for chatbot');
    } catch (error) {
      console.warn('⚠️ Failed to load weather data:', error);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    
    if (!messageText) return;

    // Check if this is a monitoring plan request
    const isMonitoringRequest = messageText.includes('Kế hoạch giám sát tự động');

    // Move suggestions to top after first message
    if (suggestionsPosition === 'bottom') {
      setSuggestionsPosition('top');
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage(userMessage);
    setInputText('');
    setIsLoading(true);

    try {
      let aiResponse: string;

      // Generate monitoring plan if requested
      if (isMonitoringRequest && diseaseContext && weatherData) {
        aiResponse = await generateMonitoringPlan(diseaseContext, weatherData);
      } else {
        // Get chat history for context
        const history = await getChatHistory();
        aiResponse = await generateAIResponse(
          messageText,
          diseaseContext,
          weatherData || undefined,
          history
        );
      }

      // Start typing effect
      setIsTyping(true);
      await typeMessage(aiResponse);

      // Add AI message
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
      await saveChatMessage(aiMessage);

    } catch (error: any) {
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể kết nối với AI. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const typeMessage = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setTypingText('');
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
          setTypingText('');
          resolve();
        }
      }, 10); // 10ms per character - 2x faster while keeping smooth typing effect
    });
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Xóa lịch sử chat',
      'Bạn có chắc muốn xóa toàn bộ lịch sử chat?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await clearChatHistory();
            const welcomeMessage: ChatMessage = {
              role: 'assistant',
              content: 'Chào mừng đến Bác sĩ Lúa, Anh/Chị cần hổ trợ về vấn đề nào ạ?',
              timestamp: Date.now(),
            };
            setMessages([welcomeMessage]);
            setSuggestionsPosition('bottom');
          },
        },
      ]
    );
  };

  const handleSuggestionPress = (suggestion: string) => {
    // Remove emoji prefix
    const cleanText = suggestion.replace(/^[^\s]+ /, '');
    handleSend(cleanText);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!isUser && (
          <Image
            source={require('../assets/images/text-logo.png')}
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
          {isUser ? (
            <Text style={styles.userMessageText}>{item.content}</Text>
          ) : (
            <FormattedAIText text={item.content} />
          )}
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Image
              source={require('../assets/images/text-logo.png')}
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

          <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Time Remaining Banner */}
        {timeRemaining < 24 && (
          <View style={styles.timeBanner}>
            <Ionicons name="time-outline" size={16} color="#FF9800" />
            <Text style={styles.timeText}>
              Lịch sử chat sẽ tự động xóa sau {timeRemaining} giờ
            </Text>
          </View>
        )}

        {/* Suggestions at top (after first message) */}
        {suggestionsPosition === 'top' && renderSuggestions()}

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
                  source={require('../assets/images/text-logo.png')}
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
        {suggestionsPosition === 'bottom' && renderSuggestions()}

        {/* Input */}
        <View 
          style={[
            styles.inputContainer,
            { 
              paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 12) : insets.bottom || 12,
            }
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
              (!inputText.trim() || isLoading || isTyping) && styles.sendButtonDisabled,
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 12,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
  },
  typingCursor: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  suggestionText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
});

