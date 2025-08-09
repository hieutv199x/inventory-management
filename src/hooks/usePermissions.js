import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userShopRoleApi } from '../services/api';

export const usePermissions = (shopId) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = async () => {
      if (!user || !shopId) {
        setLoading(false);
        return;
      }

      try {
        const response = await userShopRoleApi.getUserRole(user.id, shopId);
        setUserRole(response.data.data);
      } catch (error) {
        console.error('Failed to load user role:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [user, shopId]);

  const hasRole = (roles) => {
    if (!userRole) return false;
    return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
  };

  const canManageUsers = hasRole(['OWNER', 'MANAGER']);
  const canManageInventory = hasRole(['OWNER', 'MANAGER', 'STAFF']);
  const canViewOnly = hasRole(['VIEWER']);
  const isOwner = hasRole('OWNER');

  return {
    userRole,
    loading,
    hasRole,
    canManageUsers,
    canManageInventory,
    canViewOnly,
    isOwner
  };
};
