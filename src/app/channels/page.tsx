'use client';

import { useState, useEffect } from 'react';
import { Channel } from '@prisma/client';
import ChannelSelector from '@/components/channels/ChannelSelector';
import ChannelAppForm from '@/components/channels/ChannelAppForm';

interface ChannelApp {
  id: string;
  appName: string;
  channel: Channel;
  appId: string;
  appKey: string;
  isActive: boolean;
  createdAt: string;
  authorizations?: ShopAuth[];
}

interface ShopAuth {
  id: string;
  shopId: string;
  shopName: string;
  status: string;
  createdAt: string;
}

export default function ChannelsPage() {
  const [apps, setApps] = useState<ChannelApp[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApps();
  }, [selectedChannel]);

  const fetchApps = async () => {
    try {
      const params = selectedChannel ? `?channel=${selectedChannel}` : '';
      const response = await fetch(`/api/channels/apps${params}`);
      const data = await response.json();
      setApps(data.apps || []);
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async (formData: any) => {
    try {
      const response = await fetch('/api/channels/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        fetchApps();
      }
    } catch (error) {
      console.error('Error creating app:', error);
    }
  };

  const getChannelIcon = (channel: Channel) => {
    const icons = {
      TIKTOK: '🎵',
      AMAZON: '📦',
      SHOPIFY: '🛍️',
      ALIBABA_1688: '🏭'
    };
    return icons[channel];
  };

  const getChannelColor = (channel: Channel) => {
    const colors = {
      TIKTOK: 'bg-black text-white',
      AMAZON: 'bg-orange-500 text-white',
      SHOPIFY: 'bg-green-600 text-white',
      ALIBABA_1688: 'bg-orange-600 text-white'
    };
    return colors[channel];
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Channel Management</h1>
          <p className="text-gray-600 mt-1">Manage your marketplace connections and applications</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <span>+</span>
          Add Channel App
        </button>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Filter by Channel</h2>
        <ChannelSelector
          selectedChannel={selectedChannel}
          onChannelChange={setSelectedChannel}
          allowClear={true}
        />
      </div>

      <div className="space-y-6">
        {apps.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Channel Applications</h3>
            <p className="text-gray-600 mb-6">
              {selectedChannel 
                ? `No applications found for ${selectedChannel}. Try selecting a different channel or add a new one.`
                : 'Get started by adding your first channel application.'
              }
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Channel App
            </button>
          </div>
        ) : (
          apps.map((app) => (
            <div key={app.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-medium ${getChannelColor(app.channel)}`}
                    >
                      {getChannelIcon(app.channel)} {app.channel}
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{app.appName}</h3>
                      <p className="text-sm text-gray-500">
                        App ID: {app.appId || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        app.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {app.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors">
                      Configure
                    </button>
                  </div>
                </div>
                
                {app.authorizations && app.authorizations.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Connected Shops ({app.authorizations.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {app.authorizations.map((auth) => (
                        <div key={auth.id} className="bg-gray-50 p-3 rounded border">
                          <div className="font-medium text-sm text-gray-900">
                            {auth.shopName || auth.shopId}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Status: <span className={`font-medium ${
                              auth.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {auth.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <ChannelAppForm
          onSubmit={handleCreateApp}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
