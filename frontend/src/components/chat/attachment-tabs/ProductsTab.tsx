/**
 * Products Attachment Tab
 */

import React, { useState, useMemo } from 'react';
import { ShoppingBag, Search } from 'lucide-react';
import { useKnowledgeBase } from '../../../contexts/KnowledgeBaseContext';
import { AttachedContext } from '../../../types/chat';
import { getProductsInCollection, searchProducts } from '../../../services/mock/productsMock';

interface ProductsTabProps {
  selectedItems: AttachedContext[];
  onSelectionChange: (items: AttachedContext[]) => void;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ selectedItems, onSelectionChange }) => {
  const { products, collections } = useKnowledgeBase();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedCollection !== 'all') {
      filtered = getProductsInCollection(filtered, selectedCollection);
    }

    if (searchQuery) {
      filtered = searchProducts(filtered, searchQuery);
    }

    return filtered.slice(0, 50);
  }, [products, selectedCollection, searchQuery]);

  const toggleSelection = (productId: string, productTitle: string) => {
    const itemId = `product_${productId}`;
    const isSelected = selectedItems.some(item => item.id === itemId);

    if (isSelected) {
      onSelectionChange(selectedItems.filter(item => item.id !== itemId));
    } else {
      onSelectionChange([
        ...selectedItems,
        {
          id: itemId,
          type: 'product',
          sourceId: productId,
          title: productTitle
        }
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/60" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-5 py-4 bg-background/50 border-2 border-border/50 rounded-modern text-base text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
        />
      </div>

      <select
        value={selectedCollection}
        onChange={(e) => setSelectedCollection(e.target.value)}
        className="w-full px-5 py-4 bg-background/50 border-2 border-border/50 rounded-modern text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
      >
        <option value="all">All Collections</option>
        {collections.map((coll) => (
          <option key={coll.id} value={coll.title}>
            {coll.title}
          </option>
        ))}
      </select>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {filteredProducts.length === 0 ? (
          <p className="text-center py-8 text-foreground/60">No products found</p>
        ) : (
          filteredProducts.map((product) => {
            const itemId = `product_${product.id}`;
            const isSelected = selectedItems.some(item => item.id === itemId);

              return (
                <label
                  key={product.id}
                  className={`flex items-center gap-4 p-5 border-2 rounded-modern cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/20 border-primary/30 shadow-lg'
                      : 'bg-background/30 border-border/50 hover:border-primary/30 hover:bg-background/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(product.id, product.title)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  {product.images[0] && (
                    <img src={product.images[0]} alt={product.title} className="w-20 h-20 object-cover rounded-modern flex-shrink-0" />
                  )}
                  <ShoppingBag className={`w-6 h-6 text-purple-500 flex-shrink-0 ${product.images[0] ? 'hidden' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-foreground truncate mb-1">{product.title}</p>
                    <p className="text-base text-foreground/70 mb-2">{product.vendor}</p>
                    <p className="text-base font-semibold text-primary">
                      ${Math.min(...product.variants.map(v => v.price)).toFixed(2)}
                    </p>
                  </div>
                </label>
              );
          })
        )}
      </div>
    </div>
  );
};

export default ProductsTab;

