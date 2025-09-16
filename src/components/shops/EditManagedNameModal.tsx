"use client";
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { LoadingButton } from '@/components/ui/loading';
import { useLanguage } from '@/context/LanguageContext';

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
  const { t } = useLanguage();

  if (!shop) return null;

  const isValidName = editValue?.trim() && 
                     editValue.trim().length >= 2 && 
                     editValue.trim().length <= 50;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('shop.edit_managed_name.title')}
        </h2>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title={t('common.close')}
        >
          <FaTimes className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('shop.edit_managed_name.current_shop')}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{t('shop.edit_managed_name.tiktok_name')}</span> {shop.shopName || 'N/A'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{t('shop.edit_managed_name.shop_id')}</span> {shop.shopId}
          </p>
        </div>

        <div>
          <Label>
            {t('shop.edit_managed_name.new_label')} <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            placeholder={t('shop.edit_managed_name.placeholder')}
            value={editValue}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={isUpdating}
          />
          <div className="mt-1 flex justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('shop.edit_managed_name.helper')}
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('common.characters_count')}
            </span>
          </div>
          {editValue.trim() && editValue.trim().length < 2 && (
            <p className="text-xs text-red-500 mt-1">
              {t('shop.edit_managed_name.min_error')}
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
            {t('common.cancel')}
          </Button>
          <LoadingButton
            type="button"
            onClick={onSave}
            loading={isUpdating}
            loadingText={t('common.saving')}
            disabled={!isValidName}
            className="flex-1"
          >
            {t('common.save_changes')}
          </LoadingButton>
        </div>
      </div>
    </Modal>
  );
};

export default EditManagedNameModal;
