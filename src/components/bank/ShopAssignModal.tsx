"use client";
import React, { useState } from 'react';
import Button from "@/components/ui/button/Button";
import SelectShop from "@/components/common/SelectShop";
import { Modal } from "../ui/modal";
interface BankAccount {
  id: string;
  accountNumber: string;
  bankName: string;
}

interface ShopAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: BankAccount;
  onConfirm: (bankId: string, shopId: string) => void;
}

const mockShops = [
  { id: '1', name: 'Shop Electronics' },
  { id: '2', name: 'Shop Fashion' },
  { id: '3', name: 'Shop Beauty' },
  { id: '4', name: 'Shop Sports' }
];

export default function ShopAssignModal({ isOpen, onClose, bank, onConfirm }: ShopAssignModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedShop) {
        setIsConfirming(true);
        setTimeout(() => {
          onConfirm(bank.id, selectedShop);
          setIsConfirming(false);
        }, 1000);
    }
  };

  return (
      <Modal
          isOpen={isOpen}
          onClose={onClose} className="max-w-md p-6" >
        <div>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
            Set up Shop
          </h4>
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
              <SelectShop
                  onChange={(val) => setSelectedShop(val)}
                  placeholder="Select Shop"
                  enablePlaceholder={true}
              />
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
      </Modal>
  );
}
