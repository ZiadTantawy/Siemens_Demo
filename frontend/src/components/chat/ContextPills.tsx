/**
 * Context Pills Component - Display attached context in chat
 */

import React from 'react';
import { X, Package, ShoppingBag, BarChart3, FileText, BookOpen } from 'lucide-react';
import { AttachedContext } from '../../types/chat';
import { useChat } from '../../contexts/ChatContext';

interface ContextPillsProps {
  contexts: AttachedContext[];
  onRemove?: (id: string) => void;
}

const ContextPills: React.FC<ContextPillsProps> = ({ contexts, onRemove }) => {
  const { removeContext } = useChat();

  const handleRemove = (id: string) => {
    if (onRemove) {
      onRemove(id);
    } else {
      removeContext(id);
    }
  };

  const getIcon = (type: AttachedContext['type']) => {
    const icons = {
      order: Package,
      product: ShoppingBag,
      report: BarChart3,
      document: FileText,
      collection: BookOpen
    };
    return icons[type] || FileText;
  };

  const getColor = (type: AttachedContext['type']) => {
    const colors = {
      order: 'bg-white/15 text-white border-white/40',
      product: 'bg-white/15 text-white border-white/40',
      report: 'bg-white/15 text-white border-white/40',
      document: 'bg-white/15 text-white border-white/40',
      collection: 'bg-white/15 text-white border-white/40'
    };
    return colors[type] || 'bg-white/15 text-white border-white/40';
  };

  if (contexts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {contexts.map((context) => {
        const Icon = getIcon(context.type);
        const colorClass = getColor(context.type);

        return (
          <div
            key={context.id}
            className={`
              flex items-center gap-3 px-5 py-3 rounded-lg border-2
              ${colorClass}
              backdrop-blur-sm shadow-dank hover:shadow-lg hover:bg-white/20 transition-all
            `}
          >
            <Icon className="w-5 h-5 flex-shrink-0 text-white" />
            <span className="text-base font-semibold truncate max-w-[250px] text-white">{context.title}</span>
            <button
              onClick={() => handleRemove(context.id)}
              className="p-1 hover:bg-white/30 rounded transition-colors flex-shrink-0 ml-1"
              aria-label={`Remove ${context.title}`}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ContextPills;

