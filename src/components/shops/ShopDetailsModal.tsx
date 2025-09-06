"use client";
import React from 'react';
import { FaTimes, FaEdit } from 'react-icons/fa';
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface Shop {
  id: string;
  shopId: string;
  shopName: string | null;
  managedName: string | null;
  shopCipher: string | null;
  app: {
    id: string;
    channel: string;
    appSecret: string | null;
    appName: string | null;
  };
  region: string;
  status: string | null;
  createdAt: string;
}

interface ShopDetailsModalProps {
  shop: Shop | null;
  isOpen: boolean;
  onClose: () => void;
  onEditManagedName: (shop: Shop) => void;
}

const ShopDetailsModal: React.FC<ShopDetailsModalProps> = ({
  shop,
  isOpen,
  onClose,
  onEditManagedName
}) => {
  if (!shop) return null;

  // Helper to render status badge
  const getStatusBadge = (status?: string | null) => {
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
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white vietnamese-text">
          Chi tiết Shop
        </h2>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Đóng"
        >
          <FaTimes className="h-5 w-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Managed Name</Label>
            <button
              onClick={() => onEditManagedName(shop)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm flex items-center gap-1 transition-colors"
              title="Sửa tên quản lý"
            >
              <FaEdit className="h-3 w-3" />
              <span>Sửa</span>
            </button>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg vietnamese-text">
            {shop.managedName || (
              <span className="italic text-gray-500 dark:text-gray-400">
                No managed name set
              </span>
            )}
          </div>
        </div>

        <div>
          <Label>Shop Name (TikTok)</Label>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg vietnamese-text">
            {shop.shopName || 'N/A'}
          </div>
        </div>

        <div>
          <Label>Shop ID</Label>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg font-mono">
            {shop.shopId}
          </div>
        </div>

        <div>
          <Label>Quốc gia</Label>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {shop.region}
          </div>
        </div>

        <div>
          <Label>Trạng thái</Label>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {getStatusBadge(shop.status)}
          </div>
        </div>

        <div>
          <Label>Ngày tạo</Label>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {new Date(shop.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        <div className="md:col-span-2">
          <Label>Thông tin ứng dụng</Label>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3 vietnamese-text">
            <div className="flex justify-between items-center">
              <strong className="text-gray-700 dark:text-gray-300">App Name:</strong>
              <span className="text-gray-900 dark:text-white">
                {shop.app.appName || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <strong className="text-gray-700 dark:text-gray-300">App ID:</strong>
              <span className="font-mono text-gray-900 dark:text-white text-sm">
                {shop.app.id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <strong className="text-gray-700 dark:text-gray-300">Channel:</strong>
              <span className="font-mono text-gray-900 dark:text-white text-sm">
                {shop.app.channel}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <strong className="text-gray-700 dark:text-gray-300">App Secret:</strong>
              <span className="font-mono text-gray-900 dark:text-white text-sm">
                {shop.app.appSecret ? '••••••••••••' : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  );
};

export default ShopDetailsModal;
