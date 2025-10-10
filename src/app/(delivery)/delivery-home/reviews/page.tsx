"use client";
import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
    Star, 
    TrendingUp, 
    MessageCircle, 
    Calendar,
    Filter,
    ChevronDown,
    User,
    Package,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';

type Review = {
    id: string;
    rating: number;
    comment?: string;
    customerName: string;
    orderDate: string;
    orderId: string;
    orderTotal: number;
    deliveryTime: number; // minutes
    isPositive: boolean;
    foodItems: string[];
};

type ReviewStats = {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
    recentTrend: 'up' | 'down' | 'stable';
    positivePercentage: number;
    responseRate: number;
};

const DeliveryReviewsPage = () => {
    const { user } = useUser();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

    useEffect(() => {
        if (!user) return;
        fetchReviewsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, filter, sortBy]);

    const fetchReviewsData = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                filter,
                sortBy,
            });
            
            const response = await fetch(`/api/delivery-home/reviews?${queryParams}`);
            const data = await response.json();
            setReviews(data.reviews || []);
            setStats(data.stats);
        } catch (error) {
            console.error('Error fetching reviews data:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStarRating = (rating: number, showNumber = true) => {
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
                {showNumber && <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>}
            </div>
        );
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 4.5) return 'text-green-600';
        if (rating >= 3.5) return 'text-yellow-600';
        if (rating >= 2.5) return 'text-orange-600';
        return 'text-red-600';
    };

    if (!user) {
        return <div className="p-4">Please sign in</div>;
    }

    return (
        <div className="p-4  mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h1>
                <p className="text-gray-600">See what customers are saying about your delivery service</p>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-3 mb-2">
                            <Star className="w-6 h-6 text-yellow-500" />
                            <h3 className="font-medium text-gray-900">Average Rating</h3>
                        </div>
                        <p className={`text-3xl font-bold ${getRatingColor(stats.averageRating)}`}>
                            {stats.averageRating.toFixed(1)}
                        </p>
                        <p className="text-gray-600 text-sm">From {stats.totalReviews} reviews</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                            <h3 className="font-medium text-gray-900">Positive Reviews</h3>
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                            {stats.positivePercentage.toFixed(0)}%
                        </p>
                        <p className="text-gray-600 text-sm">4+ star ratings</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-3 mb-2">
                            <MessageCircle className="w-6 h-6 text-blue-500" />
                            <h3 className="font-medium text-gray-900">Response Rate</h3>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">
                            {stats.responseRate.toFixed(0)}%
                        </p>
                        <p className="text-gray-600 text-sm">Reviews with comments</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-6 h-6 text-purple-500" />
                            <h3 className="font-medium text-gray-900">Recent Trend</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-3xl font-bold text-gray-900">
                                {stats.recentTrend === 'up' ? '↗' : stats.recentTrend === 'down' ? '↘' : '→'}
                            </p>
                            <p className={`text-sm ${
                                stats.recentTrend === 'up' ? 'text-green-600' : 
                                stats.recentTrend === 'down' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                                {stats.recentTrend === 'up' ? 'Improving' : 
                                 stats.recentTrend === 'down' ? 'Declining' : 'Stable'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Rating Distribution */}
            {stats && (
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h2>
                    <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = stats.ratingDistribution[star] || 0;
                            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                            
                            return (
                                <div key={star} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-12">
                                        <span className="text-sm">{star}</span>
                                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                    </div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-yellow-400 h-2 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filters and Sort */}
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="border rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="border rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="highest">Highest Rating</option>
                            <option value="lowest">Lowest Rating</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            {loading ? (
                <div className="text-center py-8">Loading reviews...</div>
            ) : reviews.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                    <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-600">Complete more deliveries to receive customer reviews</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6">
                            {/* Review Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{review.customerName}</p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(review.orderDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {renderStarRating(review.rating)}
                                    <div className="flex items-center gap-1 mt-1">
                                        {review.isPositive ? (
                                            <ThumbsUp className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <ThumbsDown className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className={`text-sm ${
                                            review.isPositive ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {review.isPositive ? 'Positive' : 'Needs Improvement'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-gray-400" />
                                        <span>Order #{review.orderId.slice(0, 8)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>৳{review.orderTotal}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>Delivered in {review.deliveryTime} min</span>
                                    </div>
                                </div>
                            </div>

                            {/* Review Comment */}
                            {review.comment && (
                                <div className="mb-4">
                                    <p className="text-gray-700 italic">"{review.comment}"</p>
                                </div>
                            )}

                            {/* Food Items */}
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Items ordered:</p>
                                <div className="flex flex-wrap gap-2">
                                    {review.foodItems.slice(0, 3).map((item, index) => (
                                        <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                                            {item}
                                        </span>
                                    ))}
                                    {review.foodItems.length > 3 && (
                                        <span className="text-xs text-gray-500">
                                            +{review.foodItems.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeliveryReviewsPage;