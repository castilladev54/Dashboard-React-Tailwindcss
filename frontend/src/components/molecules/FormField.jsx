import { forwardRef } from "react";
import Label from "../atoms/Label";

/**
 * FormField — Molécula: Label + input/textarea + mensaje de error.
 *
 * @param {string}  label     - Texto del label visible.
 * @param {string}  error     - Mensaje de error (opcional).
 * @param {boolean} required  - Marca el campo como requerido.
 * @param {'input'|'textarea'} as - Tipo de elemento a renderizar.
 * @param {string}  className - Clases extra para el wrapper.
 *
 * El resto de props se pasan directo al <input> o <textarea>.
 */
const baseInputClass =
  "w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 " +
  "focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition";

const FormField = forwardRef(
  ({ label, error, required = false, as: Tag = "input", className = "", rows = 3, ...rest }, ref) => (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <Label htmlFor={rest.id || rest.name}>
          {label}
          {required && <span className="text-orange-500 ml-0.5" aria-hidden="true">*</span>}
        </Label>
      )}

      <Tag
        ref={ref}
        id={rest.id || rest.name}
        rows={Tag === "textarea" ? rows : undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `${rest.name}-error` : undefined}
        className={`${baseInputClass} ${error ? "border-red-500/50 focus:ring-red-500/30" : ""}`}
        {...rest}
      />

      {error && (
        <p id={`${rest.name}-error`} role="alert" className="text-red-400 text-xs mt-0.5">
          {error}
        </p>
      )}
    </div>
  )
);

FormField.displayName = "FormField";
export default FormField;
