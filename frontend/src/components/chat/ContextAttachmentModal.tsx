/**
 * Context Attachment Modal Component
 */

import React, { useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Tabs } from '../shared/Tabs';
import { useChat } from '../../contexts/ChatContext';
import { useKnowledgeBase } from '../../contexts/KnowledgeBaseContext';
import { AttachedContext } from '../../types/chat';
import CollectionsTab from './attachment-tabs/CollectionsTab';
import OrdersTab from './attachment-tabs/OrdersTab';
import ProductsTab from './attachment-tabs/ProductsTab';
import ReportsTab from './attachment-tabs/ReportsTab';
import DocumentsTab from './attachment-tabs/DocumentsTab';

interface ContextAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContextAttachmentModal: React.FC<ContextAttachmentModalProps> = ({ isOpen, onClose }) => {
  const { attachContext, attachedContext } = useChat();
  const [selectedItems, setSelectedItems] = useState<AttachedContext[]>([]);

  const handleAttach = () => {
    selectedItems.forEach(item => {
      // Check if already attached
      if (!attachedContext.some(ctx => ctx.id === item.id)) {
        attachContext(item);
      }
    });
    setSelectedItems([]);
    onClose();
  };

  const tabs = [
    {
      id: 'collections',
      label: 'Collections',
      content: (
        <CollectionsTab
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
        />
      )
    },
    {
      id: 'orders',
      label: 'Orders',
      content: (
        <OrdersTab
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
        />
      )
    },
    {
      id: 'products',
      label: 'Products',
      content: (
        <ProductsTab
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
        />
      )
    },
    {
      id: 'reports',
      label: 'Reports',
      content: (
        <ReportsTab
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
        />
      )
    },
    {
      id: 'documents',
      label: 'Documents',
      content: (
        <DocumentsTab
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
        />
      )
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attach Context to Chat"
      size="xl"
    >
      <div className="space-y-6">
        <Tabs items={tabs} />
        
        {selectedItems.length > 0 && (
          <div className="flex items-center justify-between pt-6 border-t-2 border-border/50">
            <span className="text-base font-semibold text-foreground">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-base text-foreground/70 hover:text-foreground transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAttach}
                className="px-6 py-3 bg-primary-gradient text-white rounded-modern text-base font-semibold hover:shadow-neon transition-all"
              >
                Attach Selected
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ContextAttachmentModal;

