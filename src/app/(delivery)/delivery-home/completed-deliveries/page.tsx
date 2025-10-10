"use client";
import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
    Package, 
    MapPin, 
    Clock, 
    Star, 
    DollarSign, 
    Filter, 
    Calendar,
    CheckCircle,
    TrendingUp,
    Search,
    Download
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
    rating?: number;
    customerFeedback?: string;
};

type FilterOptions = {
    dateRange: 'today' | 'week' | 'month' | 'all';
    minRating: number;
    searchTerm: string;
};

const CompletedDeliveriesPage = () => {
    const { user } = useUser();
    const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FilterOptions>({
        dateRange: 'month',
        minRating: 0,
        searchTerm: '',
    });
    const [stats, setStats] = useState({
        totalCompleted: 0,
        totalEarnings: 0,
        avgRating: 0,
        completionRate: 0,
    });

    const fetchCompletedDeliveries = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                dateRange: filters.dateRange,
                minRating: filters.minRating.toString(),
                searchTerm: filters.searchTerm,
            });

            const response = await fetch(`/api/delivery-home/completed-deliveries?${queryParams}`);
            const data = await response.json();
            setCompletedOrders(data.orders || []);
            setStats(data.stats || {
                totalCompleted: 0,
                totalEarnings: 0,
                avgRating: 0,
                completionRate: 0,
            });
        } catch (error) {
            console.error('Error fetching completed deliveries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchCompletedDeliveries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, filters.dateRange, filters.minRating, filters.searchTerm]);

    const getDateRange = () => {
        const now = new Date();
        switch (filters.dateRange) {
            case 'today':
                return 'Today';
            case 'week':
                return 'This Week';
            case 'month':
                return 'This Month';
            default:
                return 'All Time';
        }
    };

    const renderStarRating = (rating?: number) => {
        if (!rating) return <span className="text-gray-400">No rating</span>;
        
        return (
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-4 h-4 ${
                            i < rating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                        }`}
                    />
                ))}
                <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
            </div>
        );
    };

    if (!user) {
        return <div className="p-4">Please sign in</div>;
    }

    return (
        <div className="p-4  mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Completed Deliveries</h1>
                <p className="text-gray-600">Track your delivery history and performance</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalCompleted}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Earnings</p>
                            <p className="text-xl font-bold text-gray-900">৳{stats.totalEarnings}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Avg Rating</p>
                            <p className="text-xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Success Rate</p>
                            <p className="text-xl font-bold text-gray-900">{stats.completionRate.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <select
                            value={filters.dateRange}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                            className="border rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-gray-400" />
                        <select
                            value={filters.minRating}
                            onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                            className="border rounded-lg px-3 py-2 text-sm"
                        >
                            <option value={0}>All Ratings</option>
                            <option value={4}>4+ Stars</option>
                            <option value={3}>3+ Stars</option>
                            <option value={2}>2+ Stars</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by customer name or order ID..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                            className="border rounded-lg px-3 py-2 text-sm flex-1"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Deliveries List */}
            {loading ? (
                <div className="text-center py-8">Loading completed deliveries...</div>
            ) : completedOrders.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed deliveries</h3>
                    <p className="text-gray-600">Complete some deliveries to see them here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {completedOrders.map((order) => {
                        const customerName = order.customer?.user?.name || "Unknown Customer";
                        const canteenNames = [...new Set(order.foodItems.map(item => item.canteen.name))].join(", ");
                        const deliveryTime = order.deliveryAt ? new Date(order.deliveryAt).toLocaleString() : 'N/A';
                        const orderTime = new Date(order.createdAt).toLocaleString();
                        const deliveryDuration = order.deliveryAt ? 
                            Math.round((new Date(order.deliveryAt).getTime() - new Date(order.createdAt).getTime()) / (1000 * 60)) + ' min' : 'N/A';

                        return (
                            <div key={order.id} className="bg-white rounded-lg shadow-sm border p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h3>
                                            <p className="text-sm text-gray-600">{canteenNames}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {renderStarRating(order.rating)}
                                        <p className="text-sm text-gray-600 mt-1">৳{order.totalPrice}</p>
                                    </div>
                                </div>

                                {/* Order Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Customer</p>
                                        <p className="font-medium">{customerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Delivery Duration</p>
                                        <p className="font-medium">{deliveryDuration}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Delivered At</p>
                                        <p className="font-medium">{new Date(order.deliveryAt || '').toLocaleTimeString()}</p>
                                    </div>
                                </div>

                                {/* Food Items */}
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        {order.foodItems.slice(0, 3).map((item) => (
                                            <div key={item.id} className="flex justify-between items-center py-1">
                                                <span className="text-sm">{item.quantity}x {item.food.name}</span>
                                                <span className="text-sm font-medium">৳{item.food.price * item.quantity}</span>
                                            </div>
                                        ))}
                                        {order.foodItems.length > 3 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                +{order.foodItems.length - 3} more items
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Customer Feedback */}
                                {order.customerFeedback && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm font-medium text-blue-900 mb-1">Customer Feedback:</p>
                                        <p className="text-sm text-blue-800">{order.customerFeedback}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CompletedDeliveriesPage;