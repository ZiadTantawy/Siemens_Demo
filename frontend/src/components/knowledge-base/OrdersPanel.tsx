/**
 * Orders Panel Component
 */

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, CheckCircle, Filter, Eye } from 'lucide-react';
import { useKnowledgeBase } from '../../contexts/KnowledgeBaseContext';
import { useUI } from '../../contexts/UIContext';
import { Order, OrderStatus } from '../../types/shopify';
import { formatDate, formatRelativeTime, getDateRange } from '../../utils/dateUtils';
import { Modal } from '../shared/Modal';
import { getOrdersInDateRange, searchOrders, filterOrdersByStatus } from '../../services/mock/ordersMock';

const OrdersPanel: React.FC = () => {
  const { orders, shopifySyncStatus, syncOrders, isLoadingOrders } = useKnowledgeBase();
  const { showToast } = useUI();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '365d' | 'custom'>('30d');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([]);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply date range filter
    if (dateRange !== 'custom') {
      const range = getDateRange(dateRange);
      filtered = getOrdersInDateRange(filtered, range.start, range.end);
    }

    // Apply search
    if (searchQuery) {
      filtered = searchOrders(filtered, searchQuery);
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filterOrdersByStatus(filtered, statusFilter);
    }

    return filtered;
  }, [orders, dateRange, searchQuery, statusFilter]);

  const handleSync = async () => {
    await syncOrders();
    showToast('Orders synced successfully', 'success');
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const syncStatus = shopifySyncStatus.orders;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-border/50">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Orders</h3>
          <p className="text-base text-foreground/70">
            Total: <span className="font-semibold text-foreground">{orders.length.toLocaleString()}</span> orders
            {syncStatus.lastSyncTime && (
              <span className="ml-4 text-foreground/60">
                Last synced: {formatRelativeTime(syncStatus.lastSyncTime)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncStatus.isSyncing || isLoadingOrders}
          className="p-3 hover:bg-background/50 rounded-modern transition-colors disabled:opacity-50 border-2 border-border/50 hover:border-primary/50"
          title="Sync orders"
        >
          <RefreshCw className={`w-5 h-5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/60" />
          <input
            type="text"
            placeholder="Search orders by number, customer, or product..."
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
              Last {range === '30d' ? '30' : range === '90d' ? '90' : '365'} days ({getOrdersInDateRange(orders, getDateRange(range).start, getDateRange(range).end).length})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-foreground/60">
            <p>No orders found</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <input
                type="checkbox"
                checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm text-foreground/60">
                {selectedOrders.size} selected
              </span>
            </div>
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 bg-background/30 border-2 border-border/50 rounded-modern hover:border-primary/50 hover:bg-background/40 transition-all cursor-pointer shadow-sm hover:shadow-md"
                onClick={() => setPreviewOrder(order)}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleOrderSelection(order.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1.5 w-5 h-5 rounded cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-foreground">{order.orderNumber}</span>
                      <span className="text-lg font-bold text-primary">${order.total.toFixed(2)}</span>
                    </div>
                    <p className="text-base text-foreground/70 mb-2">{order.customer.email}</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm px-3 py-1 rounded-lg font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-sm text-foreground/60">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewOrder(order);
                    }}
                    className="p-2 hover:bg-background/50 rounded-modern transition-colors flex-shrink-0"
                  >
                    <Eye className="w-5 h-5 text-foreground/60" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewOrder && (
        <Modal
          isOpen={!!previewOrder}
          onClose={() => setPreviewOrder(null)}
          title={`Order ${previewOrder.orderNumber}`}
        >
          <OrderPreview order={previewOrder} />
        </Modal>
      )}
    </div>
  );
};

const OrderPreview: React.FC<{ order: Order }> = ({ order }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-foreground/60">Customer</p>
          <p className="font-medium">{order.customer.firstName} {order.customer.lastName}</p>
          <p className="text-sm text-foreground/60">{order.email}</p>
        </div>
        <div>
          <p className="text-sm text-foreground/60">Status</p>
          <p className="font-medium capitalize">{order.status}</p>
        </div>
        <div>
          <p className="text-sm text-foreground/60">Date</p>
          <p className="font-medium">{formatDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="text-sm text-foreground/60">Total</p>
          <p className="font-medium text-lg">${order.total.toFixed(2)}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">Line Items</p>
        <div className="space-y-2">
          {order.lineItems.map((item) => (
            <div key={item.id} className="flex justify-between p-2 bg-background/30 rounded">
              <span>{item.title} x{item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    processing: 'bg-blue-500/20 text-blue-500',
    shipped: 'bg-purple-500/20 text-purple-500',
    delivered: 'bg-green-500/20 text-green-500',
    cancelled: 'bg-red-500/20 text-red-500',
    refunded: 'bg-gray-500/20 text-gray-500'
  };
  return colors[status] || 'bg-gray-500/20 text-gray-500';
}

export default OrdersPanel;

