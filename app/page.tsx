"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  UserCircleIcon, 
  ChatBubbleLeftRightIcon, 
  ClipboardDocumentCheckIcon, 
  HomeIcon, 
  SparklesIcon, 
  BellIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  HeartIcon, 
  BookOpenIcon, 
  BeakerIcon 
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

const teamViews = [
  {
    name: "Login y acceso",
    href: "/vistas/login",
    focus: "Entrada, consentimiento y arranque seguro.",
    icon: UserCircleIcon,
    color: "text-blue-500 dark:text-blue-400"
  },
  {
    name: "Captura de datos",
    href: "/vistas/captura-datos",
    focus: "Registro manual o por voz con validación humana.",
    icon: ChatBubbleLeftRightIcon,
    color: "text-purple-500 dark:text-purple-400"
  },
  {
    name: "Inicio y diagnóstico",
    href: "/vistas/inicio",
    focus: "Resumen del paciente y orientación inicial.",
    icon: HomeIcon,
    color: "text-primary"
  },
  {
    name: "Recomendaciones",
    href: "/vistas/recomendaciones",
    focus: "Ejercicios, comida y buenos hábitos personalizados.",
    icon: SparklesIcon,
    color: "text-amber-500 dark:text-amber-400"
  },
];

const supportViews = [
  {
    name: "Recordatorios",
    href: "/vistas/recordatorios",
    focus: "Medicamentos, horarios, consulta y seguimiento.",
    icon: BellIcon,
    color: "text-sky-500 dark:text-sky-400"
  },
  {
    name: "Avances",
    href: "/vistas/avances",
    focus: "Evolución de peso, salud y gráfica de progreso.",
    icon: ChartBarIcon,
    color: "text-emerald-500 dark:text-emerald-400"
  },
  {
    name: "Emergencias",
    href: "/vistas/emergencias",
    focus: "Números locales y aviso visible para síntomas graves.",
    icon: ExclamationTriangleIcon,
    color: "text-secondary"
  },
  {
    name: "Salud emocional",
    href: "/vistas/registro-emocional",
    focus: "Estado de ánimo, estrés y señales de alerta.",
    icon: HeartIcon,
    color: "text-rose-500 dark:text-rose-400"
  },
  {
    name: "Registro de salud",
    href: "/vistas/registro-salud",
    focus: "Sueño, hábitos y retroalimentación general.",
    icon: BookOpenIcon,
    color: "text-indigo-500 dark:text-indigo-400"
  },
  {
    name: "Función de diagnóstico",
    href: "/vistas/diagnostico",
    focus: "Registro del padecimiento y medicamentos a tomar.",
    icon: BeakerIcon,
    color: "text-teal-500 dark:text-teal-400"
  },
];

