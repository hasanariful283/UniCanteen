// Canteen owner dashboard with orders, revenue, and analytics overview
"use client"

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
    ShoppingBag, 
    Clock, 
    CheckCircle, 
    DollarSign, 
    TrendingUp, 
    AlertTriangle,
    Star,
    Users,
    Eye,
    Package,
    ShoppingCart,
    Calendar
} from "lucide-react";
import type { CanteenDetails } from "@/types/canteen";

type DashboardStats = {
    totalFoodItems: number;
    availableFoodItems: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    todayOrders: number;
    todayRevenue: number;
    totalReviews: number;
    averageRating: number;
};

type FoodItem = {
    id: string;
    name: string;
    price: number;
    image?: string;
    totalSold?: number;
    orderCount?: number;
    stocks?: number;
};

type RecentOrder = {
    id: string;
    customerName: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    totalPrice: number;
    status: string;
    createdAt: string;
};

export default function CanteenHome() {
  const { userId } = useAuth();
  const [canteenDetails, setCanteenDetails] = useState<CanteenDetails | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<FoodItem[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<FoodItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      const fetchData = async () => {
          try {
              const [canteenResponse, dashboardResponse] = await Promise.all([
                  fetch('/api/canteen-home/canteen-info'),
                  fetch('/api/canteen-home/dashboard')
              ]);

              if (!canteenResponse.ok || !dashboardResponse.ok) {
                  throw new Error('Failed to fetch data');
              }

              const [canteenData, dashboardData] = await Promise.all([
                  canteenResponse.json(),
                  dashboardResponse.json()
              ]);

              setCanteenDetails(canteenData);
              setDashboardStats(dashboardData.stats);
              setLowStockItems(dashboardData.lowStockItems || []);
              setTopSellingItems(dashboardData.topSellingItems || []);
              setRecentOrders(dashboardData.recentOrders || []);
          } catch (err) {
              setError(err instanceof Error ? err.message : 'An error occurred');
          } finally {
              setLoading(false);
          }
      };

      if (userId) {
          fetchData();
          // Set up polling for real-time updates
          const interval = setInterval(fetchData, 30000); // Update every 30 seconds
          return () => clearInterval(interval);
      }
  }, [userId]);


  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-2">Loading dashboard...</span>
          </div>
      );
  }

  if (error) {
      return (
          <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h2 className="text-red-800 font-semibold">Error Loading Dashboard</h2>
                  <p className="text-red-600">{error}</p>
              </div>
          </div>
      );
  }

  if (!canteenDetails) {
      return (
          <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">No Canteen Found</h1>
              <p>Please contact an administrator to set up your canteen.</p>
          </div>
      );
  }

  return (
      <div className="p-6  mx-auto">
          {/* Header */}
          <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{canteenDetails.name} Dashboard</h1>
              <p className="text-gray-600">Manage your canteen operations and monitor performance</p>
          </div>

          {/* Stats Grid */}
          {dashboardStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                          <div className="shrink-0">
                              <Package className="h-8 w-8 text-blue-600" />
                          </div>
                          <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Total Food Items</p>
                              <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalFoodItems}</p>
                              <p className="text-sm text-green-600">{dashboardStats.availableFoodItems} available</p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                          <div className="shrink-0">
                              <ShoppingCart className="h-8 w-8 text-orange-600" />
                          </div>
                          <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Total Orders</p>
                              <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalOrders}</p>
                              <p className="text-sm text-blue-600">{dashboardStats.pendingOrders} pending</p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                          <div className="shrink-0">
                              <DollarSign className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                              <p className="text-2xl font-semibold text-gray-900">৳{dashboardStats.totalRevenue}</p>
                              <p className="text-sm text-green-600">৳{dashboardStats.todayRevenue} today</p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                          <div className="shrink-0">
                              <Star className="h-8 w-8 text-yellow-600" />
                          </div>
                          <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Reviews</p>
                              <p className="text-2xl font-semibold text-gray-900">{dashboardStats.averageRating}/5</p>
                              <p className="text-sm text-gray-600">{dashboardStats.totalReviews} reviews</p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* Today's Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                          <Link href="/canteen-home/food-items/add-food" className="flex items-center p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                              <Package className="h-5 w-5 text-orange-600 mr-3" />
                              <span className="font-medium text-orange-700">Add New Food Item</span>
                          </Link>
                          <Link href="/canteen-home/orders/pending" className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                              <Clock className="h-5 w-5 text-blue-600 mr-3" />
                              <span className="font-medium text-blue-700">View Pending Orders ({dashboardStats?.pendingOrders || 0})</span>
                          </Link>
                          <Link href="/canteen-home/food-items/food-availability" className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                              <Eye className="h-5 w-5 text-green-600 mr-3" />
                              <span className="font-medium text-green-700">Manage Availability</span>
                          </Link>
                          
                      </div>
                  </div>
              </div>

              {/* Today's Stats */}
              <div className="lg:col-span-2">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Performance</h3>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                              <p className="text-sm text-blue-600">Today's Orders</p>
                              <p className="text-2xl font-bold text-blue-700">{dashboardStats?.todayOrders || 0}</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                              <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                              <p className="text-sm text-green-600">Today's Revenue</p>
                              <p className="text-2xl font-bold text-green-700">৳{dashboardStats?.todayRevenue || 0}</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
              <div className="mb-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                          <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
                          <h3 className="text-lg font-semibold text-yellow-800">Low Stock Alert</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {lowStockItems.slice(0, 6).map(item => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded border">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-red-600 font-semibold">{item.stocks} left</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Items */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
                  {topSellingItems.length > 0 ? (
                      <div className="space-y-4">
                          {topSellingItems.map((item, index) => (
                              <div key={item.id} className="flex items-center space-x-4">
                                  <div className="shrink-0">
                                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                          <span className="text-orange-600 font-bold">#{index + 1}</span>
                                      </div>
                                  </div>
                                  <div className="grow">
                                      <p className="font-medium text-gray-900">{item.name}</p>
                                      <p className="text-sm text-gray-500">৳{item.price} • {item.totalSold} sold</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-gray-500 text-center py-4">No sales data available</p>
                  )}
              </div>

              {/* Recent Orders */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                      <Link href="/canteen-home/orders" className="text-orange-600 hover:text-orange-700 font-medium">
                          View All
                      </Link>
                  </div>
                  {recentOrders.length > 0 ? (
                      <div className="space-y-4 max-h-64 overflow-y-auto">
                          {recentOrders.slice(0, 5).map(order => (
                              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div>
                                      <p className="font-medium text-gray-900">{order.customerName}</p>
                                      <p className="text-sm text-gray-500">
                                          {order.items.length} item{order.items.length > 1 ? 's' : ''} • ৳{order.totalPrice}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                          {new Date(order.createdAt).toLocaleTimeString()}
                                      </p>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                      'bg-blue-100 text-blue-800'
                                  }`}>
                                      {order.status}
                                  </span>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-gray-500 text-center py-4">No recent orders</p>
                  )}
              </div>
          </div>

          {/* Canteen Image Section */}
          <div className="mt-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Canteen Information</h3>
                  <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3">
                          <div className="relative w-full h-48 rounded-lg overflow-hidden">
                              <Image 
                                  src={canteenDetails.canteen_image || '/default-canteen.jpg'} 
                                  alt={`${canteenDetails.name} image`} 
                                  fill
                                  className="object-cover"
                              />
                          </div>
                      </div>
                      <div className="md:w-2/3 space-y-3">
                          <div>
                              <h4 className="font-semibold text-gray-900">Canteen Name</h4>
                              <p className="text-gray-600">{canteenDetails.name}</p>
                          </div>
                          <div>
                              <h4 className="font-semibold text-gray-900">Established</h4>
                              <p className="text-gray-600">{new Date(canteenDetails.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-4">
                              <Link 
                                  href="/canteen-home/settings" 
                                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium"
                              >
                                  Manage Settings
                              </Link>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );
}