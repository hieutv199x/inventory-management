"use client";
import React, { useEffect } from "react";
import { X, Package, Image as ImageIcon, CreditCard, Hash, Tag, Layers, BarChart3 } from 'lucide-react';
import Image from "next/image";
import Badge from "../ui/badge/Badge";
import type { Product } from "@/types/product";
import { Modal } from "../ui/modal";
import { useLanguage } from '@/context/LanguageContext';

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

    const { t } = useLanguage();

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
                        <div className="flex flex-col gap-4 border-b border-gray-200 bg-white px-8 py-5 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <h3 id="modal-title" className="text-2xl font-semibold leading-tight text-gray-900 dark:text-white flex items-center gap-2">
                                    <Package className="h-6 w-6 text-indigo-500" /> {t('products.detail.title')}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.detail.subtitle')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                    onClick={onClose}
                                >
                                    {t('products.detail.close')}
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none dark:bg-gray-800 dark:hover:text-gray-300"
                                    onClick={onClose}
                                    aria-label="Close"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white px-8 py-8 dark:bg-gray-800">
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                                {/* Left: Media */}
                                <div className="lg:col-span-4">
                                    <div className="sticky top-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ImageIcon className="h-5 w-5 text-gray-400" />
                                            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{t('products.detail.section.media')}</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {product.images?.length
                                                ? product.images.flatMap((img, i) =>
                                                    (img.urls || []).map((url, j) => (
                                                        <div key={`${i}-${j}`} className="aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
                                                            <Image
                                                                src={url}
                                                                alt={`${product.title} - ${i + 1}`}
                                                                width={240}
                                                                height={240}
                                                                className="h-full w-full object-cover"
                                                                onError={handleImageError}
                                                                unoptimized
                                                            />
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-2 flex aspect-square items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
                                                        <ImageIcon className="h-10 w-10 text-gray-400" />
                                                    </div>
                                                )}
                                        </div>
                                        {product.description && (
                                            <div className="mt-4">
                                                <h5 className="text-xs font-semibold tracking-wide text-gray-500 mb-2 dark:text-gray-400 uppercase">{t('products.detail.section.description')}</h5>
                                                <div className="max-h-56 overflow-y-auto rounded-md bg-gray-50 p-4 text-xs leading-relaxed dark:bg-gray-700 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: product.description }} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Structured Data */}
                                <div className="lg:col-span-8 space-y-10">
                                    {/* Core Attributes */}
                                    <section>
                                        <header className="flex items-center gap-2 mb-4">
                                            <Layers className="h-5 w-5 text-gray-400" />
                                            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{t('products.detail.section.core')}</h4>
                                        </header>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase mb-1 dark:text-gray-400">Title</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={product.title}>{product.title}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase mb-1 dark:text-gray-400">Status</p>
                                                <Badge
                                                    color={product.status === 'ACTIVATE' ? 'success' : product.status === 'PENDING' ? 'warning' : 'error'}
                                                >
                                                    {product.status}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase mb-1 dark:text-gray-400">Created</p>
                                                <p className="text-xs text-gray-700 dark:text-gray-300">{formatUnixToDate(product.createTime)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase mb-1 dark:text-gray-400">Shop</p>
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate" title={ (product as any).shop?.managedName || product.shopName || (product as any).shop?.shopName }>{ (product as any).shop?.managedName || product.shopName || (product as any).shop?.shopName || 'N/A' }</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Identifiers */}
                                    <section>
                                        <header className="flex items-center gap-2 mb-4">
                                            <Hash className="h-5 w-5 text-gray-400" />
                                            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{t('products.detail.section.identifiers')}</h4>
                                        </header>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="rounded-md border border-gray-200 p-3 dark:border-gray-600">
                                                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Product ID</p>
                                                <p className="mt-1 font-mono text-xs text-gray-800 dark:text-gray-200 break-all">{product.productId}</p>
                                            </div>
                                            <div className="rounded-md border border-gray-200 p-3 dark:border-gray-600">
                                                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Internal ID</p>
                                                <p className="mt-1 font-mono text-xs text-gray-800 dark:text-gray-200 break-all">{product.id}</p>
                                            </div>
                                            {product.skus?.[0]?.skuId && (
                                                <div className="rounded-md border border-gray-200 p-3 dark:border-gray-600">
                                                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Primary SKU</p>
                                                    <p className="mt-1 font-mono text-xs text-gray-800 dark:text-gray-200 break-all">{product.skus[0].skuId}</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Quality & Metrics (placeholder for extensibility) */}
                                    <section>
                                        <header className="flex items-center gap-2 mb-4">
                                            <BarChart3 className="h-5 w-5 text-gray-400" />
                                            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{t('products.detail.section.metrics')}</h4>
                                        </header>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                            <div className="rounded-md bg-gray-50 dark:bg-gray-700/50 p-3">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Listing Quality</p>
                                                <p className="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-200">{(product as any).listingQualityTier || (product as any).listing_quality_tier || 'UNKNOWN'}</p>
                                            </div>
                                            <div className="rounded-md bg-gray-50 dark:bg-gray-700/50 p-3">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
                                                <p className="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-200">{product.status}</p>
                                            </div>
                                            <div className="rounded-md bg-gray-50 dark:bg-gray-700/50 p-3">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Images</p>
                                                <p className="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-200">{product.images?.length || 0}</p>
                                            </div>
                                            <div className="rounded-md bg-gray-50 dark:bg-gray-700/50 p-3">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">SKU Count</p>
                                                <p className="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-200">{product.skus?.length || 0}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Pricing / SKUs */}
                                    <section>
                                        <header className="flex items-center gap-2 mb-4">
                                            <CreditCard className="h-5 w-5 text-gray-400" />
                                            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{t('products.detail.section.pricing')}</h4>
                                        </header>
                                        {product.skus?.length ? (
                                            <div className="space-y-4">
                                                {product.skus.map(sku => (
                                                    <div key={sku.id} className="rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                                                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Tag className="h-4 w-4 text-gray-400" />
                                                                <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-200">{sku.skuId}</span>
                                                            </div>
                                                            {sku.price && (
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {formatPrice(sku.price.salePrice)} {sku.price.currency}
                                                                    {sku.price.originalPrice && sku.price.originalPrice !== sku.price.salePrice && (
                                                                        <span className="ml-2 text-xs line-through text-gray-400">{formatPrice(sku.price.originalPrice)} {sku.price.currency}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Optional: product name inside SKU if available in future */}
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] text-gray-600 dark:text-gray-400">
                                                            {sku.price?.salePrice && (
                                                                <div>
                                                                    <p className="uppercase tracking-wide">Sale</p>
                                                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{formatPrice(sku.price.salePrice)}</p>
                                                                </div>
                                                            )}
                                                            {sku.price?.originalPrice && (
                                                                <div>
                                                                    <p className="uppercase tracking-wide">Original</p>
                                                                    <p className="font-semibold text-gray-800 dark:text-gray-200 line-through">{formatPrice(sku.price.originalPrice)}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.detail.no_skus')}</p>
                                        )}
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-8 py-4 dark:bg-gray-900">
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                    onClick={onClose}
                                >
                                    {t('products.detail.close')}
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
