"use client";

import { useState, useEffect } from "react";
import { Share, PlusSquare, X, Smartphone, Download, ArrowUp, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed or in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // For Android/Chrome
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Logic to show prompt after some time or interaction
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-dismissed');
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    // For iOS, we show it manually as there's no event
    if (isIOSDevice) {
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-dismissed');
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-200 dark:border-white/10"
          >
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-20 h-20 mb-6 group">
                  <div className="absolute inset-0 bg-indigo-600/20 blur-2xl rounded-full group-hover:bg-indigo-600/30 transition-all" />
                  <div className="relative bg-indigo-600 p-5 rounded-[1.5rem] shadow-xl shadow-indigo-500/20 flex items-center justify-center">
                    <Smartphone className="w-10 h-10 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                  Instalar Mia
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium mb-8">
                  Agrega Mia a tu pantalla de inicio para una experiencia más rápida y segura.
                </p>

                <div className="w-full bg-slate-50 dark:bg-white/5 rounded-3xl p-5 mb-8 border border-slate-100 dark:border-white/5">
                  {isIOS ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                          <Share className="w-4 h-4 text-indigo-600" />
                        </div>
                        <p className="text-[11px] font-bold text-left text-slate-700 dark:text-slate-300">
                          Toca <span className="text-indigo-600">Compartir</span> en el navegador.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                          <PlusSquare className="w-4 h-4 text-indigo-600" />
                        </div>
                        <p className="text-[11px] font-bold text-left text-slate-700 dark:text-slate-300">
                          Selecciona <span className="text-indigo-600">"Agregar a inicio"</span>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
                        <Download className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-[11px] font-bold text-left text-slate-700 dark:text-slate-300">
                        Instala directamente como una aplicación nativa.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col w-full gap-3">
                  {!isIOS ? (
                    <button
                      onClick={handleInstall}
                      className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      Instalar Ahora
                    </button>
                  ) : (
                    <button
                      onClick={dismissPrompt}
                      className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      ¡Entendido!
                    </button>
                  )}
                  <button
                    onClick={dismissPrompt}
                    className="w-full py-4 bg-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    Quizás más tarde
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
