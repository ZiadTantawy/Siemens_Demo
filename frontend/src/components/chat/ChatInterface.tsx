/**
 * Chat Interface Component with Context Attachment System
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, Paperclip, Database } from 'lucide-react';
import ChatMessage from '../ChatMessage';
import ContextPills from './ContextPills';
import ContextAttachmentModal from './ContextAttachmentModal';
import KnowledgeBaseModal from '../knowledge-base/KnowledgeBaseSidebar';
import { useChat } from '../../contexts/ChatContext';
import { useUI } from '../../contexts/UIContext';
import { ToastContainer } from '../shared/Toast';

const ChatInterface: React.FC = () => {
  const { messages, sendMessage, attachedContext, isLoading } = useChat();
  const { sidebarOpen, toggleSidebar } = useUI();
  const [input, setInput] = useState('');
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const content = input.trim();
    setInput('');
    await sendMessage(content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const LoadingIndicator = () => (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-primary-gradient shadow-neon">
        <Bot className="w-5 h-5" />
      </div>
      <div className="backdrop-blur-glass rounded-modern px-6 py-4 max-w-[80%] animate-fade-in bg-card border border-border/50 shadow-glass">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce-dot-1"></div>
          <div className="w-2 h-2 rounded-full bg-secondary animate-bounce-dot-2"></div>
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce-dot-3"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-mesh-gradient opacity-50 pointer-events-none"></div>
      <div className="absolute w-24 h-24 rounded-full blur-[120px] opacity-60 bg-primary animate-float top-20 left-20"></div>
      <div className="absolute w-24 h-24 rounded-full blur-[120px] opacity-60 bg-secondary animate-float-delayed bottom-20 right-20"></div>

      {/* Header */}
      <header className="sticky top-0 backdrop-blur-glass bg-card border-b border-border/50 z-10">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center w-14 h-14 bg-primary-gradient rounded-modern shadow-neon">
                <Sparkles className="w-9 h-9 text-white animate-glow-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-primary-gradient bg-clip-text text-transparent">
                  RAG Knowledge Base Chat
                </h1>
                <p className="text-foreground/70 text-base mt-1">Powered by advanced AI technology</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className={`flex items-center gap-3 px-6 py-3 bg-background/50 border-2 border-border/50 rounded-modern hover:border-primary/50 hover:bg-primary/10 transition-all text-base font-medium ${
                sidebarOpen ? 'bg-primary/20 border-primary/30' : ''
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Knowledge Base</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col max-w-5xl mx-auto px-8 py-10">
        <div className="flex-1 space-y-6 overflow-y-auto scrollbar-hide">
          {messages.map((message: { id: string; role: 'user' | 'assistant'; content: string; sources?: any[]; confidence?: number }) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              sources={message.sources}
              confidence={message.confidence}
            />
          ))}
          {isLoading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Context Display */}
        {attachedContext.length > 0 && (
          <div className="mb-6">
            <p className="text-base font-medium text-foreground/70 mb-3">Context for this chat:</p>
            <ContextPills contexts={attachedContext} />
          </div>
        )}

        {/* Input Area */}
        <div className="backdrop-blur-glass bg-card border-t-2 border-border/50 p-6 mt-8 rounded-t-modern">
          <div className="flex gap-4 items-end">
            <button
              onClick={() => setShowAttachmentModal(true)}
              className="p-3 hover:bg-background/50 rounded-modern transition-colors flex-shrink-0 border-2 border-border/50 hover:border-primary/50"
              title="Attach context"
            >
              <Paperclip className="w-6 h-6 text-foreground/70" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
              className="w-full bg-background/50 backdrop-blur-sm border-2 border-border/50 rounded-modern px-5 py-4 text-base text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none min-h-[100px]"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-primary-gradient text-white px-8 py-4 rounded-modern text-base font-semibold transition-all duration-300 hover:shadow-neon hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center gap-2 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </main>

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal />

      {/* Attachment Modal */}
      <ContextAttachmentModal
        isOpen={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default ChatInterface;

