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
      order: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      product: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
      report: 'bg-green-500/20 text-green-500 border-green-500/30',
      document: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
      collection: 'bg-primary/20 text-primary border-primary/30'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-500 border-gray-500/30';
  };

  if (contexts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {contexts.map((context) => {
        const Icon = getIcon(context.type);
        const colorClass = getColor(context.type);

        return (
          <div
            key={context.id}
            className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg border-2
              ${colorClass}
              backdrop-blur-glass shadow-sm hover:shadow-md transition-all
            `}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-base font-medium truncate max-w-[250px]">{context.title}</span>
            <button
              onClick={() => handleRemove(context.id)}
              className="p-1 hover:bg-background/20 rounded transition-colors flex-shrink-0"
              aria-label={`Remove ${context.title}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ContextPills;

