"use client";
import React, {useEffect, useState } from 'react';
import Button from "@/components/ui/button/Button";
import { EyeIcon, TrashBinIcon, TimeIcon, ArrowUpIcon, EnvelopeIcon } from "@/icons";
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
  status: 'used' | 'unused';
  shop?: string;
  setupDate?: string;
  assignedSeller?: string;
}

export default function BankManagementPage() {
  const { user } = useAuth();
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredBanks = banks.filter(bank =>
    bank.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.routingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.swiftCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImportSuccess = async (importedBanks: BankAccount[]) => {
    try {
      await axiosInstance.post("/banks",{
        banks: importedBanks,
      });
      getBanks();
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
    getBanks();
    setShowShopModal(false);
  };

  const handleDelete = async (bankId: string) => {
    try {
      await axiosInstance.delete(`/banks/${bankId}`);
      //toast.success("Bank deleted successfully!");
      // Optional: refetch banks or update state
      getBanks();
    } catch (error) {
      //toast.error("Failed to delete bank");
      console.error("Delete error:", error);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const getBanks = async () => {
    try {
      const response = await axiosInstance.get("/banks");
      setBanks(response.data);
    } catch (error) {
      console.error("Failed to fetch banks:", error);
      // Optional: hiện toast báo lỗi
    }
  };

  useEffect(() => {
    getBanks();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Quản lý Bank
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Quản lý danh sách tài khoản ngân hàng và gán cho các shop
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          {canImport && (
            <Button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2"
            >
              <ArrowUpIcon className="w-4 h-4" />
              Import Bank
            </Button>
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
        
        <div className="w-80">
          <input
            type="text"
            placeholder="Tìm kiếm Account number, Routing number, Swift code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
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
              {filteredBanks.map((bank) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
