import { AppHeader, RatingModal } from '@/components/ui';
import { useTextSize } from '@/contexts/TextSizeContext';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import {
  completeConversation,
  createConversation,
  getMessages,
  markMessagesAsRead,
  sendMessage,
  type Message,
} from '@/services/expert.service';
import { uploadChatImages } from '@/services/upload.service';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
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

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB per image

export default function ExpertChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { scale } = useTextSize();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const expertId = params.expertId as string;
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [expertName, setExpertName] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversation();
  }, [expertId, conversationId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !conversation) return;

    const handleMessageReceived = (data: any) => {
      console.log('📨 Received message via socket:', data);
      
      if (data.conversationId === conversation.id && data.message) {
        // Add new message to list
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(msg => msg.id === data.message.id);
          if (exists) {
            console.log('ℹ️  Message already exists, skipping');
            return prev;
          }
          
          console.log('✅ Adding new message to chat:', data.message.id);
          return [data.message, ...prev];
        });
        
        // Mark as read if chat is active
        markAsRead();
        
        // Auto-scroll to new message
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      }
    };

    const handleTyping = (data: any) => {
      if (data.conversationId === conversation.id && data.userId !== user?.id) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on('message:receive', handleMessageReceived);
    socket.on('conversation:typing', handleTyping);

    console.log('👂 Socket listeners registered for conversation:', conversation.id);

    return () => {
      socket.off('message:receive', handleMessageReceived);
      socket.off('conversation:typing', handleTyping);
      console.log('👋 Socket listeners removed');
    };
  }, [socket, conversation, user]);

  const loadConversation = async () => {
    try {
      setIsLoading(true);

      console.log('🔍 Loading conversation with params:', {
        conversationId,
        expertId,
        hasConversationId: !!conversationId,
        hasExpertId: !!expertId,
      });

      // ✅ Early validation
      if (!conversationId && !expertId) {
        throw new Error('Either conversationId or expertId is required');
      }

      let conv;
      if (conversationId) {
        // Load existing conversation
        const messagesData = await getMessages(conversationId);
        
        // Get full conversation object from API response
        conv = (messagesData as any).conversation || {
          id: conversationId,
          expertId: expertId,
          userId: null, // Will be set from first message
          status: (messagesData as any).status || 'pending',
        };
        
        console.log('📝 Conversation loaded:', {
          id: conv.id,
          userId: conv.userId,
          expertId: conv.expertId,
          status: conv.status,
        });
        
        // Debug: Check if images exist in messages
        const withImages = messagesData.messages.filter((m: any) => m.images && m.images.length > 0);
        if (withImages.length > 0) {
          console.log(`📸 Found ${withImages.length} messages with images:`, withImages[0].images);
        }
        
        setMessages(messagesData.messages.reverse());
        
        // Get expert name from first message sender if available
        const firstExpertMessage = messagesData.messages.find((msg: any) => 
          msg.sender?._id === expertId || (user?.roles?.includes('expert') && msg.sender?._id !== user.id)
        );
        if (firstExpertMessage && firstExpertMessage.sender?.displayName) {
          setExpertName(firstExpertMessage.sender.displayName);
        }
        
        // Mark messages as read immediately with conversationId
        try {
          await markMessagesAsRead(conversationId);
          console.log('✅ Messages marked as read for conversation:', conversationId);
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      } else if (expertId) {
        // Create new conversation
        // Note: createConversation already returns the conversation object directly
        conv = await createConversation(expertId);
        console.log('📝 New conversation created:', {
          id: conv.id,
          userId: conv.userId,
          expertId: conv.expertId,
          status: conv.status,
        });
        setMessages([]);
      }

      // ✅ Validate conversation object before setting
      if (!conv) {
        throw new Error('No conversation ID or expert ID provided');
      }

      setConversation(conv);
      
      // If expert name not set yet, fetch from expert detail
      if (!expertName && expertId) {
        try {
          const { getExpertDetail } = await import('@/services/expert.service');
          const expertDetail = await getExpertDetail(expertId);
          setExpertName(expertDetail.expert.displayName);
        } catch (error) {
          console.error('Failed to fetch expert name:', error);
        }
      }
    } catch (error: any) {
      console.error('Failed to load conversation:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải cuộc trò chuyện');
      // Go back if conversation loading fails
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    if (conversation?.id) {
      try {
        await markMessagesAsRead(conversation.id);
        console.log('✅ Messages marked as read for conversation:', conversation.id);
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    }
  };

  const handleComplete = () => {
    if (!conversation?.id) return;
    // Show rating modal
    setRatingModalVisible(true);
  };

  const handleRatingSubmit = async (rating: number, comment?: string) => {
    if (!conversation?.id) return;

    try {
      setRatingModalVisible(false);
      await completeConversation(conversation.id, rating, comment);
      Alert.alert(
        t('common.success', { defaultValue: 'Thành công' }),
        t('expertChat.conversationCompleted', { defaultValue: 'Đã hoàn thành cuộc trò chuyện' })
      );
      setConversation({ ...conversation, status: 'completed', rating });
      router.back();
    } catch (error: any) {
      Alert.alert(
        t('common.error', { defaultValue: 'Lỗi' }),
        error.message || t('expertChat.completeError', { defaultValue: 'Không thể hoàn thành cuộc trò chuyện' })
      );
    }
  };

  const handlePickImage = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      Alert.alert('Giới hạn ảnh', `Bạn chỉ có thể gửi tối đa ${MAX_IMAGES} ảnh mỗi tin nhắn`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để chọn ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - selectedImages.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets
        .filter((asset) => (asset.fileSize || 0) <= MAX_IMAGE_SIZE)
        .map((asset) => asset.uri);

      if (newImages.length < result.assets.length) {
        Alert.alert('Cảnh báo', 'Một số ảnh quá lớn (>5MB) đã bị bỏ qua');
      }

      setSelectedImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText && selectedImages.length === 0) return;
    if (!conversation?.id) return;

    try {
      setIsSending(true);

      // Upload images first if any (convert local URIs to Cloudinary URLs)
      let cloudinaryUrls: string[] = [];
      if (selectedImages.length > 0) {
        console.log(`📤 Uploading ${selectedImages.length} image(s) before sending message...`);
        try {
          // Show upload progress (could add progress indicator here)
          cloudinaryUrls = await uploadChatImages(selectedImages);
          console.log('✅ All images uploaded successfully:', cloudinaryUrls.length);
        } catch (uploadError: any) {
          console.error('❌ Image upload failed:', uploadError);
          Alert.alert(
            'Lỗi upload ảnh', 
            uploadError.message || 'Không thể tải ảnh lên. Vui lòng kiểm tra kết nối mạng và thử lại.'
          );
          setIsSending(false);
          return;
        }
      }

      // Create temporary message for optimistic UI (show uploaded URLs)
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content: trimmedText,
        images: cloudinaryUrls, // Use Cloudinary URLs instead of local URIs
        sender: {
          _id: user?.id || '',
          displayName: user?.name || '',
          avatar: user?.avatar,
        },
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      // Add to UI immediately (optimistic update)
      setMessages((prev) => [tempMessage, ...prev]);
      setInputText('');
      setSelectedImages([]);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

      // Send to backend with Cloudinary URLs
      const sentMessage = await sendMessage(conversation.id, {
        content: trimmedText,
        images: cloudinaryUrls,
      });

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempMessage.id ? sentMessage : msg))
      );

      // Emit socket event to receiver
      if (socket) {
        // Determine receiver ID based on user role
        const isExpert = user?.roles?.includes('expert');
        const receiverId = isExpert ? conversation.userId : (conversation.expertId || expertId);
        
        console.log('🔌 Socket emit debug:', {
          socketExists: !!socket,
          socketConnected: (socket as any).connected,
          isConnectedState: isConnected,
          conversationId: conversation.id,
          messageId: sentMessage.id,
          receiverId,
          senderRole: isExpert ? 'expert' : 'farmer',
        });
        
        if (receiverId) {
          // ✅ Try to emit even if isConnected state is false (might be reconnecting)
          socket.emit('message:send', {
            conversationId: conversation.id,
            messageId: sentMessage.id,
            receiverId,
          });
          console.log('✅ Socket event emitted: message:send');
        } else {
          console.error('❌ No receiverId found!');
        }
      } else {
        console.error('❌ Socket not available!');
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      Alert.alert('Lỗi', error.message || 'Không thể gửi tin nhắn');
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (conversation?.id && socket) {
      socket.emit('conversation:typing', {
        conversationId: conversation.id,
        isTyping: true,
      });

      // Auto-stop typing after 2 seconds
      setTimeout(() => {
        socket.emit('conversation:typing', {
          conversationId: conversation.id,
          isTyping: false,
        });
      }, 2000);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender._id === user?.id;
    const isSending = item.id.startsWith('temp-');

    // Get status icon
    const getStatusIcon = () => {
      if (isSending) {
        return <Ionicons name="time-outline" size={12 * scale} color="#fff" />;
      }
      if (item.isRead) {
        return <Ionicons name="checkmark-done" size={12 * scale} color="#fff" />;
      }
      return <Ionicons name="checkmark" size={12 * scale} color="#fff" />;
    };

    return (
      <View style={[styles.messageContainer, isMine && styles.myMessageContainer]}>
        {!isMine && (
          <View style={styles.senderAvatar}>
            {item.sender.avatar ? (
              <Image source={{ uri: item.sender.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={16 * scale} color="#fff" />
              </View>
            )}
          </View>
        )}

        <View style={styles.messageWrapper}>
          {/* Sender name (for other's messages) */}
          {!isMine && (
            <Text style={[styles.senderName, { fontSize: 12 * scale }]}>
              {item.sender.displayName}
            </Text>
          )}

          {/* Images - No background bubble */}
          {Array.isArray(item.images) && item.images.length > 0 && (
            <View style={styles.messageImages}>
              {item.images.map((img, idx) => (
                <TouchableOpacity key={idx} onPress={() => setViewingImage(img)} activeOpacity={0.8}>
                  <Image 
                    source={{ uri: img }} 
                    style={styles.messageImage} 
                    contentFit="cover"
                    onError={(error) => console.error('❌ Image load error:', img, error)}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Text bubble */}
          {item.content && (
            <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.otherBubble]}>
              <Text style={[styles.messageText, { fontSize: 15 * scale }, isMine && styles.myMessageText]}>
                {item.content}
              </Text>
            </View>
          )}

          {/* Timestamp and Status */}
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, { fontSize: 11 * scale }, isMine && styles.myMessageTime]}>
              {new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isMine && <View style={styles.statusIcon}>{getStatusIcon()}</View>}
          </View>
        </View>

        {isMine && <View style={styles.spacer} />}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <AppHeader showBackButton />

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <Text style={[styles.typingText, { fontSize: 13 * scale }]}>
            Chuyên gia đang nhập...
          </Text>
        </View>
      )}

      {/* Image preview */}
      {selectedImages.length > 0 && (
        <View style={styles.imagePreviewContainer}>
          <FlatList
            horizontal
            data={selectedImages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.imagePreviewItem}>
                <Image source={{ uri: item }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Complete Button - Only for farmers when expert has replied */}
      {conversation?.status === 'answered' && !user?.roles?.includes('expert') && (
        <View style={styles.completeButtonContainer}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={20 * scale} color="#fff" />
            <Text style={[styles.completeButtonText, { fontSize: 15 * scale }]}>
              {t('expertChat.complete', { defaultValue: 'Hoàn thành' })}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handlePickImage}
          disabled={selectedImages.length >= MAX_IMAGES}
        >
          <Ionicons
            name="image"
            size={24 * scale}
            color={selectedImages.length >= MAX_IMAGES ? '#ccc' : '#4CAF50'}
          />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { fontSize: 15 * scale }]}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            handleTyping();
          }}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[styles.sendButton, (isSending || (!inputText.trim() && selectedImages.length === 0)) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isSending || (!inputText.trim() && selectedImages.length === 0)}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20 * scale} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Image Viewer Modal */}
      <Modal visible={!!viewingImage} transparent animationType="fade" onRequestClose={() => setViewingImage(null)}>
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity style={styles.imageViewerClose} onPress={() => setViewingImage(null)} activeOpacity={0.8}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            contentContainerStyle={styles.imageViewerScroll}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {viewingImage && (
              <Image source={{ uri: viewingImage }} style={styles.fullImage} contentFit="contain" />
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Rating Modal */}
      <RatingModal
        visible={ratingModalVisible}
        expertName={expertName}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleRatingSubmit}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    flexDirection: 'row-reverse',
  },
  senderAvatar: {
    marginRight: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageWrapper: {
    maxWidth: '75%',
  },
  senderName: {
    color: '#666',
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  messageBubble: {
    borderRadius: 12,
    padding: 10,
  },
  myBubble: {
    backgroundColor: '#4CAF50',
  },
  otherBubble: {
    backgroundColor: '#fff',
  },
  messageImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0', // Subtle background for loading
  },
  messageText: {
    color: '#333',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    color: '#333',
    fontSize: 11,
  },
  myMessageTime: {
    color: '#333',
  },
  statusIcon: {
    marginLeft: 4,
  },
  spacer: {
    width: 40,
  },
  typingContainer: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  typingText: {
    color: '#999',
    fontStyle: 'italic',
  },
  imagePreviewContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  imagePreviewItem: {
    position: 'relative',
    marginRight: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  imageButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageViewerScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  completeButtonContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

