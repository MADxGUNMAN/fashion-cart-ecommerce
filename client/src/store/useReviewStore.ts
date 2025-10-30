import { create } from "zustand";
import axios from "axios";

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
  };
}

interface ReviewStore {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createReview: (productId: string, rating: number, comment: string) => Promise<boolean>;
  getProductReviews: (productId: string) => Promise<void>;
  updateReview: (reviewId: string, rating: number, comment: string) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<boolean>;
  clearError: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: [],
  isLoading: false,
  error: null,

  createReview: async (productId: string, rating: number, comment: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/reviews`,
        { productId, rating, comment },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh the reviews for this product
        await get().getProductReviews(productId);
        set({ isLoading: false });
        return true;
      } else {
        set({ error: response.data.message, isLoading: false });
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to create review";
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  getProductReviews: async (productId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/reviews/product/${productId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        set({ reviews: response.data.reviews, isLoading: false });
      } else {
        set({ error: response.data.message, isLoading: false });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to fetch reviews";
      set({ error: errorMessage, isLoading: false });
    }
  },

  updateReview: async (reviewId: string, rating: number, comment: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/reviews/${reviewId}`,
        { rating, comment },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Update the review in the local state
        const updatedReviews = get().reviews.map(review =>
          review.id === reviewId
            ? { ...review, rating, comment, updatedAt: new Date().toISOString() }
            : review
        );
        set({ reviews: updatedReviews, isLoading: false });
        return true;
      } else {
        set({ error: response.data.message, isLoading: false });
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to update review";
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  deleteReview: async (reviewId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/reviews/${reviewId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Remove the review from the local state
        const updatedReviews = get().reviews.filter(review => review.id !== reviewId);
        set({ reviews: updatedReviews, isLoading: false });
        return true;
      } else {
        set({ error: response.data.message, isLoading: false });
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to delete review";
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
