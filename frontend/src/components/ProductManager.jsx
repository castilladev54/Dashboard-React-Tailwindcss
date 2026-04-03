import { useEffect, useState } from "react";
import { Plus, PackageOpen, Camera, ScanBarcode, Tag as TagIcon } from "lucide-react";
import { useProductStore }  from "../store/productStore";
import { useCategoryStore } from "../store/categoryStore";
import { useCurrencyStore } from "../store/currencyStore";
import toast from "react-hot-toast";

import Button       from "./atoms/Button";
import Badge        from "./atoms/Badge";
import Modal        from "./molecules/Modal";
import FormField    from "./molecules/FormField";
import SectionHeader from "./molecules/SectionHeader";
import ConfirmDialog from "./molecules/ConfirmDialog";
import DataTable    from "./organisms/DataTable";
import BarcodeScanner from "./BarcodeScanner";

const ITEMS_PER_PAGE = 10;

const EMPTY_FORM = {
  name: "", description: "", price: "", stock: "",
  category: "", unit_type: "unidad", barcode: "",
  new_stock: "", stock_reason: "",
};

const STOCK_REASONS = [
  { value: "initial_count", label: "Inventario Inicial" },
  { value: "damaged", label: "Dañado / Merma" },
  { value: "stolen", label: "Extravío / Robo" },
  { value: "expired", label: "Vencido" },
  { value: "correction", label: "Corrección" },
  { value: "other", label: "Otro motivo" },
];

const UNIT_OPTIONS = [
  { value: "unidad", label: "Unidad (ud)"      },
  { value: "kg",     label: "Kilogramos (kg)"  },
  { value: "litro",  label: "Litros (l)"       },
  { value: "metro",  label: "Metros (m)"       },
];

/** Devuelve la variante de Badge según el stock */
const stockVariant = (stock) => {
  if (stock > 10) return "success";
  if (stock > 0)  return "warning";
  return "danger";
};

/** Formato de unidades para mostrar en la tabla */
const formatUnit = (stock, unit_type) => {
  if (unit_type && unit_type !== "unidad") return unit_type;
  return stock === 1 ? "unidad" : "unidades";
};

/* ─── Definición de columnas ─────────────────────────────── */
const buildColumns = (toBs) => [
  {
    key: "name",
    label: "Producto",
    render: (val, row) => (
      <div>
        <p className="font-semibold text-white text-sm sm:text-base">{val}</p>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">ID: {row._id?.slice(-6)}</p>
      </div>
    ),
  },
  {
    key: "category",
    label: "Categoría",
    headerClassName: "hidden md:table-cell",
    className: "hidden md:table-cell",
    render: (val) => (
      <span className="bg-white/5 px-2 py-1 rounded-md text-xs border border-white/10 text-gray-400">
        {val?.name || "Sin Categoría"}
      </span>
    ),
  },
  {
    key: "price",
    label: "Precio",
    render: (val) => (
      <div>
        <p className="text-amber-500 font-medium text-sm sm:text-base">${Number(val).toFixed(2)}</p>
        <p className="text-[10px] sm:text-xs text-blue-400 mt-0.5">Bs {toBs(val).toFixed(2)}</p>
      </div>
    ),
  },
  {
    key: "stock",
    label: "Stock",
    render: (val, row) => (
      <Badge variant={stockVariant(val)}>
        {val}{" "}
        <span className="hidden sm:inline">{formatUnit(val, row.unit_type)}</span>
      </Badge>
    ),
  },
  {
    key: "barcode",
    label: "Barcode",
    headerClassName: "hidden lg:table-cell",
    className: "hidden lg:table-cell font-mono text-xs text-gray-400",
  },
];

