"use client";

import React from "react";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppSidebar from "@/layout/AppSidebar";
import AppHeader from "@/layout/AppHeader";
import Loading from "@/components/Loading";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();
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

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Full Height */}
      <div className="flex-shrink-0 h-full">
        <AppSidebar />
      </div>

      {/* Main Content Area - Full Height */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header - Positioned next to sidebar */}
        <div className="flex-shrink-0">
          <AppHeader />
        </div>

        {/* Page Content - Takes remaining height */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 mx-auto max-w-7xl md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}