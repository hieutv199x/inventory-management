"use client";
import React, { useState } from "react";
import { X, RefreshCw } from 'lucide-react';
import { Modal } from "../ui/modal";
import SelectShop from "../common/SelectShop";
import Label from "../form/Label";
import ShopSelector from "../ui/ShopSelector";

interface SyncProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSync: (shopId: string, status: string) => Promise<void>;
}

const SyncProductModal: React.FC<SyncProductModalProps> = ({ isOpen, onClose, onSync }) => {
    const [selectedShopId, setSelectedShopId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSync = async () => {
        if (!selectedShopId) {
            alert("Please select a shop first");
            return;
        }

        setIsLoading(true);
        try {
            await onSync(selectedShopId, "ALL"); // Mặc định là ALL
            onClose();
            // Reset form
            setSelectedShopId("");
        } catch (error) {
            console.error("Sync failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
            // Reset form
            setSelectedShopId("");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md" showCloseButton={false}>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={handleClose} />
            
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <div 
                        className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <RefreshCw className="h-6 w-6 text-blue-600" />
                                <div>
                                    <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                                        Sync Products
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Select shop to sync all products from TikTok
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:hover:text-gray-300"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                <span className="sr-only">Close</span>
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="bg-white px-6 py-6 dark:bg-gray-800">
                            <div className="space-y-6">
                                {/* Shop Selection */}
                                <div>
                                    <ShopSelector
                                        onChange={(shopId: string | null, shop: any | null) => setSelectedShopId(shopId ?? '')}
                                        showSelected={false}
                                    />
                                    {!selectedShopId && (
                                        <p className="mt-1 text-xs text-red-500">Shop selection is required</p>
                                    )}
                                </div>

                                {/* Info Box */}
                                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                                Sync Information
                                            </h3>
                                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>This will fetch all products from TikTok and save them to the database</li>
                                                    <li>Existing products will be updated with new information</li>
                                                    <li>The process may take a few minutes depending on the number of products</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 dark:bg-gray-900">
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                    onClick={handleClose}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleSync}
                                    disabled={isLoading || !selectedShopId}
                                >
                                    {isLoading ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Syncing...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="h-4 w-4" />
                                            Start Sync
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default SyncProductModal;
