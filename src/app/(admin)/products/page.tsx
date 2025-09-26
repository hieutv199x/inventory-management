"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDownIcon } from "@/icons";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { httpClient } from "@/lib/http-client";
import { RefreshCw, Package, Calendar, User, Eye, Search, Loader2, Sparkles, Layers, Copy, RefreshCcw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Badge from "@/components/ui/badge/Badge";
import ProductDetailModal from "@/components/Products/ProductDetailModal";
import SyncProductModal from "@/components/Products/SyncProductModal";
import { Product } from "@/types/product";
import { formatCurrency, formatDate } from "@/utils/common/functionFormat";
import { toast } from "react-hot-toast";
import ShopSelector from "@/components/ui/ShopSelector";

// Utility to strip HTML tags from a string
function stripHtml(html: string = ""): string {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, "");
}

interface PaginationInfo {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// Simple debounce hook (local to this page - avoids adding new file)
function useDebounce<T>(value: T, delay: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function ProductPage() {

    const { t } = useLanguage();
    // i18n aware option labels
    const optionsListing = useMemo(() => ([
        { label: t('products.listing_quality.unknown'), value: 'UNKNOWN' },
        { label: t('products.listing_quality.poor'), value: 'POOR' },
        { label: t('products.listing_quality.fair'), value: 'FAIR' },
        { label: t('products.listing_quality.good'), value: 'GOOD' },
    ]), [t]);
    const optionStatus = useMemo(() => ([
        { label: t('common.total'), value: 'All' },
        { label: t('orders.status') + ' DRAFT', value: 'DRAFT' }, // Could refine with distinct keys later
        { label: 'PENDING', value: 'PENDING' },
        { label: t('products.stats.active'), value: 'ACTIVATE' },
        { label: t('products.stats.seller_deactivated'), value: 'SELLER_DEACTIVATED' },
        { label: t('products.stats.platform_deactivated'), value: 'PLATFORM_DEACTIVATED' },
        { label: 'FREEZE', value: 'FREEZE' },
        { label: 'DELETED', value: 'DELETED' },
    ]), [t]);

    const [filters, setFilters] = useState({
        shopId: "",
        status: "",
        listingQuality: "",
        startDate: null as string | null,
        endDate: null as string | null,
        keyword: "",
    });

    // Search state (debounced)
    const [searchKeyword, setSearchKeyword] = useState("");
    const debouncedSearch = useDebounce(searchKeyword, 500);
    const [isSearching, setIsSearching] = useState(false);

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Updated pagination state - now managed by server
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });

    const [exporting, setExporting] = useState<boolean>(false);

