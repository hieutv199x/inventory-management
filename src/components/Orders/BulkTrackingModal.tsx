"use client";

import { X } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/modal';
import { httpClient } from '@/lib/http-client';
import { useLoading } from '@/context/loadingContext';

type OrderLite = {
    id: string;
    orderId: string;
    lineItems?: Array<any>;
    channelData?: string;
    packages?: Array<any>;
    shop?: { shopId: string }; // add shopId holder
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
    onSave: (rows: { orderId: string; shopId: string; packageId: string; trackingId: string; providerId: string }[]) => void; // include shopId
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
    const [clearedRows, setClearedRows] = useState<Set<string>>(new Set());
    // Local per-row input cache for snappy typing (keyed by orderId+packageId)
    const [rowsState, setRowsState] = useState<Record<string, { trackingId: string; shippingProvider: string }>>({});

    // Helper to build a stable row key for a package
    const getRowKey = (pkg: any) => `${pkg.__orderId}:${pkg.packageId || pkg.id || ''}`;

    // Aggregate/merge packages + compute stable __rowKey
    useEffect(() => {
        if (!isOpen) return;

        const all = selectedOrders.flatMap(order =>
            (order?.packages ?? []).map((pkg: any) => ({
                ...pkg,
                __orderId: order.orderId,
                __shopId: order.shop?.shopId || '', // tag package with shopId
            }))
        );

        const merged = all.map((p: any) => {
            const sourceOrder = selectedOrders.find(o => o.orderId === p.__orderId);
            const allOrderItemIds = (sourceOrder?.lineItems ?? []).map((li: any) => li?.id).filter(Boolean);

            // If package has no linkage, attach all order item ids
            const hasCamel = Array.isArray(p.orderLineItemIds) && p.orderLineItemIds.length > 0;
            const hasSnake = Array.isArray(p.order_line_item_ids) && p.order_line_item_ids.length > 0;
            const normalizedIds: string[] = hasCamel
                ? p.orderLineItemIds
                : hasSnake
                ? p.order_line_item_ids
                : allOrderItemIds;

            // Merge actual line item objects into package
            const items = (sourceOrder?.lineItems ?? []).filter((li: any) => {
                const key1 = li?.id;
                const key2 = li?.lineItemId;
                return normalizedIds?.includes(key1) || (key2 && normalizedIds?.includes(key2));
            });

            return {
                ...p,
                // Ensure a normalized IDs field is present for downstream use
                orderLineItemIds: normalizedIds,
                lineItems: items, // merged line items for UI (images/count)
            };
        });

        const seen = new Set<string>();
        const unique = merged.filter((p: any) => {
            const key = `${p.packageId || p.id || ''}:${p.__orderId || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).map((p: any) => ({
            ...p,
            __rowKey: `${p.__orderId}:${p.packageId || p.id || ''}`,
        }));

        setPackages(unique);
    }, [isOpen, selectedOrders]);

    // Initialize local rowsState from props data/pkg defaults when packages change
    useEffect(() => {
        if (!isOpen || packages.length === 0) return;
        setRowsState((prev) => {
            const next = { ...prev };
            for (const pkg of packages) {
                const key = pkg.__rowKey || getRowKey(pkg);
                if (!next[key]) {
                    next[key] = {
                        trackingId: (data[pkg.__orderId]?.trackingId ?? pkg?.trackingNumber ?? '') || '',
                        shippingProvider: (data[pkg.__orderId]?.shippingProvider ?? pkg?.shippingProviderId ?? '') || '',
                    };
                }
            }
            return next;
        });
    }, [isOpen, packages, data]);

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

    // Helper: commit a single row to parent state on blur (keeps parent in sync without lag)
    const commitRowToParent = (pkg: any) => {
        const key = pkg.__rowKey || getRowKey(pkg);
        const current = rowsState[key] || { trackingId: '', shippingProvider: '' };
        onChange(pkg.__orderId, 'trackingId', current.trackingId || '');
        onChange(pkg.__orderId, 'shippingProvider', current.shippingProvider || '');
    };

    // Helper: build payload per package without existing trackingNumber using local rowsState
    const buildPayload = () => {
        const rows: { orderId: string; shopId: string; packageId: string; trackingId: string; providerId: string }[] = [];
        for (const pkg of packages) {
            // Skip packages that already have trackingNumber (locked rows)
            if (pkg?.trackingNumber) continue;

            const key = pkg.__rowKey || getRowKey(pkg);
            const local = rowsState[key] || { trackingId: '', shippingProvider: '' };
            const trackingId = (local.trackingId || '').trim();
            const providerId = (local.shippingProvider || '').trim();
            const packageId = String(pkg.packageId || pkg.id || '');
            const orderId = String(pkg.__orderId || '');
            const shopId = String(pkg.__shopId || '');

            if (orderId && shopId && packageId && trackingId && providerId) {
                rows.push({ orderId, shopId, packageId, trackingId, providerId });
            }
        }
        return rows;
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            // Responsive width, constrained on large screens, fits on small screens
            className="w-[96vw] sm:w-[92vw] md:w-[90vw] lg:w-[80vw] xl:w-[70vw] max-h-[95vh] overflow-hidden"
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            {/* Dialog */}
            <div className="relative rounded-lg w-full max-h-[90vh] overflow-hidden shadow-xl bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                        Add Tracking Info ({selectedOrders.length} orders, {packages.length} packages)
                    </h2>
                </div>

                {/* Content wrapper: scroll within viewport */}
                <div className="p-4 sm:p-5 md:p-6 overflow-y-auto max-h-[calc(95vh-160px)]">
                    {/* Desktop/tablet view */}
                    <div className="hidden md:block">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Order ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Package ID
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
                                    {packages.map((pkg) => {
                                        const rowKey = pkg.__rowKey || getRowKey(pkg);
                                        const hadTracking = Boolean(pkg?.trackingNumber);
                                        const isCleared = clearedRows.has(rowKey);
                                        const isLocked = hadTracking && !isCleared;
                                        const local = rowsState[rowKey] || { trackingId: '', shippingProvider: '' };
                                        const images = getLineItemImages(pkg) || [];
                                        return (
                                            <tr key={rowKey} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {pkg.__orderId}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {pkg.packageId}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {(pkg.lineItems?.length || 0)} items
                                                        </span>
                                                        <div className="flex -space-x-1">
                                                            {images.slice(0, 3).map((item, i) => (
                                                                <Image
                                                                    key={`${rowKey}-${i}`}
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
                                                            {(pkg.lineItems?.length || 0) > 3 && (
                                                                <div className="w-6 h-6 rounded border border-gray-200 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                                        +{(pkg.lineItems?.length || 0) - 3}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="text"
                                                        value={local.trackingId}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setRowsState(s => ({ ...s, [rowKey]: { ...s[rowKey], trackingId: v } }));
                                                        }}
                                                        onBlur={() => commitRowToParent(pkg)}
                                                        placeholder="Enter tracking ID"
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white disabled:opacity-60"
                                                        disabled={isLocked}
                                                        autoComplete="off"
                                                        inputMode="text"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={local.shippingProvider}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setRowsState(s => ({ ...s, [rowKey]: { ...s[rowKey], shippingProvider: v } }));
                                                        }}
                                                        onBlur={() => commitRowToParent(pkg)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-60"
                                                        required
                                                        disabled={isLocked}
                                                    >
                                                        <option value=""></option>
                                                        {availableProviders.map((provider, index) => {
                                                            const providerName = typeof provider === 'string' ? provider : provider.name || provider.id;
                                                            const providerDisplayName = typeof provider === 'string' ? provider : provider.displayName || provider.name || provider.id;
                                                            const providerValueOpt = typeof provider === 'string' ? provider : (provider.id || provider.name || providerDisplayName);
                                                            return (
                                                                <option key={`${providerName}-${index}`} value={providerValueOpt}>
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

                    {/* Mobile view: cards */}
                    <div className="md:hidden space-y-4">
                        {packages.map((pkg) => {
                            const rowKey = pkg.__rowKey || getRowKey(pkg);
                            const hadTracking = Boolean(pkg?.trackingNumber);
                            const isCleared = clearedRows.has(rowKey);
                            const isLocked = hadTracking && !isCleared;
                            const local = rowsState[rowKey] || { trackingId: '', shippingProvider: '' };
                            const images = getLineItemImages(pkg) || [];
                            return (
                                <div key={rowKey} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white break-all">
                                            {pkg.__orderId}
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                            {(pkg.lineItems?.length || 0)} items
                                        </span>
                                    </div>
                                    <div className="flex -space-x-1 mb-3">
                                        {images.slice(0, 5).map((item, i) => (
                                            <Image
                                                key={`${rowKey}-${i}`}
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
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Tracking ID
                                            </label>
                                            <input
                                                type="text"
                                                value={local.trackingId}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setRowsState(s => ({ ...s, [rowKey]: { ...s[rowKey], trackingId: v } }));
                                                }}
                                                onBlur={() => commitRowToParent(pkg)}
                                                placeholder="Enter tracking ID"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white disabled:opacity-60"
                                                disabled={isLocked}
                                                autoComplete="off"
                                                inputMode="text"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Shipping Provider
                                            </label>
                                            <select
                                                value={local.shippingProvider}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setRowsState(s => ({ ...s, [rowKey]: { ...s[rowKey], shippingProvider: v } }));
                                                }}
                                                onBlur={() => commitRowToParent(pkg)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-60"
                                                required
                                                disabled={isLocked}
                                            >
                                                <option value=""></option>
                                                {availableProviders.map((provider, index) => {
                                                    const providerName = typeof provider === 'string' ? provider : provider.name || provider.id;
                                                    const providerDisplayName = typeof provider === 'string' ? provider : provider.displayName || provider.name || provider.id;
                                                    const providerValueOpt = typeof provider === 'string' ? provider : (provider.id || provider.name || providerDisplayName);
                                                    return (
                                                        <option key={`${providerName}-${index}`} value={providerValueOpt}>
                                                            {providerDisplayName}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 sm:p-5 md:p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onSave(buildPayload()); setPackages([]); setClearedRows(new Set()); }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                        Save Tracking Info
                    </button>
                </div>
            </div>
        </Modal>
    );
}