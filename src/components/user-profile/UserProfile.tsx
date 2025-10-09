"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { httpClient } from "@/lib/http-client";

interface UpdateUserForm {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const UserProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<UpdateUserForm>({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  console.log("UserProfile render - formData:", formData);

  // Fetch detailed user data from API only once
  useEffect(() => {
    const fetchUserDetail = async () => {
      if (user?.id) {
        try {
          const userData = await httpClient.get(`/users/${user.id}`);
          console.log("Initial fetch user detail:", userData);
          if (userData.user) {
            setFormData({
              name: userData.user.name || "",
              email: userData.user.email || "",
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
            setIsFormInitialized(true);
          }
        } catch (error) {
          console.error("Failed to fetch user detail:", error);
        }
      }
    };

    if (!isFormInitialized) {
      fetchUserDetail();
    }
  }, [user?.id, isFormInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // Validate password fields if changing password
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          setError("Current password is required to change password");
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setError("New passwords do not match");
          return;
        }
        if (formData.newPassword.length < 6) {
          setError("New password must be at least 6 characters");
          return;
        }
      }

      const updateData: any = {
        name: formData.name,
        email: formData.email,
      };

      // Only include password if changing
      if (formData.newPassword && formData.currentPassword) {
        updateData.password = formData.newPassword;
        updateData.currentPassword = formData.currentPassword;
      }

      const response = await httpClient.put(`/users/${user?.id}`, updateData);
      console.log("Update response:", response);
      
      // Update form data with the response from server
      if (response.user) {
        console.log("Updating form data with:", { name: response.user.name, email: response.user.email });
        setFormData({
          name: response.user.name || "",
          email: response.user.email || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        
        // Refresh user in auth context in background (don't await to avoid conflicts)
        refreshUser().catch(error => {
          console.warn("Could not refresh user data:", error);
        });
      } else {
        // If no user in response, just clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }
      
      setMessage("Profile updated successfully!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear messages when user starts typing
    if (message || error) {
      setMessage("");
      setError("");
    }
    
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          User Profile
        </h1>

        {/* User Info Display */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <div className="mt-1 text-sm text-gray-900 dark:text-white">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <div className="mt-1 text-sm text-gray-900 dark:text-white">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit}>
          {message && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Password Change */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Change Password
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Leave blank to keep current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showCurrentPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414l.001.001m4.242 4.242l1.414 1.414m-1.414-1.414l.001.001M12 3c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21l-1.5-1.5m-13.949-3.049a9.978 9.978 0 01-4.132-5.411 10.05 10.05 0 014.132-5.411" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Leave blank to keep current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showNewPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414l.001.001m4.242 4.242l1.414 1.414m-1.414-1.414l.001.001M12 3c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21l-1.5-1.5m-13.949-3.049a9.978 9.978 0 01-4.132-5.411 10.05 10.05 0 014.132-5.411" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414l.001.001m4.242 4.242l1.414 1.414m-1.414-1.414l.001.001M12 3c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21l-1.5-1.5m-13.949-3.049a9.978 9.978 0 01-4.132-5.411 10.05 10.05 0 014.132-5.411" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition duration-200"
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
