/**
 * FloatingChatButton - Floating chat button with welcome message
 * Draggable button that can be moved to any position on screen
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
  Dimensions,
  PanResponder,
    StyleSheet,
    Text,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STORAGE_KEY = 'floating_chat_button_position';
const BUTTON_SIZE = 60;
const MESSAGE_WIDTH = 220;
const SNAP_THRESHOLD = 100; // Distance from edge to snap

interface FloatingChatButtonProps {
  onPress: () => void;
}

interface Position {
  x: number;
  y: number;
}

export default function FloatingChatButton({ onPress }: FloatingChatButtonProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showMessage, setShowMessage] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-20));

  // Position state for draggable
  const pan = useRef(new Animated.ValueXY()).current;
  const [position, setPosition] = useState<Position | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Load saved position on mount
  useEffect(() => {
    loadPosition();
  }, []);

  // Show welcome message animation
  useEffect(() => {
    if (!position) return; // Wait for position to load

    // Show animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide after 3 seconds
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowMessage(false);
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [position]);

  // Load saved position from AsyncStorage
  const loadPosition = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedPosition = JSON.parse(saved);
        setPosition(savedPosition);
        pan.setValue({ x: savedPosition.x, y: savedPosition.y });
      } else {
        // Default position: bottom right corner
        const defaultPosition = {
          x: screenWidth - BUTTON_SIZE - 16,
          y: screenHeight - insets.bottom - BUTTON_SIZE - 80,
        };
        setPosition(defaultPosition);
        pan.setValue(defaultPosition);
      }
    } catch (error) {
      console.error('Failed to load button position:', error);
      // Fallback to default position
      const defaultPosition = {
        x: screenWidth - BUTTON_SIZE - 16,
        y: screenHeight - insets.bottom - BUTTON_SIZE - 80,
      };
      setPosition(defaultPosition);
      pan.setValue(defaultPosition);
    }
  };

  // Save position to AsyncStorage
  const savePosition = async (newPosition: Position) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPosition));
      setPosition(newPosition);
    } catch (error) {
      console.error('Failed to save button position:', error);
    }
  };

  // Snap to nearest edge
  const snapToEdge = (x: number, y: number): Position => {
    const leftDistance = x;
    const rightDistance = screenWidth - x - BUTTON_SIZE;
    
    // Snap to left or right edge
    const snappedX = leftDistance < rightDistance ? 16 : screenWidth - BUTTON_SIZE - 16;
    
    // Keep Y within safe bounds
    const minY = insets.top + 20;
    const maxY = screenHeight - insets.bottom - BUTTON_SIZE - 20;
    const snappedY = Math.max(minY, Math.min(maxY, y));
    
    return { x: snappedX, y: snappedY };
  };

  // PanResponder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start dragging if moved more than 5px
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Set offset to current position
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        
        // Get final position
        const finalX = (pan.x as any)._value;
        const finalY = (pan.y as any)._value;
        
        // Snap to edge
        const snappedPosition = snapToEdge(finalX, finalY);
        
        // Animate to snapped position
        Animated.spring(pan, {
          toValue: snappedPosition,
          useNativeDriver: false,
          friction: 7,
        }).start();
        
        // Save position
        savePosition(snappedPosition);
      },
    })
  ).current;

  // Don't render until position is loaded
  if (!position) {
    return null;
  }

  // Determine if button is on right side (to show message on left)
  const isOnRightSide = position.x > screenWidth / 2;
  const messageStyle = isOnRightSide ? styles.messageContainerLeft : styles.messageContainerRight;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: 0.85, // Set opacity to 0.85
          flexDirection: isOnRightSide ? 'row-reverse' : 'row', // Reverse order when on right
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Welcome Message - Show on left if button is on right, otherwise on right */}
      {showMessage && (
        <Animated.View
          style={[
            messageStyle,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <Text style={styles.messageText} numberOfLines={3}>
            {t('chatbot.welcomeMessage', {
              defaultValue: 'Xin chào, mình là Bác sĩ Lúa, rất vui khi được hỗ trợ bạn',
            })}
          </Text>
        </Animated.View>
      )}

      {/* Chat Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Image
          source={require('@/assets/images/logo-img.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  messageContainerRight: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    maxWidth: Math.min(220, Dimensions.get('window').width - 100), // Ensure it doesn't overflow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  messageContainerLeft: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 12,
    maxWidth: Math.min(220, Dimensions.get('window').width - 100), // Ensure it doesn't overflow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  messageText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    lineHeight: 18,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 36,
    height: 36,
  },
});

