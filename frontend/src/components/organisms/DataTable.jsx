import { motion } from "framer-motion";
import { Edit2, Trash2 } from "lucide-react";
import Button from "../atoms/Button";
import Spinner from "../atoms/Spinner";
import EmptyState from "../molecules/EmptyState";
import Pagination from "../molecules/Pagination";

/**
 * DataTable — Organismo: tabla de datos genérica y reutilizable.
 *
 * @param {Array}   columns      - Definición de columnas:
 *   [{ key: string, label: string, render?: (value, row) => ReactNode, className?: string }]
 * @param {Array}   data         - Filas de datos.
 * @param {boolean} isLoading    - Muestra spinner mientras carga.
 * @param {function} onEdit      - Callback al pulsar editar (recibe el objeto fila). Omite columna si no se pasa.
 * @param {function} onDelete    - Callback al pulsar eliminar (recibe el objeto fila). Omite columna si no se pasa.
 * @param {string}  emptyMessage - Texto cuando no hay datos.
 * @param {React.ReactNode} emptyIcon - Ícono del estado vacío.
 * @param {string}  emptyDetail  - Subtexto del estado vacío.
 * @param {{ label, onClick }} emptyAction - Botón de acción en el estado vacío.
 * @param {number}  currentPage  - Página actual (activa paginación si se pasa).
 * @param {number}  totalPages   - Total de páginas.
 * @param {function} onPageChange - Callback de cambio de página.
 * @param {string}  className
 */
const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  onEdit,
  onDelete,
  emptyMessage = "No hay registros.",
  emptyIcon,
  emptyDetail,
  emptyAction,
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  const hasActions = onEdit || onDelete;

  return (
    <div className={`bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-xl ${className}`}>
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          message={emptyMessage}
          detail={emptyDetail}
          action={emptyAction}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/20 text-gray-400 text-xs sm:text-sm uppercase tracking-wider">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={`px-4 py-3 sm:px-6 sm:py-4 font-medium ${col.headerClassName ?? ""}`}
                    >
                      {col.label}
                    </th>
                  ))}
                  {hasActions && (
                    <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 font-medium text-right">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {data.map((row, rowIndex) => (
                  <motion.tr
                    key={row._id ?? row.id ?? rowIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: rowIndex * 0.04 }}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 sm:px-6 sm:py-4 text-gray-300 text-sm ${col.className ?? ""}`}
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : (row[col.key] ?? "—")}
                      </td>
                    ))}

                    {hasActions && (
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {onEdit && (
                            <Button
                              variant="icon"
                              onClick={() => onEdit(row)}
                              aria-label={`Editar registro`}
                              className="text-blue-400 hover:bg-blue-500/10 p-1.5 sm:p-2"
                            >
                              <Edit2 size={16} />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="icon"
                              onClick={() => onDelete(row)}
                              aria-label={`Eliminar registro`}
                              className="text-red-400 hover:bg-red-500/10 p-1.5 sm:p-2"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DataTable;
