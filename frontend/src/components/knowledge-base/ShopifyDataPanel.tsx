/**
 * Shopify Data Panel Container
 */

import React, { useState } from 'react';
import { Tabs } from '../shared/Tabs';
import { Package, ShoppingBag, BarChart3 } from 'lucide-react';
import OrdersPanel from './OrdersPanel';
import ProductsPanel from './ProductsPanel';
import ReportsPanel from './ReportsPanel';

const ShopifyDataPanel: React.FC = () => {
  const tabs = [
    {
      id: 'orders',
      label: 'Orders',
      icon: <Package className="w-4 h-4" />,
      content: <OrdersPanel />
    },
    {
      id: 'products',
      label: 'Products',
      icon: <ShoppingBag className="w-4 h-4" />,
      content: <ProductsPanel />
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-4 h-4" />,
      content: <ReportsPanel />
    }
  ];

  return <Tabs items={tabs} />;
};

export default ShopifyDataPanel;



