/**
 * Chatbot Context
 * Manages ChatbotModal visibility globally
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatbotContextType {
  isChatbotVisible: boolean;
  openChatbot: () => void;
  closeChatbot: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within ChatbotProvider');
  }
  return context;
};

interface ChatbotProviderProps {
  children: ReactNode;
}

export const ChatbotProvider: React.FC<ChatbotProviderProps> = ({ children }) => {
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);

  const openChatbot = () => {
    setIsChatbotVisible(true);
  };

  const closeChatbot = () => {
    setIsChatbotVisible(false);
  };

  return (
    <ChatbotContext.Provider value={{ isChatbotVisible, openChatbot, closeChatbot }}>
      {children}
    </ChatbotContext.Provider>
  );
};

