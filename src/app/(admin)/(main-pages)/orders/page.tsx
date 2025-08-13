'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Search, RefreshCw, Eye, Package, Calendar, User, X, MapPin, CreditCard, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { httpClient } from '@/lib/http-client';
import { Modal } from '@/components/ui/modal';

interface Order {
    id: string;
    orderId: string;
    buyerEmail: string;
    status: string;
    createTime: number;
    updateTime?: number;
    totalAmount?: string;
    currency?: string;
    trackingNumber?: string;
    lineItems: LineItem[];
    payment?: Payment;
    recipientAddress?: RecipientAddress;
    shop: {
        shopName?: string;
        shopId: string;
    };
}

interface LineItem {
    id: string;
    productName: string;
    skuName?: string;
    salePrice: string;
    currency: string;
    displayStatus?: string;
}

interface Payment {
    currency: string;
    totalAmount?: string;
    subTotal?: string;
}

interface RecipientAddress {
    name?: string;
    phoneNumber?: string;
    fullAddress?: string;
}

interface Shop {
    id: string;
    shopId: string;
    shopName?: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedShop, setSelectedShop] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
    });

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    useEffect(() => {
        fetchShops();
        fetchOrders();
    }, []);

    const fetchShops = async () => {
        try {
            const response = await httpClient.get('/tiktok/shop/get-shops?status=ACTIVE');
            setShops(response.credentials || []);
        } catch (error) {
            console.error('Error fetching shops:', error);
        }
    };

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        try {
            const response = await httpClient.post('/orders', {
                shopId: selectedShop,
                status: selectedStatus,
                createTimeGe: dateFrom ? Math.floor(new Date(dateFrom).getTime() / 1000) : undefined,
                createTimeLt: dateTo ? Math.floor(new Date(dateTo).getTime() / 1000) : undefined,
                page,
                pageSize: pagination.pageSize,
            });

            setOrders(response.orders || []);
            setPagination(response.pagination || { total: 0, page: 1, pageSize: 20, totalPages: 0 });
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const syncOrders = async () => {
        if (!selectedShop) {
            alert('Please select a shop to sync orders');
            return;
        }

        setSyncing(true);
        try {
            const response = await httpClient.post('/tiktok/Orders/get-order-list', {
                shop_id: selectedShop,
                sync: true,
                filters: {
                    createTimeGe: dateFrom ? Math.floor(new Date(dateFrom).getTime() / 1000) : undefined,
                    createTimeLt: dateTo ? Math.floor(new Date(dateTo).getTime() / 1000) : undefined,
                },
                page_size: 50,
            });

            alert('Orders synced successfully');
            fetchOrders();
        } catch (error) {
            console.error('Error syncing orders:', error);
            alert('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchOrders(1);
    };

    const formatTimestamp = (timestamp: number) => {
        return format(new Date(timestamp * 1000), 'MMM dd, yyyy HH:mm');
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'processing': return 'bg-yellow-100 text-yellow-800';
            case 'shipped': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const openOrderModal = (order: Order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    const closeOrderModal = () => {
        setSelectedOrder(null);
        setShowOrderModal(false);
    };

    // Filter orders based on search term
    const filteredOrders = orders.filter(order => 
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.buyerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.recipientAddress?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.lineItems.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
                <p className="text-gray-600">Manage and sync TikTok orders</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <Package className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-2xl font-semibold text-gray-900">{pagination.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <Calendar className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Completed</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {orders.filter(o => o.status.toLowerCase() === 'completed').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <RefreshCw className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Processing</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {orders.filter(o => o.status.toLowerCase() === 'processing').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <User className="h-8 w-8 text-red-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Cancelled</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {orders.filter(o => o.status.toLowerCase() === 'cancelled').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shop</label>
                        <select
                            value={selectedShop}
                            onChange={(e) => setSelectedShop(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Shops</option>
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.shopId}>
                                    {shop.shopName || shop.shopId}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                            type="datetime-local"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                            type="datetime-local"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div></div> {/* Spacer for alignment */}
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span className="ml-2">Search</span>
                        </button>
                        <button
                        onClick={syncOrders}
                        disabled={syncing || !selectedShop}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                    >
                        {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Sync Orders
                    </button>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-mono text-sm font-medium text-gray-900">
                                            {order.orderId}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {order.shop.shopName || order.shop.shopId}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {order.recipientAddress?.name || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500 truncate max-w-32">
                                            {order.buyerEmail}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {order.lineItems.slice(0, 1).map((item) => (
                                                <div key={item.id} className="truncate max-w-48">
                                                    {item.productName}
                                                </div>
                                            ))}
                                            {order.lineItems.length > 1 && (
                                                <div className="text-xs text-gray-500">
                                                    +{order.lineItems.length - 1} more item(s)
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {order.payment?.totalAmount ? 
                                                `${parseInt(order.payment.totalAmount).toLocaleString()} ${order.payment.currency}` : 
                                                'N/A'
                                            }
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatTimestamp(order.createTime)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                        <div className="truncate max-w-24">
                                            {order.trackingNumber || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button 
                                            onClick={() => openOrderModal(order)}
                                            className="text-blue-600 hover:text-blue-900 flex items-center"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => fetchOrders(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => fetchOrders(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{((pagination.page - 1) * pagination.pageSize) + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> of{' '}
                                <span className="font-medium">{pagination.total}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => fetchOrders(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => fetchOrders(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Detail Modal */}
            {showOrderModal && selectedOrder && (
                <Modal isOpen={showOrderModal} onClose={closeOrderModal} className="max-w-4xl max-h-[80vh] overflow-hidden">
                    <div className="flex flex-col h-full">
                        {/* Modal Header - Fixed */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Order Details - {selectedOrder.orderId}
                            </h3>
                            <button
                                onClick={closeOrderModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Order Status Badge */}
                            <div className="mb-6">
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                                    {selectedOrder.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Order Information */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-gray-900 flex items-center">
                                        <Package className="h-5 w-5 mr-2" />
                                        Order Information
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Order ID:</span>
                                            <span className="text-sm font-mono font-medium">{selectedOrder.orderId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Shop:</span>
                                            <span className="text-sm">{selectedOrder.shop.shopName || selectedOrder.shop.shopId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Created:</span>
                                            <span className="text-sm">{formatTimestamp(selectedOrder.createTime)}</span>
                                        </div>
                                        {selectedOrder.updateTime && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Updated:</span>
                                                <span className="text-sm">{formatTimestamp(selectedOrder.updateTime)}</span>
                                            </div>
                                        )}
                                        {selectedOrder.trackingNumber && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Tracking:</span>
                                                <span className="text-sm font-mono">{selectedOrder.trackingNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Customer Information */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-gray-900 flex items-center">
                                        <User className="h-5 w-5 mr-2" />
                                        Customer Information
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Name:</span>
                                            <span className="text-sm">{selectedOrder.recipientAddress?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Email:</span>
                                            <span className="text-sm">{selectedOrder.buyerEmail}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Phone:</span>
                                            <span className="text-sm">{selectedOrder.recipientAddress?.phoneNumber || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Address */}
                            {selectedOrder.recipientAddress && (
                                <div className="mt-6">
                                    <h4 className="text-md font-semibold text-gray-900 flex items-center mb-4">
                                        <MapPin className="h-5 w-5 mr-2" />
                                        Delivery Address
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-800">{selectedOrder.recipientAddress.fullAddress}</p>
                                    </div>
                                </div>
                            )}

                            {/* Payment Information */}
                            {selectedOrder.payment && (
                                <div className="mt-6">
                                    <h4 className="text-md font-semibold text-gray-900 flex items-center mb-4">
                                        <CreditCard className="h-5 w-5 mr-2" />
                                        Payment Information
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Subtotal:</span>
                                            <span className="text-sm">{selectedOrder.payment.subTotal ? `${parseInt(selectedOrder.payment.subTotal).toLocaleString()} ${selectedOrder.payment.currency}` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                            <span className="text-sm text-gray-900">Total Amount:</span>
                                            <span className="text-sm text-gray-900">{selectedOrder.payment.totalAmount ? `${parseInt(selectedOrder.payment.totalAmount).toLocaleString()} ${selectedOrder.payment.currency}` : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order Items */}
                            <div className="mt-6">
                                <h4 className="text-md font-semibold text-gray-900 flex items-center mb-4">
                                    <Truck className="h-5 w-5 mr-2" />
                                    Order Items ({selectedOrder.lineItems.length})
                                </h4>
                                <div className="space-y-3">
                                    {selectedOrder.lineItems.map((item) => (
                                        <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h5 className="text-sm font-medium text-gray-900">{item.productName}</h5>
                                                    {item.skuName && (
                                                        <p className="text-xs text-gray-600 mt-1">SKU: {item.skuName}</p>
                                                    )}
                                                    {item.displayStatus && (
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${getStatusColor(item.displayStatus)}`}>
                                                            {item.displayStatus}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {parseInt(item.salePrice).toLocaleString()} {item.currency}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer - Fixed */}
                        <div className="border-t px-6 py-3 flex justify-end">
                            <button
                                onClick={closeOrderModal}
                                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}