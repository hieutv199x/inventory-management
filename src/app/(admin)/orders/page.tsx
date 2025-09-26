'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, RefreshCw, Eye, Package, Calendar, User, X, MapPin, CreditCard, Truck, Copy, Check, Plus, Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { httpClient } from '@/lib/http-client';
import { useLoading } from '@/context/loadingContext';
import OrderDetailModal from '@/components/Orders/OrderDetailModal';
import ShopSelector from '@/components/ui/ShopSelector';
import { formatCurrency } from "@/utils/common/functionFormat";
import { formatTikTokTimestamp } from '@/utils/datetime';
import TimezoneInfo from '@/components/ui/TimezoneInfo';
import AddTrackingModal from '@/components/Orders/AddTrackingModal';
import SyncOrderModal from '@/components/Orders/SyncOrderModal';
import SplitOrderModal from '@/components/Orders/SplitOrderModal';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';
import ImportOrdersModal from '@/components/Orders/ImportOrdersModal';
import BulkTrackingModal from '@/components/Orders/BulkTrackingModal';

interface Order {
    id: string;
    orderId: string;
    buyerEmail: string;
    status: string;
    customStatus?: string; // Added customStatus field
    createTime: number;
    updateTime?: number;
    totalAmount?: string;
    currency?: string;
    trackingNumber?: string;
    lineItems: LineItem[];
    payment?: Payment;
    recipientAddress?: RecipientAddress;
    unsettledTransactions?: { // Added unsettledTransactions field
        id: string;
        estSettlementAmount: string;
    }[];
    channelData?: string; // Added channelData field
    shop: {
        shopName?: string;
        shopId: string;
        managedName?: string;
    };
    packages?: { // Added packages field
        packageId: string;
        trackingNumber: string;
        shippingProviderId?: string;
        shippingProviderName?: string;
    }[],
    shopId: string;
    lineItemsCount?: number;
    canSplitPackages?: boolean; // Added canSplitPackages field
    mustSplitPackages?: boolean; // Added mustSplitPackages field
    // SLA / deadline fields (optional on some channels)
    cancelOrderSlaTime?: number;
    ttsSlaTime?: number;
    rtsSlaTime?: number;
    deliverySlaTime?: number;
    deliveryDueTime?: number;
    collectionDueTime?: number;
    shippingDueTime?: number;
    fastDispatchSlaTime?: number;
    pickUpCutOffTime?: number;
    deliveryOptionRequiredDeliveryTime?: number;
    // Milestone / event timestamps
    cancelTime?: number;
    requestCancelTime?: number;
    rtsTime?: number;
    collectionTime?: number;
    releaseDate?: number;
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
    channelData?: string; // Added channelData field
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
    postalCode?: string;
}

interface Shop {
    id: string;
    shopId: string;
    shopName?: string;
}

interface PaginationInfo {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export default function OrdersPage() {
    const { t } = useLanguage();
    const { showLoading, hideLoading } = useLoading();

    const [orders, setOrders] = useState<Order[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [needSearch, setNeedSearch] = useState(false);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [syncingDetail, setSyncingDetail] = useState<string | null>(null);

    // Helper function to get date with timezone offset
    const getDateWithTimezone = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000; // Convert to milliseconds
        const localTime = new Date(date.getTime() - offset);
        return localTime.toISOString().slice(0, 16);
    };

