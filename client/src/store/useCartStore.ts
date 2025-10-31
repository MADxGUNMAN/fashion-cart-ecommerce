import { API_ROUTES } from "@/utils/api";
import axios from "axios";
import debounce from "lodash/debounce";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (item: Omit<CartItem, "id">) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateCartItemQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartStore>((set, get) => {
  const debounceUpdateCartItemQuantity = debounce(
    async (id: string, quantity: number) => {
      try {
        const authHeaders = useAuthStore.getState().getAuthHeaders();
        await axios.put(
          `${API_ROUTES.CART}/update/${id}`,
          { quantity },
          {
            withCredentials: true,
            headers: authHeaders,
          }
        );
      } catch (e) {
        set({ error: "Failed to update cart quantity" });
      }
    }
  );

  return {
    items: [],
    isLoading: false,
    error: null,
    fetchCart: async () => {
      set({ isLoading: true, error: null });
      try {
        const authStore = useAuthStore.getState();
        
        // If user is not authenticated, load from localStorage
        if (!authStore.user || !authStore.checkTokenValidity()) {
          const guestCart = localStorage.getItem('guest-cart');
          const guestItems = guestCart ? JSON.parse(guestCart) : [];
          set({ items: guestItems, isLoading: false });
          return;
        }
        
        const authHeaders = authStore.getAuthHeaders();
        const response = await axios.get(`${API_ROUTES.CART}/fetch-cart`, {
          withCredentials: true,
          headers: authHeaders,
        });

        set({ items: response.data.data, isLoading: false });
      } catch (e) {
        // Fallback to guest cart if API fails
        const guestCart = localStorage.getItem('guest-cart');
        const guestItems = guestCart ? JSON.parse(guestCart) : [];
        set({ items: guestItems, isLoading: false, error: null });
      }
    },
    addToCart: async (item) => {
      set({ isLoading: true, error: null });
      try {
        const authStore = useAuthStore.getState();
        
        // If user is not authenticated, save to localStorage
        if (!authStore.user || !authStore.checkTokenValidity()) {
          const guestCart = localStorage.getItem('guest-cart');
          const guestItems = guestCart ? JSON.parse(guestCart) : [];
          
          // Generate a temporary ID for guest cart items
          const newItem = {
            ...item,
            id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          
          // Check if item already exists (same product, color, size)
          const existingItemIndex = guestItems.findIndex((cartItem: any) => 
            cartItem.productId === item.productId && 
            cartItem.color === item.color && 
            cartItem.size === item.size
          );
          
          if (existingItemIndex > -1) {
            // Update quantity if item exists
            guestItems[existingItemIndex].quantity += item.quantity;
          } else {
            // Add new item
            guestItems.push(newItem);
          }
          
          localStorage.setItem('guest-cart', JSON.stringify(guestItems));
          set({ items: guestItems, isLoading: false });
          return;
        }
        
        const authHeaders = authStore.getAuthHeaders();
        const response = await axios.post(
          `${API_ROUTES.CART}/add-to-cart`,
          item,
          {
            withCredentials: true,
            headers: authHeaders,
          }
        );

        set((state) => ({
          items: [...state.items, response.data.data],
          isLoading: false,
        }));
      } catch (e) {
        set({ error: "Failed to add to cart", isLoading: false });
      }
    },
    removeFromCart: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const authStore = useAuthStore.getState();
        
        // If user is not authenticated, remove from localStorage
        if (!authStore.user || !authStore.checkTokenValidity()) {
          const guestCart = localStorage.getItem('guest-cart');
          const guestItems = guestCart ? JSON.parse(guestCart) : [];
          const updatedItems = guestItems.filter((item: any) => item.id !== id);
          localStorage.setItem('guest-cart', JSON.stringify(updatedItems));
          set({ items: updatedItems, isLoading: false });
          return;
        }
        
        const authHeaders = authStore.getAuthHeaders();
        await axios.delete(`${API_ROUTES.CART}/remove/${id}`, {
          withCredentials: true,
          headers: authHeaders,
        });

        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          isLoading: false,
        }));
      } catch (e) {
        set({ error: "Failed to delete from cart", isLoading: false });
      }
    },
    updateCartItemQuantity: async (id, quantity) => {
      const authStore = useAuthStore.getState();
      
      // Update local state immediately for better UX
      set((state) => ({
        items: state.items.map((cartItem) =>
          cartItem.id === id ? { ...cartItem, quantity } : cartItem
        ),
      }));

      // If user is not authenticated, update localStorage
      if (!authStore.user || !authStore.checkTokenValidity()) {
        const guestCart = localStorage.getItem('guest-cart');
        const guestItems = guestCart ? JSON.parse(guestCart) : [];
        const updatedItems = guestItems.map((item: any) =>
          item.id === id ? { ...item, quantity } : item
        );
        localStorage.setItem('guest-cart', JSON.stringify(updatedItems));
        return;
      }

      // For authenticated users, debounce API call
      debounceUpdateCartItemQuantity(id, quantity);
    },
    clearCart: async () => {
      set({ isLoading: true, error: null });
      try {
        const authStore = useAuthStore.getState();
        
        // If user is not authenticated, clear localStorage
        if (!authStore.user || !authStore.checkTokenValidity()) {
          localStorage.removeItem('guest-cart');
          set({ items: [], isLoading: false });
          return;
        }
        
        const authHeaders = authStore.getAuthHeaders();
        await axios.post(
          `${API_ROUTES.CART}/clear-cart`,
          {},
          {
            withCredentials: true,
            headers: authHeaders,
          }
        );

        set({ items: [], isLoading: false });
      } catch (e) {
        set({ error: "Failed to cart clear ", isLoading: false });
      }
    },
  };
});
