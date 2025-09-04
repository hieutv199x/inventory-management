"use client";
import React, { useEffect } from "react";
import { X, Package, Image as ImageIcon, CreditCard } from 'lucide-react';
import Image from "next/image";
import Badge from "../ui/badge/Badge";
import type { Product } from "@/types/product";
import { Modal } from "../ui/modal";

interface ProductDetailModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isOpen, onClose }) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !product) return null;

    const formatPrice = (price: string | undefined | null) => {
        if (!price) return 'N/A';
        const priceNumber = parseFloat(price);
        if (isNaN(priceNumber)) return 'N/A';
        return priceNumber.toLocaleString('vi-VN');
    };

    const formatUnixToDate = (ts?: number) => {
        if (!ts) return "N/A";
        const ms = ts < 1e12 ? ts * 1000 : ts;
        return new Date(ms).toLocaleDateString("vi-VN", {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.src = "/images/product/product-01.jpg";
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[90vw] max-h-[95vh] overflow-hidden">
            {/* Modal Backdrop */}
            <div 
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />
            
            {/* Modal Container */}
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-2 text-center sm:p-4">
                    <div 
                        className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-4 sm:w-full sm:max-w-[85vw] dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-10 py-3 dark:border-gray-700 dark:bg-gray-800">
                            <div>
                                <h3 id="modal-title" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">
                                    Product Details
                                </h3>
                                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                                    View complete product information
                                </p>
                            </div>
                            <button
                                type="button"
                                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:bg-gray-800 dark:hover:text-gray-300"
                                onClick={onClose}
                            >
                                <span className="sr-only">Close</span>
                                <X className="h-7 w-7" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="bg-white px-10 py-10 dark:bg-gray-800">
                            <div className="max-h-[75vh] overflow-y-auto">
                                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                                    {/* Left Column - Images */}
                                    <div>
                                        <div className="mb-8 flex items-center gap-3">
                                            <ImageIcon className="h-7 w-7 text-gray-400" />
                                            <h4 className="text-xl font-medium text-gray-900 dark:text-white">Product Images</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            {product.images && product.images.length > 0 ? (
                                                product.images.map((image, index) => (
                                                    image.urls.map((url, urlIndex) => (
                                                        <div key={`${index}-${urlIndex}`} className="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                                            <Image
                                                                src={url}
                                                                alt={`${product.title} - Image ${index + 1}`}
                                                                width={300}
                                                                height={300}
                                                                className="h-full w-full object-cover"
                                                                onError={handleImageError}
                                                                unoptimized={true}
                                                            />
                                                        </div>
                                                    ))
                                                ))
                                            ) : (
                                                <div className="col-span-2 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                                    <ImageIcon className="h-20 w-20 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column - Product Info */}
                                    <div className="space-y-10">
                                        {/* Basic Info */}
                                        <div>
                                            <div className="mb-8 flex items-center gap-3">
                                                <Package className="h-7 w-7 text-gray-400" />
                                                <h4 className="text-xl font-medium text-gray-900 dark:text-white">Basic Information</h4>
                                            </div>
                                            <div className="space-y-6">
                                                <div>
                                                    <dt className="text-base font-medium text-gray-500 dark:text-gray-400">Product Title</dt>
                                                    <dd className="mt-3 text-lg text-gray-900 dark:text-white">{product.title}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-base font-medium text-gray-500 dark:text-gray-400">Product ID</dt>
                                                    <dd className="mt-3 text-lg font-mono text-gray-900 dark:text-white">{product.productId}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-base font-medium text-gray-500 dark:text-gray-400">Shop</dt>
                                                    <dd className="mt-3 text-lg text-gray-900 dark:text-white">{product.shopName || product.shop?.shopName}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-base font-medium text-gray-500 dark:text-gray-400">Status</dt>
                                                    <dd className="mt-3">
                                                        <Badge
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
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-base font-medium text-gray-500 dark:text-gray-400">Created Date</dt>
                                                    <dd className="mt-3 text-lg text-gray-900 dark:text-white">{formatUnixToDate(product.createTime)}</dd>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SKUs */}
                                        <div>
                                            <div className="mb-8 flex items-center gap-3">
                                                <CreditCard className="h-7 w-7 text-gray-400" />
                                                <h4 className="text-xl font-medium text-gray-900 dark:text-white">SKUs & Pricing</h4>
                                            </div>
                                            <div className="space-y-6">
                                                {product.skus && product.skus.length > 0 ? (
                                                    product.skus.map((sku) => (
                                                        <div key={sku.id} className="rounded-lg border border-gray-200 p-6 dark:border-gray-600">
                                                            <dl className="grid grid-cols-2 gap-4 text-base">
                                                                <div>
                                                                    <dt className="font-medium text-gray-500 dark:text-gray-400">SKU ID</dt>
                                                                    <dd className="mt-2 font-mono text-gray-900 dark:text-white">{sku.skuId}</dd>
                                                                </div>
                                                                <div>
                                                                    <dt className="font-medium text-gray-500 dark:text-gray-400">Sale Price</dt>
                                                                    <dd className="mt-2 text-gray-900 dark:text-white">
                                                                        {sku.price ? `${formatPrice(sku.price.salePrice)} ${sku.price.currency}` : 'N/A'}
                                                                    </dd>
                                                                </div>
                                                                {sku.price?.originalPrice && (
                                                                    <div className="col-span-2">
                                                                        <dt className="font-medium text-gray-500 dark:text-gray-400">Original Price</dt>
                                                                        <dd className="mt-2 text-gray-500 line-through dark:text-gray-400">
                                                                            {formatPrice(sku.price.originalPrice)} {sku.price.currency}
                                                                        </dd>
                                                                    </div>
                                                                )}
                                                            </dl>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-base text-gray-500 dark:text-gray-400">No SKUs available</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {product.description && (
                                    <div className="mt-12">
                                        <h4 className="mb-6 text-xl font-medium text-gray-900 dark:text-white">
                                            Product Description
                                        </h4>
                                        <div 
                                            className="max-h-80 overflow-y-auto rounded-lg bg-gray-50 p-8 prose prose-lg max-w-none dark:bg-gray-700 dark:prose-invert"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-10 py-4 dark:bg-gray-900">
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-lg font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                    onClick={onClose}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ProductDetailModal;
