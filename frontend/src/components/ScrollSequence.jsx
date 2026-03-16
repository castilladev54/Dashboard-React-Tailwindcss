import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, animate, useMotionValue, useScroll, useTransform } from "framer-motion";

const milestones = [
    "Veterinario a casa",
    "Atención Canina",
    "Atención Felina",
    "Diagnóstico",
    "Emergencias",
    "Móvil Asistavet"
];

const MilestoneText = ({ text, index, total, progress }) => {
    // Definimos el rango de aparición y desaparición de este texto individual.
    const start = index / total;
    const end = (index + 1) / total;
    const peak = (start + end) / 2;

    const opacity = useTransform(progress, [start, peak, end], [0, 1, 0]);
    const x = useTransform(progress, [start, peak, end], [20, 0, 20]);

    return (
        <motion.div
            style={{ opacity, x }}
            className="absolute right-6 md:right-16 top-1/2 -translate-y-1/2 border-l-2 border-orange-500/80 pl-4 py-2 max-w-[220px]"
        >
            <h3 className="text-2xl md:text-3xl font-bold text-white/90 drop-shadow-md leading-tight">{text}</h3>
        </motion.div>
    );
};

/**
 * ScrollSequence Component: Asistavet Neon Animation
 * - Triggers automatically when visible using useInView.
 * - Animates 35 frames in 2 seconds.
 * - High-end visual fusion with mix-blend-mode and mask-image.
 * - Synchronized side texts driven manually by user scroll.
 */
const ScrollSequence = () => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.1, once: false });

    const [imagesLoaded, setImagesLoaded] = useState(false);
    const imagesArrayRef = useRef([]);
    const currentFrameValue = useMotionValue(1);
    const [isAnimating, setIsAnimating] = useState(false);

    // Rastreamos el progreso global del contenedor (400vh)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Carga de imágenes
    useEffect(() => {
        let isMounted = true;
        const totalFrames = 35;
        const loadedImages = [];

        const preload = async () => {
            for (let i = 1; i <= totalFrames; i++) {
                if (!isMounted) return;
                const img = new Image();
                img.src = new URL(`../assets/01 (${i}).webp`, import.meta.url).href;

                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
                loadedImages.push(img);
            }
            if (isMounted) {
                imagesArrayRef.current = loadedImages;
                setImagesLoaded(true);
                renderFrame(1);
            }
        };

        const renderFrame = (index) => {
            const canvas = canvasRef.current;
            if (!canvas || !imagesArrayRef.current[index - 1]) return;
            const ctx = canvas.getContext("2d", { alpha: true });
            const img = imagesArrayRef.current[index - 1];

            const canvasWidth = window.innerWidth;
            const canvasHeight = window.innerHeight;
            
            // Only update canvas dimensions if they changed to prevent flicker
            if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
            }
            
            const isMobile = canvasWidth < 768;

            // Masive zoom on mobile to prevent huge unrendered gaps
            const scaleMultiplier = isMobile ? 2.5 : 0.85;
            const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height) * scaleMultiplier;
            
            // Pull the image slightly up on mobile to fuse better with the Hero
            const verticalOffset = isMobile ? canvasHeight * -0.05 : 0;

            const x = (canvasWidth / 2) - (img.width / 2) * scale;
            const y = (canvasHeight / 2) - (img.height / 2) * scale + verticalOffset;

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };

        preload();

        const handleResize = () => {
            renderFrame(Math.round(currentFrameValue.get()));
        };
        window.addEventListener("resize", handleResize);

        const unsubscribe = currentFrameValue.on("change", (latest) => {
            renderFrame(Math.round(latest));
        });

        return () => {
            isMounted = false;
            unsubscribe();
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Disparador de animación de video (independiente del scroll)
    useEffect(() => {
        if (isInView && imagesLoaded && !isAnimating) {
            setIsAnimating(true);
            animate(currentFrameValue, 35, {
                duration: 2,
                ease: "linear",
            });
        }
    }, [isInView, imagesLoaded]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[400vh] bg-[#020617]"
        >
            <div
                className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden"
                style={{
                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 100%)",
                    maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 100%)"
                }}
            >
                {/* 1. VISUAL FUSION: Radial Gradient Wrapper */}
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[80vw] h-[80vw] bg-orange-500/5 rounded-full blur-[120px]"></div>
                </div>

                {/* 2. CANVAS WITH MASK AND SCREEN BLEND */}
                <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full object-contain"
                        style={{
                            WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 90%)",
                            maskImage: "radial-gradient(circle, black 40%, transparent 90%)",
                            mixBlendMode: "screen",
                            filter: "drop-shadow(0 0 30px rgba(249, 115, 22, 0.4))",
                            opacity: imagesLoaded ? 1 : 0,
                            transition: "opacity 0.8s ease"
                        }}
                    />
                </div>

                {/* 3. TEXTOS LATERALES (Ligados al scroll manual) */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {milestones.map((text, i) => (
                        <MilestoneText
                            key={i}
                            text={text}
                            index={i}
                            total={milestones.length}
                            progress={scrollYProgress}
                        />
                    ))}
                </div>

                {/* 4. AMBIENT GLOW OVERLAY */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#020617] via-transparent to-[#020617]"></div>
            </div>
        </div>
    );
};

export default ScrollSequence;
