import React from 'react';
import { Bot, User, FileText, Globe, TrendingUp } from 'lucide-react';

interface Source {
  type: 'knowledge_base' | 'web';
  filename?: string;
  page?: any;
  chunk_id?: number;
  url?: string;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  confidence?: number;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, sources, confidence }) => {
  const isUser = role === 'user';

  // Parse content for inline citations [1], [2], etc.
  const renderContentWithCitations = (text: string) => {
    // Split by citation pattern [number]
    const parts = text.split(/(\[\d+\])/g);
    
    return parts.map((part, index) => {
      // Check if this part is a citation like [1], [2], etc.
      const citationMatch = part.match(/\[(\d+)\]/);
      if (citationMatch) {
        const citationNum = citationMatch[1];
        return (
          <sup 
            key={index} 
            className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full mx-0.5 cursor-help hover:bg-primary/80 transition-colors"
            title={sources && sources[parseInt(citationNum) - 1] 
              ? `Source: ${sources[parseInt(citationNum) - 1].filename || sources[parseInt(citationNum) - 1].url}` 
              : 'Source citation'}
          >
            {citationNum}
          </sup>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
        isUser 
          ? 'bg-gradient-to-br from-secondary to-accent' 
          : 'bg-primary-gradient shadow-neon'
      }`}>
        {isUser ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>

      {/* Message Bubble */}
      <div className={`backdrop-blur-glass rounded-modern px-6 py-4 max-w-[80%] animate-fade-in ${
        isUser 
          ? 'bg-primary/20 border border-primary/30 shadow-glass' 
          : 'bg-card border border-border/50 shadow-glass'
      }`}>
        <div className="text-foreground leading-relaxed whitespace-pre-wrap">
          {!isUser && sources ? renderContentWithCitations(content) : content}
        </div>
        
        {/* Citations Section */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Sources</span>
            </div>
            <div className="space-y-2">
              {sources.map((source, idx) => (
                <div key={idx} className="text-xs bg-background/50 rounded-lg p-2 border border-border/30">
                  {source.type === 'knowledge_base' ? (
                    <div className="flex items-start gap-2">
                      <FileText className="w-3 h-3 text-secondary mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">{source.filename || 'Document'}</span>
                        {source.page && (
                          <span className="text-foreground/60"> • Page {source.page}</span>
                        )}
                        {source.chunk_id !== undefined && (
                          <span className="text-foreground/60"> • Chunk {source.chunk_id}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Globe className="w-3 h-3 text-accent mt-0.5 flex-shrink-0" />
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent/80 underline break-all"
                      >
                        {source.url}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Confidence Score */}
        {!isUser && confidence !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-secondary" />
            <div className="flex-1 bg-background/50 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-500"
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className="text-xs text-foreground/60 font-medium">
              {(confidence * 100).toFixed(0)}% confident
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
