import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Check, ShoppingCart, Trash2, Search, ArrowLeft,
  RefreshCw, Calendar, Camera, HelpCircle, Keyboard, X,
} from "lucide-react";
import { useSaleStore }     from "../store/saleStore";
import { useProductStore }  from "../store/productStore";
import { useAuthStore }     from "../store/authStore";
import { useCurrencyStore } from "../store/currencyStore";
import toast from "react-hot-toast";

import Button       from "./atoms/Button";
import Badge        from "./atoms/Badge";
import InputText    from "./atoms/InputText";
import DataTable    from "./organisms/DataTable";
import BarcodeScanner from "./BarcodeScanner";

/* ─── Constantes ─────────────────────────────────────────── */
const PAYMENT_METHODS = ["Efectivo", "Efectivo Bs", "Tarjeta", "Transferencia", "Pago Movil"];

const DATE_FILTER_OPTIONS = [
  { value: "all",    label: "Todas"     },
  { value: "today",  label: "Hoy"       },
  { value: "7days",  label: "7 días"    },
  { value: "30days", label: "30 días"   },
  { value: "month",  label: "Este mes"  },
];

/* ─── Helpers ────────────────────────────────────────────── */
const fmtUSD = (v) => `$${Number(v || 0).toFixed(2)}`;
const fmtBs  = (v, toBs) => `Bs ${toBs(Number(v || 0)).toFixed(2)}`;
const itemSubtotal = (item) => (parseFloat(item.quantity) || 0) * item.unit_price;

const filterSalesByDate = (sales, filter) => {
  if (filter === "all") return sales;
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return sales.filter((s) => {
    const d   = new Date(s.createdAt);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (filter === "today")  return day.getTime() === today.getTime();
    if (filter === "7days")  { const l = new Date(today); l.setDate(today.getDate() - 7);  return day >= l; }
    if (filter === "30days") { const l = new Date(today); l.setDate(today.getDate() - 30); return day >= l; }
    if (filter === "month")  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });
};

/* ─── Átomo: indicador de tecla ──────────────────────────── */
const KBD = ({ children }) => (
  <kbd className="ml-1.5 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-gray-400 bg-black/40 border border-white/10 rounded-md leading-none">
    {children}
  </kbd>
);

