"use client";
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import Button from "@/components/ui/button/Button";
import { Modal } from "../ui/modal";
import { DownloadIcon, CloseLineIcon, ArrowUpIcon } from "@/icons";

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
}

interface ImportBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (banks: BankAccount[]) => void;
}

interface BankAccountCsvRow {
  'Note': string;
  'Bank Name': string;
  'Routing Number': string;
  'Swift Code': string;
  'Account Number': string;
  'Type': string;
}

const ImportBankModal = ({ isOpen, onClose, onSuccess }: ImportBankModalProps) => {
  const [csvData, setCsvData] = useState<BankAccountCsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState<'upload' | 'preview'>('upload');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      setFileName(file.name);
      Papa.parse<BankAccountCsvRow>(file, {
        complete: (results: Papa.ParseResult<BankAccountCsvRow>) => {
          setCsvData(results.data);
          setStep('preview');
        },
        header: true,
        skipEmptyLines: true
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleConfirm = () => {
    const banks: BankAccount[] = csvData.map((row: BankAccountCsvRow, index: number) => ({
      id: `bank_${Date.now()}_${index}`,
      accountNumber: row['Account Number'] || '',
      routingNumber: row['Routing Number'] || '',
      swiftCode: row['Swift Code'] || '',
      bankName: row['Bank Name'] || '',
      accountHolder: row['Note'] || '', // Using Note as account holder
      uploadDate: new Date().toISOString(),
      uploader: 'Current User',
      status: 'unused' as const
    }));
    
    onSuccess(banks);
  };

  const handleReset = () => {
    setCsvData([]);
    setFileName('');
    setStep('upload');
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/bank_import_template.csv';
    link.download = 'bank_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl p-6"
    >
      <div>
        <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
          Import Bank
        </h4>

        {step === 'upload' ? (
          <>
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                Định dạng file CSV yêu cầu:
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <p>• <strong>Note:</strong> Ghi chú hoặc tên chủ tài khoản</p>
                <p>• <strong>Bank Name:</strong> Tên ngân hàng đầy đủ</p>
                <p>• <strong>Routing Number:</strong> Số định tuyến ngân hàng</p>
                <p>• <strong>Swift Code:</strong> Mã SWIFT quốc tế</p>
                <p>• <strong>Account Number:</strong> Số tài khoản (đầy đủ, không rút gọn)</p>
                <p>• <strong>Type:</strong> Loại tài khoản (Checking, Savings, Business)</p>
              </div>
              <button
                onClick={downloadTemplate}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Tải file mẫu CSV
              </button>
            </div>

            <div className="mb-4">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <DownloadIcon className="w-6 h-6" />
                Tải file mẫu Excel/CSV
              </Button>
            </div>

            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                }`}
            >
              <input {...getInputProps()} />
              <ArrowUpIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isDragActive ? 'Thả file vào đây...' : 'Import file'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Kéo thả file CSV vào đây hoặc nhấp để chọn file
              </p>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium mb-1">
                ⚠️ Lưu ý quan trọng về định dạng số:
              </p>
              <ul className="text-sm text-yellow-600 dark:text-yellow-400 list-disc list-inside space-y-1">
                <li><strong>Account Number và Routing Number phải hiển thị đầy đủ</strong></li>
                <li>Không được rút gọn thành dạng khoa học (VD: 1.55E+14)</li>
                <li>Trong Excel: Format cells → Number → 0 decimal places</li>
                <li>Hoặc thêm dấu ' trước số để Excel hiểu là text</li>
                <li>Kiểm tra kỹ trước khi upload - sau khi xác nhận không thể sửa</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Kiểm tra thông tin trước khi import
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                File: <strong>{fileName}</strong> ({csvData.length} tài khoản)
              </p>
            </div>

            <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-600 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Note</th>
                    <th className="px-3 py-2 text-left">Bank Name</th>
                    <th className="px-3 py-2 text-left">Account Number</th>
                    <th className="px-3 py-2 text-left">Routing Number</th>
                    <th className="px-3 py-2 text-left">Swift Code</th>
                    <th className="px-3 py-2 text-left">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.map((row, index) => (
                    <tr key={index} className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-2 max-w-32 truncate" title={row['Note']}>{row['Note']}</td>
                      <td className="px-3 py-2 max-w-40 truncate" title={row['Bank Name']}>{row['Bank Name']}</td>
                      <td className="px-3 py-2 font-mono">{row['Account Number']}</td>
                      <td className="px-3 py-2 font-mono">{row['Routing Number']}</td>
                      <td className="px-3 py-2 font-mono">{row['Swift Code']}</td>
                      <td className="px-3 py-2">{row['Type']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={handleConfirm} className="flex-1">
                ✅ Xác nhận Import ({csvData.length} tài khoản)
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex-1">
                🔄 Upload lại file
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ImportBankModal;
