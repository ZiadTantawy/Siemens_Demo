/**
 * Collections API service (mock implementation)
 */

import { Collection, CollectionItem, CollectionTemplate } from '../../types/collections';
import { generateMockCollections, getCollectionTemplates, createCollectionFromTemplate } from '../mock/collectionsMock';

let cachedCollections: Collection[] | null = null;

export const collectionsApi = {
  async getCollections(): Promise<Collection[]> {
    if (!cachedCollections) {
      cachedCollections = generateMockCollections();
    }
    return Promise.resolve(cachedCollections);
  },
  
  async getCollection(id: string): Promise<Collection | null> {
    const collections = await this.getCollections();
    return collections.find(c => c.id === id) || null;
  },
  
  async createCollection(collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    const newCollection: Collection = {
      ...collection,
      id: `collection_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };
    
    if (!cachedCollections) {
      cachedCollections = generateMockCollections();
    }
    cachedCollections.push(newCollection);
    
    return newCollection;
  },
  
  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection | null> {
    const collections = await this.getCollections();
    const index = collections.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    collections[index] = {
      ...collections[index],
      ...updates,
      updatedAt: new Date()
    };
    
    return collections[index];
  },
  
  async deleteCollection(id: string): Promise<boolean> {
    const collections = await this.getCollections();
    const index = collections.findIndex(c => c.id === id);
    
    if (index === -1) return false;
    
    cachedCollections = collections.filter(c => c.id !== id);
    return true;
  },
  
  async addItemToCollection(collectionId: string, item: CollectionItem): Promise<Collection | null> {
    const collection = await this.getCollection(collectionId);
    if (!collection) return null;
    
    const updatedItems = [...collection.items, item];
    return this.updateCollection(collectionId, { items: updatedItems });
  },
  
  async removeItemFromCollection(collectionId: string, itemId: string): Promise<Collection | null> {
    const collection = await this.getCollection(collectionId);
    if (!collection) return null;
    
    const updatedItems = collection.items.filter(item => item.id !== itemId);
    return this.updateCollection(collectionId, { items: updatedItems });
  },
  
  async getTemplates(): Promise<CollectionTemplate[]> {
    return Promise.resolve(getCollectionTemplates());
  },
  
  async createFromTemplate(templateId: string, name: string, createdBy: string): Promise<Collection | null> {
    const collection = createCollectionFromTemplate(templateId, name, createdBy);
    if (!collection) return null;
    
    if (!cachedCollections) {
      cachedCollections = generateMockCollections();
    }
    cachedCollections.push(collection);
    
    return collection;
  },
  
  async updateUsage(collectionId: string): Promise<void> {
    const collection = await this.getCollection(collectionId);
    if (!collection) return;
    
    await this.updateCollection(collectionId, {
      usageCount: (collection.usageCount || 0) + 1,
      lastUsedAt: new Date()
    });
  }
};