/* ════════════════════════════════════════════════════════════
   SUBCOMPONENTE 1 — Barra de tasa cambiaria
════════════════════════════════════════════════════════════ */
const ExchangeRateBar = ({ exchangeRate, onRateChange }) => {
  const [editing, setEditing] = useState(false);
  const [temp,    setTemp]    = useState(exchangeRate);

  const save = () => {
    onRateChange(temp);
    setEditing(false);
    toast.success(`Tasa actualizada: 1 USD = ${temp} Bs`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
      <RefreshCw size={18} className="text-blue-400 shrink-0" aria-hidden="true" />
      <span className="text-sm text-gray-300 whitespace-nowrap">Tasa del Día:</span>

      {editing ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">1 USD =</span>
          <InputText type="number" step="0.01" min="0.01" value={temp}
            onChange={(e) => setTemp(e.target.value)}
            className="w-28 px-3 py-1 text-sm" autoFocus />
          <span className="text-sm text-gray-400">Bs</span>
          <Button variant="primary" size="sm" onClick={save}>Guardar</Button>
          <Button variant="ghost"   size="sm" onClick={() => { setEditing(false); setTemp(exchangeRate); }}>Cancelar</Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-400">1 USD = {exchangeRate} Bs</span>
          <Button variant="ghost" size="sm" onClick={() => { setEditing(true); setTemp(exchangeRate); }} className="text-gray-300">
            Editar
          </Button>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   SUBCOMPONENTE 2 — Tarjeta de producto del catálogo
════════════════════════════════════════════════════════════ */
const ProductCard = ({ product, cartQty, onAdd, toBs }) => (
  <div
    onClick={() => product.stock > 0 && onAdd(product)}
    role="button"
    tabIndex={product.stock > 0 ? 0 : -1}
    aria-label={`Agregar ${product.name} al carrito`}
    aria-disabled={product.stock <= 0}
    onKeyDown={(e) => e.key === "Enter" && product.stock > 0 && onAdd(product)}
    className={`relative rounded-2xl border transition-all duration-200 overflow-hidden group
      ${product.stock > 0
        ? "bg-[#1a1a24] border-white/5 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 cursor-pointer active:scale-95"
        : "bg-red-500/5 border-red-500/10 opacity-60 cursor-not-allowed"}`}
  >
    <div className="p-3 sm:p-4 flex flex-col h-[110px] sm:h-[130px]">
      <div className="flex justify-between items-start mb-1 sm:mb-2">
        <span className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-wider">STOCK: {product.stock}</span>
        {cartQty > 0 && (
          <span className="bg-orange-500 text-black text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
            {cartQty}
          </span>
        )}
      </div>
      <h4 className="text-white font-medium text-xs sm:text-sm leading-tight mb-2 flex-1 line-clamp-2">
        {product.name}{product.unit_type && product.unit_type !== "unidad" ? ` (${product.unit_type})` : ""}
      </h4>
      <div className="flex justify-between items-end mt-auto">
        <span className="text-[10px] sm:text-xs text-blue-400 font-medium">{fmtBs(product.price, toBs)}</span>
        <span className="text-orange-500 font-bold text-base sm:text-lg leading-none">{fmtUSD(product.price)}</span>
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   SUBCOMPONENTE 3 — Carrito drawer (top sheet)
════════════════════════════════════════════════════════════ */
const CartDrawer = ({ isOpen, onClose, items, onQtyChange, onRemove, onSubmit, paymentMethod, onPaymentChange, isLoading, currentTotal, toBs, submitBtnRef, paymentSelectRef }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          key="cart-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          key="cart-sheet"
          initial={{ y: "-100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute top-0 left-0 right-0 z-40 bg-[#1a1a24] border-b border-orange-500/30 shadow-2xl shadow-orange-500/10 rounded-b-3xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <ShoppingCart className="text-orange-500" aria-hidden="true" /> Detalle de Compra
            </h3>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              aria-label="Cerrar carrito"
              className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-[30vh]">
            {items.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-gray-500">
                <ShoppingCart size={48} className="mb-4 opacity-30" aria-hidden="true" />
                <p className="text-lg text-center">No has agregado productos</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item, index) => (
                  <li key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-black/30 p-3 sm:p-4 rounded-xl border border-white/5">
                    <div className="flex-1 mb-3 sm:mb-0">
                      <h5 className="text-white font-medium text-sm sm:text-base line-clamp-1">
                        {item.name}{item.unit_type && item.unit_type !== "unidad" ? ` (${item.unit_type})` : ""}
                      </h5>
                      <div className="flex gap-4 items-center mt-1">
                        <span className="text-orange-500 font-bold">{fmtUSD(item.unit_price)}</span>
                        <span className="text-blue-400 text-xs sm:text-sm font-medium">{fmtBs(item.unit_price, toBs)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-2 bg-[#1a1a24] rounded-xl border border-white/10 p-1">
                        <InputText
                          type="number" min="0.01" step="0.01" max={item.maxStock}
                          value={item.quantity}
                          onChange={(e) => onQtyChange(index, e.target.value)}
                          aria-label={`Cantidad de ${item.name}`}
                          className="w-16 sm:w-20 text-center text-base sm:text-lg font-bold bg-transparent border-none h-10 p-0 focus:ring-0"
                        />
                      </div>
                      <div className="text-right w-20 sm:w-24 ml-auto">
                        <span className="text-amber-500 font-bold text-base sm:text-lg">
                          {fmtUSD(itemSubtotal(item))}
                        </span>
                      </div>
                      <Button variant="ghost" type="button" onClick={() => onRemove(index)}
                        aria-label={`Quitar ${item.name}`}
                        className="text-red-400 hover:bg-red-500/20 hover:text-red-300 !p-2 sm:!p-3 rounded-xl ml-2">
                        <Trash2 size={20} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer / Cobro */}
          <form onSubmit={onSubmit} className="p-4 sm:p-6 bg-black/40 border-t border-white/5 rounded-b-3xl shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-end">
              <div>
                <label htmlFor="payment-method" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Método de Pago <KBD>F5</KBD>
                </label>
                <select
                  id="payment-method"
                  ref={paymentSelectRef}
                  value={paymentMethod}
                  onChange={(e) => onPaymentChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitBtnRef.current?.focus(); } }}
                  required
                  className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm sm:text-base font-medium appearance-none"
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
                  <span className="text-blue-400">{fmtBs(currentTotal, toBs)}</span>
                </div>
                <div className="flex justify-between items-center text-xl sm:text-2xl font-bold text-white bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                  <span className="text-base sm:text-lg text-orange-400">Total a Pagar</span>
                  <span className="text-orange-500">{fmtUSD(currentTotal)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6">
              <Button
                ref={submitBtnRef} variant="primary" type="submit"
                disabled={isLoading || items.length === 0}
                className="w-full py-4 text-base sm:text-lg rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                {isLoading ? "Procesando..." : <><Check size={24} className="mr-2" /> Procesar Pago <KBD>F9</KBD></>}
              </Button>
            </div>
          </form>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

/* ════════════════════════════════════════════════════════════
   SUBCOMPONENTE 4 — POS fullscreen (catálogo + buscador)
════════════════════════════════════════════════════════════ */
const SalePOSForm = ({
  items, onCancel, onAddItem, onRemoveItem, onQtyChange, onSubmit,
  paymentMethod, onPaymentChange, isLoading, currentTotal, toBs,
  filteredProducts, searchTerm, onSearch, onOpenScanner,
  cartPulse, submitBtnRef, paymentSelectRef, searchInputRef,
  isCartOpen, setIsCartOpen
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-[#0f0f13] flex flex-col font-sans overflow-hidden"
    >
      {/* Top bar */}
      <div
        className="bg-[#1a1a24] border-b border-orange-500/20 p-3 sm:p-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex justify-between items-center cursor-pointer hover:bg-[#22222f] transition z-20"
        onClick={() => setIsCartOpen(true)}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onCancel(); }} className="!p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition">
            <ArrowLeft size={24} />
          </Button>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm text-gray-400 font-medium">Total de Venta</span>
            <motion.div
              animate={cartPulse ? { scale: [1, 1.1, 1], color: ["#f59e0b", "#fbbf24", "#f59e0b"] } : {}}
              transition={{ duration: 0.3 }}
              className="text-xl sm:text-3xl font-bold text-amber-500 tracking-tight leading-none"
            >
              {fmtUSD(currentTotal)}
            </motion.div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="text-right flex flex-col items-end">
            <span className="text-xs sm:text-sm text-gray-400 font-medium hidden sm:block">Artículos</span>
            <div className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-sm sm:text-lg font-bold flex items-center gap-2">
              <ShoppingCart size={16} aria-hidden="true" />
              {items.length}
            </div>
          </div>
          <Button
            variant="primary"
            className="rounded-full px-5 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold shadow-[0_0_15px_rgba(249,115,22,0.4)]"
            onClick={(e) => { e.stopPropagation(); setIsCartOpen(true); }}
          >
            <span className="hidden sm:inline">Pagar <KBD>F4</KBD></span>
            <span className="sm:hidden">Pagar</span>
          </Button>
        </div>
      </div>

      {/* Buscador + catálogo */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#1a1a24]/50 to-[#0f0f13] p-3 sm:p-6">
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 max-w-4xl mx-auto w-full">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
            <InputText
              ref={searchInputRef}
              type="text"
              placeholder="Buscar producto... (F3)"
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (filteredProducts.length > 0 && !searchTerm.includes("*")) {
                  onAddItem(filteredProducts[0]);
                  onSearch("");
                } else if (searchTerm.length >= 2) {
                  let code = searchTerm, qty = 1;
                  if (searchTerm.includes("*")) {
                    const [q, c] = searchTerm.split("*");
                    qty = parseFloat(q) || 1;
                    code = c || "";
                  }
                  if (code) {
                    // barcode scan via search handled by parent
                    onSearch(code);
                  }
                }
              }}
              className="pl-12 h-12 sm:h-14 text-base sm:text-lg bg-black/40 border-white/10 rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            onClick={onOpenScanner}
            aria-label="Abrir escáner de cámara (F6)"
            className="h-12 w-12 sm:h-14 sm:w-14 !p-0 shrink-0 flex items-center justify-center bg-[#1a1a24] border-white/10 hover:bg-orange-500/20 hover:border-orange-500/40 rounded-xl transition shadow-lg group"
          >
            <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          </Button>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto w-full max-w-6xl mx-auto pb-20">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const cartItem = items.find((i) => i.product_id === product._id);
              return (
                <ProductCard
                  key={product._id}
                  product={product}
                  cartQty={cartItem?.quantity ?? 0}
                  onAdd={onAddItem}
                  toBs={toBs}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onQtyChange={onQtyChange}
        onRemove={onRemoveItem}
        onSubmit={onSubmit}
        paymentMethod={paymentMethod}
        onPaymentChange={onPaymentChange}
        isLoading={isLoading}
        currentTotal={currentTotal}
        toBs={toBs}
        submitBtnRef={submitBtnRef}
        paymentSelectRef={paymentSelectRef}
      />
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════════
   SUBCOMPONENTE 5 — Vista detalle de una venta
════════════════════════════════════════════════════════════ */
const SaleDetailView = ({ sale, onBack, toBs }) => (
  <motion.article
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="mb-8 p-6 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-xl"
  >
    <header className="flex items-center justify-between mb-6">
      <Button variant="ghost" onClick={onBack} className="text-orange-500 hover:text-orange-400">
        <ArrowLeft size={20} /> <span>Volver a Ventas</span>
      </Button>
      <p className="text-sm text-gray-400">ID Venta: {sale._id}</p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[
        { label: "Método de Pago", value: sale.payment_method,                              cls: "" },
        { label: "Fecha",          value: new Date(sale.createdAt).toLocaleString(),        cls: "" },
        { label: "Total USD",      value: fmtUSD(sale.total_amount),                       cls: "text-amber-500 text-2xl font-bold bg-amber-500/10 border-amber-500/20" },
        { label: "Total Bs",       value: fmtBs(sale.total_amount, toBs),                  cls: "text-blue-400 text-2xl font-bold bg-blue-500/10 border-blue-500/20" },
      ].map(({ label, value, cls }) => (
        <div key={label} className={`p-4 rounded-xl border border-white/5 bg-black/20 ${cls}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-lg font-medium text-white ${cls}`}>{value}</p>
        </div>
      ))}
    </div>

    <h3 className="text-lg font-medium text-white mb-4">Artículos Vendidos</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-black/30 text-gray-400 text-sm uppercase tracking-wider">
            {["Producto", "Cantidad", "Precio USD", "Precio Bs", "Subtotal"].map((h) => (
              <th key={h} scope="col" className="px-6 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sale.items?.map((item, idx) => {
            const unit = item.product_id?.unit_type;
            const unitLabel = unit && unit !== "unidad" ? unit : item.quantity === 1 ? "unidad" : "unidades";
            const sub = parseFloat(item.quantity) * Number(item.unit_price);
            return (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-3 text-orange-400 font-medium">{item.product_id?.name || "Desconocido"}</td>
                <td className="px-6 py-3 text-gray-300">{item.quantity} {unitLabel}</td>
                <td className="px-6 py-3 text-gray-300">{fmtUSD(item.unit_price)}</td>
                <td className="px-6 py-3 text-blue-400">{fmtBs(item.unit_price, toBs)}</td>
                <td className="px-6 py-3">
                  <div className="text-amber-500 font-medium">{fmtUSD(sub)}</div>
                  <div className="text-xs text-blue-400">{fmtBs(sub, toBs)}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </motion.article>
);

/* ════════════════════════════════════════════════════════════
   SUBCOMPONENTE 6 — Modal de atajos (F1)
════════════════════════════════════════════════════════════ */
const SHORTCUTS_GENERAL = [
  ["F1",  "Mostrar / ocultar esta ayuda"],
  ["F2",  "Nueva venta"],
  ["Esc", "Cerrar formulario / vista de detalle"],
];
const SHORTCUTS_FORM = [
  ["F3 ó /", "Enfocar buscador de productos"],
  ["F4",     "Abrir carrito de compras"],
  ["F9",     "Confirmar / Procesar venta"],
  ["F5",     "Ciclar método de pago"],
  ["F6",     "Abrir escáner de cámara"],
  ["F8",     "Vaciar carrito (con confirmación)"],
  ["+",      "Aumentar cantidad del último ítem"],
  ["−",      "Disminuir cantidad del último ítem"],
];

const ShortcutList = ({ items, keyClass }) => (
  <ul className="space-y-2">
    {items.map(([key, desc]) => (
      <li key={key} className="flex items-center justify-between text-sm">
        <span className="text-gray-300">{desc}</span>
        <kbd className={`px-2 py-1 text-xs font-mono font-semibold rounded-md ${keyClass}`}>{key}</kbd>
      </li>
    ))}
  </ul>
);

const HelpModal = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.aside
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#1a1a24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
        >
          <header className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-2">
              <Keyboard size={22} className="text-orange-500" aria-hidden="true" />
              <h3 id="help-modal-title" className="text-lg font-bold text-white">Atajos de Teclado</h3>
            </div>
            <button onClick={onClose} aria-label="Cerrar ayuda" className="p-1 text-gray-400 hover:text-white transition">
              <X size={22} />
            </button>
          </header>

          <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
            <section>
              <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">General</h4>
              <ShortcutList items={SHORTCUTS_GENERAL} keyClass="text-orange-400 bg-orange-500/10 border border-orange-500/20" />
            </section>
            <section>
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Formulario de Venta</h4>
              <ShortcutList items={SHORTCUTS_FORM} keyClass="text-blue-400 bg-blue-500/10 border border-blue-500/20" />
            </section>
            <section>
              <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Escáner Físico</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                El sistema detecta automáticamente escáneres USB / Bluetooth. Solo apunta y escanea — el producto se añade al carrito al instante.
              </p>
            </section>
          </div>

          <footer className="p-4 border-t border-white/5 bg-black/20 text-center">
            <p className="text-xs text-gray-500">
              Presiona <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-black/40 border border-white/10 rounded">F1</kbd> o{" "}
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-black/40 border border-white/10 rounded">Esc</kbd> para cerrar
            </p>
          </footer>
        </motion.aside>
      </div>
    )}
  </AnimatePresence>
);

/* ════════════════════════════════════════════════════════════
   SUBCOMPONENTE 7 — Historial de ventas con filtros
════════════════════════════════════════════════════════════ */
const buildHistoryColumns = (onViewDetail, toBs) => [
  {
    key: "createdAt",
    label: "Fecha",
    render: (val) => (
      <div className="text-gray-300 text-sm">
        {new Date(val).toLocaleDateString()}
        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
          {new Date(val).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    ),
  },
  {
    key: "payment_method",
    label: "Método Pago",
    headerClassName: "hidden md:table-cell",
    className: "hidden md:table-cell text-white font-medium text-sm",
  },
  {
    key: "status",
    label: "Estado",
    headerClassName: "hidden sm:table-cell",
    className: "hidden sm:table-cell",
    render: (val) => <Badge variant="success">{val || "Completada"}</Badge>,
  },
  {
    key: "total_amount",
    label: "Total",
    render: (val) => (
      <div>
        <div className="text-amber-500 font-medium text-sm sm:text-base">{fmtUSD(val)}</div>
        <div className="text-[10px] sm:text-xs text-blue-400 mt-0.5">{fmtBs(val, toBs)}</div>
      </div>
    ),
  },
  {
    key: "_id",
    label: "",
    render: (id) => (
      <Button variant="ghost" size="sm" onClick={() => onViewDetail(id)}
        className="bg-white/5 hover:bg-white/10 text-orange-400 px-2 sm:px-3 text-xs sm:text-sm">
        <span className="hidden sm:inline">Ver Detalles</span>
        <span className="sm:hidden">Detalles</span>
      </Button>
    ),
  },
];

/* ════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════ */
const SalesManager = () => {
  const { sales, isLoading, error, fetchSales, createSale, fetchSaleById } = useSaleStore();
  const { products, fetchProducts, fetchProductByBarcode }                 = useProductStore();
  const { user }                                                           = useAuthStore();
  const { exchangeRate, setExchangeRate, toBs }                           = useCurrencyStore();

  const [isFormOpen,    setIsFormOpen]    = useState(false);
  const [viewedSale,    setViewedSale]    = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [items,         setItems]         = useState([]);
  const [searchTerm,    setSearchTerm]    = useState("");
  const [dateFilter,    setDateFilter]    = useState("all");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showHelp,      setShowHelp]      = useState(false);
  const [cartPulse,     setCartPulse]     = useState(false);
  const [isCartOpen,    setIsCartOpen]    = useState(false);

  const searchInputRef   = useRef(null);
  const submitBtnRef     = useRef(null);
  const paymentSelectRef = useRef(null);

  useEffect(() => { fetchSales(); fetchProducts(); }, [fetchSales, fetchProducts]);

  useEffect(() => {
    if (!isScannerOpen && isFormOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [isScannerOpen, isFormOpen]);

  /* ── Carrito ── */
  const handleAddItem = useCallback((product, quantity = 1) => {
    if (product.stock <= 0) return toast.error(`${product.name} no tiene stock`);
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product_id === product._id);
      if (idx >= 0) {
        if (prev[idx].quantity + quantity > product.stock) {
          setTimeout(() => toast.error(`Sin más stock de ${product.name}`), 0);
          return prev;
        }
        const next = [...prev];
        next[idx].quantity += quantity;
        return next;
      }
      return [...prev, { product_id: product._id, name: product.name, quantity, unit_price: product.price, maxStock: product.stock, unit_type: product.unit_type || "unidad" }];
    });
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 300);
  }, []);

  const handleQtyChange = (index, value) => {
    const qty = parseFloat(value);
    if (value !== "" && (isNaN(qty) || qty < 0)) return;
    setItems((prev) => {
      if (qty > prev[index].maxStock) { toast.error(`Máximo stock: ${prev[index].maxStock}`); return prev; }
      const next = [...prev];
      next[index].quantity = value;
      return next;
    });
  };

  const handleRemoveItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const cyclePaymentMethod = useCallback(() => {
    setPaymentMethod((prev) => {
      const next = PAYMENT_METHODS[(PAYMENT_METHODS.indexOf(prev) + 1) % PAYMENT_METHODS.length];
      toast.success(`Método: ${next}`, { duration: 1200, icon: "💳" });
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    if (items.length === 0) return;
    if (window.confirm("¿Vaciar todo el carrito?")) {
      setItems([]);
      toast.success("Carrito vaciado", { icon: "🗑️" });
    }
  }, [items.length]);

  const modifyLastItemQty = useCallback((delta) => {
    if (items.length === 0) return;
    const last = items.length - 1;
    setItems((prev) => {
      const next = [...prev];
      const newQty = (parseFloat(next[last].quantity) || 0) + delta;
      if (newQty <= 0)              { next.splice(last, 1); }
      else if (newQty > next[last].maxStock) { toast.error(`Stock máx: ${next[last].maxStock}`); return prev; }
      else                          { next[last].quantity = newQty; }
      return next;
    });
  }, [items]);

  const cancelForm = () => { setIsFormOpen(false); setIsCartOpen(false); setItems([]); setPaymentMethod("Efectivo"); };

  /* ── Barcode scan ── */
  const handleBarcodeScan = useCallback(async (code, qty = 1) => {
    const local = products.find((p) => p.barcode === code || p._id === code);
    if (local) { handleAddItem(local, qty); toast.success(`Añadido: ${qty}x ${local.name}`); setSearchTerm(""); return; }
    try {
      const res = await fetchProductByBarcode(code);
      const product = res?.product || res;
      if (product?._id) { handleAddItem(product, qty); toast.success(`Añadido: ${qty}x ${product.name}`); setSearchTerm(""); }
      else throw new Error();
    } catch { toast.error(`Código "${code}" no encontrado`); }
  }, [products, handleAddItem, fetchProductByBarcode]);

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Agrega al menos un artículo");
    const total_amount = items.reduce((a, i) => a + itemSubtotal(i), 0);
    try {
      await createSale({ customer_id: user?._id || user?.id, payment_method: paymentMethod, total_amount,
        items: items.map((i) => ({ product_id: i.product_id, quantity: parseFloat(i.quantity) || 0, unit_price: i.unit_price })) });
      toast.success("Venta registrada con éxito");
      cancelForm();
      fetchProducts();
    } catch { toast.error(error || "Error al registrar la venta"); }
  };

  const handleViewDetail = async (id) => {
    try   { setViewedSale(await fetchSaleById(id)); }
    catch { toast.error("No se pudo cargar el detalle de la venta"); }
  };

  /* ── Teclado global ── */
  useEffect(() => {
    let buffer = "", lastKeyTime = Date.now();
    const onKey = (e) => {
      const isInput = ["input", "textarea", "select"].includes(e.target.tagName.toLowerCase());
      switch (e.key) {
        case "F1": e.preventDefault(); setShowHelp((p) => !p); return;
        case "F2": e.preventDefault(); if (!isFormOpen) { setIsFormOpen(true); setViewedSale(null); } return;
        case "F3": e.preventDefault(); if (isFormOpen) searchInputRef.current?.focus(); return;
        case "F4": e.preventDefault(); if (isFormOpen && items.length > 0) !isCartOpen && setIsCartOpen(true); return;
        case "F9": e.preventDefault(); if (isFormOpen && isCartOpen && submitBtnRef.current && items.length > 0) submitBtnRef.current.click(); return;
        case "F5": e.preventDefault(); if (isFormOpen) cyclePaymentMethod(); return;
        case "F6": e.preventDefault(); if (isFormOpen) setIsScannerOpen(true); return;
        case "F8": e.preventDefault(); if (isFormOpen) clearCart(); return;
        case "Escape":
          e.preventDefault();
          if (showHelp)   { setShowHelp(false); return; }
          if (isScannerOpen) { setIsScannerOpen(false); return; }
          if (viewedSale) { setViewedSale(null); return; }
          if (isCartOpen) { setIsCartOpen(false); return; }
          if (isFormOpen) { cancelForm(); return; }
          return;
        default: break;
      }
      if (e.key === "/" && !isInput && isFormOpen) { e.preventDefault(); searchInputRef.current?.focus(); return; }
      if (!isInput && isFormOpen) {
        if (e.key === "+" || e.key === "=") { e.preventDefault(); modifyLastItemQty(1); return; }
        if (e.key === "-")                  { e.preventDefault(); modifyLastItemQty(-1); return; }
      }
      if (!isInput) {
        const now = Date.now();
        if (now - lastKeyTime > 50) buffer = "";
        if (e.key === "Enter") { if (buffer.length >= 5) { handleBarcodeScan(buffer); buffer = ""; e.preventDefault(); } }
        else if (e.key.length === 1) buffer += e.key;
        lastKeyTime = now;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFormOpen, viewedSale, showHelp, isScannerOpen, isCartOpen, items, cyclePaymentMethod, clearCart, modifyLastItemQty, handleBarcodeScan]);

  /* ── Datos derivados ── */
  const currentTotal     = items.reduce((a, i) => a + itemSubtotal(i), 0);
  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const { filteredSales, filteredTotal } = useMemo(() => {
    const list = filterSalesByDate(sales, dateFilter);
    return { filteredSales: list, filteredTotal: list.reduce((a, s) => a + Number(s.total_amount || 0), 0) };
  }, [sales, dateFilter]);

  /* ── Render ── */
  return (
    <section aria-labelledby="sales-heading" className="w-full max-w-6xl mx-auto p-4 sm:p-6">

      {/* Encabezado */}
      <header className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 id="sales-heading" className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Punto de <span className="text-orange-500">Venta</span>
          </h2>
          {!isFormOpen && !viewedSale && (
            <Button variant="primary" onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
              <Plus size={20} /> Nueva Venta <KBD>F2</KBD>
            </Button>
          )}
        </div>
        <ExchangeRateBar exchangeRate={exchangeRate} onRateChange={setExchangeRate} />
      </header>

      {/* POS fullscreen */}
      <AnimatePresence>
        {isFormOpen && (
          <SalePOSForm
            items={items}
            onCancel={cancelForm}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onQtyChange={handleQtyChange}
            onSubmit={handleSubmit}
            paymentMethod={paymentMethod}
            onPaymentChange={setPaymentMethod}
            isLoading={isLoading}
            currentTotal={currentTotal}
            toBs={toBs}
            filteredProducts={filteredProducts}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            onOpenScanner={() => setIsScannerOpen(true)}
            cartPulse={cartPulse}
            submitBtnRef={submitBtnRef}
            paymentSelectRef={paymentSelectRef}
            searchInputRef={searchInputRef}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
          />
        )}
      </AnimatePresence>

      {/* Detalle de venta */}
      {viewedSale && !isFormOpen && (
        <SaleDetailView sale={viewedSale} onBack={() => setViewedSale(null)} toBs={toBs} />
      )}

      {/* Error */}
      {error && !isFormOpen && !viewedSale && (
        <p role="alert" className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</p>
      )}

      {/* Historial */}
      {!isFormOpen && !viewedSale && (
        <>
          {/* Filtros de fecha */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <nav className="flex items-center gap-2 flex-wrap" aria-label="Filtro por período">
              <Calendar size={18} className="text-gray-400 shrink-0" aria-hidden="true" />
              {DATE_FILTER_OPTIONS.map((opt) => (
                <Button key={opt.value} size="sm"
                  variant={dateFilter === opt.value ? "primary" : "secondary"}
                  onClick={() => setDateFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </nav>
            {dateFilter !== "all" && (
              <div className="flex items-center gap-4 bg-gradient-to-r from-amber-500/10 to-blue-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total filtrado</p>
                  <span className="text-lg font-bold text-amber-500">{fmtUSD(filteredTotal)}</span>
                  <span className="text-sm text-blue-400 ml-2">{fmtBs(filteredTotal, toBs)}</span>
                </div>
              </div>
            )}
          </div>

          <DataTable
            columns={buildHistoryColumns(handleViewDetail, toBs)}
            data={filteredSales}
            isLoading={isLoading}
            emptyMessage={sales.length === 0 ? "Aún no hay ventas" : "Sin ventas en este período"}
            emptyIcon={<ShoppingCart size={30} />}
            emptyDetail={sales.length === 0 ? "El historial de ventas está vacío." : "No se encontraron ventas con el filtro seleccionado."}
            emptyAction={sales.length > 0 ? { label: "Ver todas las ventas", onClick: () => setDateFilter("all") } : undefined}
          />
        </>
      )}

      {/* Escáner de cámara */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
        continuous={isFormOpen}
      />

      {/* Help modal F1 */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Botón flotante de ayuda */}
      {!isFormOpen && !viewedSale && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowHelp(true)}
            aria-label="Ver atajos de teclado"
            className="flex items-center gap-2 px-3 py-2 bg-[#1a1a24]/90 border border-white/10 rounded-xl text-gray-400 hover:text-orange-400 hover:border-orange-500/30 transition backdrop-blur-sm shadow-lg"
          >
            <HelpCircle size={18} />
            <span className="text-xs font-medium">Atajos</span>
            <KBD>F1</KBD>
          </button>
        </div>
      )}
    </section>
  );
};

export default SalesManager;
