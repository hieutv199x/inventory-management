"use client";

import { useEffect, useState } from 'react';
import { X, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { httpClient } from '@/lib/http-client';

interface JobExecutionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
}

interface JobExecution {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  error?: string;
}

export function JobExecutionHistoryModal({ isOpen, onClose, job }: JobExecutionHistoryModalProps) {
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);

  useEffect(() => {
    if (isOpen && job?.id) {
      setLoading(true);
      httpClient.get(`/scheduler/executions?jobId=${job.id}&page=${page}&limit=${limit}`)
        .then((data) => {
          setExecutions(data.executions || []);
          setTotalPages(data.pagination?.totalPages || 1);
        })
        .catch(() => {
          setExecutions([]);
          setTotalPages(1);
        })
        .finally(() => setLoading(false));
    } else {
      setExecutions([]);
      setTotalPages(1);
    }
  }, [isOpen, job?.id, page, limit]);

  if (!isOpen || !job) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[60vw] max-h-[95vh]">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Execution History - {job.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-6 h-[70vh] overflow-y-auto">
        {loading ? (
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        ) : executions.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-400">No execution history found.</div>
        ) : (
          <>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-2">Started At</th>
                  <th className="text-left py-2 px-2">Finished At</th>
                  <th className="text-left py-2 px-2">Duration</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {executions.map(exec => (
                  <tr key={exec.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-2">{exec.startedAt ? new Date(exec.startedAt).toLocaleString() : '-'}</td>
                    <td className="py-2 px-2">{exec.finishedAt ? new Date(exec.finishedAt).toLocaleString() : '-'}</td>
                    <td className="py-2 px-2">{exec.duration ? `${exec.duration} ms` : '-'}</td>
                    <td className="py-2 px-2">
                      <span className={
                        exec.status === 'SUCCESS'
                          ? 'text-green-600'
                          : exec.status === 'FAILED'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }>
                        {exec.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs text-red-500">{exec.error || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="flex items-center px-4">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
