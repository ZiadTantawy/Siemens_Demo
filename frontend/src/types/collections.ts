/**
 * Knowledge collection type definitions
 */

import { KnowledgeSourceType } from './knowledgeBase';
import { Order, Product, Report } from './shopify';

export type CollectionItemType = 'order' | 'product' | 'report' | 'document';

export interface CollectionItem {
  id: string;
  type: CollectionItemType;
  sourceId: string;
  metadata?: Record<string, any>;
}

export interface CollectionRule {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  isDynamic: boolean;
  rules?: CollectionRule[];
  items: CollectionItem[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  usageCount?: number;
  lastUsedAt?: Date;
}

export interface CollectionTemplate {
  id: string;
  name: string;
  description: string;
  items: CollectionItem[];
  rules?: CollectionRule[];
  isDynamic: boolean;
  category: 'support' | 'marketing' | 'product' | 'analytics' | 'custom';
}

export interface CollectionStats {
  totalCollections: number;
  recentlyUsed: Collection[];
  mostUsed: Collection[];
  totalItems: number;
}


