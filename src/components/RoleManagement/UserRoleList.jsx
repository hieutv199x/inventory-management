import React from 'react';

const roleColors = {
  OWNER: 'bg-purple-100 text-purple-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  STAFF: 'bg-green-100 text-green-800',
  VIEWER: 'bg-gray-100 text-gray-800'
};

const UserRoleList = ({ users, onEdit, onRemove }) => {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Shop Users</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No users found
          </div>
        ) : (
          users.map((userRole) => (
            <div key={userRole.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {userRole.user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {userRole.user.name || 'Unknown User'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {userRole.user.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[userRole.role]}`}>
                  {userRole.role}
                </span>
                
                <div className="flex space-x-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(userRole)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                  )}
                  
                  {onRemove && userRole.role !== 'OWNER' && (
                    <button
                      onClick={() => onRemove(userRole.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserRoleList;
