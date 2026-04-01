import Button from "../atoms/Button";

/**
 * SectionHeader — Molécula: encabezado de sección con h2 + ícono + botón de acción.
 *
 * @param {string}          id       - id del <h2> para aria-labelledby.
 * @param {string}          title    - Título de la sección.
 * @param {React.ReactNode} icon     - Ícono a la izquierda del título.
 * @param {function}        onAdd    - Callback del botón "Agregar" (omite el botón si no se pasa).
 * @param {string}          addLabel - Texto del botón (default: "Agregar").
 * @param {React.ReactNode} actions  - Acciones alternativas (reemplaza botón "Agregar").
 * @param {string}          className
 */
const SectionHeader = ({
  id,
  title,
  icon,
  onAdd,
  addLabel = "Agregar",
  actions,
  className = "",
}) => (
  <header
    className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 ${className}`}
  >
    <h2
      id={id}
      className="text-2xl sm:text-3xl font-bold text-white tracking-wide flex items-center gap-2"
    >
      {icon && <span className="text-orange-500">{icon}</span>}
      {title}
    </h2>

    {actions ?? (
      onAdd && (
        <Button variant="primary" onClick={onAdd} className="w-full sm:w-auto">
          {addLabel}
        </Button>
      )
    )}
  </header>
);

export default SectionHeader;
