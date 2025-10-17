"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  Filter,
  Search,
  Star,
  MapPin,
  Utensils,
  Truck,
  Shield,
  DollarSign,
  MoreHorizontal,
  Calendar,
  User,
  Send,
  Loader2
} from 'lucide-react';

// Types based on your Prisma schema
type ReportType = 'FOOD_QUALITY' | 'SERVICE' | 'HYGIENE' | 'DELIVERY' | 'PRICING' | 'OTHER';
type ReportStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type CanteenName = 'Khans_Kitchen' | 'Olympia_Cafe' | 'Neptune_Cafe';

interface CustomerReport {
  id: string;
  type: ReportType;
  title: string;
  description?: string;
  status: ReportStatus;
  priority: ReportPriority;
  rating?: number;
  response?: string;
  customerId: string;
  canteenId: string;
  orderId?: string;
  foodItemId?: string;
  deliveryPersonId?: string;
  createdAt: string;
  updatedAt: string;
  canteen?: {
    name: CanteenName;
    canteen_image?: string;
  };
  order?: {
    id: string;
    totalPrice: number;
  };
  foodItem?: {
    name: string;
  };
}

interface NewReport {
  type: ReportType;
  title: string;
  description: string;
  priority: ReportPriority;
  canteenId: string;
  orderId?: string;
  foodItemId?: string;
  rating?: number;
}

const REPORT_TYPES = [
  { value: 'FOOD_QUALITY', label: 'Food Quality', icon: Utensils, color: 'bg-red-500' },
  { value: 'SERVICE', label: 'Service', icon: User, color: 'bg-orange-500' },
  { value: 'HYGIENE', label: 'Hygiene', icon: Shield, color: 'bg-green-500' },
  { value: 'DELIVERY', label: 'Delivery', icon: Truck, color: 'bg-yellow-500' },
  { value: 'PRICING', label: 'Pricing', icon: DollarSign, color: 'bg-purple-500' },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal, color: 'bg-gray-500' },
] as const;

interface Canteen {
  id: string;
  name: CanteenName;
  canteen_image?: string;
  owner?: {
    name: string;
  };
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-orange-100 text-orange-800', icon: MessageSquare },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
};

const getCanteenDisplayName = (name: string): string => {
  switch (name) {
    case 'Khans_Kitchen':
      return "Khan's Kitchen";
    case 'Olympia_Cafe':
      return 'Olympia Cafe';
    case 'Neptune_Cafe':
      return 'Neptune Cafe';
    default:
      return name.replace('_', ' ');
  }
};

