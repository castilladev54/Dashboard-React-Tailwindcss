import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/staff" : "https://backend-inventory-system.vercel.app/api/staff";

axios.defaults.withCredentials = true;

export const useStaffStore = create((set, get) => ({
  staff: [],
  isLoading: false,
  error: null,

  fetchStaff: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(API_URL);
      set({ staff: response.data.employees || [], isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error al cargar los empleados",
        isLoading: false,
      });
      throw error;
    }
  },

  createEmployee: async (employeeData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API_URL, employeeData);
      set((state) => ({
        staff: [...state.staff, response.data.employee],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error al crear empleado",
        isLoading: false,
      });
      throw error;
    }
  },

  updateEmployeePermissions: async (id, permissions) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/${id}`, { permissions });
      set((state) => ({
        staff: state.staff.map((emp) =>
          emp._id === id ? { ...emp, permissions: response.data.employee.permissions } : emp
        ),
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error al actualizar permisos",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteEmployee: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      set((state) => ({
        staff: state.staff.filter((emp) => emp._id !== id),
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error al eliminar empleado",
        isLoading: false,
      });
      throw error;
    }
  },
}));
