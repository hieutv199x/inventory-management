import { X, Loader2 } from 'lucide-react';
import React from 'react';
import { Modal } from '../ui/modal';

type Props = {
  isOpen: boolean;
  isSubmitting?: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onTemplateDownload: () => void;
  onSampleDownload: () => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
};

export default function ImportOrdersModal({
  isOpen,
  isSubmitting,
  file,
  onFileChange,
  onTemplateDownload,
  onSampleDownload,
  onClose,
  onSubmit,
}: Props) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[50vw] max-h-[95vh] overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Import Orders from Excel
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Upload an Excel file with order tracking information. The file should contain columns for Order ID, SKU ID, Product name, Variations, Quantity, Shipping provider name, Tracking ID, and Receipt ID.
            </p>
            <button
              onClick={onTemplateDownload}
              className="text-blue-600 hover:text-blue-700 text-sm underline mb-2"
            >
              Download Excel Template
            </button>
            <br />
            <button
              onClick={onSampleDownload}
              className="text-green-600 hover:text-green-700 text-sm underline mb-3"
            >
              Download Sample Data
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Excel File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {file && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Selected file: {file.name}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!file || !!isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isSubmitting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
