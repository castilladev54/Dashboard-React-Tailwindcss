import { useEffect, useState, useRef } from "react";
import { Plus, Check, ClipboardList, Search, Info } from "lucide-react";
import { useAdjustmentStore } from "../store/adjustmentStore";
import { useProductStore }    from "../store/productStore";
import toast from "react-hot-toast";

import Button        from "./atoms/Button";
import Badge         from "./atoms/Badge";
import Modal         from "./molecules/Modal";
import FormField     from "./molecules/FormField";
import SectionHeader from "./molecules/SectionHeader";
import DataTable     from "./organisms/DataTable";

/* ─── Constantes ─────────────────────────────────────────── */
const ITEMS_PER_PAGE = 10;

const REASON_MAPPING = {
  initial_count: "Inventario Inicial",
  damaged:       "Dañado / Merma",
  stolen:        "Extravío / Robo",
  expired:       "Vencido",
  correction:    "Corrección",
  other:         "Otro motivo",
};

const MOTIVOS = Object.entries(REASON_MAPPING).map(([value, label]) => ({ value, label }));

const EMPTY_FORM = { newStock: "", reason: "initial_count", notes: "" };

/* ─── Helpers ────────────────────────────────────────────── */
const formatDate = (iso) => ({
  date: new Date(iso).toLocaleDateString(),
  time: new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
});

const diffVariant = (diff) => {
  if (diff > 0) return "success";
  if (diff < 0) return "danger";
  return "neutral";
};

/* ─── Columnas del historial ─────────────────────────────── */
const COLUMNS = [
  {
    key: "createdAt",
    label: "Fecha",
    render: (val) => {
      const { date, time } = formatDate(val);
      return (
        <div className="whitespace-nowrap text-sm">
          {date}
          <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{time}</div>
        </div>
      );
    },
  },
  {
    key: "product_id",
    label: "Producto",
    render: (val, row) => (
      <div>
        <p className="font-medium text-white max-w-[120px] sm:max-w-xs truncate" title={val?.name}>
          {val?.name || "Producto Desconocido"}
        </p>
        {row.notes && (
          <p className="text-xs text-orange-400/80 truncate max-w-[120px] sm:max-w-xs pt-1 italic" title={row.notes}>
            "{row.notes}"
          </p>
        )}
      </div>
    ),
  },
  {
    key: "reason",
    label: "Motivo",
    render: (val) => (
      <span className="bg-black/30 border border-white/5 px-2 py-1 rounded-md text-xs sm:text-sm whitespace-nowrap">
        {REASON_MAPPING[val] || val}
      </span>
    ),
  },
  {
    key: "previous_stock",
    label: "Antes",
    headerClassName: "hidden md:table-cell text-center",
    className: "hidden md:table-cell text-center text-gray-400 font-medium",
  },
  {
    key: "new_stock",
    label: "Nuevo",
    headerClassName: "hidden md:table-cell text-center",
    className: "hidden md:table-cell text-center font-bold text-white",
  },
  {
    key: "difference",
    label: "Diferencia",
    className: "text-right",
    render: (val, row) => (
      <div className="flex flex-col items-end gap-1">
        <Badge variant={diffVariant(val)}>
          {val > 0 ? "+" : ""}{val}
        </Badge>
        {/* Resumen anterior→nuevo visible solo en móvil */}
        <span className="md:hidden text-[10px] text-gray-500 uppercase tracking-widest">
          {row.previous_stock} → {row.new_stock}
        </span>
      </div>
    ),
  },
];

