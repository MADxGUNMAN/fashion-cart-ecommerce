"use client";

import { paymentAction } from "@/actions/payment";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/utils/currency";
import { useAddressStore } from "@/store/useAddressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { CartItem, useCartStore } from "@/store/useCartStore";
import { Coupon, useCouponStore } from "@/store/useCouponStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useProductStore } from "@/store/useProductStore";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function CheckoutContent() {
  const { addresses, fetchAddresses } = useAddressStore();
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<
    (CartItem & { product: any })[]
  >([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponAppliedError, setCouponAppliedError] = useState("");
  const { items, fetchCart, clearCart } = useCartStore();
  const { getProductById } = useProductStore();
  const { fetchCoupons, couponList } = useCouponStore();
  const {
    createPayPalOrder,
    capturePayPalOrder,
    createFinalOrder,
    createCODOrder,
    isPaymentProcessing,
    resetPaymentProcessing,
  } = useOrderStore();
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchCoupons();
    fetchAddresses();
    fetchCart();
  }, [fetchAddresses, fetchCart, fetchCoupons]);

  useEffect(() => {
    const findDefaultAddress = addresses.find((address) => address.isDefault);

    if (findDefaultAddress) {
      setSelectedAddress(findDefaultAddress.id);
    }
  }, [addresses]);

  useEffect(() => {
    const fetchIndividualProductDetails = async () => {
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const product = await getProductById(item.productId);
          return { ...item, product };
        })
      );

      setCartItemsWithDetails(itemsWithDetails);
    };

    fetchIndividualProductDetails();
  }, [items, getProductById]);

  function handleApplyCoupon() {
    const getCurrentCoupon = couponList.find((c) => c.code === couponCode);

    if (!getCurrentCoupon) {
      setCouponAppliedError("Invalied Coupon code");
      setAppliedCoupon(null);
      return;
    }

    const now = new Date();

    if (
      now < new Date(getCurrentCoupon.startDate) ||
      now > new Date(getCurrentCoupon.endDate)
    ) {
      setCouponAppliedError(
        "Coupon is not valid in this time or expired coupon"
      );
      setAppliedCoupon(null);
      return;
    }

    if (getCurrentCoupon.usageCount >= getCurrentCoupon.usageLimit) {
      setCouponAppliedError(
        "Coupon has reached its usage limit! Please try a diff coupon"
      );
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(getCurrentCoupon);
    setCouponAppliedError("");
  }

  const handlePrePaymentFlow = async () => {
    const result = await paymentAction(checkoutEmail);
    if (!result.success) {
      toast({
        title: result.error,
        variant: "destructive",
      });

      return;
    }

    setShowPaymentFlow(true);
  };

  const handleFinalOrderCreation = async (data: any, paymentMethod: "CREDIT_CARD" | "PAYPAL_WALLET" | "PAYPAL_PAY_LATER" | "VENMO" | "BANK_TRANSFER" = "CREDIT_CARD") => {
    if (!user) {
      toast({
        title: "User not authenticated",
      });

      return;
    }
    try {
      const orderData = {
        userId: user?.id,
        addressId: selectedAddress,
        items: cartItemsWithDetails.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          productCategory: item.product.category,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.product.price,
        })),
        couponId: appliedCoupon?.id,
        total,
        paymentMethod: paymentMethod,
        paymentStatus: "COMPLETED" as const,
        paymentId: data.id,
      };

      const createFinalOrderResponse = await createFinalOrder(orderData);

      if (createFinalOrderResponse) {
        // Immediately reset payment processing state
        resetPaymentProcessing();
        await clearCart();
        toast({
          title: "Order placed successfully!",
          description: "Your payment has been processed and order has been placed.",
        });
        // Small delay to ensure state is updated before redirect
        setTimeout(() => {
          router.replace("/account");
        }, 300);
      } else {
        // Reset payment processing state on error
        resetPaymentProcessing();
        toast({
          title: "There is some error while processing final order",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Reset payment processing state on error
      resetPaymentProcessing();
      console.error(error);
      toast({
        title: "There is some error while processing final order",
        variant: "destructive",
      });
    }
  };

  const handleCODOrderCreation = async () => {
    if (!user) {
      toast({
        title: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAddress) {
      toast({
        title: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderData = {
        userId: user.id,
        addressId: selectedAddress,
        items: cartItemsWithDetails.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          productCategory: item.product.category,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.product.price,
        })),
        couponId: appliedCoupon?.id,
        total,
      };

      const createCODOrderResponse = await createCODOrder(orderData);

      if (createCODOrderResponse) {
        // Immediately reset payment processing state
        resetPaymentProcessing();
        await clearCart();
        toast({
          title: "Order placed successfully!",
          description: "Your Cash on Delivery order has been placed. Pay when you receive your items.",
        });
        // Small delay to ensure state is updated before redirect
        setTimeout(() => {
          router.replace("/account");
        }, 300);
      } else {
        // Reset payment processing state on error
        resetPaymentProcessing();
        console.error("COD Order failed - checking store error:", useOrderStore.getState().error);
        toast({
          title: "Failed to place COD order",
          description: "Please check the console for more details and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Reset payment processing state on error
      resetPaymentProcessing();
      console.error(error);
      toast({
        title: "Failed to place COD order",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const subTotal = cartItemsWithDetails.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );

  const discountAmount = appliedCoupon
    ? (subTotal * appliedCoupon.discountPercent) / 100
    : 0;

  const total = subTotal - discountAmount;

  // Remove the aggressive timeout that was interfering with normal payment processing

  if (isPaymentProcessing) {
    return (
      <Skeleton className="w-full h-[600px] rounded-xl">
        <div className="h-full flex justify-center items-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">
              Processing payment...Please wait!
            </h1>
            <p className="text-gray-600">
              This should only take a few seconds...
            </p>
          </div>
        </div>
      </Skeleton>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Delivery</h2>
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="flex items-start spce-x-2">
                    <Checkbox
                      id={address.id}
                      checked={selectedAddress === address.id}
                      onCheckedChange={() => setSelectedAddress(address.id)}
                    />
                    <Label htmlFor={address.id} className="flex-grow ml-3">
                      <div>
                        <span className="font-medium">{address.name}</span>
                        {address.isDefault && (
                          <span className="ml-2 text-sm text-green-600">
                            (Default)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700">
                        {address.address}
                      </div>
                      <div className="text-sm text-gray-600">
                        {address.city}, {address.country}, {address.postalCode}
                      </div>
                      <div className="text-sm text-gray-600">
                        {address.phone}
                      </div>
                    </Label>
                  </div>
                ))}
                <Button onClick={() => router.push("/account")}>
                  Add a new Address
                </Button>
              </div>
            </Card>
            <Card className="p-6">
              {showPaymentFlow ? (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Payment</h3>
                  <p className="mb-3">
                    All transactions are secure and encrypted
                  </p>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> PayPal payments are processed in USD. The amount will be automatically converted from INR to USD at the current exchange rate for payment processing.
                    </p>
                  </div>
                  {/* PayPal Wallet Button */}
                  <div className="mb-4">
                    <h4 className="text-lg font-medium mb-2">Pay with PayPal</h4>
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        color: "blue",
                        shape: "rect",
                        label: "paypal",
                        height: 50,
                      }}
                      fundingSource="paypal"
                      createOrder={async () => {
                        const orderId = await createPayPalOrder(
                          cartItemsWithDetails,
                          total
                        );

                        if (orderId === null) {
                          throw new Error("Failed to create paypal order");
                        }

                        return orderId;
                      }}
                      onApprove={async (data, actions) => {
                        const captureData = await capturePayPalOrder(
                          data.orderID
                        );

                        if (captureData) {
                          await handleFinalOrderCreation(captureData, "PAYPAL_WALLET");
                        } else {
                          alert("Failed to capture paypal order");
                        }
                      }}
                    />
                  </div>

                  {/* Pay Later Button */}
                  <div className="mb-4">
                    <h4 className="text-lg font-medium mb-2">Buy Now, Pay Later</h4>
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        color: "white",
                        shape: "rect",
                        label: "buynow",
                        height: 50,
                      }}
                      fundingSource="paylater"
                      createOrder={async () => {
                        const orderId = await createPayPalOrder(
                          cartItemsWithDetails,
                          total
                        );

                        if (orderId === null) {
                          throw new Error("Failed to create paypal order");
                        }

                        return orderId;
                      }}
                      onApprove={async (data, actions) => {
                        const captureData = await capturePayPalOrder(
                          data.orderID
                        );

                        if (captureData) {
                          await handleFinalOrderCreation(captureData, "PAYPAL_PAY_LATER");
                        } else {
                          alert("Failed to capture paypal order");
                        }
                      }}
                    />
                  </div>

                  {/* Credit/Debit Card Button */}
                  <div className="mb-4">
                    <h4 className="text-lg font-medium mb-2">Pay with Card</h4>
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        color: "black",
                        shape: "rect",
                        label: "pay",
                        height: 50,
                      }}
                      fundingSource="card"
                      createOrder={async () => {
                        const orderId = await createPayPalOrder(
                          cartItemsWithDetails,
                          total
                        );

                        if (orderId === null) {
                          throw new Error("Failed to create paypal order");
                        }

                        return orderId;
                      }}
                      onApprove={async (data, actions) => {
                        const captureData = await capturePayPalOrder(
                          data.orderID
                        );

                        if (captureData) {
                          await handleFinalOrderCreation(captureData, "CREDIT_CARD");
                        } else {
                          alert("Failed to capture paypal order");
                        }
                      }}
                    />
                  </div>

                  {/* Cash on Delivery Option */}
                  <div className="mb-4">
                    <h4 className="text-lg font-medium mb-2">Cash on Delivery</h4>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-amber-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-amber-800">Pay when you receive</span>
                      </div>
                      <p className="text-sm text-amber-700">
                        Pay in cash when your order is delivered to your doorstep. No advance payment required.
                      </p>
                    </div>
                    <Button 
                      onClick={handleCODOrderCreation}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={!selectedAddress || cartItemsWithDetails.length === 0}
                    >
                      Place Order - Cash on Delivery
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Enter Email to get started
                  </h3>
                  <div className="gap-2 flex items-center">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full"
                      value={checkoutEmail}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setCheckoutEmail(event.target.value)
                      }
                    />
                    <Button onClick={handlePrePaymentFlow}>
                      Proceed to Buy
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
          {/* order summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2>Order summary</h2>
              <div className="space-y-4">
                {cartItemsWithDetails.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="relative h-2- w-20 rounded-md overflow-hidden">
                      <img
                        src={item?.product?.images[0]}
                        alt={item?.product?.name}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item?.product?.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.color} / {item.size}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatPrice(item?.product?.price * item.quantity)}
                    </p>
                  </div>
                ))}
                <Separator />
                <div className="space-y-2">
                  <Input
                    placeholder="Enter a Discount code or Gift code"
                    onChange={(e) => setCouponCode(e.target.value)}
                    value={couponCode}
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    className="w-full"
                    variant="outline"
                  >
                    Apply
                  </Button>
                  {couponAppliedError && (
                    <p className="text-sm text-red-600">{couponAppliedError}</p>
                  )}
                  {appliedCoupon && (
                    <p className="text-sm text-green-600">
                      Coupon Applied Successfully!
                    </p>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subTotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-500">
                      <span>Discount ({appliedCoupon.discountPercent})%</span>
                      <span>{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                </div>
                <Separator />

                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutContent;
