"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Modal } from '@/components/ui/modal';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import LoadingButton from '@/components/ui/loading/LoadingButton';
import { useLanguage } from '@/context/LanguageContext';
import { shopGroupApi, userShopRoleApi } from '@/lib/api-client';

type Role = 'OWNER' | 'RESOURCE' | 'ACCOUNTANT' | 'SELLER';

type UserOption = {
  id: string;
  name: string;
  username: string;
};

type ShopOption = {
  id: string;
  shopName: string;
  shopId?: string;
  managedName?: string | null;
  groupId?: string | null;
  groupName?: string | null;
};

type ShopGroupOption = {
  id: string;
  name: string;
  managerName?: string | null;
};

interface AssignUserShopGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserOption[];
  shops: ShopOption[];
  onSuccess: (message: string) => Promise<void> | void;
  onError: (message: string) => void;
  defaultRole?: Role;
}

const DEFAULT_ROLE: Role = 'SELLER';

const AssignUserShopGroupModal: React.FC<AssignUserShopGroupModalProps> = ({
  isOpen,
  onClose,
  users,
  shops,
  onSuccess,
  onError,
  defaultRole = DEFAULT_ROLE,
}) => {
  const { t } = useLanguage();
  const [groupOptions, setGroupOptions] = useState<ShopGroupOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [formState, setFormState] = useState({
    userId: '',
    groupId: '',
    shopId: '',
    role: defaultRole as Role,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormState({ userId: '', groupId: '', shopId: '', role: defaultRole });
    setLocalError('');

    const fetchGroups = async () => {
      try {
        setGroupsLoading(true);
        const response = await shopGroupApi.getAll();
        const options: ShopGroupOption[] = (response.groups || []).map((group: any) => ({
          id: group.id,
          name: group.name,
          managerName: group.manager?.name ?? null,
        }));
        setGroupOptions(options);
      } catch (error: any) {
        console.error('Error fetching shop groups:', error);
        const message = t('permissions.assign_with_group.error_generic');
        setLocalError(message);
        onError(message);
      } finally {
        setGroupsLoading(false);
      }
    };

    fetchGroups();
  }, [isOpen, defaultRole, onError, t]);

  useEffect(() => {
    if (!isOpen) {
      setLocalError('');
    }
  }, [isOpen]);

  const availableShops = useMemo(() => {
    if (!formState.groupId) {
      return shops;
    }

    return shops.filter((shop) => shop.groupId === formState.groupId);
  }, [formState.groupId, shops]);

  useEffect(() => {
    if (formState.groupId && formState.shopId) {
      const shopStillAvailable = availableShops.some((shop) => shop.id === formState.shopId);
      if (!shopStillAvailable) {
        setFormState((prev) => ({ ...prev, shopId: '' }));
      }
    }
  }, [availableShops, formState.groupId, formState.shopId]);

  const handleClose = () => {
    setLocalError('');
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');

    if (!formState.userId) {
      const message = t('permissions.assign_modal.select_user');
      setLocalError(message);
      onError(message);
      return;
    }

    if (!formState.shopId) {
      const message = t('permissions.assign_modal.select_shop');
      setLocalError(message);
      onError(message);
      return;
    }

    setSubmitting(true);

    try {
      if (formState.groupId) {
        const groupResponse = await shopGroupApi.getById(formState.groupId);
        const existingMembers: string[] = (groupResponse.group?.members || [])
          .filter((member: any) => member.isActive !== false)
          .map((member: any) => member.user?.id)
          .filter(Boolean);

        const updatedMemberIds = Array.from(new Set([...existingMembers, formState.userId]));
        await shopGroupApi.update(formState.groupId, { memberIds: updatedMemberIds });
      }

      await userShopRoleApi.create({
        userId: formState.userId,
        shopId: formState.shopId,
        role: formState.role,
      });

      const successMessage = t('permissions.assign_with_group.success');
      await onSuccess(successMessage);
      handleClose();
    } catch (error: any) {
      console.error('Error assigning user to shop/group:', error);
      const message = error?.message || t('permissions.assign_with_group.error_generic');
      setLocalError(message);
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions: { value: Role; label: string }[] = [
    { value: 'OWNER', label: t('permissions.role.owner.label') },
    { value: 'RESOURCE', label: t('permissions.role.resource.label') },
    { value: 'ACCOUNTANT', label: t('permissions.role.accountant.label') },
    { value: 'SELLER', label: t('permissions.role.seller.label') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white vietnamese-text">
          {t('permissions.assign_with_group.title')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>{t('permissions.assign_with_group.user')}</Label>
          <select
            value={formState.userId}
            onChange={(event) => setFormState((prev) => ({ ...prev, userId: event.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            disabled={submitting}
            required
          >
            <option value="">{t('permissions.assign_modal.select_user')}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.username})
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>{t('permissions.assign_with_group.group')}</Label>
          {groupsLoading ? (
            <div className="py-2 text-sm text-gray-500 dark:text-gray-400">
              {t('common.loading')}
            </div>
          ) : groupOptions.length === 0 ? (
            <div className="py-2 text-sm text-gray-500 dark:text-gray-400">
              {t('permissions.assign_with_group.no_groups')}
            </div>
          ) : (
            <select
              value={formState.groupId}
              onChange={(event) => setFormState((prev) => ({ ...prev, groupId: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={submitting}
            >
              <option value="">{t('permissions.assign_with_group.group_optional_hint')}</option>
              {groupOptions.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                  {group.managerName ? ` • ${group.managerName}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <Label>{t('permissions.assign_with_group.shop')}</Label>
          {formState.groupId && availableShops.length === 0 ? (
            <div className="py-2 text-sm text-gray-500 dark:text-gray-400">
              {t('permissions.assign_with_group.no_shops')}
            </div>
          ) : (
            <select
              value={formState.shopId}
              onChange={(event) => setFormState((prev) => ({ ...prev, shopId: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={submitting || (formState.groupId ? availableShops.length === 0 : shops.length === 0)}
              required
            >
              <option value="">{t('permissions.assign_modal.select_shop')}</option>
              {(formState.groupId ? availableShops : shops).map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.shopName}
                  {shop.shopId ? ` (${shop.shopId})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <Label>{t('permissions.assign_with_group.role')}</Label>
          <select
            value={formState.role}
            onChange={(event) => setFormState((prev) => ({ ...prev, role: event.target.value as Role }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            disabled={submitting}
            required
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {localError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
            {localError}
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={submitting}
          >
            {t('common.cancel')}
          </Button>
          <LoadingButton
            type="submit"
            loading={submitting}
            loadingText={t('permissions.assign_with_group.submitting')}
            className="flex-1"
          >
            {t('permissions.assign_with_group.submit')}
          </LoadingButton>
        </div>
      </form>
    </Modal>
  );
};

export default AssignUserShopGroupModal;
