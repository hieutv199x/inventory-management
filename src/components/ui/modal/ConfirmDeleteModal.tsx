"use client";
import React from 'react';
import Button from "@/components/ui/button/Button";
import { CloseLineIcon, AlertIcon } from "@/icons";
import { Modal } from "../modal";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
      <Modal
          isOpen={isOpen}
          onClose={onClose} className="max-w-md p-6" >
      <div >
        <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
            {title}
        </h4>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0">
              <AlertIcon className="w-12 h-12 text-red-500" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white">
                {message}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              OK
            </Button>
          </div>
        </div>
      </div>
      </Modal>
  );
}
