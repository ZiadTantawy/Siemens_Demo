/**
 * Collections Attachment Tab
 */

import React, { useState, useMemo } from 'react';
import { BookOpen, Clock } from 'lucide-react';
import { useKnowledgeBase } from '../../../contexts/KnowledgeBaseContext';
import { AttachedContext } from '../../../types/chat';
import { formatRelativeTime } from '../../../utils/dateUtils';

interface CollectionsTabProps {
  selectedItems: AttachedContext[];
  onSelectionChange: (items: AttachedContext[]) => void;
}

const CollectionsTab: React.FC<CollectionsTabProps> = ({ selectedItems, onSelectionChange }) => {
  const { knowledgeCollections } = useKnowledgeBase();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCollections = useMemo(() => {
    if (!searchQuery) return knowledgeCollections;
    const query = searchQuery.toLowerCase();
    return knowledgeCollections.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query)
    );
  }, [knowledgeCollections, searchQuery]);

  const recentlyUsed = [...knowledgeCollections]
    .sort((a, b) => {
      const aTime = a.lastUsedAt?.getTime() || 0;
      const bTime = b.lastUsedAt?.getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 3);

  const toggleSelection = (collectionId: string, collectionName: string) => {
    const itemId = `collection_${collectionId}`;
    const isSelected = selectedItems.some(item => item.id === itemId);

    if (isSelected) {
      onSelectionChange(selectedItems.filter(item => item.id !== itemId));
    } else {
      onSelectionChange([
        ...selectedItems,
        {
          id: itemId,
          type: 'collection',
          sourceId: collectionId,
          title: collectionName
        }
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <input
        type="text"
        placeholder="Search collections..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-5 py-4 bg-background/50 border-2 border-border/50 rounded-modern text-base text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
      />

      {recentlyUsed.length > 0 && (
        <div>
          <p className="text-base font-semibold text-foreground/70 mb-4">Recently Used</p>
          <div className="space-y-3">
            {recentlyUsed.map((collection) => {
              const itemId = `collection_${collection.id}`;
              const isSelected = selectedItems.some(item => item.id === itemId);

              return (
                <label
                  key={collection.id}
                  className={`flex items-center gap-4 p-5 border-2 rounded-modern cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/20 border-primary/30 shadow-lg'
                      : 'bg-background/30 border-border/50 hover:border-primary/30 hover:bg-background/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(collection.id, collection.name)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <BookOpen className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-foreground mb-1">{collection.name}</p>
                    {collection.description && (
                      <p className="text-base text-foreground/70 truncate mb-2">{collection.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-foreground/60">
                      <span>{collection.items.length} items</span>
                      {collection.lastUsedAt && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatRelativeTime(collection.lastUsedAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-base font-semibold text-foreground/70 mb-4">All Collections</p>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
          {filteredCollections.length === 0 ? (
            <p className="text-center py-8 text-foreground/60">No collections found</p>
          ) : (
            filteredCollections.map((collection) => {
              const itemId = `collection_${collection.id}`;
              const isSelected = selectedItems.some(item => item.id === itemId);

              return (
                <label
                  key={collection.id}
                  className={`flex items-center gap-4 p-5 border-2 rounded-modern cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/20 border-primary/30 shadow-lg'
                      : 'bg-background/30 border-border/50 hover:border-primary/30 hover:bg-background/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(collection.id, collection.name)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <BookOpen className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-foreground mb-1">{collection.name}</p>
                    {collection.description && (
                      <p className="text-base text-foreground/70 truncate mb-2">{collection.description}</p>
                    )}
                    <p className="text-sm text-foreground/60">{collection.items.length} items</p>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionsTab;

