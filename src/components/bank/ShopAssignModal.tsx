"use client";
import React, { useState } from 'react';
import Button from "@/components/ui/button/Button";
import { CloseLineIcon } from "@/icons";

interface BankAccount {
  id: string;
  accountNumber: string;
  bankName: string;
}

interface ShopAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: BankAccount;
  onConfirm: (bankId: string, shopName: string) => void;
}

const mockShops = [
  { id: '1', name: 'Shop Electronics' },
  { id: '2', name: 'Shop Fashion' },
  { id: '3', name: 'Shop Beauty' },
  { id: '4', name: 'Shop Sports' }
];

export default function ShopAssignModal({ isOpen, onClose, bank, onConfirm }: ShopAssignModalProps) {
  const [selectedShop, setSelectedShop] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedShop) {
      const shop = mockShops.find(s => s.id === selectedShop);
      if (shop) {
        setIsConfirming(true);
        setTimeout(() => {
          onConfirm(bank.id, shop.name);
          setIsConfirming(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Set up Shop
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <CloseLineIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tài khoản Bank:
            </h3>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">{bank.bankName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{bank.accountNumber}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chọn Shop <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">-- Chọn shop --</option>
              {mockShops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-6">
            <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
              Lưu ý: Bạn không thể chọn lại shop sau khi nhấn Xác nhận. Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              disabled={!selectedShop || isConfirming}
              className="flex-1"
            >
              {isConfirming ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isConfirming}
            >
              Hủy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
