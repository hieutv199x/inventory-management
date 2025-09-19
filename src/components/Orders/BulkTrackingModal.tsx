"use client";

import { X } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { httpClient } from '@/lib/http-client';
import { useLoading } from '@/context/loadingContext';

type OrderLite = {
    id: string;
    orderId: string;
    lineItems?: Array<any>;
    channelData?: string;
    packages?: Array<any>;
};

type BulkData = {
    [orderId: string]: {
        trackingId: string;
        shippingProvider: string;
        receiptId: string;
    };
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    selectedOrders: OrderLite[];
    data: BulkData;
    onChange: (orderId: string, field: 'trackingId' | 'shippingProvider' | 'receiptId', value: string) => void;
    onSave: () => void;
    getLineItemImages: (order: any) => Array<{ image?: string; productName: string; id: string }>;
};

export default function BulkTrackingModal({
    isOpen,
    onClose,
    selectedOrders,
    data,
    onChange,
    onSave,
    getLineItemImages,
}: Props) {
    const [availableProviders, setAvailableProviders] = useState<any[]>([]);
    const { showLoading, hideLoading } = useLoading();
    const [packages, setPackages] = useState<any[]>([]);

    // Aggregate all packages from selectedOrders (dedupe by packageId per order)
    useEffect(() => {
        if (!isOpen) return;

        // Flatten packages and keep reference to source orderId
        const all = selectedOrders.flatMap(order =>
            (order?.packages ?? []).map((pkg: any) => ({
                ...pkg,
                __orderId: order.orderId,
            }))
        );

        // If a package has no line item linkage, map to all line item IDs of the source order
        const withMappedLineItems = all.map((p: any) => {
            const sourceOrder = selectedOrders.find(o => o.orderId === p.__orderId);
            const lineItemIds = (sourceOrder?.lineItems ?? []).map((li: any) => li?.id).filter(Boolean);

            const hasCamel = Array.isArray(p.orderLineItemIds) && p.orderLineItemIds.length > 0;
            const hasSnake = Array.isArray(p.order_line_item_ids) && p.order_line_item_ids.length > 0;

            if (hasCamel || hasSnake) return p;

            // Attach a normalized camelCase field; preserve existing fields
            return {
                ...p,
                orderLineItemIds: lineItemIds,
            };
        });

        // Dedupe by packageId (or id) + orderId
        const seen = new Set<string>();
        const unique = withMappedLineItems.filter((p: any) => {
            const key = `${p.packageId || p.id || ''}:${p.__orderId || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        setPackages(unique);
    }, [isOpen, selectedOrders]);

    // Load shipping providers similar to AddTrackingModal (use first selected order)
    useEffect(() => {
        if (!isOpen || !selectedOrders || selectedOrders.length === 0 || availableProviders.length > 0) return;
        (async () => {
            try {
                showLoading('Loading shipping providers...');
                const firstOrder = selectedOrders[0];
                const res = await httpClient.get(`/tiktok/Fulfillment/shipping-provider?orderId=${firstOrder.orderId}`);
                if (Array.isArray(res) && res.length > 0) {
                    const seen = new Set<string>();
                    const unique = res.filter((p: any) => {
                        const key = typeof p === 'string' ? p : (p.id || p.name || p.displayName || JSON.stringify(p));
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });
                    setAvailableProviders(unique);
                } else {
                    setAvailableProviders([]);
                }
            } catch (err) {
                console.error('Error fetching shipping providers (bulk):', err);
                setAvailableProviders([]);
            } finally {
                hideLoading();
            }
        })();
    }, [isOpen, selectedOrders, availableProviders.length, showLoading, hideLoading]);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[70vw] max-h-[95vh] overflow-hidden">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Add Tracking Info ({selectedOrders.length} orders)
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Order ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Tracking ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Shipping Provider
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {selectedOrders.map((order) => {
                                    const images = getLineItemImages(order) || [];
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {order.orderId}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {(order.lineItems?.length || 0)} items
                                                    </span>
                                                    <div className="flex -space-x-1">
                                                        {images.slice(0, 3).map((item, idx) => (
                                                            <Image
                                                                key={`${order.id}-${idx}`}
                                                                src={item.image || '/images/placeholder.png'}
                                                                alt={item.productName || 'Product'}
                                                                width={24}
                                                                height={24}
                                                                className="w-6 h-6 rounded border border-gray-200 object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/images/placeholder.png';
                                                                }}
                                                            />
                                                        ))}
                                                        {(order.lineItems?.length || 0) > 3 && (
                                                            <div className="w-6 h-6 rounded border border-gray-200 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                                    +{(order.lineItems?.length || 0) - 3}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    value={data[order.id]?.trackingId || ''}
                                                    onChange={(e) => onChange(order.id, 'trackingId', e.target.value)}
                                                    placeholder="Enter tracking ID"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={data[order.id]?.shippingProvider || ''}
                                                    onChange={(e) => onChange(order.id, 'shippingProvider', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    required
                                                >
                                                    <option value=""></option>
                                                    {availableProviders.map((provider, index) => {
                                                        const providerName = typeof provider === 'string' ? provider : provider.name || provider.id;
                                                        const providerDisplayName = typeof provider === 'string' ? provider : provider.displayName || provider.name || provider.id;
                                                        const providerValue = typeof provider === 'string' ? provider : (provider.id || provider.name || providerDisplayName);
                                                        return (
                                                            <option key={`${providerName}-${index}`} value={providerValue}>
                                                                {providerDisplayName}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                        Save Tracking Info
                    </button>
                </div>
            </div>
        </Modal>
    );
}