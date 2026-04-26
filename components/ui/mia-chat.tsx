"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, AlertTriangle } from "lucide-react";
import Image from "next/image";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function MiaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [hasAcceptedWarning, setHasAcceptedWarning] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem("mia_patient_profile");
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
    } catch {}
    
    const accepted = localStorage.getItem("mia-chat-warning-accepted");
    if (accepted === "true") {
      setHasAcceptedWarning(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);

  const toggleChat = () => {
    if (!isOpen) {
      if (!hasAcceptedWarning) {
        setShowWarning(true);
      }
    }
    setIsOpen(!isOpen);
  };

  const acceptWarning = () => {
    localStorage.setItem("mia-chat-warning-accepted", "true");
    setHasAcceptedWarning(true);
    setShowWarning(false);
    if (history.length === 0) {
      setHistory([
        { role: "assistant", content: `¡Hola${profile.nombre ? " " + profile.nombre : ""}! Soy Mia. ¿En qué te puedo ayudar hoy con tu salud?` }
      ]);
    }
  };

  const cancelWarning = () => {
    setShowWarning(false);
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen && hasAcceptedWarning && history.length === 0) {
      setHistory([
        { role: "assistant", content: `¡Hola${profile.nombre ? " " + profile.nombre : ""}! Soy Mia. ¿En qué te puedo ayudar hoy con tu salud?` }
      ]);
    }
  }, [isOpen, hasAcceptedWarning, history.length, profile.nombre]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage("");
    const newHistory = [...history, { role: "user" as const, content: userMessage }];
    setHistory(newHistory);
    setIsLoading(true);

    try {
      const res = await fetch("/api/deepseek/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: history.slice(-6), profile })
      });
      const data = await res.json();
      
      if (data.reply) {
        setHistory([...newHistory, { role: "assistant", content: data.reply }]);
      } else {
        setHistory([...newHistory, { role: "assistant", content: "Lo siento, tuve un problema al procesar tu solicitud." }]);
      }
    } catch (e) {
      setHistory([...newHistory, { role: "assistant", content: "Lo siento, hay un error de conexión." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-28 md:bottom-6 right-6 z-[100]">
        <AnimatePresence>
          {isOpen && !showWarning && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-[#3649cc] text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/icon.png" alt="Mia" className="w-5 h-5 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Mia Health Assistant</h3>
                    <p className="text-[10px] text-white/80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      En línea
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-black/50">
                {history.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-[#3649cc] text-white rounded-br-sm" 
                        : "bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-bl-sm shadow-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-zinc-800 border border-slate-100 dark:border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-[#3649cc]/60 dark:bg-indigo-400/60 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-[#3649cc]/60 dark:bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                      <div className="w-1.5 h-1.5 bg-[#3649cc]/60 dark:bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-white/10 shrink-0">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu consulta médica..."
                    className="flex-1 h-12 bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/10 rounded-full px-5 text-sm outline-none focus:border-[#3649cc] dark:text-white transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="w-12 h-12 bg-[#3649cc] hover:bg-[#2b3aa3] text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-all shrink-0 active:scale-95"
                  >
                    <Send className="w-5 h-5 -ml-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggleChat}
          className="w-14 h-14 bg-[#3649cc] hover:bg-[#2b3aa3] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(54,73,204,0.4)] transition-all hover:scale-105 active:scale-95 relative z-10"
        >
          <AnimatePresence mode="wait">
            {isOpen && !showWarning ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <MessageCircle className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {showWarning && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={cancelWarning}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-2xl border border-slate-200 dark:border-white/10"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-full flex items-center justify-center shadow-inner">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-xl font-black text-center mb-4 text-slate-900 dark:text-white">Aviso Importante</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 text-center leading-relaxed font-medium">
                La IA puede cometer errores. En caso de presentar síntomas graves, es muy recomendable que visites a tu médico más cercano. 
                <br /><br />
                <strong className="text-[#3649cc] dark:text-indigo-400 font-bold">Mia</strong> está para apoyarte con consultas sobre medicamentos, enfermedades, síntomas y hábitos saludables, pero <strong className="text-rose-500 font-bold">no es capaz de diagnosticar a un paciente</strong> formalmente.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={cancelWarning}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={acceptWarning}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-[#3649cc] hover:bg-[#2b3aa3] shadow-lg shadow-[#3649cc]/20 transition-all active:scale-95"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
