/**
 * Mock products data generator
 */

import { Product, ProductVariant } from '../../types/shopify';
import { subDays } from 'date-fns';

const PRODUCT_TITLES = [
  'Organic Cotton T-Shirt',
  'Premium Denim Jeans',
  'Merino Wool Sweater',
  'Genuine Leather Jacket',
  'Professional Running Shoes',
  'Classic Baseball Cap',
  'Designer Sunglasses',
  'Travel Backpack',
  'Stainless Steel Water Bottle',
  'Premium Yoga Mat',
  'Cozy Hoodie',
  'Athletic Joggers',
  'Comfortable Sneakers',
  'Luxury Watch',
  'Leather Belt',
  'Canvas Tote Bag',
  'Wool Scarf',
  'Winter Gloves',
  'Summer Dress',
  'Polo Shirt'
];

const VENDORS = [
  'EcoWear',
  'UrbanStyle',
  'SportLife',
  'LuxuryBrand',
  'CasualCo',
  'TechWear',
  'NaturalFabrics',
  'ArtisanMade'
];

const PRODUCT_TYPES = [
  'Apparel',
  'Accessories',
  'Footwear',
  'Outerwear',
  'Activewear',
  'Underwear',
  'Jewelry',
  'Bags'
];

const COLLECTIONS = [
  'Summer Collection',
  'Winter Essentials',
  'New Arrivals',
  'Best Sellers',
  'Sale Items',
  'Premium Collection',
  'Eco-Friendly',
  'Athletic Wear',
  'Casual Wear',
  'Formal Wear'
];

const VARIANT_OPTIONS = {
  size: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  color: ['Black', 'White', 'Navy', 'Gray', 'Red', 'Blue', 'Green', 'Beige'],
  material: ['Cotton', 'Polyester', 'Wool', 'Leather', 'Canvas', 'Silk']
};

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateVariant(productId: string, index: number): ProductVariant {
  const basePrice = randomFloat(19.99, 199.99);
  const compareAtPrice = randomInt(0, 3) > 1 ? basePrice * randomFloat(1.2, 1.5) : undefined;
  
  return {
    id: `variant_${productId}_${index}`,
    title: index === 0 ? 'Default' : `Variant ${index + 1}`,
    price: Math.round(basePrice * 100) / 100,
    compareAtPrice: compareAtPrice ? Math.round(compareAtPrice * 100) / 100 : undefined,
    sku: `SKU-${productId}-${index}`,
    barcode: `BAR${randomInt(100000000000, 999999999999)}`,
    inventoryQuantity: randomInt(0, 100),
    inventoryPolicy: randomInt(0, 5) > 0 ? 'deny' : 'continue',
    weight: randomFloat(0.1, 5.0),
    imageUrl: `https://picsum.photos/400/400?random=${productId}_${index}`,
    option1: randomElement(VARIANT_OPTIONS.size),
    option2: randomElement(VARIANT_OPTIONS.color),
    option3: index % 3 === 0 ? randomElement(VARIANT_OPTIONS.material) : undefined
  };
}

export function generateMockProducts(count: number = 400): Product[] {
  const products: Product[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const title = randomElement(PRODUCT_TITLES);
    const handle = `${title.toLowerCase().replace(/\s+/g, '-')}-${i}`;
    const numVariants = randomInt(1, 5);
    const variants: ProductVariant[] = [];
    
    for (let j = 0; j < numVariants; j++) {
      variants.push(generateVariant(`product_${i}`, j));
    }
    
    const numCollections = randomInt(1, 3);
    const collections: string[] = [];
    for (let k = 0; k < numCollections; k++) {
      const collection = randomElement(COLLECTIONS);
      if (!collections.includes(collection)) {
        collections.push(collection);
      }
    }
    
    const numImages = randomInt(1, 4);
    const images: string[] = [];
    for (let m = 0; m < numImages; m++) {
      images.push(`https://picsum.photos/800/800?random=${i}_${m}`);
    }
    
    const numTags = randomInt(0, 5);
    const tags: string[] = [];
    const tagOptions = ['premium', 'organic', 'eco-friendly', 'bestseller', 'new', 'sale', 'limited'];
    for (let t = 0; t < numTags; t++) {
      const tag = randomElement(tagOptions);
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
    
    const createdAt = subDays(now, randomInt(0, 730));
    const publishedAt = randomInt(0, 5) > 0 ? createdAt : undefined;
    
    products.push({
      id: `product_${i}`,
      title: `${title} ${i % 10 === 0 ? 'Premium' : ''}`,
      description: `High-quality ${title.toLowerCase()} made with premium materials. Perfect for everyday wear.`,
      handle,
      vendor: randomElement(VENDORS),
      productType: randomElement(PRODUCT_TYPES),
      tags,
      status: randomInt(0, 10) > 1 ? 'active' : randomInt(0, 2) > 0 ? 'draft' : 'archived',
      variants,
      images,
      collections,
      createdAt,
      updatedAt: subDays(createdAt, randomInt(0, 30)),
      publishedAt,
      metafields: {}
    });
  }
  
  return products;
}

export function getProductsInCollection(products: Product[], collectionName: string): Product[] {
  return products.filter(product => product.collections.includes(collectionName));
}

export function filterProductsByStatus(products: Product[], status: 'active' | 'archived' | 'draft'): Product[] {
  return products.filter(product => product.status === status);
}

export function filterProductsByVendor(products: Product[], vendor: string): Product[] {
  return products.filter(product => product.vendor === vendor);
}

export function filterProductsByType(products: Product[], type: string): Product[] {
  return products.filter(product => product.productType === type);
}

export function filterProductsInStock(products: Product[]): Product[] {
  return products.filter(product => 
    product.variants.some(variant => variant.inventoryQuantity > 0)
  );
}

export function searchProducts(products: Product[], query: string): Product[] {
  const lowerQuery = query.toLowerCase();
  return products.filter(product =>
    product.title.toLowerCase().includes(lowerQuery) ||
    product.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    product.vendor?.toLowerCase().includes(lowerQuery) ||
    product.productType?.toLowerCase().includes(lowerQuery) ||
    product.variants.some(variant => variant.sku.toLowerCase().includes(lowerQuery))
  );
}

