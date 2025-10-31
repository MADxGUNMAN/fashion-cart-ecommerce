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
        
        // Check token validity first
        if (!authStore.checkTokenValidity()) {
          set({ error: "Please login again", isLoading: false });
          return;
        }
        
        const authHeaders = authStore.getAuthHeaders();
        const response = await axios.get(`${API_ROUTES.CART}/fetch-cart`, {
          withCredentials: true,
          headers: authHeaders,
        });

        set({ items: response.data.data, isLoading: false });
      } catch (e) {
        set({ error: "Failed to fetch cart", isLoading: false });
      }
    },
    addToCart: async (item) => {
      set({ isLoading: true, error: null });
      try {
        const authHeaders = useAuthStore.getState().getAuthHeaders();
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
        const authHeaders = useAuthStore.getState().getAuthHeaders();
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
      set((state) => ({
        items: state.items.map((cartItem) =>
          cartItem.id === id ? { ...cartItem, quantity } : cartItem
        ),
      }));

      debounceUpdateCartItemQuantity(id, quantity);
    },
    clearCart: async () => {
      set({ isLoading: true, error: null });
      try {
        const authHeaders = useAuthStore.getState().getAuthHeaders();
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
