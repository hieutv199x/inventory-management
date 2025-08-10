"use client";
import React, {useEffect, useState, useCallback } from 'react';
import Button from "@/components/ui/button/Button";
import { EyeIcon, TrashBinIcon, TimeIcon, ArrowUpIcon, EnvelopeIcon } from "@/icons";
import { FaSearch } from 'react-icons/fa';
import ImportBankModal from "@/components/bank/ImportBankModal";
import ShopAssignModal from '@/components/bank/ShopAssignModal';
import ConfirmDeleteModal from '@/components/ui/modal/ConfirmDeleteModal';
import HistoryModal from '@/components/bank/HistoryModal';
import BankDetailsModal from '@/components/bank/BankDetailsModal';
import { useAuth } from '@/context/authContext';
import axiosInstance from "@/utils/axiosInstance";

interface BankAccount {
  id: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
  bankName: string;
  accountHolder: string;
  uploadDate: string;
  uploader: string;
  status: 'used' | 'unused'; // Changed from 'USED' | 'UNUSED' to match modal expectations
  shop?: string;
  setupDate?: string;
  assignedSeller?: string;
}

export default function BankManagementPage() {
  const { user } = useAuth();
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);

  // Role-based permission checks - Updated to match actual role types
  const canImport = user?.role === 'ADMIN';
  const canAssignShop = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';
  const canDelete = user?.role === 'ADMIN';

  // Fetch banks with search and pagination
  const getBanks = useCallback(async (page = 1, search = '', limit = 10) => {
    try {
      setSearchLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      
      const response = await axiosInstance.get(`/banks?${params}`);
      
      // Transform the backend response to match frontend interface
      const transformedBanks = (response.data.banks || []).map((bank: any) => ({
        ...bank,
        status: bank.status === 'USED' ? 'used' : 'unused' // Transform USED/UNUSED to used/unused
      }));
      
      setBanks(transformedBanks);
      setPagination({
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || limit,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.totalPages || 0
      });
    } catch (error) {
      console.error("Failed to fetch banks:", error);
      // Optional: hiện toast báo lỗi
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getBanks(1, searchTerm, pagination.limit);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial fetch
  useEffect(() => {
    getBanks(1, '', 10);
  }, [getBanks]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    getBanks(newPage, searchTerm, pagination.limit);
  };

  // Handle page size change
  const handlePageSizeChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    getBanks(1, searchTerm, newLimit);
  };

  const handleImportSuccess = async (importedBanks: BankAccount[]) => {
    try {
      await axiosInstance.post("/banks",{
        banks: importedBanks,
      });
      await getBanks(pagination.page, searchTerm, pagination.limit);
      setShowImportModal(false);
    } catch (error) {
      console.error("Import failed:", error);
      // Optional: show toast or error state
    }
  };

  const handleShopAssign = async  (bankId: string, shopId: string) => {
     await axiosInstance.put(`/banks/${bankId}`, {
      shopId: shopId,
    });
    await getBanks(pagination.page, searchTerm, pagination.limit);
    setShowShopModal(false);
  };

  const handleDelete = async (bankId: string) => {
    try {
      await axiosInstance.delete(`/banks/${bankId}`);
      await getBanks(pagination.page, searchTerm, pagination.limit);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/bank_import_template.csv';
    link.download = 'bank_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Quản lý Bank
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Quản lý danh sách tài khoản ngân hàng và gán cho các shop
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex gap-3">
          {canImport && (
            <>
              <Button 
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2"
              >
                <ArrowUpIcon className="w-4 h-4" />
                Import Bank
              </Button>
              <Button 
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Tải mẫu CSV
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2"
          >
            <TimeIcon className="w-5 h-5" />
            Lịch sử hành động
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full lg:w-80">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Tìm kiếm Account number, Routing number, Swift code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white vietnamese-text"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          Tìm thấy {pagination.total} tài khoản ngân hàng
          <button
            onClick={() => setSearchTerm('')}
            className="ml-2 text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Xóa
          </button>
        </div>
      )}

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
            tài khoản mỗi trang
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Hiển thị {((pagination.page - 1) * pagination.limit) + 1} đến{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} của{' '}
            {pagination.total} tài khoản
          </span>
        </div>
      </div>

      {/* Bank Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Thông tin Bank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ngày upload
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Người upload
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tình trạng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Shop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ngày set up
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nhân sự
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {banks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm 
                      ? `Không có tài khoản ngân hàng nào khớp với "${searchTerm}". Thử tìm kiếm khác.`
                      : 'Chưa có tài khoản ngân hàng nào. Bắt đầu bằng cách import tài khoản đầu tiên.'
                    }
                  </td>
                </tr>
              ) : (
                banks.map((bank) => (
                  <tr key={bank.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {bank.bankName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {bank.accountNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {new Date(bank.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {bank.uploader}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        bank.status === 'used' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {bank.status === 'used' ? 'Đã dùng' : 'Chưa dùng'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {bank.shop || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {bank.setupDate ? new Date(bank.setupDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {bank.assignedSeller || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedBank(bank);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          title="Xem thông tin"
                        >
                          <EyeIcon className="w-6 h-6" />
                        </button>
                        {bank.status === 'unused' && canAssignShop && (
                          <button
                            onClick={() => {
                              setSelectedBank(bank);
                              setShowShopModal(true);
                            }}
                            className="text-green-600 hover:text-green-800 dark:text-green-400"
                            title="Set up shop"
                          >
                            <EnvelopeIcon className="w-6 h-6" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              setSelectedBank(bank);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                            title="Xóa"
                          >
                            <TrashBinIcon className="w-6 h-6" />
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

      {/* Modals */}
      {showImportModal && canImport && (
        <ImportBankModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      )}

      {showShopModal && selectedBank && canAssignShop && (
        <ShopAssignModal
          isOpen={showShopModal}
          onClose={() => setShowShopModal(false)}
          bank={selectedBank}
          onConfirm={handleShopAssign}
        />
      )}

      {showDetailsModal && selectedBank && (
        <BankDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          bank={selectedBank}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showDeleteModal && selectedBank && canDelete && (
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => handleDelete(selectedBank.id)}
          title="Xác nhận xóa bank"
          message={`Bạn có chắc chắn muốn xóa tài khoản ${selectedBank.accountNumber}?`}
        />
      )}
    </div>
  );
}
