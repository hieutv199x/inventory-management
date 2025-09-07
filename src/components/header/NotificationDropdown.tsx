"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { httpClient } from "@/lib/http-client";

interface NotificationData {
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

interface NotificationResponse {
  notifications: NotificationData[];
  unreadCount: number;
  hasMore: boolean;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get<NotificationResponse>(
        "/notifications?limit=10"
      );
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await httpClient.patch(`/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await httpClient.patch("/notifications/read-all");

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_ORDER":
        return "🛍️";
      case "ORDER_STATUS_CHANGE":
        return "📦";
      case "ORDER_CANCELLED":
        return "❌";
      case "ORDER_DELIVERED":
        return "✅";
      case "NEW_MESSAGE":
        return "💬";
      case "PAYMENT_RECEIVED":
        return "💰";
      case "LOW_INVENTORY":
        return "⚠️";
      case "SYSTEM_ALERT":
        return "🔔";
      default:
        return "📩";
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
    return format(date, "MMM dd, HH:mm");
  };

  const formatNotificationData = (notification: NotificationData) => {
    let additionalInfo = "";

    if (notification.order) {
      additionalInfo = `Order ${notification.order.orderId}`;
      if (notification.order.totalAmount) {
        additionalInfo += ` • ${notification.order.totalAmount} ${notification.order.currency || ""
          }`;
      }
    }

    if (notification.shop) {
      additionalInfo += ` • ${notification.shop.shopName || notification.shop.shopId}`;
    }

    return additionalInfo;
  };

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();

    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 flex">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[380px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[400px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full dark:bg-orange-900 dark:text-orange-300">
                {unreadCount}
              </span>
            )}
          </h5>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <li className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                No notifications yet
              </li>
            ) : (
              notifications.map((notification) => (
                <li key={notification.id}>
                  <DropdownItem
                    onItemClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      closeDropdown();
                    }}
                    className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                      !notification.read ? "bg-blue-50 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    <span className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-lg">
                      {getNotificationIcon(notification.type)}
                      {!notification.read && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500"></span>
                      )}
                    </span>

                    <span className="flex-1 min-w-0">
                      <span className="block mb-1 font-medium text-sm text-gray-800 dark:text-white/90 truncate">
                        {notification.title}
                      </span>
                      <span className="block mb-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                      </span>

                      {formatNotificationData(notification) && (
                        <span className="block mb-1 text-xs text-blue-600 dark:text-blue-400 truncate">
                          {formatNotificationData(notification)}
                        </span>
                      )}

                      <span className="flex items-center gap-2 text-gray-500 text-xs dark:text-gray-400">
                        <span>{getTimeAgo(notification.createdAt)}</span>
                      </span>
                    </span>
                  </DropdownItem>
                </li>
              ))
            )}
          </ul>
        )}

        <Link
          href="/notifications"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          onClick={closeDropdown}
        >
          View All Notifications
        </Link>
      </Dropdown>
    </div>
  );
}