"use client";

import { Play, Pause, Trash2, Edit, Calendar, Clock, Tag } from 'lucide-react';

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

interface JobListProps {
  jobs: SchedulerJob[];
  loading: boolean;
  onExecute: (jobId: string) => void;
  onToggleStatus: (job: SchedulerJob) => void;
  onEdit: (job: SchedulerJob) => void;
  onDelete: (jobId: string) => void;
  onViewHistory: (job: SchedulerJob) => void;
}

export function JobList({ 
  jobs, 
  loading, 
  onExecute, 
  onToggleStatus, 
  onEdit, 
  onDelete, 
  onViewHistory 
}: JobListProps) {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'DELETED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'FUNCTION_CALL': return 'bg-blue-100 text-blue-800';
      case 'API_CALL': return 'bg-purple-100 text-purple-800';
      case 'DATABASE_QUERY': return 'bg-orange-100 text-orange-800';
      case 'WEBHOOK_TRIGGER': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTrigger = (job: SchedulerJob) => {
    switch (job.triggerType) {
      case 'CRON':
        return `Cron: ${job.cronExpression}`;
      case 'INTERVAL':
        return `Every ${job.intervalMinutes} minutes`;
      case 'ONE_TIME':
        return `Once at ${new Date(job.scheduledAt!).toLocaleString()}`;
      default:
        return job.triggerType;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No jobs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{job.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(job.status)}`}>
                    {job.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(job.type)}`}>
                    {job.type.replace('_', ' ')}
                  </span>
                </div>
                {job.description && (
                  <p className="text-gray-600">{job.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onExecute(job.id)}
                  disabled={job.status !== 'ACTIVE'}
                  className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Execute Job"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onToggleStatus(job)}
                  className="p-2 text-gray-600 hover:text-yellow-600"
                  title={job.status === 'ACTIVE' ? 'Pause Job' : 'Resume Job'}
                >
                  {job.status === 'ACTIVE' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onEdit(job)}
                  className="p-2 text-gray-600 hover:text-blue-600"
                  title="Edit Job"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(job.id)}
                  className="p-2 text-gray-600 hover:text-red-600"
                  title="Delete Job"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{formatTrigger(job)}</span>
              </div>
              {job.lastExecutedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Last: {new Date(job.lastExecutedAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Executions: {job._count.executions}</span>
              </div>
            </div>
            
            {job.tags.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-gray-400" />
                <div className="flex gap-1 flex-wrap">
                  {job.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={() => onViewHistory(job)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Execution History
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
