/**
 * FeatureGrid - Grid of app features (8 features, 4 columns layout)
 * Features: Home, Weather, Camera, Map, Account, Chat AI, Storm Tracking, Expert Chat
 */
import { useChatbot } from '@/contexts/ChatbotContext';
import { useAuth } from '@/hooks/useAuth';
import { useHasIoTFields } from '@/hooks/useHasIoTFields';
import { useSocket } from '@/hooks/useSocket';
import { getConversations, getUnreadCount } from '@/services/expert.service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Feature {
  id: string;
  label: string;
  icon: any;
  isImage?: boolean;
  route?: string;
  onPress?: () => void;
  color: string;
  badge?: number | undefined; // Unread count badge (must be number or undefined)
}

interface FeatureGridProps {
  onChatPress?: () => void; // Optional, will open ChatbotModal if not provided
}

export default function FeatureGrid({ onChatPress }: FeatureGridProps = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { hasIoTFields, loading: iotLoading } = useHasIoTFields();
  const { openChatbot } = useChatbot();
  const [unreadCount, setUnreadCount] = useState(0);

  // Check if user is expert
  const isExpert = user?.roles?.includes('expert');

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      if (user) {
        const count = await getUnreadCount();
        // Ensure it's always a valid number (0 or positive integer)
        const validCount = typeof count === 'number' && count > 0 ? count : 0;
        setUnreadCount(validCount);
        console.log('🔔 Unread count updated:', validCount);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
      setUnreadCount(0); // Set to 0 on error to prevent rendering issues
    }
  };

  useEffect(() => {
    loadUnreadCount();
  }, [user]);

  // Listen for real-time unread count updates via socket
  useEffect(() => {
    if (socket && user) {
      const handleUnreadUpdate = (data: any) => {
        console.log('🔔 Socket: Unread count changed', data);
        loadUnreadCount(); // Refresh badge count
      };

      socket.on('unread:update', handleUnreadUpdate);

      return () => {
        socket.off('unread:update', handleUnreadUpdate);
      };
    }
  }, [socket, user]);

  // Reload unread count when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [user])
  );

  const handleExpertChatPress = async () => {
    try {
      // Check if there are unread conversations
      if (unreadCount > 0) {
        // ✅ Get ALL conversations (not just pending) to find unread messages
        const conversations = await getConversations(); // No status filter
        
        // Find first conversation with unread messages
        const unreadConv = conversations.find((conv: any) => conv.unreadCount > 0);
        
        if (unreadConv) {
          // Navigate directly to the conversation (conversationId is enough)
          console.log('📨 Navigating to unread conversation:', unreadConv.id);
          router.push(`/expert-chat?conversationId=${unreadConv.id}` as any);
          return;
        }
      }
      
      // No unread messages → show expert list
      console.log('📝 No unread messages, showing expert list');
      router.push('/expert-list' as any);
    } catch (error) {
      console.error('Failed to handle expert chat press:', error);
      // Fallback to expert list
      router.push('/expert-list' as any);
    }
  };

  /**
   * Handle Doctor AI press - Check IoT before opening camera
   * - If has IoT fields: Navigate to IoT gallery
   * - If no IoT fields: Open camera modal
   */
  const handleDoctorAIPress = () => {
    if (iotLoading) {
      // Still loading, default to camera
      router.push('/camera-modal' as any);
      return;
    }

    if (hasIoTFields) {
      // User has IoT fields - Navigate directly to IoT gallery
      router.push('/iot-gallery' as any);
    } else {
      // No IoT fields - Open camera modal
      router.push('/camera-modal' as any);
    }
  };

  const features: Feature[] = [
    {
      id: 'iot-fields',
      label: t('home.features.iotFields', { defaultValue: 'Ruộng IoT' }),
      icon: 'leaf',
      route: '/field-management',
      color: '#4CAF50',
    },
    {
      id: 'weather',
      label: t('tabs.weather'),
      icon: 'partly-sunny',
      route: '/(tabs)/weather',
      color: '#2196F3',
    },
    {
      id: 'camera',
      label: t('home.features.doctorAI'),
      icon: 'medical',
      onPress: handleDoctorAIPress,
      color: '#FF9800',
    },
    {
      id: 'map',
      label: t('tabs.mapFarm'),
      icon: 'map',
      route: '/(tabs)/mapFarm',
      color: '#9C27B0',
    },
    {
      id: 'account',
      label: t('tabs.account'),
      icon: 'person',
      route: '/(tabs)/account',
      color: '#607D8B',
    },
    {
      id: 'chat',
      label: t('home.features.chatAI'),
      icon: 'chatbubbles',
      onPress: onChatPress || openChatbot,
      color: '#00BCD4',
    },
    {
      id: 'expert-chat',
      label: isExpert 
        ? t('home.features.chatWithFarmers')
        : t('home.features.chatWithExperts'),
      icon: 'people',
      onPress: isExpert ? undefined : handleExpertChatPress, // Smart navigation for farmers
      route: isExpert ? '/expert-conversations' : undefined,
      color: '#FF5722',
      badge: unreadCount > 0 ? unreadCount : undefined, // Only set badge if count > 0
    },
    {
      id: 'storm',
      label: t('home.features.stormTracking', { defaultValue: 'Theo dõi bão' }),
      icon: 'thunderstorm',
      route: '/storm-tracking',
      color: '#F44336',
    },
  ];

  const handleFeaturePress = (feature: Feature) => {
    if (feature.onPress) {
      feature.onPress();
    } else if (feature.route) {
      router.push(feature.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t('home.features.title')}
      </Text>
      
      <View style={styles.grid}>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.featureItem}
            onPress={() => handleFeaturePress(feature)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
              {feature.isImage ? (
                <Image
                  source={feature.icon}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name={feature.icon as any} size={28} color="#fff" />
              )}
              {/* Badge for unread count */}
              {typeof feature.badge === 'number' && feature.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {feature.badge > 99 ? '99+' : feature.badge.toString()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.featureLabel} numberOfLines={2}>
              {feature.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  featureItem: {
    width: '25%', // 4 columns
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconImage: {
    width: 32,
    height: 32,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

