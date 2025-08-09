import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { usePermissions } from '../../hooks/usePermissions';

const Navigation = ({ shopId }) => {
  const location = useLocation();
  const { canManageUsers } = usePermissions(shopId);

  const navigationItems = [
    // ...existing items...
    {
      name: 'Users',
      href: `/shops/${shopId}/users`,
      icon: UserGroupIcon,
      current: location.pathname === `/shops/${shopId}/users`,
      visible: canManageUsers
    },
    // ...existing items...
  ];

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
          </div>
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">
                {navigationItems.map((item) =>
                  item.visible ? (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium ${
                        item.current ? 'bg-gray-100' : ''
                      }`}
                    >
                      <item.icon className="h-5 w-5 inline-block mr-1" />
                      {item.name}
                    </Link>
                  ) : null
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;