    const handleFilterChange = (field: keyof typeof filters, value: string | null) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    // Add search function
    // When debounced search changes, apply to filters
    useEffect(() => {
        if (debouncedSearch !== filters.keyword) {
            setIsSearching(true);
            setFilters(prev => ({ ...prev, keyword: debouncedSearch }));
            setCurrentPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setIsSearching(false); // Reset search loading when request begins
        try {
            const params = new URLSearchParams();

            // Add pagination params
            params.append('page', currentPage.toString());
            params.append('pageSize', pageSize.toString());

            // Add filter params
            if (filters.shopId) params.append('shopId', filters.shopId);
            if (filters.status) params.append('status', filters.status);
            if (filters.listingQuality) params.append('listingQuality', filters.listingQuality);
            if (filters.keyword) params.append('keyword', filters.keyword);
            if (filters.startDate && filters.endDate) {
                params.append('startDate', filters.startDate);
                params.append('endDate', filters.endDate);
            }

            const result = await httpClient.get(`/products?${params.toString()}`);

            setProducts(result?.products || []);
            setPagination(result?.pagination || {
                currentPage: 1,
                pageSize: 10,
                totalItems: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false
            });

        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown fetch error occurred";
            setError(message);
            console.error("Fetch failed", err);
        } finally {
            setIsLoading(false);
        }
    }, [filters, currentPage, pageSize]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);
        
    const handlerSyncProduct = async (shopId: string, status: string) => {
        try {
            const response = await fetch('/api/tiktok/Products/search-product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shop_id: shopId,
                    status: status,
                    page_size: 100,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Unknown error');
                return;
            }

            toast.success(`Đồng bộ thành công ${result.syncInfo?.totalProductsCreated || 0} sản phẩm!`);
            // Refresh list
            fetchProducts();
        } catch (err) {
            toast.error('Gặp lỗi khi đồng bộ sản phẩm');
            throw err;
        }
    };

    // Reset to first page when filters change
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [filters]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handlePageSizeChange = (val: string | null) => {
        const num = parseInt(val || "10", 10);
        const newPageSize = Number.isNaN(num) ? 10 : num;
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when page size changes
    };

    // Update export to handle server-side pagination
    const handleExport = async () => {
        try {
            setExporting(true);

            // Fetch all products for export (without pagination)
            const params = new URLSearchParams();
            params.append('pageSize', '10000'); // Large number to get all
            params.append('page', '1');

            if (filters.shopId) params.append('shopId', filters.shopId);
            if (filters.status) params.append('status', filters.status);
            if (filters.listingQuality) params.append('listingQuality', filters.listingQuality);
            if (filters.keyword) params.append('keyword', filters.keyword);
            if (filters.startDate && filters.endDate) {
                params.append('startDate', filters.startDate);
                params.append('endDate', filters.endDate);
            }

            const result = await httpClient.get(`/products?${params.toString()}`);
            const allProducts = result?.products || [];

            if (allProducts.length === 0) {
                toast("Không có sản phẩm để xuất");
                return;
            }

            // Prepare data for Excel: export all filtered products, not just current page
            const rows = allProducts.map((p: any) => ({
                ProductID: p.productId,
                Title: p.title,
                Shop: p.shop?.shopName || "",
                Status: p.status,
                Price: p.skus?.[0]?.price?.salePrice ? `${formatCurrency(p.skus[0].price.salePrice, p.skus[0].price.currency)}` : "",
                CreationDate: formatDate(p.createTime),
                Image: p.images?.[0]?.urls?.[0] || "",
                Description: stripHtml(p.description),
            }));

            const XLSX = await import("xlsx");
            const ws = XLSX.utils.json_to_sheet(rows);
            // Auto width
            const colWidths = Object.keys(rows[0] || {}).map((key) => ({ wch: Math.min(Math.max(key.length, 20), 60) }));
            // refine widths by content length
            rows.forEach((r: any) => {
                Object.entries(r).forEach(([k, v], idx) => {
                    const len = String(v ?? "").length;
                    if (colWidths[idx]) colWidths[idx].wch = Math.min(Math.max(colWidths[idx].wch, len + 2), 80);
                });
            });
            // @ts-ignore - SheetJS uses non-typed property here
            ws["!cols"] = colWidths;
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Products");

            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, "0");
            const filename = `Products_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.xlsx`;
            XLSX.writeFile(wb, filename);
            toast.success("Xuất Excel thành công");
        } catch (e) {
            toast.error("Xuất Excel thất bại");
        } finally {
            setExporting(false);
        }
    };
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

    const handleViewProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    // Derived stats
    const stats = useMemo(() => {
        const total = products.length;
        const active = products.filter(p => p.status === 'ACTIVATE').length;
        const sellerDeact = products.filter(p => p.status === 'SELLER_DEACTIVATED').length;
        const platformDeact = products.filter(p => p.status === 'PLATFORM_DEACTIVATED').length;
        return { total, active, sellerDeact, platformDeact };
    }, [products]);

