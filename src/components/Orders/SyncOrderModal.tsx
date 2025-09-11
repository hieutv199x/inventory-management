"use client";
import React, { useState } from "react";
import { X, RefreshCw, Calendar } from 'lucide-react';
import { Modal } from "../ui/modal";
import ShopSelector from "../ui/ShopSelector";
import DatePicker from "../form/date-picker";

interface SyncOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSync: (shopId: string, dateFrom?: string, dateTo?: string) => Promise<void>;
}

const SyncOrderModal: React.FC<SyncOrderModalProps> = ({ isOpen, onClose, onSync }) => {
    const [selectedShopId, setSelectedShopId] = useState<string>("");
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    // Helper function to get date with timezone offset
    const getDateWithTimezone = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000; // Convert to milliseconds
        const localTime = new Date(date.getTime() - offset);
        return localTime.toISOString().slice(0, 16);
    };

    // Set default date range (last 7 days)
    const setDefaultDateRange = () => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        setDateFrom(getDateWithTimezone(sevenDaysAgo));
        setDateTo(getDateWithTimezone(today));
    };

    const handleSync = async () => {
        if (!selectedShopId) {
            alert("Please select a shop first");
            return;
        }

        setIsLoading(true);
        try {
            await onSync(selectedShopId, dateFrom, dateTo);
            onClose();
            // Reset form
            setSelectedShopId("");
            setDateFrom("");
            setDateTo("");
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
            setDateFrom("");
            setDateTo("");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[60vw]" showCloseButton={false}>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={handleClose} />
            
            <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9999 }}>
                <div className="flex min-h-full items-center justify-center p-4" style={{ overflow: 'visible' }}>
                    <div 
                        className="relative transform overflow-visible rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                        style={{ zIndex: 10000 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <RefreshCw className="h-6 w-6 text-blue-600" />
                                <div>
                                    <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                                        Sync Orders
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Select shop and date range to sync orders from TikTok
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
                        <div className="bg-white px-6 py-6 dark:bg-gray-800" style={{ overflow: 'visible' }}>
                            <div className="space-y-6" style={{ overflow: 'visible' }}>
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

                                {/* Date Range Selection */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <DatePicker
                                            id="sync-date-from"
                                            label="From Date"
                                            placeholder="Select start date"
                                            value={dateFrom}
                                            onChange={(_, dateStr) => setDateFrom(dateStr)}
                                        />
                                    </div>
                                    <div>
                                        <DatePicker
                                            id="sync-date-to"
                                            label="To Date"
                                            placeholder="Select end date"
                                            value={dateTo}
                                            onChange={(_, dateStr) => setDateTo(dateStr)}
                                        />
                                    </div>
                                </div>

                                {/* Quick Date Range Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={setDefaultDateRange}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                    >
                                        <Calendar className="h-3 w-3" />
                                        Last 7 days
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const today = new Date();
                                            const thirtyDaysAgo = new Date();
                                            thirtyDaysAgo.setDate(today.getDate() - 30);
                                            setDateFrom(getDateWithTimezone(thirtyDaysAgo));
                                            setDateTo(getDateWithTimezone(today));
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                    >
                                        <Calendar className="h-3 w-3" />
                                        Last 30 days
                                    </button>
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
                                                    <li>This will fetch orders from TikTok within the selected date range</li>
                                                    <li>Existing orders will be updated with new information</li>
                                                    <li>If no date range is selected, recent orders will be synced</li>
                                                    <li>The process may take a few minutes depending on the number of orders</li>
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

export default SyncOrderModal;
