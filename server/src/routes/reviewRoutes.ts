import express from "express";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} from "../controllers/reviewController";
import { authenticateJwt } from "../middleware/authMiddleware";

const router = express.Router();

// Create a review (authenticated)
router.post("/", authenticateJwt, createReview);

// Get reviews for a product (public)
router.get("/product/:productId", getProductReviews);

// Update a review (authenticated)
router.put("/:reviewId", authenticateJwt, updateReview);

// Delete a review (authenticated)
router.delete("/:reviewId", authenticateJwt, deleteReview);

export default router;
