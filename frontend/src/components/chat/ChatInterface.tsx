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
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold flex-shrink-0 bg-white border-2 border-white shadow-dank">
        <Bot className="w-5 h-5" />
      </div>
      <div className="bg-white/10 border-2 border-white/20 rounded-lg px-6 py-4 max-w-[80%] animate-fade-in backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-bounce-dot-1"></div>
          <div className="w-2 h-2 rounded-full bg-white animate-bounce-dot-2"></div>
          <div className="w-2 h-2 rounded-full bg-white animate-bounce-dot-3"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-black pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 bg-black border-b-2 border-white/10 z-10">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 bg-white border-2 border-white rounded-lg shadow-dank">
                <Sparkles className="w-10 h-10 text-black" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs uppercase tracking-widest text-white/60 font-bold">EST. 2022</span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tight leading-none">
                  Dank n'
                  <br />
                  <span className="relative">Drip.</span>
                </h1>
                <p className="text-white/60 text-sm mt-2 font-medium uppercase tracking-wider">Knowledge Base AI</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className={`flex items-center gap-3 px-6 py-3.5 bg-white text-black border-2 border-white rounded-lg hover:bg-white/90 transition-all text-sm font-bold uppercase tracking-wider ${
                sidebarOpen ? 'bg-white/90' : ''
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Knowledge Base</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col max-w-6xl mx-auto px-8 py-10">
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
          <div className="mb-6 pt-6 border-t border-white/10">
            <p className="text-sm font-bold text-white/80 mb-4 uppercase tracking-wider">Attached Context:</p>
            <ContextPills contexts={attachedContext} />
          </div>
        )}

        {/* Input Area */}
        <div className="bg-black border-t-2 border-white/10 p-6 mt-8">
          <div className="flex gap-4 items-end">
            <button
              onClick={() => setShowAttachmentModal(true)}
              className="p-3 bg-white text-black hover:bg-white/90 rounded-lg transition-all flex-shrink-0 border-2 border-white shadow-dank hover:shadow-lg"
              title="Attach context"
            >
              <Paperclip className="w-6 h-6 text-black" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
              className="w-full bg-white/5 backdrop-blur-sm border-2 border-white/20 rounded-lg px-5 py-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 resize-none min-h-[100px]"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-white text-black px-8 py-4 rounded-lg text-sm font-black uppercase tracking-wider transition-all duration-300 hover:bg-white/90 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 flex-shrink-0 border-2 border-white shadow-dank hover:shadow-lg"
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

