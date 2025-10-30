import axios from "axios";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { NextFunction, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../server";
import { sendEmail, generateOrderConfirmationEmail, generateAdminOrderNotificationEmail } from "../utils/emailService";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || "sandbox"; // sandbox or live

async function getPaypalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials not configured in environment variables");
  }
  
  const baseUrl = PAYPAL_ENVIRONMENT === "live" 
    ? "https://api-m.paypal.com" 
    : "https://api-m.sandbox.paypal.com";
  
  const response = await axios.post(
    `${baseUrl}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
    }
  );

  return response.data.access_token;
}

export const createPaypalOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items, total } = req.body;
    const accessToken = await getPaypalAccessToken();

    const baseUrl = PAYPAL_ENVIRONMENT === "live" 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";

    // PayPal Sandbox has limited currency support, so we convert INR to USD for sandbox
    // In production, you can use INR directly if your PayPal account supports it
    const useUSD = PAYPAL_ENVIRONMENT === "sandbox";
    const currencyCode = useUSD ? "USD" : "INR";
    const conversionRate = useUSD ? (1 / 83) : 1; // 1 USD = 83 INR (approximate)
    
    const paypalItems = items.map((item: any) => {
      const inrPrice = item.product?.price || item.price;
      const convertedPrice = useUSD ? (inrPrice * conversionRate).toFixed(2) : inrPrice.toFixed(2);
      
      return {
        name: item.product?.name || item.name,
        description: item.product?.description || item.description || "",
        sku: item.product?.id || item.id,
        unit_amount: {
          currency_code: currencyCode,
          value: convertedPrice,
        },
        quantity: item.quantity.toString(),
        category: "PHYSICAL_GOODS",
      };
    });

    const itemTotal = paypalItems.reduce(
      (sum: any, item: any) =>
        sum + parseFloat(item.unit_amount.value) * parseInt(item.quantity),
      0
    );

    // Convert total if using USD
    const convertedTotal = useUSD ? (total * conversionRate).toFixed(2) : total.toFixed(2);

    const response = await axios.post(
      `${baseUrl}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currencyCode,
              value: convertedTotal,
              breakdown: {
                item_total: {
                  currency_code: currencyCode,
                  value: itemTotal.toFixed(2),
                },
              },
            },
            items: paypalItems,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "PayPal-Request-ID": uuidv4(),
        },
      }
    );

    res.status(200).json(response.data);
  } catch (e: any) {
    console.error("PayPal Order Creation Error:", e);
    console.error("Error Response:", e.response?.data);
    console.error("Request Body:", req.body);
    
    res.status(500).json({
      success: false,
      message: "Failed to create PayPal order",
      error: e.response?.data || e.message,
    });
  }
};

