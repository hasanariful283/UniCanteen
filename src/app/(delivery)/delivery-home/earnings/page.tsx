// Delivery person earnings history with daily, weekly, and monthly breakdowns
"use client";
import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
    DollarSign, 
    TrendingUp, 
    TrendingDown, 
    Calendar, 
    Clock,
    Package,
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    PieChart
} from 'lucide-react';

type EarningsData = {
    totalEarnings: number;
    todayEarnings: number;
    weekEarnings: number;
    monthEarnings: number;
    deliveryFee: number;
    tips: number;
    bonus: number;
    totalDeliveries: number;
    avgEarningsPerDelivery: number;
    payoutHistory: PayoutRecord[];
    dailyEarnings: DailyEarning[];
};

type PayoutRecord = {
    id: string;
    amount: number;
    date: string;
    status: 'completed' | 'pending' | 'failed';
    method: string;
};

type DailyEarning = {
    date: string;
    earnings: number;
    deliveries: number;
};

const EarningsPage = () => {
    const { user } = useUser();
    const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');

    useEffect(() => {
        if (!user) return;
        fetchEarningsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, selectedPeriod]);

    const fetchEarningsData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/delivery-home/earnings?period=${selectedPeriod}`);
            const data = await response.json();
            setEarningsData(data);
        } catch (error) {
            console.error('Error fetching earnings data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentPeriodEarnings = () => {
        if (!earningsData) return 0;
        switch (selectedPeriod) {
            case 'today':
                return earningsData.todayEarnings;
            case 'week':
                return earningsData.weekEarnings;
            case 'month':
                return earningsData.monthEarnings;
            default:
                return earningsData.totalEarnings;
        }
    };

    const getPeriodLabel = () => {
        switch (selectedPeriod) {
            case 'today':
                return "Today's Earnings";
            case 'week':
                return "This Week's Earnings";
            case 'month':
                return "This Month's Earnings";
            default:
                return "Total Earnings";
        }
    };

    if (!user) {
        return <div className="p-4">Please sign in</div>;
    }

    if (loading || !earningsData) {
        return <div className="p-4">Loading earnings data...</div>;
    }

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Earnings</h1>
                    <p className="text-gray-600">Track your delivery earnings and payouts</p>
                </div>
                <div className="flex gap-2">
                    {['today', 'week', 'month', 'all'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period as any)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm ${
                                selectedPeriod === period
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-white border text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Wallet className="w-6 h-6" />
                        <h3 className="font-medium">{getPeriodLabel()}</h3>
                    </div>
                    <p className="text-3xl font-bold">৳{getCurrentPeriodEarnings().toFixed(2)}</p>
                    <p className="text-green-100 text-sm mt-1">
                        {earningsData.totalDeliveries} deliveries completed
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium text-gray-900">Avg per Delivery</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">৳{earningsData.avgEarningsPerDelivery.toFixed(2)}</p>
                    <p className="text-gray-600 text-sm mt-1">Average earnings</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-orange-600" />
                        <h3 className="font-medium text-gray-900">Total Deliveries</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{earningsData.totalDeliveries}</p>
                    <p className="text-gray-600 text-sm mt-1">Completed orders</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        <h3 className="font-medium text-gray-900">Next Payout</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">৳{(earningsData.totalEarnings * 0.1).toFixed(2)}</p>
                    <p className="text-gray-600 text-sm mt-1">In 2 days</p>
                </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Earnings Breakdown</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="font-medium">Delivery Fees</span>
                            </div>
                            <span className="font-bold text-gray-900">৳{earningsData.deliveryFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <ArrowUpRight className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-medium">Tips</span>
                            </div>
                            <span className="font-bold text-gray-900">৳{earningsData.tips.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="font-medium">Bonuses</span>
                            </div>
                            <span className="font-bold text-gray-900">৳{earningsData.bonus.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Daily Earnings Chart (Mock) */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Earnings Trend</h2>
                    <div className="space-y-3">
                        {earningsData.dailyEarnings.slice(0, 7).map((day, index) => {
                            const maxEarnings = Math.max(...earningsData.dailyEarnings.map(d => d.earnings));
                            const percentage = (day.earnings / maxEarnings) * 100;
                            
                            return (
                                <div key={day.date} className="flex items-center gap-3">
                                    <div className="w-12 text-sm text-gray-600">
                                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                                    </div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                                        <div 
                                            className="bg-orange-500 h-3 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <div className="w-16 text-right text-sm font-medium">
                                        ৳{day.earnings.toFixed(0)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Payout History */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Payout History</h2>
                </div>
                <div className="p-6">
                    {earningsData.payoutHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-600">
                            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p>No payout history available</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {earningsData.payoutHistory.map((payout) => (
                                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            payout.status === 'completed' ? 'bg-green-100' :
                                            payout.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                                        }`}>
                                            {payout.status === 'completed' ? (
                                                <ArrowUpRight className={`w-5 h-5 text-green-600`} />
                                            ) : payout.status === 'pending' ? (
                                                <Clock className={`w-5 h-5 text-yellow-600`} />
                                            ) : (
                                                <ArrowDownLeft className={`w-5 h-5 text-red-600`} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">৳{payout.amount.toFixed(2)}</p>
                                            <p className="text-sm text-gray-600">{payout.method} • {new Date(payout.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EarningsPage;