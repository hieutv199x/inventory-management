"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { FaStore, FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaEye, FaTh, FaList, FaKey, FaCopy } from 'react-icons/fa';
import { useAuth } from '@/context/authContext';
import { httpClient } from '@/lib/http-client';
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import ConfirmDeleteModal from "@/components/ui/modal/ConfirmDeleteModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDownIcon, TrashBinIcon } from "@/icons";

interface Shop {
  id: string;
  shopId: string;
  shopName: string | null;
  shopCipher: string | null;
  app: {
    appId: string;
    appKey: string;
    appSecret: string | null;
    appName: string | null;
  };
  country: string;
  status: string | null;
  createdAt: string;
}

interface App {
  id: string;
  appId: string;
  appKey: string;
  appSecret: string | null;
  appName: string | null;
  createdAt: string;
  isActive: boolean;
}

export default function Shops() {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showSecret, setShowSecret] = useState<{ [id: string]: boolean }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  // App management states
  const [showAppListModal, setShowAppListModal] = useState(false);
  const [appList, setAppList] = useState<App[]>([]);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editAppSecret, setEditAppSecret] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [showDeleteAppModal, setShowDeleteAppModal] = useState(false);
  
  const [formData, setFormData] = useState({
    country: 'US',
    serviceId: '',
    appName: '',
    appKey: '',
    appSecret: ''
  });

  const countryOptions = [
    { value: "US", label: "US" },
    { value: "UK", label: "UK" },
  ];

  // Role-based permissions
  const canAdd = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canDelete = user?.role === 'ADMIN';
  const canViewAllShops = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // Fetch shops with search and pagination
  const fetchShops = useCallback(async (page = 1, search = '', limit = 12) => {
    try {
      setSearchLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: 'ACTIVE',
        ...(search && { search }),
        // Add user role filter - if not admin/manager, only get assigned shops
        ...(user?.id && !canViewAllShops && { userId: user.id })
      });
      
      const data = await httpClient.get(`/shops?${params}`);
      
      setShops(data.shops || []);
      setPagination({
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || limit,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      });
    } catch (err) {
      console.error('Error fetching shops:', err);
      setError('Không thể tải danh sách shop');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [canViewAllShops, user?.id]);

  // Debounced search - fix circular dependency
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchShops(1, searchTerm, pagination.limit);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // Remove fetchShops and pagination.limit from dependencies

  // Initial fetch
  useEffect(() => {
    fetchShops(1, '', 12); // Use default limit
  }, [fetchShops]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchShops(newPage, searchTerm, pagination.limit);
  };

  // Handle page size change
  const handlePageSizeChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    fetchShops(1, searchTerm, newLimit);
  };

  // Group shops by status for kanban view
  const groupedShops = {
    active: shops.filter(shop => ['active', 'live'].includes(shop.status?.toLowerCase() || '')),
    pending: shops.filter(shop => ['jumio', 'up doc'].includes(shop.status?.toLowerCase() || '')),
    inactive: shops.filter(shop => ['inactive', 'die 7 days', 'shop closed'].includes(shop.status?.toLowerCase() || '')),
    unknown: shops.filter(shop => !shop.status || !['active', 'live', 'jumio', 'up doc', 'inactive', 'die 7 days', 'shop closed'].includes(shop.status.toLowerCase()))
  };

  // Helper to render status badge
  function getStatusBadge(status?: string | null) {
    const normalized = status?.toLowerCase() || '';
    if (['active', 'live'].includes(normalized)) {
      return <Badge size="sm" color="success">Hoạt động</Badge>;
    }
    if (['jumio', 'up doc'].includes(normalized)) {
      return <Badge size="sm" color="warning">Chờ xác minh</Badge>;
    }
    if (['inactive', 'die 7 days', 'shop closed'].includes(normalized)) {
      return <Badge size="sm" color="error">Không hoạt động</Badge>;
    }
    return <Badge size="sm" color="primary">{status || 'Không rõ'}</Badge>;
  }

  // Handle add shop
  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await httpClient.post("/tiktok/shop/add-shop-info", formData);
      setSuccess('Thêm shop thành công');
      setShowAddModal(false);
      setFormData({
        country: 'US',
        serviceId: '',
        appName: '',
        appKey: '',
        appSecret: ''
      });
      await fetchShops(pagination.page, searchTerm, pagination.limit);
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete shop
  const handleDeleteShop = async (shopId: string) => {
    try {
      await httpClient.delete(`/shops/${shopId}`);
      setSuccess('Xóa shop thành công');
      await fetchShops(pagination.page, searchTerm, pagination.limit);
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi xóa shop');
    } finally {
      setShowDeleteModal(false);
    }
  };

  // App List functionality
  const handleOpenAppList = async () => {
    try {
      const res = await httpClient.get("/app");
      setAppList(res.app || []);
      setShowAppListModal(true);
    } catch (err) {
      console.error("Error fetching apps:", err);
      setError('Không thể tải danh sách app');
    }
  };

  const handleEditAppSecret = (app: App) => {
    setEditingAppId(app.id);
    setEditAppSecret(app.appSecret || "");
  };

  const handleCancelEdit = () => {
    setEditingAppId(null);
    setEditAppSecret("");
  };

  const handleSaveAppSecret = async (id: string) => {
    try {
      await httpClient.put(`/app/${id}`, { appSecret: editAppSecret });
      const res = await httpClient.get("/app");
      setAppList(res.app || []);
      setEditingAppId(null);
      setEditAppSecret("");
      setSuccess('Cập nhật App Secret thành công');
    } catch (err) {
      console.error("Failed to update appSecret", err);
      setError('Không thể cập nhật App Secret');
    }
  };

  const handleDeleteApp = async (id: string) => {
    try {
      await httpClient.delete(`/app/${id}`);
      const res = await httpClient.get("/app");
      setAppList(res.app || []);
      setShowDeleteAppModal(false);
      setSelectedApp(null);
      setSuccess('Xóa app thành công');
    } catch (err) {
      console.error("Failed to delete app", err);
      setError('Không thể xóa app');
    }
  };

  const handleCopyAuthUrl = async (serviceId: string, appName: string) => {
    const authUrl = `https://services.tiktokshop.com/open/authorize?service_id=${serviceId}`;
    
    try {
      await navigator.clipboard.writeText(authUrl);
      setSuccess(`Đã sao chép URL ủy quyền cho app "${appName}"`);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback method for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = authUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setSuccess(`Đã sao chép URL ủy quyền cho app "${appName}"`);
    }
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowDeleteModal(false);
    setShowDetailsModal(false);
    setShowAppListModal(false);
    setShowDeleteAppModal(false);
    setSelectedShop(null);
    setSelectedApp(null);
    setEditingAppId(null);
    setEditAppSecret("");
    setError('');
    setFormData({
      country: 'US',
      serviceId: '',
      appName: '',
      appKey: '',
      appSecret: ''
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FaStore className="h-8 w-8 text-brand-500" />
          <div className="vietnamese-text">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quản lý Shop
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quản lý danh sách các shop và ứng dụng TikTok
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-brand-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Chế độ lưới"
            >
              <FaTh className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-600 text-brand-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Chế độ bảng"
            >
              <FaList className="h-4 w-4" />
            </button>
          </div>
          
          {canAdd && (
            <>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center space-x-2"
              >
                <FaPlus className="h-4 w-4" />
                <span>Thêm APP</span>
              </button>
              
              <button 
                onClick={handleOpenAppList}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <FaKey className="h-4 w-4" />
                <span>Danh sách APP</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Tìm kiếm shop theo tên, ID, ứng dụng hoặc quốc gia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 vietnamese-text"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        {searchTerm && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            Tìm thấy {pagination.total} shop
            <button
              onClick={() => setSearchTerm('')}
              className="ml-2 text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Xóa
            </button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">Hiển thị:</span>
          <select
            value={pagination.limit}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            shop mỗi trang
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Hiển thị {((pagination.page - 1) * pagination.limit) + 1} đến{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} của{' '}
            {pagination.total} shop
          </span>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'grid' ? (
        /* Grid View - existing grid code */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg p-8 text-center shadow">
              <FaStore className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'Không tìm thấy shop' : 'Chưa có shop nào'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm 
                  ? `Không có shop nào khớp với "${searchTerm}". Thử tìm kiếm khác.`
                  : 'Bắt đầu bằng cách thêm shop đầu tiên của bạn.'
                }
              </p>
              {!searchTerm && canAdd && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                >
                  Thêm Shop
                </button>
              )}
            </div>
          ) : (
            shops.map((shop) => (
              <div key={shop.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                {/* Shop Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white vietnamese-text">
                      {shop.shopName || 'Unnamed Shop'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {shop.shopId}
                    </p>
                  </div>
                  {getStatusBadge(shop.status)}
                </div>

                {/* Shop Info */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Quốc gia:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{shop.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">App Name:</span>
                    <span className="text-gray-900 dark:text-white font-mono text-xs truncate ml-2">
                      {shop.app.appName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">App Key:</span>
                    <span className="text-gray-900 dark:text-white font-mono text-xs truncate ml-2">
                      {shop.app.appKey}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Secret:</span>
                    <div className="flex items-center">
                      <span className="text-gray-900 dark:text-white font-mono text-xs mr-2">
                        {showSecret[shop.id] ? shop.app.appSecret : '••••••••'}
                      </span>
                      <button
                        onClick={() => setShowSecret(prev => ({ ...prev, [shop.id]: !prev[shop.id] }))}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaEye className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Ngày tạo:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(shop.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => {
                      setSelectedShop(shop);
                      setShowDetailsModal(true);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 border border-brand-300 rounded hover:bg-brand-50 dark:hover:bg-brand-900 transition-colors flex items-center justify-center space-x-1"
                  >
                    <FaEye className="h-3 w-3" />
                    <span>Chi tiết</span>
                  </button>
                  {canDelete && (
                    <button 
                      onClick={() => {
                        setSelectedShop(shop);
                        setShowDeleteModal(true);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900 transition-colors flex items-center justify-center space-x-1"
                    >
                      <FaTrash className="h-3 w-3" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Shop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thông tin ứng dụng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quốc gia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {shops.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm 
                        ? `Không có shop nào khớp với "${searchTerm}". Thử tìm kiếm khác.`
                        : 'Chưa có shop nào. Bắt đầu bằng cách thêm shop đầu tiên của bạn.'
                      }
                    </td>
                  </tr>
                ) : (
                  shops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-medium">
                            {shop.shopName?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white vietnamese-text">
                              {shop.shopName || 'Unnamed Shop'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {shop.shopId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="text-gray-900 dark:text-white">
                            <span className="font-medium">App:</span> {shop.app.appName || 'N/A'}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                            Key: {shop.app.appKey?.substring(0, 12)}...
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 dark:text-gray-400 text-xs mr-2">Secret:</span>
                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400 mr-2">
                              {showSecret[shop.id] ? shop.app.appSecret : '••••••••'}
                            </span>
                            <button
                              onClick={() => setShowSecret(prev => ({ ...prev, [shop.id]: !prev[shop.id] }))}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <FaEye className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {shop.country}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(shop.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(shop.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => {
                              setSelectedShop(shop);
                              setShowDetailsModal(true);
                            }}
                            className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 inline-flex items-center space-x-1"
                          >
                            <FaEye className="h-3 w-3" />
                            <span>Chi tiết</span>
                          </button>
                          {canDelete && (
                            <button 
                              onClick={() => {
                                setSelectedShop(shop);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center space-x-1"
                            >
                              <FaTrash className="h-3 w-3" />
                              <span>Xóa</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Trước
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 border rounded-md text-sm ${
                      pagination.page === pageNum
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Tiếp theo
            </button>
          </div>
          
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Trang {pagination.page} / {pagination.totalPages}
          </div>
        </div>
      )}

      {/* Add Shop Modal - Update with new form structure */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={closeModals} className="max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white vietnamese-text">
              Import App
            </h2>
            <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleAddShop} className="space-y-4">
            <div>
              <Label>Quốc gia</Label>
              <div className="relative">
                <Select
                  options={countryOptions}
                  placeholder="Chọn quốc gia"
                  value={formData.country}
                  onChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  className="dark:bg-dark-900"
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <ChevronDownIcon />
                </span>
              </div>
            </div>

            <div>
              <Label>Service ID</Label>
              <Input
                type="text"
                placeholder="ID: 7172**********70150"
                value={formData.serviceId}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
              />
            </div>

            <div>
              <Label>App Name</Label>
              <Input
                type="text"
                placeholder="Tên ứng dụng"
                value={formData.appName}
                onChange={(e) => setFormData(prev => ({ ...prev, appName: e.target.value }))}
              />
            </div>

            <div>
              <Label>App Key</Label>
              <Input
                type="text"
                placeholder="App Key"
                value={formData.appKey}
                onChange={(e) => setFormData(prev => ({ ...prev, appKey: e.target.value }))}
              />
            </div>

            <div>
              <Label>App Secret</Label>
              <Input
                type="text"
                placeholder="App Secret"
                value={formData.appSecret}
                onChange={(e) => setFormData(prev => ({ ...prev, appSecret: e.target.value }))}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeModals}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Đang thêm...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* App List Modal */}
      {showAppListModal && (
        <Modal isOpen={showAppListModal} onClose={closeModals} className="max-w-7xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Danh sách App
            </h2>
            <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">STT</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Tên App</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Service ID</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">App Key</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">App Secret</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Trạng thái</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Ngày tạo</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Thao tác</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {appList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-gray-500 dark:text-gray-400">
                      Không có app nào
                    </TableCell>
                  </TableRow>
                ) : (
                  appList.map((app, idx) => {
                    const isEditing = editingAppId === app.id;
                    return (
                      <TableRow key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <TableCell className="py-3 text-gray-700 dark:text-gray-300">{idx + 1}</TableCell>
                        <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-medium">{app.appName}</TableCell>
                        <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-mono text-sm">{app.appId}</TableCell>
                        <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-mono text-sm">{app.appKey}</TableCell>
                        <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editAppSecret}
                              onChange={e => setEditAppSecret(e.target.value)}
                              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          ) : (
                            <span className="font-mono text-sm">{app.appSecret}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          {app.isActive ? (
                            <Badge size="sm" color="success">Hoạt động</Badge>
                          ) : (
                            <Badge size="sm" color="error">Không hoạt động</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                          {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCopyAuthUrl(app.appId, app.appName || 'Unknown App')}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                              title="Sao chép URL ủy quyền"
                            >
                              <FaCopy className="w-4 h-4" />
                            </button>
                            {isEditing ? (
                              <>
                                <button
                                  className="text-green-600 hover:text-green-800 dark:text-green-400"
                                  title="Lưu"
                                  onClick={() => handleSaveAppSecret(app.id)}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                <button
                                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300"
                                  title="Hủy"
                                  onClick={handleCancelEdit}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="text-amber-600 hover:text-amber-800 dark:text-amber-400"
                                  title="Sửa"
                                  onClick={() => handleEditAppSecret(app)}
                                >
                                  <FaEdit className="w-4 h-4" />
                                </button>
                                {(canDelete && app.isActive) && (
                                  <button
                                    onClick={() => {
                                      setSelectedApp(app);
                                      setShowDeleteAppModal(true);
                                    }}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400"
                                    title="Xóa"
                                  >
                                    <FaTrash className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Modal>
      )}

      {/* Delete App Confirmation Modal */}
      {showDeleteAppModal && selectedApp && canDelete && (
        <ConfirmDeleteModal
          isOpen={showDeleteAppModal}
          onClose={closeModals}
          onConfirm={() => handleDeleteApp(selectedApp.id)}
          title="Xác nhận xóa App"
          message={`Bạn có chắc chắn muốn xóa App "${selectedApp.appName}"?`}
        />
      )}

      {/* Delete Shop Confirmation Modal */}
      {showDeleteModal && selectedShop && canDelete && (
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onClose={closeModals}
          onConfirm={() => handleDeleteShop(selectedShop.id)}
          title="Xác nhận xóa Shop"
          message={`Bạn có chắc chắn muốn xóa Shop "${selectedShop.shopName || selectedShop.shopId}"? Hành động này không thể hoàn tác.`}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedShop && (
        <Modal isOpen={showDetailsModal} onClose={closeModals} className="max-w-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white vietnamese-text">
              Chi tiết Shop
            </h2>
            <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Shop Name</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg vietnamese-text">
                {selectedShop.shopName || 'N/A'}
              </div>
            </div>
            <div>
              <Label>Shop ID</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg font-mono">
                {selectedShop.shopId}
              </div>
            </div>
            <div>
              <Label>Quốc gia</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {selectedShop.country}
              </div>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {getStatusBadge(selectedShop.status)}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Thông tin ứng dụng</Label>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2 vietnamese-text">
                <div><strong>App Name:</strong> {selectedShop.app.appName}</div>
                <div><strong>App ID:</strong> <span className="font-mono">{selectedShop.app.appId}</span></div>
                <div><strong>App Key:</strong> <span className="font-mono">{selectedShop.app.appKey}</span></div>
                <div><strong>App Secret:</strong> <span className="font-mono">{selectedShop.app.appSecret}</span></div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={closeModals}>
              Đóng
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
