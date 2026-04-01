import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check, PackageOpen, Trash2, ArrowLeft, Camera } from "lucide-react";
import { usePurchaseStore } from "../store/purchaseStore";
import { useProductStore }  from "../store/productStore";
import { useAuthStore }     from "../store/authStore";
import toast from "react-hot-toast";

import Button        from "./atoms/Button";
import Modal         from "./molecules/Modal";
import SectionHeader from "./molecules/SectionHeader";
import DataTable     from "./organisms/DataTable";
import BarcodeScanner from "./BarcodeScanner";

/* ─── Constantes ─────────────────────────────────────────── */
const ITEMS_PER_PAGE    = 10;
const EMPTY_ITEM        = { product_id: "", quantity: 1, unit_cost: 0, unit_type: "unidad" };
const EMPTY_ITEMS_LIST  = [{ ...EMPTY_ITEM }];

/* ─── Helpers ────────────────────────────────────────────── */
const fmtDate = (iso) => new Date(iso).toLocaleDateString();
const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtCost = (val)  => `$${Number(val || 0).toFixed(2)}`;
const subtotal = (item) => ((parseFloat(item.quantity) || 0) * Number(item.unit_cost));

/* ─── Estilos del input de artículo ─────────────────────── */
const itemInputClass =
  "w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white " +
  "focus:outline-none focus:border-orange-500 transition text-sm";

/* ─── Columnas del historial ─────────────────────────────── */
const buildHistoryColumns = (onViewDetail) => [
  {
    key: "createdAt",
    label: "Fecha",
    render: (val, row) => {
      const iso = val || row.date;
      return (
        <div className="text-gray-300 text-sm">
          {fmtDate(iso)}
          <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{fmtTime(iso)}</div>
        </div>
      );
    },
  },
  {
    key: "supplier",
    label: "Proveedor",
    render: (val) => (
      <div className="max-w-[100px] sm:max-w-xs xl:max-w-md truncate font-medium text-white text-sm" title={val}>
        {val}
      </div>
    ),
  },
  {
    key: "items",
    label: "Items",
    headerClassName: "hidden md:table-cell",
    className: "hidden md:table-cell text-gray-400 text-sm",
    render: (val) => `${val?.length || 0} ítems`,
  },
  {
    key: "total_cost",
    label: "Total",
    render: (val) => <span className="text-amber-500 font-medium text-sm">{fmtCost(val)}</span>,
  },
  {
    key: "_id",
    label: "",
    render: (id) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewDetail(id)}
        className="bg-white/5 hover:bg-white/10 text-orange-400 px-2 sm:px-3 text-xs sm:text-sm"
      >
        <span className="hidden sm:inline">Ver Detalles</span>
        <span className="sm:hidden">Detalles</span>
      </Button>
    ),
  },
];

/* ─── Subcomponente: fila de artículo en el formulario ───── */
const PurchaseItemRow = ({ item, index, products, onChange, onRemove, showRemove }) => (
  <div className="flex flex-col md:flex-row gap-3 items-end bg-white/5 p-3 rounded-lg border border-white/5">
    {/* Producto */}
    <div className="flex-1 w-full">
      <label className="block text-xs text-gray-400 mb-1">Producto</label>
      <select
        value={item.product_id}
        onChange={(e) => onChange(index, "product_id", e.target.value)}
        required
        aria-label={`Producto del artículo ${index + 1}`}
        className={itemInputClass}
      >
        <option value="" disabled>Seleccionar Producto</option>
        {products.map((p) => (
          <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock})</option>
        ))}
      </select>
    </div>

    {/* Cantidad */}
    <div className="w-full md:w-32">
      <label className="block text-xs text-gray-400 mb-1">Cantidad</label>
      <input
        type="number" min="0.01" step="0.01" required
        value={item.quantity}
        onChange={(e) => onChange(index, "quantity", e.target.value)}
        aria-label={`Cantidad del artículo ${index + 1}`}
        className={itemInputClass}
      />
    </div>

    {/* Costo unitario */}
    <div className="w-full md:w-32">
      <label className="block text-xs text-gray-400 mb-1">Costo Unit. ($)</label>
      <input
        type="number" min="0" step="0.01" required
        value={item.unit_cost}
        onChange={(e) => onChange(index, "unit_cost", e.target.value)}
        aria-label={`Costo unitario del artículo ${index + 1}`}
        className={itemInputClass}
      />
    </div>

    {/* Subtotal (read-only) */}
    <div className="w-full md:w-32">
      <label className="block text-xs text-gray-400 mb-1">Subtotal</label>
      <output className="block w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-gray-300 text-sm">
        {fmtCost(subtotal(item))}
      </output>
    </div>

    {showRemove && (
      <Button
        variant="icon" type="button"
        onClick={() => onRemove(index)}
        aria-label={`Quitar artículo ${index + 1}`}
        className="text-red-400 hover:bg-red-500/10 mb-0.5"
      >
        <Trash2 size={20} />
      </Button>
    )}
  </div>
);

