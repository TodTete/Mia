"use client";

import { useState, useEffect } from "react";
import { auth } from "../../../lib/firebase/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { 
  ArrowLeft, 
  Heart, 
  Moon, 
  Utensils, 
  Zap, 
  Activity, 
  Plus, 
  Calendar, 
  ChevronRight,
  ClipboardList,
  Droplet,
  Thermometer,
  Scale
} from "lucide-react";

export default function RegistroSaludPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const initials = user?.displayName
    ?.split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "US";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white transition-colors duration-300 pb-32 font-public-sans">
      {/* Premium Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#3345CC] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Inicio
          </Link>
        </div>
        <ThemeToggle />
      </header>

      <div className="mx-auto mt-24 w-full max-w-6xl px-6">
        {/* Intro Card */}
        <section className="mb-12 rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 bg-white dark:bg-zinc-900/50 p-10 shadow-sm backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5">
            <Activity className="w-40 h-40" />
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[2rem] bg-[#3345CC]/10 text-[#3345CC] shadow-inner">
              <ClipboardList className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-[#3345CC]/10 text-[#3345CC] text-[10px] font-black uppercase tracking-widest">Módulo de Seguimiento</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Registro de Salud</h1>
              <p className="text-lg leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl font-manrope">
                Lleva un control detallado de tus constantes vitales, hábitos alimenticios y nivel de actividad diaria para optimizar tu bienestar.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-[1fr_350px]">
          <div className="space-y-12">
            {/* Vital Signs Quick Log */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <div className="w-2 h-6 bg-red-500 rounded-full" />
                  Signos Vitales
                </h2>
                <span className="text-xs font-bold text-slate-400">Hoy, {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
              </div>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: "Presión Art.", icon: Activity, val: "120/80", unit: "mmHg", color: "text-red-500", bg: "bg-red-50" },
                  { label: "Oxigenación", icon: Droplet, val: "98", unit: "%", color: "text-blue-500", bg: "bg-blue-50" },
                  { label: "Temperatura", icon: Thermometer, val: "36.5", unit: "°C", color: "text-orange-500", bg: "bg-orange-50" },
                  { label: "Peso", icon: Scale, val: "72.4", unit: "kg", color: "text-emerald-500", bg: "bg-emerald-50" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl ${stat.bg} dark:bg-opacity-10 ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <Plus className="w-4 h-4 text-slate-300 group-hover:text-[#3345CC]" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black">{stat.val}</span>
                      <span className="text-xs font-bold text-slate-400">{stat.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Daily Habits */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <div className="w-2 h-6 bg-[#3345CC] rounded-full" />
                  Hábitos Diarios
                </h2>
              </div>
              
              <div className="grid gap-6">
                {[
                  { icon: Moon, title: "Horas de Sueño", desc: "Registraste 7.5h anoche", color: "text-blue-500", bg: "bg-blue-50", link: "/vistas/horario-sueno" },
                  { icon: Utensils, title: "Alimentación", desc: "3 comidas registradas hoy", color: "text-emerald-500", bg: "bg-emerald-50", link: "#" },
                  { icon: Zap, title: "Actividad Física", desc: "4,520 pasos completados", color: "text-amber-500", bg: "bg-amber-50", link: "#" },
                ].map((item, i) => (
                  <Link key={i} href={item.link} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group">
                    <div className="flex items-center gap-6">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-[1.8rem] ${item.bg} dark:bg-opacity-10 ${item.color} shadow-inner`}>
                        <item.icon className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl mb-1">{item.title}</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 group-hover:bg-[#3345CC] group-hover:text-white transition-all">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar / Insights */}
          <aside className="space-y-8">
            <section className="rounded-[2.5rem] bg-slate-900 dark:bg-zinc-900 p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#3345CC]/20 rounded-full blur-3xl" />
              <h3 className="text-xl font-black mb-8 flex items-center gap-2 relative z-10">
                <Activity className="h-6 w-6 text-blue-400" />
                Tu Energía
              </h3>
              
              <div className="space-y-8 relative z-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-blue-300 uppercase font-black tracking-widest">Nivel de Energía</span>
                    <span className="text-3xl font-black">Alta</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 w-[85%]" />
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-xs font-bold text-blue-200 mb-2 italic">Análisis de Mía:</p>
                  <p className="text-xs text-white/70 leading-relaxed font-manrope">
                    Tu regularidad en el sueño ha mejorado tu vitalidad matutina en un 15%.
                  </p>
                </div>
              </div>
            </section>

            <section className="p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center group hover:border-[#3345CC]/30 transition-colors">
              <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <h4 className="font-black mb-3">Historial Completo</h4>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Consulta tus tendencias de salud a lo largo del tiempo.
              </p>
              <button className="px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-[#3345CC] hover:text-white rounded-2xl text-xs font-black transition-all">
                Ver Reportes
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}