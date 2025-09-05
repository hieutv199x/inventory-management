"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Shield, Eye, Clock, Building } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { useToast } from "@/context/ToastContext";
import { httpClient } from "@/lib/http-client";
import SelectShop from "@/components/common/SelectShop";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { ChevronDownIcon } from "@/icons";
import DatePicker from "@/components/form/date-picker";
import { formatCurrency } from "@/utils/common/functionFormat";

interface FraudAlert {
    id: string;
    paymentId: string;
    shopId: string;
    shopName: string;
    sellerName: string;
    bankCreatedDate: number | null;
    orderBankAccount: string | null;
    configuredBankAccount: string | null;
    alertType: 'MISMATCH' | 'NO_BANK_ASSIGNED' | 'MATCHED';
    amount: number;
    currency: string;
    paidTime: number;
    detectedDate: number;
}

const AlertTypeMap = {
    MISMATCH: { label: 'Bank Mismatch', color: 'error' as const, icon: AlertTriangle },
    NO_BANK_ASSIGNED: { label: 'No Bank Assigned', color: 'warning' as const, icon: Building },
    MATCHED: { label: 'Matched', color: 'success' as const, icon: Shield },
};

export default function FraudAlertPage() {
    const toast = useToast();
    
    const [filters, setFilters] = useState({
        shopId: "",
        startDate: null as string | null,
        endDate: null as string | null,
        alertType: "",
    });
    
    const [alerts, setAlerts] = useState<FraudAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleFilterChange = (field: keyof typeof filters, value: string | null) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const fetchAlerts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filters.shopId) params.append('shopId', filters.shopId);
            if (filters.alertType) params.append('alertType', filters.alertType);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const result = await httpClient.get(`/fraud-alert?${params.toString()}`);
            setAlerts(result?.alerts || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown fetch error occurred";
            setError(message);
            console.error("Fetch failed", err);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, [filters.shopId, filters.alertType, filters.startDate, filters.endDate]);


    const formatUnixToDate = (ts: number) => {
        if (!ts) return "N/A";
        const ms = ts < 1e12 ? ts * 1000 : ts;
        return new Date(ms).toLocaleDateString("vi-VN", {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getAlertTypeInfo = (type: keyof typeof AlertTypeMap) => {
        return AlertTypeMap[type] || { label: type, color: 'neutral' as const, icon: AlertTriangle };
    };

    // Statistics
    const totalAlerts = alerts.length;
    const mismatchAlerts = alerts.filter(a => a.alertType === 'MISMATCH').length;
    const noBankAlerts = alerts.filter(a => a.alertType === 'NO_BANK_ASSIGNED').length;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
                <div className="w-full">
                    <div className="mb-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Fraud Alert</h1>
                                <p className="text-gray-600 dark:text-gray-400">Monitor bank account mismatches and security alerts</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-start w-full gap-3 sm:justify-end">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchAlerts}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Alerts</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">{totalAlerts}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center">
                        <Building className="h-8 w-8 text-orange-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bank Mismatches</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">{mismatchAlerts}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center">
                        <Shield className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No Bank Assigned</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">{noBankAlerts}</p>
                        </div>
                    </div>
                </div>
                
            </div>


            {/* Main Content */}
            <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                {/* Filters */}
                <div className="grid sm:grid-cols-4 gap-4 mb-6">
                    <div className="col-span-1">
                        <SelectShop 
                            onChange={(val) => handleFilterChange('shopId', val)} 
                            placeholder="All Shops" 
                            enablePlaceholder={true}
                        />
                    </div>
                    <div className="col-span-1">
                        <Label>Alert Type</Label>
                        <div className="relative">
                            <Select
                                options={[
                                    { label: "All Types", value: "" },
                                    { label: "Bank Mismatches", value: "MISMATCH" },
                                    { label: "No Bank Assigned", value: "NO_BANK_ASSIGNED" },
                                ]}
                                onChange={(val) => handleFilterChange('alertType', val)}
                                enablePlaceholder={false}
                                className="dark:bg-dark-900"
                            />
                            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                <ChevronDownIcon/>
                            </span>
                        </div>
                    </div>
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

                {/* Table */}
                <div className="max-w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                            <TableRow>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    No
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Ngày phát hiện
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Seller
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Trạng thái
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Số tiền
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    PaymentId
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Ngày paid
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Bank Accounts
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Bank get
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Ngày get bank
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Shop
                                </TableCell>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="py-5 text-center text-gray-500">
                                        Loading alerts...
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="py-5 text-center text-red-500">
                                        Error: {error}
                                    </TableCell>
                                </TableRow>
                            ) : alerts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="py-5 text-center text-gray-500">
                                        No fraud alerts found with the selected filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                alerts.map((alert, index) => {
                                    const alertInfo = getAlertTypeInfo(alert.alertType);
                                    const AlertIcon = alertInfo.icon;
                                    
                                    return (
                                        <TableRow key={alert.id}>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                {formatUnixToDate(alert.detectedDate)}
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                {alert.sellerName}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <AlertIcon className={`h-4 w-4 ${
                                                        alert.alertType === 'MISMATCH' ? 'text-red-500' : 
                                                        alert.alertType === 'NO_BANK_ASSIGNED' ? 'text-orange-500' : 
                                                        'text-green-500'
                                                    }`} />
                                                    <Badge size="sm" color={alertInfo.color}>
                                                        {alert.alertType === 'MISMATCH' ? 'Không khớp' : 
                                                         alert.alertType === 'NO_BANK_ASSIGNED' ? 'Chưa gắn Bank' : 
                                                         alertInfo.label}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                {formatCurrency(alert.amount.toString(), alert.currency)}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <p className="font-mono text-gray-800 text-theme-sm dark:text-white/90">
                                                    {alert.paymentId}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                {formatUnixToDate(alert.paidTime)}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <p className="font-mono text-gray-800 text-theme-sm dark:text-white/90">
                                                    {alert.orderBankAccount 
                                                        ? `*****${alert.orderBankAccount.slice(-4)}` 
                                                        : 'N/A'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <p className="font-mono text-gray-800 text-theme-sm dark:text-white/90">
                                                    {alert.configuredBankAccount
                                                        ? `*****${alert.configuredBankAccount.slice(-4)}`
                                                        : 'N/A'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                {formatUnixToDate(alert.bankCreatedDate || 0)}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div>
                                                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                        {alert.shopName}
                                                    </p>
                                                    <p className="font-mono text-gray-500 text-theme-xs dark:text-gray-400">
                                                        {alert.shopId}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}



