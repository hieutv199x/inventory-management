"use client";

import React from "react";
import { useAuth } from "@/context/authContext";
import usePermissions from "@/hooks/usePermissions";
import Link from "next/link";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    canViewUsers,
    canViewProducts,
    canViewOrders,
    canViewFinancial,
    canViewReports,
    isAdmin,
    isManager,
    isAccountant,
    isSeller,
    isResource,
  } = usePermissions();

  const getRoleBasedWelcomeMessage = () => {
    if (isAdmin()) return "Welcome Admin! You have full system access.";
    if (isManager()) return "Welcome Manager! You can manage users and oversee operations.";
    if (isAccountant()) return "Welcome Accountant! You have access to financial data and reports.";
    if (isSeller()) return "Welcome Seller! You can manage products and orders.";
    if (isResource()) return "Welcome! You have limited system access.";
    return "Welcome to the system!";
  };

  const getAvailableActions = () => {
    const actions = [];

    if (canViewUsers()) {
      actions.push({
        title: "User Management",
        description: "Manage system users and their roles",
        link: "/users",
        icon: "👥",
        color: "bg-blue-500",
      });
    }

    if (canViewProducts()) {
      actions.push({
        title: "Product Management",
        description: "Manage products and inventory",
        link: "/products",
        icon: "📦",
        color: "bg-green-500",
      });
    }

    if (canViewOrders()) {
      actions.push({
        title: "Order Management",
        description: "View and manage orders",
        link: "/orders",
        icon: "📋",
        color: "bg-purple-500",
      });
    }

    if (canViewFinancial()) {
      actions.push({
        title: "Financial Data",
        description: "Access financial reports and data",
        link: "/financial",
        icon: "💰",
        color: "bg-yellow-500",
      });
    }

    if (canViewReports()) {
      actions.push({
        title: "Reports",
        description: "Generate and view system reports",
        link: "/reports",
        icon: "📊",
        color: "bg-red-500",
      });
    }

    actions.push({
      title: "Profile Settings",
      description: "Update your profile and password",
      link: "/profile",
      icon: "⚙️",
      color: "bg-gray-500",
    });

    return actions;
  };

  const actions = getAvailableActions();

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {getRoleBasedWelcomeMessage()}
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Your Account
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <p className="text-gray-900 dark:text-white">{user?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <p className="text-gray-900 dark:text-white">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              user?.role === "ADMIN" ? "bg-red-100 text-red-800" :
              user?.role === "MANAGER" ? "bg-purple-100 text-purple-800" :
              user?.role === "ACCOUNTANT" ? "bg-blue-100 text-blue-800" :
              user?.role === "SELLER" ? "bg-green-100 text-green-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Available Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Available Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action, index) => (
            <Link
              key={index}
              href={action.link}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
            >
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center text-white text-xl`}>
                  {action.icon}
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {action.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Stats (for demonstration) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            System Status
          </h3>
          <p className="text-3xl font-bold text-green-600">Online</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Your Role Level
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {isAdmin() ? "5" : isManager() ? "4" : isAccountant() ? "3" : isSeller() ? "2" : "1"}
          </p>
          <p className="text-sm text-gray-500">Access Level</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Account Status
          </h3>
          <p className={`text-3xl font-bold ${user?.isActive ? "text-green-600" : "text-red-600"}`}>
            {user?.isActive ? "Active" : "Inactive"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Available Features
          </h3>
          <p className="text-3xl font-bold text-purple-600">{actions.length}</p>
          <p className="text-sm text-gray-500">Accessible Features</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
