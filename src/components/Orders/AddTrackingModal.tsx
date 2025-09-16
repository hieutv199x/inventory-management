'use client';

import React, { useState, useEffect, use } from 'react';
import { X, Truck, Package, ChevronDownIcon } from 'lucide-react';
import { Modal } from '../ui/modal';
import { httpClient } from '@/lib/http-client';
import { useLoading } from '@/context/loadingContext';
import Select from '../form/Select';
import Label from '../form/Label';

interface AddTrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (trackingNumber: string, shippingProviderId: string, packageId?: string) => Promise<void>;
    orderId: string;
    loading?: boolean;
    packages?: any[];
}

const AddTrackingModal: React.FC<AddTrackingModalProps> = ({
    isOpen,
    onClose,
    onSave,
    orderId,
    packages,
    loading = false
}) => {
    const [packageId, setPackageId] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shippingProvider, setShippingProvider] = useState('');
    const [availableProviders, setAvailableProviders] = useState<any[]>([]);
    const { showLoading, hideLoading } = useLoading();
    const [disable, setDisable] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setTrackingNumber('');
            setShippingProvider('');
            setAvailableProviders([]);

            // Fetch shipping providers for the order
            if (orderId) {
                fetchShippingProviders();
            }
        }
    }, [isOpen, orderId]);

    useEffect(() => {
        if (packageId) {
            const selectedPackage = packages?.find(p => p.packageId === packageId);
            if (selectedPackage?.shippingProviderId) {
                setShippingProvider(selectedPackage.shippingProviderId);
                setTrackingNumber(selectedPackage.trackingNumber || '');
                setDisable(true);
            } else {
                setShippingProvider('');
                setTrackingNumber('');
                setDisable(false);
            }
        }
    }, [packageId]);

    const fetchShippingProviders = async () => {
        showLoading("Loading shipping providers...");
        try {
            const response = await httpClient.get(`/tiktok/Fulfillment/shipping-provider?orderId=${orderId}`);

            if (Array.isArray(response) && response.length > 0) {
                // Use API providers if available
                setAvailableProviders(response);
            }
        } catch (error) {
            console.error('Error fetching shipping providers:', error);
            // Use default providers on error
            setAvailableProviders([]);
        } finally {
            hideLoading();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!trackingNumber.trim() || !shippingProvider.trim()) {
            alert('Please fill in both tracking number and shipping provider');
            return;
        }

        showLoading("Saving tracking information...");
        try {
            await onSave(trackingNumber.trim(), shippingProvider.trim(), packageId);
            onClose();
        } catch (error) {
            console.error('Error saving tracking information:', error);
        } finally {
            hideLoading();
        }
    };

    const handleChangePackage = (val: string) => {
        setPackageId(val);
    }

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[30vw] max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    <Truck className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Add Tracking Information
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <X className="h-5 w-5" />
                </button>
            </div >

            {/* Content */}
            < form onSubmit={handleSubmit} className="p-6" >
                <div className="mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Order ID: <span className="font-mono font-medium">{orderId}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Package list */}
                    {(packages && packages.length > 0) && (
                        <div>
                            <Label>Package</Label>
                            <div className="relative">
                                <Select
                                    options={packages?.map(x => ({ value: x.packageId, label: x.packageId })) ?? []}
                                    onChange={(val) => handleChangePackage(val)}
                                    enablePlaceholder={false}
                                    className="dark:bg-dark-900"
                                />
                                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                    <ChevronDownIcon />
                                </span>
                            </div>
                        </div>
                    )}
                    {/* Tracking Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tracking Number *
                        </label>
                        <div className="relative">
                            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                disabled={disable}
                                type="text"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter tracking number"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                required
                            />
                        </div>
                    </div>

                    {/* Shipping Provider */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Shipping Provider *
                        </label>
                        <select
                            value={shippingProvider}
                            onChange={(e) => setShippingProvider(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                            disabled={disable}
                        >
                            <option value="">
                            </option>
                            {availableProviders.map((provider, index) => {
                                // Handle both string and object providers
                                const providerName = typeof provider === 'string' ? provider : provider.name || provider.id;
                                const providerDisplayName = typeof provider === 'string' ? provider : provider.displayName || provider.name || provider.id;

                                return (
                                    <option key={`${providerName}-${index}`} value={provider.id}>
                                        {providerDisplayName}
                                    </option>
                                );
                            })}
                        </select>

                        {/* Custom provider input */}
                        {shippingProvider === 'Other' && (
                            <input
                                type="text"
                                placeholder="Enter custom shipping provider"
                                className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                onChange={(e) => setShippingProvider(e.target.value)}
                                required
                            />
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!trackingNumber.trim() || !shippingProvider.trim() || disable}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add Tracking
                    </button>
                </div>
            </form >
        </Modal >
    );
};

export default AddTrackingModal;
