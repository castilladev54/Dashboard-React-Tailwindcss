import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import { heroContent } from "../constants";
import ScrollSequence from "../components/ScrollSequence";

const HomePage = () => {
    // Rastrear el scroll global para la transición del Hero
    const { scrollY } = useScroll();
    // El Hero desaparece (opacidad 1 -> 0) y sube (y 0 -> -100) en los primeros 500px de scroll
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
    const heroY = useTransform(scrollY, [0, 500], [0, -100]);

    return (
        <main className="relative w-full bg-[#020617]">
            {/* 1. SECCIÓN HERO: Texto principal. Conserva su altura pero ajustamos el padding y eliminamos overflow-hidden */}
            <motion.section
                style={{ opacity: heroOpacity, y: heroY }}
                className="relative w-full min-h-[90vh] flex flex-col items-start justify-center text-left px-6 md:px-16 lg:px-24 pt-32 pb-20 z-20"
            >
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-5xl w-full"
                >
                    {/* Logo / Icono Principal */}
                    <div className="mb-8 flex justify-start">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/30 backdrop-blur-xl drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                            <span className="text-4xl md:text-5xl drop-shadow-lg">🐾</span>
                        </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#f8fafc] mb-6 leading-tight flex flex-col items-start">
                        <span className="mb-2">🐾 Asistavet de Venezuela</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 text-4xl sm:text-5xl md:text-6xl lg:text-6xl mt-1">
                            {heroContent.titleGradient}
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed font-light italic">
                        {heroContent.description}
                    </p>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-orange-500/40 pointer-events-none z-30"
                >
                    <span className="text-[10px] tracking-[0.4em] uppercase font-bold text-orange-500/60">Hacia abajo</span>
                    <div className="w-[1px] h-16 bg-gradient-to-b from-orange-500/60 to-transparent"></div>
                </motion.div>
            </motion.section>

            {/* CTA FLOTANTE PERSISTENTE: Se mantienen fijos y encima de todo */}
            <div className="fixed bottom-8 left-6 md:left-16 lg:left-24 z-50 flex flex-col sm:flex-row items-center sm:items-start justify-start gap-5 pointer-events-none w-[calc(100%-3rem)] md:w-auto">
                <Link to="https://wa.me/5804260383454" className="pointer-events-auto w-full sm:w-auto">
                    <Button className="py-3 px-8 md:py-4 md:px-10 text-lg md:text-xl w-full shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:shadow-[0_0_40px_rgba(249,115,22,0.8)] transition-all">
                        {heroContent.buttonPrimary}
                    </Button>
                </Link>
                <Link to="/signup" className="pointer-events-auto w-full sm:w-auto">
                    <button className="py-3 px-8 md:py-4 md:px-10 text-lg md:text-xl w-full font-semibold text-white/90 hover:text-white border border-white/10 hover:border-amber-500/50 hover:bg-white/5 bg-[#020617]/50 rounded-xl transition-all duration-300 backdrop-blur-md">
                        {heroContent.buttonSecondary}
                    </button>
                </Link>
            </div>

            {/* 2. SECCIÓN ANIMACIÓN: Sticky Secuestro de Pantalla */}
            <div className="relative w-full z-10 bg-[#020617] mt-[-10vh]">
                <ScrollSequence />
            </div>
        </main>
    );
};

export default HomePage;