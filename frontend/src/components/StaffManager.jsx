import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, Plus, X, Check, Trash2, Key, Loader } from "lucide-react";
import { useStaffStore } from "../store/staffStore";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const AVAILABLE_PERMISSIONS = [
  { id: "pos_access", label: "Punto de Venta", desc: "Permite registrar ventas" },
  { id: "inventory_access", label: "Inventario", desc: "Crear y editar productos" },
  { id: "purchases_access", label: "Compras", desc: "Registrar gastos y abonos" },
  { id: "finances_access", label: "Finanzas & IA", desc: "Ver rentabilidad y asistente" },
  { id: "staff_management", label: "Gestionar Empleados", desc: "Crear o eliminar cajeros" }
];

const StaffManager = () => {
  const { staff, isLoading, fetchStaff, createEmployee, updateEmployeePermissions, deleteEmployee } = useStaffStore();
  const { user } = useAuthStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", permissions: [] });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleTogglePermission = (permId, currentPerms, setPermsFunc) => {
    if (currentPerms.includes(permId)) {
      setPermsFunc(currentPerms.filter(p => p !== permId));
    } else {
      setPermsFunc([...currentPerms, permId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEmployee(formData);
      toast.success("Empleado creado exitosamente");
      setIsModalOpen(false);
      setFormData({ name: "", email: "", password: "", permissions: [] });
    } catch (error) {
      toast.error(error.message || "Error al crear empleado");
    }
  };

  const handleUpdatePermissions = async (id, newPermissions) => {
    try {
      await updateEmployeePermissions(id, newPermissions);
      toast.success("Permisos actualizados");
      setEditingId(null);
    } catch (error) {
      toast.error("Error al actualizar permisos");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este empleado? No podrá acceder al sistema.")) {
      try {
        await deleteEmployee(id);
        toast.success("Empleado eliminado");
      } catch (error) {
        toast.error("Error al eliminar");
      }
    }
  };

  if (user?.role === "employee" && !user.permissions?.includes("staff_management")) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <Shield size={64} className="mb-4 text-red-500/50" />
        <h2 className="text-2xl font-bold">Acceso Denegado</h2>
        <p>No tienes permiso para gestionar el personal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl shadow-xl flex justify-between items-center"
      >
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="text-purple-400" />
            Gestión de Personal
          </h2>
          <p className="text-gray-400 mt-1 text-sm">Controla quién puede acceder a tu sistema y qué puede ver.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Empleado
        </button>
      </motion.div>

      {/* Lista de Empleados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && staff.length === 0 ? (
          <div className="col-span-full flex justify-center py-12"><Loader className="animate-spin text-purple-500" size={40} /></div>
        ) : staff.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-800/30 rounded-2xl border border-gray-800 border-dashed">
            No tienes empleados registrados.
          </div>
        ) : (
          staff.map((emp) => (
            <motion.div
              key={emp._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800/80 backdrop-blur-md border border-gray-700/50 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all shadow-lg"
            >
              <div className="p-5 border-b border-gray-700/50 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white">{emp.name}</h3>
                  <p className="text-sm text-gray-400">{emp.email}</p>
                </div>
                <button onClick={() => handleDelete(emp._id)} className="text-gray-500 hover:text-red-400 transition-colors p-1 bg-gray-800 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="p-5 bg-gray-900/30">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Key size={12} /> Permisos
                  </h4>
                  <button 
                    onClick={() => setEditingId(editingId === emp._id ? null : emp._id)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
                  >
                    {editingId === emp._id ? 'Cancelar Edición' : 'Editar'}
                  </button>
                </div>

                <div className="space-y-2">
                  {AVAILABLE_PERMISSIONS.map(perm => {
                    const hasPerm = emp.permissions.includes(perm.id);
                    const isEditing = editingId === emp._id;
                    
                    if (!hasPerm && !isEditing) return null; // Ocultar si no lo tiene y no estamos editando

                    return (
                      <div 
                        key={perm.id} 
                        onClick={() => {
                          if (!isEditing) return;
                          const newPerms = hasPerm 
                            ? emp.permissions.filter(p => p !== perm.id)
                            : [...emp.permissions, perm.id];
                          handleUpdatePermissions(emp._id, newPerms);
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${
                          isEditing ? 'cursor-pointer hover:bg-gray-800' : ''
                        } ${hasPerm ? 'bg-purple-500/10 text-purple-200' : 'bg-gray-800/50 text-gray-500'}`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          hasPerm ? 'bg-purple-500' : 'bg-gray-700'
                        }`}>
                          {hasPerm && <Check size={10} className="text-white" />}
                        </div>
                        {perm.label}
                      </div>
                    );
                  })}
                  {!editingId && emp.permissions.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Ningún permiso asignado.</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Crear Empleado */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="text-purple-400" />
                  Nuevo Empleado
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nombre Completo</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="cajero@tutienda.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña de acceso</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3 border-t border-gray-800 pt-4 mt-4">
                    Permisos Iniciales
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <div 
                        key={perm.id}
                        onClick={() => handleTogglePermission(perm.id, formData.permissions, (p) => setFormData({...formData, permissions: p}))}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                          formData.permissions.includes(perm.id) 
                            ? 'bg-purple-500/20 border-purple-500/50' 
                            : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                          formData.permissions.includes(perm.id)
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-500 bg-transparent'
                        }`}>
                          {formData.permissions.includes(perm.id) && <Check size={14} className="text-white" />}
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${formData.permissions.includes(perm.id) ? 'text-purple-200' : 'text-gray-300'}`}>
                            {perm.label}
                          </p>
                          <p className="text-xs text-gray-500">{perm.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? <Loader className="animate-spin" size={20} /> : <Check size={20} />}
                  Guardar Empleado
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffManager;
