import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../server";

export const createCoupon = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { code, discountPercent, startDate, endDate, usageLimit } = req.body;

    // Validation
    if (!code || !discountPercent || !startDate || !endDate || !usageLimit) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
      return;
    }

    const newlyCreatedCoupon = await prisma.coupon.create({
      data: {
        code,
        discountPercent: parseFloat(discountPercent),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usageLimit: parseInt(usageLimit),
        usageCount: 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully!",
      coupon: newlyCreatedCoupon,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to created coupon",
    });
  }
};

export const fetchAllCoupons = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const fetchAllCouponsList = await prisma.coupon.findMany({
      orderBy: { createdAt: "asc" },
    });
    res.status(201).json({
      success: true,
      message: "Coupon created successfully!",
      couponList: fetchAllCouponsList,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupon list",
    });
  }
};

export const deleteCoupon = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.coupon.delete({
      where: { id },
    });

    res.status(201).json({
      success: true,
      message: "Coupon deleted successfully!",
      id: id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
};
