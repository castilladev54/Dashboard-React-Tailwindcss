import Button from "../atoms/Button";

/**
 * EmptyState — Molécula: estado vacío genérico.
 *
 * @param {React.ReactNode}           icon    - Ícono central.
 * @param {string}                    message - Mensaje principal.
 * @param {string}                    detail  - Texto secundario (opcional).
 * @param {{ label: string, onClick }} action  - Botón de acción opcional.
 * @param {string}                    className
 */
const EmptyState = ({ icon, message, detail, action, className = "" }) => (
  <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
    {icon && (
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-gray-500 mb-4">
        {icon}
      </div>
    )}
    <p className="text-lg font-semibold text-white mb-1">{message}</p>
    {detail && <p className="text-sm text-gray-400 mb-6">{detail}</p>}
    {action && (
      <Button variant="outline" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);

export default EmptyState;
