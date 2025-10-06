'use client';

import React, { useMemo } from 'react';
import { Clock, Loader2, X } from 'lucide-react';
import { Modal } from '../ui/modal';
import { formatTikTokTimestamp } from '@/utils/datetime';
import { useLanguage } from '@/context/LanguageContext';

export interface TrackingEventItem {
    id?: string;
    description: string;
    updateTimeMilli?: number | null;
    createdAt?: string | null;
}

interface TrackingHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId?: string | null;
    events: TrackingEventItem[];
    isLoading?: boolean;
}

const TrackingHistoryModal: React.FC<TrackingHistoryModalProps> = ({
    isOpen,
    onClose,
    orderId,
    events,
    isLoading = false
}) => {
    const { t } = useLanguage();

    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            const aTime = a.updateTimeMilli ?? 0;
            const bTime = b.updateTimeMilli ?? 0;
            return bTime - aTime;
        });
    }, [events]);

    const formatUpdateTime = (millis?: number | null) => {
        if (!millis || Number.isNaN(millis)) return '—';
        const seconds = Math.floor(millis / 1000);
        return formatTikTokTimestamp(seconds, { includeSeconds: true, includeTimezone: true });
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="w-[94vw] max-w-xl max-h-[90vh] flex flex-col"
        >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t('orders.tracking_modal.title')}
                        </h3>
                    </div>
                    {orderId && (
                        <p className="mt-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                            {orderId}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {t('orders.tracking_modal.subtitle')}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 max-h-[70vh] overflow-y-auto">
                {isLoading ? (
                    <div className="flex h-40 items-center justify-center text-gray-500">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                    </div>
                ) : sortedEvents.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
                        {t('orders.tracking_modal.empty')}
                    </div>
                ) : (
                    <ul className="relative space-y-4">
                        <span className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-blue-200 via-blue-200 to-transparent" aria-hidden="true" />
                        {sortedEvents.map((event, index) => {
                            const timestampLabel = formatUpdateTime(event.updateTimeMilli);
                            return (
                                <li key={event.id ?? `${event.updateTimeMilli}-${index}`}
                                    className="relative flex items-start gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition hover:border-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-400/40">
                                    <span className="absolute -left-[7px] mt-1 inline-flex h-3 w-3 items-center justify-center rounded-full border border-blue-200 bg-white dark:border-blue-400/60 dark:bg-gray-900" />
                                    <div className="flex-1">
                                        <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-300">
                                            {t('orders.tracking_modal.updated_at')}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {timestampLabel}
                                        </p>
                                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
                                            {event.description || t('common.na')}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Modal>
    );
};

export default TrackingHistoryModal;
