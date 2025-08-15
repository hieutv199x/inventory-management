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
    lineItemsCount?: number;
}

interface LineItem {
    id: string;
    productId: string;
    productName: string;
    skuId: string;
    skuName?: string;
    sellerSku?: string;
    salePrice: string;
    originalPrice?: string;
    currency: string;
    displayStatus?: string;
    skuImage?: string; // Added skuImage field
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
                fields: 'orderId,buyerEmail,status,createTime,trackingNumber,payment.totalAmount,payment.currency,recipientAddress.name,recipientAddress.phoneNumber,shop.shopName,shop.shopId,lineItemsCount' // Only necessary fields
            });

            setOrders(response.orders || []);
            setPagination(response.pagination || { total: 0, page: 1, pageSize: 20, totalPages: 0 });
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetail = async (orderId: string) => {
        try {
            const response = await httpClient.get(`/orders/${orderId}`);
            return response.order;
        } catch (error) {
            console.error('Error fetching order detail:', error);
            throw error;
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
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400';
            case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400';
            case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400';
        }
    };

    const openOrderModal = async (order: Order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
        
        try {
            // Fetch detailed order information
            const detailedOrder = await fetchOrderDetail(order.orderId);
            setSelectedOrder(detailedOrder);
        } catch (error) {
            console.error('Failed to load order details:', error);
            alert('Failed to load order details');
            closeOrderModal();
        }
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
        <div>
            {/* Header */}
            <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
                <div className="w-full">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Orders Management</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage and sync TikTok orders</p>
                    </div>
                </div>
                <div className="flex items-start w-full gap-3 sm:justify-end">
                    <div className="flex items-center gap-2">
                        <button
                        onClick={syncOrders}
                        disabled={syncing}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center hover:shadow-lg transition duration-200"
                    >
                        {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Sync Orders
                    </button>
                    </div>
                </div>
                
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center">
                        <Package className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">{pagination.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center">
                        <Calendar className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">
                                {orders.filter(o => o.status.toLowerCase() === 'completed').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center">
                        <RefreshCw className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">
                                {orders.filter(o => o.status.toLowerCase() === 'processing').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center">
                        <User className="h-8 w-8 text-red-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancelled</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">
                                {orders.filter(o => o.status.toLowerCase() === 'cancelled').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">Search</label>
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">Shop</label>
                        <select
                            value={selectedShop}
                            onChange={(e) => setSelectedShop(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">Status</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                            <option value="">All Status</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">From Date</label>
                        <input
                            type="datetime-local"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">To Date</label>
                        <input
                            type="datetime-local"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="flex items-end">
                        <div></div> {/* Spacer for alignment */}
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white px-3 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center hover:shadow-lg transition duration-200"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span className="ml-2">Search</span>
                        </button>
                        
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account/Seller</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:border-gray-800 dark:bg-white/[0.03]">
                            {filteredOrders.map((order, index) => (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    {/* ID - Mã thứ tự của sản phẩm */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-400">
                                            #{((pagination.page - 1) * pagination.pageSize) + index + 1}
                                        </div>
                                    </td>

                                    {/* Account/Seller - Thông tin tên shop, seller vận hành */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-400">
                                                {order.shop.shopName || 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Shop ID: {order.shop.shopId}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Order - Mã đơn hàng tiktok, thời gian đặt hàng, trạng thái đơn hàng */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col space-y-1">
                                            <div className="font-mono text-sm font-medium text-gray-900 dark:text-gray-400">
                                                {order.orderId}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                {formatTimestamp(order.createTime)}
                                            </div>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Order Info - Thông tin nhận hàng và thanh toán của khách hàng */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col space-y-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-400">
                                                {order.recipientAddress?.name || 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate max-w-48 dark:text-gray-400">
                                                {order.recipientAddress?.phoneNumber || 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate max-w-48 dark:text-gray-400">
                                                {order.buyerEmail}
                                            </div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400">
                                                {order.lineItemsCount || order.lineItems?.length || 0} item(s)
                                            </div>
                                        </div>
                                    </td>

                                    {/* Price - Các chi phí của đơn hàng */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col space-y-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-400">
                                                {order.payment?.totalAmount ? 
                                                    `${parseInt(order.payment.totalAmount).toLocaleString()} ${order.payment.currency}` : 
                                                    'N/A'
                                                }
                                            </div>
                                            {order.payment?.subTotal && (
                                                <div className="text-xs text-gray-500 font-mono">
                                                    Subtotal: {parseInt(order.payment.subTotal).toLocaleString()} {order.payment.currency}
                                                </div>
                                            )}
                                            {order.trackingNumber && (
                                                <div className="text-xs font-mono text-blue-600 truncate max-w-48">
                                                    Track: {order.trackingNumber}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Actions - Chat trò chuyện (support) khách hàng */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col space-y-2">
                                            <button 
                                                onClick={() => openOrderModal(order)}
                                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-900 border border-blue-300 rounded hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-700"
                                            >
                                                <Eye className="h-3 w-3 mr-1" />
                                                View Details
                                            </button>
                                            <button 
                                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 hover:text-green-900 border border-green-300 rounded hover:bg-green-50 dark:border-green-800 dark:bg-green-900 dark:text-green-400 dark:hover:bg-green-700"
                                                onClick={() => {
                                                    // TODO: Implement customer support chat
                                                    alert('Customer support chat feature will be implemented');
                                                }}
                                            >
                                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                Chat Support
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => fetchOrders(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => fetchOrders(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-400">
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
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-gray-700"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => fetchOrders(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-gray-700"
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
                <Modal isOpen={showOrderModal} onClose={closeOrderModal} className="max-w-6xl max-h-[90vh] overflow-hidden">
                    <div className="flex flex-col max-h-[90vh]">
                        {/* Modal Header - Fixed */}
                        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Order Details - {selectedOrder?.orderId}
                            </h3>
                            <button
                                onClick={closeOrderModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 min-h-0">
                            {/* (1) Thông tin chung */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">1. Thông tin chung</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* ID */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-md font-semibold text-gray-900 mb-2">ID</h4>
                                        <p className="text-sm text-gray-800">
                                            #{orders.findIndex(o => o.id === selectedOrder?.id) + 1}
                                        </p>
                                    </div>

                                    {/* Account/Seller */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-md font-semibold text-gray-900 mb-2">Account/Seller</h4>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-800">{selectedOrder?.shop.shopName || 'N/A'}</p>
                                            <p className="text-xs text-gray-600">Shop ID: {selectedOrder?.shop.shopId}</p>
                                        </div>
                                    </div>

                                    {/* Order */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-md font-semibold text-gray-900 mb-2">Order</h4>
                                        <div className="space-y-1">
                                            <p className="text-sm font-mono text-gray-800">{selectedOrder?.orderId}</p>
                                            <p className="text-xs text-gray-600">{formatTimestamp(selectedOrder?.createTime)}</p>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder?.status)}`}>
                                                {selectedOrder?.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Info */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-md font-semibold text-gray-900 mb-2">Order Info</h4>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-800">{selectedOrder?.recipientAddress?.name || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">{selectedOrder?.recipientAddress?.phoneNumber || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">{selectedOrder?.buyerEmail}</p>
                                            <p className="text-xs text-blue-600">{selectedOrder?.lineItems?.length} item(s)</p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-md font-semibold text-gray-900 mb-2">Price</h4>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedOrder?.payment?.totalAmount ? 
                                                    `${parseInt(selectedOrder?.payment.totalAmount).toLocaleString()} ${selectedOrder?.payment.currency}` : 
                                                    'N/A'
                                                }
                                            </p>
                                            {selectedOrder?.payment?.subTotal && (
                                                <p className="text-xs text-gray-600">
                                                    Subtotal: {parseInt(selectedOrder?.payment.subTotal).toLocaleString()} {selectedOrder?.payment.currency}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-md font-semibold text-gray-900 mb-2">Actions</h4>
                                        <button 
                                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-900 border border-green-300 rounded hover:bg-green-50"
                                            onClick={() => {
                                                // TODO: Implement customer support chat
                                                alert('Customer support chat feature will be implemented');
                                            }}
                                        >
                                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            Chat Support
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* (2) Thông tin sản phẩm */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">2. Thông tin sản phẩm</h2>
                                <div className="space-y-6">
                                    {selectedOrder?.lineItems?.map((item) => (
                                        <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Left column */}
                                                <div className="space-y-4">
                                                    {/* Image */}
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <h4 className="text-md font-semibold text-gray-900 mb-2">Image</h4>
                                                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                                            {item.skuImage ? (
                                                                <img 
                                                                    src={item.skuImage} 
                                                                    alt={item.productName}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <Package className={`h-8 w-8 text-gray-400 ${item.skuImage ? 'hidden' : ''}`} />
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2">Ảnh dùng cho Get Label</p>
                                                    </div>
                                                </div>

                                                {/* Right column */}
                                                <div className="space-y-4">
                                                    {/* Product Details */}
                                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Seller SKU:</span>
                                                            <span className="text-sm text-gray-800">{item.sellerSku || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Product name:</span>
                                                            <span className="text-sm text-gray-800">{item.productName}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">TikTokshop SKU:</span>
                                                            <span className="text-sm text-gray-800">{item.skuId}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Variant SKU:</span>
                                                            <span className="text-sm text-gray-800">{item.skuName || 'N/A'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Variant Details */}
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <h4 className="text-md font-semibold text-gray-900 mb-2">Variant Details</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-gray-600">Màu sắc (Color):</span>
                                                                <span className="text-sm text-gray-800">N/A</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-gray-600">Kiểu dáng (Type):</span>
                                                                <span className="text-sm text-gray-800">N/A</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-gray-600">Kích thước (Size):</span>
                                                                <span className="text-sm text-gray-800">N/A</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-gray-600">Số lượng (Quantity):</span>
                                                                <span className="text-sm text-gray-800">1</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Pricing */}
                                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Original Price:</span>
                                                            <span className="text-sm text-gray-800">{item.originalPrice ? `${parseInt(item.originalPrice).toLocaleString()} ${item.currency}` : 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Sale Price:</span>
                                                            <span className="text-sm font-semibold text-green-600">{parseInt(item.salePrice).toLocaleString()} {item.currency}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* (3) Thông tin fulfill */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">3. Thông tin fulfill</h2>
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-700">Fulfill service:</span>
                                                <span className="text-sm text-gray-800">N/A</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-700">Mã đơn fulfill:</span>
                                                <span className="text-sm text-gray-800">N/A</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-700">Tracking number:</span>
                                                <span className="text-sm font-mono text-gray-800">{selectedOrder?.trackingNumber || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-700">Tracking URL:</span>
                                                <span className="text-sm text-blue-600">
                                                    {selectedOrder?.trackingNumber ? (
                                                        <a href="#" className="hover:underline">View Tracking</a>
                                                    ) : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-700">Nhân viên fulfill:</span>
                                                <span className="text-sm text-gray-800">N/A</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-700">Trạng thái đẩy sang fulfill lúc:</span>
                                                <span className="text-sm text-gray-800">N/A</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">Cập nhật:</span>
                                                <button className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600">
                                                    Update Fulfill
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Address (Additional Info) */}
                            {selectedOrder?.recipientAddress && (
                                <div className="mb-6">
                                    <h4 className="text-md font-semibold text-gray-900 flex items-center mb-4">
                                        <MapPin className="h-5 w-5 mr-2" />
                                        Delivery Address
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-800">{selectedOrder?.recipientAddress.fullAddress}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer - Fixed */}
                        <div className="border-t px-6 py-3 flex justify-end flex-shrink-0">
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