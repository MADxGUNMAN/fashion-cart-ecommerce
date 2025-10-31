"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/utils/currency";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Star, Check, Package, Truck, MapPin } from "lucide-react";
import jsPDF from "jspdf";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Address, useAddressStore } from "@/store/useAddressStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useReviewStore } from "@/store/useReviewStore";
import { useEffect, useState } from "react";

const initialAddressFormState = {
  name: "",
  address: "",
  city: "",
  country: "",
  postalCode: "",
  phone: "",
  isDefault: false,
};

function UserAccountPage() {

  const {
    isLoading: addressesLoading,
    addresses,
    error: addressesError,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
  } = useAddressStore();
  const [showAddresses, setShowAddresses] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialAddressFormState);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedItemForReview, setSelectedItemForReview] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ""
  });
  const { toast } = useToast();
  const { userOrders, getOrdersByUserId, isLoading } = useOrderStore();
  const { createReview } = useReviewStore();

  useEffect(() => {
    fetchAddresses();
    getOrdersByUserId();
  }, [fetchAddresses, getOrdersByUserId]);

  console.log(userOrders, "userOrders");

  const handleAddressSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      if (editingAddress) {
        const result = await updateAddress(editingAddress, formData);
        if (result) {
          fetchAddresses();
          setEditingAddress(null);
        }
      } else {
        const result = await createAddress(formData);
        if (result) {
          fetchAddresses();
          toast({
            title: "Address created successfully",
          });
        }
      }

      setShowAddresses(false);
      setFormData(initialAddressFormState);
    } catch (err) {
      console.log(err);
    }
  };

  const handleEditAddress = (address: Address) => {
    setFormData({
      name: address.name,
      address: address.address,
      city: address.city,
      country: address.country,
      phone: address.phone,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    });

    setEditingAddress(address.id);
    setShowAddresses(true);
  };

  const handleDeleteAddress = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you wanna delete this address?"
    );

    if (confirmed) {
      try {
        const success = await deleteAddress(id);
        if (success) {
          toast({
            title: "Address is deleted successfully",
          });
        }
      } catch (e) {
        console.log(e);
      }
    }
  };

  console.log(addresses);

  const getStatusColor = (
    status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED"
  ) => {
    switch (status) {
      case "PENDING":
        return "bg-blue-500";

      case "PROCESSING":
        return "bg-yellow-500";

      case "SHIPPED":
        return "bg-purple-500";

      case "DELIVERED":
        return "bg-green-500";

      default:
        return "bg-gray-500";
    }
  };

  const handleViewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const handleDownloadInvoice = (order: any) => {
    // Helper function to format currency for PDF (avoid Unicode issues)
    const formatCurrencyForPdf = (price: number): string => {
      return `Rs. ${price.toFixed(2)}`; // Price is already in INR
    };

    // Create a new PDF document
    const pdf = new jsPDF();
    
    // Set font sizes
    const titleFontSize = 20;
    const headerFontSize = 14;
    const normalFontSize = 12;
    const smallFontSize = 10;
    
    // Page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;
    
    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number, x: number, y: number, maxWidth: number) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return lines.length * fontSize * 0.35; // Return height of text block
    };
    
    // Helper function to add new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
    };
    
    // Invoice Header
    pdf.setFontSize(titleFontSize);
    pdf.setFont("helvetica", "bold");
    pdf.text("INVOICE", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;
    
    // Company Info (can be customized)
    pdf.setFontSize(normalFontSize);
    pdf.setFont("helvetica", "normal");
    pdf.text("Your E-Commerce Store", margin, yPosition);
    yPosition += 7;
    pdf.text("123 Store Street, City, State 12345", margin, yPosition);
    yPosition += 7;
    pdf.text("contact@store.com | +1 234 567 8900", margin, yPosition);
    yPosition += 15;
    
    // Horizontal line
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    // Order Details Box
    checkPageBreak(40);
    pdf.setDrawColor(200);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 40);
    
    pdf.setFontSize(headerFontSize);
    pdf.setFont("helvetica", "bold");
    pdf.text("Order Details", margin + 5, yPosition + 10);
    
    pdf.setFontSize(normalFontSize);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Order ID: ${order.id}`, margin + 5, yPosition + 20);
    pdf.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, margin + 5, yPosition + 30);
    
    pdf.text(`Status: ${order.status}`, pageWidth - margin - 60, yPosition + 20);
    pdf.text(`Payment: PayPal`, pageWidth - margin - 60, yPosition + 30);
    
    yPosition += 50;
    
    // Shipping Address
    checkPageBreak(50);
    pdf.setFontSize(headerFontSize);
    pdf.setFont("helvetica", "bold");
    pdf.text("Shipping Address", margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(normalFontSize);
    pdf.setFont("helvetica", "normal");
    if (order.address) {
      pdf.text(order.address.name || "", margin, yPosition);
      yPosition += 7;
      pdf.text(order.address.address || "", margin, yPosition);
      yPosition += 7;
      const cityState = `${order.address.city || ""}, ${order.address.country || ""}`;
      pdf.text(cityState, margin, yPosition);
      yPosition += 7;
      pdf.text(order.address.postalCode || "", margin, yPosition);
      yPosition += 7;
      pdf.text(order.address.phone || "", margin, yPosition);
    }
    yPosition += 15;
    
    // Order Items Table Header
    checkPageBreak(60);
    pdf.setFontSize(headerFontSize);
    pdf.setFont("helvetica", "bold");
    pdf.text("Order Items", margin, yPosition);
    yPosition += 10;
    
    // Table headers
    pdf.setFontSize(smallFontSize);
    pdf.setFont("helvetica", "bold");
    const tableStartY = yPosition;
    pdf.text("#", margin, yPosition);
    pdf.text("Product", margin + 15, yPosition);
    pdf.text("Details", margin + 80, yPosition);
    pdf.text("Qty", margin + 140, yPosition);
    pdf.text("Price", margin + 160, yPosition);
    pdf.text("Total", margin + 190, yPosition);
    yPosition += 8;
    
    // Table line
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
    
    // Table items
    pdf.setFontSize(smallFontSize);
    pdf.setFont("helvetica", "normal");
    
    order.items?.forEach((item: any, index: number) => {
      checkPageBreak(15);
      
      // Item number
      pdf.text(`${index + 1}`, margin, yPosition);
      
      // Product name (with word wrap)
      const nameHeight = addText(item.name || "", smallFontSize, margin + 15, yPosition, 60);
      
      // Product details
      const details = `${item.color || ""} | ${item.size || ""}`;
      pdf.text(details, margin + 80, yPosition);
      
      // Quantity
      pdf.text(item.quantity?.toString() || "1", margin + 140, yPosition);
      
      // Price
      const price = formatCurrencyForPdf(item.price || 0);
      pdf.text(price, margin + 160, yPosition);
      
      // Total
      const totalPrice = formatCurrencyForPdf((item.price || 0) * (item.quantity || 1));
      pdf.text(totalPrice, margin + 190, yPosition);
      
      yPosition += Math.max(nameHeight, 10) + 5;
    });
    
    // Bottom table line
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;
    
    // Order Summary
    checkPageBreak(40);
    pdf.setFontSize(headerFontSize);
    pdf.setFont("helvetica", "bold");
    pdf.text("Order Summary", margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(normalFontSize);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Subtotal: ${formatCurrencyForPdf(order.total)}`, margin, yPosition);
    yPosition += 8;
    pdf.text("Shipping: Free", margin, yPosition);
    yPosition += 8;
    
    // Total with emphasis
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(headerFontSize);
    pdf.text(`Total: ${formatCurrencyForPdf(order.total)}`, margin, yPosition);
    yPosition += 15;
    
    // Footer
    checkPageBreak(30);
    pdf.setFontSize(smallFontSize);
    pdf.setFont("helvetica", "italic");
    pdf.text("Thank you for your purchase!", pageWidth / 2, pageHeight - 30, { align: "center" });
    pdf.text("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, pageHeight - 20, { align: "center" });
    
    // Save the PDF
    pdf.save(`invoice-${order.id}.pdf`);
    
    toast({
      title: "Invoice Downloaded",
      description: `PDF invoice for order ${order.id} has been downloaded.`,
    });
  };

  const handleOpenReviewModal = (item: any) => {
    setSelectedItemForReview(item);
    setReviewForm({ rating: 5, comment: "" });
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedItemForReview) return;
    
    const success = await createReview(
      selectedItemForReview.productId,
      reviewForm.rating,
      reviewForm.comment
    );

    if (success) {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      setIsReviewModalOpen(false);
      setReviewForm({ rating: 5, comment: "" });
    } else {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Order status tracker component
  const OrderStatusTracker = ({ status }: { status: string }) => {
    const steps = [
      { key: "PENDING", label: "Order Placed", icon: Package },
      { key: "PROCESSING", label: "Processing", icon: Package },
      { key: "SHIPPED", label: "Shipped", icon: Truck },
      { key: "DELIVERED", label: "Delivered", icon: MapPin },
    ];

    const getStepIndex = (currentStatus: string) => {
      return steps.findIndex(step => step.key === currentStatus);
    };

    const currentStepIndex = getStepIndex(status);

    return (
      <div className="w-full py-6">
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200 z-0">
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : isCurrent
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted && index < currentStepIndex ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-blue-600 mt-1">Current Status</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">MY ACCOUNT</h1>
        </div>
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Order History</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
          </TabsList>
          <TabsContent value="orders">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold">Order History</h2>
                {userOrders.length === 0 && (
                  <h1 className="text-2xl font-bold">
                    You havn't placed an Order yet.
                  </h1>
                )}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.id}
                          </TableCell>
                          <TableCell>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {order.items.length}{" "}
                            {order.items.length > 1 ? "Items" : "Item"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getStatusColor(order.status)}`}
                            >
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatPrice(order.total)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOrderDetails(order)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="addresses">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Addresses</h2>
                  <Button
                    onClick={() => {
                      setEditingAddress(null);
                      setFormData(initialAddressFormState);
                      setShowAddresses(true);
                    }}
                  >
                    Add a New Address
                  </Button>
                </div>
                {addressesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
                  </div>
                ) : showAddresses ? (
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: e.target.value,
                          })
                        }
                        placeholder="Enter your address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            city: e.target.value,
                          })
                        }
                        placeholder="Enter your city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            country: e.target.value,
                          })
                        }
                        placeholder="Enter your country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            postalCode: e.target.value,
                          })
                        }
                        placeholder="Enter your Postal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Enter your phone"
                      />
                      <div>
                        <Checkbox
                          id="default"
                          checked={formData.isDefault}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              isDefault: checked as boolean,
                            })
                          }
                        />
                        <Label className="ml-3" htmlFor="default">
                          Set as default address
                        </Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button type="submit">
                          {editingAddress ? "Update" : "Add"} Address
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAddresses(false);
                            setEditingAddress(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <Card key={address.id}>
                        <CardContent className="p-5">
                          <div className="flex flex-col mb-5 justify-between items-start">
                            <p className="font-medium">{address.name}</p>
                            <p className="mb-2 font-bold">{address.address}</p>
                            <p className="mb-2">
                              {address.city}, {address.country},{" "}
                              {address.postalCode}
                            </p>
                            {address.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                          <div className="space-x-2">
                            <Button
                              onClick={() => handleEditAddress(address)}
                              variant={"outline"}
                              size={"sm"}
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteAddress(address.id)}
                              variant={"destructive"}
                              size={"sm"}
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Order Details Modal */}
        <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
                {selectedOrder?.status === "DELIVERED" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadInvoice(selectedOrder)}
                      className="flex items-center gap-2"
                    >
                      Download Invoice
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={`${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() +
                        selectedOrder.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">{formatPrice(selectedOrder.total)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">
                      {selectedOrder.paymentMethod === "CASH_ON_DELIVERY" 
                        ? "Cash on Delivery" 
                        : selectedOrder.paymentMethod === "PAYPAL_WALLET"
                        ? "PayPal Wallet"
                        : selectedOrder.paymentMethod === "PAYPAL_PAY_LATER"
                        ? "PayPal Pay Later"
                        : selectedOrder.paymentMethod === "CREDIT_CARD"
                        ? "Credit Card"
                        : selectedOrder.paymentMethod || "PayPal"}
                    </p>
                    {selectedOrder.paymentMethod === "CASH_ON_DELIVERY" && (
                      <Badge variant={selectedOrder.paymentStatus === "PENDING" ? "secondary" : "default"} className="mt-1">
                        {selectedOrder.paymentStatus === "PENDING" ? "Payment Pending" : "Payment Completed"}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Order Status Tracker */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Order Progress</h3>
                  <OrderStatusTracker status={selectedOrder.status} />
                </div>

                <Separator />

                {/* Shipping Address */}
                <div>
                  <h3 className="font-semibold mb-3">Shipping Address</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedOrder.address?.name}</p>
                    <p className="text-sm">{selectedOrder.address?.address}</p>
                    <p className="text-sm">
                      {selectedOrder.address?.city}, {selectedOrder.address?.country}
                    </p>
                    <p className="text-sm">{selectedOrder.address?.postalCode}</p>
                    <p className="text-sm">{selectedOrder.address?.phone}</p>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.items?.map((item: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              Color: {item.color} | Size: {item.size}
                            </p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatPrice(item.price)} each
                            </p>
                          </div>
                        </div>
                        {selectedOrder.status === "DELIVERED" && (
                          <div className="mt-3 pt-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenReviewModal(item)}
                              className="flex items-center gap-2"
                            >
                              <Star className="h-4 w-4" />
                              Write a Review
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Review Modal */}
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
            </DialogHeader>
            
            {selectedItemForReview && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedItemForReview.image}
                      alt={selectedItemForReview.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{selectedItemForReview.name}</p>
                    <p className="text-sm text-gray-500">
                      Color: {selectedItemForReview.color} | Size: {selectedItemForReview.size}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Rating</Label>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="p-1"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= reviewForm.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    placeholder="Share your experience with this product..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    className="flex-1"
                    disabled={!reviewForm.comment.trim()}
                  >
                    Submit Review
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default UserAccountPage;
