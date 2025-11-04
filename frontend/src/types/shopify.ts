/**
 * Shopify-specific type definitions
 */

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';

export interface LineItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  variantTitle?: string;
  quantity: number;
  price: number;
  sku: string;
  imageUrl?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone?: string;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: Date;
  totalSpent?: number;
  ordersCount?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  email: string;
  customer: Customer;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  shippingAddress: ShippingAddress;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  tags?: string[];
  metafields?: Record<string, any>;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  barcode?: string;
  inventoryQuantity: number;
  inventoryPolicy: 'deny' | 'continue';
  weight?: number;
  imageUrl?: string;
  option1?: string;
  option2?: string;
  option3?: string;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  handle: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  status: 'active' | 'archived' | 'draft';
  variants: ProductVariant[];
  images: string[];
  collections: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  metafields?: Record<string, any>;
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  type: 'manual' | 'smart';
  productCount?: number;
}

export type ReportCategory = 'sales' | 'customer' | 'inventory' | 'financial';

export interface Report {
  id: string;
  title: string;
  category: ReportCategory;
  description?: string;
  generatedAt: Date;
  dateRange: {
    start: Date;
    end: Date;
  };
  data: Record<string, any>;
  format: 'json' | 'csv' | 'pdf';
  fileUrl?: string;
}

export interface ShopifyData {
  orders: Order[];
  products: Product[];
  reports: Report[];
  collections: Collection[];
  syncStatus: {
    orders: SyncStatus;
    products: SyncStatus;
    reports: SyncStatus;
  };
}

interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime?: Date;
  error?: string;
}

