import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/products" : "https://backend-inventory-system.vercel.app/api/products";

axios.defaults.withCredentials = true;

export const useProductStore = create((set) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(API_URL);
      set({ products: response.data.products || response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al obtener los productos", isLoading: false });
    }
  },

  createProduct: async (productData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API_URL, productData);
      set((state) => ({ 
        products: [...state.products, response.data.product || response.data],
        isLoading: false 
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al crear el producto", isLoading: false });
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/${id}`, productData);
      set((state) => ({
        products: state.products.map((prod) => 
          prod._id === id ? response.data.product || response.data : prod
        ),
        isLoading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al actualizar el producto", isLoading: false });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      set((state) => ({
        products: state.products.filter((prod) => prod._id !== id),
        isLoading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Error al borrar el producto.", isLoading: false });
      throw error;
    }
  },

  fetchProductByBarcode: async (barcode) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/barcode/${barcode}`);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Producto no encontrado", isLoading: false });
      throw error;
    }
  }
}));
