"use client";
import React, {useCallback, useEffect, useState} from "react";
import Badge from "../ui/badge/Badge";
import { ChevronDownIcon} from "@/icons";
import SelectShop from "@/components/common/SelectShop";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "@/components/ui/table";
import Image from "next/image";
import { useToast } from "@/context/ToastContext";
import { httpClient } from "@/lib/http-client";
import { Loader2, Search, RefreshCw, Eye, Package, Calendar, User, X, MapPin, CreditCard, Truck } from 'lucide-react';

interface Product {
    id: string;
    productId: string;
    title: string;
    description: string;
    status: string;
    createTime: number;
    shopId:string,
    shopName:string;
    images: {
        uri: string;
        urls: string[];
    }[];
    skus: {
        id: string;
        skuId: string;
        price: {
            originalPrice: string;
            currency: string;
            salePrice: string;
        } | null;
    }[];
    // Thêm các trường khác nếu bạn cần hiển thị
}

export const Product = () => {
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
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Pagination state
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [exporting, setExporting] = useState<boolean>(false);


    const handleFilterChange = (field: keyof typeof filters, value: string | null) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Xây dựng URL với các query parameters
            const params = new URLSearchParams();
            if (filters.shopId) params.append('shopId', filters.shopId);
            if (filters.status) params.append('status', filters.status);
            if (filters.listingQuality) params.append('listingQuality', filters.listingQuality);
            if (filters.keyword) params.append('keyword', filters.keyword);
            // Only apply date filter when both start and end are selected
            if (filters.startDate && filters.endDate) {
                params.append('startDate', filters.startDate);
                params.append('endDate', filters.endDate);
            }

            const result = await httpClient.get(`/tiktok/Products/GetProduct?${params.toString()}`);
            // API trả về một mảng trực tiếp, không có key 'data'
            setProducts(result || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown fetch error occurred";
            setError(message);
            console.error("Fetch failed", err);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const formatPrice = (price: string | undefined | null) => {
        if (!price) {
            return 'N/A';
        }
        const priceNumber = parseFloat(price);
        if (isNaN(priceNumber)) {
            return 'N/A';
        }
        return priceNumber.toLocaleString('vi-VN');
    };

    const handlerSyncProduct = async () => {
        try {
            const response = await fetch('/api/tiktok/Products/search-product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shop_id: filters.shopId,
                    status: 'ALL',
                    page_size: 100,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Error:', result.error || 'Unknown error');
                toast.error(result.error || 'Unknown error');
                return;
            }

            console.log('✅ Synced products:', result);
            toast.success(`Đồng bộ thành công ${result.count} sản phẩm!`);
            // Optionally refresh list
            fetchProducts();
        } catch (err) {
            console.error('❌ Sync failed:', err);
            toast.error('Gặp lỗi khi đồng bộ sản phẩm');
        }
    };

    // Reset to first page when filters or pageSize change, or when products are refreshed
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, pageSize]);

    // Derived pagination values
    const totalItems = products.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedProducts = products.slice(startIndex, endIndex);

    const handlePageChange = (delta: number) => {
        setCurrentPage((prev) => Math.min(Math.max(prev + delta, 1), totalPages));
    };

    const handlePageSizeChange = (val: string | null) => {
        const num = parseInt(val || "10", 10);
        setPageSize(Number.isNaN(num) ? 10 : num);
    };

    const formatUnixToDate = (ts?: number) => {
        if (!ts) return "N/A";
        const ms = ts < 1e12 ? ts * 1000 : ts; // handle seconds vs ms
        return new Date(ms).toLocaleDateString("vi-VN");
    };

    const stripHtml = (html?: string) => (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    const handleExport = async () => {
        try {
            if (products.length === 0) {
                toast.info("Không có sản phẩm để xuất");
                return;
            }
            setExporting(true);
            // Prepare data for Excel: export all filtered products, not just current page
            const rows = products.map((p) => ({
                ProductID: p.productId,
                Title: p.title,
                Shop: p.shopName || "",
                Status: p.status,
                Price: p.skus?.[0]?.price?.salePrice ? `${p.skus[0].price.salePrice} ${p.skus[0].price.currency}` : "",
                CreationDate: formatUnixToDate(p.createTime),
                Image: p.images?.[0]?.urls?.[0] || "",
                Description: stripHtml(p.description),
            }));

            const XLSX = await import("xlsx");
            const ws = XLSX.utils.json_to_sheet(rows);
            // Auto width
            const colWidths = Object.keys(rows[0] || {}).map((key) => ({ wch: Math.min(Math.max(key.length, 20), 60) }));
            // refine widths by content length
            rows.forEach((r) => {
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
            console.error("Export failed", e);
            toast.error("Xuất Excel thất bại");
        } finally {
            setExporting(false);
        }
    };
    return (
        <div>
            <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
                <div className="w-full">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Products Management</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage and sync TikTok products</p>
                    </div>
                </div>
                <div className="flex items-start w-full gap-3 sm:justify-end">
                    <div className="flex items-center gap-2">
                        <button onClick={handlerSyncProduct} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
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
                                {products.filter(p => p.status === 'ACTIVATE').length}
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
                                {products.filter(p => p.status === 'SELLER_DEACTIVATED').length}
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
                <div className="flex items-start justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:pb-4">
                    <div className="block">
                        <form>
                            <div className="relative">
                                <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
                                  <svg
                                      className="fill-gray-500 dark:fill-gray-400"
                                      width="20"
                                      height="20"
                                      viewBox="0 0 20 20"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                                        fill=""
                                    />
                                  </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search product name, id..."
                                    value={filters.keyword}
                                    onChange={(e) => handleFilterChange('keyword', e.target.value)}
                                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                                />

                                <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="col-span-1">
                        <SelectShop onChange={(val) => handleFilterChange('shopId', val)} placeholder="All Shop" enablePlaceholder={false}/>
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
                          <ChevronDownIcon/>
                        </span>
                        </div>
                    </div>
                    <div className="col-span-1">
                            <Label>Listing Quality</Label>
                            <div className="relative">
                                <Select
                                    options={optionsListing}
                                    onChange={(val) => handleFilterChange('listingQuality', val)}
                                    enablePlaceholder={false}
                                    className="dark:bg-dark-900"
                                />
                                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                          <ChevronDownIcon/>
                        </span>
                            </div>
                        </div>
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
                <div className="max-w-full overflow-x-auto">
                    <Table>
                        {/* Table Header */}
                        <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                            <TableRow>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Products
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Products Info
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Price
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Status
                                </TableCell>
                                {/*<TableCell*/}
                                {/*    isHeader*/}
                                {/*    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"*/}
                                {/*>*/}
                                {/*    Listing Quality*/}
                                {/*</TableCell>*/}
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Creation Date
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Action
                                </TableCell>
                            </TableRow>
                        </TableHeader>

                        {/* Table Body */}

                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {/* 3. THÊM LOGIC HIỂN THỊ LOADING, ERROR, EMPTY */}
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="py-5 text-center text-gray-500">Loading products...</TableCell></TableRow>
                            ) : error ? (
                                <TableRow><TableCell colSpan={6} className="py-5 text-center text-red-500">Error: {error}</TableCell></TableRow>
                            ) : products.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="py-5 text-center text-gray-500">No products found with the selected filters.</TableCell></TableRow>
                            ) : (
                                // 4. SỬA LẠI CÁCH RENDER DỮ LIỆU CHO ĐÚNG CẤU TRÚC
                                paginatedProducts.map((product) => {
                                    // Ensure a safe image src; Next/Image must not get empty string
                                    const firstUrl = product.images?.[0]?.urls?.[0];
                                    const imageUrl = firstUrl && firstUrl.trim() !== "" ? firstUrl : undefined;
                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-[50px] w-[50px] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                                                        {imageUrl ? (
                                                            <Image
                                                                width={50}
                                                                height={50}
                                                                src={imageUrl}
                                                                className="object-cover h-full w-full"
                                                                alt={product.title}
                                                            />
                                                        ) : (
                                                            <Image
                                                                width={50}
                                                                height={50}
                                                                src="/images/product/product-01.jpg"
                                                                className="object-cover h-full w-full"
                                                                alt="placeholder"
                                                            />
                                                        )}
                                                    </div>
                                                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 max-w-[250px] truncate">{product.title}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                <div className="flex flex-col space-y-1 max-w-[280px]">
                                                    <span>ID: {product.productId}</span>
                                                    <span>SKUId: {product.skus?.[0]?.id}</span>
                                                    <span>Shop: {product.shopName}</span>
                                                    <div
                                                        dangerouslySetInnerHTML={{ __html: product.description || "" }}
                                                        className="prose prose-sm max-w-none max-h-20 overflow-y-auto text-gray-500"
                                                    ></div>


                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                {product.skus?.[0]?.price?.salePrice
                                                    ? `${formatPrice(product.skus[0].price.salePrice)} ${product.skus[0].price.currency}`
                                                    : 'N/A'
                                                }
                                            </TableCell>
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
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                {formatUnixToDate(product.createTime)}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-2">
                                                    {/* <button className="text-blue-500 hover:text-blue-600">View</button> */}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Pagination controls */}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
                        <div className="w-28">
                            {/* Reuse existing Select component */}
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
                            Showing {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} of {totalItems}
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(-1)}
                                disabled={currentPage <= 1}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                            >
                                Prev
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage >= totalPages}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};
