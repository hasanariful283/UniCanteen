"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Zap,
  Star,
  TrendingUp,
  Clock,
  Heart,
  Filter,
  Search,
  MapPin,
  DollarSign,
  Timer,
  ThumbsUp,
  Eye,
  ShoppingCart,
  Flame
} from 'lucide-react';

interface SnackItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  canteenName: string;
  canteenId: string;
  preparationTime: number;
  isVeg: boolean;
  isSpicy: boolean;
  isPopular: boolean;
  orderCount: number;
  discount?: number;
}

interface SnackCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

const SnacksPage = () => {
  const [snacks, setSnacks] = useState<SnackItem[]>([]);
  const [categories, setCategories] = useState<SnackCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('POPULAR');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalItems: 0,
    avgRating: 0,
    minPrice: 0
  });

  const fetchSnacks = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        sortBy,
        minPrice: priceRange[0].toString(),
        maxPrice: priceRange[1].toString(),
        search: searchQuery
      });

      const response = await fetch(`/api/snacks/top?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSnacks(data.snacks || []);
        
        // Calculate stats from the fetched data
        const fetchedSnacks = data.snacks || [];
        if (fetchedSnacks.length > 0) {
          const avgRating = fetchedSnacks.reduce((sum: number, snack: SnackItem) => sum + snack.rating, 0) / fetchedSnacks.length;
          const minPrice = Math.min(...fetchedSnacks.map((snack: SnackItem) => snack.price));
          setStats({
            totalItems: fetchedSnacks.length,
            avgRating: parseFloat(avgRating.toFixed(1)),
            minPrice
          });
        }
      }
    } catch (error) {
      console.error('Error fetching snacks:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy, priceRange, searchQuery]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/snacks/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchSnacks();
  }, [fetchCategories, fetchSnacks]);

  const displaySnacks = snacks;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2">Loading top snacks...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-orange-600 to-red-400 rounded-lg shadow-lg text-white p-8">
        <div className="flex items-center space-x-4">
          <Zap className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-bold">Top Snacks</h1>
            <p className="text-orange-100 text-lg">Most popular snacks across all canteens</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <Flame className="w-6 h-6 mr-2" />
              <span className="text-sm">Trending</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalItems}+ Items</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <Star className="w-6 h-6 mr-2" />
              <span className="text-sm">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.avgRating}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <Timer className="w-6 h-6 mr-2" />
              <span className="text-sm">Quick Bites</span>
            </div>
            <p className="text-2xl font-bold mt-1">5-15 min</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-6 h-6 mr-2" />
              <span className="text-sm">Starting</span>
            </div>
            <p className="text-2xl font-bold mt-1">৳{stats.minPrice}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Fried">Fried Items</option>
              <option value="Rolls">Rolls & Wraps</option>
              <option value="Beverages">Beverages</option>
              <option value="Sweets">Sweets</option>
              <option value="Snacks">Light Snacks</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="POPULAR">Most Popular</option>
              <option value="RATING">Highest Rated</option>
              <option value="PRICE_LOW">Price: Low to High</option>
              <option value="PRICE_HIGH">Price: High to Low</option>
              <option value="NEWEST">Newest First</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 500])}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Snacks Grid */}
      {displaySnacks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displaySnacks.map((snack) => (
            <div key={snack.id} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow overflow-hidden">
            {/* Image */}
            <div className="relative h-48">
              <Image
                src={snack.image}
                alt={snack.name}
                fill
                className="object-cover"
              />
              {snack.isPopular && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                  <Flame className="w-3 h-3 mr-1" />
                  Popular
                </div>
              )}
              {snack.discount && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {snack.discount}% OFF
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex space-x-1">
                {snack.isVeg && (
                  <div className="w-4 h-4 border-2 border-green-600 bg-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                )}
                {snack.isSpicy && (
                  <div className="bg-red-500 text-white px-1 py-0.5 rounded text-xs">🌶️</div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">{snack.name}</h3>
                <div className="flex items-center ml-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">{snack.rating}</span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{snack.description}</p>

              <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {snack.canteenName}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {snack.preparationTime} min
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900">৳{snack.price}</span>
                  {snack.discount && (
                    <span className="text-sm text-gray-500 line-through">৳{Math.round(snack.price / (1 - snack.discount / 100))}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-orange-600 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {snack.orderCount} orders
                  </span>
                  <span>{snack.reviewCount} reviews</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Snacks Found</h3>
            <p className="text-gray-600">Try adjusting your filters or search criteria</p>
          </div>
        </div>
      )}

      {/* Load More */}
      {displaySnacks.length > 0 && (
        <div className="text-center">
          <button className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
            Load More Snacks
          </button>
        </div>
      )}
    </div>
  );
};

export default SnacksPage;