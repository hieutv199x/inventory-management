'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'vi';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

type TranslationMap = {
    [key: string]: string;
};

const translations: Record<Language, TranslationMap> = {
    en: {
        // Navigation
        'nav.products': 'Products',
        'nav.orders': 'Orders',
        'nav.bank': 'Bank Management',
        'nav.revenue': 'Revenue',
        'nav.connect_shop': 'Connect Shop',
        'nav.chat': 'Customer Chat',
        'nav.user_management': 'User Management',
        'nav.shop_permissions': 'Shop Permissions',
        'nav.dashboard': 'Dashboard',
        'nav.fraud_alert': 'Fraud Alert',
        
        // Dashboard
        'dashboard.title': 'Dashboard',
        'dashboard.subtitle': 'Overview of your TikTok Shop management system',
        'dashboard.active_shops': 'Active Shops',
        'dashboard.total_orders': 'Total Orders (30d)',
        'dashboard.total_revenue': 'Total Revenue (30d)',
        'dashboard.system_health': 'System Health',
        'dashboard.pending_orders': 'Pending Orders',
        'dashboard.total_payments': 'Total Payments',
        'dashboard.withdrawals': 'Withdrawals',
        'dashboard.pending_payments': 'Pending Payments',
        'dashboard.recent_activity': 'Recent Activity',
        'dashboard.top_shops': 'Top Performing Shops',
        'dashboard.financial_overview': 'Financial Overview (Last 30 Days)',
        'dashboard.total_revenue_label': 'Total Revenue',
        'dashboard.total_withdrawals_label': 'Total Withdrawals',
        'dashboard.net_balance': 'Net Balance',
        'dashboard.excellent': 'Excellent',
        'dashboard.good': 'Good',
        'dashboard.needs_attention': 'Needs Attention',
        'dashboard.no_issues': 'No issues',
        'dashboard.alerts': 'alerts',
        'dashboard.completed': 'completed',
        'dashboard.avg': 'Avg',
        'dashboard.need_fulfillment': 'Need fulfillment',
        'dashboard.last_30_days': 'Last 30 days',
        'dashboard.total_withdrawn': 'Total withdrawn',
        'dashboard.need_processing': 'Need processing',
        'dashboard.no_recent_activity': 'No recent activity',
        'dashboard.no_shop_data': 'No shop performance data available yet',
        
        // Orders
        'orders.title': 'Orders Management',
        'orders.subtitle': 'Manage and sync TikTok orders',
        'orders.total_orders': 'Total Orders',
        'orders.completed': 'Completed',
        'orders.processing': 'Processing',
        'orders.cancelled': 'Cancelled',
        'orders.search': 'Search',
        'orders.search_placeholder': 'Search orders...',
        'orders.shop': 'Shop',
        'orders.all_shops': 'All Shops',
        'orders.status': 'Status',
        'orders.all_status': 'All Status',
        'orders.from_date': 'From Date',
        'orders.to_date': 'To Date',
        'orders.sync_orders': 'Sync Orders',
        'orders.view_details': 'View Details',
        'orders.chat_support': 'Chat Support',
        'orders.account_seller': 'Account/Seller',
        'orders.order': 'Order',
        'orders.order_info': 'Order Info',
        'orders.price': 'Price',
        'orders.actions': 'Actions',
        'orders.items': 'item(s)',
        'orders.track': 'Track',
        'orders.subtotal': 'Subtotal',
        
        // Chat
        'chat.title': 'Customer Chat',
        'chat.shops_messages': 'shops • {unread} unread messages',
        'chat.refresh': 'Refresh',
        'chat.seed_data': 'Seed Sample Data',
        'chat.clear_data': 'Clear Sample Data',
        'chat.search_placeholder': 'Search shops or customers...',
        'chat.loading_conversations': 'Loading conversations...',
        'chat.no_conversations': 'No conversations found',
        'chat.conversations': 'conversations',
        'chat.participants': 'participants',
        'chat.cannot_send': 'Cannot send messages',
        'chat.loading_messages': 'Loading messages...',
        'chat.no_messages': 'No messages in this conversation yet',
        'chat.select_conversation': 'Select a conversation',
        'chat.select_conversation_desc': 'Choose a conversation from the sidebar to view messages',
        'chat.readonly_notice': 'This is a read-only view. Use TikTok Shop Seller Center to reply to messages.',
        'chat.unknown_customer': 'Unknown Customer',
        
        // Common
        'common.loading': 'Loading...',
        'common.search': 'Search',
        'common.refresh': 'Refresh',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.view': 'View',
        'common.actions': 'Actions',
        'common.status': 'Status',
        'common.date': 'Date',
        'common.total': 'Total',
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.close': 'Close',
        'common.confirm': 'Confirm',
    },
    vi: {
        // Navigation
        'nav.products': 'Sản phẩm',
        'nav.orders': 'Đơn hàng',
        'nav.bank': 'Quản lý bank',
        'nav.revenue': 'Tiền về',
        'nav.connect_shop': 'Kết nối Shop',
        'nav.chat': 'Trò chuyện',
        'nav.user_management': 'Quản lý user',
        'nav.shop_permissions': 'Phân quyền shop',
        'nav.dashboard': 'Bảng điều khiển',
        'nav.fraud_alert': 'Cảnh báo gian lận',
        
        // Dashboard
        'dashboard.title': 'Bảng điều khiển',
        'dashboard.subtitle': 'Tổng quan hệ thống quản lý TikTok Shop',
        'dashboard.active_shops': 'Shop hoạt động',
        'dashboard.total_orders': 'Tổng đơn hàng (30 ngày)',
        'dashboard.total_revenue': 'Tổng doanh thu (30 ngày)',
        'dashboard.system_health': 'Tình trạng hệ thống',
        'dashboard.pending_orders': 'Đơn chờ xử lý',
        'dashboard.total_payments': 'Tổng thanh toán',
        'dashboard.withdrawals': 'Rút tiền',
        'dashboard.pending_payments': 'Thanh toán chờ',
        'dashboard.recent_activity': 'Hoạt động gần đây',
        'dashboard.top_shops': 'Shop hiệu quả nhất',
        'dashboard.financial_overview': 'Tổng quan tài chính (30 ngày qua)',
        'dashboard.total_revenue_label': 'Tổng doanh thu',
        'dashboard.total_withdrawals_label': 'Tổng rút tiền',
        'dashboard.net_balance': 'Số dư ròng',
        'dashboard.excellent': 'Tuyệt vời',
        'dashboard.good': 'Tốt',
        'dashboard.needs_attention': 'Cần chú ý',
        'dashboard.no_issues': 'Không có vấn đề',
        'dashboard.alerts': 'cảnh báo',
        'dashboard.completed': 'hoàn thành',
        'dashboard.avg': 'Trung bình',
        'dashboard.need_fulfillment': 'Cần xử lý',
        'dashboard.last_30_days': '30 ngày qua',
        'dashboard.total_withdrawn': 'Tổng đã rút',
        'dashboard.need_processing': 'Cần xử lý',
        'dashboard.no_recent_activity': 'Không có hoạt động gần đây',
        'dashboard.no_shop_data': 'Chưa có dữ liệu hiệu quả shop',
        
        // Orders
        'orders.title': 'Quản lý đơn hàng',
        'orders.subtitle': 'Quản lý và đồng bộ đơn hàng TikTok',
        'orders.total_orders': 'Tổng đơn hàng',
        'orders.completed': 'Hoàn thành',
        'orders.processing': 'Đang xử lý',
        'orders.cancelled': 'Đã hủy',
        'orders.search': 'Tìm kiếm',
        'orders.search_placeholder': 'Tìm đơn hàng...',
        'orders.shop': 'Cửa hàng',
        'orders.all_shops': 'Tất cả shop',
        'orders.status': 'Trạng thái',
        'orders.all_status': 'Tất cả trạng thái',
        'orders.from_date': 'Từ ngày',
        'orders.to_date': 'Đến ngày',
        'orders.sync_orders': 'Đồng bộ đơn hàng',
        'orders.view_details': 'Xem chi tiết',
        'orders.chat_support': 'Hỗ trợ',
        'orders.account_seller': 'Tài khoản/Người bán',
        'orders.order': 'Đơn hàng',
        'orders.order_info': 'Thông tin đơn',
        'orders.price': 'Giá',
        'orders.actions': 'Thao tác',
        'orders.items': 'sản phẩm',
        'orders.track': 'Theo dõi',
        'orders.subtotal': 'Tạm tính',
        
        // Chat
        'chat.title': 'Trò chuyện khách hàng',
        'chat.shops_messages': 'shop • {unread} tin nhắn chưa đọc',
        'chat.refresh': 'Làm mới',
        'chat.seed_data': 'Tạo dữ liệu mẫu',
        'chat.clear_data': 'Xóa dữ liệu mẫu',
        'chat.search_placeholder': 'Tìm shop hoặc khách hàng...',
        'chat.loading_conversations': 'Đang tải cuộc trò chuyện...',
        'chat.no_conversations': 'Không tìm thấy cuộc trò chuyện',
        'chat.conversations': 'cuộc trò chuyện',
        'chat.participants': 'người tham gia',
        'chat.cannot_send': 'Không thể gửi tin nhắn',
        'chat.loading_messages': 'Đang tải tin nhắn...',
        'chat.no_messages': 'Chưa có tin nhắn trong cuộc trò chuyện',
        'chat.select_conversation': 'Chọn cuộc trò chuyện',
        'chat.select_conversation_desc': 'Chọn cuộc trò chuyện từ thanh bên để xem tin nhắn',
        'chat.readonly_notice': 'Đây là chế độ chỉ đọc. Sử dụng TikTok Shop Seller Center để trả lời tin nhắn.',
        'chat.unknown_customer': 'Khách hàng không xác định',
        
        // Common
        'common.loading': 'Đang tải...',
        'common.search': 'Tìm kiếm',
        'common.refresh': 'Làm mới',
        'common.save': 'Lưu',
        'common.cancel': 'Hủy',
        'common.delete': 'Xóa',
        'common.edit': 'Sửa',
        'common.view': 'Xem',
        'common.actions': 'Thao tác',
        'common.status': 'Trạng thái',
        'common.date': 'Ngày',
        'common.total': 'Tổng',
        'common.yes': 'Có',
        'common.no': 'Không',
        'common.close': 'Đóng',
        'common.confirm': 'Xác nhận',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Load saved language from localStorage
        const savedLanguage = localStorage.getItem('language') as Language;
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
            setLanguageState(savedLanguage);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string, params?: Record<string, string | number>) => {
        let translation = translations[language][key] || translations['en'][key] || key;
        
        // Replace parameters in translation
        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                translation = translation.replace(`{${paramKey}}`, String(value));
            });
        }
        
        return translation;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
