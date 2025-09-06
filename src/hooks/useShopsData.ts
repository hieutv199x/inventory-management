"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { httpClient } from '@/lib/http-client';
import { useLoading } from '@/context/loadingContext';

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

interface UseShopsDataProps {
  userId?: string;
  canViewAllShops: boolean;
}

export const useShopsData = ({ userId, canViewAllShops }: UseShopsDataProps) => {
  const { showLoading, hideLoading } = useLoading();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const fetchShops = useCallback(async (page = 1, search = '', limit = 12) => {
    try {
      if (search) {
        showLoading('Searching shops...');
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: 'ACTIVE',
        ...(search && { search }),
        ...(userId && !canViewAllShops && { userId })
      });
      
      const data = await httpClient.get(`/shops?${params}`);
      
      setShops(data.shops || []);
      setPagination({
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || limit,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      });
      setError('');
    } catch (err) {
      console.error('Error fetching shops:', err);
      setError('Không thể tải danh sách shop');
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [canViewAllShops, userId, showLoading, hideLoading]);

  const updateManagedName = useCallback(async (shopId: string, managedName: string) => {
    try {
      showLoading('Updating shop name...');
      
      await httpClient.post('/tiktok/update-shop-name', {
        shopId: shopId,
        managedName: managedName.trim()
      });
      
      // Update local state immediately for better UX
      setShops(prevShops => 
        prevShops.map(shop => 
          shop.shopId === shopId 
            ? { ...shop, managedName: managedName.trim() }
            : shop
        )
      );
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Có lỗi xảy ra khi cập nhật tên quản lý' };
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  const deleteShop = useCallback(async (shopId: string) => {
    try {
      await httpClient.delete(`/shops/${shopId}`);
      
      // Update local state
      setShops(prevShops => prevShops.filter(shop => shop.id !== shopId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Có lỗi xảy ra khi xóa shop' };
    }
  }, []);

  const memoizedShops = useMemo(() => shops, [shops]);

  return {
    shops: memoizedShops,
    loading,
    error,
    pagination,
    fetchShops,
    updateManagedName,
    deleteShop,
    setError
  };
};
