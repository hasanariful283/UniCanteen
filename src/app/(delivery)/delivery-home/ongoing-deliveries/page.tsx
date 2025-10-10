"use client";
import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
    Package, 
    MapPin, 
    Clock, 
    Phone, 
    Navigation, 
    CheckCircle, 
    AlertCircle,
    Truck,
    User,
    DollarSign
} from 'lucide-react';

type OrderItem = {
    id: string;
    quantity: number;
    food: { id: string; name: string; price: number };
    canteen: { id: string; name: string };
};

type Order = {
    id: string;
    status: string;
    totalPrice: number;
    createdAt: string;
    deliveryAt?: string | null;
    foodItems: OrderItem[];
    customer?: { 
        user?: { name?: string | null; phone?: string | null } 
    } | null;
    deliveryAddress?: string;
};

const OngoingDeliveriesPage = () => {
    const { user } = useUser();
    const [ongoingOrders, setOngoingOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchOngoingOrders();
    }, [user]);

    const fetchOngoingOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/delivery-home/ongoing-orders');
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to fetch ongoing orders:', response.status, errorData);
                return;
            }
            
            const data = await response.json();
            console.log('Fetched ongoing orders:', data);
            setOngoingOrders(data.orders || []);
        } catch (error) {
            console.error('Error fetching ongoing orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            setUpdatingOrder(orderId);
            
            // Use different API endpoints based on status
            let apiUrl = '/api/delivery-home/ongoing-orders';
            if (newStatus === 'DELIVERED') {
                // Use the delivering-orders endpoint for marking as delivered
                apiUrl = '/api/delivery-home/delivering-orders';
            }
            
            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: newStatus }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Order status updated:', result);
                await fetchOngoingOrders(); // Refresh the list
            } else {
                const errorData = await response.json();
                console.error('Failed to update order status:', response.status, errorData);
                alert(`Failed to update order status: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Network error while updating order status');
        } finally {
            setUpdatingOrder(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACCEPTED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'IN_PROGRESS':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'DELIVERING':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getNextAction = (status: string) => {
        switch (status) {
            case 'ACCEPTED':
                return { text: 'Start Preparing', nextStatus: 'IN_PROGRESS', icon: Truck };
            case 'IN_PROGRESS':
                return { text: 'Out for Delivery', nextStatus: 'DELIVERING', icon: Navigation };
            case 'DELIVERING':
                return { text: 'Mark Delivered', nextStatus: 'DELIVERED', icon: CheckCircle };
            default:
                return null;
        }
    };

    if (!user) {
        return <div className="p-4">Please sign in</div>;
    }

    if (loading) {
        return <div className="p-4">Loading ongoing deliveries...</div>;
    }

    return (
        <div className="p-4 mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Ongoing Deliveries</h1>
                    <p className="text-gray-600">Manage your active delivery orders</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            try {
                                const response = await fetch('/api/delivery-home/assign-orders', { method: 'POST' });
                                if (response.ok) {
                                    const result = await response.json();
                                    alert(`Assigned ${result.orders?.length || 0} orders for testing`);
                                    await fetchOngoingOrders();
                                } else {
                                    const error = await response.json();
                                    alert(`Failed to assign orders: ${error.error}`);
                                }
                            } catch (error) {
                                console.error('Error assigning orders:', error);
                            }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Get Test Orders
                    </button>
                    <button
                        onClick={fetchOngoingOrders}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {ongoingOrders.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No ongoing deliveries</h3>
                    <p className="text-gray-600">Check back later for new delivery assignments.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {ongoingOrders.map((order) => {
                        const customerName = order.customer?.user?.name || "Unknown Customer";
                        const customerPhone = order.customer?.user?.phone || "No phone";
                        const canteenNames = [...new Set(order.foodItems.map(item => item.canteen.name))].join(", ");
                        const orderTime = new Date(order.createdAt).toLocaleString();
                        const nextAction = getNextAction(order.status);
                        const ActionIcon = nextAction?.icon || AlertCircle;

                        return (
                            <div key={order.id} className="bg-white rounded-lg shadow-sm border p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <Package className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h3>
                                            <p className="text-sm text-gray-600">{canteenNames}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                                        {order.status === 'IN_PROGRESS' ? 'Preparing' : 
                                         order.status === 'DELIVERING' ? 'Out for Delivery' :
                                         order.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Order Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Customer</p>
                                            <p className="font-medium">{customerName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Contact</p>
                                            <p className="font-medium">{customerPhone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Amount</p>
                                            <p className="font-medium">৳{order.totalPrice}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Ordered</p>
                                            <p className="font-medium">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Food Items */}
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Items ({order.foodItems.length}):</p>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        {order.foodItems.map((item, index) => (
                                            <div key={item.id} className="flex justify-between items-center py-1">
                                                <span className="text-sm">{item.quantity}x {item.food.name}</span>
                                                <span className="text-sm font-medium">৳{item.food.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                {order.deliveryAddress && (
                                    <div className="mb-4">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-600">Delivery Address</p>
                                                <p className="text-sm">{order.deliveryAddress}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t">
                                    {nextAction && (
                                        <button
                                            onClick={() => {
                                                console.log('Action clicked:', {
                                                    orderId: order.id,
                                                    currentStatus: order.status,
                                                    nextStatus: nextAction.nextStatus
                                                });
                                                updateOrderStatus(order.id, nextAction.nextStatus);
                                            }}
                                            disabled={updatingOrder === order.id}
                                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <ActionIcon className="w-4 h-4" />
                                            {updatingOrder === order.id ? 'Updating...' : nextAction.text}
                                        </button>
                                    )}
                                    <a
                                        href={`tel:${customerPhone}`}
                                        className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Phone className="w-4 h-4" />
                                        Call Customer
                                    </a>
                                    {order.deliveryAddress && (
                                        <a
                                            href={`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Navigation className="w-4 h-4" />
                                            Navigate
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OngoingDeliveriesPage;