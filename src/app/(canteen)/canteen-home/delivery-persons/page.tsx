"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  User,
  Star,
  MapPin,
  Phone,
  Package,
  Clock,
  TrendingUp,
  Users,
  Activity,
  Search,
  Filter,
  Plus,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bike,
  Car,
} from "lucide-react";

interface DeliveryPerson {
  userId: string;
  user: {
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  DeliveryProfile: {
    id: string;
    isAvailable: boolean;
    rating: number | null;
    completed: number;
    cancelled: number;
    phone: string | null;
    address: string | null;
    vehicleType: string | null;
  } | null;
  _count: {
    deliveries: number;
  };
}

interface DeliveryStats {
  totalDeliveryPersons: number;
  availableNow: number;
  averageRating: number;
  totalDeliveries: number;
  ongoingDeliveries: number;
  completedToday: number;
}

export default function DeliveryPersonsPage() {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "unavailable">("all");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "deliveries" | "joined">("name");

  const fetchDeliveryData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('status', filterStatus);
      params.append('sort', sortBy);

      const response = await fetch(`/api/canteen-home/delivery-persons?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDeliveryPersons(data.deliveryPersons);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching delivery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryData();
  }, [searchTerm, filterStatus, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderStars = (rating: number | null) => {
    const actualRating = rating || 0;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= actualRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">
          {actualRating > 0 ? actualRating.toFixed(1) : "N/A"}
        </span>
      </div>
    );
  };

  const getVehicleIcon = (vehicleType: string | null) => {
    switch (vehicleType?.toLowerCase()) {
      case 'bike':
      case 'bicycle':
        return <Bike className="w-5 h-5 text-blue-600" />;
      case 'car':
        return <Car className="w-5 h-5 text-green-600" />;
      default:
        return <Truck className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (isAvailable: boolean) => {
    return isAvailable ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
        <CheckCircle className="w-3 h-3" />
        Available
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
        <XCircle className="w-3 h-3" />
        Unavailable
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
          <p className="text-gray-500 mt-1">Manage and track your delivery personnel</p>
        </div>
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add Delivery Person
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Delivery Persons</p>
              <p className="text-3xl font-bold">{stats?.totalDeliveryPersons || 0}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Available Now</p>
              <p className="text-3xl font-bold">{stats?.availableNow || 0}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Average Rating</p>
              <p className="text-3xl font-bold">{stats?.averageRating?.toFixed(1) || "0.0"}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <Star className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Completed Today</p>
              <p className="text-3xl font-bold">{stats?.completedToday || 0}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search delivery persons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="name">Sort by Name</option>
              <option value="rating">Sort by Rating</option>
              <option value="deliveries">Sort by Deliveries</option>
              <option value="joined">Sort by Join Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delivery Persons List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Delivery Personnel</h3>
        </div>
        
        {deliveryPersons.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Delivery Persons Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== "all" 
                ? "Try adjusting your filters to see more delivery persons." 
                : "You haven't added any delivery persons yet."}
            </p>
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors">
              <Plus className="w-4 h-4" />
              Add First Delivery Person
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {deliveryPersons.map((person) => (
              <div key={person.userId} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {person.user.name?.charAt(0) || "D"}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {person.user.name || "Unknown Delivery Person"}
                        </h4>
                        {person.DeliveryProfile && getStatusBadge(person.DeliveryProfile.isAvailable)}
                        {person.DeliveryProfile?.vehicleType && getVehicleIcon(person.DeliveryProfile.vehicleType)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {person.user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {person.user.phone}
                          </div>
                        )}
                        {person.DeliveryProfile?.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {person.DeliveryProfile.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Rating</p>
                      {renderStars(person.DeliveryProfile?.rating || null)}
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="font-medium text-gray-900">
                        {person.DeliveryProfile?.completed || 0}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="font-medium text-gray-900">
                        {person.DeliveryProfile?.completed || 0 > 0 
                          ? (((person.DeliveryProfile?.completed || 0) / 
                             ((person.DeliveryProfile?.completed || 0) + (person.DeliveryProfile?.cancelled || 0))) * 100).toFixed(0)
                          : "0"}%
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="font-medium text-gray-900">{person._count.deliveries}</p>
                    </div>

                    <button className="p-2 hover:bg-gray-200 rounded-lg">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="mt-4 flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      person.DeliveryProfile?.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-gray-600">
                      {person.DeliveryProfile?.isAvailable ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  
                  {person.DeliveryProfile?.rating && person.DeliveryProfile.rating >= 4.5 && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Top Rated</span>
                    </div>
                  )}
                  
                  {person.DeliveryProfile?.completed && person.DeliveryProfile.completed >= 100 && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <TrendingUp className="w-3 h-3" />
                      <span>Experienced</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}  