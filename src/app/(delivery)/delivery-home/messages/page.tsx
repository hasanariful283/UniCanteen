"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { 
    MessageCircle, 
    Send, 
    Phone, 
    MoreVertical,
    ArrowLeft,
    User,
    Package,
    Clock
} from 'lucide-react';

type Conversation = {
    id: string;
    participantNames: string[];
    lastMessage?: {
        content: string;
        timestamp: string;
        senderId: string;
    };
    order?: {
        id: string;
        status: string;
        totalPrice: number;
    };
    unreadCount: number;
};

type Message = {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: string;
};

const DeliveryMessagesPageInner = () => {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const conversationId = searchParams?.get('conversation');

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchConversations();
    }, [user]);

    useEffect(() => {
        if (conversationId && conversations.length > 0) {
            const conversation = conversations.find(c => c.id === conversationId);
            if (conversation) {
                setSelectedConversation(conversation);
                fetchMessages(conversationId);
            }
        }
    }, [conversationId, conversations]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/messages/conversations');
            const data = await response.json();
            setConversations(data.conversations || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (convId: string) => {
        try {
            const response = await fetch(`/api/messages/conversations/${convId}/messages`);
            const data = await response.json();
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || sending) return;

        try {
            setSending(true);
            const response = await fetch(`/api/messages/conversations/${selectedConversation.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage.trim() }),
            });

            if (response.ok) {
                const newMsg = await response.json();
                setMessages(prev => [...prev, newMsg.message]);
                setNewMessage('');
                
                // Refresh conversations to update last message
                fetchConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!user) {
        return <div className="p-4">Please sign in</div>;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Conversations List */}
            <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-1/3 bg-white border-r`}>
                <div className="p-4 border-b bg-white">
                    <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                    <p className="text-sm text-gray-600">Communicate with customers and canteens</p>
                </div>

                <div className="overflow-y-auto h-full">
                    {loading ? (
                        <div className="p-4 text-center text-gray-600">Loading conversations...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center">
                            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="font-semibold text-gray-900 mb-2">No conversations yet</h3>
                            <p className="text-gray-600 text-sm">Start delivering orders to receive messages from customers</p>
                        </div>
                    ) : (
                        conversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                onClick={() => {
                                    setSelectedConversation(conversation);
                                    fetchMessages(conversation.id);
                                }}
                                className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-medium text-gray-900 truncate">
                                                {conversation.participantNames.join(', ')}
                                            </p>
                                            {conversation.unreadCount > 0 && (
                                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                                                    {conversation.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        {conversation.order && (
                                            <p className="text-xs text-blue-600 mb-1">
                                                Order #{conversation.order.id.slice(0, 8)} • ৳{conversation.order.totalPrice}
                                            </p>
                                        )}
                                        {conversation.lastMessage && (
                                            <p className="text-sm text-gray-600 truncate">
                                                {conversation.lastMessage.content}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            {conversation.lastMessage && 
                                                new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Messages View */}
            <div className={`${selectedConversation ? 'block' : 'hidden md:block'} flex-1 flex flex-col`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="md:hidden p-2 hover:bg-gray-100 rounded"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {selectedConversation.participantNames.join(', ')}
                                    </p>
                                    {selectedConversation.order && (
                                        <p className="text-sm text-gray-600">
                                            Order #{selectedConversation.order.id.slice(0, 8)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-gray-100 rounded">
                                    <Phone className="w-5 h-5 text-gray-600" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded">
                                    <MoreVertical className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map((message) => {
                                const isOwnMessage = message.senderId === user.id;
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                isOwnMessage
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-white text-gray-900 border'
                                            }`}
                                        >
                                            {!isOwnMessage && (
                                                <p className="text-xs text-gray-500 mb-1">{message.senderName}</p>
                                            )}
                                            <p className="text-sm">{message.content}</p>
                                            <p className={`text-xs mt-1 ${
                                                isOwnMessage ? 'text-orange-100' : 'text-gray-500'
                                            }`}>
                                                {new Date(message.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 bg-white border-t">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your message..."
                                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    disabled={sending}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim() || sending}
                                    className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                            <p className="text-gray-600">Choose a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DeliveryMessagesPage = () => {
    return (
        <Suspense fallback={<div className="p-4">Loading messages...</div>}>
            <DeliveryMessagesPageInner />
        </Suspense>
    );
};

export default DeliveryMessagesPage;