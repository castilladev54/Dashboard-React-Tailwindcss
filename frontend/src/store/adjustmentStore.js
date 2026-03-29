import { create } from "zustand";
import axios from "axios";
import { useProductStore } from "./productStore";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/adjustments" : "https://backend-inventory-system.vercel.app/api/adjustments";

axios.defaults.withCredentials = true;

export const useAdjustmentStore = create((set) => ({
  adjustments: [],
  isLoading: false,
  error: null,

  fetchAdjustments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(API_URL);
      set({ adjustments: response.data.adjustments || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || "Error al obtener el historial de ajustes", 
        isLoading: false 
      });
    }
  },

  createAdjustment: async (adjustmentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API_URL, adjustmentData);
      const newAdjustment = response.data.adjustment;

      // Actualizar el historial de ajustes
      set((state) => ({
        adjustments: [newAdjustment, ...state.adjustments],
        isLoading: false
      }));

      // Sincronizar stock en el ProductStore directamente sin recargar
      useProductStore.setState((state) => ({
        products: state.products.map(p => {
          const adjProductId = newAdjustment.product_id._id || newAdjustment.product_id;
          return p._id === adjProductId
            ? { ...p, stock: newAdjustment.new_stock }
            : p;
        })
      }));

      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || "Error al crear el ajuste. Verifique que el stock nuevo sea diferente al actual.", 
        isLoading: false 
      });
      throw error;
    }
  }
}));
