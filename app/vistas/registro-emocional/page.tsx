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
  UserIcon
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
import { auth, db } from "@/lib/firebase/firebase";
import { ref, push, set, serverTimestamp } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";


export default function RegistroEmocionalPage() {
  const pathname = usePathname();
  const [selectedMood, setSelectedMood] = useState<string>("Ansioso");
  const [intensity, setIntensity] = useState<number>(7);
  const [thoughts, setThoughts] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Sistema de toast
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: "error" | "success" | "info" = "info", ms = 4000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), ms);
  };

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleConfirmRecord = async () => {
    if (!user) {
      showToast("Por favor, inicia sesión para guardar tu registro.", "error");
      router.push("/vistas/login");
      return;
    }

    setLoading(true);
    try {
      const recordsRef = ref(db, `users/${user.uid}/emotions`);
      const newRecordRef = push(recordsRef);

      await set(newRecordRef, {
        mood: selectedMood,
        intensity,
        thoughts,
        timestamp: serverTimestamp(),
        date: new Date().toISOString()
      });

      showToast("✅ Registro emocional guardado con éxito.", "success");

      // Limpiar campos después de guardar
      setThoughts("");

      // Guardar también en localStorage para el módulo de Avances (historial offline/local)
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
  const moods = [
    { name: "Feliz", icon: FaceSmileIcon, label: "FELIZ" },
    { name: "Tranquilo", icon: SparklesIcon, label: "TRANQUILO" },
    { name: "Ansioso", icon: CpuChipIcon, label: "ANSIOSO" },
    { name: "Triste", icon: FaceFrownIcon, label: "TRISTE" },
    { name: "Enojado", icon: BoltIcon, label: "ENOJADO" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020205] text-slate-900 dark:text-white font-manrope selection:bg-[#3345CC]/30 pb-32 transition-colors duration-300 overflow-x-hidden">
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
          background: #3345CC;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(51, 69, 204, 0.4);
          border: 3px solid white;
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
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#3345CC]/5 rounded-full blur-3xl animate-pulse" />
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-public-sans tracking-tight leading-tight">
            ¿Cómo te sientes <span className="text-[#3649cc] italic">hoy?</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-manrope max-w-xl mx-auto leading-relaxed">
            Tu registro emocional ayuda a Mía a entender mejor tu salud integral.
          </p>
        </section>

        {/* Mood Selector Section */}
        <section className="space-y-8 px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-[0.2em] text-[#3649cc] uppercase bg-[#3649cc]/10 px-3 py-1 rounded-full">Paso 01</span>
              <h3 className="text-2xl font-black tracking-tight">Estado de ánimo</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Elige la emoción que mejor represente tu momento.</p>
          </div>

          <div className="p-1 bg-slate-100 dark:bg-white/[0.02] rounded-[3rem] border border-slate-200 dark:border-white/10 backdrop-blur-sm">
            <div className="p-8 md:p-12 bg-white dark:bg-zinc-900/50 rounded-[2.8rem] border border-slate-100 dark:border-white/5 shadow-xl">
              <DynamicTagCloud
                tags={moods.map(m => ({ id: m.name, label: m.label, icon: m.icon }))}
                selectedId={selectedMood}
                onSelect={setSelectedMood}
              />
            </div>
          </div>
        </section>

        {/* Intensity Selector Section */}
        <section className="space-y-8 px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-[0.2em] text-[#3649cc] uppercase bg-[#3649cc]/10 px-3 py-1 rounded-full">Paso 02</span>
              <h3 className="text-2xl font-black tracking-tight">Intensidad</h3>
            </div>
            <div className="flex items-center gap-2 bg-[#3649cc]/10 px-4 py-2 rounded-xl border border-[#3649cc]/20">
              <span className="text-[10px] font-black text-[#3649cc] uppercase tracking-widest">Nivel:</span>
              <span className="text-xl font-black text-[#3649cc]">{intensity}/10</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 items-stretch">
            <div className="lg:col-span-3 bg-white dark:bg-zinc-900/50 rounded-[3rem] p-10 flex flex-col justify-center space-y-10 shadow-xl border border-slate-100 dark:border-white/5 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />

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
                    <span className="text-[#3649cc]">Moderado</span>
                    <span>Extremo</span>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-xl shadow-sm border border-slate-100 dark:border-white/5 flex-shrink-0">
                    🧠
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white tracking-tight">Análisis de Mía</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-manrope">
                      Un nivel {intensity <= 3 ? "leve" : intensity <= 7 ? "moderado" : "elevado"} sugiere un estado {intensity <= 3 ? "de calma" : intensity <= 7 ? "activo" : "intenso"}.
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
                    color: "hsl(var(--primary))",
                  },
                }}
                className="mx-auto aspect-square w-full max-w-[240px] relative z-10"
              >
                <RadialBarChart
                  data={[{ value: intensity, fill: "var(--color-primary)" }]}
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
            <div className="w-10 h-10 rounded-xl bg-[#3649cc]/10 flex items-center justify-center text-[#3649cc]">
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight">Notas</h3>
          </div>
          <textarea
            placeholder="¿Qué influye en tu estado? (Opcional)"
            className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-[2rem] p-8 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all min-h-[160px] resize-none text-lg font-manrope leading-relaxed"
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
              className="w-full py-6 bg-[#3649cc] hover:scale-[1.02] text-white rounded-[2rem] font-black text-xl shadow-xl shadow-[#3649cc]/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <span>{loading ? "Guardando..." : "Guardar Registro"}</span>
              <ArrowTrendingUpIcon className="w-6 h-6" />
            </button>
          </div>
        </section>
      </main>

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