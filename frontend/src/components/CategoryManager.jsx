import { useEffect, useState } from "react";
import { Tag, Plus } from "lucide-react";
import { useCategoryStore } from "../store/categoryStore";
import toast from "react-hot-toast";

import Button from "./atoms/Button";
import Modal from "./molecules/Modal";
import SectionHeader from "./molecules/SectionHeader";
import ConfirmDialog from "./molecules/ConfirmDialog";
import FormField from "./molecules/FormField";
import DataTable from "./organisms/DataTable";

const ITEMS_PER_PAGE = 10;

const COLUMNS = [
  {
    key: "name",
    label: "Nombre",
    render: (val, row) => (
      <div>
        <p className="font-semibold text-white text-sm sm:text-base">{val}</p>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">ID: {row._id?.slice(-6)}</p>
      </div>
    ),
  },
  {
    key: "description",
    label: "Descripción",
    headerClassName: "hidden md:table-cell",
    className: "hidden md:table-cell text-gray-400 max-w-xs truncate",
  },
];

const EMPTY_FORM = { name: "", description: "" };

const CategoryManager = () => {
  const {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryStore();

  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [formData, setFormData]         = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage]   = useState(1);

  const totalPages       = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const currentCategories = categories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  /* ── Handlers ── */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setFormData({ name: category.name, description: category.description });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCategory(editingId, formData);
        toast.success("Categoría actualizada");
      } else {
        await createCategory(formData);
        toast.success("Categoría creada");
      }
      closeForm();
    } catch {
      toast.error(error || "Ocurrió un error. Intenta de nuevo.");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCategory(deleteTarget._id);
      toast.success("Categoría eliminada exitosamente");
    } catch {
      toast.error(error || "Error al eliminar la categoría. ¿Tiene productos activos?");
    } finally {
      setDeleteTarget(null);
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  /* ── Render ── */
  return (
    <section
      aria-labelledby="category-heading"
      className="w-full max-w-4xl mx-auto p-4 sm:p-6"
    >
      <SectionHeader
        id="category-heading"
        title={<>Gestión de <span className="text-orange-500">Categorías</span></>}
        onAdd={() => setIsFormOpen(true)}
        addLabel={<><Plus size={18} /> Nueva Categoría</>}
      />

      {error && !isFormOpen && (
        <p role="alert" className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {error}
        </p>
      )}

      <DataTable
        columns={COLUMNS}
        data={currentCategories}
        isLoading={isLoading && !isFormOpen}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        emptyMessage="No hay categorías"
        emptyDetail="Aún no has agregado ninguna categoría a tu inventario."
        emptyAction={{ label: "Agregar mi primera categoría", onClick: () => setIsFormOpen(true) }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Formulario */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingId ? "Editar Categoría" : "Agregar Nueva Categoría"}
        icon={<Tag size={20} />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Nombre de la categoría"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Ej. Laptops, Teléfonos..."
          />
          <FormField
            as="textarea"
            label="Descripción"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            placeholder="Breve descripción de la categoría..."
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

      {/* Confirmación de borrado */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        message={`¿Eliminar "${deleteTarget?.name}"?`}
        detail="Esta acción no se puede deshacer. Las categorías con productos activos no pueden eliminarse."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isLoading}
      />
    </section>
  );
};

export default CategoryManager;
