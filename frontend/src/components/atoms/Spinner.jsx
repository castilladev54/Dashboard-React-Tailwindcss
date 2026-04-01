import { motion } from "framer-motion";

/**
 * Spinner — Átomo de carga reutilizable.
 *
 * @param {'sm'|'md'|'lg'|'page'} size - Tamaño del spinner.
 * @param {string} className
 *
 * Uso:
 *   <Spinner />               — inline dentro de sección
 *   <Spinner size="page" />   — pantalla completa (reemplaza LoadingSpinner.jsx)
 */
const sizeMap = {
  sm:   "w-5 h-5 border-2",
  md:   "w-8 h-8 border-2",
  lg:   "w-12 h-12 border-[3px]",
  page: "w-16 h-16 border-4",
};

const Spinner = ({ size = "md", className = "" }) => {
  const isPage = size === "page";

  const spinner = (
    <motion.div
      role="status"
      aria-label="Cargando"
      className={`${sizeMap[size] ?? sizeMap.md} border-t-amber-500 border-r-orange-600 border-b-orange-900 border-l-transparent rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );

  if (isPage) {
    return (
      <div className="min-h-screen w-full bg-[#050300] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Spinner;
