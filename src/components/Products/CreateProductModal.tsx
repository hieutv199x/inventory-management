"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Plus, Trash2, Upload, Image as ImageIcon, Package, DollarSign, Layers, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { httpClient } from '@/lib/http-client';
import { toast } from 'react-hot-toast';

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (product: any) => void;
}

interface ProductFormData {
    title: string;
    description: string;
    brandId?: string;
    categoryId: string;
    categoryVersion: string;
    mainImages: Array<{
        uri: string;
        width: number;
        height: number;
    }>;
    skus: Array<{
        sellerSku: string;
        price: {
            currency: string;
            salePrice: string;
            taxExclusivePrice: string;
        };
        inventory: Array<{
            warehouseId: string;
            quantity: number;
        }>;
    }>;
    packageDimensions?: {
        height: string;
        length: string;
        width: string;
        unit: string;
    };
    packageWeight?: {
        value: string;
        unit: string;
    };
    isNotForSale: boolean;
    isCodAllowed: boolean;
    isPreOwned: boolean;
}

export default function CreateProductModal({ 
    isOpen, 
    onClose, 
    onSuccess
}: CreateProductModalProps) {
    const [formData, setFormData] = useState<ProductFormData>({
        title: '',
        description: '',
        categoryId: '',
        categoryVersion: 'v1',
        mainImages: [],
        skus: [{
            sellerSku: '',
            price: {
                currency: 'USD',
                salePrice: '',
                taxExclusivePrice: ''
            },
            inventory: [{
                warehouseId: 'default',
                quantity: 0
            }]
        }],
        isNotForSale: false,
        isCodAllowed: false,
        isPreOwned: false
    });

    const [isCreating, setIsCreating] = useState(false);
    const [categories] = useState<any[]>([
        { categoryId: 'electronics', categoryName: 'Electronics' },
        { categoryId: 'clothing', categoryName: 'Clothing & Accessories' },
        { categoryId: 'home-garden', categoryName: 'Home & Garden' },
        { categoryId: 'beauty-health', categoryName: 'Beauty & Health' },
        { categoryId: 'sports', categoryName: 'Sports & Outdoors' },
        { categoryId: 'books-media', categoryName: 'Books & Media' },
        { categoryId: 'toys-games', categoryName: 'Toys & Games' },
        { categoryId: 'automotive', categoryName: 'Automotive' },
        { categoryId: 'other', categoryName: 'Other' }
    ]);
    const [brands] = useState<any[]>([]);
    const [isLoadingMetadata] = useState(false);

    const handleInputChange = (field: keyof ProductFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageAdd = () => {
        const uri = prompt('Enter image URI:');
        if (uri) {
            setFormData(prev => ({
                ...prev,
                mainImages: [...prev.mainImages, {
                    uri,
                    width: 1000,
                    height: 1000
                }]
            }));
        }
    };

    const handleImageRemove = (index: number) => {
        setFormData(prev => ({
            ...prev,
            mainImages: prev.mainImages.filter((_, i) => i !== index)
        }));
    };

    const handleSkuChange = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            skus: prev.skus.map((sku, i) => {
                if (i === index) {
                    if (field.includes('.')) {
                        const [parent, child] = field.split('.');
                        const parentValue = sku[parent as keyof typeof sku];
                        return {
                            ...sku,
                            [parent]: {
                                ...(typeof parentValue === 'object' && parentValue !== null ? parentValue : {}),
                                [child]: value
                            }
                        };
                    }
                    return { ...sku, [field]: value };
                }
                return sku;
            })
        }));
    };

    const handleAddSku = () => {
        setFormData(prev => ({
            ...prev,
            skus: [...prev.skus, {
                sellerSku: '',
                price: {
                    currency: 'USD',
                    salePrice: '',
                    taxExclusivePrice: ''
                },
                inventory: [{
                    warehouseId: 'default',
                    quantity: 0
                }]
            }]
        }));
    };

    const handleRemoveSku = (index: number) => {
        if (formData.skus.length > 1) {
            setFormData(prev => ({
                ...prev,
                skus: prev.skus.filter((_, i) => i !== index)
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title || !formData.categoryId || !formData.description) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.skus.some(sku => !sku.sellerSku || !sku.price.salePrice)) {
            toast.error('Please fill in all SKU information');
            return;
        }

        setIsCreating(true);
        try {
            const response = await httpClient.post('/api/products/create', {
                ...formData
            });

            if (response.data.success) {
                toast.success('Product created successfully!');
                onSuccess(response.data.product);
                onClose();
                
                // Reset form
                setFormData({
                    title: '',
                    description: '',
                    categoryId: '',
                    categoryVersion: 'v1',
                    mainImages: [],
                    skus: [{
                        sellerSku: '',
                        price: {
                            currency: 'USD',
                            salePrice: '',
                            taxExclusivePrice: ''
                        },
                        inventory: [{
                            warehouseId: 'default',
                            quantity: 0
                        }]
                    }],
                    isNotForSale: false,
                    isCodAllowed: false,
                    isPreOwned: false
                });
            }
        } catch (error: any) {
            console.error('Create product error:', error);
            toast.error(error.response?.data?.error || 'Failed to create product');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Create New Product
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                <Package className="h-5 w-5 mr-2" />
                                Basic Information
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Product Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter product title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Category *
                                    </label>
                                    <select
                                        required
                                        value={formData.categoryId}
                                        onChange={(e) => handleInputChange('categoryId', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isLoadingMetadata}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.categoryId} value={cat.categoryId}>
                                                {cat.categoryName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Brand
                                    </label>
                                    <select
                                        value={formData.brandId || ''}
                                        onChange={(e) => handleInputChange('brandId', e.target.value || undefined)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isLoadingMetadata}
                                    >
                                        <option value="">Select Brand (Optional)</option>
                                        {brands.map(brand => (
                                            <option key={brand.brandId || brand.id} value={brand.brandId || brand.id}>
                                                {brand.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.isNotForSale}
                                            onChange={(e) => handleInputChange('isNotForSale', e.target.checked)}
                                            className="mr-2"
                                        />
                                        Not for sale
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.isCodAllowed}
                                            onChange={(e) => handleInputChange('isCodAllowed', e.target.checked)}
                                            className="mr-2"
                                        />
                                        COD allowed
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter product description (HTML supported)"
                                />
                            </div>
                        </div>

                        {/* Images */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                <ImageIcon className="h-5 w-5 mr-2" />
                                Product Images
                            </h4>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {formData.mainImages.map((image, index) => (
                                    <div key={index} className="relative">
                                        <Image
                                            src={image.uri}
                                            alt={`Product ${index + 1}`}
                                            width={128}
                                            height={128}
                                            className="w-full h-32 object-cover rounded border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleImageRemove(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                
                                <button
                                    type="button"
                                    onClick={handleImageAdd}
                                    className="h-32 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500"
                                >
                                    <Plus className="h-6 w-6 mb-1" />
                                    Add Image
                                </button>
                            </div>
                        </div>

                        {/* SKUs */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                <Layers className="h-5 w-5 mr-2" />
                                SKUs & Inventory
                            </h4>
                            
                            {formData.skus.map((sku, index) => (
                                <div key={index} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h5 className="font-medium">SKU #{index + 1}</h5>
                                        {formData.skus.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSku(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Seller SKU *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={sku.sellerSku}
                                                onChange={(e) => handleSkuChange(index, 'sellerSku', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Sale Price *
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={sku.price.salePrice}
                                                onChange={(e) => handleSkuChange(index, 'price.salePrice', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tax Exclusive Price
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={sku.price.taxExclusivePrice}
                                                onChange={(e) => handleSkuChange(index, 'price.taxExclusivePrice', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={sku.inventory[0]?.quantity || 0}
                                                onChange={(e) => {
                                                    const newSkus = [...formData.skus];
                                                    newSkus[index].inventory[0] = {
                                                        ...newSkus[index].inventory[0],
                                                        quantity: parseInt(e.target.value) || 0
                                                    };
                                                    setFormData(prev => ({ ...prev, skus: newSkus }));
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <button
                                type="button"
                                onClick={handleAddSku}
                                className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Another SKU
                            </button>
                        </div>

                        {/* Package Information */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                Package Information (Optional)
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <h5 className="font-medium">Dimensions</h5>
                                    <div className="grid grid-cols-4 gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Length"
                                            value={formData.packageDimensions?.length || ''}
                                            onChange={(e) => handleInputChange('packageDimensions', {
                                                ...formData.packageDimensions,
                                                length: e.target.value,
                                                unit: formData.packageDimensions?.unit || 'cm'
                                            })}
                                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Width"
                                            value={formData.packageDimensions?.width || ''}
                                            onChange={(e) => handleInputChange('packageDimensions', {
                                                ...formData.packageDimensions,
                                                width: e.target.value,
                                                unit: formData.packageDimensions?.unit || 'cm'
                                            })}
                                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Height"
                                            value={formData.packageDimensions?.height || ''}
                                            onChange={(e) => handleInputChange('packageDimensions', {
                                                ...formData.packageDimensions,
                                                height: e.target.value,
                                                unit: formData.packageDimensions?.unit || 'cm'
                                            })}
                                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <select
                                            value={formData.packageDimensions?.unit || 'cm'}
                                            onChange={(e) => handleInputChange('packageDimensions', {
                                                ...formData.packageDimensions,
                                                unit: e.target.value
                                            })}
                                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="cm">cm</option>
                                            <option value="in">in</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <h5 className="font-medium">Weight</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Weight"
                                            value={formData.packageWeight?.value || ''}
                                            onChange={(e) => handleInputChange('packageWeight', {
                                                ...formData.packageWeight,
                                                value: e.target.value,
                                                unit: formData.packageWeight?.unit || 'kg'
                                            })}
                                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <select
                                            value={formData.packageWeight?.unit || 'kg'}
                                            onChange={(e) => handleInputChange('packageWeight', {
                                                ...formData.packageWeight,
                                                unit: e.target.value
                                            })}
                                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="kg">kg</option>
                                            <option value="g">g</option>
                                            <option value="lb">lb</option>
                                            <option value="oz">oz</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                        disabled={isCreating}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isCreating || isLoadingMetadata}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                        {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isCreating ? 'Creating...' : 'Create Product'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}