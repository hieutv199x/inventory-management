"use client";
import React, { useState, useEffect } from "react";
import { Pagination } from "@/components/ui/pagination/Pagination";
import { httpClient } from "@/lib/http-client";
import OrderDetailModal from "@/components/Orders/OrderDetailModal";
import { format } from "date-fns";

interface Order {
  id: string;
  orderId: string;
  status: string;
  channel: string;
  buyerEmail: string;
  createTime: number;
  updateTime: number;
  totalAmount?: string;
  currency?: string;
  customStatus?: string;
  shop: {
    shopName: string;
    shopId: string;
  };
  payment?: {
    totalAmount: string;
  };
}

interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 25
  });
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    channel: 'all',
    search: '',
    shopId: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createTime',
    sortOrder: 'desc'
  });

  const fetchOrders = async (page: number = 1, pageSize: number = 25) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value && value !== 'all'))
      });

      const response = await httpClient.get<OrdersResponse>(`/orders?${params}`);
      
      if (response.success) {
        setOrders(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, pagination.itemsPerPage);
  }, [filters]);

  const handlePageChange = (page: number) => {
    fetchOrders(page, pagination.itemsPerPage);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchOrders(1, pageSize);
  };

  const formatCurrency = (amount: string, currency: string) => {
    return `${parseFloat(amount).toLocaleString()} ${currency}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400';
      case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Orders</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {pagination.totalItems} orders
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Order ID, email..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Channel
            </label>
            <select
              value={filters.channel}
              onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Channels</option>
              <option value="TIKTOK">TikTok</option>
              <option value="AMAZON">Amazon</option>
              <option value="SHOPIFY">Shopify</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Shop
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.orderId}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {order.channel}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white truncate max-w-48">
                          {order.buyerEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        {order.customStatus && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {order.customStatus}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.payment?.totalAmount && order.currency ? 
                          formatCurrency(order.payment.totalAmount, order.currency) : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {format(new Date(order.createTime * 1000), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.shop?.shopName || order.shop?.shopId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
