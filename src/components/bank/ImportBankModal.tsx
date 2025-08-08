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

export default function ImportBankModal({ isOpen, onClose, onSuccess }: ImportBankModalProps) {
  const [csvData, setCsvData] = useState<any[]>([]);
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

interface BankAccountCsvRow {
  'Account Number': string;
  'Routing Number': string;
  'Swift Code': string;
  'Bank Name': string;
  'Account Holder': string;
}
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
    const banks: BankAccount[] = csvData.map((row: any, index: number) => ({
      id: `bank_${Date.now()}_${index}`,
      accountNumber: row['Account Number'] || '',
      routingNumber: row['Routing Number'] || '',
      swiftCode: row['Swift Code'] || '',
      bankName: row['Bank Name'] || '',
      accountHolder: row['Account Holder'] || '',
      uploadDate: new Date().toISOString(),
      uploader: 'Current User', // Should get from auth context
      status: 'unused' as const
    }));
    
    onSuccess(banks);
  };

  const handleReset = () => {
    setCsvData([]);
    setFileName('');
    setStep('upload');
  };

  const downloadSample = () => {
    const sampleData = [
      {
        'Account Number': '1234567890',
        'Routing Number': '123456789',
        'Swift Code': 'ABCDUS33',
        'Bank Name': 'Sample Bank',
        'Account Holder': 'John Doe'
      }
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bank_sample.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
      <Modal
          isOpen={isOpen}
          onClose={onClose}
          className="max-w-3xl p-6"
      >
        <div>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
            Import Bank
          </h4>

          {step === 'upload' ? (
              <>
                <div className="mb-4">
                  <Button
                      variant="outline"
                      onClick={downloadSample}
                      className="flex items-center gap-2"
                  >
                    <DownloadIcon className="w-6 h-6" />
                    Tải file mẫu
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
                    Lưu ý quan trọng:
                  </p>
                  <ul className="text-sm text-yellow-600 dark:text-yellow-400 list-disc list-inside space-y-1">
                    <li>Đảm bảo các trường số được hiển thị đầy đủ, không ở dạng ký hiệu khoa học</li>
                    <li>Sau khi tải lên thành công, bạn không thể sửa thông tin ngân hàng</li>
                    <li>Vui lòng kiểm tra kỹ trước khi xác nhận</li>
                  </ul>
                </div>
              </>
          ) : (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Kiểm tra thông tin
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    File: {fileName} ({csvData.length} tài khoản)
                  </p>
                </div>

                <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Account Number</th>
                      <th className="px-4 py-2 text-left">Bank Name</th>
                      <th className="px-4 py-2 text-left">Account Holder</th>
                      <th className="px-4 py-2 text-left">Swift Code</th>
                      <th className="px-4 py-2 text-left">Routing Number</th>
                    </tr>
                    </thead>
                    <tbody>
                    {csvData.map((row, index) => (
                        <tr key={index} className="border-t border-gray-200 dark:border-gray-600">
                          <td className="px-4 py-2">{row['Account Number']}</td>
                          <td className="px-4 py-2">{row['Bank Name']}</td>
                          <td className="px-4 py-2">{row['Account Holder']}</td>
                          <td className="px-4 py-2">{row['Swift Code']}</td>
                          <td className="px-4 py-2">{row['Routing Number']}</td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button onClick={handleConfirm} className="flex-1">
                    Xác nhận
                  </Button>
                  <Button variant="outline" onClick={handleReset} className="flex-1">
                    Xóa dữ liệu
                  </Button>
                </div>
              </>
          )}
        </div>
      </Modal>
  );
}
