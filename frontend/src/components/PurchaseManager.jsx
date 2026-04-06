import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Check, 
  Wallet,
  Calendar as CalendarIcon, 
  PackageOpen, 
  Trash2, 
  ArrowLeft, 
  Camera, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingDown,
  Building2,
  Receipt
} from "lucide-react";
import { usePurchaseStore } from "../store/purchaseStore";
import { useProductStore }  from "../store/productStore";
import { useAuthStore }     from "../store/authStore";
import toast from "react-hot-toast";

import Button        from "./atoms/Button";
import Modal         from "./molecules/Modal";
import SectionHeader from "./molecules/SectionHeader";
import BarcodeScanner from "./BarcodeScanner";

/* ─── Constantes ─────────────────────────────────────────── */
const ITEMS_PER_PAGE    = 10;
const EMPTY_ITEM        = { product_id: "", quantity: 1, unit_cost: 0, unit_type: "unidad" };
const EMPTY_ITEMS_LIST  = [{ ...EMPTY_ITEM }];

/* ─── Helpers ────────────────────────────────────────────── */
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : 'N/A';
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : '';
const fmtCost = (val)  => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const subtotal = (item) => ((parseFloat(item.quantity) || 0) * Number(item.unit_cost));

const getStatusInfo = (purchase) => {
  const total = Number(purchase.total_cost || 0);
  const paid = Number(purchase.paid_amount || 0);
  const now = new Date();
  const due = purchase.dueDate ? new Date(purchase.dueDate) : null;
  
  if (paid >= total && total > 0) {
    return { id: 'pagado', label: 'Pagado', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 };
  }
  
  if (due && due < now) {
    return { id: 'vencida', label: 'Vencida', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: AlertCircle };
  }
  
  if (paid > 0 && paid < total) {
    return { id: 'parcial', label: 'Parcial', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: TrendingDown };
  }
  
  return { id: 'pendiente', label: 'Pendiente', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Clock };
};

/* ─── Estilos del input de artículo ─────────────────────── */
const inputClasses = 
  "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all backdrop-blur-md";

/* ─── Componentes ────────────────────────────────────────── */

