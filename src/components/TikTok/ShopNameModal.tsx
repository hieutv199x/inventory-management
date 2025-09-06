"use client";
import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { X, Store, Loader2 } from "lucide-react";

interface ShopNameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (managedName: string) => Promise<void>;
    shopData: {
        shopId: string;
        shopName: string;
    } | null;
    isLoading?: boolean;
}

const ShopNameModal: React.FC<ShopNameModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    shopData,
    isLoading = false
}) => {
    const [managedName, setManagedName] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        const trimmedName = managedName.trim();
        if (!trimmedName) {
            setError("Please enter a managed name for your shop");
            return;
        }

        if (trimmedName.length < 2) {
            setError("Managed name must be at least 2 characters long");
            return;
        }

        if (trimmedName.length > 50) {
            setError("Managed name must be less than 50 characters");
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit(trimmedName);
            // Reset form on success
            setManagedName("");
            setError("");
        } catch (err: any) {
            setError(err.message || "Failed to save managed name");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setManagedName("");
            setError("");
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full">
                            <Store className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                Shop Connected Successfully!
                            </h3>
                            <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">
                                Give your shop a friendly name for easier management
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Shop Details */}
                        <div>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                TikTok Shop Details
                            </h4>
                            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-600 dark:text-gray-300">Shop Name</dt>
                                    <dd className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                        {shopData?.shopName || 'N/A'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-600 dark:text-gray-300">Shop ID</dt>
                                    <dd className="text-lg font-mono text-gray-900 dark:text-white mt-1">
                                        {shopData?.shopId || 'N/A'}
                                    </dd>
                                </div>
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>Successfully connected and authorized</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Managed Name Form */}
                        <div>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                Set Managed Name
                            </h4>
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="managedName" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Managed Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="managedName"
                                        value={managedName}
                                        onChange={(e) => setManagedName(e.target.value)}
                                        placeholder="Enter a friendly name for this shop..."
                                        className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        maxLength={50}
                                        disabled={submitting}
                                        required
                                    />
                                    <div className="mt-3 flex justify-between items-center">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            This name will help you identify this shop in your dashboard
                                        </p>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {managedName.length}/50
                                        </span>
                                    </div>
                                    {error && (
                                        <p className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                            {error}
                                        </p>
                                    )}
                                </div>

                                {/* Example suggestions */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                    <h5 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                                        💡 Naming suggestions:
                                    </h5>
                                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                                        <li>• Use location: "US Main Store", "UK Fashion Shop"</li>
                                        <li>• Use category: "Electronics Store", "Fashion Boutique"</li>
                                        <li>• Use purpose: "Dropshipping Store", "Test Shop"</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-gray-200 dark:border-gray-600">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="px-6 py-3 text-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Skip for Now
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !managedName.trim()}
                            className="px-8 py-3 text-lg font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-colors"
                        >
                            {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                            {submitting ? 'Saving...' : 'Save & Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ShopNameModal;
