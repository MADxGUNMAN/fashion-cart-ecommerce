import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import {
  addFeatureBanners,
  fetchFeatureBanners,
  getFeaturedProducts,
  updateFeaturedProducts,
  deleteFeatureBanner,
} from "../controllers/settingsController";

const router = express.Router();

// GET routes
router.get("/get-banners", authenticateJwt, fetchFeatureBanners);
router.get("/fetch-feature-products", authenticateJwt, getFeaturedProducts);

// DELETE routes (must come before POST routes with same base path)
router.delete(
  "/banners/:id",
  authenticateJwt,
  isSuperAdmin,
  deleteFeatureBanner
);

// POST routes
router.post(
  "/banners",
  authenticateJwt,
  isSuperAdmin,
  upload.array("images", 5),
  addFeatureBanners
);
router.post(
  "/update-feature-products",
  authenticateJwt,
  isSuperAdmin,
  updateFeaturedProducts
);

export default router;
