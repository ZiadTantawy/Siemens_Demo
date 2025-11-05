/**
 * Collections Panel Component
 */

import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, ChevronDown, ChevronRight, Trash2, Clock, Edit, Package, ShoppingBag, BarChart3, FileText, X } from 'lucide-react';
import { useKnowledgeBase } from '../../contexts/KnowledgeBaseContext';
import { useUI } from '../../contexts/UIContext';
import { Collection, CollectionItem, CollectionItemType } from '../../types/collections';
import { formatRelativeTime } from '../../utils/dateUtils';
import { collectionsApi } from '../../services/api/collectionsApi';

const CollectionsPanel: React.FC = () => {
  const { knowledgeCollections, createCollection, updateCollection, deleteCollection, fetchCollections } = useKnowledgeBase();
  const { showToast } = useUI();
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

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
                onEdit={() => setEditingCollection(collection)}
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
                onEdit={() => setEditingCollection(collection)}
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

      {/* Edit Modal */}
      {editingCollection && (
        <EditCollectionModal
          collection={editingCollection}
          onClose={() => setEditingCollection(null)}
          onUpdate={async (name, description, items) => {
            await updateCollection(editingCollection.id, {
              name,
              description,
              items
            });
            showToast('Collection updated successfully', 'success');
            setEditingCollection(null);
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
  onEdit: () => void;
  onDelete: () => void;
}> = ({ collection, isExpanded, onToggleExpand, onEdit, onDelete }) => {
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
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-3 hover:bg-primary/10 rounded-modern transition-colors border-2 border-transparent hover:border-primary/30"
            title="Edit collection"
          >
            <Edit className="w-5 h-5 text-foreground/60 hover:text-primary" />
          </button>
          <button
            onClick={onDelete}
            className="p-3 hover:bg-red-500/10 rounded-modern transition-colors border-2 border-transparent hover:border-red-500/30"
            title="Delete collection"
          >
            <Trash2 className="w-5 h-5 text-foreground/60 hover:text-red-500" />
          </button>
        </div>
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

const EditCollectionModal: React.FC<{
  collection: Collection;
  onClose: () => void;
  onUpdate: (name: string, description: string, items: CollectionItem[]) => void;
}> = ({ collection, onClose, onUpdate }) => {
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description || '');
  const [items, setItems] = useState<CollectionItem[]>(collection.items);

  const handleUpdate = () => {
    if (!name.trim()) {
      return;
    }
    onUpdate(name, description, items);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Window */}
      <div className="relative w-full h-full max-w-[95vw] max-h-[95vh] bg-card border-2 border-border/50 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Window Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-border/50 bg-background/50">
          <h2 className="text-2xl font-bold text-foreground">Edit Collection</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background/70 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-foreground/70" />
          </button>
        </div>

        {/* Window Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Collection name"
                className="w-full px-4 py-3 bg-background/50 border border-border/50 rounded-modern text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this collection..."
                rows={3}
                className="w-full px-4 py-3 bg-background/50 border border-border/50 rounded-modern text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Items</label>
              <CollectionItemSelector
                selectedItems={items}
                onItemsChange={setItems}
              />
            </div>
          </div>
        </div>

        {/* Window Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t-2 border-border/50 bg-background/50">
          <button
            onClick={onClose}
            className="px-6 py-3 text-foreground/70 hover:text-foreground transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={!name.trim()}
            className="px-6 py-3 bg-primary-gradient text-white rounded-modern font-semibold hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Collection
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateCollectionModal: React.FC<{
  onClose: () => void;
  onCreate: (name: string, description: string, items: CollectionItem[]) => void;
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<CollectionItem[]>([]);

  const handleCreate = () => {
    if (!name.trim()) {
      return;
    }
    onCreate(name, description, items);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Window */}
      <div className="relative w-full h-full max-w-[95vw] max-h-[95vh] bg-card border-2 border-border/50 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Window Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-border/50 bg-background/50">
          <h2 className="text-2xl font-bold text-foreground">Create New Collection</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background/70 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-foreground/70" />
          </button>
        </div>

        {/* Window Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Collection name"
                className="w-full px-4 py-3 bg-background/50 border border-border/50 rounded-modern text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this collection..."
                rows={3}
                className="w-full px-4 py-3 bg-background/50 border border-border/50 rounded-modern text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Items</label>
              <CollectionItemSelector
                selectedItems={items}
                onItemsChange={setItems}
              />
            </div>
          </div>
        </div>

        {/* Window Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t-2 border-border/50 bg-background/50">
          <button
            onClick={onClose}
            className="px-6 py-3 text-foreground/70 hover:text-foreground transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-6 py-3 bg-primary-gradient text-white rounded-modern font-semibold hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Collection
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectionsPanel;

// Collection Item Selector Component
const CollectionItemSelector: React.FC<{
  selectedItems: CollectionItem[];
  onItemsChange: (items: CollectionItem[]) => void;
}> = ({ selectedItems, onItemsChange }) => {
  const { orders, products, reports, documents } = useKnowledgeBase();
  const [activeTab, setActiveTab] = useState<CollectionItemType>('product');
  const [searchQuery, setSearchQuery] = useState('');

  const addItem = (type: CollectionItemType, sourceId: string, title: string) => {
    // Check if item already exists
    if (selectedItems.some(item => item.type === type && item.sourceId === sourceId)) {
      return;
    }

    const newItem: CollectionItem = {
      id: `${type}_${sourceId}_${Date.now()}`,
      type,
      sourceId,
      metadata: { title }
    };

    onItemsChange([...selectedItems, newItem]);
  };

  const removeItem = (itemId: string) => {
    onItemsChange(selectedItems.filter(item => item.id !== itemId));
  };

  const getItemTitle = (item: CollectionItem): string => {
    if (item.metadata?.title) return item.metadata.title;
    
    switch (item.type) {
      case 'product':
        return products.find(p => p.id === item.sourceId)?.title || `Product ${item.sourceId}`;
      case 'order':
        return orders.find(o => o.id === item.sourceId)?.orderNumber || `Order ${item.sourceId}`;
      case 'report':
        return reports.find(r => r.id === item.sourceId)?.title || `Report ${item.sourceId}`;
      case 'document':
        return documents.find(d => d.filename === item.sourceId)?.filename || `Document ${item.sourceId}`;
      default:
        return item.sourceId;
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.vendor?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [products, searchQuery]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return orders.filter(o => 
      o.orderNumber.toLowerCase().includes(query) ||
      o.email.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [orders, searchQuery]);

  const filteredReports = useMemo(() => {
    if (!searchQuery) return reports.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return reports.filter(r => 
      r.title.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [reports, searchQuery]);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return documents.filter(d => 
      d.filename?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [documents, searchQuery]);

  const tabs: { type: CollectionItemType; label: string; icon: React.ReactNode; count: number }[] = [
    { type: 'product', label: 'Products', icon: <ShoppingBag className="w-4 h-4" />, count: products.length },
    { type: 'order', label: 'Orders', icon: <Package className="w-4 h-4" />, count: orders.length },
    { type: 'report', label: 'Reports', icon: <BarChart3 className="w-4 h-4" />, count: reports.length },
    { type: 'document', label: 'Documents', icon: <FileText className="w-4 h-4" />, count: documents.length }
  ];

  return (
    <div className="space-y-4">
      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="p-3 bg-background/30 rounded-lg border border-border/50">
          <p className="text-sm font-medium text-foreground mb-2">Selected Items ({selectedItems.length})</p>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-sm border border-primary/30"
              >
                <span className="text-xs font-medium">{getItemTitle(item)}</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="hover:bg-primary/30 rounded p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
              activeTab === tab.type
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground/60 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              {tab.icon}
              <span>{tab.label}</span>
              <span className="text-xs opacity-70">({tab.count})</span>
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder={`Search ${tabs.find(t => t.type === activeTab)?.label.toLowerCase()}...`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-modern text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
      />

      {/* Item List */}
      <div className="max-h-[300px] overflow-y-auto space-y-2 border border-border/50 rounded-lg p-2">
        {activeTab === 'product' && (
          <>
            {filteredProducts.length === 0 ? (
              <p className="text-center py-4 text-foreground/60 text-sm">No products found</p>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = selectedItems.some(item => item.type === 'product' && item.sourceId === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => !isSelected && addItem('product', product.id, product.title)}
                    disabled={isSelected}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-primary/20 text-primary/70 cursor-not-allowed'
                        : 'bg-background/30 hover:bg-background/50 text-foreground hover:border-primary/30 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{product.title}</span>
                      {isSelected && <span className="text-xs ml-auto">Added</span>}
                    </div>
                  </button>
                );
              })
            )}
          </>
        )}

        {activeTab === 'order' && (
          <>
            {filteredOrders.length === 0 ? (
              <p className="text-center py-4 text-foreground/60 text-sm">No orders found</p>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedItems.some(item => item.type === 'order' && item.sourceId === order.id);
                return (
                  <button
                    key={order.id}
                    onClick={() => !isSelected && addItem('order', order.id, order.orderNumber)}
                    disabled={isSelected}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-primary/20 text-primary/70 cursor-not-allowed'
                        : 'bg-background/30 hover:bg-background/50 text-foreground hover:border-primary/30 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{order.orderNumber}</span>
                      {isSelected && <span className="text-xs ml-auto">Added</span>}
                    </div>
                  </button>
                );
              })
            )}
          </>
        )}

        {activeTab === 'report' && (
          <>
            {filteredReports.length === 0 ? (
              <p className="text-center py-4 text-foreground/60 text-sm">No reports found</p>
            ) : (
              filteredReports.map((report) => {
                const isSelected = selectedItems.some(item => item.type === 'report' && item.sourceId === report.id);
                return (
                  <button
                    key={report.id}
                    onClick={() => !isSelected && addItem('report', report.id, report.title)}
                    disabled={isSelected}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-primary/20 text-primary/70 cursor-not-allowed'
                        : 'bg-background/30 hover:bg-background/50 text-foreground hover:border-primary/30 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{report.title}</span>
                      {isSelected && <span className="text-xs ml-auto">Added</span>}
                    </div>
                  </button>
                );
              })
            )}
          </>
        )}

        {activeTab === 'document' && (
          <>
            {filteredDocuments.length === 0 ? (
              <p className="text-center py-4 text-foreground/60 text-sm">No documents found</p>
            ) : (
              filteredDocuments.map((document) => {
                const isSelected = selectedItems.some(item => item.type === 'document' && item.sourceId === document.filename);
                return (
                  <button
                    key={document.filename}
                    onClick={() => !isSelected && addItem('document', document.filename, document.filename || 'Document')}
                    disabled={isSelected}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-primary/20 text-primary/70 cursor-not-allowed'
                        : 'bg-background/30 hover:bg-background/50 text-foreground hover:border-primary/30 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{document.filename || 'Document'}</span>
                      {isSelected && <span className="text-xs ml-auto">Added</span>}
                    </div>
                  </button>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
};

