'use client';

import React, { useState, useEffect } from 'react';
import { 
    MessageCircle, 
    Users, 
    Store, 
    Search, 
    RefreshCw, 
    Loader2,
    User,
    ChevronDown,
    ChevronRight,
    Clock,
    AlertCircle
} from 'lucide-react';
import { httpClient } from '@/lib/http-client';
import { format } from 'date-fns';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';

interface ShopGroup {
    shopId: string;
    shopName: string;
    conversations: Conversation[];
    totalUnread: number;
    lastActivity: number;
}

interface Conversation {
    id: string;
    conversationId: string;
    participantCount: number;
    canSendMessage: boolean;
    unreadCount: number;
    createTime: number;
    participants: Participant[];
    latestMessage?: Message;
}

interface Participant {
    imUserId: string;
    nickname: string;
    role: string;
    avatar?: string;
    buyerPlatform?: string;
}

interface Message {
    messageId: string;
    type: string;
    content: string;
    createTime: number;
    isVisible: boolean;
    sender?: Participant;
}

export default function ChatPage() {
    const { t } = useLanguage();
    const [shopGroups, setShopGroups] = useState<ShopGroup[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedShops, setExpandedShops] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const response = await httpClient.get('/conversations?groupByShop=true');
            setShopGroups(response.shopGroups || []);
            
            // Auto-expand shops with unread messages
            const shopsWithUnread = new Set<string>(
                response.shopGroups
                    .filter((shop: ShopGroup) => shop.totalUnread > 0)
                    .map((shop: ShopGroup) => shop.shopId)
            );
            setExpandedShops(shopsWithUnread);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConversationMessages = async (conversationId: string) => {
        setLoadingMessages(true);
        try {
            const response = await httpClient.get(`/conversations/${conversationId}/messages`);
            setMessages(response.messages || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    };

    const toggleShopExpansion = (shopId: string) => {
        const newExpanded = new Set(expandedShops);
        if (newExpanded.has(shopId)) {
            newExpanded.delete(shopId);
        } else {
            newExpanded.add(shopId);
        }
        setExpandedShops(newExpanded);
    };

    const selectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        fetchConversationMessages(conversation.conversationId);
    };

    const formatTimestamp = (timestamp: number) => {
        return format(new Date(timestamp * 1000), 'MMM dd, HH:mm');
    };

    const parseMessageContent = (content: string) => {
        try {
            const parsed = JSON.parse(content);
            return parsed.content || content;
        } catch {
            return content;
        }
    };

    const getBuyerInfo = (participants: Participant[]) => {
        return participants.find(p => p.role === 'BUYER') || participants[0];
    };

    const filteredShopGroups = shopGroups.filter(shop => {
        if (!searchTerm) return true;
        
        return shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               shop.conversations.some(conv => {
                   const buyer = getBuyerInfo(conv.participants);
                   return buyer?.nickname.toLowerCase().includes(searchTerm.toLowerCase());
               });
    });

    const totalUnreadCount = shopGroups.reduce((sum, shop) => sum + shop.totalUnread, 0);

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('chat.title')}</h1>
                        <p className="text-gray-600">
                            {shopGroups.length} shops • {totalUnreadCount} unread messages
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={fetchConversations}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Conversations List */}
                <div className="w-1/3 bg-white border-r flex flex-col">
                    {/* Search */}
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search shops or customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Loading conversations...</p>
                            </div>
                        ) : filteredShopGroups.length === 0 ? (
                            <div className="p-8 text-center">
                                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">No conversations found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredShopGroups.map((shop) => (
                                    <div key={shop.shopId}>
                                        {/* Shop Header */}
                                        <div 
                                            className="px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer border-b"
                                            onClick={() => toggleShopExpansion(shop.shopId)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    {expandedShops.has(shop.shopId) ? (
                                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                                    )}
                                                    <Store className="h-4 w-4 text-blue-600" />
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-900">
                                                            {shop.shopName}
                                                        </h3>
                                                        <p className="text-xs text-gray-500">
                                                            {shop.conversations.length} conversations
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {shop.totalUnread > 0 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            {shop.totalUnread}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        {formatTimestamp(shop.lastActivity)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Conversations under this shop */}
                                        {expandedShops.has(shop.shopId) && (
                                            <div className="divide-y divide-gray-100">
                                                {shop.conversations.map((conversation) => {
                                                    const buyer = getBuyerInfo(conversation.participants);
                                                    const isSelected = selectedConversation?.id === conversation.id;
                                                    
                                                    return (
                                                        <div
                                                            key={conversation.id}
                                                            className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
                                                                isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                                                            }`}
                                                            onClick={() => selectConversation(conversation)}
                                                        >
                                                            <div className="flex items-start space-x-3">
                                                                {/* Avatar */}
                                                                <div className="flex-shrink-0">
                                                                    {buyer?.avatar ? (
                                                                        <img
                                                                            src={buyer.avatar}
                                                                            alt={buyer.nickname}
                                                                            className="w-10 h-10 rounded-full"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                                            <User className="h-5 w-5 text-gray-400" />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                                                            {buyer?.nickname || 'Unknown Customer'}
                                                                        </h4>
                                                                        <div className="flex items-center space-x-2">
                                                                            {conversation.unreadCount > 0 && (
                                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                                    {conversation.unreadCount}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-xs text-gray-500">
                                                                                {formatTimestamp(conversation.createTime)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {conversation.latestMessage && (
                                                                        <p className="text-sm text-gray-600 truncate">
                                                                            {parseMessageContent(conversation.latestMessage.content)}
                                                                        </p>
                                                                    )}
                                                                    
                                                                    <div className="flex items-center space-x-2 mt-1">
                                                                        <span className="text-xs text-gray-500">
                                                                            {buyer?.buyerPlatform || 'TikTok Shop'}
                                                                        </span>
                                                                        <span className="text-xs text-gray-400">•</span>
                                                                        <span className="text-xs text-gray-500">
                                                                            {conversation.participantCount} participants
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="bg-white border-b px-6 py-4 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {(() => {
                                            const buyer = getBuyerInfo(selectedConversation.participants);
                                            return (
                                                <>
                                                    {buyer?.avatar ? (
                                                        <img
                                                            src={buyer.avatar}
                                                            alt={buyer.nickname}
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                            <User className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {buyer?.nickname || 'Unknown Customer'}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {buyer?.role} • {buyer?.buyerPlatform || 'TikTok Shop'}
                                                        </p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-sm text-gray-500">
                                            {selectedConversation.participantCount} participants
                                        </div>
                                        {!selectedConversation.canSendMessage && (
                                            <div className="flex items-center text-sm text-orange-600">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                Cannot send messages
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                                {loadingMessages ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                        <p className="text-gray-600">Loading messages...</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600">No messages in this conversation yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((message) => {
                                            const isFromBuyer = message.sender?.role === 'BUYER';
                                            return (
                                                <div
                                                    key={message.messageId}
                                                    className={`flex ${isFromBuyer ? 'justify-start' : 'justify-end'}`}
                                                >
                                                    <div
                                                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                            isFromBuyer
                                                                ? 'bg-white text-gray-900 border'
                                                                : 'bg-blue-600 text-white'
                                                        }`}
                                                    >
                                                        <p className="text-sm">
                                                            {parseMessageContent(message.content)}
                                                        </p>
                                                        <p className={`text-xs mt-1 ${
                                                            isFromBuyer ? 'text-gray-500' : 'text-blue-100'
                                                        }`}>
                                                            {formatTimestamp(message.createTime)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Message Input */}
                            <div className="bg-white border-t px-6 py-4 flex-shrink-0">
                                <div className="text-center text-sm text-gray-500">
                                    <AlertCircle className="h-4 w-4 inline mr-1" />
                                    This is a read-only view. Use TikTok Shop Seller Center to reply to messages.
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Select a conversation
                                </h3>
                                <p className="text-gray-600">
                                    Choose a conversation from the sidebar to view messages
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
