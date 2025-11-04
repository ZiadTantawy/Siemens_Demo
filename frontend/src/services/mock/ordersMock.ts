/**
 * Mock orders data generator
 */

import { Order, OrderStatus, FulfillmentStatus, Customer, LineItem, ShippingAddress } from '../../types/shopify';
import { subDays, subHours, subMinutes } from 'date-fns';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const FULFILLMENT_STATUSES: FulfillmentStatus[] = ['unfulfilled', 'partial', 'fulfilled'];

const PRODUCT_TITLES = [
  'Organic Cotton T-Shirt',
  'Denim Jeans',
  'Wool Sweater',
  'Leather Jacket',
  'Running Shoes',
  'Baseball Cap',
  'Sunglasses',
  'Backpack',
  'Water Bottle',
  'Yoga Mat',
  'Hoodie',
  'Joggers',
  'Sneakers',
  'Watch',
  'Belt'
];

const FIRST_NAMES = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa', 'Tom', 'Amy'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore'];
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
const PROVINCES = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA'];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateCustomer(id: string): Customer {
  const firstName = randomElement(FIRST_NAMES);
  const lastName = randomElement(LAST_NAMES);
  return {
    id,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    firstName,
    lastName,
    phone: `+1${randomInt(2000000000, 9999999999)}`,
    createdAt: subDays(new Date(), randomInt(30, 730)),
    totalSpent: randomFloat(100, 5000),
    ordersCount: randomInt(1, 20)
  };
}

function generateShippingAddress(): ShippingAddress {
  return {
    firstName: randomElement(FIRST_NAMES),
    lastName: randomElement(LAST_NAMES),
    address1: `${randomInt(100, 9999)} Main Street`,
    address2: randomInt(0, 5) > 3 ? `Apt ${randomInt(1, 200)}` : undefined,
    city: randomElement(CITIES),
    province: randomElement(PROVINCES),
    country: 'United States',
    zip: randomInt(10000, 99999).toString(),
    phone: `+1${randomInt(2000000000, 9999999999)}`
  };
}

function generateLineItem(productId: string): LineItem {
  const productTitle = randomElement(PRODUCT_TITLES);
  const price = randomFloat(19.99, 199.99);
  const quantity = randomInt(1, 5);
  
  return {
    id: `line_${Date.now()}_${Math.random()}`,
    productId,
    variantId: `variant_${productId}`,
    title: productTitle,
    variantTitle: randomInt(0, 3) > 1 ? ['Small', 'Medium', 'Large', 'XL'][randomInt(0, 3)] : undefined,
    quantity,
    price,
    sku: `SKU-${randomInt(1000, 9999)}`,
    imageUrl: `https://picsum.photos/200/200?random=${productId}`
  };
}

export function generateMockOrders(count: number = 1000): Order[] {
  const orders: Order[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const orderDate = subDays(now, randomInt(0, 730));
    const customer = generateCustomer(`customer_${i}`);
    const lineItems: LineItem[] = [];
    const numItems = randomInt(1, 5);
    
    for (let j = 0; j < numItems; j++) {
      lineItems.push(generateLineItem(`product_${randomInt(1, 500)}`));
    }
    
    const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const shipping = randomFloat(5.99, 19.99);
    const total = subtotal + tax + shipping;
    
    const status = randomElement(ORDER_STATUSES);
    const fulfillmentStatus = status === 'cancelled' || status === 'refunded' 
      ? 'unfulfilled' 
      : randomElement(FULFILLMENT_STATUSES);
    
    orders.push({
      id: `order_${i}`,
      orderNumber: `#${1000 + i}`,
      email: customer.email,
      customer,
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      total: Math.round(total * 100) / 100,
      currency: 'USD',
      status,
      fulfillmentStatus,
      shippingAddress: generateShippingAddress(),
      createdAt: orderDate,
      updatedAt: subMinutes(orderDate, randomInt(0, 1440)),
      cancelledAt: status === 'cancelled' ? subDays(orderDate, randomInt(0, 30)) : undefined,
      tags: randomInt(0, 3) > 1 ? ['VIP', 'Subscription', 'Gift'][randomInt(0, 2)].split('').slice(0, randomInt(0, 2)) : [],
      metafields: {}
    });
  }
  
  return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getOrdersInDateRange(orders: Order[], start: Date, end: Date): Order[] {
  return orders.filter(order => 
    order.createdAt >= start && order.createdAt <= end
  );
}

export function filterOrdersByStatus(orders: Order[], statuses: OrderStatus[]): Order[] {
  return orders.filter(order => statuses.includes(order.status));
}

export function searchOrders(orders: Order[], query: string): Order[] {
  const lowerQuery = query.toLowerCase();
  return orders.filter(order =>
    order.orderNumber.toLowerCase().includes(lowerQuery) ||
    order.email.toLowerCase().includes(lowerQuery) ||
    order.customer.firstName.toLowerCase().includes(lowerQuery) ||
    order.customer.lastName.toLowerCase().includes(lowerQuery) ||
    order.lineItems.some(item => item.title.toLowerCase().includes(lowerQuery))
  );
}

