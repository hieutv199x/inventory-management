"use client";
import React, { useCallback, useEffect, useState } from "react";
import { ChevronDownIcon } from "@/icons";
import SelectShop from "@/components/common/SelectShop";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { useToast } from "@/context/ToastContext";
import { httpClient } from "@/lib/http-client";
import { RefreshCw, Package, Calendar, User, Eye, Search, Loader2 } from 'lucide-react';
import Badge from "@/components/ui/badge/Badge";
import ProductDetailModal from "@/components/Products/ProductDetailModal";
import SyncProductModal from "@/components/Products/SyncProductModal";
import { Product } from "@/types/product";
import { formatCurrency, formatDate } from "@/utils/common/functionFormat";

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

export default function ProductPage() {
    const toast = useToast();

    const optionsListing = [
        { label: "UNKNOWN", value: "UNKNOWN" },
        { label: "POOR", value: "POOR" },
        { label: "FAIR", value: "FAIR" },
        { label: "GOOD", value: "GOOD" },
    ];
    const optionStatus = [
        { label: "All", value: "All" },
        { label: "DRAFT", value: "DRAFT" },
        { label: "PENDING", value: "PENDING" },
        { label: "ACTIVATE", value: "ACTIVATE" },
        { label: "SELLER_DEACTIVATED", value: "SELLER_DEACTIVATED" },
        { label: "PLATFORM_DEACTIVATED", value: "PLATFORM_DEACTIVATED" },
        { label: "FREEZE", value: "FREEZE" },
        { label: "DELETED", value: "DELETED" },
    ];

    const [filters, setFilters] = useState({
        shopId: "",
        status: "",
        listingQuality: "",
        startDate: null as string | null,
        endDate: null as string | null,
        keyword: "",
    });

    // Add separate search state
    const [searchKeyword, setSearchKeyword] = useState("");
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
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        setFilters(prev => ({ ...prev, keyword: searchKeyword }));
        setCurrentPage(1);
    };

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setIsSearching(false); // Reset search loading
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

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);


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
                toast.info("Không có sản phẩm để xuất");
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

    return (
        <div>
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

            <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
                <div className="w-full">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Products Management</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage and sync TikTok products</p>
                    </div>
                </div>
                <div className="flex items-start w-full gap-3 sm:justify-end">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSyncModalOpen(true)}
                            className="bg-green-600 inline-flex items-center gap-2 rounded-lg border hover:bg-green-700 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:text-white-50 hover:text-white-800 dark:bg-green-700 dark:bg-green-800 dark:text-white-400 dark:hover:bg-green/[0.03] dark:hover:text-white-200"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Sync Products
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={exporting || isLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        >
                            {exporting ? "Exporting..." : "Export products"}
                        </button>

                        <button
                            onClick={fetchProducts}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center">
                        <Package className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">{products.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center">
                        <Calendar className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ACTIVATE</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">
                                {products?.filter(p => p.status === 'ACTIVATE').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center">
                        <RefreshCw className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">SELLER_DEACTIVATED</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">
                                {products?.filter(p => p.status === 'SELLER_DEACTIVATED').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center">
                        <User className="h-8 w-8 text-red-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">PLATFORM_DEACTIVATED</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">
                                {products.filter(p => p.status === 'PLATFORM_DEACTIVATED').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>


            <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                {/* Updated Search Section */}
                <div className="mb-4">
                    <form onSubmit={handleSearch}>
                        <div className="relative">
                            <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
                                <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search product name, id, SKU..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-24 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                                disabled={isLoading || isSearching}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || isSearching}
                                className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg border border-gray-200 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                                {isSearching ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Search className="h-3 w-3" />
                                )}
                                Search
                            </button>
                        </div>
                    </form>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="col-span-1">
                        <SelectShop onChange={(val) => handleFilterChange('shopId', val)} placeholder="All Shop" enablePlaceholder={false} />
                    </div>
                    <div className="col-span-1">
                        <Label>Status</Label>
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
                    {/* <div className="col-span-1">
                        <Label>Listing Quality</Label>
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
                    </div> */}
                    <div className="col-span-1">
                        <div className="grid grid-cols-2 gap-1">
                            <div className="col-span-1">
                                <DatePicker
                                    id="start-date-picker"
                                    label="Start Date"
                                    value={filters.startDate ?? undefined}
                                    placeholder="dd/MM/yyyy"
                                    onChange={(_, dateStr) => handleFilterChange('startDate', dateStr)}
                                />
                            </div>
                            <div className="col-span-1">
                                <DatePicker
                                    id="end-date-picker"
                                    label="End Date"
                                    value={filters.endDate ?? undefined}
                                    placeholder="dd/MM/yyyy"
                                    onChange={(_, dateStr) => handleFilterChange('endDate', dateStr)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-full overflow-x-auto mt-6">
                    <Table>
                        {/* Updated Table Header */}
                        <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                            <TableRow>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Product Images
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Product Information
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Retail Price
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Status
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Create Date
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Action
                                </TableCell>
                            </TableRow>
                        </TableHeader>

                        {/* Updated Table Body */}
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-8 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                            <span className="text-gray-500">Loading products...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow><TableCell colSpan={6} className="py-5 text-center text-red-500">Error: {error}</TableCell></TableRow>
                            ) : products.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="py-5 text-center text-gray-500">No products found with the selected filters.</TableCell></TableRow>
                            ) : (
                                products.map((product) => {
                                    const productImages = product.images?.slice(0, 4) || []; // Show max 4 images
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
                                                                <span className="font-medium text-gray-600 dark:text-gray-300 min-w-[50px]">Profile:</span>
                                                                <span className="text-xs text-gray-800 dark:text-gray-200 truncate">{product.skus?.[0]?.id || 'N/A'}</span>
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
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Retail Price */}
                                            <TableCell className="py-3">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {product.skus?.[0]?.price?.salePrice
                                                        ? formatCurrency(product.skus[0].price.salePrice, product.skus[0].price.currency)
                                                        : 'N/A'
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
                                            <TableCell className="py-3 text-gray-500 text-sm dark:text-gray-400">
                                                {formatDate(product.createTime)}
                                            </TableCell>

                                            {/* Action */}
                                            <TableCell className="py-3">
                                                <button
                                                    onClick={() => handleViewProduct(product)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    View
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
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
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
                            Showing {pagination.totalItems === 0 ? 0 : ((pagination.currentPage - 1) * pagination.pageSize) + 1}-{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems}
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={!pagination.hasPreviousPage || isLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                            >
                                Prev
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={!pagination.hasNextPage || isLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                            >
                                Next
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