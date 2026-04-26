"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, SparklesIcon } from "@heroicons/react/24/outline";

interface ViewTutorialModalProps {
  viewId: string;
  title: string;
  description: string;
}

export function ViewTutorialModal({ viewId, title, description }: ViewTutorialModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storageKey = `mia_hide_tutorial_${viewId}`;
    const hideTutorial = localStorage.getItem(storageKey);
    if (!hideTutorial) {
      setIsOpen(true);
    }
  }, [viewId]);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem(`mia_hide_tutorial_${viewId}`, "true");
    }
    setIsOpen(false);
  };

  if (!isMounted || !isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <SparklesIcon className="w-8 h-8" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {description}
              </p>
            </div>

            <div className="w-full pt-4 space-y-4">
              <label className="flex items-center justify-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <div className="relative flex items-center justify-center w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-transparent group-hover:border-blue-500 transition-colors">
                  <input 
                    type="checkbox" 
                    className="absolute opacity-0 cursor-pointer w-full h-full"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                  />
                  {dontShowAgain && <CheckCircleIcon className="w-4 h-4 text-blue-600" />}
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 select-none">
                  No volver a mostrar en esta sección
                </span>
              </label>

              <button 
                onClick={handleContinue}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                Entendido, Continuar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
