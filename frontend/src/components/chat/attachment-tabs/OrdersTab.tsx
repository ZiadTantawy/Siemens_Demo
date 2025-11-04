/**
 * Orders Attachment Tab
 */

import React, { useState, useMemo } from 'react';
import { Package, Search } from 'lucide-react';
import { useKnowledgeBase } from '../../../contexts/KnowledgeBaseContext';
import { AttachedContext } from '../../../types/chat';
import { getOrdersInDateRange, searchOrders } from '../../../services/mock/ordersMock';
import { getDateRange } from '../../../utils/dateUtils';

interface OrdersTabProps {
  selectedItems: AttachedContext[];
  onSelectionChange: (items: AttachedContext[]) => void;
}

const OrdersTab: React.FC<OrdersTabProps> = ({ selectedItems, onSelectionChange }) => {
  const { orders } = useKnowledgeBase();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '365d'>('30d');

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply date range
    const range = getDateRange(dateRange);
    filtered = getOrdersInDateRange(filtered, range.start, range.end);

    // Apply search
    if (searchQuery) {
      filtered = searchOrders(filtered, searchQuery);
    }

    return filtered.slice(0, 50); // Limit to 50 for performance
  }, [orders, dateRange, searchQuery]);

  const toggleSelection = (orderId: string, orderNumber: string) => {
    const itemId = `order_${orderId}`;
    const isSelected = selectedItems.some(item => item.id === itemId);

    if (isSelected) {
      onSelectionChange(selectedItems.filter(item => item.id !== itemId));
    } else {
      onSelectionChange([
        ...selectedItems,
        {
          id: itemId,
          type: 'order',
          sourceId: orderId,
          title: orderNumber
        }
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/60" />
        <input
          type="text"
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-5 py-4 bg-background/50 border-2 border-border/50 rounded-modern text-base text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        {(['30d', '90d', '365d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-5 py-3 text-base font-medium rounded-modern transition-all ${
              dateRange === range
                ? 'bg-primary/20 text-primary border-2 border-primary/30 shadow-lg'
                : 'bg-background/50 text-foreground/70 border-2 border-border/50 hover:border-primary/30 hover:bg-background/70'
            }`}
          >
            Last {range === '30d' ? '30' : range === '90d' ? '90' : '365'} days
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {filteredOrders.length === 0 ? (
          <p className="text-center py-8 text-foreground/60">No orders found</p>
        ) : (
          filteredOrders.map((order) => {
            const itemId = `order_${order.id}`;
            const isSelected = selectedItems.some(item => item.id === itemId);

              return (
                <label
                  key={order.id}
                  className={`flex items-center gap-4 p-5 border-2 rounded-modern cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/20 border-primary/30 shadow-lg'
                      : 'bg-background/30 border-border/50 hover:border-primary/30 hover:bg-background/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(order.id, order.orderNumber)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <Package className="w-6 h-6 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-foreground mb-1">{order.orderNumber}</p>
                    <p className="text-base text-foreground/70 mb-2">{order.customer.email}</p>
                    <p className="text-base font-semibold text-primary">${order.total.toFixed(2)}</p>
                  </div>
                </label>
              );
          })
        )}
      </div>
    </div>
  );
};

export default OrdersTab;

