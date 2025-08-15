'use client';

import React, { useState, useEffect } from 'react';
import { 
    MessageCircle, 
    Users, 
    Clock, 
    Eye, 
    Search, 
    RefreshCw, 
    Loader2,
    User,
    Send
} from 'lucide-react';
import { httpClient } from '@/lib/http-client';
import { format } from 'date-fns';

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

export default function ConversationsPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedShop, setSelectedShop] = useState('');
    const [shops, setShops] = useState<any[]>([]);

    useEffect(() => {
        fetchShops();
        fetchConversations();
    }, [selectedShop]);

    const fetchShops = async () => {
        try {
            const response = await httpClient.get('/tiktok/shop/get-shops?status=ACTIVE');
            setShops(response.credentials || []);
        } catch (error) {
            console.error('Error fetching shops:', error);
        }
    };

    const fetchConversations = async () => {
        if (!selectedShop) return;
        
        setLoading(true);
        try {
            const response = await httpClient.get(`/conversations?shopId=${selectedShop}`);
            setConversations(response.conversations || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const syncConversations = async () => {
        if (!selectedShop) {
            alert('Please select a shop to sync conversations');
            return;
        }

        setSyncing(true);
        try {
            const response = await httpClient.post('/tiktok/CustomerService/sync-conversations', {
                shop_id: selectedShop,
                sync: true,
                page_size: 20,
            });

            alert(`Synced ${response.syncInfo?.totalConversationsSynced || 0} conversations successfully`);
            fetchConversations();
        } catch (error) {
            console.error('Error syncing conversations:', error);
            alert('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return format(new Date(timestamp * 1000), 'MMM dd, yyyy HH:mm');
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

    const filteredConversations = conversations.filter(conv => {
        const buyer = getBuyerInfo(conv.participants);
        return buyer?.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
               conv.conversationId.includes(searchTerm);
    });

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Customer Conversations</h1>
                <p className="text-gray-600">Manage customer service conversations</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shop</label>
                        <select
                            value={selectedShop}
                            onChange={(e) => setSelectedShop(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a shop</option>
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.shopId}>
                                    {shop.shopName || shop.shopId}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Search by customer name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={syncConversations}
                            disabled={syncing || !selectedShop}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                        >
                            {syncing ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Sync Conversations
                        </button>
                    </div>
                </div>
            </div>

            {/* Conversations List */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading conversations...</p>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">
                            {selectedShop ? 'No conversations found' : 'Please select a shop to view conversations'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredConversations.map((conversation) => {
                            const buyer = getBuyerInfo(conversation.participants);
                            return (
                                <div key={conversation.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-start space-x-4">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {buyer?.avatar ? (
                                                <img
                                                    src={buyer.avatar}
                                                    alt={buyer.nickname}
                                                    className="w-12 h-12 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <User className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900">
                                                        {buyer?.nickname || 'Unknown Customer'}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">
                                                        {buyer?.role} • {buyer?.buyerPlatform || 'TikTok Shop'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">
                                                        {formatTimestamp(conversation.createTime)}
                                                    </p>
                                                    {conversation.unreadCount > 0 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            {conversation.unreadCount} unread
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Latest Message */}
                                            {conversation.latestMessage && (
                                                <div className="mt-2">
                                                    <p className="text-sm text-gray-600 truncate">
                                                        <span className="font-medium">
                                                            {conversation.latestMessage.sender?.nickname || 'Someone'}:
                                                        </span>{' '}
                                                        {parseMessageContent(conversation.latestMessage.content)}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Stats */}
                                            <div className="flex items-center space-x-4 mt-3">
                                                <div className="flex items-center text-xs text-gray-500">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {conversation.participantCount} participants
                                                </div>
                                                <div className="flex items-center text-xs text-gray-500">
                                                    <MessageCircle className="h-3 w-3 mr-1" />
                                                    {conversation.latestMessage?.type || 'TEXT'}
                                                </div>
                                                {conversation.canSendMessage && (
                                                    <div className="flex items-center text-xs text-green-600">
                                                        <Send className="h-3 w-3 mr-1" />
                                                        Can reply
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex-shrink-0">
                                            <button className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-900 border border-blue-300 rounded hover:bg-blue-50">
                                                <Eye className="h-3 w-3 mr-1" />
                                                View Chat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
