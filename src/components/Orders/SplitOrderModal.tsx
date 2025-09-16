'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2, Shuffle, AlertTriangle, Package, ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Modal } from '../ui/modal';

interface OrderLineItem {
    id: string;
    productId: string;
    productName: string;
    skuId: string;
    skuName?: string;
    sellerSku?: string;
    salePrice: string;
    originalPrice?: string;
    currency: string;
    channelData?: string;
    lineItemId?: string;
}

interface Order {
    orderId: string;
    lineItems: OrderLineItem[];
}

interface Group {
    id: string;
    name: string;
    itemIds: string[];
}

interface SplitOrderModalProps {
    isOpen: boolean;
    order: Order | null;
    onClose: () => void;
    // Updated: now expects wrapped payload with splittable_groups
    onSubmit: (data: { splittable_groups: { id: string; order_line_item_ids: string[] }[] }) => Promise<void> | void;
}

const SplitOrderModal: React.FC<SplitOrderModalProps> = ({ isOpen, order, onClose, onSubmit }) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [touched, setTouched] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Helper: generate next incremental numeric id as string (TikTok API expects simple numeric IDs, not UUID)
    const getNextGroupId = (current: Group[]) => {
        const nums = current
            .map(g => parseInt(g.id, 10))
            .filter(n => !isNaN(n));
        const next = nums.length ? Math.max(...nums) + 1 : 1;
        return String(next);
    };

    // Helper to get canonical line item key (TikTok uses lineItemId)
    const getItemKey = (item: OrderLineItem) => item.lineItemId || item.id;

    useEffect(() => {
        if (isOpen && order) {
            // Initialize with two numeric groups instead of UUIDs
            setGroups([
                { id: '1', name: 'Package 1', itemIds: [] },
                { id: '2', name: 'Package 2', itemIds: [] }
            ]);
            setTouched(false);
        }
    }, [isOpen, order]);

    const parseChannelData = (data?: string) => {
        try { return JSON.parse(data || '{}'); } catch { return {}; }
    };

    // CHANGED: include fallback to id (if lineItemId absent)
    const allItemIds = useMemo(
        () => order?.lineItems.map(i => getItemKey(i)) || [],
        [order]
    );

    const assignedItemIds = useMemo(
        () => groups.flatMap(g => g.itemIds),
        [groups]
    );

    // CHANGED: filter using canonical key
    const unassignedItems = useMemo(
        () => (order?.lineItems || []).filter(i => !assignedItemIds.includes(getItemKey(i))),
        [order, assignedItemIds]
    );

    const addGroup = () => {
        setGroups(prev => {
            const newId = getNextGroupId(prev);
            return [...prev, { id: newId, name: `Package ${prev.length + 1}`, itemIds: [] }];
        });
    };

    const removeGroup = (id: string) => {
        setGroups(prev => {
            const target = prev.find(g => g.id === id);
            if (target && target.itemIds.length > 0) return prev; // cannot remove non-empty
            return prev.filter(g => g.id !== id);
        });
    };

    const renameGroup = (id: string, name: string) => {
        setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g));
    };

    const assignItem = (itemKey: string, groupId: string) => {
        setGroups(prev => {
            const cleared = prev.map(g => ({ ...g, itemIds: g.itemIds.filter(id => id !== itemKey) }));
            return cleared.map(g => g.id === groupId ? { ...g, itemIds: [...g.itemIds, itemKey] } : g);
        });
        setTouched(true);
    };

    const unassignItem = (itemKey: string) => {
        setGroups(prev => prev.map(g => ({ ...g, itemIds: g.itemIds.filter(id => id !== itemKey) })));
        setTouched(true);
    };

    const moveItem = (itemKey: string, direction: 'left' | 'right') => {
        const idx = groups.findIndex(g => g.itemIds.includes(itemKey));
        if (idx === -1) return;
        const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= groups.length) return;
        setGroups(prev => prev.map((g, i) => {
            if (i === idx) return { ...g, itemIds: g.itemIds.filter(id => id !== itemKey) };
            if (i === targetIdx) return { ...g, itemIds: [...g.itemIds, itemKey] };
            return g;
        }));
    };

    // CHANGED: distribute with canonical keys
    const autoDistribute = () => {
        if (!order) return;
        const items = [...order.lineItems];
        const activeGroups = groups.length || 1;
        const newGroups = groups.map(g => ({ ...g, itemIds: [] as string[] }));
        items.forEach((item, idx) => {
            const gIndex = idx % activeGroups;
            newGroups[gIndex].itemIds.push(getItemKey(item));
        });
        setGroups(newGroups);
        setTouched(true);
    };

    const clearAssignments = () => {
        setGroups(prev => prev.map(g => ({ ...g, itemIds: [] })));
        setTouched(true);
    };

    const allItemsAssigned = assignedItemIds.length === allItemIds.length && allItemIds.length > 0;
    const everyGroupHasItem = groups.length > 0 && groups.every(g => g.itemIds.length > 0);
    const canSubmit = allItemsAssigned && everyGroupHasItem && !submitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            const payload = {
                splittable_groups: groups.map(g => ({
                    id: /^\d+$/.test(g.id) ? g.id : String(groups.indexOf(g) + 1),
                    order_line_item_ids: g.itemIds // already canonical keys
                }))
            };
            await onSubmit(payload);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !order) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[45vw] max-h-[95vh] overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-xl flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Split Order #{order.orderId}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Assign each item to a package. All items must be assigned and each package must contain at least one item.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Unassigned Items */}
                    <div className="md:w-1/3 border-r dark:border-gray-800 flex flex-col">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                Unassigned Items
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                    {unassignedItems.length}
                                </span>
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={autoDistribute}
                                    className="text-sm inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    <Shuffle className="h-3 w-3" /> Auto
                                </button>
                                <button
                                    onClick={addGroup}
                                    className="text-sm inline-flex items-center gap-1 px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                                >
                                    <Plus className="h-3 w-3" /> Group
                                </button>
                            </div>
                        </div>
                        <div className="px-4 pb-3">
                            <button
                                onClick={clearAssignments}
                                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                            >
                                Clear all assignments
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto px-4 pb-4 space-y-3">
                            {unassignedItems.length === 0 && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    All items assigned
                                </div>
                            )}
                            {unassignedItems.map(item => {
                                const cd = parseChannelData(item.channelData);
                                const key = getItemKey(item);
                                return (
                                    <div
                                        key={key}
                                        className="flex items-center gap-3 p-2 rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                    >
                                        <div className="w-12 h-12 flex-shrink-0 bg-white dark:bg-gray-900 rounded overflow-hidden border dark:border-gray-700 flex items-center justify-center">
                                            {cd.skuImage ? (
                                                <Image
                                                    src={cd.skuImage}
                                                    alt={item.productName}
                                                    width={48}
                                                    height={48}
                                                    className="object-cover w-full h-full"
                                                    unoptimized
                                                />
                                            ) : (
                                                <Package className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                                                {item.productName}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {item.skuName || item.sellerSku || item.skuId}
                                            </p>
                                        </div>
                                        <select
                                            className="text-sm border rounded px-1 py-1 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                                            onChange={(e) => assignItem(key, e.target.value)}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Assign</option>
                                            {groups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Groups */}
                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        {groups.length === 0 && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                No groups. Add one using the Group button.
                            </div>
                        )}
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {groups.map((group, idx) => {
                                // CHANGED: match by canonical key
                                const items = (order?.lineItems || []).filter(i =>
                                    group.itemIds.includes(getItemKey(i))
                                );
                                return (
                                    <div key={group.id} className="border dark:border-gray-700 rounded-lg flex flex-col bg-white dark:bg-gray-800">
                                        {/* ...existing group header... */}
                                        <div className="px-3 py-2 flex items-center justify-between border-b dark:border-gray-700">
                                            <input
                                                value={group.name}
                                                onChange={(e) => renameGroup(group.id, e.target.value)}
                                                className="text-xs font-medium bg-transparent focus:outline-none dark:text-gray-100"
                                            />
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                    {items.length}
                                                </span>
                                                {items.length === 0 && groups.length > 1 && (
                                                    <button
                                                        onClick={() => removeGroup(group.id)}
                                                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                                                        title="Remove empty group"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-3 space-y-2 max-h-64 overflow-auto">
                                            {items.length === 0 && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                                    No items
                                                </div>
                                            )}
                                            {items.map(item => {
                                                const cd = parseChannelData(item.channelData);
                                                const key = getItemKey(item);
                                                return (
                                                    <div
                                                        key={key}
                                                        className="group flex items-center gap-3 p-2 rounded border dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                                                    >
                                                        {/* ...existing item display... */}
                                                        <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-white dark:bg-gray-800 border dark:border-gray-700 flex items-center justify-center">
                                                            {cd.skuImage ? (
                                                                <Image
                                                                    src={cd.skuImage}
                                                                    alt={item.productName}
                                                                    width={40}
                                                                    height={40}
                                                                    className="object-cover w-full h-full"
                                                                    unoptimized
                                                                />
                                                            ) : (
                                                                <Package className="h-4 w-4 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                                                                {item.productName}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {item.skuName || item.sellerSku || item.skuId}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                                            <button
                                                                onClick={() => moveItem(key, 'left')}
                                                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                                                disabled={idx === 0}
                                                                title="Move to previous group"
                                                            >
                                                                <ArrowLeft className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => moveItem(key, 'right')}
                                                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                                                disabled={idx === groups.length - 1}
                                                                title="Move to next group"
                                                            >
                                                                <ArrowRight className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => unassignItem(key)}
                                                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                                                title="Unassign"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer / Validation */}
                <div className="border-t dark:border-gray-700 px-5 py-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div className="flex flex-col gap-1 text-sm">
                        {!allItemsAssigned && (
                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Assign all items to a group.
                            </div>
                        )}
                        {allItemsAssigned && !everyGroupHasItem && (
                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Every package must contain at least one item.
                            </div>
                        )}
                        {canSubmit && (
                            <div className="text-green-600 dark:text-green-400">
                                All good. Ready to split.
                            </div>
                        )}
                        {touched && !canSubmit && (
                            <div className="text-gray-500 dark:text-gray-400">
                                Progress: {assignedItemIds.length}/{allItemIds.length} items assigned.
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Splitting...' : 'Confirm Split'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default SplitOrderModal;
