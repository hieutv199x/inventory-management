'use client';

import React from 'react';
import UserProfile from '@/components/user-profile/UserProfile';

const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UserProfile />
    </div>
  );
};

export default ProfilePage;
