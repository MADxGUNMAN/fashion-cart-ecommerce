import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import {
  capturePaypalOrder,
  createCODOrder,
  createFinalOrder,
  createPaypalOrder,
  getAllOrdersForAdmin,
  getOrder,
  getOrdersByUserId,
  updateOrderStatus,
  updatePaymentStatus,
} from "../controllers/orderController";

const router = express.Router();

router.use(authenticateJwt);

router.post("/create-paypal-order", createPaypalOrder);
router.post("/capture-paypal-order", capturePaypalOrder);
router.post("/create-final-order", createFinalOrder);
router.post("/create-cod-order", createCODOrder);
router.get("/get-single-order/:orderId", getOrder);
router.get("/get-order-by-user-id", getOrdersByUserId);
router.get("/get-all-orders-for-admin", isSuperAdmin, getAllOrdersForAdmin);
router.put("/:orderId/status", isSuperAdmin, updateOrderStatus);
router.put("/:orderId/payment-status", isSuperAdmin, updatePaymentStatus);

export default router;
