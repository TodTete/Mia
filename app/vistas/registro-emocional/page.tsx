"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  HomeIcon,
  FaceSmileIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  CpuChipIcon,
  FaceFrownIcon,
  BoltIcon,
  DocumentCheckIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  Squares2X2Icon,
  HeartIcon,
  Cog6ToothIcon,
  ChatBubbleBottomCenterTextIcon,
  LifebuoyIcon,
  UserIcon,
  FireIcon,
  MoonIcon,
  PuzzlePieceIcon,
  SunIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { DynamicTagCloud } from "@/components/ui/dynamic-tag-cloud";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart
} from "recharts";
import {
  ChartContainer,
  type ChartConfig
} from "@/components/ui/chart";
import { ThemeToggle } from "@/components/theme-toggle";
import { PremiumNav } from "@/components/ui/premium-nav";
import { ViewTutorialModal } from "@/components/ui/view-tutorial-modal";
import { auth, db } from "@/lib/firebase/firebase";
import { ref, push, set, serverTimestamp, onValue, query, limitToLast, orderByChild } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";


export default function RegistroEmocionalPage() {
  const pathname = usePathname();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodIntensities, setMoodIntensities] = useState<Record<string, number>>({
    "Feliz": 7,
    "Tranquilo": 5,
    "Ansioso": 7,
    "Triste": 6,
    "Enojado": 8,
    "Cansado": 7
  });
  const [thoughts, setThoughts] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  // Get current intensity based on selected mood
  const intensity = selectedMood ? moodIntensities[selectedMood] : 7;

  const setIntensity = (val: number) => {
    if (selectedMood) {
      setMoodIntensities(prev => ({ ...prev, [selectedMood]: val }));
    }
  };

  // Sistema de toast
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: "error" | "success" | "info" = "info", ms = 4000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), ms);
  };

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Escuchar historial en tiempo real desde Firebase
        const historyRef = ref(db, `users/${u.uid}/emotions`);
        const recentQuery = query(historyRef, limitToLast(5));
        
        const unsubscribeHistory = onValue(recentQuery, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const list = Object.entries(data).map(([id, val]: [string, any]) => ({
              id,
              ...val
            })).reverse(); // El más reciente primero
            setHistory(list);
          } else {
            setHistory([]);
          }
        });

        return () => unsubscribeHistory();
      } else {
        setHistory([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleConfirmRecord = async () => {
    if (!user) {
      showToast("Por favor, inicia sesión para guardar tu registro.", "error");
      router.push("/vistas/login");
      return;
    }

    if (!selectedMood) {
      showToast("Por favor, selecciona una emoción primero.", "info");
      return;
    }

    setLoading(true);
    try {
      const recordsRef = ref(db, `users/${user.uid}/emotions`);
      const newRecordRef = push(recordsRef);

      await set(newRecordRef, {
        mood: selectedMood,
        intensity, // This now uses the mood-specific intensity
        thoughts,
        timestamp: serverTimestamp(),
        date: new Date().toISOString()
      });

      showToast("✅ Registro emocional guardado con éxito.", "success");
      setShowSuccessModal(true);

      // Limpiar campos después de guardar
      setThoughts("");

      // Guardar también en localStorage para el módulo de Avances
      try {
        const newEntry = {
          date: new Date().toISOString(),
          mood: selectedMood,
          intensity,
          thoughts
        };
        const historyStr = localStorage.getItem("mia_mood_history");
        const history = historyStr ? JSON.parse(historyStr) : [];
        history.push(newEntry);
        localStorage.setItem("mia_mood_history", JSON.stringify(history));
      } catch (e) {
        console.error("Error saving local mood history", e);
      }

    } catch (error: any) {
      console.error("Error saving to Firebase:", error);
      showToast("Error al conectar con Firebase: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };
  const moodConfigs: Record<string, { color: string; advice: (intensity: number) => string }> = {
    "Feliz": {
      color: "#fbbf24", // amber-400
      advice: (i) => i > 7 ? "¡Qué alegría! Aprovecha este impulso para compartir tu bienestar con otros." : "Es genial que te sientas bien. Mantén esa sonrisa."
    },
    "Tranquilo": {
      color: "#10b981", // emerald-500
      advice: (i) => i > 7 ? "Estás en un estado de paz profunda. Es un momento ideal para meditar." : "La calma es tu superpoder hoy. Disfruta el momento."
    },
    "Ansioso": {
      color: "#6366f1", // indigo-500
      advice: (i) => i > 7 ? "Respira profundo. Prueba la técnica 4-7-8 para calmar tu sistema nervioso." : "Sentir un poco de inquietud es normal. Intenta centrarte en algo que puedas controlar."
    },
    "Triste": {
      color: "#3b82f6", // blue-500
      advice: (i) => i > 7 ? "Está bien llorar. Recuerda que después de la tormenta siempre sale el sol." : "Date permiso para sentirte así. Quizás una caminata suave o un té te ayuden."
    },
    "Enojado": {
      color: "#ef4444", // red-500
      advice: (i) => i > 7 ? "Cuenta hasta diez antes de reaccionar. Una actividad física intensa podría ayudar a soltar." : "El enojo es energía. Intenta canalizarlo hacia algo constructivo."
    },
    "Cansado": {
      color: "#64748b", // slate-500
      advice: (i) => i > 7 ? "Tu cuerpo pide un descanso real. Apaga las pantallas y duerme un poco." : "Escucha a tu cuerpo. Un descanso de 15 minutos puede renovarte."
    }
  };

  const currentMoodConfig = selectedMood ? moodConfigs[selectedMood] : { color: "#3649cc", advice: () => "Selecciona una emoción para que pueda darte un consejo personalizado." };

  const moods = [
    { name: "Feliz", icon: SunIcon, label: "FELIZ" },
    { name: "Tranquilo", icon: FaceSmileIcon, label: "TRANQUILO" },
    { name: "Ansioso", icon: PuzzlePieceIcon, label: "ANSIOSO" },
    { name: "Triste", icon: FaceFrownIcon, label: "TRISTE" },
    { name: "Enojado", icon: FireIcon, label: "ENOJADO" },
    { name: "Cansado", icon: MoonIcon, label: "CANSADO" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020205] text-slate-900 dark:text-white font-manrope selection:bg-[#3345CC]/30 pb-32 transition-colors duration-300 overflow-x-hidden">
      <ViewTutorialModal 
        viewId="registro-emocional"
        title="Bitácora Emocional"
        description="Aquí puedes documentar tu estado de ánimo diario y la intensidad de la emoción. Esta información le sirve a Mia para identificar patrones que relacionen tu salud física con tu salud mental."
      />
      <style jsx global>{`
        .intensity-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 12px;
          background: rgba(148, 163, 184, 0.2);
          border-radius: 6px;
          cursor: pointer;
        }
        .intensity-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          background: ${currentMoodConfig.color};
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 15px ${currentMoodConfig.color}40;
          border: 3px solid white;
          transition: background 0.3s ease;
        }
      `}</style>

      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#3345CC] transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver al Inicio
          </Link>
        </div>
        <ThemeToggle />
      </header>

      <main className="pt-32 px-margin max-w-4xl mx-auto space-y-24 pb-32">
        {/* Welcome Section */}
        <section className="text-center space-y-4 relative px-4">
          <div 
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-3xl animate-pulse opacity-20"
            style={{ backgroundColor: currentMoodConfig.color }}
          />
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white font-public-sans tracking-tight leading-tight">
            ¿Cómo te sientes <span className="italic block sm:inline" style={{ color: currentMoodConfig.color }}>hoy?</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-manrope max-w-xl mx-auto leading-relaxed">
            Tu registro emocional ayuda a Mía a entender mejor tu salud integral.
          </p>
        </section>

        {/* Mood Selector Section */}
        <section className="space-y-8 px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span 
                className="text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                style={{ backgroundColor: `${currentMoodConfig.color}20`, color: currentMoodConfig.color }}
              >
                Paso 01
              </span>
              <h3 className="text-2xl font-black tracking-tight">Estado de ánimo</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Elige la emoción que mejor represente tu momento.</p>
          </div>

          <div className="p-1 bg-slate-100 dark:bg-white/[0.02] rounded-[3rem] border border-slate-200 dark:border-white/10 backdrop-blur-sm">
            <div className="p-8 md:p-12 bg-white dark:bg-zinc-900/50 rounded-[2.8rem] border border-slate-100 dark:border-white/5 shadow-xl">
              <DynamicTagCloud
                tags={moods.map(m => ({ id: m.name, label: m.label, icon: m.icon }))}
                selectedId={selectedMood || undefined}
                onSelect={setSelectedMood}
              />
            </div>
          </div>
        </section>

        {/* Intensity Selector Section */}
        <section className="space-y-8 px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span 
                className="text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                style={{ backgroundColor: `${currentMoodConfig.color}20`, color: currentMoodConfig.color }}
              >
                Paso 02
              </span>
              <h3 className="text-2xl font-black tracking-tight">Intensidad</h3>
            </div>
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-xl border"
              style={{ backgroundColor: `${currentMoodConfig.color}10`, borderColor: `${currentMoodConfig.color}30` }}
            >
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentMoodConfig.color }}>Nivel:</span>
              <span className="text-xl font-black" style={{ color: currentMoodConfig.color }}>{intensity}/10</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 items-stretch">
            <div className="lg:col-span-3 bg-white dark:bg-zinc-900/50 rounded-[3rem] p-10 flex flex-col justify-center space-y-10 shadow-xl border border-slate-100 dark:border-white/5 relative overflow-hidden backdrop-blur-sm">
              <div 
                className="absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 blur-3xl opacity-10"
                style={{ backgroundColor: currentMoodConfig.color }}
              />

              <div className="space-y-8 relative">
                <div className="space-y-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="intensity-slider"
                  />
                  <div className="flex justify-between text-[9px] font-black tracking-widest text-slate-400 uppercase px-2">
                    <span>Leve</span>
                    <span style={{ color: currentMoodConfig.color }}>Moderado</span>
                    <span>Extremo</span>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-xl shadow-sm border border-slate-100 dark:border-white/5 flex-shrink-0 transition-transform duration-300 hover:scale-110">
                    🧠
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white tracking-tight">Análisis de Mía</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-manrope italic">
                      "{currentMoodConfig.advice(intensity)}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Radial Chart Visualization */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-8 px-4 bg-slate-100 dark:bg-white/[0.02] rounded-[3rem] border border-slate-200 dark:border-white/10 relative group overflow-hidden">
              <ChartContainer
                config={{
                  intensity: {
                    label: "Intensidad",
                    color: currentMoodConfig.color,
                  },
                }}
                className="mx-auto aspect-square w-full max-w-[240px] relative z-10"
              >
                <RadialBarChart
                  data={[{ value: intensity, fill: currentMoodConfig.color }]}
                  startAngle={90}
                  endAngle={450}
                  innerRadius={70}
                  outerRadius={100}
                  barSize={20}
                >
                  <PolarAngleAxis type="number" domain={[0, 10]} angleAxisId={0} tick={false} />
                  <RadialBar
                    dataKey="value"
                    background={{ fill: "rgba(0,0,0,0.05)" }}
                    cornerRadius={10}
                  />
                  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 5} className="fill-slate-900 dark:fill-white text-5xl font-black">
                                {intensity}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 25} className="fill-slate-400 uppercase text-[8px] font-black tracking-[0.3em]">
                                NIVEL
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
            </div>
          </div>
        </section>

        {/* Thoughts Section */}
        <section className="bg-white dark:bg-zinc-900/50 rounded-[3rem] p-10 space-y-6 shadow-xl border border-slate-100 dark:border-white/5 relative overflow-hidden backdrop-blur-sm px-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${currentMoodConfig.color}20`, color: currentMoodConfig.color }}
            >
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight">Notas</h3>
          </div>
          <textarea
            placeholder="¿Qué influye en tu estado? (Opcional)"
            className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-[2rem] p-8 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all min-h-[160px] resize-none text-lg font-manrope leading-relaxed"
            style={{ "--tw-ring-color": `${currentMoodConfig.color}40` } as React.CSSProperties}
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
          />
        </section>

        {/* Action Button Section */}
        <section className="pt-8 flex flex-col items-center space-y-8 px-4">
          <div className="w-full max-w-sm space-y-4">
            <button
              onClick={handleConfirmRecord}
              disabled={loading}
              className="w-full py-6 text-white rounded-[2rem] font-black text-xl shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 hover:scale-[1.02]"
              style={{ 
                backgroundColor: currentMoodConfig.color,
                boxShadow: `0 20px 25px -5px ${currentMoodConfig.color}40, 0 8px 10px -6px ${currentMoodConfig.color}40`
              }}
            >
              <span>{loading ? "Guardando..." : "Guardar Registro"}</span>
              <ArrowTrendingUpIcon className="w-6 h-6" />
            </button>
          </div>
        </section>

        {/* Recent History Section */}
        {user && (
          <section className="space-y-8 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-[0.2em] text-[#3649cc] uppercase bg-[#3649cc]/10 px-3 py-1 rounded-full">Historial</span>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Últimos Registros</h3>
              </div>
              <Link 
                href="/vistas/avances"
                className="text-xs font-bold text-[#3649cc] hover:underline flex items-center gap-1"
              >
                Ver todo <ArrowTrendingUpIcon className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-4">
              {history.length > 0 ? (
                history.map((item, idx) => {
                  const moodInfo = moods.find(m => m.name === item.mood);
                  const Icon = moodInfo?.icon || FaceSmileIcon;
                  const moodColor = moodConfigs[item.mood]?.color || "#3649cc";
                  
                  return (
                    <div 
                      key={item.id}
                      className="group bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-white/5 rounded-3xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm"
                      style={{ borderLeft: `4px solid ${moodColor}` }}
                    >
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${moodColor}10`, color: moodColor }}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      
                      <div className="flex-grow space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white">{item.mood}</h4>
                          <span className="text-[10px] font-medium text-slate-400">
                            {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-grow h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ width: `${item.intensity * 10}%`, backgroundColor: moodColor }}
                            />
                          </div>
                          <span className="text-[10px] font-black" style={{ color: moodColor }}>{item.intensity}/10</span>
                        </div>
                        {item.thoughts && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                            "{item.thoughts}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-slate-100 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10 rounded-[2rem] p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <ClockIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium max-w-[200px] mx-auto">
                    Aún no tienes registros guardados. ¡Empieza hoy!
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Success Modal Overlay */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md" onClick={() => setShowSuccessModal(false)} />
          
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header/Glow */}
            <div 
              className="absolute top-0 left-0 w-full h-32 opacity-20 blur-3xl"
              style={{ backgroundColor: currentMoodConfig.color }}
            />
            
            <div className="p-8 md:p-12 text-center space-y-8 relative">
              {/* Icon Container */}
              <div 
                className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce duration-[2000ms]"
                style={{ backgroundColor: `${currentMoodConfig.color}20`, color: currentMoodConfig.color }}
              >
                {moods.find(m => m.name === selectedMood)?.icon ? (
                  React.createElement(moods.find(m => m.name === selectedMood)!.icon, { className: "w-12 h-12" })
                ) : (
                  <SparklesIcon className="w-12 h-12" />
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {selectedMood === "Feliz" ? "¡Sigue brillando!" :
                   selectedMood === "Ansioso" ? "Respira profundo..." :
                   selectedMood === "Triste" ? "Mía te acompaña" :
                   selectedMood === "Enojado" ? "Pausa necesaria" :
                   selectedMood === "Tranquilo" ? "Paz interior" : "¡Registro Exitoso!"}
                </h3>
                <div className="p-6 bg-slate-50 dark:bg-white/[0.03] rounded-3xl border border-slate-100 dark:border-white/5 italic font-manrope text-slate-600 dark:text-slate-300 leading-relaxed">
                  "{currentMoodConfig.advice(intensity)}"
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                  style={{ backgroundColor: currentMoodConfig.color }}
                >
                  Continuar
                </button>
                <Link
                  href="/vistas/avances"
                  className="w-full py-4 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-sm"
                >
                  Ver mis avances
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Overlay */}
      {toast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={cn(
            "px-8 py-4 rounded-3xl shadow-2xl backdrop-blur-xl border flex items-center gap-4",
            toast.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-500" :
              toast.type === "success" ? "bg-[#3345CC]/10 border-[#3345CC]/20 text-[#3345CC]" :
                "bg-slate-900/10 border-slate-900/20 text-slate-900 dark:text-white"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              toast.type === "error" ? "bg-red-500" : toast.type === "success" ? "bg-[#3345CC]" : "bg-slate-500"
            )} />
            <span className="font-bold tracking-tight">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}