/**
 * Utility functions for formatting dates and times, especially for TikTok Shop data
 */

/**
 * Format TikTok timestamp to UK timezone (Europe/London)
 * TikTok Shop API returns timestamps in seconds (Unix timestamp)
 * and typically uses UK timezone for their operations
 */
export function formatTikTokTimestamp(
    timestamp: number, 
    options: {
        includeSeconds?: boolean;
        includeTimezone?: boolean;
        locale?: string;
    } = {}
): string {
    const {
        includeSeconds = false,
        includeTimezone = false,
        locale = 'en-GB'
    } = options;

    // TikTok timestamp is in seconds, convert to milliseconds
    const date = new Date(timestamp * 1000);
    
    // Format in UK timezone (Europe/London) since TikTok Shop uses UK timezone
    const formatOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: 'short', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    if (includeSeconds) {
        formatOptions.second = '2-digit';
    }

    if (includeTimezone) {
        formatOptions.timeZoneName = 'short';
    }

    return date.toLocaleString(locale, formatOptions);
}

/**
 * Format TikTok timestamp to Vietnam timezone for local display
 */
export function formatTikTokTimestampVN(
    timestamp: number, 
    options: {
        includeSeconds?: boolean;
        includeTimezone?: boolean;
    } = {}
): string {
    const {
        includeSeconds = false,
        includeTimezone = false
    } = options;

    // TikTok timestamp is in seconds, convert to milliseconds
    const date = new Date(timestamp * 1000);
    
    const formatOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: 'short', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    if (includeSeconds) {
        formatOptions.second = '2-digit';
    }

    if (includeTimezone) {
        formatOptions.timeZoneName = 'short';
    }

    return date.toLocaleString('vi-VN', formatOptions);
}

/**
 * Convert local date/time to TikTok timestamp (Unix seconds)
 * This is useful when sending dates to TikTok API
 */
export function dateToTikTokTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
}

/**
 * Get the timezone offset difference between UK and Vietnam
 * UK: UTC+0 (or UTC+1 during DST)
 * Vietnam: UTC+7
 */
export function getTimezoneInfo() {
    const now = new Date();
    
    const ukTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
    const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    
    const offsetHours = (vnTime.getTime() - ukTime.getTime()) / (1000 * 60 * 60);
    
    return {
        ukTime: ukTime.toISOString(),
        vnTime: vnTime.toISOString(),
        offsetHours: offsetHours,
        ukTimezone: 'Europe/London',
        vnTimezone: 'Asia/Ho_Chi_Minh'
    };
}