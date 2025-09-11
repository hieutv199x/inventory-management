"use client";

import React, { useEffect, useState } from "react";
import Button from "../ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import SelectShop from "@/components/common/SelectShop";
import { httpClient } from "@/lib/http-client";
import DatePicker from "@/components/form/date-picker";
import { formatCurrency, formatDate } from "@/utils/common/functionFormat";
import { Pagination } from "@/components/ui/pagination/Pagination";
import ShopSelector from "../ui/ShopSelector";
import { useLoading } from "@/context/loadingContext";

interface Statement {
  statementId: string;
  shopId: string;
  managedName?: string;
  shopName: string;
  revenue: string;
  holdAmount: string;
  paidAmount: string;
  holdDate: number;
  bankAccount: string;
  currency: string;
}

interface PaidHistory {
  id: string;
  amountValue: string;
  shopId: string;
  paymentId: string;
  amountCurrency: string;
  createTime: number;
  status: string;
  bankAccount: string;
  shop: {
    shopName: string;
    shopId: string;
    managedName?: string
  };
}

interface Withdrawal {
  id: string;
  withdrawalId: string;
  shopId: string;
  amount: string;
  currency: string;
  status: string;
  createTime: number;
  bankAccount: string;
  shopName: string;
}

interface TikTokTransaction {
  id: string;
  transactionId?: string;
  shopId: string;
  shopName: string;
  statementId?: string;
  currency: string;
  transactionType: string;
  settlementAmount?: number;
  adjustmentAmount?: number;
  revenueAmount?: number;
  shippingCostAmount?: number;
  feeTaxAmount?: number;
  reserveAmount?: number;
  orderId?: string;
  orderCreateTime?: number;
  createTime?: number;
  adjustmentId?: string;
  adjustmentOrderId?: string;
  associatedOrderId?: string;
  reserveId?: string;
  reserveStatus?: string;
  estimatedReleaseTime?: string;
  createdAt: string;
  managedName?: string;
}

