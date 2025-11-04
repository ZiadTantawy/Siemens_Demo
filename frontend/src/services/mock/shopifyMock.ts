/**
 * Main Shopify mock service
 */

import { ShopifyData, Order, Product, Report, Collection } from '../../types/shopify';
import { generateMockOrders } from './ordersMock';
import { generateMockProducts } from './productsMock';
import { generateMockReports } from './reportsMock';
import { subMinutes } from 'date-fns';

let cachedOrders: Order[] | null = null;
let cachedProducts: Product[] | null = null;
let cachedReports: Report[] | null = null;
let cachedCollections: Collection[] | null = null;

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime?: Date;
  error?: string;
}

class ShopifyMockService {
  private ordersSyncStatus: SyncStatus = {
    isSyncing: false,
    lastSyncTime: subMinutes(new Date(), 2)
  };
  
  private productsSyncStatus: SyncStatus = {
    isSyncing: false,
    lastSyncTime: subMinutes(new Date(), 5)
  };
  
  private reportsSyncStatus: SyncStatus = {
    isSyncing: false,
    lastSyncTime: subMinutes(new Date(), 60)
  };
  
  async fetchOrders(): Promise<Order[]> {
    if (!cachedOrders) {
      cachedOrders = generateMockOrders(1247);
    }
    return Promise.resolve(cachedOrders);
  }
  
  async fetchProducts(): Promise<Product[]> {
    if (!cachedProducts) {
      cachedProducts = generateMockProducts(456);
    }
    return Promise.resolve(cachedProducts);
  }
  
  async fetchReports(): Promise<Report[]> {
    if (!cachedReports) {
      cachedReports = generateMockReports();
    }
    return Promise.resolve(cachedReports);
  }
  
  async fetchCollections(): Promise<Collection[]> {
    if (!cachedCollections) {
      cachedCollections = [
        { id: 'coll_1', title: 'Summer Collection', handle: 'summer', type: 'manual', productCount: 23 },
        { id: 'coll_2', title: 'Winter Essentials', handle: 'winter', type: 'manual', productCount: 45 },
        { id: 'coll_3', title: 'New Arrivals', handle: 'new-arrivals', type: 'smart', productCount: 67 },
        { id: 'coll_4', title: 'Best Sellers', handle: 'best-sellers', type: 'smart', productCount: 89 },
        { id: 'coll_5', title: 'Sale Items', handle: 'sale', type: 'manual', productCount: 34 },
        { id: 'coll_6', title: 'Premium Collection', handle: 'premium', type: 'manual', productCount: 56 },
        { id: 'coll_7', title: 'Eco-Friendly', handle: 'eco-friendly', type: 'manual', productCount: 28 },
        { id: 'coll_8', title: 'Athletic Wear', handle: 'athletic', type: 'manual', productCount: 42 },
        { id: 'coll_9', title: 'Casual Wear', handle: 'casual', type: 'manual', productCount: 78 },
        { id: 'coll_10', title: 'Formal Wear', handle: 'formal', type: 'manual', productCount: 31 },
        { id: 'coll_11', title: 'Accessories', handle: 'accessories', type: 'manual', productCount: 52 },
        { id: 'coll_12', title: 'Footwear', handle: 'footwear', type: 'manual', productCount: 38 }
      ];
    }
    return Promise.resolve(cachedCollections);
  }
  
  async syncOrders(): Promise<void> {
    this.ordersSyncStatus.isSyncing = true;
    
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    cachedOrders = generateMockOrders(1247);
    this.ordersSyncStatus.isSyncing = false;
    this.ordersSyncStatus.lastSyncTime = new Date();
  }
  
  async syncProducts(): Promise<void> {
    this.productsSyncStatus.isSyncing = true;
    
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    cachedProducts = generateMockProducts(456);
    this.productsSyncStatus.isSyncing = false;
    this.productsSyncStatus.lastSyncTime = new Date();
  }
  
  async generateReport(category: string, start: Date, end: Date): Promise<Report> {
    // This would normally call the reports mock generator
    const reports = await this.fetchReports();
    return reports.find(r => r.category === category) || reports[0];
  }
  
  getOrdersSyncStatus(): SyncStatus {
    return { ...this.ordersSyncStatus };
  }
  
  getProductsSyncStatus(): SyncStatus {
    return { ...this.productsSyncStatus };
  }
  
  getReportsSyncStatus(): SyncStatus {
    return { ...this.reportsSyncStatus };
  }
  
  async getShopifyData(): Promise<ShopifyData> {
    const [orders, products, reports, collections] = await Promise.all([
      this.fetchOrders(),
      this.fetchProducts(),
      this.fetchReports(),
      this.fetchCollections()
    ]);
    
    return {
      orders,
      products,
      reports,
      collections,
      syncStatus: {
        orders: this.getOrdersSyncStatus(),
        products: this.getProductsSyncStatus(),
        reports: this.getReportsSyncStatus()
      }
    };
  }
}

export const shopifyMockService = new ShopifyMockService();


