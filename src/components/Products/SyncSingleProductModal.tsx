"use client";
import React, { useState, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import ShopSelector from '@/components/ui/ShopSelector';
import { httpClient } from '@/lib/http-client';
import { toast } from 'react-hot-toast';

interface SyncSingleProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        productId: string;
        title: string;
        status: string;
    } | null;
    onSyncSuccess: () => void;
}

export default function SyncSingleProductModal({
    isOpen,
    onClose,
    product,
    onSyncSuccess
}: SyncSingleProductModalProps) {
    const [selectedShopId, setSelectedShopId] = useState<string>('');
    const [isSyncing, setIsSyncing] = useState(false);

    // Reset selected shop when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedShopId('');
        }
    }, [isOpen]);

    const handleSync = async () => {
        if (!selectedShopId) {
            toast.error('Please select a shop first');
            return;
        }

        if (!product) {
            toast.error('No product selected');
            return;
        }

        setIsSyncing(true);
        try {
            const response = await httpClient.post('/api/products/sync', {
                productId: product.productId,
                shopId: selectedShopId
            });

            if (response.data.success) {
                toast.success(`Product "${product.title}" synced successfully!`);
                onSyncSuccess();
                onClose();
            } else {
                throw new Error(response.data.error || 'Sync failed');
            }
        } catch (error: any) {
            console.error('Sync error:', error);
            toast.error(error.message || 'Failed to sync product');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Sync Product to TikTok Shop
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Product to sync:
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {product?.title || 'No product selected'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Shop
                        </label>
                        <ShopSelector
                            value={selectedShopId}
                            onChange={(shopId, shop) => setSelectedShopId(shopId || '')}
                            placeholder="Choose a shop to sync to..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={isSyncing}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={!selectedShopId || !product || isSyncing}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSyncing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Syncing...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                Sync to TikTok
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}