    // Updated filter and search states with default date range using browser timezone
    const [filters, setFilters] = useState({
        shopId: '',
        status: '',
        customStatus: '', // Added customStatus filter
        dateFrom: getDateWithTimezone(new Date(Date.now() - 24 * 60 * 60 * 1000)), // 1 day ago
        dateTo: getDateWithTimezone(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 1 day from now
        keyword: '',
    });

    // Add separate search state
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Updated pagination state - now managed by server
    const [pageSize, setPageSize] = useState<number>(100);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [copiedCustomer, setCopiedCustomer] = useState<string | null>(null);
    const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
    const [selectedOrderForSplit, setSelectedOrderForSplit] = useState<Order | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    // New states for bulk tracking
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [showBulkTrackingModal, setShowBulkTrackingModal] = useState(false);
    const [bulkTrackingData, setBulkTrackingData] = useState<{[key: string]: {trackingId: string, shippingProvider: string, receiptId: string}}>({});

    // New alert filter state
    const [alertFilter, setAlertFilter] = useState<string>('');

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            // Check if there are selected orders, if so export only selected ones
            let exportData;
            
            if (selectedOrderIds.size > 0) {
                // Export only selected orders
                exportData = {
                    selectedOrderIds: Array.from(selectedOrderIds)
                };
            } else {
                // If no orders selected, show message to user
                toast.error('Please select orders to export');
                setIsExporting(false);
                return;
            }

            const response = await fetch('/api/orders/export-excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(exportData)
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            // Handle file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `order_packages_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Export completed successfully!');
        } catch (error: any) {
            console.error('Export error:', error);
            toast.error(error.message || 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    // Checkbox handlers
    const handleSelectOrder = (orderId: string) => {
        const newSelected = new Set(selectedOrderIds);
        if (newSelected.has(orderId)) {
            newSelected.delete(orderId);
        } else {
            newSelected.add(orderId);
        }
        setSelectedOrderIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedOrderIds.size === orders.length) {
            setSelectedOrderIds(new Set());
        } else {
            setSelectedOrderIds(new Set(orders.map(order => order.id)));
        }
    };

    const handleOpenBulkTrackingModal = () => {
        // Initialize bulk tracking data for selected orders
        const initialData: {[key: string]: {trackingId: string, shippingProvider: string, receiptId: string}} = {};
        selectedOrderIds.forEach(orderId => {
            initialData[orderId] = {
                trackingId: '',
                shippingProvider: '',
                receiptId: ''
            };
        });
        setBulkTrackingData(initialData);
        setShowBulkTrackingModal(true);
    };

    const handleBulkTrackingChange = (orderId: string, field: 'trackingId' | 'shippingProvider' | 'receiptId', value: string) => {
        setBulkTrackingData(prev => ({
            ...prev,
            [orderId]: {
                ...prev[orderId],
                [field]: value
            }
        }));
    };

    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const fetchOrders = useCallback(
        async (options?: {
            keyword?: string;
            page?: number;
            pageSize?: number;
            loadingMessage?: string;
            isSearch?: boolean;
        }) => {
            const {
                keyword,
                page,
                pageSize: overridePageSize,
                loadingMessage = t('orders.loading_orders'),
                isSearch = false
            } = options || {};

            const effectivePage = page ?? currentPage;
            const effectivePageSize = overridePageSize ?? pageSize;
            const effectiveKeyword = keyword !== undefined ? keyword : filters.keyword;

            if (isSearch) setIsSearching(true);
            showLoading(loadingMessage);

            try {
                const params = new URLSearchParams();
                params.append('page', effectivePage.toString());
                params.append('pageSize', effectivePageSize.toString());
                if (filters.shopId) params.append('shopId', filters.shopId);
                if (filters.status) params.append('status', filters.status);
                if (filters.customStatus) params.append('customStatus', filters.customStatus);
                if (filters.keyword || options?.keyword) params.append('keyword', (options?.keyword || filters.keyword));
                if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
                if (filters.dateTo) params.append('dateTo', filters.dateTo);
                if (alertFilter) params.append('alert', alertFilter);

                const response = await httpClient.get(`/orders?${params.toString()}`);
                setOrders(response.orders || []);
                setPagination(response.pagination || {
                    currentPage: effectivePage,
                    pageSize: effectivePageSize,
                    totalItems: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                });
            } catch (error) {
                console.error('Error fetching orders:', error);
                if (options?.isSearch) setOrders([]);
            } finally {
                hideLoading();
                if (isSearch) setIsSearching(false);
            }
        },
        [filters, currentPage, pageSize, showLoading, hideLoading, alertFilter]
    );

    // New: validate and update selected import file
    const handleImportFileChange = (file: File | null) => {
        if (file && !/\.(xlsx|xls)$/i.test(file.name)) {
            toast.error('Please upload Excel file (.xlsx or .xls)');
            setImportFile(null);
            return;
        }
        setImportFile(file);
    };

    const handleImportExcel = async () => {
        if (!importFile) {
            toast.error('Please select an Excel file');
            return;
        }

        setIsImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', importFile);

            // Upload to mapping API (no DB writes here; API may push to TikTok)
            const response = await httpClient.postFormData('/orders/import-excel', formData);

            if (response.success) {
                const { totalRows, mapped, errors, errorDetails, bulk } = response.data || {};
                const bulkSummary = bulk?.summary;
                const bulkErrors = Array.isArray(bulk?.errors) ? bulk.errors : [];

                let message = `Import completed!\n`;
                message += `Total rows: ${totalRows ?? 0}\n`;
                message += `Mapped: ${mapped ?? 0}\n`;
                if (bulkSummary) {
                    message += `Pushed to TikTok - Succeeded: ${bulkSummary.succeeded ?? 0}, Failed: ${bulkSummary.failed ?? 0}\n`;
                }

                if ((errors ?? 0) > 0 || bulkErrors.length > 0) {
                    if (errorDetails && errorDetails.length > 0) {
                        message += `\nFirst ${Math.min(errorDetails.length, 5)} errors:\n`;
                        message += errorDetails.slice(0, 5).join('\n');
                    }
                    if (bulkErrors.length > 0) {
                        message += `\nTikTok errors (first ${Math.min(bulkErrors.length, 5)}):\n`;
                        message += bulkErrors.slice(0, 5).map((e: any) => {
                            const pkg = e?.packageId ? `pkg ${e.packageId}` : 'pkg -';
                            const code = e?.code ? `[${e.code}]` : '';
                            return `${pkg} ${code} ${e?.message || 'Unknown error'}`;
                        }).join('\n');
                    }
                    toast.error(message);
                } else {
                    toast.success(message);
                }
            } else {
                toast.error(response.error || 'Import failed');
            }
        } catch (error: any) {
            console.error('Import error:', error);
            toast.error(error?.message || 'Import failed');
        } finally {
            // Always close modal and clear file
            setShowImportModal(false);
            setImportFile(null);
            setIsImporting(false);
        }
    };

    const downloadTemplate = () => {
        const link = document.createElement('a');
        link.href = '/templates/order_import_template.xlsx';
        link.download = 'order_import_template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadSample = () => {
        const link = document.createElement('a');
        link.href = '/templates/sample_order_import.xlsx';
        link.download = 'sample_order_import.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Updated handleSearch to delegate to fetchOrders
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        // Update state first
        setFilters(prev => ({ ...prev, keyword: searchKeyword }));
        setCurrentPage(1);
        setSelectedOrderIds(new Set()); // Clear selected orders on new search
        // Call unified fetch
        await fetchOrders({
            keyword: searchKeyword,
            page: 1,
            pageSize,
            loadingMessage: t('orders.searching_orders'),
            isSearch: true
        });
        await fetchStatusCounts();
    };

    useEffect(() => {
        fetchOrders(); // initial load
        fetchStatusCounts();
        fetchAlertCounts();
    }, []); // intentionally empty (fetchOrders uses latest refs internally)

    // Consolidate all fetchOrders triggers into a single useEffect
    useEffect(() => {
        if (needSearch) {
            fetchOrders();
            fetchStatusCounts();
            setNeedSearch(false);
        }
    }, [currentPage, needSearch, fetchOrders]); // This will trigger when any of these change

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
            setNeedSearch(true);
        }
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
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

