"use client";

import React from "react";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppSidebar from "@/layout/AppSidebar";
import AppHeader from "@/layout/AppHeader";
import Loading from "@/components/Loading";
import { useSidebar } from "@/context/SidebarContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();
  const { isExpanded, isHovered } = useSidebar();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/signin");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  // Calculate main content margin based on sidebar state
  const getMainContentMargin = () => {
    if (isExpanded || isHovered) {
      return 'ml-[290px]'; // Expanded sidebar width
    }
    return 'ml-[90px]'; // Collapsed sidebar width
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Fixed Position Full Height */}
      <AppSidebar />

      {/* Main Content Area - Responsive to sidebar */}
      <div className={`transition-all duration-300 ease-in-out ${getMainContentMargin()} flex flex-col h-full`}>
        {/* Header */}
        <div className="flex-shrink-0">
          <AppHeader />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 mx-auto max-w-7xl md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}