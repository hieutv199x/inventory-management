"use client";
import React, { useState, useEffect } from 'react';
import { FaUsers, FaPlus, FaEdit, FaTrash, FaTimes, FaSearch } from 'react-icons/fa';
import { userShopRoleApi, userApi, shopApi } from '@/lib/api-client';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';

interface UserShopRole {
  id: string;
  userId: string;
  shopId: string;
  role: 'OWNER' | 'RESOURCE' | 'ACCOUNTANT' | 'SELLER';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  shop: {
    id: string;
    shopName: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Shop {
  id: string;
  shopName: string;
}

export default function PermissionsPage() {
  const [userRoles, setUserRoles] = useState<UserShopRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserShopRole | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    shopId: '',
    role: 'SELLER' as UserShopRole['role']
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [searchLoading, setSearchLoading] = useState(false);

  const roleColors = {
    OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    RESOURCE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    ACCOUNTANT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    SELLER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  };

  const roleDescriptions = {
    OWNER: {
      label: 'Owner - Chủ sở hữu',
      description: 'Toàn quyền truy cập và sử dụng tất cả các tính năng của hệ thống'
    },
    RESOURCE: {
      label: 'Resource - Quản lý Tài nguyên',
      description: 'Kết nối và quản lý shop, thiết lập tài nguyên hệ thống (không được xóa shop)'
    },
    ACCOUNTANT: {
      label: 'Accountant - Kế toán',
      description: 'Quản lý tài chính, đối soát, báo cáo, quản lý đơn hàng và fulfill'
    },
    SELLER: {
      label: 'Seller - Nhân viên bán hàng',
      description: 'Quản lý sản phẩm, đơn hàng, listing, promotions và các hoạt động bán hàng'
    }
  };

  // Fetch user roles with pagination and search
  const fetchUserRoles = async (page = 1, search = '', shopFilter = 'all') => {
    try {
      setSearchLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(shopFilter !== 'all' && { shopId: shopFilter })
      });
      
      const data = await userShopRoleApi.getAll(`?${params}`);
      setUserRoles(data.userRoles || []);
      setPagination({
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 10,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      });
    } catch (error: any) {
      console.error('Error fetching user roles:', error);
      setError('Không thể tải danh sách quyền người dùng');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUserRoles(1, searchTerm, selectedShop);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedShop]);

  // Fetch users for dropdown
  const fetchUsers = async () => {
    try {
      const data = await userApi.getAll('?limit=100'); // Get more users for dropdown
      setUsers(data.users.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email
      })) || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch shops for dropdown
  const fetchShops = async () => {
    try {
      const data = await shopApi.getAll();
      setShops(data.shops || []);
    } catch (error: any) {
      console.error('Error fetching shops:', error);
    }
  };

