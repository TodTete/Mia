"use client";

import { useState, useEffect } from "react";
import { 
  Heart, 
  Moon, 
  Utensils, 
  Zap, 
  User, 
  ChevronRight, 
  Clock,
  Calendar,
  Plus,
  ArrowRight,
  Activity
} from "lucide-react";
import { auth } from "../../../lib/firebase/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

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
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/50 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-4">

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Diario</p>
              <h1 className="text-lg font-bold tracking-tight">Registro de Salud</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/vistas/perfil"
              className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-900 flex items-center justify-center text-slate-400"
            >
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-8 w-full max-w-5xl px-6">
        {/* Intro Card */}
        <section className="rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 bg-white dark:bg-zinc-900/50 p-8 shadow-sm backdrop-blur-sm mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Sueño, hábitos y feedback</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Esta vista recoge horas de dormir, hábitos diarios, comida y actividades para ofrecer orientación útil y no centrarse solo en medicamentos.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {/* Form Placeholder Cards */}
            {[
              { icon: Moon, title: "Horas de Sueño", desc: "¿Cuánto descansaste anoche?", color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: Utensils, title: "Alimentación", desc: "Registra tus comidas del día", color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { icon: Zap, title: "Actividad Física", desc: "Pasos, ejercicio y movimiento", color: "text-amber-500", bg: "bg-amber-500/10" },
            ].map((item, i) => (
              <button key={i} className="w-full flex items-center justify-between p-6 bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm hover:scale-[1.01] transition-transform group text-left">
                <div className="flex items-center gap-5">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg} ${item.color}`}>
                    <item.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/10 transition-colors">
                  <Plus className="h-5 w-5 text-slate-400" />
                </div>
              </button>
            ))}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2.5rem] bg-white dark:bg-zinc-900 p-8 text-slate-900 dark:text-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl border border-slate-100 dark:border-white/5">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                Resumen Diario
              </h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">Sueño</span>
                  <span className="text-xl font-black">7.5h</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[75%]" />
                </div>
                
                <div className="flex justify-between items-end pt-4">
                  <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">Energía</span>
                  <span className="text-xl font-black">Alta</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[90%]" />
                </div>
              </div>
            </section>

            <div className="p-8 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
              <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Mantén una racha de registro para obtener mejores recomendaciones.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}