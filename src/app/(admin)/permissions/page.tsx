"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaUsers, FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaLayerGroup, FaUserPlus, FaStore, FaChevronDown, FaChevronRight } from 'react-icons/fa';

const ASSIGN_MODAL_SHOP_PAGE_SIZE = 20;
import { userShopRoleApi, userApi, shopApi, shopGroupApi } from '@/lib/api-client';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/authContext';
import AssignUserShopGroupModal from '@/components/permissions/AssignUserShopGroupModal';
import LoadingButton from '@/components/ui/loading/LoadingButton';
import CreateShopGroupModal from '@/components/permissions/CreateShopGroupModal';
import Select, { FormatOptionLabelMeta, MultiValue } from 'react-select';

interface UserShopRole {
  id: string;
  userId: string;
  shopId: string;
  role: 'OWNER' | 'RESOURCE' | 'ACCOUNTANT' | 'SELLER';
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
  shop: {
    id: string;
    shopName: string;
    managedName?: string | null;
  };
}

interface User {
  id: string;
  name: string;
  username: string;
}

interface Shop {
  id: string;
  shopName: string;
  shopId?: string;
  managedName?: string | null;
  groupId?: string | null;
  groupName?: string | null;
}

interface ShopOption {
  value: string;
  label: string;
  shopId?: string;
  groupName?: string | null;
}

interface UserOption {
  value: string;
  label: string;
  username?: string | null;
}

interface ShopGroupMember {
  id: string;
  user: {
    id: string;
    name?: string | null;
    username?: string | null;
    role?: string | null;
  } | null;
  role?: string | null;
  isDefault?: boolean;
}

interface ShopGroup {
  id: string;
  name: string;
  description?: string | null;
  manager: {
    id: string;
    name?: string | null;
    username?: string | null;
  } | null;
  members: ShopGroupMember[];
  shopCount: number;
}

interface AssignFormData {
  userId: string;
  shopIds: string[];
  role: UserShopRole['role'];
}

