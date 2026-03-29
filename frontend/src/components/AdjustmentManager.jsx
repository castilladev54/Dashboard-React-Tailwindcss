import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, X, Check, ClipboardList, PackageOpen, Search, ArrowLeft, TriangleAlert, Info } from "lucide-react";
import { useAdjustmentStore } from "../store/adjustmentStore";
import { useProductStore } from "../store/productStore";
import Button from "./Button";
import Pagination from "./Pagination";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 10;

const REASON_MAPPING = {
  initial_count: "Inventario Inicial",
  damaged: "Dañado / Merma",
  stolen: "Extravío / Robo",
  expired: "Vencido",
  correction: "Corrección",
  other: "Otro motivo",
};

const MOTIVOS = [
  { value: "initial_count", label: "Inventario Inicial" },
  { value: "damaged", label: "Dañado / Merma" },
  { value: "stolen", label: "Extravío / Robo" },
  { value: "expired", label: "Vencido" },
  { value: "correction", label: "Corrección" },
  { value: "other", label: "Otro motivo" },
];

const AdjustmentManager = () => {
  const { adjustments, isLoading, error, fetchAdjustments, createAdjustment } = useAdjustmentStore();
  const { products, fetchProducts } = useProductStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState("initial_count");
  const [notes, setNotes] = useState("");

  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchAdjustments();
    fetchProducts();
  }, [fetchAdjustments, fetchProducts]);

  const totalPages = Math.ceil(adjustments.length / ITEMS_PER_PAGE);
  const currentAdjustments = adjustments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  ).slice(0, 10); // Mostrar máximo 10 sugerencias

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSearchTerm("");
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setNewStock("");
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProduct) return toast.error("Selecciona un producto primero");
    if (newStock === "") return toast.error("Ingresa la cantidad física actual");
    
    const stockNum = parseFloat(newStock);
    if (isNaN(stockNum) || stockNum < 0) return toast.error("La cantidad no puede ser negativa");
    
    if (stockNum === selectedProduct.stock) {
      return toast.error(`El producto ya tiene exactamente ${stockNum} unidades. Sin cambios enviados.`);
    }

    const payload = {
      product_id: selectedProduct._id,
      new_stock: stockNum,
      reason,
      notes
    };

    try {
      await createAdjustment(payload);
      toast.success("Ajuste de inventario guardado con éxito");
      setIsFormOpen(false);
      
      // Limpiar form
      setSelectedProduct(null);
      setNewStock("");
      setReason("initial_count");
      setNotes("");
    } catch (err) {
      toast.error(error || "Ocurrió un error al registrar el ajuste.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
          Ajustes de <span className="text-orange-500">Inventario</span> (Kárdex)
        </h2>

        {!isFormOpen && (
          <Button variant="primary" onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto text-sm sm:text-base">
            <Plus size={20} />
            Nuevo Ajuste
          </Button>
        )}
      </div>

      {/* ERROR HANDLER GENERAL */}
      {error && !isFormOpen && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
          {error}
        </div>
      )}

      {/* FORMULARIO DE ADJUSTMENT */}
      {isFormOpen && (
        <motion.div
           initial={{ opacity: 0, height: 0, scale: 0.95 }}
           animate={{ opacity: 1, height: "auto", scale: 1 }}
           className="mb-8 p-6 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-xl relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="text-orange-500" />
              Realizar Ajuste de Inventario
            </h3>
            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
              <X size={24} />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Paso 1 y 2: Selección y Muestra de Stock */}
            {!selectedProduct ? (
              <div className="bg-black/20 p-4 border border-white/5 rounded-xl">
                 <label className="block text-sm font-medium text-gray-300 mb-2">1. Seleccionar Producto</label>
                 <div className="relative mb-2">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                     <input
                       ref={searchInputRef}
                       type="text"
                       placeholder="Escribe el nombre del producto o código..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
                     />
                   </div>
                 </div>

                 {searchTerm && (
                   <div className="border border-white/5 bg-[#1a1a24] rounded-xl overflow-hidden mt-2 max-h-60 overflow-y-auto w-full">
                     {filteredProducts.length === 0 ? (
                       <div className="p-4 text-sm text-gray-500 text-center">No se encontraron productos coincidentes.</div>
                     ) : (
                       filteredProducts.map(prod => (
                         <div 
                           key={prod._id}
                           onClick={() => handleSelectProduct(prod)}
                           className="flex justify-between items-center p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition text-sm sm:text-base text-gray-300"
                         >
                           <div>
                              <span className="font-medium text-white block">{prod.name}</span>
                              <span className="text-xs text-gray-500">Stock Actual: {prod.stock} {prod.unit_type === 'unidad' ? 'ud' : prod.unit_type}</span>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 )}
              </div>
            ) : (
              <div className="bg-blue-500/5 p-4 border border-blue-500/20 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                   <p className="text-sm font-medium text-gray-400 mb-1">Producto Seleccionado</p>
                   <h4 className="text-xl font-bold text-white">{selectedProduct.name}</h4>
                   <div className="flex items-center gap-2 mt-2">
                      <div className="bg-black/40 text-blue-400 border border-blue-500/20 px-3 py-1 rounded text-sm font-semibold flex items-center gap-2">
                        <Info size={16} />
                        El sistema dice que tienes: 
                        <span className="text-lg">{selectedProduct.stock}</span>
                        {selectedProduct.unit_type === 'unidad' ? '' : selectedProduct.unit_type}
                      </div>
                   </div>
                 </div>
                 <Button variant="secondary" onClick={handleClearSelection} size="sm" type="button" className="shrink-0 w-full sm:w-auto">
                   Cambiar Producto
                 </Button>
              </div>
            )}

            {/* Pasos 3, 4 y 5 */}
            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border border-white/5 bg-black/20">
                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1">2. Cantidad Física Real</label>
                   <div className="relative">
                     <input
                       type="number"
                       min="0"
                       step="0.01"
                       required
                       value={newStock}
                       onChange={(e) => setNewStock(e.target.value)}
                       placeholder="¿Cuánto hay en tus manos?"
                       className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition text-lg"
                     />
                     <div className="absolute top-full text-xs text-gray-500 mt-1">Escribe la cantidad total existente, no la diferencia.</div>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1">3. Motivo del Ajuste</label>
                   <select
                     value={reason}
                     onChange={(e) => setReason(e.target.value)}
                     className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                   >
                     {MOTIVOS.map(m => (
                       <option key={m.value} value={m.value}>{m.label}</option>
                     ))}
                   </select>
                </div>

                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-300 mb-1">Notas Opcionales</label>
                   <textarea
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Ej: Encontré cajas selladas al fondo, Producto caducado, Error del conteo anterior..."
                     rows="2"
                     className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                   />
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button variant="primary" type="submit" isLoading={isLoading} disabled={!selectedProduct} className="w-full sm:w-auto">
                <Check size={18} /> Confirmar Ajuste
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* LISTA E HISTORIAL - KÁRDEX TABLA */}
      {!isFormOpen && (
        <div className="bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {isLoading && currentAdjustments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Cargando el récord de ajustes...
            </div>
          ) : adjustments.length === 0 ? (
             <div className="p-12 text-center">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-gray-400 mb-4">
                 <ClipboardList size={30} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Kárdex en blanco</h3>
               <p className="text-gray-400 mb-6">El historial de auditorías y mermas aparecerá aquí.</p>
               <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                  <Plus size={18} />
                  Realizar primer ajuste
               </Button>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/20 text-gray-400 text-xs sm:text-sm uppercase tracking-wider">
                    <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium">Fecha</th>
                    <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium">Producto</th>
                    <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium">Motivo (Acción)</th>
                    <th className="hidden md:table-cell px-6 py-4 font-medium text-center">Antes</th>
                    <th className="hidden md:table-cell px-6 py-4 font-medium text-center">Nuevo</th>
                    <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm sm:text-base">
                  {currentAdjustments.map((adj, index) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={adj._id}
                      className="hover:bg-white/5 transition-colors group text-gray-300"
                    >
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm">
                        {new Date(adj.createdAt).toLocaleDateString()}
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                          {new Date(adj.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        <div className="font-medium text-white max-w-[120px] sm:max-w-xs truncate" title={adj.product_id?.name || 'Desconocido'}>
                          {adj.product_id?.name || 'Producto Desconocido'}
                        </div>
                        {adj.notes && (
                          <div className="text-xs text-orange-400/80 truncate max-w-[120px] sm:max-w-xs pt-1 italic" title={adj.notes}>
                            "{adj.notes}"
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                         <span className="bg-black/30 border border-white/5 px-2 py-1 rounded-md text-xs sm:text-sm whitespace-nowrap">
                           {REASON_MAPPING[adj.reason] || adj.reason}
                         </span>
                      </td>

                      <td className="hidden md:table-cell px-6 py-4 text-center text-gray-400 font-medium">
                        {adj.previous_stock}
                      </td>

                      <td className="hidden md:table-cell px-6 py-4 text-center font-bold text-white">
                        {adj.new_stock}
                      </td>

                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-right">
                         <span className={`inline-flex items-center justify-center font-bold px-2 py-1 rounded-md text-sm whitespace-nowrap
                           ${adj.difference > 0 ? "bg-green-500/10 text-green-400 border border-green-500/20" : 
                            adj.difference < 0 ? "bg-red-500/10 text-red-500 border border-red-500/20" : 
                            "bg-gray-500/10 text-gray-400 border border-gray-500/20"}
                         `}>
                             {adj.difference > 0 ? '+' : ''}{adj.difference}
                         </span>
                         {/* Mobile visibility for limits */}
                         <div className="md:hidden text-[10px] text-gray-500 mt-1 uppercase tracking-widest text-center">
                           {adj.previous_stock} → {adj.new_stock}
                         </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdjustmentManager;
