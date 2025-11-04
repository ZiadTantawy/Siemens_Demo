/**
 * Core knowledge base type definitions
 */

export type KnowledgeSourceType = 'order' | 'product' | 'report' | 'document' | 'collection';

export interface KnowledgeItem {
  id: string;
  type: KnowledgeSourceType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMetadata {
  filename: string;
  filepath: string;
  size: number;
  mimeType: string;
  vectors?: number;
  chunks?: number;
  pages?: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  uploadTime: Date;
  ingestionTime?: Date;
  tags?: string[];
  folderId?: string;
  version?: number;
  author?: string;
  error?: string;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime?: Date;
  error?: string;
}

export interface SearchFilter {
  query?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  folderId?: string;
  status?: string[];
}


