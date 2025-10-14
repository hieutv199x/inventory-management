"use client";

import { useAuth } from "@/context/authContext";

type UserRole = "ADMIN" | "MANAGER" | "ACCOUNTANT" | "SELLER" | "RESOURCE" | "SHOP_CONNECTOR" | "SUPER_ADMIN";

interface PermissionConfig {
  users: {
    view: UserRole[];
    create: UserRole[];
    edit: UserRole[];
    delete: UserRole[];
    changeRole: UserRole[];
  };
  products: {
    view: UserRole[];
    create: UserRole[];
    edit: UserRole[];
    delete: UserRole[];
  };
  orders: {
    view: UserRole[];
    create: UserRole[];
    edit: UserRole[];
    delete: UserRole[];
  };
  financial: {
    view: UserRole[];
    edit: UserRole[];
  };
  reports: {
    view: UserRole[];
    generate: UserRole[];
  };
}

const permissions: PermissionConfig = {
  users: {
    view: ["ADMIN", "MANAGER"],
    create: ["ADMIN", "MANAGER"],
    edit: ["ADMIN", "MANAGER"],
    delete: ["ADMIN"],
    changeRole: ["ADMIN"],
  },
  products: {
    view: ["ADMIN", "MANAGER", "ACCOUNTANT", "SELLER"],
    create: ["ADMIN", "MANAGER", "SELLER"],
    edit: ["ADMIN", "MANAGER", "SELLER"],
    delete: ["ADMIN", "MANAGER"],
  },
  orders: {
    view: ["ADMIN", "MANAGER", "ACCOUNTANT", "SELLER"],
    create: ["ADMIN", "MANAGER", "SELLER"],
    edit: ["ADMIN", "MANAGER", "SELLER"],
    delete: ["ADMIN", "MANAGER"],
  },
  financial: {
    view: ["ADMIN", "MANAGER", "ACCOUNTANT"],
    edit: ["ADMIN", "ACCOUNTANT"],
  },
  reports: {
    view: ["ADMIN", "MANAGER", "ACCOUNTANT"],
    generate: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
};

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (resource: keyof PermissionConfig, action: string): boolean => {
    if (!user) return false;
    
    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) return false;
    
    const actionPermissions = resourcePermissions[action as keyof typeof resourcePermissions];
    if (!actionPermissions) return false;
    
    return actionPermissions.includes(user.role);
  };

  const canViewUsers = () => hasPermission("users", "view");
  const canCreateUsers = () => hasPermission("users", "create");
  const canEditUsers = () => hasPermission("users", "edit");
  const canDeleteUsers = () => hasPermission("users", "delete");
  const canChangeUserRoles = () => hasPermission("users", "changeRole");

  const canViewProducts = () => hasPermission("products", "view");
  const canCreateProducts = () => hasPermission("products", "create");
  const canEditProducts = () => hasPermission("products", "edit");
  const canDeleteProducts = () => hasPermission("products", "delete");

  const canViewOrders = () => hasPermission("orders", "view");
  const canCreateOrders = () => hasPermission("orders", "create");
  const canEditOrders = () => hasPermission("orders", "edit");
  const canDeleteOrders = () => hasPermission("orders", "delete");

  const canViewFinancial = () => hasPermission("financial", "view");
  const canEditFinancial = () => hasPermission("financial", "edit");

  const canViewReports = () => hasPermission("reports", "view");
  const canGenerateReports = () => hasPermission("reports", "generate");

  const isAdmin = () => user?.role === "ADMIN";
  const isManager = () => user?.role === "MANAGER";
  const isAccountant = () => user?.role === "ACCOUNTANT";
  const isSeller = () => user?.role === "SELLER";
  const isResource = () => user?.role === "RESOURCE";

  return {
    user,
    hasPermission,
    // User permissions
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canChangeUserRoles,
    // Product permissions
    canViewProducts,
    canCreateProducts,
    canEditProducts,
    canDeleteProducts,
    // Order permissions
    canViewOrders,
    canCreateOrders,
    canEditOrders,
    canDeleteOrders,
    // Financial permissions
    canViewFinancial,
    canEditFinancial,
    // Report permissions
    canViewReports,
    canGenerateReports,
    // Role checks
    isAdmin,
    isManager,
    isAccountant,
    isSeller,
    isResource,
  };
};

export default usePermissions;
