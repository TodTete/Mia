"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../lib/firebase/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ref, onValue, set, serverTimestamp, get } from "firebase/database";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { 
  ArrowLeftIcon, 
  HeartIcon, 
  MoonIcon, 
  CakeIcon, 
  BoltIcon, 
  ChartBarIcon, 
  PlusIcon, 
  CalendarIcon, 
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  ScaleIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  ExclamationTriangleIcon as AlertTriangleIcon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ViewTutorialModal } from "@/components/ui/view-tutorial-modal";

interface VitalStat {
  label: string;
  key: string;
  icon: any;
  val: string | number;
  unit: string;
  color: string;
  bg: string;
  borderColor: string;
}

export default function RegistroSaludPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [vitals, setVitals] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedStat, setSelectedStat] = useState<VitalStat | null>(null);
  const [newValue, setNewValue] = useState("");
  const [statHistory, setStatHistory] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const vitalsRef = ref(db, `users/${u.uid}/health/vitals`);
        onValue(vitalsRef, (snapshot) => {
          const loadedVitals = snapshot.exists() ? snapshot.val() : {};
          try {
            const profileStr = localStorage.getItem("mia_patient_profile");
            if (profileStr) {
              const profile = JSON.parse(profileStr);
              if (profile.peso && !loadedVitals.peso) {
                loadedVitals.peso = { val: profile.peso, timestamp: Date.now() };
              }
            }
          } catch {}
          setVitals(loadedVitals);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch history when a stat is selected
  useEffect(() => {
    if (user && selectedStat) {
      const historyRef = ref(db, `users/${user.uid}/health/history/${selectedStat.key}`);
      const unsubscribe = onValue(historyRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const list = Object.values(data).reverse().slice(0, 5); // Last 5
          setStatHistory(list);
        } else {
          setStatHistory([]);
        }
      });
      return () => unsubscribe();
    }
  }, [user, selectedStat]);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateStat = async () => {
    if (!user || !selectedStat || !newValue) return;
    setIsSaving(true);
    
    const measurement = {
      val: newValue,
      timestamp: Date.now(),
      key: selectedStat.key,
      label: selectedStat.label,
      unit: selectedStat.unit
    };

    try {
      // 1. Update Latest Value
      const statRef = ref(db, `users/${user.uid}/health/vitals/${selectedStat.key}`);
      await set(statRef, {
        val: newValue,
        timestamp: serverTimestamp()
      });

      // 2. Push to History
      const { push: firebasePush } = await import("firebase/database");
      const historyRef = ref(db, `users/${user.uid}/health/history/${selectedStat.key}`);
      await firebasePush(historyRef, {
        val: newValue,
        timestamp: serverTimestamp()
      });
      
      showToast(`${selectedStat.label} actualizado`);
      setSelectedStat(null);
      setNewValue("");
    } catch (e: any) {
      showToast("Error al guardar: " + e.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Sync effect when coming back online
  useEffect(() => {
    const handleOnline = async () => {
      if (!user) return;
      const localKey = `mia_pending_sync_${user.uid}`;
      const pending = JSON.parse(localStorage.getItem(localKey) || "[]");
      if (pending.length > 0) {
        showToast("Sincronizando datos pendientes...", "info");
        for (const item of pending) {
          try {
            const statRef = ref(db, `users/${user.uid}/health/vitals/${item.key}`);
            await set(statRef, { val: item.val, timestamp: serverTimestamp() });
          } catch (e) { break; }
        }
        localStorage.setItem(localKey, "[]");
        showToast("Datos sincronizados con éxito");
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const handleGenerateState = async () => {
    if (!user) return;
    setGenerating(true);
    setAiReport(null);
    try {
      const profileStr = localStorage.getItem("mia_patient_profile");
      const res = await fetch("/api/deepseek/generate-health-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vitals, profile: profileStr ? JSON.parse(profileStr) : {} })
      });
      const data = await res.json();
      if (data.report) {
        setAiReport(data.report);
      } else {
        showToast("No se pudo generar el informe.", "error");
      }
    } catch (e) {
      showToast("Error de conexión con la IA.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const vitalStats: VitalStat[] = [
    { 
      label: "Presión Art.", 
      key: "presion", 
      icon: ChartBarIcon, 
      val: vitals.presion?.val || "--", 
      unit: "mmHg", 
      color: "text-rose-500", 
      bg: "bg-rose-50 dark:bg-rose-500/10",
      borderColor: "border-rose-100 dark:border-rose-500/20"
    },
    { 
      label: "Oxigenación", 
      key: "oxigeno", 
      icon: BeakerIcon, 
      val: vitals.oxigeno?.val || "--", 
      unit: "%", 
      color: "text-blue-500", 
      bg: "bg-blue-50 dark:bg-blue-500/10",
      borderColor: "border-blue-100 dark:border-blue-500/20"
    },
    { 
      label: "Temperatura", 
      key: "temperatura", 
      icon: BeakerIcon, 
      val: vitals.temperatura?.val || "--", 
      unit: "°C", 
      color: "text-orange-500", 
      bg: "bg-orange-50 dark:bg-orange-500/10",
      borderColor: "border-orange-100 dark:border-orange-500/20"
    },
    { 
      label: "Peso", 
      key: "peso", 
      icon: ScaleIcon, 
      val: vitals.peso?.val || "--", 
      unit: "kg", 
      color: "text-emerald-500", 
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      borderColor: "border-emerald-100 dark:border-emerald-500/20"
    },
    { 
      label: "Frec. Cardíaca", 
      key: "ritmo", 
      icon: HeartIcon, 
      val: vitals.ritmo?.val || "--", 
      unit: "bpm", 
      color: "text-red-500", 
      bg: "bg-red-50 dark:bg-red-500/10",
      borderColor: "border-red-100 dark:border-red-500/20"
    },
    { 
      label: "Glucosa", 
      key: "glucosa", 
      icon: BeakerIcon, 
      val: vitals.glucosa?.val || "--", 
      unit: "mg/dL", 
      color: "text-violet-500", 
      bg: "bg-violet-50 dark:bg-violet-500/10",
      borderColor: "border-violet-100 dark:border-violet-500/20"
    },
  ];

  const isAllFilled = vitalStats.every(s => s.val !== "--");

  return (
    <main className="min-h-screen bg-[#fcfcfd] dark:bg-[#050505] text-slate-900 dark:text-white pb-32 overflow-x-hidden font-manrope">
      <ViewTutorialModal 
        viewId="registro-salud"
        title="Registro de Signos Vitales"
        description="Lleva un registro diario de tu salud (presión, glucosa, peso, etc.). Mia utilizará estos datos para detectar anomalías y brindarte alertas tempranas si algo se sale de rango."
      />
      {/* Background Decorative */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-500/5 blur-[120px] rounded-full animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-black/70 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5 h-16 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 group-hover:bg-blue-500/10 transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-slate-500 group-hover:text-blue-500 transition-colors" />
          </div>
          <span className="text-sm font-bold text-slate-500">Inicio</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-12">
        {/* Intro Section */}
        <section className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3345CC]/10 text-[#3345CC] text-[10px] font-black uppercase tracking-widest mb-6">
            <ChartBarIcon className="w-3.5 h-3.5" />
            Salud Preventiva
          </div>
          <h1 className="text-3xl sm:text-6xl font-black tracking-tight mb-4 leading-[1.1]">
            Registro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 block sm:inline">Bienestar</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl leading-relaxed">
            Monitorea tus signos vitales y hábitos diarios para que <span className="text-blue-600 font-bold">Mia</span> pueda darte mejores recomendaciones.
          </p>
        </section>

        <div className="flex justify-center">
          <div className="w-full max-w-4xl space-y-16">
            
            {/* Vital Signs Grid */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-2 h-6 bg-rose-500 rounded-full" />
                  Signos Vitales
                </h2>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <CalendarIcon className="w-3 h-3" />
                  Hoy, {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {vitalStats.map((stat) => (
                  <motion.div 
                    key={stat.key}
                    whileHover={{ scale: 1.02, y: -4 }}
                    onClick={() => setSelectedStat(stat)}
                    className={cn(
                      "p-6 rounded-[2.5rem] bg-white dark:bg-white/5 border shadow-sm transition-all cursor-pointer group relative overflow-hidden",
                      stat.borderColor
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <PlusIcon className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black">{stat.val}</span>
                      <span className="text-xs font-bold text-slate-400">{stat.unit}</span>
                    </div>
                    
                    {/* Progress spark line simulation */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Generar Estado Section */}
            <section className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-white/5 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold font-manrope flex items-center gap-2 text-slate-900 dark:text-white">
                    <SparklesIcon className="w-6 h-6 text-blue-500" />
                    Estado de Salud Inteligente
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Llena todos tus signos vitales para que Mia analice tu estado general de hoy.</p>
                </div>
                <button
                  disabled={!isAllFilled || generating}
                  onClick={handleGenerateState}
                  className="px-6 py-3 bg-[#3345CC] hover:bg-[#2b3aa3] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generating ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analizando...</>
                  ) : (
                    <><SparklesIcon className="w-5 h-5" /> Generar estado</>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {aiReport && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-black flex items-center justify-center shrink-0 shadow-sm">
                          <img src="/icon.png" alt="Mia" className="w-6 h-6 object-contain" />
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Análisis de Mia</h4>
                          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">
                            {aiReport}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

          </div>

        </div>
      </div>

      {/* Update Stat Modal */}
      <AnimatePresence>
        {selectedStat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStat(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-4 rounded-2xl", selectedStat.bg, selectedStat.color)}>
                      <selectedStat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedStat.label}</h3>
                      <p className="text-xs text-slate-400">Actualizar medición diaria</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStat(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <XMarkIcon className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nuevo Valor ({selectedStat.unit})</label>
                    <input 
                      autoFocus
                      type="text" 
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={`Ej: ${selectedStat.val !== "--" ? selectedStat.val : '...'}`}
                      className="w-full h-14 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 text-xl font-black outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>

                  <button 
                    onClick={handleUpdateStat}
                    disabled={isSaving || !newValue}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Guardar Medición <CheckCircleIcon className="w-5 h-5" /></>
                    )}
                  </button>

                  {/* History Section */}
                  <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Historial Reciente</h4>
                    <div className="space-y-3">
                      {statHistory.length > 0 ? (
                        statHistory.map((h, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <span className="text-sm font-black">{h.val} <span className="text-[10px] text-slate-400 font-bold">{selectedStat.unit}</span></span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {h.timestamp ? new Date(h.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-4 text-xs text-slate-400 italic">No hay registros previos.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-2xl flex items-center gap-3"
          >
            <div className={cn("w-2 h-2 rounded-full animate-pulse", 
              toast.type === 'error' ? 'bg-red-500' : 
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500')} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}