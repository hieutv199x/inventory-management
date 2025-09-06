"use client";
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { LoadingButton } from '@/components/ui/loading';
import { ChevronDownIcon } from "@/icons";

interface FormData {
  country: string;
  serviceId: string;
  appName: string;
  appKey: string;
  appSecret: string;
}

interface AddShopModalProps {
  isOpen: boolean;
  formData: FormData;
  loading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: FormData) => void;
}

const AddShopModal: React.FC<AddShopModalProps> = ({
  isOpen,
  formData,
  loading,
  onClose,
  onSubmit,
  onFormDataChange
}) => {
  const countryOptions = [
    { value: "US", label: "US" },
    { value: "UK", label: "UK" },
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white vietnamese-text">
          Import App
        </h2>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Đóng"
        >
          <FaTimes className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label>Quốc gia</Label>
          <div className="relative">
            <Select
              options={countryOptions}
              placeholder="Chọn quốc gia"
              value={formData.country}
              onChange={(value) => handleInputChange('country', value)}
              className="dark:bg-dark-900"
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        <div>
          <Label>Service ID <span className="text-red-500">*</span></Label>
          <Input
            type="text"
            placeholder="ID: 7172**********70150"
            value={formData.serviceId}
            onChange={(e) => handleInputChange('serviceId', e.target.value)}
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Service ID từ TikTok Shop Seller Center
          </p>
        </div>

        <div>
          <Label>App Name <span className="text-red-500">*</span></Label>
          <Input
            type="text"
            placeholder="Tên ứng dụng"
            value={formData.appName}
            onChange={(e) => handleInputChange('appName', e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <Label>App Key <span className="text-red-500">*</span></Label>
          <Input
            type="text"
            placeholder="App Key"
            value={formData.appKey}
            onChange={(e) => handleInputChange('appKey', e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <Label>App Secret <span className="text-red-500">*</span></Label>
          <Input
            type="text"
            placeholder="App Secret"
            value={formData.appSecret}
            onChange={(e) => handleInputChange('appSecret', e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Thông tin quan trọng
              </h3>
              <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                <p>Vui lòng đảm bảo các thông tin App được lấy từ TikTok Shop Seller Center chính xác để tránh lỗi kết nối.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Hủy
          </Button>
          <LoadingButton
            type="submit"
            loading={loading}
            loadingText="Đang thêm..."
            variant="primary"
            className="flex-1"
            disabled={!formData.serviceId.trim() || !formData.appName.trim() || !formData.appKey.trim() || !formData.appSecret.trim()}
          >
            Lưu thay đổi
          </LoadingButton>
        </div>
      </form>
    </Modal>
  );
};

export default AddShopModal;
