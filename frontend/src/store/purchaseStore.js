import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/purchases" : "https://backend-inventory-system.vercel.app/api/purchases";

axios.defaults.withCredentials = true;

export const usePurchaseStore = create((set) => ({
  purchases: [],
  pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
  payments: [],
  isLoading: false,
  error: null,

  fetchPurchases: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}?page=${page}&limit=${limit}`);
      const payload = response.data;
      set({ 
        purchases: payload.data || payload.purchases || (Array.isArray(payload) ? payload : []),
        pagination: payload.pagination || { total: 0, page, limit, totalPages: 1 },
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al obtener el historial de compras", isLoading: false });
    }
  },

  fetchPayments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/payments`);
      set({ payments: response.data.payments || response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al obtener el historial de pagos", isLoading: false });
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
  },

  payPurchase: async (id, paymentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/${id}/pay`, paymentData);
      
      // Update the local purchase if found
      set((state) => ({
        purchases: state.purchases.map(p => 
          p._id === id ? { ...p, ...((response.data.purchase || response.data) || {}) } : p
        ),
        isLoading: false
      }));
      return response.data.purchase || response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al registrar el abono", isLoading: false });
      throw error;
    }
  }
}));
