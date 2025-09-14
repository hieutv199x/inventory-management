"use client";
import React from "react";
import { X, Package, MapPin, CreditCard, Truck, User, Calendar, ShoppingBag, Info, Copy, Check } from 'lucide-react';
import Image from "next/image";
import { Modal } from "../ui/modal";
import { format } from 'date-fns';
import { formatTikTokTimestamp } from '@/utils/datetime';

interface OrderDetailModalProps {
    order: any | null;
    isOpen: boolean;
    onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onClose }) => {
    const [copiedField, setCopiedField] = React.useState<string | null>(null);

    if (!isOpen || !order) return null;

    const formatTimestamp = (timestamp: number) => {
        return formatTikTokTimestamp(timestamp, { includeSeconds: true });
    };

    const formatCurrency = (amount: string, currency: string) => {
        return `${parseFloat(amount).toLocaleString()} ${currency}`;
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400';
            case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400';
            case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400';
        }
    };

    const parseChannelData = (channelData: string) => {
        try {
            return JSON.parse(channelData || '{}');
        } catch {
            return {};
        }
    };

    const orderChannelData = parseChannelData(order.channelData);
    const paymentChannelData = parseChannelData(order.payment?.channelData);
    const addressChannelData = parseChannelData(order.recipientAddress?.channelData);

    // NEW: build merged package -> items structure
    const safeParse = (raw: string | undefined) => {
        try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
    };

    const lineItemMap: Record<string, any> = {};
    (order.lineItems || []).forEach((li: any) => { lineItemMap[li.lineItemId] = li; });

    const cancelledLineItems: Record<string, any> = {};
    (orderChannelData.cancelledLineItems || []).forEach((ci: any) => { cancelledLineItems[ci.id] = ci; });

    const packagesWithItems = (order.packages || []).map((p: any) => {
        const parsed = safeParse(p.channelData);
        const pkgDetail = parsed.packageDetailApi || {};
        const lineIds: string[] = pkgDetail.orderLineItemIds || parsed.orderLineItemIds || [];
        const items = lineIds
            .map(id => {
                const li = lineItemMap[id];
                if (!li) return null;
                const itemChannelData = safeParse(li.channelData);
                const isCancelled = !!cancelledLineItems[li.lineItemId];
                return {
                    ...li,
                    mergedChannelData: {
                        ...itemChannelData,
                        packageStatus: itemChannelData.packageStatus || pkgDetail.packageStatus,
                        packageId: p.packageId || pkgDetail.packageId,
                        shippingType: pkgDetail.shippingType,
                        deliveryOptionName: pkgDetail.deliveryOptionName,
                        deliveryOptionId: pkgDetail.deliveryOptionId,
                        noteTag: pkgDetail.noteTag,
                        hasMultiSkus: pkgDetail.hasMultiSkus,
                        lastMileTrackingNumber: pkgDetail.lastMileTrackingNumber,
                    },
                    isCancelled,
                    cancelledInfo: cancelledLineItems[li.lineItemId]
                };
            })
            .filter(Boolean);

        // Group similar items within this package
        const itemGroups: Record<string, any> = {};
        items.forEach(item => {
            // Create grouping key based on item characteristics
            const groupKey = JSON.stringify({
                productId: item.productId,
                skuId: item.skuId,
                skuName: item.skuName,
                sellerSku: item.sellerSku,
                packageId: item.mergedChannelData.packageId,
                salePrice: item.salePrice,
                isCancelled: item.isCancelled
            });

            if (!itemGroups[groupKey]) {
                itemGroups[groupKey] = {
                    ...item,
                    count: 1,
                    lineItemIds: [item.lineItemId],
                    totalQuantity: parseInt(item.mergedChannelData.quantity || 1)
                };
            } else {
                itemGroups[groupKey].count += 1;
                itemGroups[groupKey].lineItemIds.push(item.lineItemId);
                itemGroups[groupKey].totalQuantity += parseInt(item.mergedChannelData.quantity || 1);
            }
        });

        const groupedItems = Object.values(itemGroups);

        return {
            packageId: p.packageId,
            packageStatus: pkgDetail.packageStatus,
            shippingType: pkgDetail.shippingType,
            deliveryOptionName: pkgDetail.deliveryOptionName,
            updateTime: pkgDetail.updateTime,
            noteTag: pkgDetail.noteTag,
            hasMultiSkus: pkgDetail.hasMultiSkus,
            lastMileTrackingNumber: pkgDetail.lastMileTrackingNumber,
            items: groupedItems
        };
    }).filter((pkg: { items: any[] }) => pkg.items.length > 0);

    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const formatCustomerInfo = () => {
        const customerInfo = [
            `${order.buyerEmail}`,
            `${orderChannelData.userId || 'N/A'}`,
            order.buyerMessage ? `${order.buyerMessage}` : ''
        ].filter(Boolean).join('\n');
        return customerInfo;
    };

    const formatDeliveryAddress = () => {
        const address = [
            `${addressChannelData.firstName} ${addressChannelData.lastName || order.recipientAddress?.name}`,
            `${order.recipientAddress?.phoneNumber}`,
            `${order.recipientAddress?.fullAddress}`,
        ].filter(line => !line.includes('undefined') && !line.endsWith(': ')).join('\n');
        return address;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[95vw] max-h-[95vh] overflow-hidden">
            <div className="flex flex-col max-h-[95vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Order Details
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Order ID: {order.orderId}
                        </p>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 min-h-0">
                    <div className="space-y-8">
                        {/* 1. Order Overview */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <ShoppingBag className="h-5 w-5 text-blue-600" />
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Order Overview</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Status</dt>
                                    <dd className="mt-2">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Custom Status</dt>
                                    <dd className="mt-2">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.customStatus === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400' : order.customStatus === 'START' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400'}`}>
                                            {order.customStatus || 'Not Set'}
                                        </span>
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Channel</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">{order.channel}</dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Type</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {orderChannelData.orderType || 'N/A'}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {formatTimestamp(order.createTime)}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {formatTimestamp(order.updateTime)}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Shop</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {order.shop?.shopName} ({order.shop?.shopId})
                                    </dd>
                                </div>
                                {orderChannelData.lastWebhookUpdate && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <dt className="text-sm font-medium text-blue-700 dark:text-blue-400">Last Webhook Update</dt>
                                        <dd className="mt-2 text-sm text-blue-800 dark:text-blue-300">
                                            {format(new Date(orderChannelData.lastWebhookUpdate), 'MMM dd, yyyy HH:mm:ss')}
                                        </dd>
                                        {orderChannelData.notificationId && (
                                            <dd className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                                ID: {orderChannelData.notificationId}
                                            </dd>
                                        )}
                                    </div>
                                )}
                                {/* Cancellation Information */}
                                {orderChannelData.cancellationId && (
                                    <div className="md:col-span-3 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <dt className="text-sm font-medium text-red-700 dark:text-red-400">Cancellation ID</dt>
                                                <dd className="mt-1 text-sm text-red-800 dark:text-red-300 font-mono">
                                                    {orderChannelData.cancellationId}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-red-700 dark:text-red-400">Cancellation Status</dt>
                                                <dd className="mt-1">
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400">
                                                        {orderChannelData.cancellationStatus}
                                                    </span>
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-red-700 dark:text-red-400">Cancelled By</dt>
                                                <dd className="mt-1 text-sm text-red-800 dark:text-red-300">
                                                    {orderChannelData.cancelUser || 'N/A'}
                                                </dd>
                                            </div>
                                            {orderChannelData.cancelReason && (
                                                <div className="md:col-span-3">
                                                    <dt className="text-sm font-medium text-red-700 dark:text-red-400">Cancellation Reason</dt>
                                                    <dd className="mt-1 text-sm text-red-800 dark:text-red-300">
                                                        {orderChannelData.cancelReason}
                                                    </dd>
                                                </div>
                                            )}
                                            {orderChannelData.cancelTime && (
                                                <div>
                                                    <dt className="text-sm font-medium text-red-700 dark:text-red-400">Cancelled At</dt>
                                                    <dd className="mt-1 text-sm text-red-800 dark:text-red-300">
                                                        {formatTimestamp(orderChannelData.cancelTime)}
                                                    </dd>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Delivery Address */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-purple-600" />
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Delivery Address</h4>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(formatDeliveryAddress(), 'address')}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                                    title="Copy delivery address"
                                >
                                    {copiedField === 'address' ? (
                                        <>
                                            <Check className="h-3 w-3" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3 w-3" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Recipient</dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {addressChannelData.firstName} {addressChannelData.lastName || order.recipientAddress?.name}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {order.recipientAddress?.phoneNumber}
                                        </dd>
                                    </div>
                                    <div className="md:col-span-2">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Address</dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {order.recipientAddress?.fullAddress}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Postal Code</dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {order.recipientAddress?.postalCode}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Region</dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {addressChannelData.regionCode}
                                        </dd>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6. Shipping Information */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Truck className="h-5 w-5 text-indigo-600" />
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Shipping Information</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Shipping Provider</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {orderChannelData.shippingProvider || 'N/A'}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivery Option</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {orderChannelData.deliveryOptionName || 'N/A'}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tracking Number</dt>
                                    <dd className="mt-2 text-sm font-mono text-gray-900 dark:text-white">
                                        {orderChannelData.trackingNumber || 'N/A'}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivery Time</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {order.deliveryTime ? formatTimestamp(order.deliveryTime) : 'N/A'}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fulfillment Type</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {orderChannelData.fulfillmentType || 'N/A'}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Collection Time</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {orderChannelData.collectionTime ? formatTimestamp(orderChannelData.collectionTime) : 'N/A'}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        {/* 4. Product Items */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="h-5 w-5 text-orange-600" />
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Order Items</h4>
                            </div>

                            {/* NEW grouped by package rendering */}
                            {packagesWithItems.length === 0 && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    No package-linked items. (Showing raw items)
                                </div>
                            )}

                            {packagesWithItems.map((pkg: {
                                packageId: string;
                                packageStatus?: string;
                                shippingType?: string;
                                deliveryOptionName?: string;
                                updateTime?: number;
                                noteTag?: string;
                                hasMultiSkus?: boolean;
                                lastMileTrackingNumber?: string;
                                items: any[];
                            }) => (
                                <div key={pkg.packageId} className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                                            Package: {pkg.packageId}
                                        </span>
                                        {pkg.packageStatus && (
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                                {pkg.packageStatus}
                                            </span>
                                        )}
                                        {pkg.shippingType && (
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Shipping: {pkg.shippingType}
                                            </span>
                                        )}
                                        {pkg.deliveryOptionName && (
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Delivery Option: {pkg.deliveryOptionName}
                                            </span>
                                        )}
                                        {pkg.noteTag && (
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Note: {pkg.noteTag}
                                            </span>
                                        )}
                                        {pkg.lastMileTrackingNumber && (
                                            <span className="text-gray-600 dark:text-gray-400">
                                                LM Tracking: {pkg.lastMileTrackingNumber || '—'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-4 space-y-4">
                                        {pkg.items.map((item: any) => {
                                            const itemChannelData = item.mergedChannelData;
                                            const isCancelled = item.isCancelled;
                                            const cancelledInfo = item.cancelledInfo;
                                            const displayStatus = itemChannelData.displayStatus || itemChannelData.packageStatus;
                                            const getStatusColor = (status: string) => {
                                                switch ((status || '').toLowerCase()) {
                                                    case 'awaiting_shipment': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-400';
                                                    case 'to_fulfill': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400';
                                                    case 'in_transit': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-400';
                                                    case 'delivered': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-400';
                                                    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400';
                                                    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400';
                                                    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400';
                                                }
                                            };
                                            const formatCurrency = (amount: string, currency: string) =>
                                                `${parseFloat(amount || '0').toLocaleString()} ${currency}`;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`border rounded-lg p-4 transition ${
                                                        isCancelled
                                                            ? 'border-red-200 dark:border-red-600 bg-red-50 dark:bg-red-900/10'
                                                            : 'border-gray-200 dark:border-gray-600'
                                                    }`}
                                                >
                                                    {isCancelled && (
                                                        <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                                            <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
                                                                <X className="h-4 w-4" />
                                                                <span className="font-medium">Item Cancelled</span>
                                                                {cancelledInfo?.cancel_quantity && (
                                                                    <span>({cancelledInfo.cancel_quantity} units)</span>
                                                                )}
                                                            </div>
                                                            {cancelledInfo?.cancel_reason && (
                                                                <div className="mt-1 text-xs text-red-700 dark:text-red-400">
                                                                    Reason: {cancelledInfo.cancel_reason}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                                        <div>
                                                            <div className="aspect-square w-full max-w-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                                                {itemChannelData.skuImage ? (
                                                                    <Image
                                                                        src={itemChannelData.skuImage}
                                                                        alt={item.productName}
                                                                        width={128}
                                                                        height={128}
                                                                        className="w-full h-full object-cover"
                                                                        unoptimized
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Package className="h-8 w-8 text-gray-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="lg:col-span-2">
                                                            <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                                                {item.productName}
                                                                {item.count && item.count > 1 && (
                                                                    <span className="px-3 py-1.5 bg-orange-500 text-white rounded-full text-sm font-bold shadow-lg">
                                                                        ×{item.count}
                                                                    </span>
                                                                )}
                                                            </h5>
                                                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                                <p>Product ID: {item.productId}</p>
                                                                <p>Line Item ID: {item.lineItemIds ? item.lineItemIds.join(', ') : item.lineItemId}</p>
                                                                <p>SKU ID: {item.skuId}</p>
                                                                <p>SKU Name: {item.skuName}</p>
                                                                <p>Seller SKU: {item.sellerSku}</p>
                                                                <p>Quantity: {item.totalQuantity || itemChannelData.quantity || 1}</p>
                                                                <p>Package ID: {itemChannelData.packageId}</p>
                                                                {itemChannelData.trackingNumber && (
                                                                    <p>Tracking: {itemChannelData.trackingNumber}</p>
                                                                )}
                                                                <div>
                                                                    <span
                                                                        className={`inline-flex px-2 py-1 mt-1 text-xs font-semibold rounded-full ${getStatusColor(displayStatus)}`}>
                                                                        {displayStatus || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="space-y-2">
                                                                {item.originalPrice && (
                                                                    <div>
                                                                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Original Price</dt>
                                                                        <dd className="text-sm text-gray-500 line-through">
                                                                            {formatCurrency(item.originalPrice, item.currency)}
                                                                        </dd>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Sale Price</dt>
                                                                    <dd className="text-lg font-semibold text-green-600">
                                                                        {formatCurrency(item.salePrice, item.currency)}
                                                                    </dd>
                                                                </div>
                                                                {(itemChannelData.sellerDiscount || itemChannelData.platformDiscount) && (
                                                                    <div>
                                                                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Discounts</dt>
                                                                        <dd className="text-xs text-gray-600 dark:text-gray-400">
                                                                            Seller: {formatCurrency(itemChannelData.sellerDiscount || '0', item.currency)}<br />
                                                                            Platform: {formatCurrency(itemChannelData.platformDiscount || '0', item.currency)}
                                                                        </dd>
                                                                    </div>
                                                                )}
                                                                {itemChannelData.isGift && (
                                                                    <div className="text-xs text-purple-600 dark:text-purple-400">
                                                                        🎁 Gift Item
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Fallback: if no packages, render original flat list */}
                            {packagesWithItems.length === 0 && (
                                <div className="space-y-4">
                                    {/* original flat mapping (shortened) */}
                                    {order.lineItems?.map((item: any) => (
                                        <div key={item.id} className="border rounded-lg p-4">
                                            {/* ...existing code for single item (omitted for brevity)... */}
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {item.productName}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Customer Information */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-green-600" />
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Information</h4>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(formatCustomerInfo(), 'customer')}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                                    title="Copy customer information"
                                >
                                    {copiedField === 'customer' ? (
                                        <>
                                            <Check className="h-3 w-3" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3 w-3" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Buyer Email</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white break-all">{order.buyerEmail}</dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {orderChannelData.userId || 'N/A'}
                                    </dd>
                                </div>
                                {order.buyerMessage && (
                                    <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Buyer Message</dt>
                                        <dd className="mt-2 text-sm text-gray-900 dark:text-white">{order.buyerMessage}</dd>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Enhanced Payment Information with TikTok Price Details */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Information</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {orderChannelData.paymentMethodName || 'N/A'}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Paid Time</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {order.paidTime ? formatTimestamp(order.paidTime) : 'N/A'}
                                    </dd>
                                </div>
                                
                                {/* Traditional payment fields */}
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subtotal</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(order.payment?.subTotal || '0', order.currency)}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Original Product Price</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(paymentChannelData.originalTotalProductPrice || '0', order.currency)}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Shipping Fee</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(paymentChannelData.shippingFee || '0', order.currency)}
                                        {paymentChannelData.originalShippingFee && paymentChannelData.originalShippingFee !== paymentChannelData.shippingFee && (
                                            <span className="text-xs text-gray-500 line-through ml-2">
                                                {formatCurrency(paymentChannelData.originalShippingFee, order.currency)}
                                            </span>
                                        )}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tax</dt>
                                    <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(order.payment?.tax || '0', order.currency)}
                                    </dd>
                                </div>
                                
                                <div className="md:col-span-2 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <dt className="text-sm font-medium text-green-700 dark:text-green-400">Database Total</dt>
                                            <dd className="mt-1 text-lg font-bold text-green-800 dark:text-green-300">
                                                {formatCurrency(order.payment?.totalAmount || '0', order.currency)}
                                            </dd>
                                        </div>
                                        {orderChannelData.priceDetails && (
                                            <div className="text-right">
                                                <dt className="text-sm font-medium text-green-700 dark:text-green-400">TikTok Total</dt>
                                                <dd className="mt-1 text-lg font-bold text-green-800 dark:text-green-300">
                                                    {formatCurrency(orderChannelData.priceDetails.payment || orderChannelData.priceDetails.total || '0', orderChannelData.priceDetails.currency)}
                                                </dd>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default OrderDetailModal;
