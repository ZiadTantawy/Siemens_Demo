/**
 * Collections Panel Component
 */

import React, { useState } from 'react';
import { BookOpen, Plus, ChevronDown, ChevronRight, Trash2, Clock } from 'lucide-react';
import { useKnowledgeBase } from '../../contexts/KnowledgeBaseContext';
import { useUI } from '../../contexts/UIContext';
import { Collection } from '../../types/collections';
import { formatRelativeTime } from '../../utils/dateUtils';
import { Modal } from '../shared/Modal';
import { collectionsApi } from '../../services/api/collectionsApi';

const CollectionsPanel: React.FC = () => {
  const { knowledgeCollections, createCollection, deleteCollection, fetchCollections } = useKnowledgeBase();
  const { showToast } = useUI();
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCollections(newExpanded);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) {
      return;
    }

    try {
      await deleteCollection(id);
      showToast('Collection deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete collection', 'error');
    }
  };

  const recentlyUsed = [...knowledgeCollections]
    .sort((a, b) => {
      const aTime = a.lastUsedAt?.getTime() || 0;
      const bTime = b.lastUsedAt?.getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-border/50">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Collections</h3>
          <p className="text-base text-foreground/70">
            <span className="font-semibold text-foreground">{knowledgeCollections.length}</span> collections
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3 px-6 py-3 bg-primary-gradient text-white rounded-modern text-base font-semibold hover:shadow-neon transition-all"
        >
          <Plus className="w-5 h-5" />
          New Collection
        </button>
      </div>

      {/* Recently Used */}
      {recentlyUsed.length > 0 && (
        <div>
          <p className="text-base font-semibold text-foreground/70 mb-3">Recently Used</p>
          <div className="space-y-3">
            {recentlyUsed.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                isExpanded={expandedCollections.has(collection.id)}
                onToggleExpand={() => toggleExpand(collection.id)}
                onDelete={() => handleDelete(collection.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Collections */}
      <div>
        <p className="text-base font-semibold text-foreground/70 mb-3">All Collections</p>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {knowledgeCollections.length === 0 ? (
            <div className="text-center py-8 text-foreground/60">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No collections yet</p>
              <p className="text-sm">Create a collection to get started</p>
            </div>
          ) : (
            knowledgeCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                isExpanded={expandedCollections.has(collection.id)}
                onToggleExpand={() => toggleExpand(collection.id)}
                onDelete={() => handleDelete(collection.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCollectionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (name, description, items) => {
            await createCollection({
              name,
              description,
              items,
              isDynamic: false,
              tags: [],
              createdBy: 'current_user'
            });
            showToast('Collection created successfully', 'success');
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

const CollectionCard: React.FC<{
  collection: Collection;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
}> = ({ collection, isExpanded, onToggleExpand, onDelete }) => {
  const getItemTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      order: 'Orders',
      product: 'Products',
      report: 'Reports',
      document: 'Documents'
    };
    return labels[type] || type;
  };

  const getItemCount = (type: string) => {
    return collection.items.filter(item => item.type === type).length;
  };

  return (
    <div className="border-2 border-border/50 rounded-modern bg-background/30 hover:border-primary/50 hover:bg-background/40 transition-all shadow-sm hover:shadow-md">
      <div className="p-5 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-3 w-full text-left"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-foreground/60 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-foreground/60 flex-shrink-0" />
            )}
            <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-foreground truncate mb-1">{collection.name}</p>
              {collection.description && (
                <p className="text-base text-foreground/70 truncate mb-2">{collection.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-foreground/60">
                <span>{collection.items.length} items</span>
                {collection.usageCount && <span>• Used {collection.usageCount} times</span>}
                {collection.lastUsedAt && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatRelativeTime(collection.lastUsedAt)}
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>
        <button
          onClick={onDelete}
          className="p-3 hover:bg-red-500/10 rounded-modern transition-colors ml-3 border-2 border-transparent hover:border-red-500/30"
        >
          <Trash2 className="w-5 h-5 text-foreground/60 hover:text-red-500" />
        </button>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-0 border-t-2 border-border/50 mt-3">
          <div className="space-y-3 mt-4">
            {['order', 'product', 'report', 'document'].map((type) => {
              const count = getItemCount(type);
              if (count === 0) return null;
              return (
                <div key={type} className="flex items-center justify-between text-base">
                  <span className="text-foreground/70">{getItemTypeLabel(type)}</span>
                  <span className="font-bold text-foreground">{count}</span>
                </div>
              );
            })}
            {collection.tags && collection.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-4">
                {collection.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-primary/20 text-primary rounded-lg font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CreateCollectionModal: React.FC<{
  onClose: () => void;
  onCreate: (name: string, description: string, items: any[]) => void;
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      return;
    }
    onCreate(name, description, []);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create New Collection">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Collection name"
            className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-modern text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this collection..."
            rows={3}
            className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-modern text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-2 bg-primary-gradient text-white rounded-modern font-semibold hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Collection
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CollectionsPanel;