  useEffect(() => {
    // Fetch initial data
    setLoading(true);
    Promise.all([
      fetchUserRoles(),
      fetchUsers(),
      fetchShops()
    ]).catch(error => {
      console.error('Error fetching initial data:', error);
      setError('Không thể tải dữ liệu');
    }).finally(() => setLoading(false));
  }, []);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchUserRoles(newPage, searchTerm, selectedShop);
  };

  // Handle page size change
  const handlePageSizeChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    const params = new URLSearchParams({
      page: '1',
      limit: newLimit.toString(),
      ...(searchTerm && { search: searchTerm }),
      ...(selectedShop !== 'all' && { shopId: selectedShop })
    });
    
    setSearchLoading(true);
    userShopRoleApi.getAll(`?${params}`).then(data => {
      setUserRoles(data.userRoles || []);
      setPagination({
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || newLimit,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      });
    }).catch(error => {
      console.error('Error fetching user roles:', error);
      setError('Không thể tải danh sách quyền người dùng');
    }).finally(() => {
      setSearchLoading(false);
    });
  };

  // Assign role to user
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await userShopRoleApi.create(formData);
      setSuccess('Phân quyền thành công');
      setShowAssignModal(false);
      setFormData({ userId: '', shopId: '', role: 'SELLER' });
      await fetchUserRoles(pagination.page, searchTerm, selectedShop);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update role
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setLoading(true);
    setError('');

    try {
      await userShopRoleApi.update(selectedRole.id, { role: formData.role });
      setSuccess('Cập nhật quyền thành công');
      setShowEditModal(false);
      setSelectedRole(null);
      await fetchUserRoles(pagination.page, searchTerm, selectedShop);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Remove role
  const handleRemoveRole = async (roleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này khỏi cửa hàng?')) return;

    try {
      await userShopRoleApi.delete(roleId);
      setSuccess('Đã xóa người dùng khỏi cửa hàng thành công');
      await fetchUserRoles(pagination.page, searchTerm, selectedShop);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const openEditModal = (userRole: UserShopRole) => {
    setSelectedRole(userRole);
    setFormData({
      userId: userRole.userId,
      shopId: userRole.shopId,
      role: userRole.role
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAssignModal(false);
    setShowEditModal(false);
    setSelectedRole(null);
    setFormData({ userId: '', shopId: '', role: 'SELLER' });
    setError('');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <FaUsers className="h-8 w-8 text-brand-500" />
          <div className="vietnamese-text">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Phân quyền cửa hàng
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quản lý quyền và phân quyền người dùng trên tất cả các cửa hàng
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowAssignModal(true)}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center space-x-2"
        >
          <FaPlus className="h-4 w-4" />
          <span>Thêm người dùng vào cửa hàng</span>
        </button>
      </div>

      {/* Enhanced Filters with Search Loading */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng hoặc cửa hàng..."
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
        <select
          value={selectedShop}
          onChange={(e) => setSelectedShop(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">Tất cả cửa hàng</option>
          {shops.map(shop => (
            <option key={shop.id} value={shop.id}>{shop.shopName}</option>
          ))}
        </select>
        {(searchTerm || selectedShop !== 'all') && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            Tìm thấy {pagination.total} quyền
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedShop('all');
              }}
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
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            mục mỗi trang
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Hiển thị {((pagination.page - 1) * pagination.limit) + 1} đến{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} của{' '}
            {pagination.total} mục
          </span>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white vietnamese-text">

            {(searchTerm || selectedShop !== 'all') 
              ? `Kết quả tìm kiếm (${pagination.total})` 
              : `Quyền truy cập của người dùng (${pagination.total})`
            }
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cửa hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quyền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ngày phân công
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {userRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {(searchTerm || selectedShop !== 'all')
                      ? `Không có quyền nào khớp với tiêu chí tìm kiếm của bạn.`
                      : 'Không tìm thấy quyền người dùng. Thêm người dùng vào cửa hàng để bắt đầu.'
                    }
                  </td>
                </tr>
              ) : (
                userRoles.map((userRole) => (
                  <tr key={userRole.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-medium">
                          {userRole.user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white vietnamese-text">
                            {userRole.user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 vietnamese-text">
                            {userRole.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white vietnamese-text">
                        {userRole.shop.shopName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[userRole.role]}`}>
                        {userRole.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(userRole.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        onClick={() => openEditModal(userRole)}
                        className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 inline-flex items-center space-x-1"
                      >
                        <FaEdit className="h-3 w-3" />
                        <span>Sửa</span>
                      </button>
                      <button 
                        onClick={() => handleRemoveRole(userRole.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center space-x-1"
                      >
                        <FaTrash className="h-3 w-3" />
                        <span>Xóa</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Assign Role Modal */}
      {showAssignModal && (
        <Modal isOpen={showAssignModal} onClose={closeModals} className="max-w-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white vietnamese-text">
              Phân quyền người dùng vào cửa hàng
            </h2>
            <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleAssignRole} className="space-y-4">
            <div>
              <Label>Người dùng</Label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white vietnamese-text"
                required
              >
                <option value="">Chọn người dùng</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Cửa hàng</Label>
              <select
                value={formData.shopId}
                onChange={(e) => setFormData(prev => ({ ...prev, shopId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white vietnamese-text"
                required
              >
                <option value="">Chọn cửa hàng</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>
                    {shop.shopName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Vai trò và quyền hạn</Label>
              <div className="space-y-3">
                {Object.entries(roleDescriptions).map(([role, info]) => (
                  <div 
                    key={role}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.role === role
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, role: role as UserShopRole['role'] }))}
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={formData.role === role}
                        onChange={() => setFormData(prev => ({ ...prev, role: role as UserShopRole['role'] }))}
                        className="mr-3 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="font-medium text-gray-900 dark:text-white vietnamese-text">
                        {info.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6 vietnamese-text">
                      {info.description}
                    </p>
                  </div>
                ))}
              </div>
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
                {loading ? 'Đang phân quyền...' : 'Phân quyền'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <Modal isOpen={showEditModal} onClose={closeModals} className="max-w-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white vietnamese-text">
              Cập nhật quyền người dùng
            </h2>
            <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded vietnamese-text">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Người dùng: <strong className="text-gray-900 dark:text-white">{selectedRole.user.name}</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cửa hàng: <strong className="text-gray-900 dark:text-white">{selectedRole.shop.shopName}</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vai trò hiện tại: <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[selectedRole.role]}`}>
                {roleDescriptions[selectedRole.role].label}
              </span>
            </p>
          </div>

          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div>
              <Label>Chọn vai trò mới</Label>
              <div className="space-y-3">
                {Object.entries(roleDescriptions).map(([role, info]) => (
                  <div 
                    key={role}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.role === role
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, role: role as UserShopRole['role'] }))}
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={formData.role === role}
                        onChange={() => setFormData(prev => ({ ...prev, role: role as UserShopRole['role'] }))}
                        className="mr-3 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="font-medium text-gray-900 dark:text-white vietnamese-text">
                        {info.label}
                      </span>
                      {selectedRole.role === role && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Hiện tại)</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6 vietnamese-text">
                      {info.description}
                    </p>
                  </div>
                ))}
              </div>
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
                disabled={loading || formData.role === selectedRole.role}
                className="flex-1"
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật quyền'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