export const StatementBank = () => {
  const { showLoading, hideLoading, setLoadingMessage } = useLoading();
  const [activeTab, setActiveTab] = useState<"statements" | "payment" | "withdrawal">("statements");
  const [statementSubTab, setStatementSubTab] = useState<"statement" | "unsettled">("statement");
  const [selectedShop, setSelectedShop] = useState<string | null>("all");
  const [statements, setStatements] = useState<Statement[]>([]);
  const [paidHistories, setPaidHistories] = useState<PaidHistory[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [tikTokTransactions, setTikTokTransactions] = useState<TikTokTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination states for all tabs
  const [statementsPagination, setStatementsPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  });

  const [historyPagination, setHistoryPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  });

  const [withdrawalsPagination, setWithdrawalsPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  });

  const [unsettledPagination, setUnsettledPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  });

  const fetchStatements = async (page: number = 1, pageSize: number = 25) => {
    if (!selectedShop) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        shop_id: selectedShop,
        page: page.toString(),
        limit: pageSize.toString()
      });

      if (startDate && endDate) {
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
        params.append('start_date', startTimestamp.toString());
        params.append('end_date', endTimestamp.toString());
      }

      const res = await httpClient.get(`/statements?${params}`);

      if (res.success) {
        const rawStatements = res.data || [];
        const mappedStatements: Statement[] = rawStatements.map((item: any) => {
          // Parse channelData for TikTok-specific fields
          let channelData = {};
          try {
            channelData = item.channelData ? JSON.parse(item.channelData) : {};
          } catch (error) {
            console.warn('Failed to parse channelData for statement:', item.statementId);
          }

          return {
            managedName: item.shop?.managedName || '',
            statementId: item.statementId,
            shopId: item.shop?.shopId || item.shopId || '',
            shopName: item.shop?.shopName || '',
            revenue: (channelData as any).revenueAmount || item.revenueAmount || '0',
            holdAmount: (channelData as any).adjustmentAmount || item.adjustmentAmount || '0',
            paidAmount: item.settlementAmount || '0',
            holdDate: item.statementTime,
            bankAccount: item.bankAccount || '',
            currency: item.currency || 'USD',
          };
        });

        setStatements(mappedStatements);
        setStatementsPagination(res.pagination || {
          currentPage: page,
          totalPages: Math.ceil(rawStatements.length / pageSize),
          totalItems: rawStatements.length,
          itemsPerPage: pageSize
        });
      } else {
        // Handle legacy response format
        const rawStatements = Array.isArray(res) ? res : (res?.statements || res?.data || []);
        const mappedStatements: Statement[] = rawStatements.map((item: any) => {
          // Parse channelData for TikTok-specific fields
          let channelData = {};
          try {
            channelData = item.channelData ? JSON.parse(item.channelData) : {};
          } catch (error) {
            console.warn('Failed to parse channelData for statement:', item.statementId);
          }

          return {
            managedName: item.shop?.managedName || '',
            statementId: item.statementId,
            shopId: item.shop?.shopId || item.shopId || '',
            shopName: item.shop?.shopName || '',
            revenue: (channelData as any).revenueAmount || item.revenueAmount || '0',
            holdAmount: (channelData as any).adjustmentAmount || item.adjustmentAmount || '0',
            paidAmount: item.settlementAmount || '0',
            holdDate: item.statementTime,
            bankAccount: item.bankAccount || '',
            currency: item.currency || 'USD',
          };
        });

        setStatements(mappedStatements);
        setStatementsPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: mappedStatements.length,
          itemsPerPage: pageSize
        });
      }
    } catch (error) {
      const err = error as Error;
      console.error("Failed to fetch statements:", error);
      setError(err.message);
      setStatements([]);
    }
    setLoading(false);
  };

  const fetchPaidHistory = async (page: number = 1, pageSize: number = 25) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        shop_id: selectedShop || 'all',
        page: page.toString(),
        limit: pageSize.toString()
      });

      if (startDate && endDate) {
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
        params.append('start_date', startTimestamp.toString());
        params.append('end_date', endTimestamp.toString());
      }

      const res = await httpClient.get(`/Payments?${params}`);

      if (res.success) {
        setPaidHistories(res.data || []);
        setHistoryPagination(res.pagination || {
          currentPage: page,
          totalPages: Math.ceil((res.data?.length || 0) / pageSize),
          totalItems: res.data?.length || 0,
          itemsPerPage: pageSize
        });
      } else {
        // Handle legacy response format
        setPaidHistories(res || []);
        setHistoryPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: (res || []).length,
          itemsPerPage: pageSize
        });
      }
    } catch (error) {
      console.error("Failed to fetch paid history:", error);
      setError("Failed to fetch payment history");
      setPaidHistories([]);
    }
    setLoading(false);
  };

  const fetchWithdrawals = async (page: number = 1, pageSize: number = 25) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        shop_id: selectedShop || 'all',
        page: page.toString(),
        limit: pageSize.toString()
      });

      if (startDate && endDate) {
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
        params.append('start_date', startTimestamp.toString());
        params.append('end_date', endTimestamp.toString());
      }

      const res = await httpClient.get(`/withdrawals?${params}`);

      if (res.success) {
        const rawWithdrawals = res.data || [];
        const mappedWithdrawals: Withdrawal[] = rawWithdrawals.map((item: any) => ({
          id: item.id,
          withdrawalId: item.withdrawalId,
          shopId: item.shopId,
          amount: item.amount || '0',
          currency: item.currency || 'USD',
          status: item.status || 'UNKNOWN',
          createTime: item.createTime,
          bankAccount: item.bankAccount || '',
          shopName: item.shop?.shopName || '',
        }));

        setWithdrawals(mappedWithdrawals);
        setWithdrawalsPagination(res.pagination || {
          currentPage: page,
          totalPages: Math.ceil(rawWithdrawals.length / pageSize),
          totalItems: rawWithdrawals.length,
          itemsPerPage: pageSize
        });
      } else {
        // Handle legacy response format
        const rawWithdrawals = res || [];
        const mappedWithdrawals: Withdrawal[] = rawWithdrawals.map((item: any) => ({
          id: item.id,
          withdrawalId: item.withdrawalId,
          shopId: item.shopId,
          amount: item.amount || '0',
          currency: item.currency || 'USD',
          status: item.status || 'UNKNOWN',
          createTime: item.createTime,
          bankAccount: item.bankAccount || '',
          shopName: item.shop?.shopName || '',
        }));

        setWithdrawals(mappedWithdrawals);
        setWithdrawalsPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: mappedWithdrawals.length,
          itemsPerPage: pageSize
        });
      }
    } catch (error) {
      const err = error as Error;
      console.error("Failed to fetch withdrawals:", error);
      setError(err.message);
      setWithdrawals([]);
    }
    setLoading(false);
  };

  const fetchTikTokTransactions = async (page: number = 1, pageSize: number = 25) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        shop_id: selectedShop || 'all',
        page: page.toString(),
        limit: pageSize.toString()
      });

      if (startDate && endDate) {
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
        params.append('start_date', startTimestamp.toString());
        params.append('end_date', endTimestamp.toString());
      }

      const res = await httpClient.get(`/tiktok-transactions?${params}`);

      if (res.success) {
        const rawTransactions = res.data || [];
        const mappedTransactions: TikTokTransaction[] = rawTransactions.map((item: any) => ({
          id: item.id,
          transactionId: item.transactionId,
          shopId: item.shopId,
          shopName: item.shopName || '',
          managedName: item.managedName || '',
          statementId: item.statementId,
          currency: item.currency || 'USD',
          transactionType: item.transactionType || 'UNKNOWN', // API trả về transactionType
          settlementAmount: item.settlementAmount,
          adjustmentAmount: item.adjustmentAmount,
          revenueAmount: item.revenueAmount,
          shippingCostAmount: item.shippingCostAmount,
          feeTaxAmount: item.feeTaxAmount,
          reserveAmount: item.reserveAmount,
          orderId: item.orderId,
          orderCreateTime: item.orderCreateTime, // API trả về timestamp
          createTime: item.createTime, // API trả về timestamp
          adjustmentId: item.adjustmentId,
          adjustmentOrderId: item.adjustmentOrderId,
          associatedOrderId: item.associatedOrderId,
          reserveId: item.reserveId,
          reserveStatus: item.status || item.reserveStatus, // API trả về status
          estimatedReleaseTime: item.estimatedReleaseTime,
          createdAt: item.transactionTime ? new Date(item.transactionTime * 1000).toISOString() : new Date().toISOString(), // Convert timestamp
        }));

        setTikTokTransactions(mappedTransactions);
        setUnsettledPagination(res.pagination || {
          currentPage: page,
          totalPages: Math.ceil(rawTransactions.length / pageSize),
          totalItems: rawTransactions.length,
          itemsPerPage: pageSize
        });
      } else {
        // Handle legacy response format
        const rawTransactions = res || [];
        const mappedTransactions: TikTokTransaction[] = rawTransactions.map((item: any) => ({
          id: item.id,
          orderId: item.orderId || '',
          shopId: item.shopId,
          shopName: item.shopName || '',
          managedName: item.managedName || '',
          currency: item.currency || 'USD',
          transactionType: item.transactionType || '',
          reserveStatus: item.reserveStatus || 'UNKNOWN',
          createTime: item.createTime || 0,
          orderTime: item.orderCreateTime || 0,
          transactionId: item.transactionId || '',
          adjustmentId: item.adjustmentId,
          statementId: item.statementId || '',
          transactionTime: item.transactionTime || 0,
          settlementAmount: item.settlementAmount,
          adjustmentAmount: item.adjustmentAmount,
          feeTaxAmount: item.feeTaxAmount,
          revenueAmount: item.revenueAmount,
          shippingCostAmount: item.shippingCostAmount,
          reserveAmount: item.reserveAmount,
          description: item.description || '',
        }));

        setTikTokTransactions(mappedTransactions);
        setUnsettledPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: mappedTransactions.length,
          itemsPerPage: pageSize
        });
      }
    } catch (error) {
      const err = error as Error;
      console.error("Failed to fetch TikTok transactions:", error);
      setError(err.message);
      setTikTokTransactions([]);
    }
    setLoading(false);
  };

  const handlePaymentSync = async () => {
    if (startDate && endDate) {
      const statementTimeGe = Math.floor(new Date(startDate).getTime() / 1000);
      const statementTimeLt = Math.floor(new Date(endDate).getTime() / 1000);
      try {
        let url = `/tiktok/Finance/sync-get-payments?statementTimeGe=${statementTimeGe}&statementTimeLt=${statementTimeLt}`;
        if (selectedShop && selectedShop !== 'all') {
          url += `&shopId=${selectedShop}`;
        }
        await httpClient.get(url);
      } catch (err) {
        console.error("Sync API failed", err);
      }
    }
  };

  const handleWithdrawalSync = async () => {
    if (startDate && endDate) {
      const statementTimeGe = Math.floor(new Date(startDate).getTime() / 1000);
      const statementTimeLt = Math.floor(new Date(endDate).getTime() / 1000);
      try {
        let url = `/tiktok/Finance/SyncGetWithdrawals?statementTimeGe=${statementTimeGe}&statementTimeLt=${statementTimeLt}`;
        if (selectedShop && selectedShop !== 'all') {
          url += `&shopId=${selectedShop}`;
        }
        await httpClient.get(url);
      } catch (err) {
        console.error("Sync API failed", err);
      }
    }
  };

  // Hàm đồng bộ dữ liệu báo cáo

  const handleStatementSync = async () => {
    if (startDate && endDate) {
      const statementTimeGe = Math.floor(new Date(startDate).getTime() / 1000);
      const statementTimeLt = Math.floor(new Date(endDate).getTime() / 1000);
      try {
        let url = `/tiktok/Finance/SyncGetStatements?statementTimeGe=${statementTimeGe}&statementTimeLt=${statementTimeLt}`;
        if (selectedShop && selectedShop !== 'all') {
          url += `&shopId=${selectedShop}`;
        }
        await httpClient.get(url);
      } catch (err) {
        console.error("Sync API failed", err);
      }
    }
  };

  const handleSearch = () => {
    if (activeTab === "statements") {
      if (statementSubTab === "statement") {
        fetchStatements(1, statementsPagination.itemsPerPage);
      } else {
        fetchTikTokTransactions(1, unsettledPagination.itemsPerPage);
      }
    } else if (activeTab === "payment") {
      fetchPaidHistory(1, historyPagination.itemsPerPage);
    } else {
      fetchWithdrawals(1, withdrawalsPagination.itemsPerPage);
    }
  };

  // Pagination handlers
  const handleStatementsPageChange = (page: number) => {
    fetchStatements(page, statementsPagination.itemsPerPage);
  };

  const handleStatementsPageSizeChange = (pageSize: number) => {
    fetchStatements(1, pageSize);
  };

  const handleHistoryPageChange = (page: number) => {
    fetchPaidHistory(page, historyPagination.itemsPerPage);
  };

  const handleHistoryPageSizeChange = (pageSize: number) => {
    fetchPaidHistory(1, pageSize);
  };

  const handleWithdrawalsPageChange = (page: number) => {
    fetchWithdrawals(page, withdrawalsPagination.itemsPerPage);
  };

  const handleWithdrawalsPageSizeChange = (pageSize: number) => {
    fetchWithdrawals(1, pageSize);
  };

  const handleUnsettledPageChange = (page: number) => {
    fetchTikTokTransactions(page, unsettledPagination.itemsPerPage);
  };

  const handleUnsettledPageSizeChange = (pageSize: number) => {
    fetchTikTokTransactions(1, pageSize);
  };

  useEffect(() => {
    // Initial load without date filters
    if (activeTab === "statements") {
      if (statementSubTab === "statement") {
        fetchStatements(1, statementsPagination.itemsPerPage);
      } else {
        fetchTikTokTransactions(1, unsettledPagination.itemsPerPage);
      }
    } else if (activeTab === "payment") {
      fetchPaidHistory(1, historyPagination.itemsPerPage);
    } else {
      fetchWithdrawals(1, withdrawalsPagination.itemsPerPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statementSubTab, selectedShop]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Quản lý về tiền
        </h2>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <ShopSelector
              onChange={(shopId: string | null, shop: any | null) => setSelectedShop(shopId)}
              showSelected={false}
            />
          </div>

          <div className="min-w-[160px]">
            <DatePicker
              id="start-date-picker"
              label="Từ ngày"
              placeholder="dd/MM/yyyy"
              value={startDate}
              onChange={(_, dateStr) => setStartDate(dateStr)}
            />
          </div>

          <div className="min-w-[160px]">
            <DatePicker
              id="end-date-picker"
              label="Đến ngày"
              value={endDate}
              placeholder="dd/MM/yyyy"
              onChange={(_, dateStr) => setEndDate(dateStr)}
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={!selectedShop || loading}
            className="h-11"
            variant="outline"
          >
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </Button>

          <Button
            onClick={async () => {
              showLoading("Đang đồng bộ...");
              if (activeTab === "statements") {
                await handleStatementSync();
              } else if (activeTab === "payment") {
                await handlePaymentSync();
              } else {
                await handleWithdrawalSync();
              }
              hideLoading();
            }}
            disabled={!startDate || !endDate || loading}
            className="h-11"
          >
            Đồng bộ dữ liệu
          </Button>
        </div>

        {/* Filter Summary */}
        <div className="mt-3 flex flex-wrap gap-2">
          {/* {selectedShop && selectedShop !== 'all' && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md text-xs font-medium">
              Shop: {selectedShop}
            </span>
          )} */}
          {startDate && (
            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-md text-xs font-medium">
              Từ: {new Date(startDate).toLocaleDateString('vi-VN')}
            </span>
          )}
          {endDate && (
            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-md text-xs font-medium">
              Đến: {new Date(endDate).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "statements"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              onClick={() => setActiveTab("statements")}
            >
              Lịch sử thanh toán
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "payment"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              onClick={() => setActiveTab("payment")}
            >
              Lịch sử tiền về
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "withdrawal"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              onClick={() => setActiveTab("withdrawal")}
            >
              Lịch sử rút tiền
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "statements" && (
            <div>
              {/* Sub-tabs for Statement */}
              <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                  <button
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${statementSubTab === "statement"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    onClick={() => setStatementSubTab("statement")}
                  >
                    View by statements
                  </button>
                  <button
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${statementSubTab === "unsettled"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    onClick={() => setStatementSubTab("unsettled")}
                  >
                    View by orders
                  </button>
                </nav>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {statementSubTab === "statement" ? "Đang tải lịch sử thanh toán..." : "Đang tải dữ liệu giao dịch chưa thanh toán..."}
                  </span>
                </div>
              ) : (
                <>
                  {statementSubTab === "statement" && (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          View by statements
                        </h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Tổng: {statementsPagination.totalItems} báo cáo
                        </div>
                      </div>

                      <Table>
                        <TableHeader className="border-gray-100 dark:border-gray-700 border-y">
                          <TableRow>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Mã báo cáo
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Shop ID
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Tên shop
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Doanh thu
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Tiền giữ
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Đã thanh toán
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Ngày báo cáo
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Tài khoản ngân hàng
                            </TableCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {error ? (
                            <TableRow>
                              <TableCell colSpan={8} className="py-12 text-center">
                                <div className="text-red-500 dark:text-red-400">
                                  <p className="font-medium">Có lỗi xảy ra</p>
                                  <p className="text-sm mt-1">{error}</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : statements.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="py-12 text-center">
                                <div className="text-gray-500 dark:text-gray-400">
                                  <p className="font-medium">Không có dữ liệu</p>
                                  <p className="text-sm mt-1">Chọn shop và khoảng thời gian để xem báo cáo</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            statements.map((s) => (
                              <TableRow key={s.statementId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <TableCell className="py-3 text-gray-900 dark:text-gray-100 font-mono text-sm">
                                  {s.statementId}
                                </TableCell>
                                <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                                  {s.shopId}
                                </TableCell>
                                <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-medium">
                                  {s.managedName}
                                </TableCell>
                                <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-medium">
                                  {formatCurrency(s.revenue, s.currency)}
                                </TableCell>
                                <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-medium">
                                  {formatCurrency(s.holdAmount, s.currency)}
                                </TableCell>
                                <TableCell className="py-3 text-green-600 dark:text-green-400 font-medium">
                                  {formatCurrency(s.paidAmount, s.currency)}
                                </TableCell>
                                <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                                  {formatDate(s.holdDate)}
                                </TableCell>
                                <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                                  {s.bankAccount || '—'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>

                      {/* Pagination for Statements Tab */}
                      {statementsPagination.totalPages > 1 && (
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                          <Pagination
                            currentPage={statementsPagination.currentPage}
                            totalPages={statementsPagination.totalPages}
                            totalItems={statementsPagination.totalItems}
                            itemsPerPage={statementsPagination.itemsPerPage}
                            onPageChange={handleStatementsPageChange}
                            onPageSizeChange={handleStatementsPageSizeChange}
                            pageSizeOptions={[10, 25, 50, 100]}
                            showPageSizeSelector={true}
                            showItemsInfo={true}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {statementSubTab === "unsettled" && (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          View by orders
                        </h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Tổng: {unsettledPagination.totalItems} giao dịch
                        </div>
                      </div>

                      <Table>
                        <TableHeader className="border-gray-100 dark:border-gray-700 border-y">
                          <TableRow>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Transaction ID
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Shop Name
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Số tiền
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Tiền tệ
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Loại giao dịch
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Trạng thái
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Thời gian tạo
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                              Thời gian đặt hàng
                            </TableCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {error ? (
                            <TableRow>
                              <TableCell colSpan={8} className="py-12 text-center">
                                <div className="text-red-500 dark:text-red-400">
                                  <p className="font-medium">Có lỗi xảy ra</p>
                                  <p className="text-sm mt-1">{error}</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : tikTokTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="py-12 text-center">
                                <div className="text-gray-500 dark:text-gray-400">
                                  <p className="font-medium">Không có dữ liệu giao dịch TikTok</p>
                                  <p className="text-sm mt-1">Chọn shop và khoảng thời gian để xem dữ liệu</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            tikTokTransactions.map((t) => (
                              <TableRow key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <TableCell className="py-3 text-gray-900 dark:text-gray-100 font-mono text-sm">
                                  {t.transactionId}
                                </TableCell>
                                <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-medium">
                                  {t.managedName}
                                </TableCell>
                                <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-medium">
                                  {formatCurrency(t.settlementAmount?.toString() || t.revenueAmount?.toString() || '0', t.currency)}
                                </TableCell>
                                <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                                  {t.currency}
                                </TableCell>
                                <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                                  {t.transactionType}
                                </TableCell>
                                <TableCell className="py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.reserveStatus === 'SETTLED'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : t.reserveStatus === 'PENDING'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                    {t.reserveStatus || 'UNKNOWN'}
                                  </span>
                                </TableCell>
                                <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                                  {t.createTime ? formatDate(t.createTime) : '-'}
                                </TableCell>
                                <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                                  {t.orderCreateTime ? formatDate(t.orderCreateTime) : '-'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>

                      {/* Pagination for Unsettled Transactions */}
                      {unsettledPagination.totalPages > 1 && (
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                          <Pagination
                            currentPage={unsettledPagination.currentPage}
                            totalPages={unsettledPagination.totalPages}
                            totalItems={unsettledPagination.totalItems}
                            itemsPerPage={unsettledPagination.itemsPerPage}
                            onPageChange={handleUnsettledPageChange}
                            onPageSizeChange={handleUnsettledPageSizeChange}
                            pageSizeOptions={[10, 25, 50, 100]}
                            showPageSizeSelector={true}
                            showItemsInfo={true}
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "payment" && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600 dark:text-gray-400">Đang tải lịch sử thanh toán...</span>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Lịch sử tiền về
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Tổng: {historyPagination.totalItems} giao dịch
                    </div>
                  </div>

                  <Table>
                    <TableHeader className="border-gray-100 dark:border-gray-700 border-y">
                      <TableRow>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          ID
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Shop Name
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Mã giao dịch
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Số tiền
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Tiền tệ
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Trạng thái
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Tài khoản NH
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Thời gian
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {error ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-12 text-center">
                            <div className="text-red-500 dark:text-red-400">
                              <p className="font-medium">Có lỗi xảy ra</p>
                              <p className="text-sm mt-1">{error}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : paidHistories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-12 text-center">
                            <div className="text-gray-500 dark:text-gray-400">
                              <p className="font-medium">Không có lịch sử thanh toán</p>
                              <p className="text-sm mt-1">Chọn shop để xem lịch sử thanh toán</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paidHistories.map((p) => (
                          <TableRow key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <TableCell className="py-3 text-gray-900 dark:text-gray-100 font-mono text-sm">
                              {p.id}
                            </TableCell>
                            <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                              {p.shop.managedName}
                            </TableCell>
                            <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-mono">
                              {p.paymentId}
                            </TableCell>
                            <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-medium">
                              {formatCurrency(p.amountValue, p.amountCurrency)}
                            </TableCell>
                            <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                              {p.amountCurrency}
                            </TableCell>
                            <TableCell className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'PAID'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                {p.status}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                              {p.bankAccount || '—'}
                            </TableCell>
                            <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                              {formatDate(p.createTime)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination for History Tab */}
                  {historyPagination.totalPages > 1 && (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <Pagination
                        currentPage={historyPagination.currentPage}
                        totalPages={historyPagination.totalPages}
                        totalItems={historyPagination.totalItems}
                        itemsPerPage={historyPagination.itemsPerPage}
                        onPageChange={handleHistoryPageChange}
                        onPageSizeChange={handleHistoryPageSizeChange}
                        pageSizeOptions={[10, 25, 50, 100]}
                        showPageSizeSelector={true}
                        showItemsInfo={true}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {activeTab === "withdrawal" && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600 dark:text-gray-400">Đang tải lịch sử rút tiền...</span>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Lịch sử rút tiền
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Tổng: {withdrawalsPagination.totalItems} giao dịch
                    </div>
                  </div>

                  <Table>
                    <TableHeader className="border-gray-100 dark:border-gray-700 border-y">
                      <TableRow>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          ID rút tiền
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Shop ID
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Tên shop
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Số tiền
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Tiền tệ
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Trạng thái
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Tài khoản NH
                        </TableCell>
                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                          Thời gian
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {error ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-12 text-center">
                            <div className="text-red-500 dark:text-red-400">
                              <p className="font-medium">Có lỗi xảy ra</p>
                              <p className="text-sm mt-1">{error}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : withdrawals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-12 text-center">
                            <div className="text-gray-500 dark:text-gray-400">
                              <p className="font-medium">Không có lịch sử rút tiền</p>
                              <p className="text-sm mt-1">Chọn shop và khoảng thời gian để xem lịch sử rút tiền</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawals.map((w) => (
                          <TableRow key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <TableCell className="py-3 text-gray-900 dark:text-gray-100 font-mono text-sm">
                              {w.withdrawalId}
                            </TableCell>
                            <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                              {w.shopId}
                            </TableCell>
                            <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-medium">
                              {w.shopName}
                            </TableCell>
                            <TableCell className="py-3 text-gray-700 dark:text-gray-300 font-medium">
                              {formatCurrency(w.amount, w.currency)}
                            </TableCell>
                            <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                              {w.currency}
                            </TableCell>
                            <TableCell className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${w.status === 'COMPLETED' || w.status === 'SUCCESS'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : w.status === 'PENDING' || w.status === 'PROCESSING'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : w.status === 'FAILED' || w.status === 'REJECTED'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                {w.status}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                              {w.bankAccount || '—'}
                            </TableCell>
                            <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                              {formatDate(w.createTime)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination for Withdrawals Tab */}
                  {withdrawalsPagination.totalPages > 1 && (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <Pagination
                        currentPage={withdrawalsPagination.currentPage}
                        totalPages={withdrawalsPagination.totalPages}
                        totalItems={withdrawalsPagination.totalItems}
                        itemsPerPage={withdrawalsPagination.itemsPerPage}
                        onPageChange={handleWithdrawalsPageChange}
                        onPageSizeChange={handleWithdrawalsPageSizeChange}
                        pageSizeOptions={[10, 25, 50, 100]}
                        showPageSizeSelector={true}
                        showItemsInfo={true}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};