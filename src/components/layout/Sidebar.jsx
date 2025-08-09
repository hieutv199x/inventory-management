import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { UserGroupIcon } from '@heroicons/react/solid';
import { usePermissions } from '../../hooks/usePermissions';

const Sidebar = () => {
  const { shopId } = useParams();
  const { canManageUsers } = usePermissions(shopId);

  const menuItems = [
    // ...existing menu items...
    {
      name: 'User Management',
      href: `/shops/${shopId}/users`,
      icon: UserGroupIcon,
      visible: canManageUsers
    },
    // ...existing menu items...
  ];

  return (
    <div className="flex flex-col h-full">
      {/* ...existing code... */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.filter(item => item.visible !== false).map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
      {/* ...existing code... */}
    </div>
  );
};

export default Sidebar;