'use client';

import { useState } from 'react';

// Define the Channel type locally to avoid import issues
type Channel = 'TIKTOK' | 'AMAZON' | 'SHOPIFY' | 'ALIBABA_1688';

interface ChannelSelectorProps {
  selectedChannel: Channel | null;
  onChannelChange: (channel: Channel | null) => void;
  className?: string;
  allowClear?: boolean;
}

const channelInfo: Record<Channel, { name: string; icon: string; color: string; hoverColor: string }> = {
  TIKTOK: { name: 'TikTok Shop', icon: '🎵', color: 'bg-black text-white', hoverColor: 'hover:bg-gray-800' },
  AMAZON: { name: 'Amazon', icon: '📦', color: 'bg-orange-500 text-white', hoverColor: 'hover:bg-orange-600' },
  SHOPIFY: { name: 'Shopify', icon: '🛍️', color: 'bg-green-600 text-white', hoverColor: 'hover:bg-green-700' },
  ALIBABA_1688: { name: '1688 Alibaba', icon: '🏭', color: 'bg-orange-600 text-white', hoverColor: 'hover:bg-orange-700' }
};

export default function ChannelSelector({ 
  selectedChannel, 
  onChannelChange, 
  className = '', 
  allowClear = true 
}: ChannelSelectorProps) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {allowClear && selectedChannel && (
        <button
          onClick={() => onChannelChange(null)}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border-2 border-transparent"
        >
          ✕ Clear
        </button>
      )}
      
      {Object.entries(channelInfo).map(([key, info]) => {
        const channel = key as Channel;
        const isSelected = selectedChannel === channel;
        
        return (
          <button
            key={channel}
            onClick={() => onChannelChange(channel)}
            className={`
              px-4 py-2 rounded-lg flex items-center gap-2 transition-all border-2
              ${isSelected 
                ? `${info.color} border-blue-500 ring-2 ring-blue-200` 
                : `bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent ${info.hoverColor}`
              }
            `}
          >
            <span className="text-lg">{info.icon}</span>
            <span className="font-medium">{info.name}</span>
          </button>
        );
      })}
    </div>
  );
}
