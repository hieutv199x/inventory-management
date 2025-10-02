"use client";
import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { httpClient } from '@/lib/http-client';
import { toast } from 'react-hot-toast';

interface SyncProductButtonProps {
    product: {
        id: string;
        productId: string;
        title: string;
        status: string;
        channelData?: string;
    };
    onSyncSuccess?: (product: any) => void;
    className?: string;
}

interface SyncStatus {
    status: 'idle' | 'syncing' | 'success' | 'error';
    message?: string;
}

export default function SyncProductButton({ 
    product, 
    onSyncSuccess,
    className = ""
}: SyncProductButtonProps) {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: 'idle' });

    // Parse channel data to check sync status
    const channelData = product.channelData ? JSON.parse(product.channelData) : {};
    const isSynced = channelData.tiktokProductId && channelData.syncStatus === 'SUCCESS';
    const hasSyncError = channelData.syncStatus === 'FAILED';

    const handleSync = async (saveAs: 'AS_DRAFT' | 'LISTING' = 'LISTING') => {
        setSyncStatus({ status: 'syncing' });
        
        try {
            const response = await httpClient.post('/products/sync', {
                productId: product.productId,
                saveAs
            });

            if (response.data.success) {
                setSyncStatus({ 
                    status: 'success', 
                    message: 'Product synced successfully!' 
                });
                toast.success('Product synced to TikTok Shop successfully!');
                
                if (onSyncSuccess) {
                    onSyncSuccess(response.data);
                }
                
                // Reset status after 3 seconds
                setTimeout(() => {
                    setSyncStatus({ status: 'idle' });
                }, 3000);
            }
        } catch (error: any) {
            console.error('Sync error:', error);
            const errorMessage = error.response?.data?.error || 'Failed to sync product';
            
            setSyncStatus({ 
                status: 'error', 
                message: errorMessage 
            });
            toast.error(errorMessage);
            
            // Reset status after 5 seconds
            setTimeout(() => {
                setSyncStatus({ status: 'idle' });
            }, 5000);
        }
    };

    const renderSyncButton = () => {
        if (syncStatus.status === 'syncing') {
            return (
                <button 
                    disabled 
                    className={`flex items-center px-3 py-1.5 text-xs rounded bg-blue-100 text-blue-700 ${className}`}
                >
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Syncing...
                </button>
            );
        }

        if (syncStatus.status === 'success') {
            return (
                <button 
                    disabled 
                    className={`flex items-center px-3 py-1.5 text-xs rounded bg-green-100 text-green-700 ${className}`}
                >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Synced!
                </button>
            );
        }

        if (syncStatus.status === 'error') {
            return (
                <button 
                    onClick={() => handleSync('LISTING')}
                    className={`flex items-center px-3 py-1.5 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 ${className}`}
                    title={syncStatus.message}
                >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Retry Sync
                </button>
            );
        }

        // Default state
        if (isSynced) {
            return (
                <div className="flex items-center space-x-1">
                    <span className={`flex items-center px-3 py-1.5 text-xs rounded bg-green-100 text-green-700 ${className}`}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Synced
                    </span>
                    <button
                        onClick={() => handleSync('LISTING')}
                        className="flex items-center px-2 py-1.5 text-xs rounded border border-blue-300 text-blue-700 hover:bg-blue-50"
                        title="Re-sync product"
                    >
                        <Upload className="h-3 w-3" />
                    </button>
                </div>
            );
        }

        if (hasSyncError) {
            return (
                <button
                    onClick={() => handleSync('LISTING')}
                    className={`flex items-center px-3 py-1.5 text-xs rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 ${className}`}
                    title={channelData.syncError || 'Sync failed - click to retry'}
                >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Sync Failed
                </button>
            );
        }

        // Not synced yet
        return (
            <div className="flex items-center space-x-1">
                <button
                    onClick={() => handleSync('AS_DRAFT')}
                    className={`flex items-center px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50 ${className}`}
                    title="Sync as draft"
                >
                    <Upload className="h-3 w-3 mr-1" />
                    Sync as Draft
                </button>
                <button
                    onClick={() => handleSync('LISTING')}
                    className={`flex items-center px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 ${className}`}
                    title="Sync and list product"
                >
                    <Upload className="h-3 w-3 mr-1" />
                    Sync & List
                </button>
            </div>
        );
    };

    return (
        <div className="flex items-center">
            {renderSyncButton()}
        </div>
    );
}