/* ─── Componente ─────────────────────────────────────────── */
const ProductManager = () => {
  const { products, isLoading, error, fetchProducts, createProduct, updateProduct, deleteProduct } =
    useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { toBs } = useCurrencyStore();

  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [formData, setFormData]         = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);

  const totalPages      = Math.ceil(products.length / ITEMS_PER_PAGE);
  const currentProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  /* ── Handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      name:        product.name,
      description: product.description || "",
      price:       product.price,
      stock:       product.stock,
      category:    product.category?._id || product.category || "",
      unit_type:   product.unit_type || "unidad",
      barcode:     product.barcode || "",
      new_stock:   product.stock,
      stock_reason: "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Si estamos editando y el stock fue modificado manualmente
    const isStockChanged = editingId && Number(formData.new_stock) !== Number(formData.stock);
    
    if (isStockChanged && !formData.stock_reason) {
      return toast.error("Debe seleccionar un motivo para el ajuste de stock.");
    }

    const payload = { ...formData, price: Number(formData.price) };
    
    // Limpiar variables temporales y estructurar base
    if (editingId) {
      delete payload.stock; // no enviamos stock, sino new_stock
      payload.new_stock = Number(formData.new_stock);
      if (!isStockChanged) {
        delete payload.stock_reason; // no enviar motivo si no hubo cambio
      }
    } else {
      payload.stock = Number(formData.stock);
      delete payload.new_stock;
      delete payload.stock_reason;
    }

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success("Producto actualizado");
      } else {
        await createProduct(payload);
        toast.success("Producto creado");
      }
      closeForm();
    } catch {
      toast.error(error || "Ocurrió un error. Intenta de nuevo.");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteProduct(deleteTarget._id);
      toast.success("Producto eliminado exitosamente");
    } catch {
      toast.error(error || "Error al eliminar el producto.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  /* ── Estilos compartidos para selects del formulario ── */
  const selectClass =
    "w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white " +
    "focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition";

  /* ── Render ── */
  return (
    <section
      aria-labelledby="products-heading"
      className="w-full max-w-6xl mx-auto p-4 sm:p-6"
    >
      <SectionHeader
        id="products-heading"
        title={<>Gestión de <span className="text-orange-500">Productos</span></>}
        onAdd={() => setIsFormOpen(true)}
        addLabel={<><Plus size={18} /> Nuevo Producto</>}
      />

      {error && !isFormOpen && (
        <p role="alert" className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {error}
        </p>
      )}


      {/* ── Formulario ── */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingId ? "Editar Producto" : "Agregar Nuevo Producto"}
        icon={<TagIcon size={20} />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">

            <FormField
              label="Nombre del producto"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ej. iPhone 15 Pro"
            />

            {/* Categoría — select nativo */}
            <div className="flex flex-col gap-1">
              <label htmlFor="product-category" className="block text-sm font-medium text-gray-300 mb-1">
                Categoría <span className="text-orange-500" aria-hidden="true">*</span>
              </label>
              <select
                id="product-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={selectClass}
              >
                <option value="" disabled>Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <FormField
              label="Precio ($)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="Ej. 999.99"
            />

            {editingId ? (
              <div className="flex flex-col gap-1 col-span-1 md:col-span-2 p-4 border border-white/5 bg-white/5 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Stock en Estantería (Físico)
                  </label>
                  <span className="text-xs text-gray-400 bg-black/40 px-2 py-1 rounded border border-white/5">
                    Stock actual del sistema: {formData.stock}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    name="new_stock"
                    value={formData.new_stock}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Cantidad real en tienda"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition font-bold"
                  />
                  
                  {Number(formData.new_stock) !== Number(formData.stock) && (
                    <select
                      name="stock_reason"
                      value={formData.stock_reason}
                      onChange={handleChange}
                      required
                      className={selectClass}
                    >
                      <option value="" disabled>Motivo del ajuste...</option>
                      {STOCK_REASONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ) : (
              <FormField
                label="Stock Inicial"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="Ej. 50"
              />
            )}

            {/* Código de barras con botón escáner */}
            <div className="flex flex-col gap-1">
              <label htmlFor="product-barcode" className="block text-sm font-medium text-gray-300 mb-1">
                Código de Barras <span className="text-gray-500 text-xs">(Opcional)</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanBarcode
                    size={18}
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                  <input
                    id="product-barcode"
                    name="barcode"
                    type="text"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="Escanear o escribir..."
                    className="w-full pl-9 pr-3 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                  />
                </div>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  aria-label="Abrir escáner de cámara"
                  className="px-3"
                >
                  <Camera size={20} />
                </Button>
              </div>
            </div>

            {/* Unidad de medida */}
            <div className="flex flex-col gap-1">
              <label htmlFor="product-unit" className="block text-sm font-medium text-gray-300 mb-1">
                Unidad de Medida <span className="text-orange-500" aria-hidden="true">*</span>
              </label>
              <select
                id="product-unit"
                name="unit_type"
                value={formData.unit_type}
                onChange={handleChange}
                required
                className={selectClass}
              >
                {UNIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <FormField
            as="textarea"
            label="Descripción"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Detalles sobre el producto..."
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={closeForm}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              {editingId ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>

      <DataTable
        columns={buildColumns(toBs)}
        data={currentProducts}
        isLoading={isLoading && !isFormOpen}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        emptyMessage="No hay productos"
        emptyIcon={<PackageOpen size={30} />}
        emptyDetail="Aún no has agregado ningún producto al inventario."
        emptyAction={{ label: "Agregar mi primer producto", onClick: () => setIsFormOpen(true) }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* ── Confirmación de borrado ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        message={`¿Eliminar "${deleteTarget?.name}"?`}
        detail="Esta acción no se puede deshacer y eliminará el producto del inventario."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isLoading}
      />

      {/* ── Escáner de código de barras ── */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          setFormData((prev) => ({ ...prev, barcode: code }));
          setIsScannerOpen(false);
          toast.success(`Código detectado: ${code}`);
        }}
      />
    </section>
  );
};

export default ProductManager;