    const syncOrders = async (shopId: string, dateFrom?: string, dateTo?: string) => {
        showLoading(t('orders.syncing_orders'));
        setSyncing(true);
        try {
            const response = await httpClient.post('/tiktok/Orders/get-order-list', {
                shop_id: shopId,
                sync: true,
                filters: {
                    createTimeGe: dateFrom ? Math.floor(new Date(dateFrom).getTime() / 1000) : undefined,
                    createTimeLt: dateTo ? Math.floor(new Date(dateTo).getTime() / 1000) : undefined,
                },
                page_size: 50,
            });

            toast.success(t('orders.sync_success'));
            await fetchOrders();
            await fetchStatusCounts();
        } catch (error) {
            console.error('Error syncing orders:', error);
            toast.error(t('orders.sync_failed'));
        } finally {
            hideLoading();
            setSyncing(false);
        }
    };

    const syncUnsettledTransactions = async () => {
        if (!filters?.shopId) {
            toast.error(t('orders.select_shop_sync_unsettled'));
            return;
        }
        showLoading(t('orders.syncing_unsettled_transactions'));
        try {
            const response = await httpClient.post('/tiktok/Finance/sync-unsettled-transactions', {
                shop_id: filters.shopId,
                search_time_ge: filters.dateFrom ? Math.floor(new Date(filters.dateFrom).getTime() / 1000) : undefined,
                search_time_lt: filters.dateTo ? Math.floor(new Date(filters.dateTo).getTime() / 1000) : undefined,
                page_size: 50,
            });

            alert(t('orders.unsettled_sync_success'));
            // This will trigger fetchOrders through the useEffect
            setFilters(prev => ({ ...prev })); // Force re-render to trigger useEffect
        } catch (error) {
            console.error('Error syncing unsettled transactions:', error);
            toast.error(t('orders.sync_failed'));
        } finally {
            hideLoading();
        }
    };

    const openOrderModal = async (order: Order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);

        try {
            showLoading(t('orders.loading_order_details'));
            // Fetch detailed order information
            const detailedOrder = await fetchOrderDetail(order.orderId);
            setSelectedOrder(detailedOrder);
        } catch (error) {
            console.error('Failed to load order details:', error);
            toast.error(t('orders.load_detail_failed'));
            closeOrderModal();
        } finally {
            hideLoading();
        }
    };

    const closeOrderModal = () => {
        setSelectedOrder(null);
        setShowOrderModal(false);
    };

