/**
 * Knowledge Base Modal Window Component
 */

import React, { useState } from 'react';
import { X, Database, FileText, BookOpen, Users } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';
import { Tabs } from '../shared/Tabs';
import ShopifyDataPanel from './ShopifyDataPanel';
import DocumentsPanel from './DocumentsPanel';
import CollectionsPanel from './CollectionsPanel';
import TeamPanel from './TeamPanel';

const KnowledgeBaseModal: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useUI();
  const [activeTab, setActiveTab] = useState(0);

  if (!sidebarOpen) return null;

  const tabs = [
    {
      id: 'shopify',
      label: 'Shopify Data',
      icon: <Database className="w-5 h-5" />,
      content: <ShopifyDataPanel />
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <FileText className="w-5 h-5" />,
      content: <DocumentsPanel />
    },
    {
      id: 'collections',
      label: 'Collections',
      icon: <BookOpen className="w-5 h-5" />,
      content: <CollectionsPanel />
    },
    {
      id: 'team',
      label: 'Team',
      icon: <Users className="w-5 h-5" />,
      content: <TeamPanel />
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-[95vw] max-h-[95vh] bg-card border border-border/50 shadow-glass backdrop-blur-glass rounded-modern flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-gradient rounded-modern flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-primary-gradient bg-clip-text text-transparent">
                Knowledge Base
              </h2>
              <p className="text-sm text-foreground/60 mt-1">Manage your knowledge sources and collections</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-3 hover:bg-background/50 rounded-lg transition-colors"
            aria-label="Close knowledge base"
          >
            <X className="w-6 h-6 text-foreground/70" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full p-8 overflow-y-auto">
            <Tabs items={tabs} defaultIndex={activeTab} onChange={setActiveTab} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseModal;

