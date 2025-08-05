"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import axiosInstance from "@/utils/axiosInstance";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import {ChevronDownIcon} from "@/icons";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import {Modal} from "@/components/ui/modal";
import {useModal} from "@/hooks/useModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "ACCOUNTANT" | "SELLER" | "RESOURCE";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

interface NewUser {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "ACCOUNTANT" | "SELLER" | "RESOURCE";
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    name: "",
    email: "",
    password: "",
    role: "SELLER",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const { isOpen, openModal, closeModal } = useModal();
  const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();

  const roles = [
    { value: "ADMIN", label: "Admin", description: "Full system access" },
    { value: "MANAGER", label: "Manager", description: "Manage users and resources" },
    { value: "ACCOUNTANT", label: "Accountant", description: "Financial data access" },
    { value: "SELLER", label: "Seller", description: "Product and order management" },
    { value: "RESOURCE", label: "Resource", description: "Limited system access" },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/users");
      setUsers(response.data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/users", newUser);
      setNewUser({ name: "", email: "", password: "", role: "SELLER" });
      fetchUsers();
      closeModal();
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await axiosInstance.put(`/users/${userId}`, updates);
      fetchUsers();
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const editUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const updates = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        isActive: editingUser.isActive,
      };
      await updateUser(editingUser.id, updates);
      closeEditModal();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser({ ...user });
    openEditModal();
  };

  const deleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axiosInstance.delete(`/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const toggleUserStatus = async (user: User) => {
    await updateUser(user.id, { isActive: !user.isActive });
  };

  const canManageUsers = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  const canDeleteUsers = currentUser?.role === "ADMIN";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          You don't have permission to manage users.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <button
              onClick={openModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Create User
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 "
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Show:
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300  px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[584px] p-5 lg:p-10"
      >
        <form onSubmit={createUser} className="mt-6">
          <div className="space-y-4">
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                Full Name <span className="text-meta-1">*</span>
              </label>
              <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter user's full name"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  required
              />
            </div>

            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                Email Address <span className="text-meta-1">*</span>
              </label>
              <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter user's email address"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  required
              />
            </div>

            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                Password <span className="text-meta-1">*</span>
              </label>
              <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter a secure password"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  required
              />
            </div>

            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                Role <span className="text-meta-1">*</span>
              </label>
              <div className="relative z-20 bg-transparent dark:bg-form-input">
                <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300  px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                >
                  {roles.map((role) => (
                      <option key={role.value} value={role.value} className="text-body dark:text-bodydark">
                        {role.label} - {role.description}
                      </option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
                      <svg
                          className="fill-current"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                      >
                        <g opacity="0.8">
                          <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                              fill=""
                          ></path>
                        </g>
                      </svg>
                    </span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end w-full gap-3 mt-6">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Close
            </Button>
            <button
                type="submit"
                className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-3 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>



      {/* Edit User Modal */}
      <Modal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          className="max-w-[584px] p-5 lg:p-10"
      >
        {editingUser && (
            <form onSubmit={editUser} className="mt-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                    Full Name <span className="text-meta-1">*</span>
                  </label>
                  <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      placeholder="Enter user's full name"
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      required
                  />
                </div>

                <div>
                  <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                    Email Address <span className="text-meta-1">*</span>
                  </label>
                  <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      placeholder="Enter user's email address"
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      required
                  />
                </div>

                <div>
                  <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                    Role <span className="text-meta-1">*</span>
                  </label>
                  <div className="relative z-20 bg-transparent dark:bg-form-input">
                    <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                        className="h-11 w-full appearance-none rounded-lg border border-gray-300  px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    >
                      {roles.map((role) => (
                          <option key={role.value} value={role.value} className="text-body dark:text-bodydark">
                            {role.label} - {role.description}
                          </option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
                    <svg
                        className="fill-current"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                      <g opacity="0.8">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                            fill=""
                        ></path>
                      </g>
                    </svg>
                  </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                    Status
                  </label>
                  <div className="flex items-center space-x-6">
                    <label className="flex cursor-pointer items-center">
                      <input
                          type="radio"
                          name="status"
                          checked={editingUser.isActive}
                          onChange={() => setEditingUser({ ...editingUser, isActive: true })}
                          className="mr-2"
                      />
                      <span className="text-sm font-medium text-black dark:text-white">Active</span>
                    </label>
                    <label className="flex cursor-pointer items-center">
                      <input
                          type="radio"
                          name="status"
                          checked={!editingUser.isActive}
                          onChange={() => setEditingUser({ ...editingUser, isActive: false })}
                          className="mr-2"
                      />
                      <span className="text-sm font-medium text-black dark:text-white">Inactive</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end w-full gap-3 mt-6">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      closeEditModal();
                      setEditingUser(null);
                    }}
                >
                  Cancel
                </Button>
                <button
                    type="submit"
                    className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-3 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300"
                >
                  Update User
                </button>
              </div>
            </form>
        )}
      </Modal>

      {/* Users Table */}
      <div className="rounded-sm border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-4 py-6 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Users ({filteredUsers.length})
          </h4>
        </div>

        <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
          <div className="col-span-2 flex items-center">
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">User</p>
          </div>
          <div className="col-span-1 hidden items-center sm:flex">
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">Role</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">Status</p>
          </div>
          <div className="col-span-1 hidden items-center sm:flex">
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">Created By</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">Created</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">Actions</p>
          </div>
        </div>

        {currentUsers.map((user) => (
          <div
            className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
            key={user.id}
          >
            <div className="col-span-2 flex items-center">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm text-black dark:text-white font-medium">
                    {user.name}
                  </p>
                  <p className="text-xs text-meta-3 font-medium text-gray-800 text-theme-sm dark:text-white/90">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="col-span-1 hidden items-center sm:flex">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.role === "ADMIN" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                user.role === "MANAGER" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                user.role === "ACCOUNTANT" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                user.role === "SELLER" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
              }`}>
                {user.role}
              </span>
            </div>
            <div className="col-span-1 flex items-center">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.isActive 
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="col-span-1 hidden items-center sm:flex">
              <p className="text-sm text-black dark:text-white">
                {user.creator ? user.creator.name : "System"}
              </p>
            </div>
            <div className="col-span-1 flex items-center">
              <p className="text-sm text-black dark:text-white">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <button
                onClick={() => handleEditClick(user)}
                className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 px-3 py-1 rounded text-xs font-medium transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => toggleUserStatus(user)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  user.isActive
                    ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                    : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                }`}
              >
                {user.isActive ? "Deactivate" : "Activate"}
              </button>
              {canDeleteUsers && user.id !== currentUser?.id && (
                <button
                  onClick={() => deleteUser(user.id)}
                  className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}

        {currentUsers.length === 0 && (
          <div className="border-t border-stroke px-4 py-8 text-center dark:border-strokedark">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? "No users found matching your search." : "No users found."}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} entries
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    currentPage === pageNumber
                      ? "text-blue-600 bg-blue-50 border border-blue-300 dark:bg-blue-900 dark:text-blue-200"
                      : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
