/**
 * Chat Context for managing chat state and context attachments
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Message, AttachedContext, ContextTemplate } from '../types/chat';
import { apiCall, API_CONFIG } from '../config/api';

interface ChatContextType {
  // Current chat
  currentChatId: string;
  messages: Message[];
  attachedContext: AttachedContext[];
  isLoading: boolean;
  
  // Templates
  templates: ContextTemplate[];
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  attachContext: (context: AttachedContext) => void;
  removeContext: (contextId: string) => void;
  clearContext: () => void;
  saveTemplate: (name: string, description?: string) => void;
  loadTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => void;
  setCurrentChat: (chatId: string) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [currentChatId, setCurrentChatId] = useState<string>('default');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [attachedContext, setAttachedContext] = useState<AttachedContext[]>([]);
  const [templates, setTemplates] = useState<ContextTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Prepare context IDs for API
      const contextIds = attachedContext.map(ctx => ({
        type: ctx.type,
        id: ctx.sourceId
      }));
      
      const response = await apiCall(API_CONFIG.ENDPOINTS.CHAT, {
        method: 'POST',
        body: JSON.stringify({
          text: content.trim(),
          context: contextIds,
          chat_id: currentChatId
        })
      });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message || 'Sorry, I encountered an error processing your request.',
        sources: response.sources || [],
        confidence: response.confidence,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting to the server. Please make sure the backend is running.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [attachedContext, currentChatId]);
  
  const attachContext = useCallback((context: AttachedContext) => {
    setAttachedContext(prev => {
      // Check if already attached
      if (prev.some(ctx => ctx.id === context.id)) {
        return prev;
      }
      return [...prev, context];
    });
  }, []);
  
  const removeContext = useCallback((contextId: string) => {
    setAttachedContext(prev => prev.filter(ctx => ctx.id !== contextId));
  }, []);
  
  const clearContext = useCallback(() => {
    setAttachedContext([]);
  }, []);
  
  const saveTemplate = useCallback((name: string, description?: string) => {
    const template: ContextTemplate = {
      id: `template_${Date.now()}`,
      name,
      description,
      context: [...attachedContext],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTemplates(prev => [...prev, template]);
  }, [attachedContext]);
  
  const loadTemplate = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setAttachedContext([...template.context]);
    }
  }, [templates]);
  
  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  }, []);
  
  const setCurrentChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
    // In a real app, you'd load chat history here
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: new Date()
      }
    ]);
    setAttachedContext([]);
  }, []);
  
  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: new Date()
      }
    ]);
  }, []);
  
  return (
    <ChatContext.Provider
      value={{
        currentChatId,
        messages,
        attachedContext,
        templates,
        isLoading,
        sendMessage,
        attachContext,
        removeContext,
        clearContext,
        saveTemplate,
        loadTemplate,
        deleteTemplate,
        setCurrentChat,
        clearMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

