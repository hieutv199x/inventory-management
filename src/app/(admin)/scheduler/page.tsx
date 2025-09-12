"use client";

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { JobCreateModal } from '@/components/scheduler/job-create-modal';
import { JobList } from '@/components/scheduler/job-list';
import { JobFilters } from '@/components/scheduler/job-filters';
import { JobEditModal } from '@/components/scheduler/job-edit-modal';
import { JobExecutionHistoryModal } from '@/components/scheduler/job-execution-history-modal';

interface SchedulerJob {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  triggerType: string;
  cronExpression?: string;
  intervalMinutes?: number;
  scheduledAt?: string;
  tags: string[];
  lastExecutedAt?: string;
  nextExecutionAt?: string;
  createdAt: string;
  creator?: {
    name: string;
    username: string;
  };
  _count: {
    executions: number;
  };
}

export default function SchedulerPage() {
  const [jobs, setJobs] = useState<SchedulerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<SchedulerJob | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showExecutionHistory, setShowExecutionHistory] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter, typeFilter, searchTerm]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/scheduler/jobs?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setJobs(data.jobs || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/scheduler/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      
      if (response.ok) {
        alert('Job execution started successfully');
        fetchJobs();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Error executing job');
    }
  };

  const handleToggleJobStatus = async (job: SchedulerJob) => {
    const newStatus = job.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    
    try {
      const response = await fetch(`/api/scheduler/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...job, status: newStatus })
      });
      
      if (response.ok) {
        fetchJobs();
      }
    } catch (error) {
      alert('Error updating job status');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const response = await fetch(`/api/scheduler/jobs/${jobId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchJobs();
      }
    } catch (error) {
      alert('Error deleting job');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scheduler Management</h1>
          <p className="text-gray-600">Manage automated jobs and tasks</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </button>
      </div>

      <JobFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
      />

      <JobList
        jobs={jobs}
        loading={loading}
        onExecute={handleExecuteJob}
        onToggleStatus={handleToggleJobStatus}
        onEdit={(job) => {
          setSelectedJob(job);
          setShowEditForm(true);
        }}
        onDelete={handleDeleteJob}
        onViewHistory={(job) => {
          setSelectedJob(job);
          setShowExecutionHistory(true);
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
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

      <JobCreateModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={fetchJobs}
      />

      {/* Edit Job Modal */}
      <JobEditModal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedJob(null);
        }}
        job={selectedJob}
        onSuccess={fetchJobs}
      />

      {/* Execution History Modal */}
      <JobExecutionHistoryModal
        isOpen={showExecutionHistory}
        onClose={() => {
          setShowExecutionHistory(false);
          setSelectedJob(null);
        }}
        job={selectedJob}
      />
    </div>
  );
}