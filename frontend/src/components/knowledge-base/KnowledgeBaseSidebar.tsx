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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-[95vw] max-h-[95vh] bg-black border-2 border-white/20 shadow-dank backdrop-blur-sm rounded-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b-2 border-white/10 flex-shrink-0 bg-black">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white border-2 border-white rounded-lg flex items-center justify-center shadow-dank">
              <Database className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                Knowledge Base
              </h2>
              <p className="text-sm text-white/60 mt-1 font-medium uppercase tracking-wider">Manage your knowledge sources and collections</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-3 hover:bg-white/10 rounded-lg transition-colors border-2 border-white/20 hover:border-white/40"
            aria-label="Close knowledge base"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0 bg-black">
          <div className="h-full p-8 overflow-y-auto">
            <Tabs items={tabs} defaultIndex={activeTab} onChange={setActiveTab} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseModal;

