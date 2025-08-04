"use client";

import React from "react";
import { useAuth } from "@/context/authContext";

interface RoleGuardProps {
  allowedRoles: ("ADMIN" | "MANAGER" | "ACCOUNTANT" | "SELLER" | "RESOURCE")[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  fallback = null 
}) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Please log in to access this content.</div>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback || (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          You don't have permission to access this content.
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