export default function Home() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/vistas/login");
      } else {
        setLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-container-lowest">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface-container-lowest text-on-surface font-manrope selection:bg-primary/30 pb-24 transition-colors duration-300">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-tertiary/10 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-margin h-16 bg-surface/80 backdrop-blur-xl border-b border-on-surface/10">
        <div className="flex items-center gap-sm">
          <img src="/mia-black.png" alt="Logo" className="h-10 dark:hidden" />
          <img src="/mia-white.png" alt="Logo" className="h-10 hidden dark:block" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-on-surface/20">
            <img 
              alt="User Profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3FgT76GhbbDoWRP0F8il11ONiIEm2MoGYJNpm7wnmgLDt_JqX2S8wZFIX8207kquAI53RWOZiBkG_5d1aS15i5nvWYC0Jc7CzXRk2ZZs1_EDwwHesxoX7_JEs5ZXlUiyapRvggYeq3v29Rdsv6Xd8x5RTKzCGUOaedSKwo8VMovojlcsy7J3IXgqr72gW1Wpmfdre_EfrAIXI6cXRiK7omzH-UxWLk-mtDGBxUZeKT4Eg_4Ybuo7SsNK0OOJzz-WhIbDoOiHfo_w"
            />
          </div>
        </div>
      </header>

      <div className="relative pt-32 px-margin max-w-7xl mx-auto space-y-xl">
        {/* Hero Section */}
        <section className="glass-surface rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase">
              <SparklesIcon className="w-4 h-4" />
              Libro Mayor de Salud en Tiempo Real
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-on-surface font-public-sans leading-[1.1]">
              Tu salud, bajo control <span className="text-primary">con inteligencia.</span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed font-manrope max-w-2xl">
              Mia recopila, acompaña y sigue cada aspecto de tu bienestar. Una interfaz clínica futurista diseñada para la claridad y la acción inmediata.
            </p>
          </div>
        </section>

        {/* Core Functions */}
        <section className="space-y-md">
          <div className="flex items-end justify-between px-2">
            <div>
              <h2 className="text-2xl font-bold font-public-sans">Funciones Principales</h2>
              <p className="text-on-surface-variant text-sm">Acceso y recopilación de datos fundamentales</p>
            </div>
          </div>
          <div className="grid gap-gutter md:grid-cols-2 lg:grid-cols-4">
            {teamViews.map((view) => (
              <Link
                key={view.href}
                href={view.href}
                className="group glass-surface rounded-3xl p-6 transition-all duration-500 hover:glass-surface-active hover:-translate-y-2"
              >
                <div className={`w-12 h-12 rounded-2xl bg-on-surface/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${view.color}`}>
                  <view.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold font-public-sans mb-2 group-hover:text-primary transition-colors">
                  {view.name}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {view.focus}
                </p>
                <div className="mt-8 flex items-center gap-2 text-primary text-sm font-bold opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  Explorar módulo
                  <span className="text-lg">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Support & Tracking */}
        <section className="space-y-md">
          <div className="flex items-end justify-between px-2">
            <div>
              <h2 className="text-2xl font-bold font-public-sans">Seguimiento y Apoyo</h2>
              <p className="text-on-surface-variant text-sm">Herramientas de monitoreo continuo</p>
            </div>
          </div>
          <div className="grid gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {supportViews.map((view) => (
              <Link
                key={view.href}
                href={view.href}
                className="group glass-surface rounded-3xl p-6 transition-all duration-500 hover:glass-surface-active hover:-translate-y-2 border-l-4 border-l-transparent hover:border-l-primary"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-on-surface/5 flex items-center justify-center ${view.color}`}>
                    <view.icon className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/40 group-hover:text-primary/60 transition-colors">
                    ID: {view.href.split('/').pop()}
                  </div>
                </div>
                <h3 className="text-lg font-bold font-public-sans mb-2">
                  {view.name}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
                  {view.focus}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Rules and Ethics */}
        <section className="grid gap-gutter lg:grid-cols-[1fr_auto]">
          <div className="glass-surface rounded-[2rem] p-8 md:p-10 space-y-6">
            <h2 className="text-3xl font-bold font-public-sans flex items-center gap-3">
              <ClipboardDocumentCheckIcon className="w-8 h-8 text-primary" />
              Protocolo de Uso
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-primary font-bold text-sm uppercase tracking-wider">Misión</h4>
                <p className="text-on-surface-variant leading-relaxed">
                  No se debe prometer precisión médica total ni sustituir al médico. La interfaz debe pedir consentimiento claro para datos sensibles, limitarse al mínimo necesario y mostrar valor inmediato.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-tertiary font-bold text-sm uppercase tracking-wider">Avisos Clave</h4>
                <ul className="space-y-3">
                  {[
                    "No diagnosticar: orientar o sugerir.",
                    "Aviso de emergencia para síntomas graves.",
                    "Priorizar salud mental y hábitos.",
                    "Permitir carga manual si la voz falla."
                  ].map((rule, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-on-surface-variant">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="glass-surface rounded-[2rem] p-8 bg-primary/5 border-primary/20 flex flex-col justify-center items-center text-center max-w-xs">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
              <HeartIcon className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-bold font-public-sans mb-4">Estado del Sistema</h3>
            <div className="space-y-2 w-full">
              <div className="flex justify-between text-xs">
                <span>Precisión de Datos</span>
                <span className="text-primary font-bold">98.2%</span>
              </div>
              <div className="h-1.5 w-full bg-on-surface/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[98.2%]" />
              </div>
              <p className="text-[10px] text-on-surface-variant mt-4">
                Monitoreo activo de signos vitales y respuestas emocionales en tiempo real.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
