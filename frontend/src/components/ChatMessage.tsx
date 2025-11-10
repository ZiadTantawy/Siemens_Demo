import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, ExternalLink } from 'lucide-react';
import MarketingChart from './charts/MarketingChart';

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

  // Don't render empty assistant messages (they're handled by LoadingIndicator)
  if (role === 'assistant' && !content.trim()) {
    return null;
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0
          ${isUser ? 'bg-white text-black' : 'bg-white text-black'}
        `}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={`
          rounded-lg px-4 py-3 animate-fade-in flex-1
          ${isUser 
            ? 'bg-white/10 text-white max-w-[85%] ml-auto' 
            : 'bg-white/10 text-white max-w-[90%]'}
        `}
      >
        {role === 'assistant' ? (
          <div className="prose prose-invert prose-sm max-w-none text-base text-white leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="text-white mb-3 last:mb-0 leading-relaxed">{children}</p>,
                h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-3 mt-5 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-2 mt-4 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold text-white mb-2 mt-3 first:mt-0">{children}</h3>,
                h4: ({ children }) => <h4 className="text-base font-bold text-white mb-2 mt-2 first:mt-0">{children}</h4>,
                ul: ({ children }) => <ul className="list-disc list-inside text-white mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside text-white mb-3 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-white leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({ children }) => <em className="italic text-white">{children}</em>,
                code: ({ children, className, ...props }: any) => {
                  const isInline = !className || !className.includes('language-');
                  
                  // Check if it's a chart code block
                  if (className && className.includes('language-chart')) {
                    try {
                      // Handle both string and array children from react-markdown
                      const content = Array.isArray(children) 
                        ? children.join('') 
                        : String(children);
                      const cleanedContent = content.replace(/\n/g, '').trim();
                      
                      // Only render chart if JSON is complete (has closing brace)
                      if (!cleanedContent.endsWith('}')) {
                        return null; // Don't render incomplete chart JSON
                      }
                      
                      const chartData = JSON.parse(cleanedContent);
                      // Validate chart data structure
                      if (chartData.type && chartData.title && chartData.data && chartData.dataKey) {
                        return <MarketingChart chart={chartData} />;
                      }
                      return null;
                    } catch (e) {
                      // If JSON is incomplete or invalid, don't render anything yet
                      return null;
                    }
                  }
                  
                  return isInline ? (
                    <code className="bg-white/20 text-white px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                  ) : (
                    <code className="block bg-white/10 text-white p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3" {...props}>{children}</code>
                  );
                },
                pre: ({ children }) => <pre className="bg-white/10 text-white p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3">{children}</pre>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-white/40 pl-4 italic text-white/90 mb-3">{children}</blockquote>,
                a: ({ children, href }) => <a href={href} className="text-white underline hover:text-white/80" target="_blank" rel="noopener noreferrer">{children}</a>,
                hr: () => <hr className="border-white/20 my-3" />,
                table: ({ children }) => <table className="border-collapse border border-white/20 mb-3 w-full">{children}</table>,
                th: ({ children }) => <th className="border border-white/20 px-4 py-2 bg-white/10 text-white font-bold text-left">{children}</th>,
                td: ({ children }) => <td className="border border-white/20 px-4 py-2 text-white">{children}</td>,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-base text-white leading-relaxed whitespace-pre-wrap">{content}</p>
        )}
        
        
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs font-semibold text-white/70 mb-2">Sources:</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-white/10 rounded text-xs"
                >
                  <span className="text-white/70">{source.title}</span>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-white transition-colors"
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

