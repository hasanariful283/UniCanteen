// Customer ongoing orders tracking with real-time status updates
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { 
    Clock, 
    CheckCircle, 
    Package, 
    Truck, 
    XCircle, 
    MessageCircle,
    User,
    Phone,
    RefreshCw
} from "lucide-react";

type OrderItem = {
    id: string;
    quantity: number;
    food: { id: string; name: string; price: number; image?: string };
    canteen: { id: string; name: string };
};

type Order = {
    id: string;
    status: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "DELIVERING" | "DELIVERED" | "CANCELLED";
    totalPrice: number;
    createdAt: string;
    deliveryAt?: string | null;
    foodItems: OrderItem[];
    deliveryMan?: { 
        user?: { name?: string | null; phone?: string | null } | null;
        isAvailable?: boolean;
    } | null;
    assignedTo?: string | null;
};

const statusStyles: Record<Order["status"], string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-orange-100 text-orange-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    DELIVERING: "bg-blue-100 text-blue-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
};

const statusIcons: Record<Order["status"], React.ReactNode> = {
    PENDING: <Clock className="w-4 h-4" />,
    ACCEPTED: <CheckCircle className="w-4 h-4" />,
    IN_PROGRESS: <Package className="w-4 h-4" />,
    DELIVERING: <Truck className="w-4 h-4" />,
    DELIVERED: <CheckCircle className="w-4 h-4" />,
    CANCELLED: <XCircle className="w-4 h-4" />,
};

const getStatusMessage = (status: Order["status"]): string => {
    switch (status) {
        case "PENDING": return "Order placed, waiting for canteen confirmation";
        case "ACCEPTED": return "Order confirmed, being prepared";
        case "IN_PROGRESS": return "Food is being prepared";
        case "DELIVERING": return "On the way to you";
        case "DELIVERED": return "Order delivered";
        case "CANCELLED": return "Order cancelled";
        default: return "Unknown status";
    }
};

export default function OngoingOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startingChatFor, setStartingChatFor] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/orders/ongoing", {
                cache: "no-store",
            });
            if (!res.ok) {
                throw new Error(
                    (await res.json()).error || "Failed to load orders"
                );
            }
            const data = await res.json();
            setOrders(data.orders || []);
            setError(null);
        } catch (e) {
            setError(
                e instanceof Error ? e.message : "Failed to load orders"
            );
        } finally {
            setLoading(false);
        }
    };

    async function startChat(orderId: string) {
        try {
            setStartingChatFor(orderId);
            const res = await fetch("/api/messages/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });
            const data = await res.json();
            if (!res.ok || !data.conversation?.id) {
                throw new Error(data.error || "Failed to start chat");
            }
            // start chat
            window.location.href = `/customer-home/messages?c=${data.conversation.id}`;
        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : "Unable to start chat");
        } finally {
            setStartingChatFor(null);
        }
    }

    useEffect(() => {
        fetchOrders();
        
        // Auto-refresh every 30 seconds if enabled
        const interval = autoRefresh ? setInterval(fetchOrders, 30000) : null;
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-2">Loading your orders...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h2 className="text-red-800 font-semibold">Error Loading Orders</h2>
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={fetchOrders}
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No ongoing orders</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Your active orders will appear here when you place them.
                </p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ongoing Orders</h1>
                    <p className="text-gray-600">Track your current orders in real-time</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                            autoRefresh 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                        Auto Refresh
                    </button>
                    <button
                        onClick={fetchOrders}
                        className="flex items-center px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Now
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                        <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-xl font-semibold">{orders.filter(o => o.status === 'PENDING').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                        <Package className="h-5 w-5 text-purple-600 mr-2" />
                        <div>
                            <p className="text-sm text-gray-600">Preparing</p>
                            <p className="text-xl font-semibold">{orders.filter(o => ['ACCEPTED', 'IN_PROGRESS'].includes(o.status)).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                        <Truck className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                            <p className="text-sm text-gray-600">Delivering</p>
                            <p className="text-xl font-semibold">{orders.filter(o => o.status === 'DELIVERING').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                        <span className="h-5 w-5 text-green-600 mr-2">৳</span>
                        <div>
                            <p className="text-sm text-gray-600">Total Value</p>
                            <p className="text-xl font-semibold">৳{orders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(0)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            {orders.map((order) => {
                const created = new Date(order.createdAt);
                const itemsByCanteen = order.foodItems.reduce<
                    Record<string, OrderItem[]>
                >((acc, item) => {
                    const key = item.canteen?.name || "Unknown";
                    (acc[key] ||= []).push(item);
                    return acc;
                }, {});
                return (
                    <div
                        key={order.id}
                        className="bg-white rounded-xl shadow p-4"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span
                                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                                        statusStyles[order.status]
                                    }`}
                                >
                                    {statusIcons[order.status]}
                                    {order.status.replace(/_/g, " ")}
                                </span>
                                <span className="text-sm text-gray-500">
                                    Order ID: {order.id.slice(0, 8)}
                                </span>
                                <span className="text-sm text-gray-500">
                                    Placed {created.toLocaleDateString()}{" "}
                                    {created.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-gray-600 text-sm">
                                    Total
                                </div>
                                <div className="text-green-600 font-bold text-lg">
                                    ৳{order.totalPrice}
                                </div>
                            </div>
                        </div>
                        
                        {/* Status message */}
                        <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                {getStatusMessage(order.status)}
                            </p>
                        </div>
                        <div className="mt-4 grid md:grid-cols-2 gap-4">
                            {Object.entries(itemsByCanteen).map(
                                ([canteenName, items]) => (
                                    <div
                                        key={canteenName}
                                        className="border rounded-lg p-3"
                                    >
                                        <div className="font-semibold mb-2">
                                            {canteenName.replace(/_/g, " ")}
                                        </div>
                                        <ul className="space-y-2">
                                            {items.map((it) => (
                                                <li
                                                    key={it.id}
                                                    className="flex items-center justify-between text-sm"
                                                >
                                                    <div className="truncate">
                                                        <span className="font-medium">
                                                            {it.food.name}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {" "}
                                                            × {it.quantity}
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-700">
                                                        ৳
                                                        {it.food.price *
                                                            it.quantity}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )
                            )}
                        </div>
                        <div className="mt-4 space-y-3">
                            {/* Delivery Information */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Delivery Person
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {order.assignedTo && order.deliveryMan?.user?.name
                                                ? order.deliveryMan.user.name
                                                : order.status === "PENDING"
                                                ? "Waiting for order confirmation"
                                                : order.status === "ACCEPTED" || order.status === "IN_PROGRESS"
                                                ? "Will be assigned soon"
                                                : "Not assigned yet"}
                                        </p>
                                        {order.deliveryMan?.user?.phone && (
                                            <div className="flex items-center mt-1">
                                                <Phone className="w-3 h-3 text-gray-400 mr-1" />
                                                <p className="text-xs text-gray-500">
                                                    {order.deliveryMan.user.phone}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {order.deliveryAt && (
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">ETA</p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(order.deliveryAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => startChat(order.id)}
                                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
                                    disabled={startingChatFor === order.id}
                                    aria-busy={startingChatFor === order.id}
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>
                                        {startingChatFor === order.id ? "Starting…" : "Start Chat"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
