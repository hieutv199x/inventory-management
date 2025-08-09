import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoleManagementPage from './components/RoleManagement/RoleManagementPage';

const roles = [
  { value: 'OWNER', label: 'Owner', description: 'Full access to all features' },
  { value: 'MANAGER', label: 'Manager', description: 'Can manage users and inventory' },
  { value: 'STAFF', label: 'Staff', description: 'Can manage inventory' },
  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' }
];

const EditRoleModal = ({ user, onClose, onSubmit }) => {
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit({ role });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit User Role</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">User: <strong>{user.user.name}</strong></p>
          <p className="text-sm text-gray-600">Email: {user.user.email}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roles.map(roleOption => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label} - {roleOption.description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || role === user.role}
            >
              {loading ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ...existing routes... */}
        <Route path="/shops/:shopId/users" element={<RoleManagementPage />} />
        {/* ...existing routes... */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;