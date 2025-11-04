/**
 * Products Panel Component
 */

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Grid, List, Filter } from 'lucide-react';
import { useKnowledgeBase } from '../../contexts/KnowledgeBaseContext';
import { useUI } from '../../contexts/UIContext';
import { Product } from '../../types/shopify';
import { formatDate } from '../../utils/dateUtils';
import { getProductsInCollection, searchProducts, filterProductsInStock } from '../../services/mock/productsMock';

const ProductsPanel: React.FC = () => {
  const { products, collections, shopifySyncStatus, syncProducts, isLoadingProducts } = useKnowledgeBase();
  const { showToast } = useUI();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock'>('all');

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Collection filter
    if (selectedCollection !== 'all') {
      filtered = getProductsInCollection(filtered, selectedCollection);
    }

    // Stock filter
    if (stockFilter === 'in_stock') {
      filtered = filterProductsInStock(filtered);
    }

    // Search
    if (searchQuery) {
      filtered = searchProducts(filtered, searchQuery);
    }

    return filtered;
  }, [products, selectedCollection, stockFilter, searchQuery]);

  const handleSync = async () => {
    await syncProducts();
    showToast('Products synced successfully', 'success');
  };

  const syncStatus = shopifySyncStatus.products;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-border/50">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Products</h3>
          <p className="text-base text-foreground/70">
            <span className="font-semibold text-foreground">{products.length}</span> products ({products.reduce((sum, p) => sum + p.variants.length, 0)} variants)
            {syncStatus.lastSyncTime && (
              <span className="ml-4 text-foreground/60">
                Last synced: {formatDate(syncStatus.lastSyncTime)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncStatus.isSyncing || isLoadingProducts}
          className="p-3 hover:bg-background/50 rounded-modern transition-colors disabled:opacity-50 border-2 border-border/50 hover:border-primary/50"
          title="Sync products"
        >
          <RefreshCw className={`w-5 h-5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/60" />
          <input
            type="text"
            placeholder="Search products by name, SKU, vendor, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-5 py-4 bg-background/50 border-2 border-border/50 rounded-modern text-base text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          />
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="flex-1 px-4 py-3 bg-background/50 border-2 border-border/50 rounded-modern text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          >
            <option value="all">All Collections</option>
            {collections.map((coll) => (
              <option key={coll.id} value={coll.title}>
                {coll.title} ({coll.productCount})
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as 'all' | 'in_stock')}
            className="px-4 py-3 bg-background/50 border-2 border-border/50 rounded-modern text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          >
            <option value="all">All Products</option>
            <option value="in_stock">In Stock Only</option>
          </select>

          <div className="flex gap-2 bg-background/50 border-2 border-border/50 rounded-modern p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-modern transition-all ${
                viewMode === 'grid' ? 'bg-primary/20 text-primary shadow-md' : 'text-foreground/60 hover:bg-background/30'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-modern transition-all ${
                viewMode === 'list' ? 'bg-primary/20 text-primary shadow-md' : 'text-foreground/60 hover:bg-background/30'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2' : 'space-y-3 max-h-[60vh] overflow-y-auto pr-2'}>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-foreground/60 col-span-2">
            <p>No products found</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} viewMode={viewMode} />
          ))
        )}
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ product: Product; viewMode: 'grid' | 'list' }> = ({ product, viewMode }) => {
  const minPrice = Math.min(...product.variants.map(v => v.price));
  const maxPrice = Math.max(...product.variants.map(v => v.price));
  const inStock = product.variants.some(v => v.inventoryQuantity > 0);

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-5 bg-background/30 border-2 border-border/50 rounded-modern hover:border-primary/50 hover:bg-background/40 transition-all shadow-sm hover:shadow-md">
        {product.images[0] && (
          <img src={product.images[0]} alt={product.title} className="w-24 h-24 object-cover rounded-modern flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-foreground mb-1 truncate">{product.title}</p>
          <p className="text-base text-foreground/70 mb-2">
            {product.variants.length} variants • {product.vendor}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-primary">
              ${minPrice.toFixed(2)}
              {minPrice !== maxPrice && ` - $${maxPrice.toFixed(2)}`}
            </span>
            {inStock ? (
              <span className="text-sm px-3 py-1 bg-green-500/20 text-green-500 rounded-lg font-medium">In Stock</span>
            ) : (
              <span className="text-sm px-3 py-1 bg-red-500/20 text-red-500 rounded-lg font-medium">Out of Stock</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-background/30 border-2 border-border/50 rounded-modern hover:border-primary/50 hover:bg-background/40 transition-all shadow-sm hover:shadow-md">
      {product.images[0] && (
        <img src={product.images[0]} alt={product.title} className="w-full h-40 object-cover rounded-modern mb-3" />
      )}
      <p className="text-base font-bold text-foreground truncate mb-2">{product.title}</p>
      <p className="text-sm text-foreground/70 mb-3">{product.vendor}</p>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-primary">
          ${minPrice.toFixed(2)}
          {minPrice !== maxPrice && '+'}
        </span>
        {inStock ? (
          <span className="text-sm px-3 py-1 bg-green-500/20 text-green-500 rounded-lg font-medium">Stock</span>
        ) : (
          <span className="text-sm px-3 py-1 bg-red-500/20 text-red-500 rounded-lg font-medium">Out</span>
        )}
      </div>
    </div>
  );
};

export default ProductsPanel;

