/**
 * Knowledge Base Context for managing knowledge base state
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Order, Product, Report, Collection, ShopifyData } from '../types/shopify';
import { DocumentMetadata } from '../types/knowledgeBase';
import { Collection as KnowledgeCollection } from '../types/collections';
import { shopifyApi } from '../services/api/shopifyApi';
import { collectionsApi } from '../services/api/collectionsApi';

interface KnowledgeBaseContextType {
  // Shopify Data
  orders: Order[];
  products: Product[];
  reports: Report[];
  collections: Collection[];
  shopifySyncStatus: ShopifyData['syncStatus'];
  
  // Documents
  documents: DocumentMetadata[];
  
  // Knowledge Collections
  knowledgeCollections: KnowledgeCollection[];
  
  // Loading states
  isLoadingOrders: boolean;
  isLoadingProducts: boolean;
  isLoadingReports: boolean;
  isLoadingDocuments: boolean;
  isLoadingCollections: boolean;
  
  // Actions
  fetchOrders: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchReports: () => Promise<void>;
  fetchDocuments: () => Promise<void>;
  fetchCollections: () => Promise<void>;
  syncOrders: () => Promise<void>;
  syncProducts: () => Promise<void>;
  createCollection: (collection: Omit<KnowledgeCollection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<KnowledgeCollection>;
  updateCollection: (id: string, updates: Partial<KnowledgeCollection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const KnowledgeBaseContext = createContext<KnowledgeBaseContextType | undefined>(undefined);

export const useKnowledgeBase = () => {
  const context = useContext(KnowledgeBaseContext);
  if (!context) {
    throw new Error('useKnowledgeBase must be used within a KnowledgeBaseProvider');
  }
  return context;
};

interface KnowledgeBaseProviderProps {
  children: ReactNode;
}

export const KnowledgeBaseProvider: React.FC<KnowledgeBaseProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [knowledgeCollections, setKnowledgeCollections] = useState<KnowledgeCollection[]>([]);
  const [shopifySyncStatus, setShopifySyncStatus] = useState<ShopifyData['syncStatus']>({
    orders: { isSyncing: false },
    products: { isSyncing: false },
    reports: { isSyncing: false }
  });
  
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  
  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const data = await shopifyApi.getOrders();
      setOrders(data);
      setShopifySyncStatus(prev => ({
        ...prev,
        orders: shopifyApi.getSyncStatus().orders
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);
  
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const data = await shopifyApi.getProducts();
      setProducts(data);
      setShopifySyncStatus(prev => ({
        ...prev,
        products: shopifyApi.getSyncStatus().products
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);
  
  const fetchReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const data = await shopifyApi.getReports();
      setReports(data);
      setShopifySyncStatus(prev => ({
        ...prev,
        reports: shopifyApi.getSyncStatus().reports
      }));
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);
  
  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    try {
      // This would normally call the API
      // For now, we'll use empty array - documents will be managed separately
      setDocuments([]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);
  
  const fetchCollections = useCallback(async () => {
    setIsLoadingCollections(true);
    try {
      const data = await collectionsApi.getCollections();
      setKnowledgeCollections(data);
      
      // Also fetch Shopify collections
      const shopifyCollections = await shopifyApi.getCollections();
      setCollections(shopifyCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setIsLoadingCollections(false);
    }
  }, []);
  
  const syncOrders = useCallback(async () => {
    setShopifySyncStatus(prev => ({
      ...prev,
      orders: { ...prev.orders, isSyncing: true }
    }));
    try {
      await shopifyApi.syncOrders();
      await fetchOrders();
    } catch (error) {
      console.error('Error syncing orders:', error);
      setShopifySyncStatus(prev => ({
        ...prev,
        orders: { ...prev.orders, isSyncing: false, error: 'Sync failed' }
      }));
    }
  }, [fetchOrders]);
  
  const syncProducts = useCallback(async () => {
    setShopifySyncStatus(prev => ({
      ...prev,
      products: { ...prev.products, isSyncing: true }
    }));
    try {
      await shopifyApi.syncProducts();
      await fetchProducts();
    } catch (error) {
      console.error('Error syncing products:', error);
      setShopifySyncStatus(prev => ({
        ...prev,
        products: { ...prev.products, isSyncing: false, error: 'Sync failed' }
      }));
    }
  }, [fetchProducts]);
  
  const createCollection = useCallback(async (collection: Omit<KnowledgeCollection, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCollection = await collectionsApi.createCollection(collection);
    await fetchCollections();
    return newCollection;
  }, [fetchCollections]);
  
  const updateCollection = useCallback(async (id: string, updates: Partial<KnowledgeCollection>) => {
    await collectionsApi.updateCollection(id, updates);
    await fetchCollections();
  }, [fetchCollections]);
  
  const deleteCollection = useCallback(async (id: string) => {
    await collectionsApi.deleteCollection(id);
    await fetchCollections();
  }, [fetchCollections]);
  
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchOrders(),
      fetchProducts(),
      fetchReports(),
      fetchDocuments(),
      fetchCollections()
    ]);
  }, [fetchOrders, fetchProducts, fetchReports, fetchDocuments, fetchCollections]);
  
  // Initial load
  useEffect(() => {
    refreshAll();
  }, []);
  
  return (
    <KnowledgeBaseContext.Provider
      value={{
        orders,
        products,
        reports,
        collections,
        documents,
        knowledgeCollections,
        shopifySyncStatus,
        isLoadingOrders,
        isLoadingProducts,
        isLoadingReports,
        isLoadingDocuments,
        isLoadingCollections,
        fetchOrders,
        fetchProducts,
        fetchReports,
        fetchDocuments,
        fetchCollections,
        syncOrders,
        syncProducts,
        createCollection,
        updateCollection,
        deleteCollection,
        refreshAll
      }}
    >
      {children}
    </KnowledgeBaseContext.Provider>
  );
};


