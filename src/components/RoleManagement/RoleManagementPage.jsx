import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UserRoleList from './UserRoleList';
import AssignRoleModal from './AssignRoleModal';
import EditRoleModal from './EditRoleModal';
import { userShopRoleApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const RoleManagementPage = () => {
  const { shopId } = useParams();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadUsers();
    loadUserRole();
  }, [shopId]);

  const loadUsers = async () => {
    try {
      const response = await userShopRoleApi.getShopUsers(shopId);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRole = async () => {
    try {
      const response = await userShopRoleApi.getUserRole(user.id, shopId);
      setUserRole(response.data.data);
    } catch (error) {
      console.error('Failed to load user role:', error);
    }
  };

  const handleAssignRole = async (userData) => {
    try {
      await userShopRoleApi.assignRole({
        ...userData,
        shopId
      });
      setShowAssignModal(false);
      loadUsers();
    } catch (error) {
      console.error('Failed to assign role:', error);
      throw error;
    }
  };

  const handleUpdateRole = async (roleData) => {
    try {
      await userShopRoleApi.updateRole(selectedUser.id, roleData);
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      throw error;
    }
  };

  const handleRemoveUser = async (userShopRoleId) => {
    if (!window.confirm('Are you sure you want to remove this user?')) return;
    
    try {
      await userShopRoleApi.removeRole(userShopRoleId);
      loadUsers();
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };

  const handleEditUser = (userShopRole) => {
    setSelectedUser(userShopRole);
    setShowEditModal(true);
  };

  const canManageUsers = userRole && ['OWNER', 'MANAGER'].includes(userRole);
  const canRemoveUsers = userRole === 'OWNER';

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        {canManageUsers && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add User
          </button>
        )}
      </div>

      <UserRoleList
        users={users}
        onEdit={canManageUsers ? handleEditUser : null}
        onRemove={canRemoveUsers ? handleRemoveUser : null}
      />

      {showAssignModal && (
        <AssignRoleModal
          onClose={() => setShowAssignModal(false)}
          onSubmit={handleAssignRole}
        />
      )}

      {showEditModal && selectedUser && (
        <EditRoleModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleUpdateRole}
        />
      )}
    </div>
  );
};

export default RoleManagementPage;
