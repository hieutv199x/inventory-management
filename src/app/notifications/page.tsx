"use client";
import React, { useState, useEffect } from "react";
import { Pagination } from "@/components/ui/pagination/Pagination";
import { httpClient } from "@/lib/http-client";
import { format } from "date-fns";
import { Bell, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: string;
  order?: {
    orderId: string;
    status: string;
    totalAmount?: string;
    currency?: string;
  };
  shop?: {
    shopName?: string;
    shopId: string;
  };
}

interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 25
  });
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    type: 'all',
    read: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const fetchNotifications = async (page: number = 1, pageSize: number = 25) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value && value !== 'all'))
      });

      const response = await httpClient.get<NotificationsResponse>(`/notifications?${params}`);
      
      if (response.success) {
        setNotifications(response.notifications);
        setPagination(response.pagination);
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, pagination.itemsPerPage);
  }, [filters]);

  const handlePageChange = (page: number) => {
    fetchNotifications(page, pagination.itemsPerPage);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchNotifications(1, pageSize);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await httpClient.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await httpClient.patch("/notifications/read-all");
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_ORDER":
        return <Bell className="h-5 w-5 text-blue-600" />;
      case "ORDER_STATUS_CHANGE":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "ORDER_CANCELLED":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "SYSTEM_ALERT":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {unreadCount} unread notifications
            </p>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="NEW_ORDER">New Order</option>
              <option value="ORDER_STATUS_CHANGE">Status Change</option>
              <option value="ORDER_CANCELLED">Cancelled</option>
              <option value="SYSTEM_ALERT">System Alert</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.read}
              onChange={(e) => setFilters(prev => ({ ...prev, read: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No notifications found
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>
                        
                        {/* Additional info */}
                        {(notification.order || notification.shop) && (
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                            {notification.order && (
                              <span>Order: {notification.order.orderId}</span>
                            )}
                            {notification.shop && (
                              <span className="ml-2">Shop: {notification.shop.shopName || notification.shop.shopId}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
