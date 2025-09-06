"use client";
import React from 'react';
import { FaTimes, FaEdit, FaTrash, FaCopy } from 'react-icons/fa';
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface App {
  id: string;
  appId: string;
  appKey: string;
  appSecret: string | null;
  appName: string | null;
  createdAt: string;
  isActive: boolean;
}

interface AppListModalProps {
  isOpen: boolean;
  appList: App[];
  editingAppId: string | null;
  editAppSecret: string;
  canDelete: boolean;
  onClose: () => void;
  onEditAppSecret: (app: App) => void;
  onSaveAppSecret: (id: string) => void;
  onCancelEdit: () => void;
  onDeleteApp: (app: App) => void;
  onCopyAuthUrl: (serviceId: string, appName: string) => void;
  onEditSecretChange: (value: string) => void;
}

const AppListModal: React.FC<AppListModalProps> = ({
  isOpen,
  appList,
  editingAppId,
  editAppSecret,
  canDelete,
  onClose,
  onEditAppSecret,
  onSaveAppSecret,
  onCancelEdit,
  onDeleteApp,
  onCopyAuthUrl,
  onEditSecretChange
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-7xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Danh sách App
        </h2>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Đóng"
        >
          <FaTimes className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                STT
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Tên App
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Service ID
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                App Key
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                App Secret
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Trạng thái
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Ngày tạo
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Thao tác
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {appList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-gray-500 dark:text-gray-400">
                  Không có app nào
                </TableCell>
              </TableRow>
            ) : (
              appList.map((app, idx) => {
                const isEditing = editingAppId === app.id;
                return (
                  <TableRow key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-medium">
                      {app.appName || 'N/A'}
                    </TableCell>
                    <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-mono text-sm">
                      {app.appId}
                    </TableCell>
                    <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-mono text-sm">
                      {app.appKey}
                    </TableCell>
                    <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editAppSecret}
                          onChange={(e) => onEditSecretChange(e.target.value)}
                          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                          placeholder="Enter app secret..."
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono text-sm">
                          {app.appSecret ? '••••••••••••' : 'N/A'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      {app.isActive ? (
                        <Badge size="sm" color="success">Hoạt động</Badge>
                      ) : (
                        <Badge size="sm" color="error">Không hoạt động</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                      {new Date(app.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onCopyAuthUrl(app.appId, app.appName || 'Unknown App')}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors"
                          title="Sao chép URL ủy quyền"
                        >
                          <FaCopy className="w-4 h-4" />
                        </button>
                        {isEditing ? (
                          <>
                            <button
                              className="text-green-600 hover:text-green-800 dark:text-green-400 transition-colors"
                              title="Lưu"
                              onClick={() => onSaveAppSecret(app.id)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button
                              className="text-gray-400 hover:text-gray-600 dark:text-gray-300 transition-colors"
                              title="Hủy"
                              onClick={onCancelEdit}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 transition-colors"
                              title="Sửa"
                              onClick={() => onEditAppSecret(app)}
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            {(canDelete && app.isActive) && (
                              <button
                                onClick={() => onDeleteApp(app)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 transition-colors"
                                title="Xóa"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Modal>
  );
};

export default AppListModal;