export const capturePaypalOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.body;
    const accessToken = await getPaypalAccessToken();

    const baseUrl = PAYPAL_ENVIRONMENT === "live" 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";

    const response = await axios.post(
      `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (e: any) {
    console.error("PayPal Capture Error:", e);
    console.error("Error Response:", e.response?.data);
    
    res.status(500).json({
      success: false,
      message: "Failed to capture PayPal payment",
      error: e.response?.data || e.message,
    });
  }
};

export const createFinalOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items, addressId, couponId, total, paymentId, paymentMethod = "CREDIT_CARD" } = req.body;
    const userId = req.user?.userId;

    console.log(items, "itemsitemsitems");

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    // Determine payment status based on payment method
    const paymentStatus = paymentMethod === "CASH_ON_DELIVERY" ? "PENDING" : "COMPLETED";

    //start our transaction

    const order = await prisma.$transaction(async (prisma) => {
      //create new order
      const newOrder = await prisma.order.create({
        data: {
          userId,
          addressId,
          couponId,
          total,
          paymentMethod,
          paymentStatus,
          paymentId: paymentMethod === "CASH_ON_DELIVERY" ? null : paymentId,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              productCategory: item.productCategory,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              price: item.price,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });
      }

      await prisma.cartItem.deleteMany({
        where: {
          cart: { userId },
        },
      });

      await prisma.cart.delete({
        where: { userId },
      });

      if (couponId) {
        await prisma.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    // Prices are already in INR, no conversion needed
    const orderWithInr = order;

    // Send email notifications
    try {
      // Get user details for email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });

      if (user && user.email) {
        // Prepare order data for email
        const emailOrderData = {
          order: orderWithInr,
          user: user,
          items: orderWithInr.items
        };

        // Send confirmation email to customer
        const customerEmailHtml = generateOrderConfirmationEmail(emailOrderData);
        await sendEmail({
          to: user.email,
          subject: `Order Confirmation - ${orderWithInr.id}`,
          html: customerEmailHtml
        });

        // Send notification email to admin (if admin email is configured)
        if (process.env.EMAIL_USER) {
          const adminEmailHtml = generateAdminOrderNotificationEmail(emailOrderData);
          await sendEmail({
            to: process.env.EMAIL_USER,
            subject: `New Order Received - ${orderWithInr.id}`,
            html: adminEmailHtml
          });
        }
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation emails:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json(orderWithInr);
  } catch (e) {
    console.log(e, "createFinalOrder");

    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};

export const getOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { orderId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
        address: true,
        coupon: true,
      },
    });

    // Prices are already in INR, no conversion needed
    const orderWithInr = order;

    res.status(200).json(orderWithInr);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { orderId } = req.params;
    const { status } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    await prisma.order.updateMany({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};

export const getAllOrdersForAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    const orders = await prisma.order.findMany({
      include: {
        items: true,
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Prices are already in INR, no conversion needed
    const ordersWithInr = orders;

    res.status(200).json(ordersWithInr);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};

export const createCODOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items, addressId, couponId, total } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });
      return;
    }

    if (!addressId) {
      res.status(400).json({
        success: false,
        message: "Address is required for COD orders",
      });
      return;
    }

    const order = await prisma.$transaction(async (prisma) => {
      // Create new COD order
      const newOrder = await prisma.order.create({
        data: {
          userId,
          addressId,
          couponId,
          total,
          paymentMethod: "CASH_ON_DELIVERY",
          paymentStatus: "PENDING",
          paymentId: null,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              productCategory: item.productCategory,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              price: item.price,
            })),
          },
        },
        include: {
          items: true,
          address: true,
        },
      });

      // Update product stock and sold count
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });
      }

      // Clear user's cart
      await prisma.cartItem.deleteMany({
        where: {
          cart: { userId },
        },
      });

      await prisma.cart.delete({
        where: { userId },
      });

      // Update coupon usage if applied
      if (couponId) {
        await prisma.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    // Send email notifications for COD order
    try {
      // Get user details for email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });

      if (user && user.email) {
        // Prepare order data for email
        const emailOrderData = {
          order: order,
          user: user,
          items: order.items
        };

        // Send confirmation email to customer
        const customerEmailHtml = generateOrderConfirmationEmail(emailOrderData);
        await sendEmail({
          to: user.email,
          subject: `COD Order Confirmation - ${order.id}`,
          html: customerEmailHtml
        });

        // Send notification email to admin
        if (process.env.EMAIL_USER) {
          const adminEmailHtml = generateAdminOrderNotificationEmail(emailOrderData);
          await sendEmail({
            to: process.env.EMAIL_USER,
            subject: `New COD Order - ${order.id}`,
            html: adminEmailHtml
          });
        }
      }
    } catch (emailError) {
      console.error('Failed to send COD order emails:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json({
      success: true,
      message: "COD order created successfully",
      order,
    });
  } catch (e) {
    console.error("COD Order Creation Error:", e);
    console.error("Request body:", req.body);
    res.status(500).json({
      success: false,
      message: "Failed to create COD order",
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
};

export const updatePaymentStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    if (!orderId) {
      res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus },
      include: {
        items: true,
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      order: updatedOrder,
    });
  } catch (e) {
    console.error("Update Payment Status Error:", e);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
};

export const getOrdersByUserId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },
      include: {
        items: true,
        address: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Prices are already in INR, no conversion needed
    const ordersWithInr = orders;

    res.json(ordersWithInr);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};
