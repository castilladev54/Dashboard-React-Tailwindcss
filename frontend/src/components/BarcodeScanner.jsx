import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, RefreshCw, Volume2, VolumeX } from "lucide-react";
import Button from "./Button";
import toast from "react-hot-toast";

const BarcodeScanner = ({ onScan, onClose, isOpen }) => {
  const scannerRef = useRef(null);
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment"); // default back camera
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play beep sound on scan
  const playBeep = () => {
    if (!soundEnabled) return;
    const beep = new Audio("/beep.mp3"); // Ensure this file exists in public folder or use a remote one
    beep.play().catch(() => {}); // Catch browser blocking autoplay
  };

  useEffect(() => {
    if (isOpen) {
      const scanner = new Html5Qrcode("scanner-container");
      setHtml5QrCode(scanner);
      setIsScanning(true);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
      };

      scanner.start(
        { facingMode: cameraFacingMode },
        config,
        (decodedText) => {
          playBeep();
          if (navigator.vibrate) navigator.vibrate(200);
          onScan(decodedText);
          // Wait briefly before closing to show feedback
          setTimeout(() => {
            scanner.stop().then(() => {
              onClose();
            }).catch(console.error);
          }, 300);
        },
        (errorMessage) => {
          // ignore scan errors
        }
      ).catch((err) => {
        console.error("Camera error:", err);
        toast.error("Error al acceder a la cámara. Permite los permisos necesarios.");
        onClose();
      });

      return () => {
        if (scanner && scanner.isScanning) {
          scanner.stop().catch(console.error);
        }
      };
    }
  }, [isOpen, cameraFacingMode]);

  const toggleCamera = () => {
    setCameraFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.9 }}
           className="relative w-full max-w-lg bg-[#1a1a24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-2">
              <Camera size={20} className="text-orange-500" />
              <h3 className="text-lg font-bold text-white">Escanear Código</h3>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="sm" onClick={() => setSoundEnabled(!soundEnabled)} title={soundEnabled ? "Silenciar" : "Activar Sonido"}>
                 {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
               </Button>
               <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition">
                 <X size={24} />
               </button>
            </div>
          </div>

          {/* Scanner Area */}
          <div className="relative aspect-video bg-black/40 flex items-center justify-center">
            <div id="scanner-container" className="w-full h-full"></div>
            
            {/* Overlay/Target Frame */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-[260px] h-[160px] border-2 border-orange-500/50 rounded-xl relative">
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-lg"></div>
                  
                  {/* Scanning Animation Line */}
                  <motion.div 
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute left-2 right-2 h-0.5 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)] z-10"
                  />
              </div>
              <p className="text-white/60 text-xs mt-6 font-medium tracking-widest uppercase">Alinea el código de barras aquí</p>
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 flex justify-center gap-4 bg-black/40">
            <Button variant="secondary" onClick={toggleCamera} className="gap-2 bg-white/5 border-white/10">
              <RefreshCw size={18} /> Cambiar Cámara
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BarcodeScanner;
