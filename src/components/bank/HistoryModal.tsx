"use client";
import React from 'react';
import { CloseLineIcon } from "@/icons";

interface HistoryAction {
  id: string;
  action: string;
  user: string;
  userRole: 'Owner' | 'Seller' | 'Accountant';
  timestamp: string;
  details: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockHistory: HistoryAction[] = [
  {
    id: '1',
    action: 'Import bank',
    user: 'John Doe',
    userRole: 'Owner',
    timestamp: new Date().toISOString(),
    details: 'Imported 5 bank accounts from CSV file'
  },
  {
    id: '2',
    action: 'Assign shop',
    user: 'Jane Smith',
    userRole: 'Accountant',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    details: 'Assigned Shop Electronics to account ***1234'
  },
  {
    id: '3',
    action: 'Delete bank',
    user: 'John Doe',
    userRole: 'Owner',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    details: 'Deleted bank account ***5678'
  }
];

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  if (!isOpen) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'Accountant':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'Seller':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Lịch sử hành động
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <CloseLineIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="max-h-96 overflow-auto">
            <div className="space-y-4">
              {mockHistory.map((item) => (
                <div key={item.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.action}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(item.userRole)}`}>
                        {item.userRole}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Người thực hiện: {item.user}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {item.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
