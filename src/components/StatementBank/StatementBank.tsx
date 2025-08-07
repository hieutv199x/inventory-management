"use client";

import React, { useEffect, useState } from "react";
import Button from "../ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import SelectShop from "@/components/common/SelectShop";
import axiosInstance from "@/utils/axiosInstance";

interface Statement {
  statementId: string;
  shopId: string;
  shopName: string;
  revenue: string;
  holdAmount: string;
  paidAmount: string;
  holdDate: number;
  bankAccount: string;
}

interface PaidHistory {
  id: string;
  amount: string;
  currency: string;
  paidTime: number;
}

export const StatementBank = () => {
  const [activeTab, setActiveTab] = useState<"shops" | "history">("shops");
  const [selectedShop, setSelectedShop] = useState<string | null>("all");
  const [statements, setStatements] = useState<Statement[]>([]);
  const [paidHistories, setPaidHistories] = useState<PaidHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatements = async () => {
    if (!selectedShop) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/statements?shop_id=${selectedShop}`);
      const rawStatements = res.data || [];

      const mappedStatements: Statement[] = rawStatements.map((item: any) => ({
        statementId: item.statementId,
        shopId: item.shopId,
        shopName: item.shop?.shopName || '', // dùng optional chaining
        revenue: item.revenueAmount || '0',
        holdAmount: item.adjustmentAmount || '0',
        paidAmount: item.settlementAmount || '0',
        holdDate: item.statementTime,
        bankAccount: '', // nếu backend chưa trả về bankAccount thì để trống
      }));

      setStatements(mappedStatements);
    } catch (error) {
      const err = error as Error;
      console.error("Failed to fetch statements:", error);
      setError(err.message);
    }
    setLoading(false);
  };

  const fetchPaidHistory = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/tiktok/paid-history`);
      setPaidHistories(res.data || []);
    } catch (error) {
      console.error("Failed to fetch paid history:", error);

    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "shops") fetchStatements();
    else fetchPaidHistory();
  }, [activeTab, selectedShop]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };
  const formatCurrency = (value: string) => {
    const number = parseFloat(value);
    if (isNaN(number)) return value;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(number);
  };

  return (
      <div className="p-4 bg-white rounded shadow dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Quản lý về tiền</h2>
          <Button onClick={() => activeTab === "shops" ? fetchStatements() : fetchPaidHistory()}>
            Refresh
          </Button>
        </div>

        <div className="flex border-b mb-4">
          <button
              className={`px-4 py-2 ${activeTab === "shops" ? "border-b-2 border-blue-500 font-semibold dark:text-white/90" : "text-gray-500"}`}
              onClick={() => setActiveTab("shops")}
          >
            Danh sách shop
          </button>
          <button
              className={`px-4 py-2 ml-2 ${activeTab === "history" ? "border-b-2 border-blue-500 font-semibold dark:text-white/90" : "text-gray-500"}`}
              onClick={() => setActiveTab("history")}
          >
            Lịch sử paid
          </button>
        </div>

        {activeTab === "shops" && (
            <div>
              <div className="mb-4 w-64">
                <SelectShop onChange={(val) => setSelectedShop(val)} placeholder="All Shop" enablePlaceholder={false} />
              </div>


                  <Table>
                    <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                      <TableRow>
                        <TableCell
                            isHeader
                            className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                        <TableCell isHeader
                                   className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Shop ID</TableCell>
                        <TableCell isHeader
                                   className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tên shop</TableCell>
                        <TableCell isHeader
                                   className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Doanh số</TableCell>
                        <TableCell isHeader
                                   className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tiền Hold</TableCell>
                        <TableCell isHeader
                                   className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Paid</TableCell>
                        <TableCell isHeader
                                   className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ngày hold</TableCell>
                        <TableCell isHeader
                                   className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Bank account</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {loading ? (
                          <TableRow><TableCell colSpan={8} className="py-5 text-center text-gray-500">Loading products...</TableCell></TableRow>
                      ) : error ? (
                          <TableRow><TableCell colSpan={8} className="py-5 text-center text-red-500">Error: {error}</TableCell></TableRow>
                      ) : statements.length === 0 ? (
                          <TableRow><TableCell colSpan={8} className="py-5 text-center text-gray-500">No products found with the selected filters.</TableCell></TableRow>
                      ) : (
                      statements.map((s) => (
                          <TableRow key={s.statementId}>
                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{s.statementId}</TableCell>
                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{s.shopId}</TableCell>
                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{s.shopName}</TableCell>
                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatCurrency(s.revenue)}</TableCell>
                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatCurrency(s.holdAmount)}</TableCell>
                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatCurrency(s.paidAmount)}</TableCell>
                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(s.holdDate)}</TableCell>
                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{s.bankAccount}</TableCell>
                          </TableRow>
                      )))}
                    </TableBody>
                  </Table>

            </div>
        )}

        {activeTab === "history" && (
            <div>
              {loading ? (
                  <p>Đang tải lịch sử paid...</p>
              ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Ngày thanh toán</TableCell>
                        <TableCell>Số tiền</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidHistories.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.id}</TableCell>
                            <TableCell>{formatDate(p.paidTime)}</TableCell>
                            <TableCell>
                              {p.amount} {p.currency}
                            </TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              )}
            </div>
        )}
      </div>
  );
};