const CustomerReportsPage = () => {
  const { user } = useUser();
  const [reports, setReports] = useState<CustomerReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<CustomerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<ReportType | 'ALL'>('ALL');
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);

  const [newReport, setNewReport] = useState<NewReport>({
    type: 'FOOD_QUALITY',
    title: '',
    description: '',
    priority: 'MEDIUM',
    canteenId: '',
    orderId: '',
    foodItemId: '',
    rating: undefined,
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch('/api/customer-home/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        showNotification('error', 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      showNotification('error', 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const fetchRecentOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/customer-home/orders?limit=10');
      if (response.ok) {
        const data = await response.json();
        setRecentOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  }, []);

  const fetchCanteens = useCallback(async () => {
    try {
      const response = await fetch('/api/customer-home/canteens');
      if (response.ok) {
        const data = await response.json();
        setCanteens(data.canteens || []);
      }
    } catch (error) {
      console.error('Error fetching canteens:', error);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchRecentOrders();
    fetchCanteens();
  }, [fetchReports, fetchRecentOrders, fetchCanteens]);

  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(
        report =>
          report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.canteen?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(report => report.type === typeFilter);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, typeFilter]);

  const handleSubmitReport = async () => {
    if (!newReport.title.trim()) {
      showNotification('error', 'Please enter a report title');
      return;
    }

    if (!newReport.canteenId) {
      showNotification('error', 'Please select a canteen');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/customer-home/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReport),
      });

      if (response.ok) {
        showNotification('success', 'Report submitted successfully');
        setShowNewReportForm(false);
        setNewReport({
          type: 'FOOD_QUALITY',
          title: '',
          description: '',
          priority: 'MEDIUM',
          canteenId: '',
          orderId: '',
          foodItemId: '',
          rating: undefined,
        });
        fetchReports();
      } else {
        const error = await response.json();
        showNotification('error', error.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      showNotification('error', 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const getReportTypeIcon = (type: ReportType) => {
    const config = REPORT_TYPES.find(t => t.value === type);
    return config ? config.icon : MoreHorizontal;
  };

  const getReportTypeColor = (type: ReportType) => {
    const config = REPORT_TYPES.find(t => t.value === type);
    return config ? config.color : 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6 space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <FileText className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Reports</h1>
              <p className="text-gray-600">Submit and track your feedback and complaints</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewReportForm(true)}
            className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = reports.filter(r => r.status === status).length;
          const Icon = config.icon;
          return (
            <div key={status} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${config.color.split(' ')[0]} text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">{config.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <option key={status} value={status}>{config.label}</option>
            ))}
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ReportType | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="ALL">All Types</option>
            {REPORT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </div>
      </div>

      {/* New Report Form Modal */}
      {showNewReportForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-orange-600">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Submit New Report</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type *
                  </label>
                  <select
                    value={newReport.type}
                    onChange={(e) => setNewReport(prev => ({ ...prev, type: e.target.value as ReportType }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {REPORT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newReport.priority}
                    onChange={(e) => setNewReport(prev => ({ ...prev, priority: e.target.value as ReportPriority }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                      <option key={priority} value={priority}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Canteen *
                </label>
                <select
                  value={newReport.canteenId}
                  onChange={(e) => setNewReport(prev => ({ ...prev, canteenId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select a canteen</option>
                  {canteens.map((canteen: Canteen) => (
                    <option key={canteen.id} value={canteen.id}>
                      {getCanteenDisplayName(canteen.name)}
                    </option>
                  ))}
                </select>
              </div>

              {recentOrders.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Order (optional)
                  </label>
                  <select
                    value={newReport.orderId || ''}
                    onChange={(e) => setNewReport(prev => ({ ...prev, orderId: e.target.value || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">No specific order</option>
                    {recentOrders.map(order => (
                      <option key={order.id} value={order.id}>
                        Order #{order.id.slice(-6)} - ৳{order.totalPrice} ({new Date(order.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newReport.title}
                  onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Brief summary of the issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newReport.description}
                  onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Detailed description of the issue..."
                />
              </div>

              {(newReport.type === 'FOOD_QUALITY' || newReport.type === 'SERVICE') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (1-5 stars)
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReport(prev => ({ ...prev, rating: star }))}
                        className={`p-1 ${
                          newReport.rating && star <= newReport.rating
                            ? 'text-yellow-500'
                            : 'text-gray-300'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex space-x-3">
              <button
                onClick={handleSubmitReport}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Report
              </button>
              <button
                onClick={() => setShowNewReportForm(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => {
            const TypeIcon = getReportTypeIcon(report.type);
            const StatusIcon = STATUS_CONFIG[report.status].icon;
            
            return (
              <div key={report.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getReportTypeColor(report.type)} text-white flex-shrink-0`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{report.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[report.status].color}`}>
                            {STATUS_CONFIG[report.status].label}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[report.priority].color}`}>
                            {PRIORITY_CONFIG[report.priority].label}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{report.description}</p>
                        
                        <div className="flex flex-wrap items-center text-sm text-gray-500 space-x-4 mb-3">
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {getCanteenDisplayName(report.canteen?.name || '')}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                          {report.rating && (
                            <span className="flex items-center">
                              <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                              {report.rating}/5
                            </span>
                          )}
                          {report.order && (
                            <span className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              Order #{report.order.id.slice(-6)}
                            </span>
                          )}
                        </div>

                        {report.response && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center mb-2">
                              <MessageSquare className="w-4 h-4 mr-2 text-orange-600" />
                              <span className="font-medium text-gray-900">Response</span>
                            </div>
                            <p className="text-gray-700">{report.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:ml-6 flex items-center">
                    <StatusIcon className={`w-5 h-5 ${STATUS_CONFIG[report.status].color.split(' ')[1]}`} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                ? 'Try adjusting your filters to see more reports.'
                : "You haven't submitted any reports yet."}
            </p>
            {!searchTerm && statusFilter === 'ALL' && typeFilter === 'ALL' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowNewReportForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your First Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReportsPage;