"use client";
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { LoadingButton } from '@/components/ui/loading';

interface Shop {
  id: string;
  shopId: string;
  shopName: string | null;
  managedName: string | null;
}

interface EditManagedNameModalProps {
  shop: Shop | null;
  isOpen: boolean;
  editValue: string;
  isUpdating: boolean;
  onClose: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
}

const EditManagedNameModal: React.FC<EditManagedNameModalProps> = ({
  shop,
  isOpen,
  editValue,
  isUpdating,
  onClose,
  onSave,
  onValueChange
}) => {
  if (!shop) return null;

  const isValidName = editValue?.trim() && 
                     editValue.trim().length >= 2 && 
                     editValue.trim().length <= 50;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Cập nhật tên quản lý
        </h2>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Đóng"
        >
          <FaTimes className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Shop hiện tại:
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">TikTok Name:</span> {shop.shopName || 'N/A'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Shop ID:</span> {shop.shopId}
          </p>
        </div>

        <div>
          <Label>
            Tên quản lý mới <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            placeholder="Nhập tên quản lý..."
            value={editValue}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={isUpdating}
          />
          <div className="mt-1 flex justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tên này sẽ giúp bạn dễ dàng nhận diện shop (2-50 ký tự)
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {editValue.length}/50
            </span>
          </div>
          {editValue.trim() && editValue.trim().length < 2 && (
            <p className="text-xs text-red-500 mt-1">
              Tên quản lý phải có ít nhất 2 ký tự
            </p>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isUpdating}
          >
            Hủy
          </Button>
          <LoadingButton
            type="button"
            onClick={onSave}
            loading={isUpdating}
            loadingText="Đang lưu..."
            disabled={!isValidName}
            className="flex-1"
          >
            Lưu thay đổi
          </LoadingButton>
        </div>
      </div>
    </Modal>
  );
};

export default EditManagedNameModal;