/* ─── Subcomponente: buscador de producto ────────────────── */
const ProductSearchStep = ({ searchTerm, onSearch, filteredProducts, onSelect, searchRef }) => (
  <div className="bg-black/20 p-4 border border-white/5 rounded-xl">
    <p className="block text-sm font-medium text-gray-300 mb-2">
      1. Seleccionar Producto
    </p>
    <div className="relative">
      <Search
        size={18}
        aria-hidden="true"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      />
      <input
        ref={searchRef}
        type="search"
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Escribe el nombre del producto o código..."
        aria-label="Buscar producto"
        className="w-full pl-10 pr-3 py-3 bg-black/50 border border-white/10 rounded-xl text-white
                   placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50
                   focus:border-orange-500 transition"
      />
    </div>

    {searchTerm && (
      <div
        role="listbox"
        aria-label="Resultados de búsqueda"
        className="border border-white/5 bg-[#1a1a24] rounded-xl overflow-hidden mt-2 max-h-60 overflow-y-auto"
      >
        {filteredProducts.length === 0 ? (
          <p className="p-4 text-sm text-gray-500 text-center">No se encontraron productos.</p>
        ) : (
          filteredProducts.map((prod) => (
            <div
              key={prod._id}
              role="option"
              aria-selected="false"
              tabIndex={0}
              onClick={() => onSelect(prod)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(prod)}
              className="flex justify-between items-center p-3 border-b border-white/5
                         hover:bg-white/5 cursor-pointer transition text-sm text-gray-300"
            >
              <div>
                <span className="font-medium text-white block">{prod.name}</span>
                <span className="text-xs text-gray-500">
                  Stock Actual: {prod.stock} {prod.unit_type === "unidad" ? "ud" : prod.unit_type}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    )}
  </div>
);

/* ─── Subcomponente: resumen del producto seleccionado ───── */
const SelectedProductCard = ({ product, onClear }) => (
  <div className="bg-blue-500/5 p-4 border border-blue-500/20 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <p className="text-sm font-medium text-gray-400 mb-1">Producto Seleccionado</p>
      <h4 className="text-xl font-bold text-white">{product.name}</h4>
      <div className="flex items-center gap-2 mt-2">
        <div className="bg-black/40 text-blue-400 border border-blue-500/20 px-3 py-1 rounded text-sm font-semibold flex items-center gap-2">
          <Info size={16} aria-hidden="true" />
          El sistema dice que tienes:{" "}
          <span className="text-lg">{product.stock}</span>
          {product.unit_type !== "unidad" && ` ${product.unit_type}`}
        </div>
      </div>
    </div>
    <Button variant="secondary" onClick={onClear} size="sm" type="button" className="shrink-0 w-full sm:w-auto">
      Cambiar Producto
    </Button>
  </div>
);

/* ─── Componente principal ───────────────────────────────── */
const AdjustmentManager = () => {
  const { adjustments, isLoading, error, fetchAdjustments, createAdjustment } = useAdjustmentStore();
  const { products, fetchProducts } = useProductStore();

  const [isFormOpen, setIsFormOpen]         = useState(false);
  const [currentPage, setCurrentPage]       = useState(1);
  const [searchTerm, setSearchTerm]         = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const searchRef = useRef(null);

  const totalPages        = Math.ceil(adjustments.length / ITEMS_PER_PAGE);
  const currentAdjustments = adjustments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filteredProducts = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    )
    .slice(0, 10);

  useEffect(() => {
    fetchAdjustments();
    fetchProducts();
  }, [fetchAdjustments, fetchProducts]);

  /* ── Handlers ── */
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSearchTerm("");
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setForm((prev) => ({ ...prev, newStock: "" }));
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedProduct(null);
    setSearchTerm("");
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return toast.error("Selecciona un producto primero");
    if (form.newStock === "") return toast.error("Ingresa la cantidad física actual");

    const stockNum = parseFloat(form.newStock);
    if (isNaN(stockNum) || stockNum < 0) return toast.error("La cantidad no puede ser negativa");
    if (stockNum === selectedProduct.stock)
      return toast.error(`El producto ya tiene exactamente ${stockNum} unidades. Sin cambios enviados.`);

    try {
      await createAdjustment({
        product_id: selectedProduct._id,
        new_stock:  stockNum,
        reason:     form.reason,
        notes:      form.notes,
      });
      toast.success("Ajuste de inventario guardado con éxito");
      closeForm();
    } catch {
      toast.error(error || "Ocurrió un error al registrar el ajuste.");
    }
  };

  /* ── Estilos compartidos para select ── */
  const selectClass =
    "w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white " +
    "focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition";

  /* ── Render ── */
  return (
    <section
      aria-labelledby="adjustment-heading"
      className="w-full max-w-6xl mx-auto p-4 sm:p-6"
    >
      <SectionHeader
        id="adjustment-heading"
        title={<>Ajustes de <span className="text-orange-500">Inventario</span> (Kárdex)</>}
        onAdd={() => setIsFormOpen(true)}
        addLabel={<><Plus size={18} /> Nuevo Ajuste</>}
      />

      {error && !isFormOpen && (
        <p role="alert" className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {error}
        </p>
      )}

      {/* ── Historial de ajustes ── */}
      <DataTable
        columns={COLUMNS}
        data={currentAdjustments}
        isLoading={isLoading && currentAdjustments.length === 0}
        emptyMessage="Kárdex en blanco"
        emptyIcon={<ClipboardList size={30} />}
        emptyDetail="El historial de auditorías y mermas aparecerá aquí."
        emptyAction={{ label: "Realizar primer ajuste", onClick: () => setIsFormOpen(true) }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* ── Formulario en Modal ── */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title="Realizar Ajuste de Inventario"
        icon={<ClipboardList size={22} />}
      >
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Paso 1: Selección de producto */}
          {!selectedProduct ? (
            <ProductSearchStep
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
              filteredProducts={filteredProducts}
              onSelect={handleSelectProduct}
              searchRef={searchRef}
            />
          ) : (
            <SelectedProductCard
              product={selectedProduct}
              onClear={handleClearSelection}
            />
          )}

          {/* Pasos 2, 3 y 4: Campos del ajuste */}
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border border-white/5 bg-black/20">
              <div>
                <FormField
                  label="2. Cantidad Física Real"
                  name="newStock"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.newStock}
                  onChange={handleFormChange}
                  placeholder="¿Cuánto hay en tus manos?"
                  className="text-lg"
                />
                <p className="text-xs text-gray-500 -mt-1">
                  Escribe la cantidad total existente, no la diferencia.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="adj-reason" className="block text-sm font-medium text-gray-300 mb-1">
                  3. Motivo del Ajuste
                </label>
                <select
                  id="adj-reason"
                  name="reason"
                  value={form.reason}
                  onChange={handleFormChange}
                  className={selectClass}
                >
                  {MOTIVOS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <FormField
                  as="textarea"
                  label="Notas Opcionales"
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  placeholder="Ej: Cajas selladas al fondo, Producto caducado, Error de conteo..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="secondary" type="button" onClick={closeForm} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isLoading}
              disabled={!selectedProduct}
              className="w-full sm:w-auto"
            >
              <Check size={18} /> Confirmar Ajuste
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};

export default AdjustmentManager;
