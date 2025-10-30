"use client";

import { useEffect, useState } from "react";
import { Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useReviewStore, Review } from "@/store/useReviewStore";

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { reviews, isLoading, getProductReviews } = useReviewStore();
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (productId) {
      getProductReviews(productId);
    }
  }, [productId, getProductReviews]);

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100 
      : 0
  }));

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4", 
      lg: "h-5 w-5"
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Customer Reviews</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
        
        {reviews.length > 0 ? (
          <>
            {/* Rating Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {averageRating.toFixed(1)}
                </div>
                {renderStars(Math.round(averageRating), "lg")}
                <p className="text-sm text-gray-600 mt-2">
                  Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-8">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Individual Reviews */}
            <div className="space-y-4">
              {displayedReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{review.user.name || 'Anonymous'}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </p>
                          </div>
                          {renderStars(review.rating, "sm")}
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Show More/Less Button */}
            {reviews.length > 3 && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews 
                    ? `Show Less` 
                    : `Show All ${reviews.length} Reviews`
                  }
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium mb-2">No reviews yet</h4>
            <p className="text-gray-600">
              Be the first to review {productName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
