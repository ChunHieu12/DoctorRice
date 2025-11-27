/**
 * TextSizeContext
 * Manage global text size for the entire app
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const TEXT_SIZE_KEY = 'app_text_size';

export type TextSize = 'small' | 'medium' | 'large';

interface TextSizeContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => Promise<void>;
  scale: number; // Scale multiplier for font sizes
}

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined);

const TEXT_SIZE_SCALES: Record<TextSize, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.15,
};

export const TextSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize, setTextSizeState] = useState<TextSize>('medium');

  useEffect(() => {
    loadTextSize();
  }, []);

  const loadTextSize = async () => {
    try {
      const saved = await AsyncStorage.getItem(TEXT_SIZE_KEY);
      if (saved && ['small', 'medium', 'large'].includes(saved)) {
        setTextSizeState(saved as TextSize);
      }
    } catch (error) {
      console.error('Failed to load text size:', error);
    }
  };

  const setTextSize = async (size: TextSize) => {
    try {
      await AsyncStorage.setItem(TEXT_SIZE_KEY, size);
      setTextSizeState(size);
    } catch (error) {
      console.error('Failed to save text size:', error);
    }
  };

  const scale = TEXT_SIZE_SCALES[textSize];

  return (
    <TextSizeContext.Provider value={{ textSize, setTextSize, scale }}>
      {children}
    </TextSizeContext.Provider>
  );
};

export const useTextSize = () => {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error('useTextSize must be used within TextSizeProvider');
  }
  return context;
};

