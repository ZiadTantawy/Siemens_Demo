/**
 * Mock collections data generator
 */

import { Collection, CollectionItem, CollectionTemplate } from '../../types/collections';
import { subDays } from 'date-fns';

const COLLECTION_TEMPLATES: CollectionTemplate[] = [
  {
    id: 'template_support',
    name: 'Customer Support Kit',
    description: 'Essential documents and products for customer support',
    category: 'support',
    isDynamic: false,
    items: [
      { id: 'item_1', type: 'document', sourceId: 'return_policy', metadata: {} },
      { id: 'item_2', type: 'document', sourceId: 'size_guide', metadata: {} },
      { id: 'item_3', type: 'document', sourceId: 'faq', metadata: {} }
    ]
  },
  {
    id: 'template_marketing',
    name: 'Marketing Campaign',
    description: 'Products and content for marketing campaigns',
    category: 'marketing',
    isDynamic: false,
    items: [
      { id: 'item_1', type: 'product', sourceId: 'collection_summer', metadata: {} },
      { id: 'item_2', type: 'document', sourceId: 'brand_guidelines', metadata: {} }
    ]
  },
  {
    id: 'template_product',
    name: 'Product Launch',
    description: 'Resources for launching new products',
    category: 'product',
    isDynamic: false,
    items: [
      { id: 'item_1', type: 'product', sourceId: 'new_products', metadata: {} },
      { id: 'item_2', type: 'document', sourceId: 'press_release', metadata: {} }
    ]
  }
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateMockCollections(): Collection[] {
  const collections: Collection[] = [
    {
      id: 'collection_1',
      name: 'Summer 2025 Campaign',
      description: 'Products and orders from summer campaign',
      isDynamic: false,
      items: [
        { id: 'item_1', type: 'product', sourceId: 'collection_summer', metadata: { count: 23 } },
        { id: 'item_2', type: 'order', sourceId: 'orders_summer', metadata: { count: 145 } },
        { id: 'item_3', type: 'document', sourceId: 'brand_voice_summer', metadata: {} },
        { id: 'item_4', type: 'document', sourceId: 'social_media_guide', metadata: {} }
      ],
      tags: ['marketing', 'summer', 'campaign'],
      createdAt: subDays(new Date(), 30),
      updatedAt: subDays(new Date(), 5),
      createdBy: 'user_1',
      usageCount: 143,
      lastUsedAt: subDays(new Date(), 1)
    },
    {
      id: 'collection_2',
      name: 'Customer Support Kit',
      description: 'Essential documents for customer support team',
      isDynamic: false,
      items: [
        { id: 'item_1', type: 'document', sourceId: 'return_policy', metadata: {} },
        { id: 'item_2', type: 'document', sourceId: 'size_guide', metadata: {} },
        { id: 'item_3', type: 'product', sourceId: 'all_products', metadata: { count: 892 } },
        { id: 'item_4', type: 'document', sourceId: 'faq', metadata: {} }
      ],
      tags: ['support', 'customer'],
      createdAt: subDays(new Date(), 90),
      updatedAt: subDays(new Date(), 10),
      createdBy: 'user_1',
      usageCount: 156,
      lastUsedAt: subDays(new Date(), 2)
    },
    {
      id: 'collection_3',
      name: 'New Product Launch - Eco Line',
      description: 'Resources for eco-friendly product launch',
      isDynamic: false,
      items: [
        { id: 'item_1', type: 'product', sourceId: 'eco_collection', metadata: { count: 8 } },
        { id: 'item_2', type: 'document', sourceId: 'sustainability_cert', metadata: {} },
        { id: 'item_3', type: 'document', sourceId: 'press_release', metadata: {} },
        { id: 'item_4', type: 'document', sourceId: 'influencer_brief', metadata: {} }
      ],
      tags: ['product', 'eco', 'launch'],
      createdAt: subDays(new Date(), 15),
      updatedAt: subDays(new Date(), 3),
      createdBy: 'user_2',
      usageCount: 98,
      lastUsedAt: subDays(new Date(), 5)
    },
    {
      id: 'collection_4',
      name: 'Recent Orders (Last 30 Days)',
      description: 'Dynamically filtered orders from the last 30 days',
      isDynamic: true,
      rules: [
        { field: 'createdAt', operator: 'greater_than', value: subDays(new Date(), 30) }
      ],
      items: [],
      tags: ['orders', 'dynamic'],
      createdAt: subDays(new Date(), 60),
      updatedAt: subDays(new Date(), 1),
      createdBy: 'user_1',
      usageCount: 67,
      lastUsedAt: subDays(new Date(), 0)
    }
  ];
  
  return collections;
}

export function getCollectionTemplates(): CollectionTemplate[] {
  return COLLECTION_TEMPLATES;
}

export function createCollectionFromTemplate(
  templateId: string,
  name: string,
  createdBy: string
): Collection | null {
  const template = COLLECTION_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;
  
  return {
    id: `collection_${Date.now()}`,
    name,
    description: template.description,
    isDynamic: template.isDynamic,
    items: template.items.map(item => ({ ...item })),
    rules: template.rules ? [...template.rules] : undefined,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy,
    usageCount: 0
  };
}

