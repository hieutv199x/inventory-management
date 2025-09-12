"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, Settings, Code } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

interface JobEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  onSuccess: () => void;
}

export function JobEditModal({ isOpen, onClose, job, onSuccess }: JobEditModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    type: '',
    triggerType: '',
    cronExpression: '',
    intervalMinutes: '',
    scheduledAt: '',
    config: '{}',
    timeout: 300000,
    retryCount: 3,
    retryDelay: 60000,
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');
  const [configError, setConfigError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && job) {
      setFormData({
        id: job.id,
        name: job.name || '',
        description: job.description || '',
        type: job.type || '',
        triggerType: job.triggerType || '',
        cronExpression: job.cronExpression || '',
        intervalMinutes: job.intervalMinutes?.toString() || '',
        scheduledAt: job.scheduledAt ? new Date(job.scheduledAt).toISOString().slice(0, 16) : '',
        config: job.config ? (typeof job.config === 'string' ? job.config : JSON.stringify(job.config, null, 2)) : '{}',
        timeout: job.timeout || 300000,
        retryCount: job.retryCount || 3,
        retryDelay: job.retryDelay || 60000,
        tags: job.tags || []
      });
      setTagInput('');
      setConfigError('');
    }
  }, [isOpen, job]);

  if (!isOpen) return null;

  const getConfigTemplate = (type: string) => {
    switch (type) {
      case 'FUNCTION_CALL':
        return JSON.stringify({
          functionName: "syncTikTokOrders",
          params: {
            shopId: "your_shop_id",
            limit: 50
          }
        }, null, 2);
      case 'API_CALL':
        return JSON.stringify({
          url: "https://api.example.com/endpoint",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer token"
          },
          body: {
            key: "value"
          }
        }, null, 2);
      case 'DATABASE_QUERY':
        return JSON.stringify({
          operation: "updateMany",
          model: "product",
          where: {
            status: "inactive"
          },
          data: {
            status: "active"
          }
        }, null, 2);
      case 'WEBHOOK_TRIGGER':
        return JSON.stringify({
          url: "https://webhook.example.com/endpoint",
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          payload: {
            event: "job_completed",
            data: {}
          }
        }, null, 2);
      default:
        return '{}';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate config JSON
    try {
      JSON.parse(formData.config);
      setConfigError('');
    } catch (error) {
      setConfigError('Invalid JSON configuration');
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      alert('Job name is required');
      return;
    }

    if (!formData.type) {
      alert('Job type is required');
      return;
    }

    if (!formData.triggerType) {
      alert('Trigger type is required');
      return;
    }

    // Validate trigger-specific fields
    if (formData.triggerType === 'CRON' && !formData.cronExpression.trim()) {
      alert('Cron expression is required');
      return;
    }

    if (formData.triggerType === 'INTERVAL' && (!formData.intervalMinutes || parseInt(formData.intervalMinutes) <= 0)) {
      alert('Valid interval minutes is required');
      return;
    }

    if (formData.triggerType === 'ONE_TIME' && !formData.scheduledAt) {
      alert('Scheduled time is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/scheduler/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          config: JSON.parse(formData.config),
          intervalMinutes: formData.intervalMinutes ? parseInt(formData.intervalMinutes) : null
        })
      });

      if (response.ok) {
        alert('Job updated successfully');
        onClose();
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Error updating job');
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[30vw] max-h-[95vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Update Scheduler Job
          </h3>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="p-6 h-[70vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter job name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => {
                setFormData({ 
                  ...formData, 
                  type: e.target.value, 
                  config: getConfigTemplate(e.target.value) 
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Select job type</option>
              <option value="FUNCTION_CALL">Function Call</option>
              <option value="API_CALL">API Call</option>
              <option value="DATABASE_QUERY">Database Query</option>
              <option value="WEBHOOK_TRIGGER">Webhook Trigger</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Enter job description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* Trigger Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trigger Type *
            </label>
            <select
              value={formData.triggerType}
              onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Select trigger type</option>
              <option value="CRON">Cron Expression</option>
              <option value="INTERVAL">Fixed Interval</option>
              <option value="ONE_TIME">One Time</option>
            </select>
          </div>
          {formData.triggerType === 'CRON' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cron Expression *
              </label>
              <input
                type="text"
                value={formData.cronExpression}
                onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                placeholder="0 */5 * * * * (every 5 minutes)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Format: second minute hour dayOfMonth month dayOfWeek
              </p>
            </div>
          )}
          {formData.triggerType === 'INTERVAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interval (minutes) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.intervalMinutes}
                onChange={(e) => setFormData({ ...formData, intervalMinutes: e.target.value })}
                placeholder="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          )}
          {formData.triggerType === 'ONE_TIME' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scheduled Time *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          )}

          {/* Job Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Configuration JSON *
            </label>
            <textarea
              value={formData.config}
              onChange={(e) => setFormData({ ...formData, config: e.target.value })}
              rows={10}
              placeholder="Enter JSON configuration"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 font-mono text-sm"
            />
            {configError && (
              <p className="text-xs text-red-500 mt-1">{configError}</p>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timeout (ms)
              </label>
              <input
                type="number"
                min="1000"
                value={formData.timeout}
                onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Retry Count
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.retryCount}
                onChange={(e) => setFormData({ ...formData, retryCount: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Retry Delay (ms)
              </label>
              <input
                type="number"
                min="1000"
                value={formData.retryDelay}
                onChange={(e) => setFormData({ ...formData, retryDelay: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => removeTag(tag)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.name.trim() || !formData.type || !formData.triggerType}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Updating...' : 'Update Job'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
