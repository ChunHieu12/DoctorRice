/**
 * AIChatHistoryScreen
 * Hiển thị lịch sử các cuộc trò chuyện với AI
 * User có thể tiếp tục chat hoặc xóa conversation
 */
import ChatbotModal from '@/components/ChatbotModal';
import EditTitleModal from '@/components/ui/EditTitleModal';
import { useTextSize } from '@/contexts/TextSizeContext';
import { useAuth } from '@/hooks/useAuth';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import type { ChatConversation } from '@/services/chat-history.service';
import {
    deleteConversation,
    getActiveConversations,
    renameConversation,
} from '@/services/chat-history.service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AIChatHistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showAlert } = useCustomAlert();
  const { scale } = useTextSize();
  const { user } = useAuth();
  const userId = user?.id || null;

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [editingConversation, setEditingConversation] = useState<ChatConversation | null>(null);

  /**
   * Load conversations
   */
  const loadConversations = async () => {
    try {
      const convs = await getActiveConversations(userId);
      // Sort by updatedAt desc (most recent first)
      convs.sort((a, b) => b.updatedAt - a.updatedAt);
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Reload on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [userId]) // Reload when user changes
  );

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  /**
   * Continue conversation (open chatbot with this conversation)
   */
  const handleContinueChat = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowChatbot(true);
  };

  /**
   * Edit conversation title
   */
  const handleEdit = (conversation: ChatConversation) => {
    setEditingConversation(conversation);
  };

  /**
   * Save edited title
   */
  const handleSaveTitle = async (newTitle: string) => {
    if (!editingConversation) return;

    await renameConversation(editingConversation.id, newTitle, userId);
    await loadConversations();
    setEditingConversation(null);
    
    showAlert({
      type: 'success',
      title: t('common.success'),
      message: 'Đã đổi tên cuộc trò chuyện',
      buttons: [{ text: t('common.ok'), style: 'default' }],
    });
  };

  /**
   * Delete conversation permanently
   */
  const handleDelete = async (conversationId: string) => {
    showAlert({
      type: 'error',
      title: t('aiChatHistory.delete'),
      message: t('aiChatHistory.deleteConfirm'),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteConversation(conversationId, userId);
            await loadConversations();
            showAlert({
              type: 'success',
              title: t('common.success'),
              message: t('aiChatHistory.deleteSuccess'),
              buttons: [{ text: t('common.ok'), style: 'default' }],
            });
          },
        },
      ],
    });
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * Render conversation item
   */
  const renderConversationItem = ({ item }: { item: ChatConversation }) => {
    const lastMessage = item.messages[item.messages.length - 1];
    const preview = lastMessage?.text?.substring(0, 80) || 'Cuộc trò chuyện trống';

    return (
      <View style={styles.conversationItem}>
        <TouchableOpacity
          style={styles.conversationContent}
          onPress={() => handleContinueChat(item.id)}
          activeOpacity={0.7}
        >
          {/* Icon */}
          <View style={styles.conversationIcon}>
            <Ionicons name="chatbubbles" size={24 * scale} color="#4CAF50" />
          </View>

          {/* Content */}
          <View style={styles.conversationText}>
            <Text style={[styles.conversationTitle, { fontSize: 16 * scale }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.conversationPreview, { fontSize: 14 * scale }]} numberOfLines={2}>
              {preview}
            </Text>
            <Text style={[styles.conversationTime, { fontSize: 12 * scale }]}>
              {formatTimeAgo(item.updatedAt)} • {item.messages.length} tin nhắn
            </Text>
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.conversationActions}>
          {/* Edit Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20 * scale} color="#2196F3" />
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20 * scale} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={80} color="#BDBDBD" />
      <Text style={[styles.emptyText, { fontSize: 18 * scale }]}>
        {t('aiChatHistory.noConversations')}
      </Text>
      <Text style={[styles.emptySubtext, { fontSize: 14 * scale }]}>
        Bắt đầu trò chuyện với Bác sĩ Lúa AI
      </Text>
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => setShowChatbot(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={20 * scale} color="#fff" />
        <Text style={[styles.newChatButtonText, { fontSize: 16 * scale }]}>
          {t('aiChatHistory.newConversation')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: 20 * scale }]}>
          {t('aiChatHistory.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={[styles.loadingText, { fontSize: 16 * scale }]}>
            Đang tải lịch sử...
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            conversations.length === 0 ? styles.emptyListContent : styles.listContent
          }
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4CAF50']} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Chatbot Modal */}
      <ChatbotModal
        visible={showChatbot}
        onClose={() => {
          setShowChatbot(false);
          setSelectedConversationId(null);
          loadConversations(); // Reload after chat
        }}
        initialConversationId={selectedConversationId}
      />

      {/* Edit Title Modal */}
      <EditTitleModal
        visible={!!editingConversation}
        currentTitle={editingConversation?.title || ''}
        onSave={handleSaveTitle}
        onCancel={() => setEditingConversation(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },

  // List
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },

  // Conversation Item
  conversationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conversationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationText: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  conversationPreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
  },
  conversationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  newChatButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

