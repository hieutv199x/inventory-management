"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import { 
  DashboardIcon, 
  BankIcon, 
  ShopIcon, 
  UserIcon, 
  SettingsIcon,
  LogoutIcon,
  GroupIcon
} from '@/icons';

type AppRole = 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'SELLER' | 'RESOURCE' | 'OWNER' | 'SUPER_ADMIN';
interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AppRole[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: DashboardIcon,
  },
  {
    name: 'Quản lý Bank',
    href: '/bank',
    icon: BankIcon,
    roles: ['ADMIN', 'ACCOUNTANT']
  },
  {
    name: 'Quản lý Shop',
    href: '/shops',
    icon: ShopIcon,
  },
  {
    name: 'Phân quyền',
    href: '/permissions',
    icon: GroupIcon ,
    roles: ['ADMIN', 'OWNER', 'MANAGER']
  },
  {
    name: 'Người dùng',
    href: '/users',
    icon: UserIcon,
    roles: ['ADMIN']
  },
  {
    name: 'Organizations',
    href: '/organizations',
    icon: GroupIcon,
    roles: ['ADMIN', 'OWNER', 'SUPER_ADMIN']
  },
  {
    name: 'Cài đặt',
    href: '/settings',
    icon: SettingsIcon,
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const hasAccess = (roles?: AppRole[]) => {
    if (!roles) return true;
    return user && roles.includes(user.role);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          9Connect
        </h1>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.role || 'Role'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          if (!hasAccess(item.roles)) return null;
          
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-500' : ''}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white rounded-lg transition-colors"
        >
          <LogoutIcon className="mr-3 h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
