"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/utils/currency";
import { useCartStore } from "@/store/useCartStore";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";

interface QuickViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export default function QuickViewModal({ open, onOpenChange, product }: QuickViewModalProps) {
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCartStore();

  // Reset selections when product changes
  useState(() => {
    if (product?.colors?.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    if (product?.sizes?.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
    setQuantity(1);
  });

  if (!product) return null;

  // Ensure product has required arrays
  const colors = product.colors || [];
  const sizes = product.sizes || [];
  const images = product.images || [];

  const handleAddToCart = async () => {
    if (product.stock === 0) {
      return; // Button should be disabled, but extra safety check
    }
    
    if (quantity > product.stock) {
      console.error("Insufficient stock");
      return;
    }

    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: images[0] || '',
        color: selectedColor,
        size: selectedSize,
        quantity,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={images[0] || '/placeholder-image.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(1).map((image: string, index: number) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded overflow-hidden">
                    <img
                      src={image}
                      alt={`${product.name} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <p className="text-2xl font-bold">
                {formatPrice(parseFloat(product.price))}
              </p>
              <p className="text-gray-600 mt-2">{product.description}</p>
            </div>

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Color: {selectedColor}</h3>
                <div className="flex gap-2">
                  {colors.map((color: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 ${
                        selectedColor === color ? "border-black" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color.toLowerCase() }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Size: {selectedSize}</h3>
                <div className="flex gap-2">
                  {sizes.map((size: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-medium mb-2">Quantity</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className={product.stock === 0 
                ? "w-full bg-gray-400 text-white cursor-not-allowed" 
                : "w-full bg-black text-white hover:bg-gray-800"}
              disabled={
                product.stock === 0 || 
                (colors.length > 0 && !selectedColor) || 
                (sizes.length > 0 && !selectedSize)
              }
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
            {product.stock <= 10 && product.stock > 0 && (
              <p className="text-red-500 text-xs mt-2 text-center">
                Only {product.stock} items left in stock!
              </p>
            )}

            {/* Product Info */}
            <div className="space-y-2 text-sm text-gray-600">
              <p>Category: {product.category}</p>
              <p>Brand: {product.brand}</p>
              <p>Gender: {product.gender}</p>
              <p>Stock: {product.stock} items available</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
