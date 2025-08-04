'use client';

import React from 'react';
import UserManagement from '@/components/user-management/UserManagement';

const UserManagementPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UserManagement />
    </div>
  );
};

export default UserManagementPage;
