"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  Star, 
  MessageSquare, 
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Award,
  Users,
  TrendingUp,
  Send
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface CustomerReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  canteen: {
    id: string;
    name: string;
    canteen_image: string;
  };
}

interface Canteen {
  id: string;
  name: string;
  canteen_image: string;
}

const CustomerReviews = () => {
  const { user } = useUser();
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);
  const [editingReview, setEditingReview] = useState<CustomerReview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [selectedCanteenId, setSelectedCanteenId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch('/api/customer-home/customer-reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCanteens = useCallback(async () => {
    try {
      const response = await fetch('/api/canteens');
      if (response.ok) {
        const data = await response.json();
        setCanteens(data.canteens || []);
      }
    } catch (error) {
      console.error('Error fetching canteens:', error);
    }
  }, []);

  useEffect(() => {
    fetchCanteens();
    fetchReviews();
  }, [fetchCanteens, fetchReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const endpoint = editingReview 
        ? '/api/customer-home/customer-reviews'
        : '/api/customer-home/customer-reviews';
      
      const method = editingReview ? 'PUT' : 'POST';
      
      const body = editingReview
        ? { reviewId: editingReview.id, rating, comment }
        : { canteenId: selectedCanteenId, rating, comment };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchReviews();
        resetForm();
        setShowAddReview(false);
        setEditingReview(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`/api/customer-home/customer-reviews?reviewId=${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchReviews();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const handleEditReview = (review: CustomerReview) => {
    setEditingReview(review);
    setSelectedCanteenId(review.canteen.id);
    setRating(review.rating);
    setComment(review.comment);
    setShowAddReview(true);
  };

  const resetForm = () => {
    setSelectedCanteenId('');
    setRating(5);
    setComment('');
  };

  const renderStars = (currentRating: number, interactive: boolean = false, onStarClick?: (star: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < currentRating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={() => interactive && onStarClick && onStarClick(i + 1)}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReviewStats = () => {
    if (reviews.length === 0) return { avg: 0, total: 0, thisMonth: 0 };
    
    const avg = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const thisMonth = reviews.filter(review => 
      new Date(review.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    
    return {
      avg: parseFloat(avg.toFixed(1)),
      total: reviews.length,
      thisMonth
    };
  };

  const stats = getReviewStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2">Loading your reviews...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-orange-600 to-red-600 rounded-lg shadow-lg text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <MessageSquare className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold">My Reviews</h1>
              <p className="text-orange-100 text-lg">Share your experience with our canteens</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingReview(null);
              setShowAddReview(true);
            }}
            className="flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Review
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <MessageSquare className="w-6 h-6 mr-2" />
              <span className="text-sm">Total Reviews</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <Star className="w-6 h-6 mr-2" />
              <span className="text-sm">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.avg}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <Award className="w-6 h-6 mr-2" />
              <span className="text-sm">Canteens Reviewed</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {new Set(reviews.map(r => r.canteen.id)).size}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 mr-2" />
              <span className="text-sm">This Month</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.thisMonth}</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Review Form */}
      {showAddReview && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingReview ? 'Edit Review' : 'Add New Review'}
          </h2>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {!editingReview && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Canteen *
                </label>
                <select
                  value={selectedCanteenId}
                  onChange={(e) => setSelectedCanteenId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Choose a canteen...</option>
                  {canteens.map((canteen) => (
                    <option key={canteen.id} value={canteen.id}>
                      {canteen.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex items-center space-x-1">
                {renderStars(rating, true, setRating)}
                <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Share your experience with this canteen..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={submitting || (!editingReview && !selectedCanteenId)}
                className="flex items-center px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddReview(false);
                  setEditingReview(null);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start space-x-4">
                {/* Canteen Image */}
                <div className="shrink-0">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                    {review.canteen.canteen_image ? (
                      <Image
                        src={review.canteen.canteen_image}
                        alt={review.canteen.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{review.canteen.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{formatDate(review.createdAt)}</span>
                        {review.createdAt !== review.updatedAt && (
                          <span className="text-blue-600">• Edited</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                        <span className="ml-1 text-sm font-medium text-gray-700">
                          {review.rating}/5
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit review"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 leading-relaxed mt-2">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600 mb-4">
              Start sharing your experience by reviewing canteens you've visited!
            </p>
            <button
              onClick={() => {
                resetForm();
                setEditingReview(null);
                setShowAddReview(true);
              }}
              className="flex items-center mx-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Write Your First Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReviews;