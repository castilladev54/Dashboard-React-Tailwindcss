import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Check, PackageOpen, Trash2, Search, ArrowLeft } from "lucide-react";
import { usePurchaseStore } from "../store/purchaseStore";
import { useProductStore } from "../store/productStore";
import { useAuthStore } from "../store/authStore";
import Button from "./Button";
import toast from "react-hot-toast";
import BarcodeScanner from "./BarcodeScanner";
import { Camera, ScanBarcode } from "lucide-react";

const PurchaseManager = () => {
  const { purchases, isLoading, error, fetchPurchases, createPurchase, fetchPurchaseById } = usePurchaseStore();
  const { products, fetchProducts } = useProductStore();
  const { user } = useAuthStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewedPurchase, setViewedPurchase] = useState(null); // Para ver el detalle

  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState([
    { product_id: "", quantity: 1, unit_cost: 0, unit_type: "unidad" }
  ]);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { fetchProductByBarcode } = useProductStore();

  useEffect(() => {
    fetchPurchases();
    fetchProducts();
  }, [fetchPurchases, fetchProducts]);

  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_cost: 0, unit_type: "unidad" }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'product_id') {
      const prod = products.find(p => p._id === value);
      if (prod) newItems[index].unit_type = prod.unit_type || "unidad";
    }
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!supplier.trim()) return toast.error("El nombre del proveedor es requerido");
    if (items.length === 0) return toast.error("Agrega al menos un artículo a la compra");

    for (let item of items) {
      if (!item.product_id) return toast.error("Selecciona un producto en todos los campos");
      if (parseFloat(item.quantity) <= 0 || isNaN(parseFloat(item.quantity))) return toast.error("La cantidad debe ser mayor a 0");
      if (item.unit_cost < 0) return toast.error("El costo unitario no puede ser negativo");
    }

    const payload = {
      admin_id: user?._id || user?.id,
      supplier,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: parseFloat(item.quantity) || 0,
        unit_cost: Number(item.unit_cost)
      }))
    };

    try {
      await createPurchase(payload);
      toast.success("Compra/Entrada registrada con éxito");
      setIsFormOpen(false);
      setSupplier("");
      setItems([{ product_id: "", quantity: 1, unit_cost: 0, unit_type: "unidad" }]);
    } catch (err) {
      toast.error(error || "Ocurrió un error al registrar la compra");
    }
  };

  const cancelForm = () => {
    setIsFormOpen(false);
    setSupplier("");
    setItems([{ product_id: "", quantity: 1, unit_cost: 0, unit_type: "unidad" }]);
  };

  const handleBarcodeScan = async (code) => {
    try {
      const { product } = await fetchProductByBarcode(code);
      if (product) {
        // Find if empty row exists
        const emptyIndex = items.findIndex(item => !item.product_id);
        if (emptyIndex !== -1) {
          handleItemChange(emptyIndex, "product_id", product._id);
        } else {
          setItems([...items, { product_id: product._id, quantity: 1, unit_cost: product.price, unit_type: product.unit_type || "unidad" }]);
        }
        toast.success(`Añadido: ${product.name}`);
      }
    } catch (err) {
      toast.error(`Código de barras "${code}" no encontrado`);
    }
  };

  // Physical Barcode Scanner Support
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      if (!isFormOpen) return;
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 50) buffer = "";

      if (e.key === "Enter") {
        if (buffer.length >= 5) {
          handleBarcodeScan(buffer);
          buffer = "";
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
      lastKeyTime = currentTime;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFormOpen]);

  const handleViewDetail = async (id) => {
    try {
      const data = await fetchPurchaseById(id);
      setViewedPurchase(data);
    } catch (err) {
      toast.error("No se pudo cargar el detalle de la compra");
    }
  };

  // Calcular total de la compra en curso para preview
  const currentTotal = items.reduce((acc, item) => acc + ((parseFloat(item.quantity) || 0) * Number(item.unit_cost)), 0);

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-wide">
          Gestión de <span className="text-orange-500">Compras</span>
        </h2>

        {!isFormOpen && !viewedPurchase && (
          <Button variant="primary" onClick={() => setIsFormOpen(true)}>
            <Plus size={20} />
            Nueva Entrada
          </Button>
        )}
      </div>

      {/* FORMULARIO DE NUEVA COMPRA */}
      {isFormOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0, scale: 0.95 }}
          animate={{ opacity: 1, height: "auto", scale: 1 }}
          className="mb-8 p-6 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-xl relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-xl font-bold text-white">Registrar Nueva Compra / Entrada</h3>
            <Button variant="ghost" onClick={cancelForm}>
              <X size={24} />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del Proveedor / Empresa</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                required
                placeholder="Ej. Distribuidora Mayorista S.A."
                className="w-full md:w-1/2 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
              />
            </div>

            <div className="border border-white/5 bg-black/20 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-white">Artículos</h4>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setIsScannerOpen(true)} className="text-blue-400 hover:text-blue-300">
                    <Camera size={16} className="mr-1" /> Escanear
                  </Button>
                  <Button variant="ghost" size="sm" type="button" onClick={handleAddItem} className="text-orange-400 hover:text-orange-300">
                    <Plus size={16} /> Añadir Artículo
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-3 items-end bg-white/5 p-3 rounded-lg border border-white/5">
                    <div className="flex-1 w-full relative">
                      <label className="block text-xs text-gray-400 mb-1">Producto</label>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                        required
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition"
                      >
                        <option value="" disabled>Seleccionar Producto</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock})</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full md:w-32 relative">
                      <label className="block text-xs text-gray-400 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        required
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition"
                      />
                    </div>

                    <div className="w-full md:w-32 relative">
                      <label className="block text-xs text-gray-400 mb-1">Costo Unit. ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_cost}
                        onChange={(e) => handleItemChange(index, "unit_cost", e.target.value)}
                        required
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition"
                      />
                    </div>

                    <div className="w-full md:w-32">
                      <label className="block text-xs text-gray-400 mb-1">Subtotal</label>
                      <div className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-gray-300 cursor-not-allowed">
                        ${((parseFloat(item.quantity) || 0) * Number(item.unit_cost)).toFixed(2)}
                      </div>
                    </div>

                    {items.length > 1 && (
                      <Button variant="icon" type="button" onClick={() => handleRemoveItem(index)} title="Eliminar artículo" className="text-red-400 hover:bg-red-500/10 mb-0.5">
                        <Trash2 size={20} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <div className="text-right">
                  <span className="text-gray-400 text-sm">Costo Total Estimado:</span>
                  <div className="text-2xl font-bold text-amber-500">${currentTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="secondary" type="button" onClick={cancelForm}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" isLoading={isLoading}>
                <Check size={18} /> Registrar Compra
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* VISTA DETALLE DE COMPRA */}
      {viewedPurchase && !isFormOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-6 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setViewedPurchase(null)} className="text-orange-500 hover:text-orange-400">
              <ArrowLeft size={20} />
              <span>Volver al historial</span>
            </Button>
            <div className="text-sm text-gray-400">
              ID Compra: {viewedPurchase._id}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Proveedor</p>
              <p className="text-lg font-medium text-white">{viewedPurchase.supplier}</p>
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fecha de Registro</p>
              <p className="text-lg font-medium text-white">
                {new Date(viewedPurchase.createdAt || viewedPurchase.date).toLocaleString()}
              </p>
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total de Artículos Diferentes</p>
              <p className="text-lg font-medium text-white">{viewedPurchase.items?.length || 0}</p>
            </div>
            <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
              <p className="text-xs text-amber-500/70 uppercase tracking-wider mb-1">Costo Total Compra</p>
              <p className="text-2xl font-bold text-amber-500">
                ${Number(viewedPurchase.total_cost || 0).toFixed(2)}
              </p>
            </div>
          </div>

          <h4 className="text-lg font-medium text-white mb-4">Artículos de esta Entrada</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/30 text-gray-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Producto (ID)</th>
                  <th className="px-6 py-3 font-medium">Cantidad Recibida</th>
                  <th className="px-6 py-3 font-medium">Costo Unitario</th>
                  <th className="px-6 py-3 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {viewedPurchase.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 text-white">
                      <span className="font-medium text-orange-400">{item.product_id?.name || 'Producto Desconocido'}</span>
                      <div className="text-xs text-gray-500 mt-1">ID: {item.product_id?._id || item.product_id}</div>
                    </td>
                    <td className="px-6 py-3 text-gray-300">
                      <span className="bg-white/10 px-2 py-1 rounded text-sm">+ {item.quantity} {item.product_id?.unit_type && item.product_id?.unit_type !== 'unidad' ? item.product_id.unit_type : (item.quantity === 1 ? 'unidad' : 'unidades')}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-300">${Number(item.unit_cost).toFixed(2)}</td>
                    <td className="px-6 py-3 text-amber-500 font-medium">
                      ${(parseFloat(item.quantity) * Number(item.unit_cost)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ERROR HANDLER */}
      {error && !isFormOpen && !viewedPurchase && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
          {error}
        </div>
      )}

      {/* HISTORIAL LIST */}
      {!isFormOpen && !viewedPurchase && (
        <div className="bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">
              Cargando historial de compras...
            </div>
          ) : purchases.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-gray-400 mb-4">
                <PackageOpen size={30} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Aún no hay compras</h3>
              <p className="text-gray-400 mb-6">El historial de entradas de mercancía está vacío.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/20 text-gray-400 text-sm uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Fecha</th>
                    <th className="px-6 py-4 font-medium">Proveedor</th>
                    <th className="px-6 py-4 font-medium">Items</th>
                    <th className="px-6 py-4 font-medium">Total Costo</th>
                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {purchases.map((purchase, index) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={purchase._id}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(purchase.createdAt || purchase.date).toLocaleDateString()}
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(purchase.createdAt || purchase.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {purchase.supplier}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {purchase.items?.length || 0} ítems
                      </td>
                      <td className="px-6 py-4 text-amber-500 font-medium">
                        ${Number(purchase.total_cost || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(purchase._id)} className="bg-white/5 hover:bg-white/10 text-orange-400">
                          Ver Detalles
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <BarcodeScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleBarcodeScan}
      />
    </div>
  );
};

export default PurchaseManager;
