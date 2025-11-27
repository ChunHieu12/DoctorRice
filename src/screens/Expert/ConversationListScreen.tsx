import { AppHeader } from '@/components/ui';
import { useTextSize } from '@/contexts/TextSizeContext';
import { useAuth } from '@/hooks/useAuth';
import {
    deleteConversation,
    getConversations,
    type ConversationSummary
} from '@/services/expert.service';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabType = 'pending' | 'answered' | 'completed';

export default function ConversationListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useTextSize();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isExpert = user?.roles?.includes('expert');

  useFocusEffect(
    useCallback(() => {
      console.log('📱 ConversationListScreen focused - reloading conversations');
      loadConversations();
    }, [activeTab])
  );

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await getConversations(activeTab);
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleConversationPress = (item: ConversationSummary) => {
    // When conversation exists, only conversationId is needed
    // expertId is only used for creating NEW conversations
    // The API will return full conversation object with userId & expertId
    router.push(`/expert-chat?conversationId=${item.id}` as any);
  };

  const handleDeleteConversation = (item: ConversationSummary) => {
    const otherUser = isExpert ? item.farmer : item.expert;
    
    Alert.alert(
      'Xóa lịch sử chat',
      `Bạn có chắc chắn muốn xóa cuộc trò chuyện với ${otherUser?.displayName || 'người dùng này'}?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from backend
              await deleteConversation(item.id);
              
              // Remove from local state
              setConversations(prev => prev.filter(conv => conv.id !== item.id));
              
              Alert.alert('Thành công', 'Đã xóa lịch sử chat');
            } catch (error) {
              console.error('Failed to delete conversation:', error);
              Alert.alert('Lỗi', 'Không thể xóa lịch sử chat');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'answered':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'reopen_requested':
        return '#9C27B0';
      case 'expired':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chưa trả lời';
      case 'answered':
        return 'Đã trả lời';
      case 'completed':
        return 'Hoàn thành';
      case 'reopen_requested':
        return 'Yêu cầu mở lại';
      case 'expired':
        return 'Hết hạn';
      default:
        return status;
    }
  };

  const renderConversationItem = ({ item }: { item: ConversationSummary }) => {
    const otherUser = isExpert ? item.farmer : item.expert;
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.conversationContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {otherUser?.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28 * scale} color="#fff" />
              </View>
            )}
            {hasUnread && <View style={styles.unreadDot} />}
          </View>

          {/* Info */}
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={[styles.userName, { fontSize: 16 * scale }]} numberOfLines={1}>
                {otherUser?.displayName || 'Người dùng'}
              </Text>
              <Text style={[styles.timestamp, { fontSize: 12 * scale }]}>
                {new Date(item.lastMessageAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </Text>
            </View>

            {/* Last message */}
            {item.lastMessage && (
              <Text style={[styles.lastMessage, { fontSize: 14 * scale }]} numberOfLines={2}>
                {item.lastMessage.images?.length > 0 && '📷 '}
                {item.lastMessage.content || 'Đã gửi ảnh'}
              </Text>
            )}

            {/* Status & Rating */}
            <View style={styles.conversationFooter}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={[styles.statusText, { fontSize: 11 * scale }]}>
                  {getStatusText(item.status)}
                </Text>
              </View>

              {item.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14 * scale} color="#FFC107" />
                  <Text style={[styles.ratingText, { fontSize: 12 * scale }]}>
                    {item.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            {/* Rating Comment (if exists) */}
            {item.ratingComment && (
              <View style={styles.ratingCommentContainer}>
                <Ionicons name="chatbox-outline" size={12 * scale} color="#666" />
                <View style={styles.ratingCommentContent}>
                  {isExpert && item.farmer && (
                    <Text style={[styles.farmerName, { fontSize: 12 * scale }]}>
                      {item.farmer.displayName}:
                    </Text>
                  )}
                  <Text style={[styles.ratingCommentText, { fontSize: 12 * scale }]} numberOfLines={2}>
                    {item.ratingComment}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Unread badge */}
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={[styles.unreadText, { fontSize: 11 * scale }]}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteConversation(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20 * scale} color="#F44336" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const emptyMessages = {
      pending: isExpert
        ? 'Chưa có câu hỏi nào từ nhà nông'
        : 'Chưa có câu hỏi chưa trả lời',
      answered: 'Chưa có câu hỏi đã trả lời',
      completed: 'Chưa có cuộc hỏi đáp hoàn thành',
    };

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={80 * scale} color="#ccc" />
        <Text style={[styles.emptyText, { fontSize: 16 * scale }]}>
          {emptyMessages[activeTab]}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader showBackButton />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[
              styles.tabText,
              { fontSize: 14 * scale },
              activeTab === 'pending' && styles.activeTabText,
            ]}
          >
            Chưa trả lời
          </Text>
          {activeTab === 'pending' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'answered' && styles.activeTab]}
          onPress={() => setActiveTab('answered')}
        >
          <Text
            style={[
              styles.tabText,
              { fontSize: 14 * scale },
              activeTab === 'answered' && styles.activeTabText,
            ]}
          >
            Đã trả lời
          </Text>
          {activeTab === 'answered' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabText,
              { fontSize: 14 * scale },
              activeTab === 'completed' && styles.activeTabText,
            ]}
          >
            Hoàn thành
          </Text>
          {activeTab === 'completed' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : conversations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active state handled by tabIndicator
  },
  tabText: {
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
  conversationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  conversationContent: {
    flexDirection: 'row',
    padding: 15,
    paddingRight: 50, // Space for delete button
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    flex: 1,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    color: '#999',
    marginLeft: 8,
  },
  lastMessage: {
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: '#666',
    fontWeight: '600',
  },
  ratingCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 6,
    paddingLeft: 2,
  },
  ratingCommentContent: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  farmerName: {
    color: '#333',
    fontWeight: '600',
    marginRight: 4,
  },
  ratingCommentText: {
    flexShrink: 1,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  unreadBadge: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
  },
  unreadText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    top: '50%',
    right: 10,
    marginTop: -20, // Half of button height to center vertically
    padding: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
});

