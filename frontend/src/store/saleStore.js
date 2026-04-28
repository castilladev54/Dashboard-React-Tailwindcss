import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/sales" : "https://backend-inventory-system.vercel.app/api/sales";

axios.defaults.withCredentials = true;

export const useSaleStore = create((set) => ({
  sales: [],
  pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
  isLoading: false,
  error: null,

  fetchSales: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}?page=${page}&limit=${limit}`);
      const payload = response.data;
      set({ 
        sales: payload.data || payload.sales || (Array.isArray(payload) ? payload : []),
        pagination: payload.pagination || { total: 0, page, limit, totalPages: 1 },
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al obtener el historial de ventas", isLoading: false });
    }
  },

  createSale: async (saleData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API_URL, saleData);
      set((state) => ({ 
        sales: [response.data.sale || response.data, ...state.sales],
        isLoading: false 
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al registrar la venta", isLoading: false });
      throw error;
    }
  },

  fetchSaleById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      set({ isLoading: false });
      return response.data.sale || response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al obtener el detalle de la venta", isLoading: false });
      throw error;
    }
  }
}));
