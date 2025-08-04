"use client";

import React from "react";
import { useAuth } from "@/context/authContext";

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Welcome to Inventory Management System
      </h1>
      
      {user && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <p className="text-gray-900 dark:text-white">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.role === "ADMIN" ? "bg-red-100 text-red-800" :
                user.role === "MANAGER" ? "bg-purple-100 text-purple-800" :
                user.role === "ACCOUNTANT" ? "bg-blue-100 text-blue-800" :
                user.role === "SELLER" ? "bg-green-100 text-green-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;