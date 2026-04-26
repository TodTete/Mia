"use client";

import { useState, useEffect } from "react";
import { 
  Stethoscope, 
  Activity, 
  Pill, 
  ChevronRight, 
  AlertCircle, 
  ArrowLeft,
  Plus,
  Clipboard,
  History,
  Clock,
  UserCheck,
  Search,
  CheckCircle2,
  Trash2,
  Settings2,
  FileSearch,
  LayoutGrid,
  List
} from "lucide-react";
import { auth, db } from "../../../lib/firebase/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ref, onValue, get, push, set, remove } from "firebase/database";
import { PremiumNav } from "@/components/ui/premium-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ViewTutorialModal } from "@/components/ui/view-tutorial-modal";

export default function DiagnosticoPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [conditions, setConditions] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const [newCondition, setNewCondition] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch conditions
    const condRef = ref(db, `users/${user.uid}/conditions`);
    const unsubscribeConditions = onValue(condRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([key, val]: any) => ({ ...val, id: key }));
        setConditions(list);
        
        // Solo establecer la primera condición si no hay ninguna seleccionada actualmente
        setSelectedCondition((current: any) => {
          if (!current && list.length > 0) return list[0];
          return current;
        });
      } else {
        setConditions([]);
      }
    });

    // Fetch medicines
    const medRef = ref(db, `users/${user.uid}/medicines`);
    const unsubscribeMedicines = onValue(medRef, (snapshot) => {
      if (snapshot.exists()) {
        setMedicines(Object.values(snapshot.val()));
      } else {
        setMedicines([]);
      }
    });

    return () => {
      unsubscribeConditions();
      unsubscribeMedicines();
    };
  }, [user]);

  const addCondition = async () => {
    if (!user || !newCondition) return;
    const condRef = ref(db, `users/${user.uid}/conditions`);
    const newRef = push(condRef);
    await set(newRef, {
      name: newCondition,
      date: new Date().toISOString(),
      status: 'active'
    });
    setNewCondition("");
    setIsAdding(false);
  };

  const deleteCondition = async (id: string) => {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/conditions/${id}`));
    if (selectedCondition?.id === id) setSelectedCondition(null);
  };

  return (
    <main className="min-h-[100dvh] bg-[#fdfdfe] dark:bg-[#02040a] text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-500/30 overflow-hidden">
      <ViewTutorialModal 
        viewId="diagnostico"
        title="Bitácora Clínica"
        description="Agrega y administra tus padecimientos médicos. Aquí podrás vincular tus enfermedades o condiciones de salud con los medicamentos correspondientes para que Mia te ayude a mantener el control."
      />
      {/* Header - Glassmorphism */}
      <header className="h-auto min-h-20 py-4 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-8 sticky top-0 z-50 gap-4 sm:gap-0">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="p-2 sm:p-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:scale-110 transition-all text-slate-500 hover:text-teal-600 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600 shrink-0" />
                BITÁCORA CLÍNICA
              </h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest italic line-clamp-1 sm:line-clamp-none">
                "Registra padecimientos y medicamentos indicados."
              </p>
            </div>
          </div>
          <div className="flex sm:hidden">
            <ThemeToggle />
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <ThemeToggle />
          <div className="flex h-10 w-10 rounded-full bg-teal-600 items-center justify-center text-white font-black text-xs">
            {user?.displayName?.[0] || "U"}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100dvh-80px)] overflow-hidden">
        {/* Sidebar - Padecimientos */}
        <aside className={cn(
          "w-full md:w-[400px] border-r border-slate-200 dark:border-white/5 flex flex-col bg-white dark:bg-black/20 overflow-hidden shrink-0",
          selectedCondition ? "hidden md:flex" : "flex"
        )}>
          <div className="p-6 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Padecimientos</h2>
              <button 
                onClick={() => setIsAdding(true)}
                className="p-2 bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar registros..."
                className="w-full h-12 bg-slate-100 dark:bg-white/5 border-none rounded-2xl pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-teal-600/20 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            <AnimatePresence>
              {isAdding && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-5 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-500/20 rounded-[2rem] space-y-4"
                >
                  <input 
                    autoFocus
                    type="text"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    placeholder="Nuevo padecimiento..."
                    className="w-full bg-white dark:bg-black border border-teal-100 dark:border-teal-900/50 rounded-xl px-4 py-2 text-sm outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addCondition()}
                  />
                  <div className="flex gap-2">
                    <button onClick={addCondition} className="flex-1 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg">Guardar</button>
                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-slate-200 dark:bg-white/10 text-xs font-bold rounded-lg">Cancelar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {conditions.length > 0 ? (
              conditions.map((cond) => (
                <div 
                  key={cond.id}
                  onClick={() => setSelectedCondition(cond)}
                  className={cn(
                    "p-5 rounded-[2rem] cursor-pointer transition-all border group",
                    selectedCondition?.id === cond.id 
                      ? "bg-teal-600 text-white border-teal-500 shadow-xl shadow-teal-600/20 translate-x-2" 
                      : "bg-white dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn("w-2 h-2 rounded-full", selectedCondition?.id === cond.id ? "bg-white" : "bg-teal-500")} />
                    <p className={cn("text-[8px] font-black uppercase tracking-widest", selectedCondition?.id === cond.id ? "text-white/60" : "text-slate-400")}>
                      {new Date(cond.date).toLocaleDateString()}
                    </p>
                  </div>
                  <h3 className="font-bold text-sm leading-tight">{cond.name}</h3>
                  <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Ver Detalles</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteCondition(cond.id); }}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 opacity-30">
                <FileSearch className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">Sin registros</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Area - Medicamentos / Detalles */}
        <section className={cn(
          "flex-1 bg-slate-50/50 dark:bg-black/40 overflow-y-auto p-6 md:p-12 scrollbar-hide",
          !selectedCondition ? "hidden md:block" : "block"
        )}>
          <AnimatePresence mode="wait">
            {selectedCondition ? (
              <motion.div 
                key={selectedCondition.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl"
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <button 
                    onClick={() => setSelectedCondition(null)}
                    className="md:hidden flex items-center gap-2 px-3 py-1 bg-slate-200 dark:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Volver
                  </button>
                  <div className="px-3 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-500/20">
                    Padecimiento Activo
                  </div>
                  <div className="px-3 py-1 bg-slate-200 dark:bg-white/10 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                    ID: {selectedCondition.id.substring(0, 8)}
                  </div>
                </div>
                
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-12 uppercase leading-none">
                  {selectedCondition.name}
                </h2>

                <div className="grid lg:grid-cols-2 gap-12">
                  <div className="space-y-12">
                    {/* Medicines List */}
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black flex items-center gap-3">
                          <Pill className="w-6 h-6 text-blue-600" />
                          Medicamentos Indicados
                        </h3>
                        <Link href="/vistas/recordatorios" className="text-xs font-bold text-blue-600 hover:underline">Gestionar Horarios</Link>
                      </div>
                      
                      <div className="space-y-4">
                        {medicines.length > 0 ? (
                          medicines.map((med, i) => (
                            <div key={i} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex items-center gap-6 shadow-sm hover:shadow-xl transition-all group">
                              <div className="w-16 h-16 bg-blue-500/10 text-blue-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Pill className="w-8 h-8" />
                              </div>
                              <div className="flex-1">
                                <p className="font-black text-lg">{med.name}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{med.dosage}</p>
                                <div className="mt-4 flex items-center gap-4">
                                  <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase">
                                    <Clock className="w-3 h-3" />
                                    {med.frequency}
                                  </div>
                                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                  <div className="text-[10px] font-bold text-slate-400">Sig. Dosis: 08:00 PM</div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-white/5 rounded-[2.5rem]">
                            <p className="text-sm text-slate-400 font-medium italic">No se han vinculado medicamentos a este padecimiento.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline / Notes */}
                    <div className="p-8 bg-teal-600/5 border border-teal-500/10 rounded-[3rem]">
                      <h3 className="text-sm font-black uppercase tracking-widest text-teal-600 mb-6 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Línea de Tiempo
                      </h3>
                      <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-teal-500/20">
                        <div className="relative before:absolute before:-left-[24.5px] before:top-1 before:w-4 before:h-4 before:bg-teal-600 before:rounded-full before:border-4 before:border-white dark:before:border-black">
                          <p className="text-[10px] font-black text-teal-600 uppercase mb-1">Registro Inicial</p>
                          <p className="text-sm font-bold">Diagnóstico reportado por el paciente.</p>
                          <p className="text-[9px] text-slate-400 mt-1">{new Date(selectedCondition.date).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Insights Card */}
                    <div className="p-8 bg-slate-900 dark:bg-zinc-900 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                      <div className="absolute -top-12 -right-12 p-24 opacity-10 rotate-12">
                        <Clipboard className="w-40 h-40" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-teal-400 mb-6 relative z-10">Recomendación Médica</h4>
                      <p className="text-lg font-medium leading-relaxed mb-8 relative z-10">
                        Mantenga un registro estricto de su sintomatología asociada a <span className="text-teal-400">{selectedCondition.name}</span>. Mia analizará sus signos vitales para detectar anomalías.
                      </p>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                          <CheckCircle2 className="w-6 h-6 text-teal-400" />
                        </div>
                        <p className="text-xs font-bold opacity-60">Siga las indicaciones de su especialista.</p>
                      </div>
                    </div>
                    
                    {/* Help Section */}
                    <div className="p-8 border border-slate-200 dark:border-white/5 rounded-[3rem] space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Recursos Relacionados</h4>
                      <button className="w-full p-5 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-between group">
                        <span className="text-sm font-bold">Guía de cuidados</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button className="w-full p-5 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-between group">
                        <span className="text-sm font-bold">Posibles síntomas</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-24 h-24 bg-teal-500/10 text-teal-600 rounded-[2.5rem] flex items-center justify-center mb-8">
                  <Clipboard className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black mb-4">Seleccione un Registro</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-10">
                  Elija un padecimiento del listado lateral para ver su historial completo, medicamentos y recomendaciones de Mia AI.
                </p>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Información Privada y Segura
                </div>
              </div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <div className="md:hidden">
        <PremiumNav />
      </div>
    </main>
  );
}