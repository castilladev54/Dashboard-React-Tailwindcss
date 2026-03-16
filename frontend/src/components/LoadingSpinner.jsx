import { motion } from "framer-motion";

const LoadingSpinner = () => {
  return (
    <div className='min-h-screen w-full bg-[#050300] flex items-center justify-center relative overflow-hidden'>
      {/* Capa de Ruido para mantener consistencia con el fondo Nebula */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Spinner Estelar: Gradiente animado Naranja-Ámbar sobre negro */}
      <motion.div
        className='w-16 h-16 border-4 border-t-amber-500 border-r-orange-600 border-b-orange-900 border-l-transparent rounded-full z-10'
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

export default LoadingSpinner;