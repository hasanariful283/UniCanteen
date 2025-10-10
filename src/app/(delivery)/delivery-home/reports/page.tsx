"use client";
import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
    BarChart3, 
    TrendingUp, 
    Clock, 
    Target,
    Calendar,
    Download,
    RefreshCw,
    Package,
    DollarSign,
    MapPin,
    Star,
    Users
} from 'lucide-react';

type ReportData = {
    performance: {
        totalDeliveries: number;
        completedDeliveries: number;
        cancelledDeliveries: number;
        averageDeliveryTime: number;
        onTimeDeliveryRate: number;
        customerSatisfaction: number;
    };
    earnings: {
        totalEarnings: number;
        averageEarningsPerOrder: number;
        bestDay: { day: string; earnings: number };
        worstDay: { day: string; earnings: number };
    };
    trends: {
        weeklyDeliveries: number[];
        weeklyEarnings: number[];
        weeklyRatings: number[];
        weekLabels: string[];
    };
    goals: {
        deliveryTarget: number;
        earningsTarget: number;
        ratingTarget: number;
        currentProgress: {
            deliveries: number;
            earnings: number;
            rating: number;
        };
    };
    insights: string[];
};

const DeliveryReportsPage = () => {
    const { user } = useUser();
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchReportData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, selectedPeriod]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/delivery-home/reports?period=${selectedPeriod}`);
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        await fetchReportData();
        setRefreshing(false);
    };

    const exportReport = () => {
        // Mock export functionality
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], {type:'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `delivery-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const getProgressPercentage = (current: number, target: number) => {
        return Math.min((current / target) * 100, 100);
    };

    if (!user) {
        return <div className="p-4">Please sign in</div>;
    }

    if (loading || !reportData) {
        return <div className="p-4">Loading reports...</div>;
    }

    return (
        <div className="p-4  mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Performance Reports</h1>
                    <p className="text-gray-600">Analyze your delivery performance and earnings</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value as any)}
                        className="border rounded-lg px-4 py-2 text-sm"
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                    </select>
                    <button
                        onClick={refreshData}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={exportReport}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium text-gray-900">Total Deliveries</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{reportData.performance.totalDeliveries}</p>
                    <p className="text-sm text-green-600">
                        {reportData.performance.completedDeliveries} completed
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <h3 className="font-medium text-gray-900">Avg Delivery Time</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{reportData.performance.averageDeliveryTime} min</p>
                    <p className="text-sm text-gray-600">
                        {reportData.performance.onTimeDeliveryRate}% on-time rate
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <h3 className="font-medium text-gray-900">Total Earnings</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">৳{reportData.earnings.totalEarnings}</p>
                    <p className="text-sm text-gray-600">
                        ৳{reportData.earnings.averageEarningsPerOrder} per order
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <Star className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-medium text-gray-900">Customer Rating</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{reportData.performance.customerSatisfaction.toFixed(1)}</p>
                    <p className="text-sm text-gray-600">Average rating</p>
                </div>
            </div>

            {/* Goals Progress */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Goals Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">Deliveries</span>
                            <span className="text-sm text-gray-600">
                                {reportData.goals.currentProgress.deliveries} / {reportData.goals.deliveryTarget}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                className="bg-blue-500 h-3 rounded-full"
                                style={{ 
                                    width: `${getProgressPercentage(
                                        reportData.goals.currentProgress.deliveries, 
                                        reportData.goals.deliveryTarget
                                    )}%` 
                                }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {getProgressPercentage(reportData.goals.currentProgress.deliveries, reportData.goals.deliveryTarget).toFixed(0)}% complete
                        </p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">Earnings</span>
                            <span className="text-sm text-gray-600">
                                ৳{reportData.goals.currentProgress.earnings} / ৳{reportData.goals.earningsTarget}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                className="bg-green-500 h-3 rounded-full"
                                style={{ 
                                    width: `${getProgressPercentage(
                                        reportData.goals.currentProgress.earnings, 
                                        reportData.goals.earningsTarget
                                    )}%` 
                                }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {getProgressPercentage(reportData.goals.currentProgress.earnings, reportData.goals.earningsTarget).toFixed(0)}% complete
                        </p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">Rating</span>
                            <span className="text-sm text-gray-600">
                                {reportData.goals.currentProgress.rating.toFixed(1)} / {reportData.goals.ratingTarget.toFixed(1)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                className="bg-yellow-500 h-3 rounded-full"
                                style={{ 
                                    width: `${getProgressPercentage(
                                        reportData.goals.currentProgress.rating, 
                                        reportData.goals.ratingTarget
                                    )}%` 
                                }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {getProgressPercentage(reportData.goals.currentProgress.rating, reportData.goals.ratingTarget).toFixed(0)}% complete
                        </p>
                    </div>
                </div>
            </div>

            {/* Trends Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Deliveries Trend</h2>
                    <div className="space-y-3">
                        {reportData.trends.weekLabels.map((week, index) => {
                            const deliveries = reportData.trends.weeklyDeliveries[index];
                            const maxDeliveries = Math.max(...reportData.trends.weeklyDeliveries);
                            const percentage = maxDeliveries > 0 ? (deliveries / maxDeliveries) * 100 : 0;
                            
                            return (
                                <div key={week} className="flex items-center gap-3">
                                    <div className="w-16 text-sm text-gray-600">{week}</div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                                        <div 
                                            className="bg-blue-500 h-4 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <div className="w-12 text-right text-sm font-medium">{deliveries}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Earnings Trend</h2>
                    <div className="space-y-3">
                        {reportData.trends.weekLabels.map((week, index) => {
                            const earnings = reportData.trends.weeklyEarnings[index];
                            const maxEarnings = Math.max(...reportData.trends.weeklyEarnings);
                            const percentage = maxEarnings > 0 ? (earnings / maxEarnings) * 100 : 0;
                            
                            return (
                                <div key={week} className="flex items-center gap-3">
                                    <div className="w-16 text-sm text-gray-600">{week}</div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                                        <div 
                                            className="bg-green-500 h-4 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <div className="w-16 text-right text-sm font-medium">৳{earnings}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Insights</h2>
                <div className="space-y-3">
                    {reportData.insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                            <p className="text-sm text-gray-700">{insight}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DeliveryReportsPage;