"use client";
import React from 'react';
import { CloseLineIcon } from "@/icons";
import { Modal } from "../ui/modal";

interface BankAccount {
  id: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
  bankName: string;
  accountHolder: string;
  uploadDate: string;
  uploader: string;
  status: 'used' | 'unused';
  shop?: string;
  setupDate?: string;
  assignedSeller?: string;
}

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: BankAccount;
}

export default function BankDetailsModal({ isOpen, onClose, bank }: BankDetailsModalProps) {
  if (!isOpen) return null;

  const details = [
    { label: 'Tên ngân hàng', value: bank.bankName },
    { label: 'Số tài khoản', value: bank.accountNumber },
    { label: 'Routing Number', value: bank.routingNumber },
    { label: 'Swift Code', value: bank.swiftCode },
    { label: 'Chủ tài khoản', value: bank.accountHolder },
    { label: 'Ngày upload', value: new Date(bank.uploadDate).toLocaleString() },
    { label: 'Người upload', value: bank.uploader },
    { label: 'Tình trạng', value: bank.status === 'used' ? 'Đã dùng' : 'Chưa dùng' },
    { label: 'Shop được gán', value: bank.shop || 'Chưa gán' },
    { label: 'Ngày set up', value: bank.setupDate ? new Date(bank.setupDate).toLocaleString() : 'Chưa set up' },
    { label: 'Nhân sự quản lý', value: bank.assignedSeller || 'Chưa có' }
  ];

  return (
      <Modal
          isOpen={isOpen}
          onClose={onClose} className="max-w-md p-6" >
      <div>
        <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
          Thông tin tài khoản ngân hàng
        </h4>

        <div className="p-6">
          <div className="space-y-4">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {detail.label}:
                </span>
                <span className="text-sm text-gray-900 dark:text-white text-right max-w-48 break-words">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </Modal>
  );
}