export default function PermissionsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;
  const [userRoles, setUserRoles] = useState<UserShopRole[]>([]);
  const [allUserRoles, setAllUserRoles] = useState<UserShopRole[]>([]); // Store all roles for client-side filtering
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAssignShopGroupModal, setShowAssignShopGroupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserShopRole | null>(null);
  const [formData, setFormData] = useState<AssignFormData>({
    userId: '',
    shopIds: [],
    role: 'SELLER'
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
  const [groups, setGroups] = useState<ShopGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<ShopGroup | null>(null);
  const [showAddUserToGroupModal, setShowAddUserToGroupModal] = useState(false);
  const [showAddShopToGroupModal, setShowAddShopToGroupModal] = useState(false);
  const [groupUserForm, setGroupUserForm] = useState<{ userIds: string[] }>({ userIds: [] });
  const [groupShopForm, setGroupShopForm] = useState({ shopIds: [] as string[] });
  const [groupModalError, setGroupModalError] = useState('');
  const [groupActionLoading, setGroupActionLoading] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [shopSelectPortalTarget, setShopSelectPortalTarget] = useState<HTMLElement | null>(null);
  const [userSelectPortalTarget, setUserSelectPortalTarget] = useState<HTMLElement | null>(null);
  const [assignModalShopFilter, setAssignModalShopFilter] = useState('');
  const [assignModalShopPage, setAssignModalShopPage] = useState(1);
  const canCreateGroups = useMemo(() => ['ADMIN', 'SUPER_ADMIN'].includes(user?.role ?? ''), [user?.role]);

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

  const mapShopGroup = useCallback((group: any): ShopGroup => ({
    id: group.id,
    name: group.name,
    description: group.description ?? null,
    manager: group.manager
      ? {
          id: group.manager.id,
          name: group.manager.name ?? null,
          username: group.manager.username ?? null
        }
      : null,
    members: (group.members || [])
      .filter((member: any) => member.isActive !== false)
      .map((member: any) => ({
        id: member.id,
        user: member.user
          ? {
              id: member.user.id,
              name: member.user.name ?? null,
              username: member.user.username ?? null,
              role: member.user.role ?? null
            }
          : null,
        role: member.role ?? null,
        isDefault: member.isDefault ?? false
      })),
    shopCount: group.shopCount ?? 0
  }), []);

  const refreshSelectedGroup = useCallback(
    async (groupId: string) => {
      try {
        const response = await shopGroupApi.getById(groupId);
        if (response.group) {
          const normalized = mapShopGroup(response.group);
          setSelectedGroup(normalized);
          return normalized;
        }
      } catch (error) {
        console.error('Error refreshing group details:', error);
      }
      return null;
    },
    [mapShopGroup]
  );

  // Fetch all user roles once
  const fetchUserRoles = async () => {
    try {
      setSearchLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '1000' // Fetch all at once
      });

      const data = await userShopRoleApi.getAll(`?${params}`);
      const roles = data.userRoles || [];
      setAllUserRoles(roles);
      setUserRoles(roles); // Initially show all
    } catch (error: any) {
      console.error('Error fetching user roles:', error);
      setError('Không thể tải danh sách quyền người dùng');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // Client-side filtering of user roles
  const filteredUserRoles = useMemo(() => {
    let filtered = allUserRoles;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(role => 
        role.user.name.toLowerCase().includes(searchLower) ||
        role.user.username.toLowerCase().includes(searchLower) ||
        role.shop.shopName.toLowerCase().includes(searchLower) ||
        (role.shop.managedName && role.shop.managedName.toLowerCase().includes(searchLower))
      );
    }

    // Apply shop filter
    if (selectedShop !== 'all') {
      filtered = filtered.filter(role => role.shopId === selectedShop);
    }

    return filtered;
  }, [allUserRoles, searchTerm, selectedShop]);

  // Client-side pagination
  const paginatedUserRoles = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredUserRoles.slice(startIndex, endIndex);
  }, [filteredUserRoles, pagination.page, pagination.limit]);

  // Update pagination totals when filtered results change
  useEffect(() => {
    const totalPages = Math.ceil(filteredUserRoles.length / pagination.limit) || 1;
    setPagination(prev => ({
      ...prev,
      total: filteredUserRoles.length,
      totalPages,
      page: Math.min(prev.page, totalPages) // Ensure page is within bounds
    }));
  }, [filteredUserRoles.length, pagination.limit]);

  // Fetch users for dropdown
  const fetchUsers = async () => {
    try {
      const data = await userApi.getAll('?limit=100'); // Get more users for dropdown
      setUsers(data.users.map((user: any) => ({
        id: user.id,
        name: user.name,
        username: user.username
      })) || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch shops for dropdown
  const fetchShops = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '200',
        status: 'ALL'
      });
      const data = await shopApi.getAll(`?${params.toString()}`);
      const normalizedShops: Shop[] = (data.shops || []).map((shop: any) => ({
        id: shop.id,
        shopName: shop.shopName ?? shop.managedName ?? shop.shopId ?? 'N/A',
        shopId: shop.shopId,
        managedName: shop.managedName ?? null,
        groupId: shop.group?.id ?? null,
        groupName: shop.group?.name ?? null
      }));
      setShops(normalizedShops);
    } catch (error: any) {
      console.error('Error fetching shops:', error);
    }
  };

  const fetchGroups = useCallback(async () => {
    try {
      setGroupsLoading(true);
      const response = await shopGroupApi.getAll();
      const normalizedGroups: ShopGroup[] = (response.groups || []).map(mapShopGroup);
      setGroups(normalizedGroups);
    } catch (error: any) {
      console.error('Error fetching shop groups:', error);
      setError(t('permissions.groups.load_failed'));
    } finally {
      setGroupsLoading(false);
    }
  }, [mapShopGroup, t]);

  const usersById = useMemo(() => {
    return new Map(users.map((userItem) => [userItem.id, userItem]));
  }, [users]);

  const shopsByGroup = useMemo(() => {
    const byGroup = new Map<string, Shop[]>();

    shops.forEach((shop) => {
      if (!shop.groupId) {
        return;
      }

      const current = byGroup.get(shop.groupId) ?? [];
      current.push(shop);
      byGroup.set(shop.groupId, current);
    });

    return byGroup;
  }, [shops]);

  const availableUsersForSelectedGroup = useMemo(() => {
    if (!selectedGroup) {
      return [] as User[];
    }

    const memberIds = new Set(
      selectedGroup.members
        .map((member) => member.user?.id)
        .filter(Boolean) as string[]
    );

    return users.filter((user) => !memberIds.has(user.id));
  }, [selectedGroup, users]);

  const userOptions = useMemo<UserOption[]>(() => {
    const fallbackLabel = t('permissions.groups.unknown_user');
    return availableUsersForSelectedGroup.map((user) => ({
      value: user.id,
      label: user.name || user.username || fallbackLabel,
      username: user.username ?? null
    }));
  }, [availableUsersForSelectedGroup, t]);

  const selectedUserOptions = useMemo<UserOption[]>(() => {
    if (groupUserForm.userIds.length === 0) {
      return [];
    }

    const selectedSet = new Set(groupUserForm.userIds);
    return userOptions.filter((option) => selectedSet.has(option.value));
  }, [groupUserForm.userIds, userOptions]);

  const formatUserOptionLabel = useCallback(
    (option: UserOption, meta: FormatOptionLabelMeta<UserOption>) => {
      if (meta.context === 'value') {
        return option.label;
      }

      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-white vietnamese-text">
            {option.label}
          </span>
          {option.username ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">{option.username}</span>
          ) : null}
        </div>
      );
    },
    []
  );

  const handleUserSelectChange = useCallback(
    (selected: MultiValue<UserOption>) => {
      const selectedIds = selected.map((option) => option.value);
      setGroupUserForm({ userIds: selectedIds });
      if (groupModalError) {
        setGroupModalError('');
      }
    },
    [groupModalError]
  );

  const availableShopsForSelectedGroup = useMemo(() => {
    if (!selectedGroup) {
      return shops;
    }

    return shops.filter((shop) => shop.groupId !== selectedGroup.id);
  }, [selectedGroup, shops]);

  const managedGroups = useMemo(() => {
    if (!userId) {
      return [] as ShopGroup[];
    }

    return groups.filter((group) => group.manager?.id === userId);
  }, [groups, userId]);

  const isGroupManagerContext = useMemo(() => {
    return userRole === 'MANAGER' && managedGroups.length > 0;
  }, [userRole, managedGroups]);

  const managedGroupMemberIds = useMemo(() => {
    const ids = new Set<string>();
    managedGroups.forEach((group) => {
      group.members.forEach((member) => {
        const memberId = member.user?.id;
        if (memberId) {
          ids.add(memberId);
        }
      });
    });
    return ids;
  }, [managedGroups]);

  const assignableUsers = useMemo(() => {
    if (!isGroupManagerContext) {
      return users;
    }

    if (managedGroupMemberIds.size === 0) {
      return [] as User[];
    }

    return users.filter((userItem) => managedGroupMemberIds.has(userItem.id));
  }, [isGroupManagerContext, users, managedGroupMemberIds]);

  const assignableShops = useMemo(() => {
    if (!isGroupManagerContext) {
      return shops;
    }

    const allowedGroupIds = new Set(managedGroups.map((group) => group.id));
    return shops.filter((shop) => shop.groupId && allowedGroupIds.has(shop.groupId));
  }, [isGroupManagerContext, shops, managedGroups]);

  const sortedAssignableShops = useMemo(() => {
    return [...assignableShops].sort((a, b) => {
      const nameA = a.managedName ?? a.shopName ?? a.shopId ?? '';
      const nameB = b.managedName ?? b.shopName ?? b.shopId ?? '';
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  }, [assignableShops]);

  const filteredAssignableShops = useMemo(() => {
    if (!assignModalShopFilter) {
      return sortedAssignableShops;
    }

    const keyword = assignModalShopFilter.trim().toLowerCase();
    if (!keyword) {
      return sortedAssignableShops;
    }

    return sortedAssignableShops.filter((shop) => {
      const displayName = shop.managedName ?? shop.shopName ?? shop.shopId ?? '';
      const shopCode = shop.shopId ?? '';
      const groupName = shop.groupName ?? '';
      return (
        displayName.toLowerCase().includes(keyword) ||
        shopCode.toLowerCase().includes(keyword) ||
        groupName.toLowerCase().includes(keyword)
      );
    });
  }, [assignModalShopFilter, sortedAssignableShops]);

  const totalFilteredAssignableShops = filteredAssignableShops.length;

  const paginatedAssignableShops = useMemo(() => {
    const start = (assignModalShopPage - 1) * ASSIGN_MODAL_SHOP_PAGE_SIZE;
    const end = start + ASSIGN_MODAL_SHOP_PAGE_SIZE;
    return filteredAssignableShops.slice(start, end);
  }, [assignModalShopPage, filteredAssignableShops]);

  const assignModalPageCount = useMemo(() => {
    return Math.max(1, Math.ceil(totalFilteredAssignableShops / ASSIGN_MODAL_SHOP_PAGE_SIZE));
  }, [totalFilteredAssignableShops]);

  useEffect(() => {
    if (assignModalShopPage > assignModalPageCount) {
      setAssignModalShopPage(assignModalPageCount);
    }
  }, [assignModalPageCount, assignModalShopPage]);

  const areAllAssignableShopsSelected = useMemo(() => {
    if (filteredAssignableShops.length === 0) {
      return false;
    }

    const selectedSet = new Set(formData.shopIds);
    return filteredAssignableShops.every((shop) => selectedSet.has(shop.id));
  }, [filteredAssignableShops, formData.shopIds]);

  const handleToggleShopSelection = useCallback((shopId: string) => {
    setFormData((prev) => {
      const isSelected = prev.shopIds.includes(shopId);
      const nextShopIds = isSelected
        ? prev.shopIds.filter((id) => id !== shopId)
        : [...prev.shopIds, shopId];
      return { ...prev, shopIds: nextShopIds };
    });
    setError('');
  }, []);

  const handleToggleAllAssignableShops = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      shopIds: areAllAssignableShopsSelected
        ? prev.shopIds.filter((shopId) => !filteredAssignableShops.some((shop) => shop.id === shopId))
        : Array.from(new Set([...prev.shopIds, ...filteredAssignableShops.map((shop) => shop.id)]))
    }));
    setError('');
  }, [areAllAssignableShopsSelected, filteredAssignableShops]);

  const shopSelectInputId = useMemo(
    () => (selectedGroup ? `add-shop-to-group-select-${selectedGroup.id}` : 'add-shop-to-group-select'),
    [selectedGroup]
  );

  const shopOptions = useMemo<ShopOption[]>(() => {
    return availableShopsForSelectedGroup.map((shop) => ({
      value: shop.id,
      label: shop.managedName ?? shop.shopName ?? shop.shopId ?? 'N/A',
      shopId: shop.shopId,
      groupName: shop.groupName
    }));
  }, [availableShopsForSelectedGroup]);

  const selectedShopOptions = useMemo(() => {
    if (!groupShopForm.shopIds.length) {
      return [] as ShopOption[];
    }

    const selectedSet = new Set(groupShopForm.shopIds);
    return shopOptions.filter((option) => selectedSet.has(option.value));
  }, [groupShopForm.shopIds, shopOptions]);

  const formatShopOptionLabel = useCallback(
    (option: ShopOption, meta: FormatOptionLabelMeta<ShopOption>) => {
      if (meta.context === 'value') {
        return (
          <div className="flex items-center gap-1">
            <span>{option.label}</span>
            {option.shopId && (
              <span className="text-xs text-gray-500 dark:text-gray-400">({option.shopId})</span>
            )}
          </div>
        );
      }

      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {option.label}
            {option.shopId ? ` (${option.shopId})` : ''}
          </span>
          {option.groupName && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('permissions.groups.add_shop_modal.current_group_label')} {option.groupName}
            </span>
          )}
        </div>
      );
    },
    [t]
  );

  const handleShopSelectChange = useCallback((selected: MultiValue<ShopOption>) => {
    setGroupShopForm({ shopIds: selected.map((option) => option.value) });
  }, []);

  // Group user roles by user (using paginated results)
  const groupedUserRoles = useMemo(() => {
    const grouped = new Map<string, {
      user: UserShopRole['user'];
      roles: UserShopRole[];
      shopCount: number;
    }>();

    paginatedUserRoles.forEach((userRole) => {
      const existing = grouped.get(userRole.userId);
      if (existing) {
        existing.roles.push(userRole);
        existing.shopCount = existing.roles.length;
      } else {
        grouped.set(userRole.userId, {
          user: userRole.user,
          roles: [userRole],
          shopCount: 1
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => 
      a.user.name.localeCompare(b.user.name)
    );
  }, [paginatedUserRoles]);

  useEffect(() => {
    if (!canCreateGroups && showCreateGroupModal) {
      setShowCreateGroupModal(false);
    }
  }, [canCreateGroups, showCreateGroupModal]);

  useEffect(() => {
    // Fetch initial data
    setLoading(true);
    Promise.all([
      fetchUserRoles(),
      fetchUsers(),
      fetchShops(),
      fetchGroups()
    ]).catch(error => {
      console.error('Error fetching initial data:', error);
      setError('Không thể tải dữ liệu');
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showAssignModal) {
      return;
    }

    if (formData.userId && !assignableUsers.some((userItem) => userItem.id === formData.userId)) {
      setFormData((prev) => ({ ...prev, userId: '' }));
    }

    if (formData.shopIds.length > 0) {
      const allowedShopIds = new Set(assignableShops.map((shopItem) => shopItem.id));
      const filteredShopIds = formData.shopIds.filter((shopId) => allowedShopIds.has(shopId));
      if (filteredShopIds.length !== formData.shopIds.length) {
        setFormData((prev) => ({ ...prev, shopIds: filteredShopIds }));
      }
    }
  }, [showAssignModal, assignableUsers, assignableShops, formData.userId, formData.shopIds]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const target = document.body;
    setShopSelectPortalTarget(target);
    setUserSelectPortalTarget(target);
  }, []);

  // Handle pagination (client-side only)
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle page size change (client-side only)
  const handlePageSizeChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Assign role to user
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.userId) {
      setError(t('permissions.assign_modal.select_user'));
      setLoading(false);
      return;
    }

    const uniqueShopIds = Array.from(new Set(formData.shopIds));
    if (uniqueShopIds.length === 0) {
      setError(t('permissions.assign_modal.select_shop'));
      setLoading(false);
      return;
    }

    let successCount = 0;
    let lastErrorMessage: string | null = null;

    for (const shopId of uniqueShopIds) {
      try {
        await userShopRoleApi.create({
          userId: formData.userId,
          shopId,
          role: formData.role
        });
        successCount += 1;
      } catch (error: any) {
        console.error('Error assigning role:', error);
        lastErrorMessage = error?.message || t('permissions.assign_modal.generic_error');
      }
    }

    if (successCount > 0) {
      const successMessage = successCount > 1
        ? t('permissions.assign_modal.success_multiple', { count: successCount })
        : t('permissions.assign_modal.success_single');
      setSuccess(successMessage);
      setShowAssignModal(false);
      setFormData({ userId: '', shopIds: [], role: 'SELLER' });
      await fetchUserRoles();
    }

    if (lastErrorMessage && successCount < uniqueShopIds.length) {
      setError(lastErrorMessage);
    } else if (successCount > 0) {
      setError('');
    }

    setLoading(false);
  };

  // Update role - handle multiple shops, add new shops, remove unselected shops, update role
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setLoading(true);
    setError('');

    try {
      const userId = formData.userId;
      const newShopIds = new Set(formData.shopIds);
      const existingRoles = allUserRoles.filter(r => r.userId === userId);
      const existingShopIds = new Set(existingRoles.map(r => r.shopId));

      // Determine shops to add and remove
      const shopsToAdd = Array.from(newShopIds).filter(shopId => !existingShopIds.has(shopId));
      const shopsToRemove = existingRoles.filter(role => !newShopIds.has(role.shopId));
      const shopsToUpdate = existingRoles.filter(role => newShopIds.has(role.shopId));

      let successCount = 0;
      let errorCount = 0;

      // Add new shop permissions
      for (const shopId of shopsToAdd) {
        try {
          await userShopRoleApi.create({
            userId,
            shopId,
            role: formData.role
          });
          successCount++;
        } catch (error: any) {
          console.error('Error adding shop permission:', error);
          errorCount++;
        }
      }

      // Update existing shop permissions (role change)
      for (const role of shopsToUpdate) {
        if (role.role !== formData.role) {
          try {
            await userShopRoleApi.update(role.id, { role: formData.role });
            successCount++;
          } catch (error: any) {
            console.error('Error updating shop permission:', error);
            errorCount++;
          }
        }
      }

      // Remove unselected shop permissions
      for (const role of shopsToRemove) {
        try {
          await userShopRoleApi.delete(role.id);
          successCount++;
        } catch (error: any) {
          console.error('Error removing shop permission:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(`Cập nhật quyền thành công (${successCount} thay đổi)`);
        setShowEditModal(false);
        setSelectedRole(null);
        await fetchUserRoles();
      } else if (errorCount > 0) {
        setError('Có lỗi xảy ra khi cập nhật quyền');
      } else {
        setSuccess('Không có thay đổi nào được thực hiện');
        setShowEditModal(false);
        setSelectedRole(null);
      }
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi cập nhật quyền');
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
      await fetchUserRoles();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const openAddUserToGroupModal = (group: ShopGroup) => {
    setSelectedGroup(group);
    setGroupUserForm({ userIds: [] });
    setGroupShopForm({ shopIds: [] });
    setGroupModalError('');
    setShowAddUserToGroupModal(true);
    void refreshSelectedGroup(group.id);
  };

  const openAddShopToGroupModal = (group: ShopGroup) => {
    setSelectedGroup(group);
    setGroupUserForm({ userIds: [] });
    setGroupShopForm({ shopIds: [] });
    setGroupModalError('');
    setShowAddShopToGroupModal(true);
  };

  const closeGroupModals = () => {
    setShowAddUserToGroupModal(false);
    setShowAddShopToGroupModal(false);
    setSelectedGroup(null);
    setGroupUserForm({ userIds: [] });
    setGroupShopForm({ shopIds: [] });
    setGroupModalError('');
  };

  const handleAddUserToGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGroup) {
      return;
    }

    if (groupUserForm.userIds.length === 0) {
      const message = t('permissions.groups.add_user_modal.no_selection');
      setGroupModalError(message);
      return;
    }

    setGroupActionLoading(true);
    setGroupModalError('');
    setError('');

    try {
      const groupResponse = await shopGroupApi.getById(selectedGroup.id);
      const existingMemberIds: string[] = (groupResponse.group?.members || [])
        .filter((member: any) => member.isActive !== false)
        .map((member: any) => member.user?.id)
        .filter(Boolean);

      const updatedMemberIds = Array.from(
        new Set([...existingMemberIds, ...groupUserForm.userIds])
      );

      await shopGroupApi.update(selectedGroup.id, {
        memberIds: updatedMemberIds,
      });

      setSuccess(t('permissions.groups.add_user_success'));
      await Promise.all([
        fetchGroups(),
        fetchUserRoles()
      ]);
      closeGroupModals();
    } catch (error: any) {
      console.error('Error adding user to group:', error);
      const message = error?.message || t('permissions.groups.add_user_error');
      setGroupModalError(message);
      setError(message);
    } finally {
      setGroupActionLoading(false);
    }
  };

  const handleRemoveUserFromGroup = async (member: ShopGroupMember) => {
    if (!selectedGroup) {
      return;
    }

    const userId = member.user?.id;
    if (!userId) {
      return;
    }

    const displayName = member.user?.name || member.user?.username || t('permissions.groups.unknown_user');
    const confirmMessage = t('permissions.groups.remove_user_confirm', { name: displayName });
    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) {
      return;
    }

    setGroupActionLoading(true);
    setGroupModalError('');
    setError('');

    try {
      const remainingMemberIds = selectedGroup.members
        .map((existingMember) => existingMember.user?.id)
        .filter((id): id is string => Boolean(id) && id !== userId);

      await shopGroupApi.update(selectedGroup.id, {
        memberIds: remainingMemberIds
      });

      const cascadeFailures: string[] = [];
      const associatedShops = shopsByGroup.get(selectedGroup.id) ?? [];

      for (const shop of associatedShops) {
        try {
          const params = new URLSearchParams({
            userId,
            shopId: shop.id,
            limit: '100'
          });
          const rolesResponse = await userShopRoleApi.getAll(`?${params.toString()}`);
          const roles = (rolesResponse.userRoles ?? []) as Array<{ id: string }>;

          for (const role of roles) {
            await userShopRoleApi.delete(role.id);
          }
        } catch (cascadeError) {
          console.error('Error removing shop access during cascade:', cascadeError);
          cascadeFailures.push(shop.shopName ?? shop.shopId ?? shop.id);
        }
      }

      await Promise.all([
        fetchGroups(),
        refreshSelectedGroup(selectedGroup.id),
        fetchUserRoles()
      ]);

      if (cascadeFailures.length > 0) {
        const warningMessage = t('permissions.groups.remove_user_cascade_warning', {
          name: displayName,
          shops: cascadeFailures.join(', ')
        });
        setGroupModalError(warningMessage);
        setError(warningMessage);
      } else {
        setSuccess(t('permissions.groups.remove_user_success', { name: displayName }));
      }
    } catch (error: any) {
      console.error('Error removing user from group:', error);
      const message = error?.message || t('permissions.groups.remove_user_error');
      setGroupModalError(message);
      setError(message);
    } finally {
      setGroupActionLoading(false);
    }
  };

  const handleAddShopToGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGroup) {
      return;
    }

    if (!groupShopForm.shopIds.length) {
      const message = t('permissions.groups.add_shop_modal.no_selection');
      setGroupModalError(message);
      return;
    }

    setGroupActionLoading(true);
    setGroupModalError('');
    setError('');

    try {
      const uniqueShopIds = Array.from(new Set(groupShopForm.shopIds));

      for (const shopId of uniqueShopIds) {
        await shopGroupApi.moveShop(shopId, {
          groupId: selectedGroup.id,
        });
      }

      setSuccess(t('permissions.groups.add_shop_success', { count: uniqueShopIds.length }));
      await Promise.all([fetchGroups(), fetchShops()]);
      closeGroupModals();
    } catch (error: any) {
      console.error('Error adding shop to group:', error);
      const message = error?.message || t('permissions.groups.add_shop_error');
      setGroupModalError(message);
      setError(message);
    } finally {
      setGroupActionLoading(false);
    }
  };

  const openEditModal = (userRole: UserShopRole) => {
    setSelectedRole(userRole);
    setFormData({
      userId: userRole.userId,
      shopIds: [userRole.shopId],
      role: userRole.role
    });
    setShowEditModal(true);
  };

  const openEditModalForUser = (groupedUser: { user: UserShopRole['user']; roles: UserShopRole[]; shopCount: number }) => {
    // Use the first role as selectedRole for reference
    setSelectedRole(groupedUser.roles[0]);
    setFormData({
      userId: groupedUser.user.id,
      shopIds: groupedUser.roles.map(r => r.shopId),
      role: groupedUser.roles[0].role // Use first role as default
    });
    setShowEditModal(true);
  };

  const handleRemoveUserPermissions = async (groupedUser: { user: UserShopRole['user']; roles: UserShopRole[]; shopCount: number }) => {
    const confirmMessage = `Bạn có chắc chắn muốn xóa tất cả quyền truy cập của ${groupedUser.user.name} (${groupedUser.shopCount} cửa hàng)?`;
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const role of groupedUser.roles) {
      try {
        await userShopRoleApi.delete(role.id);
        successCount++;
      } catch (error: any) {
        console.error('Error removing role:', error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      setSuccess(`Đã xóa ${successCount} quyền truy cập của ${groupedUser.user.name}`);
      await fetchUserRoles();
    }

    if (errorCount > 0) {
      setError(`Không thể xóa ${errorCount} quyền truy cập`);
    }

    setLoading(false);
  };

  const closeModals = () => {
    setShowAssignModal(false);
    setShowEditModal(false);
    setSelectedRole(null);
    setFormData({ userId: '', shopIds: [], role: 'SELLER' });
    setAssignModalShopFilter('');
    setAssignModalShopPage(1);
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
              {t('permissions.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('permissions.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center space-x-2"
          >
            <FaPlus className="h-4 w-4" />
            <span>{t('permissions.add_user_to_shop')}</span>
          </button>
        </div>
      </div>

      {/* Group Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white vietnamese-text">
              {t('permissions.groups.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 vietnamese-text">
              {t('permissions.groups.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            {canCreateGroups && (
              <button
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setGroupModalError('');
                  setShowCreateGroupModal(true);
                }}
                className="px-3 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                {t('permissions.groups.create_button')}
              </button>
            )}
            <button
              onClick={() => fetchGroups()}
              disabled={groupsLoading}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {groupsLoading ? t('common.loading') : t('common.refresh')}
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          {groupsLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-400 vietnamese-text">
              {t('permissions.groups.no_groups')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('permissions.groups.table.group')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('permissions.groups.table.manager')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('permissions.groups.table.members')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('permissions.groups.table.shops')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('permissions.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {groups.map((group) => {
                    const groupShops = shopsByGroup.get(group.id) ?? [];
                    const displayedMembers = group.members.slice(0, 3);
                    const extraMembers = Math.max(group.members.length - displayedMembers.length, 0);
                    const displayedShops = groupShops.slice(0, 3);
                    const totalShopCount = Math.max(group.shopCount ?? 0, groupShops.length);
                    const extraShops = Math.max(totalShopCount - displayedShops.length, 0);

                    return (
                      <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white vietnamese-text">
                            {group.name}
                          </div>
                          {group.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 vietnamese-text">
                              {group.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white align-top">
                          {group.manager ? (
                            <div>
                              <div className="font-medium vietnamese-text">
                                {group.manager.name ?? t('permissions.groups.unknown_user')}
                              </div>
                              {group.manager.username && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {group.manager.username}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white align-top">
                          {group.members.length === 0 ? (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {t('permissions.groups.no_members')}
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {displayedMembers.map((member) => {
                                const fallbackUser = member.user?.id ? usersById.get(member.user.id) : undefined;
                                const displayName = member.user?.name ?? fallbackUser?.name ?? fallbackUser?.username ?? t('permissions.groups.unknown_user');
                                const secondary = member.user?.username ?? fallbackUser?.username ?? '';

                                return (
                                  <span
                                    key={member.id}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 vietnamese-text"
                                  >
                                    {displayName}
                                    {secondary ? (
                                      <span className="ml-1 text-[10px] text-gray-500 dark:text-gray-400">
                                        ({secondary})
                                      </span>
                                    ) : null}
                                  </span>
                                );
                              })}
                              {extraMembers > 0 && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200">
                                  {t('permissions.groups.more_members', { count: extraMembers })}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white align-top">
                          {Math.max(group.shopCount ?? 0, groupShops.length) === 0 ? (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {t('permissions.groups.no_shops')}
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {displayedShops.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {displayedShops.map((shop) => (
                                    <span
                                      key={shop.id}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-xs text-brand-700 dark:text-brand-200 vietnamese-text"
                                    >
                                      {shop.managedName || shop.shopName || 'N/A'}
                                    </span>
                                  ))}
                                  {extraShops > 0 && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-xs text-brand-700 dark:text-brand-200">
                                      {t('permissions.groups.more_shops', { count: extraShops })}
                                    </span>
                                  )}
                                </div>
                              ) : null}
                              {displayedShops.length === 0 && totalShopCount > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {t('permissions.groups.shop_count_summary', { count: totalShopCount })}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3 align-top">
                          <button
                            onClick={() => openAddUserToGroupModal(group)}
                            className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 inline-flex items-center space-x-1"
                          >
                            <FaUserPlus className="h-3.5 w-3.5" />
                            <span>{t('permissions.groups.add_user')}</span>
                          </button>
                          <button
                            onClick={() => openAddShopToGroupModal(group)}
                            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 inline-flex items-center space-x-1"
                          >
                            <FaStore className="h-3.5 w-3.5" />
                            <span>{t('permissions.groups.add_shop')}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Filters with Search Loading */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder={t('permissions.search_placeholder')}
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
          <option value="all">{t('permissions.all_shops')}</option>
          {shops.map(shop => (
            <option key={shop.id} value={shop.id}>{shop.managedName || shop.shopName}</option>
          ))}
        </select>
        {(searchTerm || selectedShop !== 'all') && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            {t('permissions.results_found') + `: ${pagination.total}`}
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
              ? t('permissions.search_results')
              : t('permissions.user_access')
            }
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('permissions.table.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('permissions.table.shop')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('permissions.table.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('permissions.table.assigned_date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('permissions.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {groupedUserRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {(searchTerm || selectedShop !== 'all')
                      ? t('permissions.no_search_results')
                      : t('permissions.no_permissions')
                    }
                  </td>
                </tr>
              ) : (
                groupedUserRoles.map((groupedUser) => (
                  <tr key={groupedUser.user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                          {groupedUser.user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white vietnamese-text">
                            {groupedUser.user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 vietnamese-text">
                            {groupedUser.user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {groupedUser.roles.map((userRole) => (
                          <div 
                            key={userRole.id}
                            className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm text-gray-900 dark:text-white vietnamese-text border border-gray-200 dark:border-gray-600"
                          >
                            {userRole.shop.managedName || userRole.shop.shopName}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {groupedUser.shopCount} {groupedUser.shopCount === 1 ? 'shop' : 'shops'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(groupedUser.roles.map(r => r.role))).map((role) => (
                          <span key={role} className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[role]}`}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(groupedUser.roles[0].createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModalForUser(groupedUser)}
                          className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 inline-flex items-center space-x-1 px-2 py-1"
                          title="Sửa quyền truy cập"
                        >
                          <FaEdit className="h-3.5 w-3.5" />
                          <span className="text-sm">{t('permissions.edit')}</span>
                        </button>
                        <button
                          onClick={() => handleRemoveUserPermissions(groupedUser)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center space-x-1 px-2 py-1"
                          title="Xóa tất cả quyền truy cập"
                        >
                          <FaTrash className="h-3.5 w-3.5" />
                          <span className="text-sm">{t('permissions.delete')}</span>
                        </button>
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
              {t('permissions.previous')}
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
                    className={`px-3 py-2 border rounded-md text-sm ${pagination.page === pageNum
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
              {t('permissions.next')}
            </button>
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-300">
            {t('permissions.page')} {pagination.page} / {pagination.totalPages}
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && (
        <Modal isOpen={showAssignModal} onClose={closeModals} className="p-6 max-h-full overflow-y-auto w-[70vw] max-w-[70vw]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white vietnamese-text">
              {t('permissions.assign_modal.title')}
            </h2>
          </div>

          <form onSubmit={handleAssignRole} className="space-y-4">
            <div>
              <Label>{t('permissions.assign_modal.user')}</Label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white vietnamese-text"
                required
              >
                <option value="">{t('permissions.assign_modal.select_user')}</option>
                {assignableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>{t('permissions.assign_modal.shop')}</Label>
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={assignModalShopFilter}
                        onChange={(e) => {
                          setAssignModalShopFilter(e.target.value);
                          setAssignModalShopPage(1);
                        }}
                        placeholder={t('permissions.assign_modal.filter_placeholder')}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 vietnamese-text"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 vietnamese-text">
                      {t('permissions.assign_modal.shop_helper')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    <button
                      type="button"
                      onClick={handleToggleAllAssignableShops}
                      className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 font-medium"
                      disabled={paginatedAssignableShops.length === 0}
                    >
                      {areAllAssignableShopsSelected
                        ? t('permissions.assign_modal.clear_all')
                        : t('permissions.assign_modal.select_all')}
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 vietnamese-text">
                      {t('permissions.assign_modal.pagination_summary', {
                        page: assignModalShopPage,
                        totalPages: assignModalPageCount
                      })}
                    </span>
                  </div>
                </div>

                {paginatedAssignableShops.length === 0 ? (
                  <div className="py-2 text-sm text-gray-500 dark:text-gray-400 vietnamese-text">
                    {t('permissions.assign_modal.no_shops_available')}
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {paginatedAssignableShops.map((shop) => {
                        const displayName = shop.managedName ?? shop.shopName ?? shop.shopId ?? 'N/A';
                        const secondary = shop.shopId;
                        const groupName = shop.groupName;
                        const isSelected = formData.shopIds.includes(shop.id);

                        return (
                          <div key={shop.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                            <label className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-md">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                checked={isSelected}
                                onChange={() => handleToggleShopSelection(shop.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white vietnamese-text truncate">
                                  {displayName}
                                </div>
                                {(secondary || groupName) && (
                                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 vietnamese-text space-y-0.5">
                                    {secondary && <div className="truncate">{t('permissions.assign_modal.shop_code', { code: secondary })}</div>}
                                    {groupName && <div className="truncate">{t('permissions.assign_modal.shop_group', { group: groupName })}</div>}
                                  </div>
                                )}
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assignModalPageCount > 1 && paginatedAssignableShops.length > 0 && (
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <button
                      type="button"
                      onClick={() => setAssignModalShopPage((prev) => Math.max(1, prev - 1))}
                      disabled={assignModalShopPage === 1}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('permissions.assign_modal.prev_page')}
                    </button>
                    <div className="flex items-center gap-2">
                      <span>
                        {t('permissions.assign_modal.page_indicator', {
                          page: assignModalShopPage,
                          total: assignModalPageCount
                        })}
                      </span>
                      <div className="flex gap-1">
                        {Array.from({ length: assignModalPageCount }).slice(0, 5).map((_, index) => {
                          let pageNumber = index + 1;
                          if (assignModalPageCount > 5) {
                            const halfWindow = Math.floor(5 / 2);
                            const windowStart = Math.max(1, assignModalShopPage - halfWindow);
                            const windowEnd = Math.min(assignModalPageCount, windowStart + 4);
                            const adjustedStart = Math.max(1, windowEnd - 4);
                            pageNumber = adjustedStart + index;
                            if (pageNumber > assignModalPageCount) {
                              pageNumber = assignModalPageCount;
                            }
                          }

                          return (
                            <button
                              key={pageNumber}
                              type="button"
                              onClick={() => setAssignModalShopPage(pageNumber)}
                              className={`px-2.5 py-1 border rounded-md ${
                                assignModalShopPage === pageNumber
                                  ? 'bg-brand-500 text-white border-brand-500'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAssignModalShopPage((prev) => Math.min(assignModalPageCount, prev + 1))}
                      disabled={assignModalShopPage === assignModalPageCount}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('permissions.assign_modal.next_page')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>{t('permissions.assign_modal.role_permissions')}</Label>
              <div className="space-y-3">
                {Object.entries(roleDescriptions).map(([role, info]) => (
                  <div
                    key={role}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${formData.role === role
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
                        {t(`permissions.role.${role.toLowerCase()}.label`)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6 vietnamese-text">
                      {t(`permissions.role.${role.toLowerCase()}.desc`)}
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
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? t('permissions.assigning') : t('permissions.assign')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <Modal isOpen={showEditModal} onClose={closeModals} className="p-6 max-h-full overflow-y-auto w-[70vw] max-w-[70vw]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white vietnamese-text">
              {t('permissions.edit_modal.title')}
            </h2>
          </div>

          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded vietnamese-text">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Người dùng: <strong className="text-gray-900 dark:text-white">{selectedRole.user.name}</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vai trò hiện tại: <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[selectedRole.role]}`}>
                {roleDescriptions[selectedRole.role].label}
              </span>
            </p>
          </div>

          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div>
              <Label>{t('permissions.assign_modal.shop')}</Label>
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={assignModalShopFilter}
                        onChange={(e) => {
                          setAssignModalShopFilter(e.target.value);
                          setAssignModalShopPage(1);
                        }}
                        placeholder={t('permissions.assign_modal.filter_placeholder')}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 vietnamese-text"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 vietnamese-text">
                      {t('permissions.assign_modal.shop_helper')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    <button
                      type="button"
                      onClick={handleToggleAllAssignableShops}
                      className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 font-medium"
                      disabled={paginatedAssignableShops.length === 0}
                    >
                      {areAllAssignableShopsSelected
                        ? t('permissions.assign_modal.clear_all')
                        : t('permissions.assign_modal.select_all')}
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 vietnamese-text">
                      {t('permissions.assign_modal.pagination_summary', {
                        page: assignModalShopPage,
                        totalPages: assignModalPageCount
                      })}
                    </span>
                  </div>
                </div>

                {paginatedAssignableShops.length === 0 ? (
                  <div className="py-2 text-sm text-gray-500 dark:text-gray-400 vietnamese-text">
                    {t('permissions.assign_modal.no_shops_available')}
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {paginatedAssignableShops.map((shop) => {
                        const displayName = shop.managedName ?? shop.shopName ?? shop.shopId ?? 'N/A';
                        const secondary = shop.shopId;
                        const groupName = shop.groupName;
                        const isSelected = formData.shopIds.includes(shop.id);

                        return (
                          <div key={shop.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                            <label className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-md">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                checked={isSelected}
                                onChange={() => handleToggleShopSelection(shop.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white vietnamese-text truncate">
                                  {displayName}
                                </div>
                                {(secondary || groupName) && (
                                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 vietnamese-text space-y-0.5">
                                    {secondary && <div className="truncate">{t('permissions.assign_modal.shop_code', { code: secondary })}</div>}
                                    {groupName && <div className="truncate">{t('permissions.assign_modal.shop_group', { group: groupName })}</div>}
                                  </div>
                                )}
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assignModalPageCount > 1 && paginatedAssignableShops.length > 0 && (
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <button
                      type="button"
                      onClick={() => setAssignModalShopPage((prev) => Math.max(1, prev - 1))}
                      disabled={assignModalShopPage === 1}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('permissions.assign_modal.prev_page')}
                    </button>
                    <div className="flex items-center gap-2">
                      <span>
                        {t('permissions.assign_modal.page_indicator', {
                          page: assignModalShopPage,
                          total: assignModalPageCount
                        })}
                      </span>
                      <div className="flex gap-1">
                        {Array.from({ length: assignModalPageCount }).slice(0, 5).map((_, index) => {
                          let pageNumber = index + 1;
                          if (assignModalPageCount > 5) {
                            const halfWindow = Math.floor(5 / 2);
                            const windowStart = Math.max(1, assignModalShopPage - halfWindow);
                            const windowEnd = Math.min(assignModalPageCount, windowStart + 4);
                            const adjustedStart = Math.max(1, windowEnd - 4);
                            pageNumber = adjustedStart + index;
                            if (pageNumber > assignModalPageCount) {
                              pageNumber = assignModalPageCount;
                            }
                          }

                          return (
                            <button
                              key={pageNumber}
                              type="button"
                              onClick={() => setAssignModalShopPage(pageNumber)}
                              className={`px-2.5 py-1 border rounded-md ${
                                assignModalShopPage === pageNumber
                                  ? 'bg-brand-500 text-white border-brand-500'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAssignModalShopPage((prev) => Math.min(assignModalPageCount, prev + 1))}
                      disabled={assignModalShopPage === assignModalPageCount}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('permissions.assign_modal.next_page')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>{t('permissions.edit_modal.choose_new_role')}</Label>
              <div className="space-y-3">
                {Object.entries(roleDescriptions).map(([role, info]) => (
                  <div
                    key={role}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${formData.role === role
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
                        {t(`permissions.role.${role.toLowerCase()}.label`)}
                      </span>
                      {selectedRole.role === role && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Hiện tại)</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6 vietnamese-text">
                      {t(`permissions.role.${role.toLowerCase()}.desc`)}
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
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading || (formData.role === selectedRole.role && formData.shopIds.length === 1 && formData.shopIds[0] === selectedRole.shopId)}
                className="flex-1"
              >
                {loading ? t('permissions.updating') : t('permissions.update_role')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add User to Group Modal */}
      {showAddUserToGroupModal && selectedGroup && (
        <Modal isOpen={showAddUserToGroupModal} onClose={closeGroupModals} className="max-w-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white vietnamese-text">
                {t('permissions.groups.add_user_modal.title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 vietnamese-text">
                {t('permissions.groups.add_user_modal.description', { group: selectedGroup.name })}
              </p>
            </div>
          </div>

          <form onSubmit={handleAddUserToGroup} className="space-y-4">
            <div>
              <Label>{t('permissions.groups.add_user_modal.user_label')}</Label>
              {availableUsersForSelectedGroup.length === 0 ? (
                <div className="py-2 text-sm text-gray-500 dark:text-gray-400 vietnamese-text">
                  {t('permissions.groups.add_user_modal.no_users')}
                </div>
              ) : (
                <Select<UserOption, true>
                  unstyled
                  isMulti
                  options={userOptions}
                  value={selectedUserOptions}
                  onChange={handleUserSelectChange}
                  placeholder={t('permissions.groups.add_user_modal.user_placeholder')}
                  noOptionsMessage={() => t('permissions.groups.add_user_modal.no_options')}
                  isDisabled={groupActionLoading}
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                  className="w-full"
                  formatOptionLabel={formatUserOptionLabel}
                  menuPortalTarget={userSelectPortalTarget ?? undefined}
                  menuPosition={userSelectPortalTarget ? 'fixed' : 'absolute'}
                  menuPlacement="auto"
                  classNames={{
                    control: ({ isFocused, isDisabled }) =>
                      [
                        'border rounded-md transition-colors min-h-[44px]',
                        isDisabled
                          ? 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 cursor-not-allowed text-gray-400 dark:text-gray-500'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white',
                        isFocused
                          ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-500/40'
                          : 'hover:border-gray-400 dark:hover:border-gray-500'
                      ]
                        .filter(Boolean)
                        .join(' '),
                    valueContainer: () => 'flex flex-wrap gap-2 px-3 py-2 text-sm',
                    placeholder: () => 'text-sm text-gray-400 dark:text-gray-500',
                    input: () => 'text-sm text-gray-900 dark:text-white',
                    multiValue: () =>
                      'flex items-center gap-1 bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-200 rounded px-2 py-1 text-xs',
                    multiValueLabel: () => 'leading-none',
                    multiValueRemove: () =>
                      'cursor-pointer text-brand-500 hover:text-brand-700 dark:text-brand-200 dark:hover:text-brand-100',
                    indicatorsContainer: () => 'pr-2 gap-1 flex items-center text-gray-400 dark:text-gray-500',
                    dropdownIndicator: ({ isFocused }) =>
                      `p-1 ${isFocused ? 'text-brand-500' : 'text-gray-400 dark:text-gray-500'} hover:text-brand-500`,
                    clearIndicator: () => 'p-1 hover:text-brand-500',
                    indicatorSeparator: () => 'w-px h-4 bg-gray-200 dark:bg-gray-700',
                    menu: () =>
                      'mt-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-xl text-sm overflow-hidden',
                    menuList: () => 'max-h-60 overflow-y-auto py-1',
                    option: ({ isFocused, isSelected }) =>
                      [
                        'px-3 py-2 cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-brand-100 dark:bg-brand-500/30 text-brand-700 dark:text-brand-100'
                          : 'text-gray-700 dark:text-gray-200',
                        !isSelected && isFocused ? 'bg-brand-50 dark:bg-brand-500/20' : ''
                      ]
                        .filter(Boolean)
                        .join(' '),
                    noOptionsMessage: () => 'px-3 py-2 text-sm text-gray-500 dark:text-gray-400'
                  }}
                  styles={{
                    container: (base) => ({
                      ...base,
                      zIndex: 100000
                    }),
                    control: (base) => ({
                      ...base,
                      boxShadow: 'none'
                    }),
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 100000
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 100000
                    })
                  }}
                />
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white vietnamese-text">
                {t('permissions.groups.manage_members.title')}
              </h3>
              {selectedGroup.members.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 vietnamese-text">
                  {t('permissions.groups.manage_members.no_members')}
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {selectedGroup.members.map((member) => {
                    const fallbackUser = member.user?.id ? usersById.get(member.user.id) : undefined;
                    const displayName = member.user?.name ?? fallbackUser?.name ?? fallbackUser?.username ?? t('permissions.groups.unknown_user');
                    const secondary = member.user?.username ?? fallbackUser?.username ?? '';
                    const canRemove = Boolean(member.user?.id) && !member.isDefault;

                    return (
                      <li
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white vietnamese-text">{displayName}</p>
                          {secondary && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{secondary}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {member.isDefault && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                              {t('permissions.groups.manage_members.default_badge')}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveUserFromGroup(member)}
                            disabled={!canRemove || groupActionLoading}
                            title={!canRemove ? t('permissions.groups.manage_members.cannot_remove_default') : undefined}
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              canRemove && !groupActionLoading
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                            }`}
                          >
                            <FaTrash className="h-3.5 w-3.5" />
                            <span>{t('permissions.groups.manage_members.remove')}</span>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {groupModalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                {groupModalError}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeGroupModals}
                className="flex-1"
                disabled={groupActionLoading}
              >
                {t('common.cancel')}
              </Button>
              <LoadingButton
                type="submit"
                loading={groupActionLoading}
                loadingText={t('permissions.groups.add_user_modal.loading')}
                className="flex-1 bg-brand-500 hover:bg-brand-600 focus:ring-brand-500"
                disabled={
                  availableUsersForSelectedGroup.length === 0 || groupUserForm.userIds.length === 0
                }
              >
                {t('permissions.groups.add_user_modal.submit')}
              </LoadingButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Shop to Group Modal */}
      {showAddShopToGroupModal && selectedGroup && (
        <Modal isOpen={showAddShopToGroupModal} onClose={closeGroupModals} className="max-w-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white vietnamese-text">
                {t('permissions.groups.add_shop_modal.title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 vietnamese-text">
                {t('permissions.groups.add_shop_modal.description', { group: selectedGroup.name })}
              </p>
            </div>
          </div>

          <form onSubmit={handleAddShopToGroup} className="space-y-4">
            <div>
              <Label htmlFor={shopSelectInputId}>{t('permissions.groups.add_shop_modal.shop_label')}</Label>
              {availableShopsForSelectedGroup.length === 0 ? (
                <div className="py-2 text-sm text-gray-500 dark:text-gray-400 vietnamese-text">
                  {t('permissions.groups.add_shop_modal.no_shops')}
                </div>
              ) : (
                <Select<ShopOption, true>
                  inputId={shopSelectInputId}
                  instanceId={shopSelectInputId}
                  aria-label={t('permissions.groups.add_shop_modal.shop_label')}
                  unstyled
                  isMulti
                  options={shopOptions}
                  value={selectedShopOptions}
                  onChange={handleShopSelectChange}
                  placeholder={t('permissions.groups.add_shop_modal.placeholder')}
                  noOptionsMessage={() => t('permissions.groups.add_shop_modal.no_options')}
                  isDisabled={groupActionLoading}
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                  className="w-full"
                  menuPortalTarget={shopSelectPortalTarget ?? undefined}
                  menuPosition={shopSelectPortalTarget ? 'fixed' : 'absolute'}
                  menuPlacement="auto"
                  formatOptionLabel={formatShopOptionLabel}
                  classNames={{
                    control: ({ isFocused, isDisabled }) =>
                      [
                        'border rounded-md transition-colors min-h-[44px]',
                        isDisabled
                          ? 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 cursor-not-allowed text-gray-400 dark:text-gray-500'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white',
                        isFocused
                          ? 'border-amber-500 ring-2 ring-amber-200 dark:ring-amber-500/40'
                          : 'hover:border-gray-400 dark:hover:border-gray-500'
                      ]
                        .filter(Boolean)
                        .join(' '),
                    valueContainer: () => 'flex flex-wrap gap-2 px-3 py-2 text-sm',
                    placeholder: () => 'text-sm text-gray-400 dark:text-gray-500',
                    input: () => 'text-sm text-gray-900 dark:text-white',
                    multiValue: () =>
                      'flex items-center gap-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-200 rounded px-2 py-1 text-xs',
                    multiValueLabel: () => 'leading-none',
                    multiValueRemove: () =>
                      'cursor-pointer text-amber-500 hover:text-amber-700 dark:text-amber-200 dark:hover:text-amber-100',
                    indicatorsContainer: () => 'pr-2 gap-1 flex items-center text-gray-400 dark:text-gray-500',
                    dropdownIndicator: ({ isFocused }) =>
                      `p-1 ${isFocused ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'} hover:text-amber-500`,
                    clearIndicator: () => 'p-1 hover:text-amber-500',
                    indicatorSeparator: () => 'w-px h-4 bg-gray-200 dark:bg-gray-700',
                    menu: () =>
                      'mt-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-xl text-sm overflow-hidden',
                    menuList: () => 'max-h-60 overflow-y-auto py-1',
                    option: ({ isFocused, isSelected }) =>
                      [
                        'px-3 py-2 cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-100'
                          : 'text-gray-700 dark:text-gray-200',
                        !isSelected && isFocused ? 'bg-amber-50 dark:bg-amber-500/20' : ''
                      ]
                        .filter(Boolean)
                        .join(' '),
                    noOptionsMessage: () => 'px-3 py-2 text-sm text-gray-500 dark:text-gray-400'
                  }}
                  styles={{
                    container: (base) => ({
                      ...base,
                      zIndex: 99999
                    }),
                    control: (base) => ({
                      ...base,
                      boxShadow: 'none'
                    }),
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 99999
                    })
                  }}
                />
              )}
              {availableShopsForSelectedGroup.length > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 vietnamese-text">
                  {t('permissions.groups.add_shop_modal.helper')}
                </p>
              )}
            </div>

            {groupModalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                {groupModalError}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeGroupModals}
                className="flex-1"
                disabled={groupActionLoading}
              >
                {t('common.cancel')}
              </Button>
              <LoadingButton
                type="submit"
                loading={groupActionLoading}
                loadingText={t('permissions.groups.add_shop_modal.loading')}
                className="flex-1 bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
                disabled={availableShopsForSelectedGroup.length === 0 || groupShopForm.shopIds.length === 0}
              >
                {t('permissions.groups.add_shop_modal.submit')}
              </LoadingButton>
            </div>
          </form>
        </Modal>
      )}

      {canCreateGroups && (
        <CreateShopGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          users={users}
          onSuccess={async (message) => {
            setSuccess(message);
            setError('');
            await fetchGroups();
          }}
          onError={(message) => {
            setError(message);
          }}
        />
      )}

      <AssignUserShopGroupModal
        isOpen={showAssignShopGroupModal}
        onClose={() => setShowAssignShopGroupModal(false)}
        users={users}
        shops={shops}
        onSuccess={async (message) => {
          setSuccess(message);
          setError('');
          await fetchUserRoles();
          await fetchGroups();
        }}
        onError={(message) => {
          setError(message);
        }}
      />
    </div>
  );
}
