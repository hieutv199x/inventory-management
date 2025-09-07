"use client";
import React from "react";
import { X, Package, MapPin, CreditCard, Truck, User, Calendar, ShoppingBag, Info, Copy, Check } from 'lucide-react';
import Image from "next/image";
import { Modal } from "../ui/modal";
import { format } from 'date-fns';

interface OrderDetailModalProps {
    order: any | null;
    isOpen: boolean;
    onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onClose }) => {
    const [copiedField, setCopiedField] = React.useState<string | null>(null);

    if (!isOpen || !order) return null;

    const formatTimestamp = (timestamp: number) => {
        return format(new Date(timestamp * 1000), 'MMM dd, yyyy HH:mm:ss');
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
            `Buyer Email: ${order.buyerEmail}`,
            `User ID: ${orderChannelData.userId || 'N/A'}`,
            order.buyerMessage ? `Buyer Message: ${order.buyerMessage}` : ''
        ].filter(Boolean).join('\n');
        return customerInfo;
    };

    const formatDeliveryAddress = () => {
        const address = [
            `Recipient: ${addressChannelData.firstName} ${addressChannelData.lastName || order.recipientAddress?.name}`,
            `Phone: ${order.recipientAddress?.phoneNumber}`,
            `Address: ${order.recipientAddress?.fullAddress}`,
            `Postal Code: ${order.recipientAddress?.postalCode}`,
            `Region: ${addressChannelData.regionCode}`
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
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-6 w-6" />
                    </button>
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
                            </div>
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

                        {/* 4. Product Items */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="h-5 w-5 text-orange-600" />
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Order Items</h4>
                            </div>
                            <div className="space-y-4">
                                {order.lineItems?.map((item: any) => {
                                    const itemChannelData = parseChannelData(item.channelData);
                                    return (
                                        <div key={item.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                                {/* Product Image */}
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

                                                {/* Product Details */}
                                                <div className="lg:col-span-2">
                                                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                                        {item.productName}
                                                    </h5>
                                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                        <p>Product ID: {item.productId}</p>
                                                        <p>SKU ID: {item.skuId}</p>
                                                        <p>SKU Name: {item.skuName}</p>
                                                        <p>Seller SKU: {item.sellerSku}</p>
                                                        <p>Quantity: {itemChannelData.quantity}</p>
                                                        <p>Package ID: {itemChannelData.packageId}</p>
                                                        {itemChannelData.trackingNumber && (
                                                            <p>Tracking: {itemChannelData.trackingNumber}</p>
                                                        )}
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(itemChannelData.displayStatus || 'unknown')}`}>
                                                            {itemChannelData.displayStatus || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Pricing */}
                                                <div>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Original Price</dt>
                                                            <dd className="text-sm text-gray-500 line-through">
                                                                {formatCurrency(item.originalPrice, item.currency)}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Sale Price</dt>
                                                            <dd className="text-lg font-semibold text-green-600">
                                                                {formatCurrency(item.salePrice, item.currency)}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Discount</dt>
                                                            <dd className="text-xs text-red-600 dark:text-red-400">
                                                                -{formatCurrency(itemChannelData.totalDiscount || '0', item.currency)}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Discounts</dt>
                                                            <dd className="text-xs text-gray-600 dark:text-gray-400">
                                                                Seller: {formatCurrency(itemChannelData.sellerDiscount || '0', item.currency)}<br/>
                                                                Platform: {formatCurrency(itemChannelData.platformDiscount || '0', item.currency)}
                                                            </dd>
                                                        </div>
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

                        {/* 5. Payment Information */}
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
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Discounts</dt>
                                    <dd className="mt-2 text-sm text-red-600 dark:text-red-400">
                                        -{formatCurrency(paymentChannelData.totalDiscountAmount || '0', order.currency)}
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
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <dt className="text-sm font-medium text-green-700 dark:text-green-400">Total Amount</dt>
                                    <dd className="mt-2 text-lg font-bold text-green-800 dark:text-green-300">
                                        {formatCurrency(order.payment?.totalAmount || '0', order.currency)}
                                    </dd>
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
