"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Star, 
  TrendingUp,
  AlertCircle,
  User,
  Store,
  Package,
  Calendar,
  Phone,
  MessageSquare,
  X,
  Filter,
  Eye,
  StarIcon
} from "lucide-react";

interface Report {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  rating: number | null;
  response: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    name: string;
    phone: string;
  };
  canteen: {
    name: string;
  };
  order: {
    id: string;
    totalPrice: number;
    createdAt: string;
    status: string;
  } | null;
  foodItem: {
    name: string;
    quantity: number;
  } | null;
}

interface Summary {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  highPriorityReports: number;
  averageRating: number | null;
  reportsByType: Record<string, number>;
  trends: Array<{
    date: string;
    count: number;
    dayName: string;
  }>;
}

const DeliveryReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);

      const response = await fetch(`/api/delivery-home/complaints?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
        setSummary(data.summary);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch reports:', response.status, errorData);
        
        // If user is not a delivery person, try to set them up
        if (response.status === 403 && errorData.error === "Not a delivery person") {
          console.log('Setting up delivery person...');
          try {
            const setupResponse = await fetch('/api/delivery-home/setup', { method: 'POST' });
            if (setupResponse.ok) {
              // Retry fetching reports after setup
              setTimeout(() => fetchReports(), 1000);
              return;
            }
          } catch (setupError) {
            console.error('Failed to setup delivery person:', setupError);
          }
        }
        
        alert(`Failed to fetch reports: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, priorityFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS': return <AlertTriangle className="h-4 w-4" />;
      case 'RESOLVED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DELIVERY': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SERVICE': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'FOOD_QUALITY': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'HYGIENE': return 'bg-red-100 text-red-800 border-red-200';
      case 'PRICING': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatReportType = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const openModal = (report: Report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Complaints & Reports</h1>
          <p className="text-gray-600 mt-2">Review complaints filed against your delivery service</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              try {
                const debugResponse = await fetch('/api/delivery-home/debug');
                const debugData = await debugResponse.json();
                console.log('Debug Data:', debugData);
                alert(`Debug Info:\nUser ID: ${debugData.userId}\nIs Delivery Person: ${debugData.currentDeliveryPerson}\nReports: ${debugData.reportsForUser}\nSee console for full details`);
              } catch (error) {
                console.error('Error fetching debug data:', error);
              }
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            Debug Info
          </Button>
          <Button
            onClick={async () => {
              try {
                const seedResponse = await fetch('/api/delivery-home/complaints/seed', { method: 'POST' });
                if (seedResponse.ok) {
                  alert('Sample complaint data created!');
                  fetchReports();
                } else {
                  const error = await seedResponse.json();
                  alert(`Failed to create sample data: ${error.error}`);
                }
              } catch (error) {
                console.error('Error creating sample data:', error);
              }
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            Add Sample Data
          </Button>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900">{summary.totalReports}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{summary.pendingReports}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{summary.resolvedReports}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-3xl font-bold text-gray-900">
                  {summary.averageRating ? `${summary.averageRating}/5` : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className={`h-8 w-8 ${summary.averageRating && summary.averageRating >= 4 ? 'text-yellow-500' : 'text-gray-400'}`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filter Reports</h3>
            <Button
              onClick={() => setShowFilters(false)}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Types</option>
                <option value="DELIVERY">Delivery</option>
                <option value="SERVICE">Service</option>
                <option value="FOOD_QUALITY">Food Quality</option>
                <option value="HYGIENE">Hygiene</option>
                <option value="PRICING">Pricing</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select 
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold">Reports Against You</h3>
          <p className="text-gray-600">
            {reports.length > 0 
              ? `Found ${reports.length} report${reports.length !== 1 ? 's' : ''}`
              : 'No reports found'
            }
          </p>
        </div>
        
        <div className="p-6">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-green-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Complaints Found</h3>
              <p className="text-gray-600">
                {statusFilter !== 'ALL' || typeFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'No reports match your current filters.'
                  : 'No complaints have been filed against you. Keep up the excellent service!'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(report.type)}`}>
                          {formatReportType(report.type)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          {report.status.replace('_', ' ')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(report.priority)}`}>
                          {report.priority}
                        </span>
                        {report.rating && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200 flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            {report.rating}/5
                          </span>
                        )}
                      </div>
                      
                      {/* Title */}
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">{report.title}</h4>
                      
                      {/* Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{report.customer.name}</span>
                          {report.customer.phone && (
                            <>
                              <Phone className="h-3 w-3 ml-2" />
                              <span>{report.customer.phone}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Store className="h-4 w-4" />
                          <span>{report.canteen.name.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Order Info */}
                      {report.order && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Package className="h-4 w-4" />
                          <span>Order #{report.order.id.slice(-8)} - ৳{report.order.totalPrice}</span>
                        </div>
                      )}

                      {/* Description Preview */}
                      {report.description && (
                        <p className="text-gray-700 mb-3 line-clamp-2">{report.description}</p>
                      )}

                      {/* Response Indicator */}
                      {report.response && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-green-900 mb-1">✅ Management has responded</p>
                          <p className="text-sm text-green-700 line-clamp-2">{report.response}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <Button
                      onClick={() => openModal(report)}
                      variant="outline"
                      size="sm"
                      className="ml-4 flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Trends */}
      {summary && summary.trends.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold">Recent Activity (Last 7 Days)</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              {summary.trends.map((trend, index) => (
                <div key={trend.date} className="text-center flex-1">
                  <div className="text-sm text-gray-600 mb-2">{trend.dayName}</div>
                  <div className="text-2xl font-bold mb-2">{trend.count}</div>
                  <div className="w-8 h-2 bg-gray-200 rounded-full mx-auto">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.max((trend.count / Math.max(...summary.trends.map(t => t.count))) * 100, 5)}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span>Daily complaint reports received</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {formatReportType(selectedReport.type)} Report
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status.replace('_', ' ')}
                  </span>
                </h2>
                <p className="text-gray-600">
                  Filed on {new Date(selectedReport.createdAt).toLocaleDateString()} by {selectedReport.customer.name}
                </p>
              </div>
              <Button onClick={closeModal} variant="ghost" size="sm">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Report Details */}
              <div>
                <h3 className="font-semibold mb-3">Report Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="font-medium">Title:</span> {selectedReport.title}
                  </div>
                  {selectedReport.description && (
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="mt-1 text-gray-700">{selectedReport.description}</p>
                    </div>
                  )}
                  <div className="flex gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Priority:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(selectedReport.priority)}`}>
                        {selectedReport.priority}
                      </span>
                    </div>
                    {selectedReport.rating && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Rating:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              className={`h-4 w-4 ${
                                star <= selectedReport.rating!
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-sm">({selectedReport.rating}/5)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div><span className="font-medium">Name:</span> {selectedReport.customer.name}</div>
                  {selectedReport.customer.phone && (
                    <div><span className="font-medium">Phone:</span> {selectedReport.customer.phone}</div>
                  )}
                </div>
              </div>

              {/* Order Information */}
              {selectedReport.order && (
                <div>
                  <h3 className="font-semibold mb-3">Related Order</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div><span className="font-medium">Order ID:</span> {selectedReport.order.id}</div>
                    <div><span className="font-medium">Amount:</span> ৳{selectedReport.order.totalPrice}</div>
                    <div><span className="font-medium">Status:</span> {selectedReport.order.status}</div>
                    <div><span className="font-medium">Date:</span> {new Date(selectedReport.order.createdAt).toLocaleDateString()}</div>
                    {selectedReport.foodItem && (
                      <div><span className="font-medium">Item:</span> {selectedReport.foodItem.name} (x{selectedReport.foodItem.quantity})</div>
                    )}
                  </div>
                </div>
              )}

              {/* Management Response */}
              {selectedReport.response && (
                <div>
                  <h3 className="font-semibold mb-3">Management Response</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-900">{selectedReport.response}</p>
                    <p className="text-sm text-green-700 mt-2">
                      Responded on {new Date(selectedReport.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryReportsPage;