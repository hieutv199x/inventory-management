'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCcw,
  Search,
} from 'lucide-react';

import { httpClient } from '@/lib/http-client';
import ShopSelector from '@/components/ui/ShopSelector';
import Badge from '@/components/ui/badge/Badge';
import { useLanguage } from '@/context/LanguageContext';

interface FulfillmentTrackingEntry {
  id: string;
  trackingNumber: string;
  category: string | null;
  title: string;
  description: string | null;
  occurredAt: string | null;
  sequence: number;
  source: string | null;
}

interface FulfillmentTrackingState {
  id: string;
  trackingNumber: string;
  providerName?: string | null;
  providerType?: string | null;
  providerServiceLevel?: string | null;
  providerTrackingUrl?: string | null;
  status?: string | null;
  shop?: {
    id: string;
    shopId: string;
    shopName?: string | null;
    managedName?: string | null;
  } | null;
  order?: {
    id: string;
    orderId: string;
  } | null;
  timelineEntries: FulfillmentTrackingEntry[];
  createdAt?: string;
  updatedAt?: string;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse {
  data?: FulfillmentTrackingState[];
  pagination?: PaginationMeta;
  error?: string;
}

type BadgeColor =
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';

const DEFAULT_PAGINATION: PaginationMeta = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 20,
  hasNext: false,
  hasPrev: false,
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }
  return format(parsed, 'PPpp');
};

const resolveStatusColor = (status?: string | null): BadgeColor => {
  if (!status) return 'light';
  const normalized = status.toLowerCase();
  if (normalized.includes('deliver')) return 'success';
  if (normalized.includes('fail') || normalized.includes('cancel')) return 'error';
  if (normalized.includes('out for')) return 'warning';
  if (normalized.includes('transit') || normalized.includes('processing')) return 'info';
  return 'primary';
};

const sortTimelineEntries = (entries: FulfillmentTrackingEntry[]) => {
  return [...entries].sort((a, b) => {
    const aTime = a.occurredAt ? new Date(a.occurredAt).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.occurredAt ? new Date(b.occurredAt).getTime() : Number.POSITIVE_INFINITY;

    if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
      return a.sequence - b.sequence;
    }

    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;

    if (aTime === bTime) {
      return a.sequence - b.sequence;
    }

    return aTime - bTime;
  });
};

const getLatestTimelineEntry = (entries: FulfillmentTrackingEntry[]) => {
  return entries.reduce<FulfillmentTrackingEntry | null>((latest, entry) => {
    if (!entry.occurredAt) return latest;
    const entryTime = new Date(entry.occurredAt).getTime();
    if (Number.isNaN(entryTime)) return latest;

    if (!latest || !latest.occurredAt) {
      return entry;
    }

    const latestTime = new Date(latest.occurredAt).getTime();
    if (Number.isNaN(latestTime) || entryTime > latestTime) {
      return entry;
    }

    return latest;
  }, null);
};

export default function FulfillmentTrackingPage() {
  const { t } = useLanguage();

  const [states, setStates] = useState<FulfillmentTrackingState[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fetchStates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      if (selectedShopId) {
        params.append('shopAuthId', selectedShopId);
      }

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await httpClient.get<ApiResponse>(`/fulfillment/tracking-states?${params.toString()}`);

      if (response?.error) {
        throw new Error(response.error);
      }

      setStates(response?.data ?? []);
      setPagination(response?.pagination ?? { ...DEFAULT_PAGINATION, itemsPerPage: pageSize, currentPage: page });
      setExpandedRows({});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tracking data';
      setError(message);
      setStates([]);
      setPagination({ ...DEFAULT_PAGINATION, itemsPerPage: pageSize });
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchQuery, selectedShopId, statusFilter]);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPage(1);
      setSearchQuery(searchInput.trim());
    },
    [searchInput]
  );

  const handleToggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleRefresh = () => {
    fetchStates();
  };

  const canGoPrev = pagination.hasPrev && page > 1;
  const canGoNext = pagination.hasNext;

  const tableRows = useMemo(() => states, [states]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t('fulfillmentTracking.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
          {t('fulfillmentTracking.subtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-6">
          <div className="w-full lg:w-64">
            <ShopSelector
              value={selectedShopId || undefined}
              onChange={(shopId) => {
                setSelectedShopId(shopId ?? '');
                setPage(1);
              }}
              placeholder={t('orders.shop')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('common.status')}
            </label>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="w-56 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">{t('orders.all_status')}</option>
              <option value="DELIVERED">Delivered</option>
              <option value="OUT_FOR_DELIVERY">Out for delivery</option>
              <option value="IN_TRANSIT">In transit</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('fulfillmentTracking.searchPlaceholder')}
                className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              <Search className="h-4 w-4" />
              {t('common.search')}
            </button>
          </form>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            <RefreshCcw className="h-4 w-4" />
            {t('fulfillmentTracking.refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('fulfillmentTracking.table.trackingNumber')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('fulfillmentTracking.table.provider')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('fulfillmentTracking.table.status')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('fulfillmentTracking.table.shop')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('fulfillmentTracking.table.order')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('fulfillmentTracking.table.lastEvent')}
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('fulfillmentTracking.table.timeline')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-300">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </span>
                </td>
              </tr>
            )}

            {!isLoading && tableRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-300">
                  {t('fulfillmentTracking.noResults')}
                </td>
              </tr>
            )}

            {!isLoading && tableRows.map((state) => {
              const latestEntry = getLatestTimelineEntry(state.timelineEntries);
              const statusLabel = state.status || 'N/A';
              const providerLabel = state.providerName || 'N/A';
              const providerDetails = [state.providerType, state.providerServiceLevel].filter(Boolean).join(' · ');
              const shopLabel = state.shop?.managedName || state.shop?.shopName || state.shop?.shopId || 'N/A';
              const orderLabel = state.order?.orderId || 'N/A';
              const lastEventLabel = latestEntry ? `${formatDateTime(latestEntry.occurredAt)}${latestEntry.title ? ` · ${latestEntry.title}` : ''}` : 'N/A';
              const isExpanded = Boolean(expandedRows[state.id]);

              return (
                <React.Fragment key={state.id}>
                  <tr className="bg-white transition hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/60">
                    <td className="max-w-[220px] truncate px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {state.providerTrackingUrl ? (
                        <a
                          href={state.providerTrackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {state.trackingNumber}
                        </a>
                      ) : (
                        state.trackingNumber || 'N/A'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex flex-col gap-1">
                        <span>{providerLabel}</span>
                        {providerDetails && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{providerDetails}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <Badge size="sm" variant="light" color={resolveStatusColor(statusLabel)}>
                        {statusLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {shopLabel}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {orderLabel}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {lastEventLabel}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <button
                        type="button"
                        onClick={() => handleToggleRow(state.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            {t('fulfillmentTracking.toggle.hide')}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            {t('fulfillmentTracking.toggle.show')}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-gray-50 dark:bg-gray-900/60">
                      <td colSpan={7} className="px-6 py-5">
                        {state.timelineEntries.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('fulfillmentTracking.timeline.empty')}
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {sortTimelineEntries(state.timelineEntries).map((entry) => (
                              <div key={entry.id} className="rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge size="sm" color="info">
                                        {entry.category || t('fulfillmentTracking.timeline.category')}
                                      </Badge>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDateTime(entry.occurredAt)}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {entry.title || 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      {entry.description || 'N/A'}
                                    </p>
                                  </div>

                                  {entry.source && (
                                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                      {entry.source}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 text-sm text-gray-600 dark:text-gray-300 sm:flex-row sm:items-center">
        <div>
          {t('fulfillmentTracking.pagination.summary', {
            page: pagination.currentPage,
            totalPages: pagination.totalPages || 1,
          })}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => canGoPrev && setPage((prev) => Math.max(1, prev - 1))}
            className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
              canGoPrev
                ? 'border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white'
                : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-500'
            }`}
          >
            {t('fulfillmentTracking.pagination.prev')}
          </button>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => canGoNext && setPage((prev) => prev + 1)}
            className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
              canGoNext
                ? 'border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white'
                : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-500'
            }`}
          >
            {t('fulfillmentTracking.pagination.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
