/**
 * Shopify API service (mock implementation)
 */

import { shopifyMockService } from '../mock/shopifyMock';
import { Order, Product, Report, Collection, ShopifyData } from '../../types/shopify';

export const shopifyApi = {
  async getOrders(): Promise<Order[]> {
    return shopifyMockService.fetchOrders();
  },
  
  async getProducts(): Promise<Product[]> {
    return shopifyMockService.fetchProducts();
  },
  
  async getReports(): Promise<Report[]> {
    return shopifyMockService.fetchReports();
  },
  
  async getCollections(): Promise<Collection[]> {
    return shopifyMockService.fetchCollections();
  },
  
  async syncOrders(): Promise<void> {
    return shopifyMockService.syncOrders();
  },
  
  async syncProducts(): Promise<void> {
    return shopifyMockService.syncProducts();
  },
  
  async generateReport(category: string, start: Date, end: Date): Promise<Report> {
    return shopifyMockService.generateReport(category, start, end);
  },
  
  getSyncStatus() {
    return {
      orders: shopifyMockService.getOrdersSyncStatus(),
      products: shopifyMockService.getProductsSyncStatus(),
      reports: shopifyMockService.getReportsSyncStatus()
    };
  },
  
  async getAllData(): Promise<ShopifyData> {
    return shopifyMockService.getShopifyData();
  }
};

