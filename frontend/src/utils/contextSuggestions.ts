/**
 * Context Suggestions Utility
 */

import { ContextSuggestion } from '../types/chat';
import { Order, Product, Report } from '../types/shopify';
import { Collection } from '../types/collections';

export function analyzeQueryForSuggestions(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const keywords: Record<string, string[]> = {
    order: ['order', 'purchase', 'buy', 'customer', 'transaction'],
    product: ['product', 'item', 'catalog', 'inventory', 'stock'],
    report: ['report', 'analytics', 'sales', 'revenue', 'performance'],
    document: ['document', 'file', 'policy', 'guide', 'manual'],
    collection: ['collection', 'group', 'campaign', 'set']
  };

  const suggestions: string[] = [];
  
  Object.entries(keywords).forEach(([type, terms]) => {
    if (terms.some(term => lowerQuery.includes(term))) {
      suggestions.push(type);
    }
  });

  return suggestions;
}

export function suggestCollections(query: string, collections: Collection[]): Collection[] {
  const lowerQuery = query.toLowerCase();
  return collections
    .filter(collection => {
      const nameMatch = collection.name.toLowerCase().includes(lowerQuery);
      const descMatch = collection.description?.toLowerCase().includes(lowerQuery);
      const tagMatch = collection.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
      return nameMatch || descMatch || tagMatch;
    })
    .sort((a, b) => {
      // Prioritize by usage count
      const aUsage = a.usageCount || 0;
      const bUsage = b.usageCount || 0;
      return bUsage - aUsage;
    })
    .slice(0, 3);
}



