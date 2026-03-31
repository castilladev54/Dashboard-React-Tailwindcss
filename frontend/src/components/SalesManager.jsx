import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ShoppingCart, Trash2, Search, ArrowLeft, RefreshCw, Calendar, Camera, ScanBarcode, HelpCircle, Keyboard, X } from "lucide-react";
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
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const { fetchProductByBarcode } = useProductStore();
  const searchInputRef = useRef(null);
  const submitBtnRef = useRef(null);
  const paymentSelectRef = useRef(null);
  const qtyInputRefs = useRef({});

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, [fetchSales, fetchProducts]);

  // Autofocus search when scanner closes
  useEffect(() => {
    if (!isScannerOpen && isFormOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isScannerOpen, isFormOpen]);

  const handleSaveRate = () => {
    setExchangeRate(tempRate);
    setEditingRate(false);
    toast.success(`Tasa actualizada: 1 USD = ${tempRate} Bs`);
  };

  const handleAddItem = (product, quantity = 1) => {
    if (product.stock <= 0) {
      toast.error(`El producto ${product.name} no tiene stock disponible`);
      return;
    }

    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.product_id === product._id);
      if (existingItemIndex >= 0) {
        const newItems = [...prevItems];
        if (newItems[existingItemIndex].quantity + quantity > product.stock) {
          setTimeout(() => toast.error(`No hay más stock disponible de ${product.name}`), 0);
          return prevItems;
        }
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        return [...prevItems, { 
          product_id: product._id, 
          name: product.name, 
          quantity, 
          unit_price: product.price, 
          maxStock: product.stock, 
          unit_type: product.unit_type || "unidad" 
        }];
      }
    });

    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 300);
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

  const handleBarcodeScan = async (code, qty = 1) => {
    try {
      const { product } = await fetchProductByBarcode(code);
      if (product) {
        handleAddItem(product, qty);
        toast.success(`Añadido: ${qty}x ${product.name}`);
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

      {/* FORMULARIO DE NUEVA VENTA FULLSCREEN RESPONSIBLE */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[#0f0f13] flex flex-col font-sans overflow-hidden"
          >
            {/* TOP BAR: Resumen del Carrito */}
            <div 
              className="bg-[#1a1a24] border-b border-orange-500/20 p-3 sm:p-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex justify-between items-center cursor-pointer hover:bg-[#22222f] transition z-20"
              onClick={() => setIsCartDrawerOpen(true)}
            >
              <div className="flex items-center gap-2 sm:gap-4">
                <Button variant="ghost" onClick={(e) => { e.stopPropagation(); cancelForm(); }} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition">
                  <ArrowLeft size={24} />
                </Button>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm text-gray-400 font-medium">Total de Venta</span>
                  <motion.div 
                    animate={cartPulse ? { scale: [1, 1.1, 1], color: ['#f59e0b', '#fbbf24', '#f59e0b'] } : {}}
                    transition={{ duration: 0.3 }}
                    className="text-xl sm:text-3xl font-bold text-amber-500 tracking-tight leading-none"
                  >
                    ${currentTotal.toFixed(2)}
                  </motion.div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-6">
                <div className="text-right flex flex-col items-end">
                  <span className="text-xs sm:text-sm text-gray-400 font-medium hidden sm:block">Artículos</span>
                  <div className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-sm sm:text-lg font-bold flex items-center gap-2">
                    <ShoppingCart size={16} />
                    {items.length}
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  className="rounded-full px-5 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                  onClick={(e) => { e.stopPropagation(); setIsCartDrawerOpen(true); }}
                >
                  <span className="hidden sm:inline">Pagar</span>
                  <span className="sm:hidden">Pagar</span>
                </Button>
              </div>
            </div>

            {/* MAIN AREA: Buscador, Escáner y Catálogo */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#1a1a24]/50 to-[#0f0f13] p-3 sm:p-6">
              {/* Barra de Búsqueda y Escáner */}
              <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 max-w-4xl mx-auto w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <InputText
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredProducts.length > 0 && !searchTerm.includes('*')) {
                          handleAddItem(filteredProducts[0]);
                          setSearchTerm("");
                        } else if (searchTerm.length >= 2) {
                          // Handle manual entry with * multiplier (e.g. 10*750123)
                          let code = searchTerm;
                          let qty = 1;

                          if (searchTerm.includes('*')) {
                            const parts = searchTerm.split('*');
                            qty = parseFloat(parts[0]) || 1;
                            code = parts[1] || "";
                          }

                          if (code) {
                             handleBarcodeScan(code, qty);
                          }
                        }
                      }
                    }}
                    className="pl-12 h-12 sm:h-14 text-base sm:text-lg bg-black/40 border-white/10 rounded-xl"
                  />
                  <KBD>F3</KBD>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsScannerOpen(true)}
                  title="Escanear (F6)"
                  className="h-12 w-12 sm:h-14 sm:w-14 p-0 shrink-0 flex items-center justify-center bg-[#1a1a24] border-white/10 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-400 rounded-xl transition"
                >
                  <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
                </Button>
              </div>

              {/* Catálogo / Grid de Productos */}
              <div className="flex-1 overflow-y-auto w-full max-w-6xl mx-auto hide-scrollbar pb-20">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {filteredProducts.map(product => {
                    const isInCart = items.find(i => i.product_id === product._id);
                    return (
                      <div
                        key={product._id}
                        className={`relative rounded-2xl border transition-all duration-200 overflow-hidden group
                          ${product.stock > 0 
                            ? 'bg-[#1a1a24] border-white/5 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 cursor-pointer active:scale-95' 
                            : 'bg-red-500/5 border-red-500/10 opacity-60 cursor-not-allowed'}`}
                        onClick={() => product.stock > 0 && handleAddItem(product)}
                      >
                        <div className="p-3 sm:p-4 flex flex-col h-[110px] sm:h-[130px]">
                           <div className="flex justify-between items-start mb-1 sm:mb-2">
                             <div className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-wider">STOCK: {product.stock}</div>
                             {isInCart && (
                               <div className="bg-orange-500 text-black text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                  {isInCart.quantity}
                               </div>
                             )}
                           </div>
                           <h4 className="text-white font-medium text-xs sm:text-sm leading-tight mb-2 flex-1 line-clamp-2">
                             {product.name} {product.unit_type && product.unit_type !== "unidad" ? `(${product.unit_type})` : ""}
                           </h4>
                           <div className="flex justify-between items-end mt-auto">
                             <div className="text-[10px] sm:text-xs text-blue-400 font-medium">Bs {toBs(product.price).toFixed(2)}</div>
                             <div className="text-orange-500 font-bold text-base sm:text-lg leading-none">${Number(product.price).toFixed(2)}</div>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CARRITO COMO DETALLE DESPLEGABLE (TOP SHEET MODAL) */}
            <AnimatePresence>
              {isCartDrawerOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsCartDrawerOpen(false)}
                  />
                  <motion.div 
                    initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute top-0 left-0 right-0 z-40 bg-[#1a1a24] border-b border-orange-500/30 shadow-2xl shadow-orange-500/10 rounded-b-3xl flex flex-col max-h-[90vh]"
                  >
                    {/* Header del Carrito */}
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                      <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <ShoppingCart className="text-orange-500" /> Detalle de Compra
                      </h3>
                      <button onClick={(e) => { e.stopPropagation(); setIsCartDrawerOpen(false); }} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition">
                        <X size={20} />
                      </button>
                    </div>

                    {/* Lista de Items del Carrito */}
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-[30vh]">
                      {items.length === 0 ? (
                        <div className="py-10 flex flex-col items-center justify-center text-gray-500">
                          <ShoppingCart size={48} className="mb-4 opacity-30" />
                          <p className="text-lg text-center">No has agregado productos</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {items.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-black/30 p-3 sm:p-4 rounded-xl border border-white/5 group">
                              <div className="flex-1 mb-3 sm:mb-0">
                                <h5 className="text-white font-medium text-sm sm:text-base line-clamp-1">{item.name} {item.unit_type && item.unit_type !== "unidad" ? `(${item.unit_type})` : ""}</h5>
                                <div className="flex gap-4 items-center mt-1">
                                  <span className="text-orange-500 font-bold">${item.unit_price.toFixed(2)}</span>
                                  <span className="text-blue-400 text-xs sm:text-sm font-medium">Bs {toBs(item.unit_price).toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                <div className="flex items-center gap-2 bg-[#1a1a24] rounded-xl border border-white/10 p-1">
                                  <InputText
                                    ref={(el) => { if (el) qtyInputRefs.current[index] = el; else delete qtyInputRefs.current[index]; }}
                                    type="number" min="0.01" step="0.01" max={item.maxStock}
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                    className="w-16 sm:w-20 text-center text-base sm:text-lg font-bold bg-transparent border-none h-10 p-0 focus:ring-0"
                                  />
                                </div>
                                <div className="text-right w-20 sm:w-24 ml-auto">
                                   <div className="text-amber-500 font-bold text-base sm:text-lg">${((parseFloat(item.quantity) || 0) * item.unit_price).toFixed(2)}</div>
                                </div>
                                <Button variant="ghost" type="button" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:bg-red-500/20 hover:text-red-300 p-2 sm:p-3 rounded-xl ml-2">
                                  <Trash2 size={20} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer y Cobro */}
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 bg-black/40 border-t border-white/5 rounded-b-3xl shrink-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-end">
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-gray-300 mb-2">Método de Pago <KBD>F5</KBD></Label>
                          <select
                            ref={paymentSelectRef}
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitBtnRef.current?.focus(); } }}
                            className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm sm:text-base font-medium appearance-none"
                            required
                          >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Efectivo Bs">Efectivo Bolívares</option>
                            <option value="Tarjeta">Tarjeta (Crédito/Débito)</option>
                            <option value="Transferencia">Transferencia Bancaria</option>
                            <option value="Pago Movil">Pago Móvil</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2 sm:gap-3">
                           <div className="flex justify-between items-center text-lg sm:text-xl font-bold text-gray-300">
                             <span className="text-sm sm:text-base">Total Bs</span>
                             <span className="text-blue-400">Bs {toBs(currentTotal).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between items-center text-xl sm:text-2xl font-bold text-white bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                             <span className="text-base sm:text-lg text-orange-400">Total a Pagar</span>
                             <span className="text-orange-500">${currentTotal.toFixed(2)}</span>
                           </div>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-6">
                        <Button 
                          ref={submitBtnRef} variant="primary" type="submit" 
                          disabled={isLoading || items.length === 0} 
                          className="w-full py-4 text-base sm:text-lg rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition"
                        >
                          {isLoading ? "Procesando..." : <><Check size={24} className="mr-2" /> Procesar Pago <KBD>F4</KBD></>}
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

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
        continuous={isFormOpen}
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