const StatusBadge = ({ purchase }) => {
  const status = getStatusInfo(purchase);
  const Icon = status.icon;
  return (
    <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium border ${status.bg} ${status.color} ${status.border} backdrop-blur-sm`}>
      <Icon size={12} />
      {status.label}
    </div>
  );
};

const PurchaseCard = ({ purchase, onClick }) => {
  const status = getStatusInfo(purchase);
  const totalItems = purchase.items?.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0) || 0;
  
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={() => onClick(purchase._id)}
      className="group cursor-pointer bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 rounded-2xl p-5 transition-all duration-300 backdrop-blur-lg shadow-lg hover:shadow-indigo-500/10"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 size={18} className="text-indigo-400" />
            {purchase.supplier}
          </h3>
          <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5">
            <Receipt size={14} /> ID: {purchase._id.slice(-6).toUpperCase()}
          </p>
        </div>
        <StatusBadge purchase={purchase} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CalendarIcon size={12}/> Fecha</p>
          <p className="text-sm font-medium text-gray-200">{fmtDate(purchase.createdAt || purchase.date)}</p>
        </div>
        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><PackageOpen size={12}/> Artículos</p>
          <p className="text-sm font-medium text-gray-200">{totalItems} unds.</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <div>
          <p className="text-xs text-gray-500">Deuda Total</p>
          <p className="text-lg font-bold text-white">{fmtCost(purchase.total_cost)}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
          <ChevronRight size={18} className="text-gray-400 group-hover:text-indigo-400" />
        </div>
      </div>
    </motion.article>
  );
};

/* ─── Subcomponente: fila de artículo en el formulario ───── */
const PurchaseItemRow = ({ item, index, products, onChange, onRemove, showRemove }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="flex flex-col lg:flex-row gap-3 items-end bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors relative group"
  >
    {/* Producto */}
    <div className="flex-1 w-full lg:w-auto">
      <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Producto</label>
      <select
        value={item.product_id}
        onChange={(e) => onChange(index, "product_id", e.target.value)}
        required
        className={inputClasses}
      >
        <option value="" disabled>Selecciona un producto...</option>
        {products.map((p) => (
          <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock})</option>
        ))}
      </select>
    </div>

    <div className="flex w-full lg:w-auto gap-3">
      {/* Cantidad */}
      <div className="flex-1 lg:w-28">
        <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Cant.</label>
        <input
          type="number" min="0.01" step="0.01" required
          value={item.quantity}
          onChange={(e) => onChange(index, "quantity", e.target.value)}
          className={inputClasses}
          placeholder="0.00"
        />
      </div>

      {/* Costo unitario */}
      <div className="flex-1 lg:w-32">
        <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Costo Unit.</label>
        <input
          type="number" min="0" step="0.01" required
          value={item.unit_cost}
          onChange={(e) => onChange(index, "unit_cost", e.target.value)}
          className={inputClasses}
          placeholder="$0.00"
        />
      </div>

      {/* Subtotal */}
      <div className="flex-1 lg:w-32">
        <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Subtotal</label>
        <div className="flex items-center h-[42px] px-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 font-medium whitespace-nowrap">
          {fmtCost(subtotal(item))}
        </div>
      </div>
    </div>

    {showRemove && (
      <Button
        variant="icon" type="button"
        onClick={() => onRemove(index)}
        className="text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 absolute -top-2 -right-2 right bg-black lg:relative lg:top-0 lg:right-0 lg:mb-1 h-10 w-10 flex items-center justify-center rounded-full transition-colors"
      >
        <Trash2 size={18} />
      </Button>
    )}
  </motion.div>
);

/* ─── Subcomponente: detalle de una compra y abonos ─────── */
const PurchaseDetailView = ({ purchase, onBack, onPay }) => {
  const [payAmount, setPayAmount] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  
  const status = getStatusInfo(purchase);
  const total = Number(purchase.total_cost || 0);
  const paid = Number(purchase.paid_amount || 0);
  const pending = Math.max(0, total - paid);
  const isPaid = status.id === 'pagado';

  const handlePay = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return toast.error("Ingresa un monto válido");
    if (Number(payAmount) > pending) return toast.error(`El monto no puede superar la deuda pendiente (${fmtCost(pending)})`);
    
    setIsPaying(true);
    try {
      await onPay(purchase._id, { amount: Number(payAmount) });
      setPayAmount("");
      toast.success("Abono registrado correctamente");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8 overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
    >
      <header className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-br from-indigo-500/5 to-transparent flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-white mb-4 -ml-2">
            <ArrowLeft size={18} className="mr-2" />
            <span>Volver al historial</span>
          </Button>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{purchase.supplier}</h2>
            <StatusBadge purchase={purchase} />
          </div>
          <p className="text-sm text-gray-400 mt-2 flex items-center gap-2">
            <CalendarIcon size={14} /> Creado el {fmtDate(purchase.createdAt)} 
            {purchase.dueDate && <> <span className="mx-1">•</span> <Clock size={14}/> Vence el {fmtDate(purchase.dueDate)}</>}
          </p>
        </div>

        {/* Resumen Financiero */}
        <div className="flex gap-4 p-4 bg-black/30 rounded-2xl border border-white/5 w-full md:w-auto">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Abonado</p>
            <p className="text-xl font-bold text-emerald-400">{fmtCost(paid)}</p>
          </div>
          <div className="w-px bg-white/10 mx-2"></div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Pendiente</p>
            <p className="text-xl font-bold text-rose-400">{fmtCost(pending)}</p>
          </div>
        </div>
      </header>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Items */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PackageOpen size={18} className="text-indigo-400"/>
            Artículos Comprados
          </h3>
          <div className="rounded-2xl border border-white/5 overflow-hidden bg-white/5 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Producto</th>
                    <th className="px-6 py-4 font-semibold">Cantidad</th>
                    <th className="px-6 py-4 font-semibold">Costo Unit.</th>
                    <th className="px-6 py-4 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {purchase.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-medium text-white group-hover:text-indigo-300 transition-colors">{item.product_id?.name || "Desconocido"}</span>
                        <div className="text-xs text-gray-500 mt-1 font-mono">{item.product_id?._id || item.product_id}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                         <span className="bg-white/10 px-2 py-1 rounded-md text-sm font-medium">{item.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{fmtCost(item.unit_cost)}</td>
                      <td className="px-6 py-4 text-right font-medium text-indigo-300">
                        {fmtCost(parseFloat(item.quantity) * Number(item.unit_cost))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-black/40 border-t border-white/5 flex justify-end items-center gap-4">
              <span className="text-gray-400 text-sm">Costo Total Compra</span>
              <span className="text-2xl font-bold text-white">{fmtCost(total)}</span>
            </div>
          </div>
        </div>

        {/* Módulo de Pagos */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet size={18} className="text-indigo-400"/>
            Gestión de Pagos
          </h3>
          
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
            {/* Background decoration */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${isPaid ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>

            {isPaid ? (
              <div className="flex flex-col items-center justify-center p-6 text-center z-10 relative">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">Compra Saldada</h4>
                <p className="text-sm text-gray-400">Esta compra ha sido pagada en su totalidad.</p>
              </div>
            ) : (
              <form onSubmit={handlePay} className="relative z-10">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ingresar Abono
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="number" min="0.01" step="0.01" max={pending} required
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition shadow-inner"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">Máx: {fmtCost(pending)}</span>
                    <button type="button" onClick={() => setPayAmount(pending)} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Saldar todo</button>
                  </div>
                </div>
                
                <Button variant="primary" type="submit" isLoading={isPaying} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                  Registrar Pago
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
};

/* ─── Componente principal ───────────────────────────────── */
const PurchaseManager = () => {
  const { purchases, isLoading, error, fetchPurchases, createPurchase, fetchPurchaseById, payPurchase } = usePurchaseStore();
  const { products, fetchProducts, fetchProductByBarcode } = useProductStore();
  const { user } = useAuthStore();

  const [isFormOpen,    setIsFormOpen]    = useState(false);
  const [viewedPurchase, setViewedPurchase] = useState(null);
  const [isScannerOpen,  setIsScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [supplier, setSupplier] = useState("");
  const [dueDate,  setDueDate]  = useState("");
  const [items,    setItems]    = useState(EMPTY_ITEMS_LIST);

  useEffect(() => { fetchPurchases(); fetchProducts(); }, [fetchPurchases, fetchProducts]);

  /* ── Filtros y Búsqueda ── */
  const filteredPurchases = useMemo(() => {
    let result = purchases;
    
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.supplier?.toLowerCase().includes(q) || 
        p._id?.toLowerCase().includes(q)
      );
    }

    // Tabs
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    result = result.filter(p => {
      const state = getStatusInfo(p);
      const isDueSoon = p.dueDate && new Date(p.dueDate) <= nextWeek && new Date(p.dueDate) >= now && state.id !== 'pagado';
      
      switch(activeTab) {
        case "Pendientes": return state.id === 'pendiente' || state.id === 'parcial';
        case "Vencidas": return state.id === 'vencida';
        case "Por Vencer": return isDueSoon;
        default: return true; // "Todas"
      }
    });

    return result;
  }, [purchases, activeTab, searchQuery]);

  /* ── Escáner físico de código de barras ── */
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();
    const handleKeyDown = (e) => {
      if (!isFormOpen) return;
      const tag = e.target.tagName.toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;
      const now = Date.now();
      if (now - lastKeyTime > 50) buffer = "";
      if (e.key === "Enter") {
        if (buffer.length >= 5) { handleBarcodeScan(buffer); buffer = ""; e.preventDefault(); }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
      lastKeyTime = now;
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFormOpen]);

  /* ── Handlers ── */
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "product_id") {
        const prod = products.find((p) => p._id === value);
        if (prod) next[index].unit_type = prod.unit_type || "unidad";
      }
      return next;
    });
  };

  const handleBarcodeScan = async (code) => {
    try {
      const { product } = await fetchProductByBarcode(code);
      if (product) {
        const emptyIdx = items.findIndex((i) => !i.product_id);
        if (emptyIdx !== -1) {
          handleItemChange(emptyIdx, "product_id", product._id);
        } else {
          setItems((prev) => [...prev, { product_id: product._id, quantity: 1, unit_cost: product.price, unit_type: product.unit_type || "unidad" }]);
        }
        toast.success(`Añadido: ${product.name}`);
      }
    } catch {
      toast.error(`Código "${code}" no encontrado`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplier.trim()) return toast.error("El nombre del proveedor es requerido");
    if (items.length === 0) return toast.error("Agrega al menos un artículo");
    for (const item of items) {
      if (!item.product_id)                               return toast.error("Selecciona un producto en todos los campos");
      if (parseFloat(item.quantity) <= 0)                 return toast.error("La cantidad debe ser mayor a 0");
      if (Number(item.unit_cost) < 0)                     return toast.error("El costo no puede ser negativo");
    }
    try {
      await createPurchase({
        admin_id: user?._id || user?.id,
        supplier,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        items: items.map(({ product_id, quantity, unit_cost }) => ({
          product_id,
          quantity:  parseFloat(quantity) || 0,
          unit_cost: Number(unit_cost),
        })),
      });
      toast.success("Compra/Entrada registrada con éxito");
      closeForm();
    } catch {
      toast.error(error || "Ocurrió un error al registrar la compra");
    }
  };

  const closeForm = () => { setIsFormOpen(false); setSupplier(""); setDueDate(""); setItems(EMPTY_ITEMS_LIST); };

  const handleViewDetail = async (id) => {
    try {
      const detail = await fetchPurchaseById(id);
      setViewedPurchase(detail); 
    } catch { 
      toast.error("No se pudo cargar el detalle de la compra"); 
    }
  };
  
  const handlePayPurchase = async (id, paymentData) => {
    const updatedPurchase = await payPurchase(id, paymentData);
    if (viewedPurchase && viewedPurchase._id === id) {
      setViewedPurchase(updatedPurchase);
    }
  };

  const currentTotal = items.reduce((acc, item) => acc + subtotal(item), 0);
  const TABS = ["Todas", "Pendientes", "Por Vencer", "Vencidas"];

  /* ── Render ── */
  return (
    <section aria-labelledby="purchases-heading" className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Header Interactivo */}
      {!viewedPurchase && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 id="purchases-heading" className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Compras</span>
            </h1>
            <p className="text-gray-400 mt-2 font-medium">Controla inventario, cuentas por pagar y proveedores.</p>
          </div>
          
          <Button onClick={() => setIsFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border-0 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
            <Plus size={20} /> Nueva Compra
          </Button>
        </motion.div>
      )}

      {error && !isFormOpen && !viewedPurchase && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert" className="p-4 mb-8 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </motion.p>
      )}

      {/* Vista detalle de compra */}
      <AnimatePresence mode="wait">
        {viewedPurchase && !isFormOpen && (
          <PurchaseDetailView key="detail" purchase={viewedPurchase} onBack={() => setViewedPurchase(null)} onPay={handlePayPurchase} />
        )}

        {/* Dashboard Analytics & Historial */}
        {!viewedPurchase && !isFormOpen && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Controles de Vista */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-8 bg-black/20 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
              {/* Tabs */}
              <div className="flex w-full lg:w-auto overflow-x-auto hide-scrollbar gap-1 p-1 bg-black/40 rounded-xl">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Búsqueda */}
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar proveedor o ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            {/* Grid de Compras */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-5 h-48"></div>
                ))}
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="text-center py-20 bg-black/20 rounded-3xl border border-white/5 border-dashed">
                <PackageOpen size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No se encontraron compras</h3>
                <p className="text-gray-500">Intenta cambiar los filtros o registra una nueva entrada.</p>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredPurchases.map((purchase) => (
                    <PurchaseCard key={purchase._id} purchase={purchase} onClick={handleViewDetail} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario Modal Creador de Compras */}
      <Modal isOpen={isFormOpen} onClose={closeForm} title="Registrar Ingreso de Mercancía" className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-20">
            {/* Proveedor */}
            <div className="space-y-2">
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-300 ml-1">
                Proveedor / Empresa responsable <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="supplier" type="text" required value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Ej. Distribuidora Mayorista S.A."
                  className={`${inputClasses} pl-11`}
                />
              </div>
            </div>

            {/* Fecha Vencimiento */}
            <div className="space-y-2">
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 ml-1">
                Vence El (Opcional)
              </label>
              <div className="relative">
                <CalendarIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="dueDate" type="date" value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`${inputClasses} pl-11 [color-scheme:dark]`}
                />
              </div>
            </div>
          </div>

          {/* Artículos */}
          <fieldset className="border border-white/10 bg-black/30 rounded-2xl p-6 shadow-inner relative z-10 hidden-scroll overflow-visible">
            <legend className="sr-only">Artículos del ingreso</legend>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h4 className="text-xl font-bold text-white flex items-center gap-2">
                <PackageOpen className="text-indigo-400"/> Lista de Ítems
              </h4>
              <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsScannerOpen(true)} className="bg-white/5 hover:bg-white/10 text-indigo-300 flex-1 sm:flex-none justify-center">
                  <Camera size={16} className="mr-2"/> Escanear Código
                </Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => setItems((p) => [...p, { ...EMPTY_ITEM }])} className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 flex-1 sm:flex-none justify-center border border-indigo-500/30">
                  <Plus size={16} className="mr-2"/> Añadir Fila
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {items.map((item, index) => (
                  <PurchaseItemRow
                    key={index} item={item} index={index} products={products}
                    onChange={handleItemChange} onRemove={(i) => setItems((p) => p.filter((_, idx) => idx !== i))}
                    showRemove={items.length > 1}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Total estimado */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-end">
              <span className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Costo Total Estimado</span>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                {fmtCost(currentTotal)}
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
            <Button variant="secondary" type="button" onClick={closeForm} className="px-6 rounded-xl hover:bg-white/5 border-transparent">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading} className="px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 border-0 flex items-center gap-2">
              <Check size={18} /> Confirmar Ingreso
            </Button>
          </div>
        </form>
      </Modal>

      <BarcodeScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={(code) => { handleBarcodeScan(code); setIsScannerOpen(false); }} />
    </section>
  );
};

export default PurchaseManager;
