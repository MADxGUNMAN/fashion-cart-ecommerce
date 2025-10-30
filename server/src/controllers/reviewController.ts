import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../server";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// Create a review
export const createReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { productId, rating, comment } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });
      return;
    }

    // Validate input
    if (!productId || !rating || !comment) {
      res.status(400).json({
        success: false,
        message: "Product ID, rating, and comment are required",
      });
      return;
    }

    // Check if rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
      return;
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
      return;
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update product average rating
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const averageRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: { rating: averageRating },
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get reviews for a product
export const getProductReviews = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update a review
export const updateReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });
      return;
    }

    // Check if review exists and belongs to user
    const existingReview = await (prisma as any).review.findFirst({
      where: {
        id: reviewId,
        userId,
      },
    });

    if (!existingReview) {
      res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to update it",
      });
      return;
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: rating || existingReview.rating,
        comment: comment || existingReview.comment,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update product average rating
    const reviews = await (prisma as any).review.findMany({
      where: { productId: existingReview.productId },
      select: { rating: true },
    });

    const averageRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;

    await prisma.product.update({
      where: { id: existingReview.productId },
      data: { rating: averageRating },
    });

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a review
export const deleteReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { reviewId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });
      return;
    }

    // Check if review exists and belongs to user
    const existingReview = await (prisma as any).review.findFirst({
      where: {
        id: reviewId,
        userId,
      },
    });

    if (!existingReview) {
      res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to delete it",
      });
      return;
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update product average rating
    const reviews = await prisma.review.findMany({
      where: { productId: existingReview.productId },
      select: { rating: true },
    });

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
      : 0;

    await prisma.product.update({
      where: { id: existingReview.productId },
      data: { rating: averageRating },
    });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