/* ─── Subcomponente: detalle de una compra ───────────────── */
const PurchaseDetailView = ({ purchase, onBack }) => (
  <motion.article
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="mb-8 p-6 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-xl"
  >
    <header className="flex items-center justify-between mb-6">
      <Button variant="ghost" onClick={onBack} className="text-orange-500 hover:text-orange-400">
        <ArrowLeft size={20} />
        <span>Volver al historial</span>
      </Button>
      <p className="text-sm text-gray-400">ID: {purchase._id}</p>
    </header>

    {/* Meta info */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {[
        { label: "Proveedor",               value: purchase.supplier,                                      cls: "" },
        { label: "Fecha de Registro",       value: new Date(purchase.createdAt || purchase.date).toLocaleString(), cls: "" },
        { label: "Total Artículos Diferentes", value: purchase.items?.length || 0,                      cls: "" },
        { label: "Costo Total Compra",      value: fmtCost(purchase.total_cost),                         cls: "bg-amber-500/10 border-amber-500/20 text-amber-500 text-2xl font-bold" },
      ].map(({ label, value, cls }) => (
        <div key={label} className={`bg-black/20 p-4 rounded-xl border border-white/5 ${cls}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-lg font-medium text-white ${cls}`}>{value}</p>
        </div>
      ))}
    </div>

    {/* Tabla de items */}
    <h3 className="text-lg font-medium text-white mb-4">Artículos de esta Entrada</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-black/30 text-gray-400 text-sm uppercase tracking-wider">
            <th scope="col" className="px-6 py-3 font-medium">Producto (ID)</th>
            <th scope="col" className="px-6 py-3 font-medium">Cantidad Recibida</th>
            <th scope="col" className="px-6 py-3 font-medium">Costo Unitario</th>
            <th scope="col" className="px-6 py-3 font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {purchase.items?.map((item, idx) => {
            const unit = item.product_id?.unit_type;
            const unitLabel = unit && unit !== "unidad" ? unit : item.quantity === 1 ? "unidad" : "unidades";
            return (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-3">
                  <span className="font-medium text-orange-400">{item.product_id?.name || "Producto Desconocido"}</span>
                  <div className="text-xs text-gray-500 mt-1">ID: {item.product_id?._id || item.product_id}</div>
                </td>
                <td className="px-6 py-3 text-gray-300">
                  <span className="bg-white/10 px-2 py-1 rounded text-sm">+ {item.quantity} {unitLabel}</span>
                </td>
                <td className="px-6 py-3 text-gray-300">{fmtCost(item.unit_cost)}</td>
                <td className="px-6 py-3 text-amber-500 font-medium">
                  {fmtCost(parseFloat(item.quantity) * Number(item.unit_cost))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </motion.article>
);

/* ─── Componente principal ───────────────────────────────── */
const PurchaseManager = () => {
  const { purchases, isLoading, error, fetchPurchases, createPurchase, fetchPurchaseById } = usePurchaseStore();
  const { products, fetchProducts, fetchProductByBarcode } = useProductStore();
  const { user } = useAuthStore();

  const [isFormOpen,    setIsFormOpen]    = useState(false);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [viewedPurchase, setViewedPurchase] = useState(null);
  const [isScannerOpen,  setIsScannerOpen] = useState(false);

  // Form state
  const [supplier, setSupplier] = useState("");
  const [items,    setItems]    = useState(EMPTY_ITEMS_LIST);

  const totalPages      = Math.ceil(purchases.length / ITEMS_PER_PAGE);
  const currentPurchases = purchases.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const currentTotal    = items.reduce((acc, item) => acc + subtotal(item), 0);

  useEffect(() => { fetchPurchases(); fetchProducts(); }, [fetchPurchases, fetchProducts]);

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

  const closeForm = () => { setIsFormOpen(false); setSupplier(""); setItems(EMPTY_ITEMS_LIST); };

  const handleViewDetail = async (id) => {
    try   { setViewedPurchase(await fetchPurchaseById(id)); }
    catch { toast.error("No se pudo cargar el detalle de la compra"); }
  };

  /* ── Render ── */
  return (
    <section
      aria-labelledby="purchases-heading"
      className="w-full max-w-6xl mx-auto p-4 sm:p-6"
    >
      <SectionHeader
        id="purchases-heading"
        title={<>Gestión de <span className="text-orange-500">Compras</span></>}
        onAdd={!viewedPurchase ? () => setIsFormOpen(true) : undefined}
        addLabel={<><Plus size={18} /> Nueva Entrada</>}
      />

      {error && !isFormOpen && !viewedPurchase && (
        <p role="alert" className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {error}
        </p>
      )}

      {/* Vista detalle de compra */}
      {viewedPurchase && !isFormOpen && (
        <PurchaseDetailView purchase={viewedPurchase} onBack={() => setViewedPurchase(null)} />
      )}

      {/* Historial */}
      {!viewedPurchase && (
        <DataTable
          columns={buildHistoryColumns(handleViewDetail)}
          data={currentPurchases}
          isLoading={isLoading}
          emptyMessage="Aún no hay compras"
          emptyIcon={<PackageOpen size={30} />}
          emptyDetail="El historial de entradas de mercancía está vacío."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Formulario nueva compra */}
      <Modal isOpen={isFormOpen} onClose={closeForm} title="Registrar Nueva Compra / Entrada">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Proveedor */}
          <div>
            <label htmlFor="supplier" className="block text-sm font-medium text-gray-300 mb-1">
              Nombre del Proveedor / Empresa <span className="text-orange-500" aria-hidden="true">*</span>
            </label>
            <input
              id="supplier"
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              required
              placeholder="Ej. Distribuidora Mayorista S.A."
              className="w-full md:w-1/2 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
            />
          </div>

          {/* Artículos */}
          <fieldset className="border border-white/5 bg-black/20 rounded-xl p-4">
            <legend className="sr-only">Artículos de la compra</legend>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h4 className="text-lg font-medium text-white">Artículos</h4>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsScannerOpen(true)} className="text-blue-400 flex-1 sm:flex-none justify-center">
                  <Camera size={16} /> Escanear
                </Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => setItems((p) => [...p, { ...EMPTY_ITEM }])} className="text-orange-400 flex-1 sm:flex-none justify-center">
                  <Plus size={16} /> Añadir
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <PurchaseItemRow
                  key={index}
                  item={item}
                  index={index}
                  products={products}
                  onChange={handleItemChange}
                  onRemove={(i) => setItems((p) => p.filter((_, idx) => idx !== i))}
                  showRemove={items.length > 1}
                />
              ))}
            </div>

            {/* Total estimado */}
            <div className="mt-4 flex justify-end">
              <div className="text-right">
                <span className="text-gray-400 text-sm">Costo Total Estimado:</span>
                <div className="text-2xl font-bold text-amber-500">{fmtCost(currentTotal)}</div>
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="secondary" type="button" onClick={closeForm}>Cancelar</Button>
            <Button variant="primary"   type="submit"  isLoading={isLoading}>
              <Check size={18} /> Registrar Compra
            </Button>
          </div>
        </form>
      </Modal>

      {/* Escáner de cámara */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => { handleBarcodeScan(code); setIsScannerOpen(false); }}
      />
    </section>
  );
};

export default PurchaseManager;
