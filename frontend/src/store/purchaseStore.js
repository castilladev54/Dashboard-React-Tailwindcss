import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/purchases" : "/api/purchases";

axios.defaults.withCredentials = true;

export const usePurchaseStore = create((set) => ({
  purchases: [],
  isLoading: false,
  error: null,

  fetchPurchases: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(API_URL);
      set({ purchases: response.data.purchases || response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al obtener el historial de compras", isLoading: false });
    }
  },

  createPurchase: async (purchaseData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API_URL, purchaseData);
      set((state) => ({ 
        purchases: [response.data.purchase || response.data, ...state.purchases],
        isLoading: false 
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al registrar la compra", isLoading: false });
      throw error;
    }
  },

  fetchPurchaseById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      set({ isLoading: false });
      return response.data.purchase || response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al obtener el detalle de la compra", isLoading: false });
      throw error;
    }
  }
}));
