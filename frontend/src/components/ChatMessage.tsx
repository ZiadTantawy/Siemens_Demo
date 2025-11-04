import React from 'react';
import { Bot, User, ExternalLink } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    id: string;
    title: string;
    type: string;
    url?: string;
  }>;
  confidence?: number;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, sources, confidence }) => {
  const isUser = role === 'user';

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0
          ${isUser ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-primary-gradient shadow-neon'}
        `}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      <div
        className={`
          backdrop-blur-glass rounded-modern px-6 py-4 max-w-[80%] animate-fade-in
          ${isUser ? 'bg-blue-500/10 border-blue-500/20' : 'bg-card border border-border/50 shadow-glass'}
        `}
      >
        <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
        
        {!isUser && confidence !== undefined && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <p className="text-xs text-foreground/60">
              Confidence: <span className="font-semibold">{(confidence * 100).toFixed(1)}%</span>
            </p>
          </div>
        )}
        
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-xs font-semibold text-foreground/70 mb-2">Sources:</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-background/50 rounded-lg border border-border/30 text-xs"
                >
                  <span className="text-foreground/70">{source.title}</span>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;

