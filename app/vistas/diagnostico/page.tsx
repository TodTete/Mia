"use client";

import { useState, useEffect } from "react";
import { 
  Stethoscope, 
  Activity, 
  FileText, 
  Pill, 
  User, 
  ChevronRight, 
  AlertCircle, 
  Info,
  Calendar,
  Clock,
  ArrowRight
} from "lucide-react";
import { auth, db } from "../../../lib/firebase/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { PremiumNav } from "@/components/ui/premium-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DiagnosticoPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const displayName = user?.displayName || "Usuario";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white transition-colors duration-300 pb-32">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/50 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-4">

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Panel Médico</p>
              <h1 className="text-lg font-bold tracking-tight">Diagnóstico</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-white/10">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-8 w-full max-w-5xl px-6">
        {/* Warning Banner */}
        <div className="mb-8 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-amber-600/5 p-8 border border-amber-200/50 dark:border-amber-500/20">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
              <Info className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-900 dark:text-amber-200">Aviso Importante</h2>
              <p className="mt-2 text-sm leading-relaxed text-amber-800/80 dark:text-amber-200/60">
                Mia <span className="font-bold">no es una herramienta de diagnóstico</span>. Solo registra lo que tu médico indique para orientar, sugerir y preparar recomendaciones útiles basadas en tu historial.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Main Info Section */}
          <div className="space-y-8">
            <section className="rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 bg-white dark:bg-zinc-900/50 p-8 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold">Padecimiento Actual</h3>
                </div>
                <button className="text-xs font-medium text-blue-500 hover:underline">Editar</button>
              </div>
              
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl">
                <Activity className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No se ha registrado un padecimiento</p>
                <button className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25">
                  Registrar Diagnóstico
                </button>
              </div>
            </section>

            <section className="rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 bg-white dark:bg-zinc-900/50 p-8 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                    <Pill className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold">Medicamentos Recetados</h3>
                </div>
                <button className="text-xs font-medium text-purple-500 hover:underline">Ver todos</button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                      <Pill className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Ejemplo: Paracetamol</p>
                      <p className="text-xs text-slate-500">Cada 8 horas • 500mg</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-8">
            <section className="rounded-[2.5rem] bg-gradient-to-br from-[#3649cc] to-[#4d61ff] p-8 text-white shadow-xl shadow-blue-500/20">
              <h3 className="text-lg font-bold mb-4">¿Qué hay aquí?</h3>
              <ul className="space-y-4">
                {[
                  { icon: Activity, text: "Enfermedad o padecimiento principal." },
                  { icon: Pill, text: "Lista de medicamentos activos." },
                  { icon: FileText, text: "Notas para recomendaciones posteriores." }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                    <item.icon className="h-5 w-5 shrink-0 opacity-80" />
                    <span className="text-xs font-medium leading-tight">{item.text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 bg-white dark:bg-zinc-900/50 p-8 shadow-sm">
              <h3 className="text-sm font-bold mb-4 text-slate-500 uppercase tracking-widest">Recursos</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group">
                  <span className="text-sm font-semibold">Preguntas Frecuentes</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group">
                  <span className="text-sm font-semibold">Contactar Soporte</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <PremiumNav />
    </main>
  );
}