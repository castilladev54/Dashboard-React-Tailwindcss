import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ShoppingCart, Trash2, Search, ArrowLeft, RefreshCw, Calendar, Camera, ScanBarcode, HelpCircle, Keyboard } from "lucide-react";
import { useSaleStore } from "../store/saleStore";
import { useProductStore } from "../store/productStore";
import { useAuthStore } from "../store/authStore";
import { useCurrencyStore } from "../store/currencyStore";
import Button from "./atoms/Button";
import InputText from "./atoms/InputText";
import Label from "./atoms/Label";
import Pagination from "./Pagination";
import Modal from "./molecules/Modal";
import toast from "react-hot-toast";
import BarcodeScanner from "./BarcodeScanner";

// Badge component for keyboard shortcut indicators
const KBD = ({ children }) => (
  <kbd className="ml-1.5 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-gray-400 bg-black/40 border border-white/10 rounded-md leading-none">
    {children}
  </kbd>
);

const PAYMENT_METHODS = ["Efectivo", "Efectivo Bs", "Tarjeta", "Transferencia", "Pago Movil"];

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
  // Filtro de fecha
  const [dateFilter, setDateFilter] = useState("all");

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { fetchProductByBarcode } = useProductStore();
  const searchInputRef = useRef(null);
  const submitBtnRef = useRef(null);
  const paymentSelectRef = useRef(null);
  const qtyInputRefs = useRef({});

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

  const handleBarcodeScan = async (code) => {
    try {
      const { product } = await fetchProductByBarcode(code);
      if (product) {
        handleAddItem(product);
        toast.success(`Añadido: ${product.name}`);
        setSearchTerm("");
      }
    } catch (err) {
      toast.error(`Código de barras "${code}" no encontrado`);
    }
  };

  // Cycle payment method
  const cyclePaymentMethod = useCallback(() => {
    setPaymentMethod(prev => {
      const idx = PAYMENT_METHODS.indexOf(prev);
      const next = PAYMENT_METHODS[(idx + 1) % PAYMENT_METHODS.length];
      toast.success(`Método: ${next}`, { duration: 1200, icon: '💳' });
      return next;
    });
  }, []);

  // Clear cart with confirmation
  const clearCart = useCallback(() => {
    if (items.length === 0) return;
    if (window.confirm('¿Vaciar todo el carrito?')) {
      setItems([]);
      toast.success('Carrito vaciado', { icon: '🗑️' });
    }
  }, [items.length]);

  // Modify last item quantity
  const modifyLastItemQty = useCallback((delta) => {
    if (items.length === 0) return;
    const lastIdx = items.length - 1;
    const newItems = [...items];
    const newQty = (parseFloat(newItems[lastIdx].quantity) || 0) + delta;
    if (newQty <= 0) {
      newItems.splice(lastIdx, 1);
    } else if (newQty > newItems[lastIdx].maxStock) {
      toast.error(`Stock máximo: ${newItems[lastIdx].maxStock}`);
      return;
    } else {
      newItems[lastIdx].quantity = newQty;
    }
    setItems(newItems);
  }, [items]);

  // ═══════════════════════════════════════════
  // GLOBAL KEYBOARD SHORTCUTS + BARCODE SCANNER
  // ═══════════════════════════════════════════
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';

      // ── F-key shortcuts (always active, even in inputs) ──
      switch (e.key) {
        case 'F1':
          e.preventDefault();
          setShowHelp(prev => !prev);
          return;
        case 'F2':
          e.preventDefault();
          if (!isFormOpen) {
            setIsFormOpen(true);
            setViewedSale(null);
          }
          return;
        case 'F3':
          e.preventDefault();
          if (isFormOpen && searchInputRef.current) {
            searchInputRef.current.focus();
          }
          return;
        case 'F4':
          e.preventDefault();
          if (isFormOpen && items.length > 0 && submitBtnRef.current) {
            submitBtnRef.current.click();
          }
          return;
        case 'F5':
          e.preventDefault();
          if (isFormOpen) cyclePaymentMethod();
          return;
        case 'F6':
          e.preventDefault();
          if (isFormOpen) setIsScannerOpen(true);
          return;
        case 'F8':
          e.preventDefault();
          if (isFormOpen) clearCart();
          return;
        case 'Escape':
          e.preventDefault();
          if (showHelp) { setShowHelp(false); return; }
          if (isScannerOpen) { setIsScannerOpen(false); return; }
          if (viewedSale) { setViewedSale(null); return; }
          if (isFormOpen) { cancelForm(); return; }
          return;
        default:
          break;
      }

      // ── "/" to focus search (only when not in an input) ──
      if (e.key === '/' && !isInput && isFormOpen) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // ── +/- to modify last item qty (only outside inputs and form open) ──
      if (!isInput && isFormOpen) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          modifyLastItemQty(1);
          return;
        }
        if (e.key === '-') {
          e.preventDefault();
          modifyLastItemQty(-1);
          return;
        }
      }

      // ── Physical barcode scanner detection (only outside inputs) ──
      if (!isInput) {
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFormOpen, viewedSale, showHelp, isScannerOpen, items, cyclePaymentMethod, clearCart, modifyLastItemQty]);

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

  // Filtrar ventas por fecha
  const { filteredSales, filteredTotal } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filtered = sales.filter(sale => {
      if (dateFilter === 'all') return true;
      const saleDate = new Date(sale.createdAt);
      const saleDay = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());

      if (dateFilter === 'today') {
        return saleDay.getTime() === today.getTime();
      } else if (dateFilter === '7days') {
        const limit = new Date(today);
        limit.setDate(today.getDate() - 7);
        return saleDay >= limit;
      } else if (dateFilter === '30days') {
        const limit = new Date(today);
        limit.setDate(today.getDate() - 30);
        return saleDay >= limit;
      } else if (dateFilter === 'month') {
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    const total = filtered.reduce((acc, sale) => acc + Number(sale.total_amount || 0), 0);

    return { filteredSales: filtered, filteredTotal: total };
  }, [sales, dateFilter]);

  const dateFilterOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'today', label: 'Hoy' },
    { value: '7days', label: '7 días' },
    { value: '30days', label: '30 días' },
    { value: 'month', label: 'Este mes' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header con tasa cambiaria */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Punto de <span className="text-orange-500">Venta</span>
          </h2>

          {!isFormOpen && !viewedSale && (
            <Button variant="primary" onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
              <Plus size={20} />
              Nueva Venta
              <KBD>F2</KBD>
            </Button>
          )}
        </div>

        {/* Barra de tasa cambiaria */}
        <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
          <RefreshCw size={18} className="text-blue-400 shrink-0" />
          <span className="text-sm text-gray-300 whitespace-nowrap">Tasa del Día:</span>
          {editingRate ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">1 USD =</span>
              <InputText
                type="number"
                step="0.01"
                min="0.01"
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
                className="w-28 px-3 py-1 text-sm"
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
      <Modal
        isOpen={isFormOpen}
        onClose={cancelForm}
        title="Registrar Nueva Venta"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 relative z-10 w-full min-w-full sm:min-w-[500px] lg:min-w-[800px]">
          {/* Buscador de productos */}
          <div className="border border-white/5 bg-black/20 rounded-xl p-3 sm:p-4 flex flex-col h-[50vh] min-h-[300px] lg:h-[500px]">
            <div className="relative mb-3 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <InputText
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredProducts.length > 0) {
                        handleAddItem(filteredProducts[0]);
                        setSearchTerm("");
                        // Focus the last item's quantity after React renders
                        setTimeout(() => {
                          const keys = Object.keys(qtyInputRefs.current);
                          const lastKey = keys[keys.length - 1];
                          if (lastKey && qtyInputRefs.current[lastKey]) {
                            qtyInputRefs.current[lastKey].focus();
                            qtyInputRefs.current[lastKey].select();
                          }
                        }, 50);
                      } else if (searchTerm.length >= 5) {
                        handleBarcodeScan(searchTerm);
                      }
                    }
                  }}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsScannerOpen(true)}
                title="Escanear (F6)"
                className="px-3 bg-white/5 border border-white/10 hover:bg-white/10 shrink-0"
              >
                <Camera size={20} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-2">
              {filteredProducts.map(product => (
                <div
                  key={product._id}
                  className={`flex justify-between items-center p-2 sm:p-3 rounded-lg border border-white/5 transition
                    ${product.stock > 0 ? 'bg-white/5 hover:bg-white/10 cursor-pointer' : 'bg-red-500/5 opacity-50 cursor-not-allowed'}`}
                  onClick={() => handleAddItem(product)}
                >
                  <div className="flex-1 truncate pr-2">
                    <h4 className="text-white font-medium text-sm sm:text-base truncate">{product.name} {product.unit_type && product.unit_type !== "unidad" ? `(${product.unit_type})` : ""}</h4>
                    <p className="text-xs text-gray-400">Stock: {product.stock} {product.unit_type && product.unit_type !== "unidad" ? product.unit_type : (product.stock === 1 ? 'ud' : 'uds')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-orange-400 font-bold text-sm sm:text-base">${Number(product.price).toFixed(2)}</div>
                    <div className="text-[10px] sm:text-xs text-blue-400">Bs {toBs(product.price).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carrito de venta */}
          <form onSubmit={handleSubmit} className="flex flex-col h-[55vh] min-h-[350px] lg:h-[500px]">
            <div className="border border-white/5 bg-black/20 rounded-xl p-3 sm:p-4 flex-1 flex flex-col mb-4">
              <h4 className="text-base sm:text-lg font-medium text-white mb-3">Carrito de Compra</h4>

              <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-2 mb-4">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <ShoppingCart size={40} className="mb-2 opacity-50" />
                    <p className="text-sm">El carrito está vacío</p>
                  </div>
                ) : (
                  items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-white/5 p-2 sm:p-3 rounded-lg border border-white/5">
                      <div className="flex-1 truncate pr-2">
                        <h5 className="text-white font-medium text-sm truncate">{item.name} {item.unit_type && item.unit_type !== "unidad" ? `(${item.unit_type})` : ""}</h5>
                        <div className="flex gap-2 sm:gap-3 items-end">
                          <span className="text-amber-500 font-bold text-xs sm:text-sm">${item.unit_price.toFixed(2)}</span>
                          <span className="text-blue-400 text-[10px] sm:text-xs">Bs {toBs(item.unit_price).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <InputText
                          ref={(el) => { if (el) qtyInputRefs.current[index] = el; else delete qtyInputRefs.current[index]; }}
                          type="number"
                          min="0.01"
                          step="0.01"
                          max={item.maxStock}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (qtyInputRefs.current[index + 1]) {
                                qtyInputRefs.current[index + 1].focus();
                                qtyInputRefs.current[index + 1].select();
                              } else {
                                paymentSelectRef.current?.focus();
                              }
                            }
                          }}
                          className="w-16 sm:w-20 text-center py-1 px-1 text-sm bg-black/50"
                        />
                        <Button variant="ghost" size="sm" type="button" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:bg-red-500/10 p-1 sm:p-2">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-white/10 pt-3 mt-auto">
                <div className="mb-3">
                  <Label className="text-xs sm:text-sm">Método de Pago <KBD>F5</KBD></Label>
                  <select
                    ref={paymentSelectRef}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitBtnRef.current?.focus();
                      }
                    }}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition text-sm"
                    required
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Efectivo Bs">Efectivo Bolívares</option>
                    <option value="Tarjeta">Tarjeta (Crédito/Débito)</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Pago Movil">Pago Móvil</option>
                  </select>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-left">
                     <span className="block text-xs text-gray-400">Total Bs</span>
                     <div className="text-lg sm:text-xl font-bold text-blue-400 leading-none mt-1">Bs {toBs(currentTotal).toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                     <span className="block text-xs text-gray-400">Total USD</span>
                     <div className="text-2xl sm:text-3xl font-bold text-amber-500 leading-none mt-1">${currentTotal.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-auto">
              <Button variant="secondary" type="button" onClick={cancelForm} className="w-1/3 py-2 sm:py-3 text-sm">
                Cancelar
              </Button>
              <Button ref={submitBtnRef} variant="primary" type="submit" disabled={isLoading || items.length === 0} className="w-2/3 py-2 sm:py-3 text-sm">
                {isLoading ? "Procesando..." : <><Check size={18} className="mr-1" /> Procesar <span className="hidden sm:inline">Venta</span> <KBD>F4</KBD></>}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

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
        <>
          {/* Barra de filtros por fecha */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <nav className="flex items-center gap-2 flex-wrap" aria-label="Filtro por período">
              <Calendar size={18} className="text-gray-400 shrink-0" />
              {dateFilterOptions.map(opt => (
                <Button
                  key={opt.value}
                  variant={dateFilter === opt.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setDateFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </nav>
            {dateFilter !== 'all' && (
              <div className="flex items-center gap-4 bg-gradient-to-r from-amber-500/10 to-blue-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total filtrado</p>
                  <span className="text-lg font-bold text-amber-500">${filteredTotal.toFixed(2)}</span>
                  <span className="text-sm text-blue-400 ml-2">Bs {toBs(filteredTotal).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">
                Cargando historial de ventas...
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-gray-400 mb-4">
                  <ShoppingCart size={30} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {sales.length === 0 ? 'Aún no hay ventas' : 'Sin ventas en este período'}
                </h3>
                <p className="text-gray-400 mb-6">
                  {sales.length === 0 ? 'El historial de ventas está vacío.' : 'No se encontraron ventas con el filtro seleccionado.'}
                </p>
                {sales.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setDateFilter('all')}>
                    Ver todas las ventas
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-black/20 text-gray-400 text-xs sm:text-sm uppercase tracking-wider">
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium">Fecha</th>
                      <th className="hidden md:table-cell px-6 py-4 font-medium">Método Pago</th>
                      <th className="hidden sm:table-cell px-6 py-4 font-medium">Estado</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium">Total</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSales.map((sale, index) => (
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={sale._id}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-3 py-3 sm:px-6 sm:py-4 text-gray-300 text-sm">
                          {new Date(sale.createdAt).toLocaleDateString()}
                          <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                            {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 text-white font-medium text-sm">
                          {sale.payment_method}
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4">
                          <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-xs font-semibold">
                            {sale.status || 'Completada'}
                          </span>
                        </td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <div className="text-amber-500 font-medium text-sm sm:text-base">${Number(sale.total_amount || 0).toFixed(2)}</div>
                          <div className="text-[10px] sm:text-xs text-blue-400 mt-0.5">Bs {toBs(Number(sale.total_amount || 0)).toFixed(2)}</div>
                        </td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(sale._id)} className="bg-white/5 hover:bg-white/10 text-orange-400 px-2 sm:px-3 text-xs sm:text-sm">
                            <span className="hidden sm:inline">Ver Detalles</span>
                            <span className="sm:hidden">Detalles</span>
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
      />

      {/* ═══ HELP MODAL (F1) ═══ */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
            <motion.aside
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#1a1a24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <header className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-2">
                  <Keyboard size={22} className="text-orange-500" />
                  <h3 className="text-lg font-bold text-white">Atajos de Teclado</h3>
                </div>
                <button onClick={() => setShowHelp(false)} className="p-1 text-gray-400 hover:text-white transition">
                  <X size={22} />
                </button>
              </header>

              <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
                {/* General */}
                <section>
                  <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">General</h4>
                  <ul className="space-y-2">
                    {[
                      ['F1', 'Mostrar / ocultar esta ayuda'],
                      ['F2', 'Nueva venta'],
                      ['Esc', 'Cerrar formulario / vista de detalle'],
                    ].map(([key, desc]) => (
                      <li key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">{desc}</span>
                        <kbd className="px-2 py-1 text-xs font-mono font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-md">{key}</kbd>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Formulario de venta */}
                <section>
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Formulario de Venta</h4>
                  <ul className="space-y-2">
                    {[
                      ['F3 ó /', 'Enfocar buscador de productos'],
                      ['F4', 'Procesar / confirmar venta'],
                      ['F5', 'Ciclar método de pago'],
                      ['F6', 'Abrir escáner de cámara'],
                      ['F8', 'Vaciar carrito (con confirmación)'],
                      ['+', 'Aumentar cantidad del último ítem'],
                      ['−', 'Disminuir cantidad del último ítem'],
                    ].map(([key, desc]) => (
                      <li key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">{desc}</span>
                        <kbd className="px-2 py-1 text-xs font-mono font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-md">{key}</kbd>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Scanner */}
                <section>
                  <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Escáner Físico</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    El sistema detecta automáticamente escáneres USB / Bluetooth.
                    Solo apunta y escanea — el producto se añade al carrito al instante.
                  </p>
                </section>
              </div>

              <footer className="p-4 border-t border-white/5 bg-black/20 text-center">
                <p className="text-xs text-gray-500">Presiona <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-black/40 border border-white/10 rounded">F1</kbd> o <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-black/40 border border-white/10 rounded">Esc</kbd> para cerrar</p>
              </footer>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Floating F1 hint (only visible when form is not open) */}
      {!isFormOpen && !viewedSale && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a1a24]/90 border border-white/10 rounded-xl text-gray-400 hover:text-orange-400 hover:border-orange-500/30 transition backdrop-blur-sm shadow-lg"
          >
            <HelpCircle size={18} />
            <span className="text-xs font-medium">Atajos</span>
            <KBD>F1</KBD>
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesManager;
