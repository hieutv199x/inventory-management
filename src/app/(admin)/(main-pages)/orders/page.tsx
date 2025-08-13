'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Search, RefreshCw, Eye, Package, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { httpClient } from '@/lib/http-client';

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
            const response = await httpClient.post('/tiktok/Orders/stored-orders', {
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
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={syncOrders}
                        disabled={syncing || !selectedShop}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                    >
                        {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Sync Orders
                    </button>
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
                                        <button className="text-blue-600 hover:text-blue-900 flex items-center">
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
        </div>
    );
}