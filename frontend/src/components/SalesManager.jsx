import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Check, ShoppingCart, Trash2, Search, ArrowLeft, RefreshCw } from "lucide-react";
import { useSaleStore } from "../store/saleStore";
import { useProductStore } from "../store/productStore";
import { useAuthStore } from "../store/authStore";
import { useCurrencyStore } from "../store/currencyStore";
import Button from "./Button";
import toast from "react-hot-toast";

const SalesManager = () => {
  const { sales, isLoading, error, fetchSales, createSale, fetchSaleById } = useSaleStore();
  const { products, fetchProducts } = useProductStore();
  const { user } = useAuthStore();
  const { exchangeRate, setExchangeRate, toBs } = useCurrencyStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewedSale, setViewedSale] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [items, setItems] = useState([]);
  
  // Para la búsqueda de productos
  const [searchTerm, setSearchTerm] = useState("");
  // Editar tasa
  const [editingRate, setEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(exchangeRate);

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, [fetchSales, fetchProducts]);

  const handleSaveRate = () => {
    setExchangeRate(tempRate);
    setEditingRate(false);
    toast.success(`Tasa actualizada: 1 USD = ${tempRate} Bs`);
  };

  const handleAddItem = (product) => {
    if (product.stock <= 0) {
      toast.error(`El producto ${product.name} no tiene stock disponible`);
      return;
    }

    const existingItemIndex = items.findIndex((item) => item.product_id === product._id);
    if (existingItemIndex >= 0) {
      const newItems = [...items];
      if (newItems[existingItemIndex].quantity + 1 > product.stock) {
        toast.error(`No hay más stock disponible de ${product.name}`);
        return;
      }
      newItems[existingItemIndex].quantity += 1;
      setItems(newItems);
    } else {
      setItems([...items, { product_id: product._id, name: product.name, quantity: 1, unit_price: product.price, maxStock: product.stock, unit_type: product.unit_type || "unidad" }]);
    }
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleQuantityChange = (index, value) => {
    const qty = parseFloat(value);
    if (value !== "" && (isNaN(qty) || qty < 0)) return;
    
    const newItems = [...items];
    if (qty > newItems[index].maxStock) {
      toast.error(`La cantidad no puede exceder el stock disponible (${newItems[index].maxStock})`);
      return;
    }
    newItems[index].quantity = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) return toast.error("Agrega al menos un artículo a la venta");

    const total_amount = items.reduce((acc, item) => acc + ((parseFloat(item.quantity) || 0) * item.unit_price), 0);

    const payload = {
      customer_id: user?._id || user?.id,
      payment_method: paymentMethod,
      total_amount,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: parseFloat(item.quantity) || 0,
        unit_price: item.unit_price
      }))
    };

    try {
      await createSale(payload);
      toast.success("Venta registrada con éxito");
      setIsFormOpen(false);
      setItems([]);
      setPaymentMethod("Efectivo");
      fetchProducts();
    } catch (err) {
      toast.error(error || "Ocurrió un error al registrar la venta");
    }
  };

  const cancelForm = () => {
    setIsFormOpen(false);
    setItems([]);
    setPaymentMethod("Efectivo");
  };

  const handleViewDetail = async (id) => {
    try {
      const data = await fetchSaleById(id);
      setViewedSale(data);
    } catch (err) {
      toast.error("No se pudo cargar el detalle de la venta");
    }
  };

  const currentTotal = items.reduce((acc, item) => acc + ((parseFloat(item.quantity) || 0) * item.unit_price), 0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header con tasa cambiaria */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white tracking-wide">
            Punto de <span className="text-orange-500">Venta</span>
          </h2>

          {!isFormOpen && !viewedSale && (
            <Button variant="primary" onClick={() => setIsFormOpen(true)}>
              <Plus size={20} />
              Nueva Venta
            </Button>
          )}
        </div>

        {/* Barra de tasa cambiaria */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
          <RefreshCw size={18} className="text-blue-400 shrink-0" />
          <span className="text-sm text-gray-300 whitespace-nowrap">Tasa del Día:</span>
          {editingRate ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">1 USD =</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
                className="w-28 bg-black/50 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                autoFocus
              />
              <span className="text-sm text-gray-400">Bs</span>
              <Button variant="primary" size="sm" onClick={handleSaveRate}>
                Guardar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setEditingRate(false); setTempRate(exchangeRate); }}>
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-400">1 USD = {exchangeRate} Bs</span>
              <Button variant="ghost" size="sm" onClick={() => { setEditingRate(true); setTempRate(exchangeRate); }} className="text-gray-300">
                Editar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* FORMULARIO DE NUEVA VENTA */}
      {isFormOpen && (
        <motion.div
           initial={{ opacity: 0, height: 0, scale: 0.95 }}
           animate={{ opacity: 1, height: "auto", scale: 1 }}
           className="mb-8 p-6 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-xl relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-xl font-bold text-white">Registrar Nueva Venta</h3>
            <Button variant="ghost" onClick={cancelForm}>
               <X size={24} />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
            {/* Buscador de productos */}
            <div className="border border-white/5 bg-black/20 rounded-xl p-4 flex flex-col h-[500px]">
              <div className="relative mb-4">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                 <input
                   type="text"
                   placeholder="Buscar producto..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
                 />
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {filteredProducts.map(product => (
                  <div 
                    key={product._id} 
                    className={`flex justify-between items-center p-3 rounded-lg border border-white/5 transition
                      ${product.stock > 0 ? 'bg-white/5 hover:bg-white/10 cursor-pointer' : 'bg-red-500/5 opacity-50 cursor-not-allowed'}`}
                    onClick={() => handleAddItem(product)}
                  >
                    <div>
                      <h4 className="text-white font-medium">{product.name} {product.unit_type && product.unit_type !== "unidad" ? `(${product.unit_type})` : ""}</h4>
                      <p className="text-xs text-gray-400">Stock: {product.stock} {product.unit_type && product.unit_type !== "unidad" ? product.unit_type : (product.stock === 1 ? 'ud' : 'uds')}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-orange-400 font-bold">${Number(product.price).toFixed(2)}</div>
                      <div className="text-xs text-blue-400">Bs {toBs(product.price).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carrito de venta */}
            <form onSubmit={handleSubmit} className="flex flex-col h-[500px]">
              <div className="border border-white/5 bg-black/20 rounded-xl p-4 flex-1 flex flex-col mb-4">
                <h4 className="text-lg font-medium text-white mb-4">Carrito de Compra</h4>
                
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <ShoppingCart size={40} className="mb-2 opacity-50" />
                      <p>El carrito está vacío</p>
                    </div>
                  ) : (
                    items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="flex-1">
                          <h5 className="text-white font-medium text-sm">{item.name} {item.unit_type && item.unit_type !== "unidad" ? `(${item.unit_type})` : ""}</h5>
                          <div className="flex gap-3">
                            <span className="text-amber-500 font-bold text-sm">${item.unit_price.toFixed(2)}</span>
                            <span className="text-blue-400 text-xs leading-5">Bs {toBs(item.unit_price).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            min="0.01"
                            step="0.01"
                            max={item.maxStock}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className="w-20 bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-center text-white focus:outline-none focus:border-orange-500 transition"
                          />
                          <Button variant="icon" type="button" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:bg-red-500/10">
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-white/10 pt-4 mt-auto">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Método de Pago</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
                      required
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Efectivo Bs">Efectivo Bolívares</option>
                      <option value="Tarjeta">Tarjeta (Crédito/Débito)</option>
                      <option value="Transferencia">Transferencia Bancaria</option>
                      <option value="Pago Movil">Pago Móvil</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-end">
                      <span className="text-gray-400">Total USD:</span>
                      <div className="text-3xl font-bold text-amber-500">${currentTotal.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-gray-400">Total Bs:</span>
                      <div className="text-2xl font-bold text-blue-400">Bs {toBs(currentTotal).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-auto">
                <Button variant="secondary" type="button" onClick={cancelForm} className="w-1/3 py-3">
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={isLoading || items.length === 0} className="w-2/3 py-3">
                  {isLoading ? "Procesando..." : <><Check size={20} /> Procesar Venta</>}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* VISTA DETALLE DE VENTA */}
      {viewedSale && !isFormOpen && (
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="mb-8 p-6 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setViewedSale(null)} className="text-orange-500 hover:text-orange-400">
               <ArrowLeft size={20} />
               <span>Volver a Ventas</span>
            </Button>
            <div className="text-sm text-gray-400">
               ID Venta: {viewedSale._id}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Método de Pago</p>
               <p className="text-lg font-medium text-white">{viewedSale.payment_method}</p>
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fecha</p>
               <p className="text-lg font-medium text-white">
                 {new Date(viewedSale.createdAt).toLocaleString()}
               </p>
            </div>
            <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
               <p className="text-xs text-amber-500/70 uppercase tracking-wider mb-1">Total USD</p>
               <p className="text-2xl font-bold text-amber-500">
                 ${Number(viewedSale.total_amount || 0).toFixed(2)}
               </p>
            </div>
            <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
               <p className="text-xs text-blue-500/70 uppercase tracking-wider mb-1">Total Bs</p>
               <p className="text-2xl font-bold text-blue-400">
                 Bs {toBs(Number(viewedSale.total_amount || 0)).toFixed(2)}
               </p>
            </div>
          </div>

          <h4 className="text-lg font-medium text-white mb-4">Artículos Vendidos</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b border-white/5 bg-black/30 text-gray-400 text-sm uppercase tracking-wider">
                   <th className="px-6 py-3 font-medium">Producto</th>
                   <th className="px-6 py-3 font-medium">Cantidad</th>
                   <th className="px-6 py-3 font-medium">Precio USD</th>
                   <th className="px-6 py-3 font-medium">Precio Bs</th>
                   <th className="px-6 py-3 font-medium">Subtotal</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {viewedSale.items?.map((item, idx) => (
                   <tr key={idx} className="hover:bg-white/5 transition-colors">
                     <td className="px-6 py-3 text-white">
                       <span className="font-medium text-orange-400">{item.product_id?.name || 'Producto Desconocido'}</span>
                     </td>
                     <td className="px-6 py-3 text-gray-300">
                       {item.quantity} {item.product_id?.unit_type && item.product_id?.unit_type !== "unidad" ? item.product_id.unit_type : (item.quantity === 1 ? 'unidad' : 'unidades')}
                     </td>
                     <td className="px-6 py-3 text-gray-300">${Number(item.unit_price).toFixed(2)}</td>
                     <td className="px-6 py-3 text-blue-400">Bs {toBs(Number(item.unit_price)).toFixed(2)}</td>
                     <td className="px-6 py-3">
                       <div className="text-amber-500 font-medium">${(parseFloat(item.quantity) * Number(item.unit_price)).toFixed(2)}</div>
                       <div className="text-xs text-blue-400">Bs {toBs(parseFloat(item.quantity) * Number(item.unit_price)).toFixed(2)}</div>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ERROR HANDLER */}
      {error && !isFormOpen && !viewedSale && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
           {error}
        </div>
      )}

      {/* HISTORIAL LIST */}
      {!isFormOpen && !viewedSale && (
        <div className="bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {isLoading ? (
             <div className="p-8 text-center text-gray-400">
               Cargando historial de ventas...
             </div>
          ) : sales.length === 0 ? (
             <div className="p-12 text-center">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-gray-400 mb-4">
                 <ShoppingCart size={30} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Aún no hay ventas</h3>
               <p className="text-gray-400 mb-6">El historial de ventas está vacío.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-white/5 bg-black/20 text-gray-400 text-sm uppercase tracking-wider">
                     <th className="px-6 py-4 font-medium">Fecha</th>
                     <th className="px-6 py-4 font-medium">Método Pago</th>
                     <th className="px-6 py-4 font-medium">Estado</th>
                     <th className="px-6 py-4 font-medium">Total USD</th>
                     <th className="px-6 py-4 font-medium">Total Bs</th>
                     <th className="px-6 py-4 font-medium text-right">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {sales.map((sale, index) => (
                     <motion.tr
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.05 }}
                       key={sale._id}
                       className="hover:bg-white/5 transition-colors group"
                     >
                       <td className="px-6 py-4 text-gray-300">
                         {new Date(sale.createdAt).toLocaleDateString()}
                         <div className="text-xs text-gray-500 mt-0.5">
                           {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                       </td>
                       <td className="px-6 py-4 text-white font-medium">
                         {sale.payment_method}
                       </td>
                       <td className="px-6 py-4">
                         <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-xs font-semibold">
                           {sale.status || 'Completada'}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-amber-500 font-medium">
                         ${Number(sale.total_amount || 0).toFixed(2)}
                       </td>
                       <td className="px-6 py-4 text-blue-400 font-medium">
                         Bs {toBs(Number(sale.total_amount || 0)).toFixed(2)}
                       </td>
                       <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(sale._id)} className="bg-white/5 hover:bg-white/10 text-orange-400">
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
    </div>
  );
};

export default SalesManager;