    const formatTimestamp = (timestamp: number) => {
        return formatTikTokTimestamp(timestamp, { includeSeconds: false });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'unpaid': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400';
            case 'on_hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400';
            case 'awaiting_shipment': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-400';
            case 'partially_shipping': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400';
            case 'awaiting_collection': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-400';
            case 'in_transit': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-400';
            case 'delivered': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-400';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400';
            case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400';
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

    // Helper to format epoch seconds to UI and relative delta
    const formatEpoch = (ts?: number) => ts ? formatTikTokTimestamp(ts, { includeSeconds: false }) : '—';
    const formatRelative = (ts?: number) => {
        if (!ts) return '';
        const now = Math.floor(Date.now() / 1000);
        const diff = ts - now; // seconds
        const abs = Math.abs(diff);
        const units: [number, string][] = [
            [86400, 'd'],
            [3600, 'h'],
            [60, 'm'],
            [1, 's']
        ];
        for (const [sec, label] of units) {
            if (abs >= sec) {
                const val = Math.floor(abs / sec);
                return diff >= 0 ? `in ${val}${label}` : `${val}${label} ago`;
            }
        }
        return diff >= 0 ? 'soon' : 'just now';
    };

    interface SlaItem { key: string; label: string; value?: number; type: 'deadline' | 'event'; }
    const buildSlaItems = (order: Order): SlaItem[] => {
        // Fallback to channelData if some fields missing
        const cd = parseChannelData(order.channelData ?? '');
        const pick = (field: keyof Order, snake?: string): number | undefined => {
            const direct = (order as any)[field];
            if (direct) return direct;
            if (snake && typeof cd === 'object' && cd && cd[snake] && typeof cd[snake] === 'number') return cd[snake];
            return undefined;
        };
        return [
            { key: 'shippingDueTime', label: 'Ship Due', value: pick('shippingDueTime', 'shipping_due_time'), type: 'deadline' as const },
            { key: 'collectionDueTime', label: 'Collection Due', value: pick('collectionDueTime', 'collection_due_time'), type: 'deadline' as const },
            { key: 'deliveryDueTime', label: 'Delivery Due', value: pick('deliveryDueTime', 'delivery_due_time'), type: 'deadline' as const },
            { key: 'cancelOrderSlaTime', label: 'Cancel SLA', value: pick('cancelOrderSlaTime', 'cancel_order_sla_time'), type: 'deadline' as const },
            { key: 'ttsSlaTime', label: 'TTS SLA', value: pick('ttsSlaTime', 'tts_sla_time'), type: 'deadline' as const },
            { key: 'rtsSlaTime', label: 'RTS SLA', value: pick('rtsSlaTime', 'rts_sla_time'), type: 'deadline' as const },
            { key: 'deliverySlaTime', label: 'Delivery SLA', value: pick('deliverySlaTime', 'delivery_sla_time'), type: 'deadline' as const },
            { key: 'fastDispatchSlaTime', label: 'Fast Dispatch', value: pick('fastDispatchSlaTime', 'fast_dispatch_sla_time'), type: 'deadline' as const },
            { key: 'pickUpCutOffTime', label: 'Pickup Cutoff', value: pick('pickUpCutOffTime', 'pick_up_cut_off_time'), type: 'deadline' as const },
            { key: 'deliveryOptionRequiredDeliveryTime', label: 'Req. Delivery', value: pick('deliveryOptionRequiredDeliveryTime', 'delivery_option_required_delivery_time'), type: 'deadline' as const },
            // Events
            { key: 'rtsTime', label: 'RTS At', value: pick('rtsTime', 'rts_time'), type: 'event' as const },
            { key: 'collectionTime', label: 'Collected At', value: pick('collectionTime', 'collection_time'), type: 'event' as const },
            { key: 'cancelTime', label: 'Cancelled At', value: pick('cancelTime', 'cancel_time'), type: 'event' as const },
            { key: 'requestCancelTime', label: 'Req. Cancel At', value: pick('requestCancelTime', 'request_cancel_time'), type: 'event' as const },
            { key: 'releaseDate', label: 'Release Date', value: pick('releaseDate', 'release_date'), type: 'event' as const },
        ].filter(i => !!i.value);
    };
    const classifyDeadline = (ts?: number) => {
        if (!ts) return 'text-gray-400';
        const now = Math.floor(Date.now() / 1000);
        const diff = ts - now;
        if (diff < 0) return 'text-red-600';
        if (diff < 86400) return 'text-orange-600';
        return 'text-green-600';
    };

    const getLineItemImages = (order: Order) => {
        return order.lineItems?.map(item => {
            const itemChannelData = parseChannelData(item.channelData ?? '');
            return {
                image: itemChannelData.skuImage,
                productName: item.productName,
                id: item.id
            };
        }).filter(item => item.image) || [];
    };

    // Filter orders based on search term
    const filteredOrders = orders.filter(order =>
        order.orderId.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        order.buyerEmail.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        (order.recipientAddress?.name || '').toLowerCase().includes(filters.keyword.toLowerCase()) ||
        order.lineItems.some(item => item.productName.toLowerCase().includes(filters.keyword.toLowerCase()))
    );

    const formatCustomerInfo = (order: Order) => {
        const address = order.recipientAddress;
        if (!address) return 'N/A';
        
        // Parse fullAddress to separate street address from city/state/country
        const fullAddress = address.fullAddress || '';
        const addressParts = fullAddress.split(',').map(part => part.trim());
        
        let streetAddress = '';
        let cityStateCountry = '';
        
        if (addressParts.length >= 3) {
            // Gộp 2 phần đầu: số nhà/tên đường + thành phố đầu tiên
            streetAddress = addressParts.slice(0, 2).join(', ');
            // Phần còn lại: vùng/tỉnh/quốc gia
            cityStateCountry = addressParts.slice(2).join(', ');
        } else if (addressParts.length === 2) {
            // Nếu chỉ có 2 phần thì tách như cũ
            streetAddress = addressParts[0];
            cityStateCountry = addressParts[1];
        } else {
            streetAddress = fullAddress;
        }
        
        const customerInfo = [
            `${address.name || 'N/A'}`,
            `${address.phoneNumber || 'N/A'}`,
            `${streetAddress || 'N/A'}`,
            `${cityStateCountry || 'N/A'}`,
            `${address.postalCode || 'N/A'}`,
        ].filter(line => line && line !== 'N/A').join('\n');
        
        return customerInfo;
    };

    const copyCustomerInfo = async (order: Order) => {
        try {
            const customerInfo = formatCustomerInfo(order);
            await navigator.clipboard.writeText(customerInfo);
            setCopiedCustomer(order.orderId);
            setTimeout(() => setCopiedCustomer(null), 2000);
        } catch (err) {
            console.error('Failed to copy customer info: ', err);
        }
    };

    const copyOrderId = async (orderId: string) => {
        try {
            await navigator.clipboard.writeText(orderId);
            setCopiedOrderId(orderId);
            setTimeout(() => setCopiedOrderId(null), 2000);
        } catch (err) {
            console.error('Failed to copy order ID: ', err);
        }
    };

    const updateCustomStatus = async (orderId: string, customStatus: string) => {
        try {
            setUpdatingStatus(orderId);
            await httpClient.patch(`/orders/${orderId}/custom-status`, { customStatus });

            // Update local state
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.orderId === orderId
                        ? { ...order, customStatus }
                        : order
                )
            );
        } catch (error) {
            console.error('Error updating custom status:', error);
            toast.error('Failed to update custom status');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleAddTracking = (order: Order) => {
        setSelectedOrderForTracking(order);
        setShowTrackingModal(true);
    };

    const handleSaveTracking = async (trackingNumber: string, shippingProviderId: string, packageId?: string) => {
        if (!selectedOrderForTracking) return;

        try {
            const res = await httpClient.post(`/tiktok/Fulfillment/add-tracking`, {
                orderId: selectedOrderForTracking.orderId,
                trackingNumber,
                shippingProviderId,
                packageId: packageId || ""
            });

            fetchOrders();
            fetchStatusCounts();
            toast.success(res);
        } catch (error) {
            console.error('Error adding tracking information:', error);
            toast.error('Failed to add tracking information');
            throw error; // Re-throw to handle in modal
        }
    };

    // (duplicate function block removed)

    // Backend-driven status counts (exclude keyword to avoid counting non-persisted search results)
    const ALERT_DEFS = [
        // key maps to property returned from /api/orders/alert
        { key: 'countShipingWithin24', labelKey: 'orders.alert.ship_within_24h', Icon: Truck, color: 'text-orange-600', tooltip: 'Orders waiting >48h but still AWAITING_SHIPMENT (need action).' },
        { key: 'countAutoCancelled', labelKey: 'orders.alert.auto_cancelling_24h', Icon: Calendar, color: 'text-red-600', tooltip: 'Orders approaching collection due time in next 24h.' },
        { key: 'countShippingOverdue', labelKey: 'orders.alert.shipping_overdue', Icon: Package, color: 'text-pink-600', tooltip: 'AWAITING_SHIPMENT orders past shipping_due_time.' },
        { key: 'countBuyerCancelled', labelKey: 'orders.alert.cancellation_requested', Icon: X, color: 'text-yellow-600', tooltip: 'Buyer has requested cancellation (isBuyerRequestCancel=true).' },
        { key: 'countLogisticsIssue', labelKey: 'orders.alert.logistics_issue', Icon: RefreshCw, color: 'text-purple-600', tooltip: 'Detected logistics exceptions (placeholder – implement logic).' },
        { key: 'countReturnRefund', labelKey: 'orders.alert.return_refund', Icon: CreditCard, color: 'text-indigo-600', tooltip: 'Orders with return/refund request (placeholder).' },
    ] as const;

    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [loadingCounts, setLoadingCounts] = useState<boolean>(false);
    const [alertCounts, setAlertCounts] = useState<Record<string, number>>({});
    const [loadingAlerts, setLoadingAlerts] = useState<boolean>(false);

    const fetchStatusCounts = useCallback(async () => {
        setLoadingCounts(true);
        try {
            const params = new URLSearchParams();
            if (filters.shopId) params.append('shopId', filters.shopId);
            if (filters.dateFrom) params.append('createTimeGe', Math.floor(new Date(filters.dateFrom).getTime() / 1000).toString());
            if (filters.dateTo) params.append('createTimeLt', Math.floor(new Date(filters.dateTo).getTime() / 1000).toString());
            if (filters.keyword) params.append('keyword', filters.keyword);
            if (filters.customStatus) params.append('customStatus', filters.customStatus);

            const res = await httpClient.get(`/orders/status-counts?${params.toString()}`);
            setStatusCounts(res?.counts || {});
        } finally {
            setLoadingCounts(false);
        }
    }, [filters.shopId, filters.dateFrom, filters.dateTo, filters.keyword, filters.customStatus]);

    const fetchAlertCounts = useCallback(async () => {
        setLoadingAlerts(true);
        try {
            const params = new URLSearchParams();
            if (filters.shopId) params.append('shopId', filters.shopId);
            const res = await httpClient.get(`/orders/alert?${params.toString()}`);

            // Merge API data with placeholders (0 if not returned)
            const base: Record<string, number> = {};
            ALERT_DEFS.forEach(def => { base[def.key] = 0; });
            Object.assign(base, res || {});
            setAlertCounts(base);
        } catch (e) {
            console.error('Failed to fetch alert counts', e);
        } finally {
            setLoadingAlerts(false);
        }
    }, [filters.shopId]);

    const closeTrackingModal = () => {
        setShowTrackingModal(false);
        setSelectedOrderForTracking(null);
    };

    const openSplitModal = (order: Order) => {
        setSelectedOrderForSplit(order);
        setShowSplitModal(true);
    };

    const closeSplitModal = () => {
        setShowSplitModal(false);
        setSelectedOrderForSplit(null);
    };

    const handleSplitSubmit = async (data: { splittable_groups: { id: string; order_line_item_ids: string[] }[] }) => {
        if (!selectedOrderForSplit) return;
        showLoading(t('orders.splitting_order'));
        try {
            await httpClient.post('/tiktok/Fulfillment/split-order', {
                orderId: selectedOrderForSplit.orderId,
                shopId: selectedOrderForSplit.shopId,
                groups: data.splittable_groups
            });
            toast.success(t('orders.split_success'));
            fetchOrders();
        } catch (err) {
            console.error('Failed to split order', err);
            toast.error(t('orders.split_failed'));
        } finally {
            closeSplitModal();
            hideLoading();
        }
    };

    const syncOrderDetail = async (order: Order) => {
        try {
            setSyncingDetail(order.orderId);
            await httpClient.post('/tiktok/Orders/sync-order-detail', {
                order_ids: [order.orderId],
                shop_id: order.shop.shopId
            });
            toast.success(t('orders.sync_detail_success') + ` (${order.orderId})`);
            fetchOrders({ page: pagination.currentPage, pageSize, loadingMessage: t('orders.refreshing'), isSearch: false });
        } catch (e) {
            console.error('Failed to sync order detail', e);
            toast.error(t('orders.sync_detail_failed'));
        } finally {
            setSyncingDetail(null);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
                <div className="w-full">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">{t('orders.title')}</h1>
                        <p className="text-gray-600 dark:text-gray-400">{t('orders.subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-start w-full gap-3 sm:justify-end">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            disabled={isExporting || selectedOrderIds.size === 0}
                            className="bg-orange-600 text-white px-3 py-1.5 text-xs rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center hover:shadow-lg transition duration-200"
                        >
                            {isExporting ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Download className="h-3 w-3 mr-1.5" />}
                            {isExporting 
                                ? 'Exporting...' 
                                : selectedOrderIds.size > 0 
                                    ? `Export Selected (${selectedOrderIds.size})` 
                                    : 'Select orders to export'
                            }
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="bg-blue-600 text-white px-3 py-1.5 text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center hover:shadow-lg transition duration-200"
                        >
                            <Upload className="h-3 w-3 mr-1.5" />
                            Import Shipment Info
                        </button>
                        <button
                            onClick={() => setShowSyncModal(true)}
                            disabled={syncing}
                            className="bg-green-600 text-white px-3 py-1.5 text-xs rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center hover:shadow-lg transition duration-200"
                        >
                            {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                            {t('orders.sync_orders')}
                        </button>
                        <button
                            onClick={syncUnsettledTransactions}
                            disabled={syncing}
                            className="bg-green-600 text-white px-3 py-1.5 text-xs rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center hover:shadow-lg transition duration-200"
                        >
                            {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                            {t('orders.sync_unsettled_transactions')}
                        </button>
                    </div>
                </div>

            </div>

            {/* Stats Cards - Inline horizontal scroll */}
            <div className="mb-6">
                <div className="flex items-stretch gap-3 overflow-x-auto py-2 scrollbar-thin">
                    {/* Total Orders */}
                    <button
                        type="button"
                        onClick={() => {
                            handleFilterChange('status', '');
                            setNeedSearch(true);
                        }}
                        aria-pressed={filters.status === ''}
                        className={`shrink-0 min-w-[240px] snap-start bg-white p-6 rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03] transition hover:shadow-md cursor-pointer ${
                            filters.status === '' ? 'ring-2 ring-blue-400 border-blue-300 dark:ring-blue-500' : ''
                        }`}
                    >
                        <div className="flex items-center">
                            <Package className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('orders.total_orders')}</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">{pagination.totalItems}</p>
                            </div>
                        </div>
                    </button>

                    {ALERT_DEFS.map(({ key, labelKey, Icon, color, tooltip }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => {
                                setAlertFilter(prev => prev === key ? '' : key); // toggle
                                setCurrentPage(1);
                                setNeedSearch(true);
                                // when selecting alert filter, clear status filter (to avoid conflicts)
                                setFilters(f => ({ ...f, status: '' }));
                            }}
                            aria-pressed={alertFilter === key}
                            title={tooltip}
                            className={`shrink-0 min-w-[240px] text-left snap-start p-6 rounded-lg shadow-sm border transition hover:shadow-md cursor-pointer dark:border-gray-800 dark:bg-white/[0.03] bg-white ${alertFilter === key ? 'ring-2 ring-blue-400 border-blue-300 dark:ring-blue-500' : ''}`}
                        >
                            <div className="flex items-center">
                                <Icon className={`h-8 w-8 ${color}`} />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                        {t(labelKey)}
                                    </p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">
                                        {loadingAlerts ? '...' : (alertCounts[key] ?? 0)}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Updated Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6 dark:border-gray-800 dark:bg-white/[0.03]">
                {/* Search Form */}
                <div className="mb-4">
                    <form onSubmit={handleSearch}>
                        <div className="relative">
                            <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
                                <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </span>
                            <input
                                type="text"
                                placeholder={t('orders.search_placeholder_full')}
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-24 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 xl:w-[500px]"
                                disabled={syncing}
                            />
                            <button
                                type="submit"
                                disabled={syncing}
                                className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg border border-gray-200 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                                {isSearching ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Search className="h-3 w-3" />
                                )}
                                {t('common.search')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">{t('orders.shop')}</label>
                        <ShopSelector
                            onChange={(shopId: string | null, shop: any | null) => handleFilterChange('shopId', shopId ?? '')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                            {t('orders.order_status_label')}
                            <span className="ml-1 text-xs text-gray-500 cursor-help" title="TikTok Shop order status definitions">ℹ️</span>
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                            <option value="">{t('orders.all_status')}</option>
                            <optgroup label="Payment & Processing">
                                <option value="UNPAID" title="Order placed but payment authorized">UNPAID</option>
                                <option value="ON_HOLD" title="Payment completed, in remorse period">ON_HOLD</option>
                            </optgroup>
                            <optgroup label="Fulfillment">
                                <option value="AWAITING_SHIPMENT" title="Waiting for seller to place logistics order">AWAITING_SHIPMENT</option>
                                <option value="PARTIALLY_SHIPPING" title="Some items shipped, others pending">PARTIALLY_SHIPPING</option>
                                <option value="AWAITING_COLLECTION" title="Logistics order placed, waiting for carrier pickup">AWAITING_COLLECTION</option>
                                <option value="IN_TRANSIT" title="All items collected by carrier, in delivery">IN_TRANSIT</option>
                            </optgroup>
                            <optgroup label="Final States">
                                <option value="DELIVERED" title="All items delivered to buyer">DELIVERED</option>
                                <option value="COMPLETED" title="Order completed, no returns/refunds allowed">COMPLETED</option>
                                <option value="CANCELLED" title="Order cancelled by buyer/seller/system/operator">CANCELLED</option>
                            </optgroup>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                            {t('orders.custom_status')}
                            <span className="ml-1 text-xs text-gray-500 cursor-help" title="Internal delivery tracking status">📦</span>
                        </label>
                        <select
                            value={filters.customStatus}
                            onChange={(e) => handleFilterChange('customStatus', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                            <option value="">{t('orders.all_status')}</option>
                            <option value="NOT_SET">Chưa kéo đơn</option>
                            <option value="DELIVERED">Đã kéo đơn</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">{t('orders.from_date')}</label>
                        <input
                            type="datetime-local"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">{t('orders.to_date')}</label>
                        <input
                            type="datetime-local"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">{t('orders.page_size')}</label>
                        <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>

                {/* Status Legend */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">{t('orders.status_flow')}</h5>
                            <div className="flex gap-2 text-xs">
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400">
                                    UNPAID
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400">
                                    ON_HOLD
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-400">
                                    AWAITING_SHIPMENT
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-400">
                                    AWAITING_COLLECTION
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-400">
                                    IN_TRANSIT
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-400">
                                    DELIVERED
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400">
                                    COMPLETED
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                    <TimezoneInfo />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <input
                                        type="checkbox"
                                        checked={orders.length > 0 && selectedOrderIds.size === orders.length}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.id') || 'ID'}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.account_seller')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.order')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.items_images')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.customer_info')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.order_info')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.sla_column')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.price')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:border-gray-800 dark:bg-white/[0.03]">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                        {t('orders.no_orders_found')}
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order, index) => {
                                    const itemImages = getLineItemImages(order);
                                    const isNotDelivered = (!order.customStatus || order.customStatus !== 'DELIVERED') && !['DELIVERED', 'COMPLETED', 'CANCELLED', 'IN_TRANSIT'].includes(order.status.toUpperCase());
                                    return (
                                        <tr
                                            key={order.id}
                                            className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isNotDelivered
                                                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500'
                                                : ''
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOrderIds.has(order.id)}
                                                    onChange={() => handleSelectOrder(order.id)}
                                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                                />
                                            </td>
                                            
                                            {/* Update index calculation for server-side pagination */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-400">
                                                    #{((pagination.currentPage - 1) * pagination.pageSize) + index + 1}
                                                </div>
                                            </td>

                                            {/* Account/Seller - Thông tin tên shop, seller vận hành */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-400">
                                                        {order.shop.managedName || t('common.na')}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {t('orders.shop_id_label')} {order.shopId}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Order - Mã đơn hàng tiktok, thời gian đặt hàng, trạng thái đơn hàng */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-mono text-sm font-medium text-gray-900 dark:text-gray-400">
                                                            {order.orderId}
                                                        </div>
                                                        <button
                                                            onClick={() => copyOrderId(order.orderId)}
                                                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                                            title="Copy Order ID"
                                                        >
                                                            {copiedOrderId === order.orderId ? (
                                                                <Check className="h-3 w-3 text-green-600" />
                                                            ) : (
                                                                <Copy className="h-3 w-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                                        {formatTimestamp(order.createTime)}
                                                    </div>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Items Images - Product images from line items */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-32">
                                                    {itemImages.length > 0 ? (
                                                        itemImages.slice(0, 4).map((item, imgIndex) => (
                                                            <div
                                                                key={`${item.id}-${imgIndex}`}
                                                                className="relative w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden"
                                                            >
                                                                <Image
                                                                    src={item.image}
                                                                    alt={item.productName}
                                                                    width={48}
                                                                    height={48}
                                                                    className="w-full h-full object-cover"
                                                                    unoptimized
                                                                />
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                                                            <Package className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                    {itemImages.length > 4 && (
                                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                                +{itemImages.length - 4}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Customer Info - Customer information with copy functionality */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-400">
                                                            {order.recipientAddress?.name || t('common.na')}
                                                        </div>
                                                        <button
                                                            onClick={() => copyCustomerInfo(order)}
                                                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                            title={t('orders.copy_customer_info')}
                                                        >
                                                            {copiedCustomer === order.orderId ? (
                                                                <Check className="h-3 w-3 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-3 w-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate max-w-48 dark:text-gray-400">
                                                        {order.recipientAddress?.phoneNumber || t('common.na')}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate max-w-48 dark:text-gray-400">
                                                        {order.recipientAddress?.fullAddress || t('common.na')}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate max-w-48 dark:text-gray-400">
                                                        {order.recipientAddress?.postalCode || t('common.na')}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Order Info - Thông tin nhận hàng và thanh toán của khách hàng */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col space-y-1">
                                                    <div className="text-xs text-blue-600 dark:text-blue-400">
                                                        {`${order.lineItemsCount || order.lineItems?.length || 0} ${t(`orders.items_label`)}`}
                                                    </div>
                                                    {/* Show all package tracking numbers */}
                                                    {(order.packages?.some(p => !!p.trackingNumber)) && (
                                                        <div className="flex flex-col gap-1">
                                                            {order.packages
                                                                ?.filter(p => !!p.trackingNumber)
                                                                .map((pkg) => (
                                                                    <div
                                                                        key={pkg.packageId}
                                                                        className="text-xs font-mono text-purple-600"
                                                                    >
                                                                        {t('orders.track_label')} {pkg.trackingNumber} - {pkg.shippingProviderName}
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}
                                                    {((order?.mustSplitPackages || order?.canSplitPackages) && order?.customStatus === 'SPLITTED') && (
                                                        <div className="text-xs font-mono text-orange-600 truncate max-w-50">
                                                            {t('orders.splitted')}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* SLA / Due Times */}
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex flex-col space-y-1 max-w-56">
                                                    {buildSlaItems(order).length === 0 && (
                                                        <div className="text-xs text-gray-400">—</div>
                                                    )}
                                                    {buildSlaItems(order).map(item => (
                                                        <div key={item.key} className="flex justify-between gap-2 text-[11px] font-mono leading-snug">
                                                            <span className="truncate text-gray-600 dark:text-gray-400 font-medium" title={item.label}>{item.label}</span>
                                                            <span className={`text-right text-[11px] font-semibold ${item.type === 'deadline' ? classifyDeadline(item.value) : 'text-gray-700 dark:text-gray-300'}`} title={item.value ? `${item.label}: ${formatEpoch(item.value)}` : ''}>
                                                                {formatRelative(item.value)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Price - Các chi phí của đơn hàng */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col space-y-1">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-400">
                                                        {order.payment?.totalAmount ?
                                                            formatCurrency(order.payment.totalAmount, order.payment.currency) :
                                                            'N/A'
                                                        }
                                                    </div>
                                                    {order.unsettledTransactions && order.unsettledTransactions.length > 0 && (
                                                        <div className="text-xs text-red-500 font-mono">
                                                            {t('orders.estimated_label')} {formatCurrency(order.unsettledTransactions[0]?.estSettlementAmount, order.payment?.currency || 'USD')}
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
                                                        {t('orders.view')}
                                                    </button>
                                                    <button
                                                        onClick={() => syncOrderDetail(order)}
                                                        disabled={syncingDetail === order.orderId || syncing}
                                                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-900 border border-indigo-300 rounded hover:bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-700 disabled:opacity-50"
                                                        title="Sync latest order detail"
                                                    >
                                                        {syncingDetail === order.orderId ? (
                                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="h-3 w-3 mr-1" />
                                                        )}
                                                        {t('orders.sync_detail')}
                                                    </button>

                                                    {/* Custom Status Action Buttons */}
                                                    {order.customStatus !== 'DELIVERED' && !['DELIVERED', 'COMPLETED', 'CANCELLED', 'IN_TRANSIT'].includes(order.status) && (
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => updateCustomStatus(order.orderId, 'DELIVERED')}
                                                                disabled={updatingStatus === order.orderId}
                                                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 hover:text-green-900 border border-green-300 rounded hover:bg-green-50 dark:border-green-800 dark:bg-green-900 dark:text-green-400 dark:hover:bg-green-700 disabled:opacity-50"
                                                                title={t('orders.mark_as_delivered_title')}
                                                            >
                                                                <Check className="h-3 w-3 mr-1" />
                                                                {t('orders.mark_delivered')}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {(!parseChannelData(order?.channelData ?? "").trackingNumber && !order.mustSplitPackages)  && (
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => handleAddTracking(order)}
                                                                disabled={updatingStatus === order.orderId}
                                                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 hover:text-green-900 border border-green-300 rounded hover:bg-green-50 dark:border-green-800 dark:bg-green-900 dark:text-green-400 dark:hover:bg-green-700 disabled:opacity-50"
                                                                title={t('orders.add_tracking_title')}
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                {t('orders.add_tracking')}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {(!parseChannelData(order?.channelData ?? "").trackingNumber && (order.mustSplitPackages || order.canSplitPackages) && order.customStatus !== 'SPLITTED')  && (
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => openSplitModal(order)}
                                                                disabled={updatingStatus === order.orderId}
                                                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 hover:text-green-900 border border-green-300 rounded hover:bg-green-50 dark:border-green-800 dark:bg-green-900 dark:text-green-400 dark:hover:bg-green-700 disabled:opacity-50"
                                                                title={t('orders.split_order_title')}
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                {t('orders.split_orders')}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* <button
                                                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 hover:text-green-900 border border-green-300 rounded hover:bg-green-50 dark:border-green-800 dark:bg-green-900 dark:text-green-400 dark:hover:bg-green-700"
                                                        onClick={() => {
                                                            // TODO: Implement customer support chat
                                                            alert('Customer support chat feature will be implemented');
                                                        }}
                                                    >
                                                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                        Hỗ trợ
                                                    </button> */}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Updated Pagination */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={!pagination.hasPreviousPage || syncing}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            {t('common.previous')}
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={!pagination.hasNextPage || syncing}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            {t('common.next')}
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-400">
                                {t(
                                  `Showing results ${pagination.totalItems === 0 ? 0 : ((pagination.currentPage - 1) * pagination.pageSize) + 1} - ${Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of ${pagination.totalItems}`
                                )}
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={!pagination.hasPreviousPage || syncing}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-gray-700"
                                >
                                    {t('common.previous')}
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                                    {t(`Page ${pagination.currentPage} of ${pagination.totalPages}`)}
                                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={!pagination.hasNextPage || syncing}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-gray-700"
                                >
                                    {t('common.next')}
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Detail Modal - Updated */}
            <OrderDetailModal
                order={selectedOrder}
                isOpen={showOrderModal}
                onClose={closeOrderModal}
            />

            {/* Add Tracking Modal */}
            <AddTrackingModal
                isOpen={showTrackingModal}
                onClose={closeTrackingModal}
                onSave={handleSaveTracking}
                orderId={selectedOrderForTracking?.orderId || ''}
                packages={selectedOrderForTracking?.packages || []}
            />

            {/* Sync Order Modal */}
            <SyncOrderModal
                isOpen={showSyncModal}
                onClose={() => setShowSyncModal(false)}
                onSync={syncOrders}
            />

            {/* Split Order Modal */}
            <SplitOrderModal
                isOpen={showSplitModal}
                order={selectedOrderForSplit}
                onClose={closeSplitModal}
                onSubmit={handleSplitSubmit}
            />

            {/* Import Excel Modal (extracted) */}
            <ImportOrdersModal
                isOpen={showImportModal}
                isSubmitting={isImporting}
                file={importFile}
                onFileChange={handleImportFileChange}
                onTemplateDownload={downloadTemplate}
                onSampleDownload={downloadSample}
                onClose={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                }}
                onSubmit={handleImportExcel}
            />

            {/* Floating Add Tracking Info Button */}
            {selectedOrderIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex items-center justify-center gap-4">
                    <button
                        onClick={handleOpenBulkTrackingModal}
                        className="bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-purple-700 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <Truck className="h-5 w-5" />
                        <span className="font-medium">Add Tracking Info ({selectedOrderIds.size})</span>
                    </button>
                    {/* Updated Clear button style */}
                    <button
                        onClick={() => { setSelectedOrderIds(new Set()); }}
                        className="px-6 py-3 rounded-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 dark:border-gray-700 dark:text-gray-200 dark:bg-transparent dark:hover:bg-gray-800"
                        title="Clear selected orders"
                    >
                        <X className="h-5 w-5" />
                        <span className="font-medium">Clear</span>
                    </button>
                </div>
            )}

            {/* Bulk Tracking Modal (extracted) */}
            <BulkTrackingModal
                isOpen={showBulkTrackingModal}
                onClose={() => setShowBulkTrackingModal(false)}
                selectedOrders={orders.filter(o => selectedOrderIds.has(o.id))}
                getLineItemImages={getLineItemImages}
                data={bulkTrackingData}
                onChange={handleBulkTrackingChange}
                onSave={async (rows) => {
                    // rows: [{ orderId, shopId, packageId, trackingId, providerId }]
                    if (!rows.length) {
                        toast.error('No valid rows to submit');
                        return;
                    }
                    try {
                        showLoading('Saving tracking info...');
                        const res = await httpClient.post('/orders/bulk-tracking', { rows });
                        const summary = res?.summary || {};
                        const errors = Array.isArray(res?.errors) ? res.errors : [];

                        if (errors.length > 0) {
                            const first = errors.slice(0, 5).map((e: any) => {
                                const pkg = e?.packageId ? `pkg ${e.packageId}` : 'pkg -';
                                const code = e?.code ? `[${e.code}]` : '';
                                const msg = e?.message || 'Unknown error';
                                return `${pkg} ${code} ${msg}`;
                            }).join('\n');
                            const submitted = summary.submitted ?? rows.length;
                            const failed = summary.failed ?? errors.length;
                            toast.error(`Bulk tracking failed (${failed}/${submitted}).\n${first}`);
                            // Keep modal open so user can fix inputs
                            return;
                        }

                        toast.success(`Saved ${summary.succeeded ?? rows.length} packages successfully.`);
                        await fetchOrders({ page: pagination.currentPage, pageSize, loadingMessage: t('orders.refreshing') });
                        await fetchStatusCounts();
                        setShowBulkTrackingModal(false);
                        setSelectedOrderIds(new Set());
                    } catch (e: any) {
                        console.error('Bulk tracking error', e);
                        toast.error(e?.message || 'Failed to save tracking info');
                    } finally {
                        hideLoading();
                    }
                }}
            />
        </div>
    );
}