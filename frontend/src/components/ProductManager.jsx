import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, X, Check, PackageOpen } from "lucide-react";
import { useProductStore } from "../store/productStore";
import { useCategoryStore } from "../store/categoryStore";
import toast from "react-hot-toast";

const ProductManager = () => {
  const { products, isLoading, error, fetchProducts, createProduct, updateProduct, deleteProduct } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "", 
    price: "", 
    stock: "", 
    category: "" 
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setFormData({ 
      name: product.name, 
      description: product.description || "", 
      price: product.price, 
      stock: product.stock, 
      category: product.category?._id || product.category || "" 
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      try {
        await deleteProduct(id);
        toast.success("Producto eliminado exitosamente");
      } catch (err) {
        toast.error(error || "Error al eliminar el producto.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProduct(editingId, formData);
        toast.success("Producto actualizado");
      } else {
        await createProduct(formData);
        toast.success("Producto creado");
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormData({ name: "", description: "", price: "", stock: "", category: "" });
    } catch (err) {
      toast.error(error || "Ocurrió un error. Intenta de nuevo.");
    }
  };

  const cancelEdit = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: "", description: "", price: "", stock: "", category: "" });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-wide">
          Gestión de <span className="text-orange-500">Productos</span>
        </h2>
        
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl hover:from-orange-600 hover:to-amber-600 transition shadow-lg shadow-orange-500/20 font-medium"
          >
            <Plus size={20} />
            Nuevo Producto
          </button>
        )}
      </div>

      {isFormOpen && (
        <motion.div
           initial={{ opacity: 0, height: 0, scale: 0.95 }}
           animate={{ opacity: 1, height: "auto", scale: 1 }}
           className="mb-8 p-6 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="text-xl font-bold text-white">
              {editingId ? "Editar Producto" : "Agregar Nuevo Producto"}
            </h3>
            <button onClick={cancelEdit} className="text-gray-400 hover:text-white transition">
               <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del producto</label>
                 <input 
                   type="text" 
                   name="name" 
                   value={formData.name} 
                   onChange={handleInputChange} 
                   required
                   placeholder="Ej. iPhone 15 Pro"
                   className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                 <select 
                   name="category" 
                   value={formData.category} 
                   onChange={handleInputChange} 
                   required
                   className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                 >
                   <option value="" disabled>Selecciona una categoría</option>
                   {categories.map(cat => (
                     <option key={cat._id} value={cat._id}>{cat.name}</option>
                   ))}
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Precio ($)</label>
                 <input 
                   type="number" 
                   name="price" 
                   value={formData.price} 
                   onChange={handleInputChange} 
                   required
                   min="0"
                   step="0.01"
                   placeholder="Ej. 999.99"
                   className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Stock</label>
                 <input 
                   type="number" 
                   name="stock" 
                   value={formData.stock} 
                   onChange={handleInputChange} 
                   required
                   min="0"
                   placeholder="Ej. 50"
                   className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                 />
               </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                placeholder="Detalles sobre el producto..."
                rows="3"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={cancelEdit}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition font-medium"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition shadow-lg shadow-orange-500/20 font-medium disabled:opacity-50"
              >
                {isLoading ? "Guardando..." : <><Check size={18} /> {editingId ? "Actualizar" : "Guardar"}</>}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ERROR HANDLER */}
      {error && !isFormOpen && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
           {error}
        </div>
      )}

      {/* DATA TABLE / LIST */}
      <div className="bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {isLoading && !isFormOpen ? (
           <div className="p-8 text-center text-gray-400">
             Cargando productos...
           </div>
        ) : products.length === 0 ? (
           <div className="p-12 text-center">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-gray-400 mb-4">
               <PackageOpen size={30} />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">No hay productos</h3>
             <p className="text-gray-400 mb-6">Aún no has agregado ningún producto al inventario.</p>
             <button
               onClick={() => setIsFormOpen(true)}
               className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-2 rounded-xl hover:bg-orange-500/20 transition font-medium"
             >
               <Plus size={18} />
               Agregar mi primer producto
             </button>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/20 text-gray-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Producto</th>
                  <th className="px-6 py-4 font-medium">Categoría</th>
                  <th className="px-6 py-4 font-medium">Precio</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((prod, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={prod._id} 
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{prod.name}</div>
                      <div className="text-xs text-gray-500 mt-1">ID: {prod._id.slice(-6)}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                       <span className="bg-white/5 px-2 py-1 rounded-md text-xs border border-white/10">
                          {prod.category?.name || "Sin Categoría"}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-amber-500 font-medium">
                       ${Number(prod.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded-md text-xs font-medium ${prod.stock > 10 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : prod.stock > 0 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                          {prod.stock} {prod.stock === 1 ? 'unidad' : 'unidades'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(prod)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(prod._id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;
