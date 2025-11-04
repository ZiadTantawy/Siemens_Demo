/**
 * Chat and context type definitions
 */

import { CollectionItem } from './collections';

export type ContextSourceType = 'order' | 'product' | 'report' | 'document' | 'collection';

export interface AttachedContext {
  id: string;
  type: ContextSourceType;
  sourceId: string;
  title: string;
  metadata?: Record<string, any>;
}

export interface Source {
  type: 'knowledge_base' | 'web';
  filename?: string;
  page?: any;
  chunk_id?: number;
  url?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  confidence?: number;
  timestamp: Date;
}

export interface ChatContext {
  chatId: string;
  messages: Message[];
  attachedContext: AttachedContext[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContextTemplate {
  id: string;
  name: string;
  description?: string;
  context: AttachedContext[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContextSuggestion {
  type: ContextSourceType;
  sourceId: string;
  title: string;
  reason: string;
  confidence: number;
}

