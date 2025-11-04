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
          w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 border-2
          ${isUser ? 'bg-white text-black border-white' : 'bg-white text-black border-white shadow-dank'}
        `}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      <div
        className={`
          rounded-lg px-6 py-4 max-w-[80%] animate-fade-in border-2
          ${isUser ? 'bg-white/10 border-white/20 text-white' : 'bg-white/10 border-white/20 text-white backdrop-blur-sm'}
        `}
      >
        <p className="text-base text-white leading-relaxed whitespace-pre-wrap font-medium">{content}</p>
        
        {!isUser && confidence !== undefined && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs text-white/60 font-medium">
              Confidence: <span className="font-bold">{(confidence * 100).toFixed(1)}%</span>
            </p>
          </div>
        )}
        
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">Sources:</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20 text-xs"
                >
                  <span className="text-white/80">{source.title}</span>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-white/80 transition-colors"
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

