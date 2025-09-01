'use client';

import { useState } from 'react';
import { Channel } from '@prisma/client';
import ChannelSelector from './ChannelSelector';

interface ChannelAppFormProps {
  onSubmit: (data: ChannelAppFormData) => void;
  onCancel: () => void;
}

interface ChannelAppFormData {
  appName: string;
  channel: Channel;
  appId: string;
  appKey: string;
  appSecret: string;
  config?: string;
}

export default function ChannelAppForm({ onSubmit, onCancel }: ChannelAppFormProps) {
  const [formData, setFormData] = useState<ChannelAppFormData>({
    appName: '',
    channel: 'TIKTOK' as Channel,
    appId: '',
    appKey: '',
    appSecret: '',
    config: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getChannelFields = () => {
    switch (formData.channel) {
      case 'TIKTOK':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">App ID</label>
              <input
                type="text"
                value={formData.appId}
                onChange={(e) => setFormData({...formData, appId: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="TikTok App ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">App Key</label>
              <input
                type="text"
                value={formData.appKey}
                onChange={(e) => setFormData({...formData, appKey: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="TikTok App Key"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">App Secret</label>
              <input
                type="password"
                value={formData.appSecret}
                onChange={(e) => setFormData({...formData, appSecret: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="TikTok App Secret"
                required
              />
            </div>
          </div>
        );
      case 'AMAZON':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Client ID</label>
              <input
                type="text"
                value={formData.appId}
                onChange={(e) => setFormData({...formData, appId: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Amazon SP-API Client ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Secret</label>
              <input
                type="password"
                value={formData.appSecret}
                onChange={(e) => setFormData({...formData, appSecret: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Amazon SP-API Client Secret"
                required
              />
            </div>
          </div>
        );
      case 'SHOPIFY':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">API Key</label>
              <input
                type="text"
                value={formData.appKey}
                onChange={(e) => setFormData({...formData, appKey: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Shopify API Key"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">API Secret</label>
              <input
                type="password"
                value={formData.appSecret}
                onChange={(e) => setFormData({...formData, appSecret: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Shopify API Secret"
                required
              />
            </div>
          </div>
        );
      case 'ALIBABA_1688':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">App Key</label>
              <input
                type="text"
                value={formData.appKey}
                onChange={(e) => setFormData({...formData, appKey: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="1688 App Key"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">App Secret</label>
              <input
                type="password"
                value={formData.appSecret}
                onChange={(e) => setFormData({...formData, appSecret: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="1688 App Secret"
                required
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Channel Application</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">App Name</label>
            <input
              type="text"
              value={formData.appName}
              onChange={(e) => setFormData({...formData, appName: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="Descriptive name for this app"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
            <ChannelSelector
              selectedChannel={formData.channel}
              onChannelChange={(channel) => {
                if (channel) setFormData({ ...formData, channel });
              }}
            />
          </div>
          
          {getChannelFields()}
          
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Create App
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
