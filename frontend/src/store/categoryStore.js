import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/categories" : "https://backend-inventory-system.vercel.app/api/categories";

axios.defaults.withCredentials = true;

export const useCategoryStore = create((set) => ({
  categories: [],
  pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
  isLoading: false,
  error: null,

  fetchCategories: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}?page=${page}&limit=${limit}`);
      const payload = response.data;
      set({ 
        categories: payload.data || payload.categories || (Array.isArray(payload) ? payload : []),
        pagination: payload.pagination || { total: 0, page, limit, totalPages: 1 },
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al obtener las categorías", isLoading: false });
    }
  },

  createCategory: async (categoryData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API_URL, categoryData);
      set((state) => ({
        categories: [...state.categories, response.data.category || response.data],
        isLoading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al crear la categoría", isLoading: false });
      throw error;
    }
  },

  updateCategory: async (id, categoryData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/${id}`, categoryData);
      set((state) => ({
        categories: state.categories.map((cat) =>
          cat._id === id ? response.data.category || response.data : cat
        ),
        isLoading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al actualizar la categoría", isLoading: false });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      set((state) => ({
        categories: state.categories.filter((cat) => cat._id !== id),
        isLoading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "No se puede borrar la categoría porque tiene productos asignados.", isLoading: false });
      throw error;
    }
  }
}));