    // Toggle filters panel
    const [showFilters, setShowFilters] = useState(true);

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => toast.success(t('products.copy.success')));
    };

    const syncSingleProduct = async (productId: string, shopId?: string) => {
        if (!shopId) {
            toast.error('Missing shop');
            return;
        }
        try {
            toast.loading(t('products.sync.loading_single'), { id: `sync-${productId}` });
            const res = await fetch('/api/tiktok/Products/sync-one', { // (Potential future endpoint) fallback to search if not exist
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shop_id: shopId, product_id: productId })
            });
            if (!res.ok) throw new Error('Failed');
            toast.success(t('products.sync.success_single'), { id: `sync-${productId}` });
            fetchProducts();
        } catch {
            toast.error(t('products.sync.failed_single'), { id: `sync-${productId}` });
        }
    };

    // Skeleton rows when loading
    const skeletonRows = Array.from({ length: 6 }).map((_, idx) => (
        <TableRow key={`sk-${idx}`}>
            {/* Images */}
            <TableCell className="py-3"><div className="animate-pulse h-16 w-36 bg-gray-100 dark:bg-gray-800 rounded" /></TableCell>
            {/* Info */}
            <TableCell className="py-3"><div className="space-y-2 w-64">
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-2/3" />
            </div></TableCell>
            {/* Listing Quality */}
            <TableCell className="py-3"><div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></TableCell>
            {/* Retail Price */}
            <TableCell className="py-3"><div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></TableCell>
            {/* Status */}
            <TableCell className="py-3"><div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" /></TableCell>
            {/* Create Date */}
            <TableCell className="py-3"><div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></TableCell>
            {/* Updated */}
            <TableCell className="py-3"><div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></TableCell>
            {/* Action */}
            <TableCell className="py-3"><div className="h-5 w-28 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></TableCell>
        </TableRow>
    ));

    return (
        <div className="space-y-6">
            {/* Loading Overlay */}
            {(isLoading || isSearching) && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 9999 }}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3 shadow-xl">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="text-gray-900 dark:text-white font-medium">
                            {isSearching ? 'Searching products...' : 'Loading products...'}
                        </span>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90 flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-indigo-500" /> {t('products.title')}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('products.subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setIsSyncModalOpen(true)}
                        className="bg-gradient-to-r from-green-600 to-green-500 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-theme-sm font-medium text-white shadow hover:from-green-700 hover:to-green-600"
                    >
                        <RefreshCw className="h-4 w-4" /> {t('products.bulk_sync')}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting || isLoading}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                        {exporting ? t('products.exporting') : t('products.export')}
                    </button>
                    <button
                        onClick={fetchProducts}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                        <RefreshCcw className="h-4 w-4" /> {t('products.refresh')}
                    </button>
                    <button
                        onClick={() => setShowFilters(s => !s)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                        <Layers className="h-4 w-4" /> {showFilters ? t('products.hide_filters') : t('products.show_filters')}
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: t('products.stats.total'), value: stats.total, icon: Package, color: 'text-indigo-600' },
                    { label: t('products.stats.active'), value: stats.active, icon: Calendar, color: 'text-green-600' },
                    { label: t('products.stats.seller_deactivated'), value: stats.sellerDeact, icon: RefreshCw, color: 'text-yellow-600' },
                    { label: t('products.stats.platform_deactivated'), value: stats.platformDeact, icon: User, color: 'text-red-600' },
                ].map(card => (
                    <div key={card.label} className="bg-white rounded-xl p-5 border shadow-sm dark:border-gray-800 dark:bg-white/[0.04] flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${card.color}`}>
                            <card.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.label}</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white/90">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                {/* Search + Filters Toggle */}
                <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative max-w-xl w-full">
                        <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
                            <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder={t('products.search_placeholder')}
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-indigo-400 focus:outline-hidden focus:ring-3 focus:ring-indigo-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                            disabled={isLoading}
                        />
                        {searchKeyword && (
                            <button
                                onClick={() => setSearchKeyword("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >{t('products.clear')}</button>
                        )}
                    </div>
                </div>
                {showFilters && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
                        <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-2 dark:text-gray-400 uppercase tracking-wide">{t('products.filter.shop')}</label>
                            <ShopSelector onChange={(shopId: string | null) => handleFilterChange('shopId', shopId ?? '')} />
                        </div>
                        <div className="col-span-1">
                            <Label>{t('products.filter.status')}</Label>
                            <div className="relative">
                                <Select
                                    options={optionStatus}
                                    onChange={(val) => handleFilterChange('status', val)}
                                    enablePlaceholder={false}
                                    className="dark:bg-dark-900"
                                />
                                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                    <ChevronDownIcon />
                                </span>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <Label>{t('products.filter.listing_quality')}</Label>
                            <div className="relative">
                                <Select
                                    options={optionsListing}
                                    onChange={(val) => handleFilterChange('listingQuality', val)}
                                    enablePlaceholder={false}
                                    className="dark:bg-dark-900"
                                />
                                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                    <ChevronDownIcon />
                                </span>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <DatePicker
                                id="start-date-picker"
                                label={t('products.filter.from_date')}
                                value={filters.startDate ?? undefined}
                                placeholder="dd/MM/yyyy"
                                onChange={(_, dateStr) => handleFilterChange('startDate', dateStr)}
                            />
                        </div>
                        <div className="col-span-1">
                            <DatePicker
                                id="end-date-picker"
                                label={t('products.filter.to_date')}
                                value={filters.endDate ?? undefined}
                                placeholder="dd/MM/yyyy"
                                onChange={(_, dateStr) => handleFilterChange('endDate', dateStr)}
                            />
                        </div>
                    </div>
                )}

                <div className="max-w-full overflow-x-auto mt-4">
                    <Table>
                        {/* Updated Table Header */}
                        <TableHeader className="border-gray-100 dark:border-gray-800 border-y sticky top-0 bg-white/95 backdrop-blur dark:bg-gray-950/80 z-10">
                            <TableRow>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    {t('products.table.images')}
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    {t('products.table.info')}
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    {t('products.table.listing_quality')}
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    {t('products.table.price')}
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    {t('products.table.status')}
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    {t('products.table.created_at')}
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    {t('products.table.updated_at')}
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    {t('products.table.actions')}
                                </TableCell>
                            </TableRow>
                        </TableHeader>

                        {/* Updated Table Body */}
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? skeletonRows : error ? (
                                <TableRow><TableCell colSpan={8} className="py-5 text-center text-red-500">{error}</TableCell></TableRow>
                            ) : products.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="py-5 text-center text-gray-500">{t('products.no_results')}</TableCell></TableRow>
                            ) : (
                                products.map((product) => {
                                    const productImages = product.images?.slice(0, 4) || []; // Show max 4 images
                                    const listingQuality = (product as any).listingQualityTier || (product as any).listing_quality_tier || 'UNKNOWN';
                                    const qualityMap: Record<string, string> = {
                                        GOOD: t('products.listing_quality.good'),
                                        FAIR: t('products.listing_quality.fair'),
                                        POOR: t('products.listing_quality.poor'),
                                        UNKNOWN: t('products.listing_quality.unknown')
                                    };
                                    const listingQualityLabel = qualityMap[listingQuality] || listingQuality;
                                    const qualityColor = listingQuality === 'GOOD' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : listingQuality === 'FAIR' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            : listingQuality === 'POOR' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
                                    return (
                                        <TableRow key={product.id}>
                                            {/* Product Images - Grid Layout - Increased Size */}
                                            <TableCell className="py-3">
                                                <div className="grid grid-cols-2 gap-2 w-36">
                                                    {productImages.length > 0 ? (
                                                        productImages.map((image, index) => (
                                                            image.urls?.[0] && (
                                                                <div key={index} className="aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                                                                    <Image
                                                                        width={42}
                                                                        height={42}
                                                                        src={image.urls[0]}
                                                                        className="object-cover h-full w-full"
                                                                        alt={`${product.title} - ${index + 1}`}
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.src = "/images/product/product-01.jpg";
                                                                        }}
                                                                        unoptimized={true}
                                                                    />
                                                                </div>
                                                            )
                                                        ))
                                                    ) : (
                                                        <div className="col-span-2 aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                            <Package className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                    {/* Fill empty slots if less than 4 images */}
                                                    {Array.from({ length: Math.max(0, 4 - productImages.length) }).map((_, index) => (
                                                        <div key={`empty-${index}`} className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-md"></div>
                                                    ))}
                                                </div>
                                            </TableCell>

                                            {/* Product Information */}
                                            <TableCell className="py-3">
                                                <div className="space-y-2 max-w-[300px]">
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate" title={product.title}>
                                                        {product.title}
                                                    </p>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                                        <div className="grid grid-cols-1 gap-1">
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium text-gray-600 dark:text-gray-300 min-w-[50px]">ID:</span>
                                                                <span className="font-mono text-xs text-gray-800 dark:text-gray-200">{product.productId}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium text-gray-600 dark:text-gray-300 min-w-[50px]">SKU:</span>
                                                                <span className="font-mono text-xs text-gray-800 dark:text-gray-200">{product.skus?.[0]?.skuId || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium text-gray-600 dark:text-gray-300 min-w-[50px]">P-ID:</span>
                                                                <span className="font-mono text-xs text-gray-800 dark:text-gray-200 truncate">{product.id}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium text-gray-600 dark:text-gray-300 min-w-[50px]">Shop:</span>
                                                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate" title={product.shop?.shopName || 'N/A'}>
                                                                    {product.shop?.shopName || 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium text-gray-600 dark:text-gray-300 min-w-[50px]">SKU:</span>
                                                                <span className="font-mono text-[10px] text-gray-700 dark:text-gray-300 truncate" title={product.skus?.[0]?.skuId}>{product.skus?.[0]?.skuId || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Listing Quality */}
                                            <TableCell className="py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium tracking-wide ${qualityColor}`}>{listingQualityLabel}</span>
                                            </TableCell>

                                            {/* Retail Price */}
                                            <TableCell className="py-3">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {product.skus?.[0]?.price?.salePrice
                                                        ? formatCurrency(product.skus[0].price.salePrice, product.skus[0].price.currency)
                                                        : formatCurrency(product.price, product.currency)
                                                    }
                                                </div>
                                                {product.skus?.[0]?.price?.originalPrice &&
                                                    product.skus[0].price.originalPrice !== product.skus[0].price.salePrice && (
                                                        <div className="text-xs text-gray-500 line-through">
                                                            {formatCurrency(product.skus[0].price.originalPrice, product.skus[0].price.currency)}
                                                        </div>
                                                    )}
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell className="py-3">
                                                <Badge
                                                    size="sm"
                                                    color={
                                                        product.status === "ACTIVATE"
                                                            ? "success"
                                                            : product.status === "PENDING"
                                                                ? "warning"
                                                                : "error"
                                                    }
                                                >
                                                    {product.status}
                                                </Badge>
                                            </TableCell>

                                            {/* Create Date */}
                                            <TableCell className="py-3 text-gray-500 text-xs dark:text-gray-400">
                                                {formatDate(product.createTime)}
                                            </TableCell>
                                            {/* Updated */}
                                            <TableCell className="py-3 text-gray-500 text-xs dark:text-gray-400">
                                                {formatDate((product as any).updateTime || (product as any).updatedAt || product.createTime)}
                                            </TableCell>

                                            {/* Action */}
                                            <TableCell className="py-3 space-x-1 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleViewProduct(product)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                                                >
                                                    <Eye className="w-3 h-3" /> {t('products.actions.view')}
                                                </button>
                                                <button
                                                    onClick={() => copyToClipboard(product.productId)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 dark:bg-gray-800/60 dark:text-gray-300"
                                                >
                                                    <Copy className="w-3 h-3" /> {t('products.actions.copy_id')}
                                                </button>
                                                <button
                                                    onClick={() => syncSingleProduct(product.productId, (product as any).shop?.shopId || (product as any).shop?.id)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                                >
                                                    <RefreshCw className="w-3 h-3" /> {t('products.actions.sync')}
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Updated Pagination controls */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('products.pagination.rows_per_page')}</span>
                        <div className="w-28">
                            <Select
                                options={[
                                    { label: "10", value: "10" },
                                    { label: "20", value: "20" },
                                    { label: "50", value: "50" },
                                    { label: "100", value: "100" },
                                ]}
                                onChange={handlePageSizeChange}
                                enablePlaceholder={false}
                                value={String(pageSize)}
                                className="dark:bg-dark-900"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {t('products.pagination.range', { from: (pagination.totalItems === 0 ? 0 : ((pagination.currentPage - 1) * pagination.pageSize) + 1).toString(), to: Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems).toString(), total: pagination.totalItems.toString() })}
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={!pagination.hasPreviousPage || isLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                            >
                                {t('products.pagination.prev')}
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Page {pagination.currentPage} of {pagination.totalPages}</span>
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={!pagination.hasNextPage || isLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                            >
                                {t('products.pagination.next')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add the modal components */}
            <ProductDetailModal
                product={selectedProduct}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />

            <SyncProductModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                onSync={handlerSyncProduct}
            />
        </div>

    );
};