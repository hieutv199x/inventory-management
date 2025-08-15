'use client';

import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    ShoppingCart, 
    Store, 
    Users, 
    DollarSign, 
    Package,
    AlertTriangle,
    Activity
} from 'lucide-react';
import { httpClient } from '@/lib/http-client';

interface DashboardStats {
    shopOverview: {
        totalShops: number;
        activeShops: number;
        inactiveShops: number;
        expiringTokens: number;
    };
    ordersPerformance: {
        totalOrders: number;
        avgOrderValue: number;
        completedOrders: number;
        pendingOrders: number;
        topShops: Array<{
            shopId: string;
            shopName: string;
            orderCount: number;
        }>;
    };
    revenue: {
        totalRevenue: number;
        totalPayments: number;
        totalWithdrawals: number;
        pendingPayments: number;
    };
}

const StatCard = ({ icon: Icon, title, value, change, changeType = 'positive' }: {
    icon: any;
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
}) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
                {change && (
                    <p className={`text-sm mt-1 ${
                        changeType === 'positive' ? 'text-green-600' : 
                        changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                        {change}
                    </p>
                )}
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icon className="h-6 w-6 text-blue-600" />
            </div>
        </div>
    </div>
);

const QuickActions = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
            <button className="p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <Package className="h-5 w-5 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">Sync Orders</p>
                <p className="text-sm text-gray-600">Update latest orders</p>
            </button>
            <button className="p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <Store className="h-5 w-5 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Sync Products</p>
                <p className="text-sm text-gray-600">Update inventory</p>
            </button>
            <button className="p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <DollarSign className="h-5 w-5 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">Sync Payments</p>
                <p className="text-sm text-gray-600">Update financial data</p>
            </button>
            <button className="p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <Users className="h-5 w-5 text-orange-600 mb-2" />
                <p className="font-medium text-gray-900">User Management</p>
                <p className="text-sm text-gray-600">Manage access</p>
            </button>
        </div>
    </div>
);

const AlertsPanel = ({ alerts }: { alerts: any[] }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
        <div className="space-y-3">
            {alerts.length === 0 ? (
                <p className="text-gray-500 text-sm">No alerts at this time</p>
            ) : (
                alerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<{ title: string; message: string }[]>([]);
    const [recentActivity, setRecentActivity] = useState<Array<{
        type: string;
        message: string;
        time: string;
        status: 'success' | 'info' | 'warning' | 'error';
    }>>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [shopOverview, ordersPerformance, revenue] = await Promise.all([
                httpClient.get('/dashboard/shop-overview'),
                httpClient.get('/dashboard/orders-performance?days=30'),
                httpClient.get('/dashboard/revenue?days=30')
            ]);

            setStats({
                shopOverview: shopOverview.overview,
                ordersPerformance: {
                    ...ordersPerformance.overview,
                    topShops: ordersPerformance.topShops || []
                },
                revenue: revenue.overview
            });

            // Set alerts based on data
            const newAlerts = [];
            if (shopOverview.overview.expiringTokens > 0) {
                newAlerts.push({
                    title: 'Token Expiring Soon',
                    message: `${shopOverview.overview.expiringTokens} shop tokens will expire within 7 days`
                });
            }
            
            if (revenue.overview.pendingPayments > 0) {
                newAlerts.push({
                    title: 'Pending Payments',
                    message: `${revenue.overview.pendingPayments} payments are still pending processing`
                });
            }

            if (ordersPerformance.overview.pendingOrders > 10) {
                newAlerts.push({
                    title: 'High Pending Orders',
                    message: `${ordersPerformance.overview.pendingOrders} orders are pending fulfillment`
                });
            }

            setAlerts(newAlerts);

            // Set recent activity based on real data
            const activities = [];
            
            if (ordersPerformance.overview.totalOrders > 0) {
                activities.push({
                    type: 'orders',
                    message: `${ordersPerformance.overview.completedOrders} orders completed successfully`,
                    time: 'Recently',
                    status: 'success' as const
                });
            }

            if (revenue.overview.totalPayments > 0) {
                activities.push({
                    type: 'payments',
                    message: `$${revenue.overview.totalRevenue.toLocaleString()} in total revenue processed`,
                    time: 'Last 30 days',
                    status: 'info' as const
                });
            }

            if (shopOverview.overview.activeShops > 0) {
                activities.push({
                    type: 'shops',
                    message: `${shopOverview.overview.activeShops} shops are currently active`,
                    time: 'Current',
                    status: 'success' as const
                });
            }

            if (ordersPerformance.overview.pendingOrders > 0) {
                activities.push({
                    type: 'pending',
                    message: `${ordersPerformance.overview.pendingOrders} orders need attention`,
                    time: 'Now',
                    status: 'warning' as const
                });
            }

            setRecentActivity(activities);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setAlerts([{
                title: 'Data Loading Error',
                message: 'Unable to fetch dashboard data. Please check your connection and try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const getActivityColor = (status: string) => {
        switch (status) {
            case 'success': return 'bg-green-500';
            case 'info': return 'bg-blue-500';
            case 'warning': return 'bg-yellow-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Overview of your TikTok Shop management system</p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={Store}
                    title="Active Shops"
                    value={stats?.shopOverview.activeShops || 0}
                    change={`${stats?.shopOverview.totalShops || 0} total shops`}
                    changeType="neutral"
                />
                <StatCard
                    icon={ShoppingCart}
                    title="Total Orders (30d)"
                    value={stats?.ordersPerformance.totalOrders.toLocaleString() || 0}
                    change={`${stats?.ordersPerformance.completedOrders || 0} completed`}
                    changeType="positive"
                />
                <StatCard
                    icon={DollarSign}
                    title="Total Revenue (30d)"
                    value={`$${(stats?.revenue.totalRevenue || 0).toLocaleString()}`}
                    change={`Avg: $${(stats?.ordersPerformance.avgOrderValue || 0).toFixed(2)}`}
                    changeType="positive"
                />
                <StatCard
                    icon={Activity}
                    title="System Health"
                    value={alerts.length === 0 ? "Excellent" : alerts.length === 1 ? "Good" : "Needs Attention"}
                    change={alerts.length > 0 ? `${alerts.length} alerts` : "No issues"}
                    changeType={alerts.length === 0 ? "positive" : alerts.length <= 2 ? "neutral" : "negative"}
                />
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={TrendingUp}
                    title="Pending Orders"
                    value={stats?.ordersPerformance.pendingOrders || 0}
                    change="Need fulfillment"
                    changeType="neutral"
                />
                <StatCard
                    icon={DollarSign}
                    title="Total Payments"
                    value={stats?.revenue.totalPayments || 0}
                    change="Last 30 days"
                    changeType="neutral"
                />
                <StatCard
                    icon={Package}
                    title="Withdrawals"
                    value={`$${(stats?.revenue.totalWithdrawals || 0).toLocaleString()}`}
                    change="Total withdrawn"
                    changeType="neutral"
                />
                <StatCard
                    icon={AlertTriangle}
                    title="Pending Payments"
                    value={stats?.revenue.pendingPayments || 0}
                    change="Need processing"
                    changeType={stats?.revenue.pendingPayments ? "negative" : "positive"}
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <QuickActions />
                </div>
                <div>
                    <AlertsPanel alerts={alerts} />
                </div>
            </div>

            {/* Charts and detailed views */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                            <p className="text-gray-500 text-sm">No recent activity</p>
                        ) : (
                            recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                    <div className={`w-2 h-2 ${getActivityColor(activity.status)} rounded-full`}></div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600">{activity.message}</p>
                                        <p className="text-xs text-gray-400">{activity.time}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Shops</h3>
                    <div className="space-y-4">
                        {stats?.ordersPerformance.topShops.length === 0 ? (
                            <p className="text-gray-500 text-sm">No data available</p>
                        ) : (
                            stats?.ordersPerformance.topShops.slice(0, 5).map((shop, index) => (
                                <div key={shop.shopId} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium text-blue-600">#{index + 1}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{shop.shopName}</p>
                                            <p className="text-xs text-gray-500">Shop ID: {shop.shopId}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{shop.orderCount.toLocaleString()} orders</span>
                                </div>
                            )) || []
                        )}
                    </div>
                    
                    {stats?.ordersPerformance.topShops.length === 0 && (
                        <div className="text-center py-8">
                            <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-sm text-gray-500">No shop performance data available yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview (Last 30 Days)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">${(stats?.revenue.totalRevenue || 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">${(stats?.revenue.totalWithdrawals || 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total Withdrawals</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                            ${((stats?.revenue.totalRevenue || 0) - (stats?.revenue.totalWithdrawals || 0)).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Net Balance</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
