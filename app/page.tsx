"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  BeakerIcon,
  MoonIcon
} from "@heroicons/react/24/outline";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";

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
    name: "Horario de sueño",
    href: "/vistas/horario-sueno",
    focus: "Monitoreo de descanso y patrones nocturnos.",
    icon: MoonIcon,
    color: "text-indigo-500 dark:text-indigo-400"
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
    <main className="min-h-screen bg-white dark:bg-[#020205] text-on-surface font-manrope selection:bg-primary/30 pb-32 transition-colors duration-500 overflow-x-hidden">
      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Futuristic Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Subtle Static Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        {/* Single Lightweight Floating Light */}
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" 
        />
      </div>

      {/* Header / Navbar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 md:px-12 h-20 bg-white/40 dark:bg-black/40 backdrop-blur-3xl border-b border-white/10 dark:border-white/5 transition-all duration-300">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 group relative">
            <div className="relative h-10 w-24">
              <Image 
                src="/mia-black.png" 
                alt="Mia Logo" 
                fill 
                className="object-contain dark:hidden group-hover:scale-105 transition-transform" 
                priority
              />
              <Image 
                src="/mia-white.png" 
                alt="Mia Logo" 
                fill 
                className="object-contain hidden dark:block group-hover:scale-105 transition-transform" 
                priority
              />
            </div>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { name: "Inicio", href: "/", active: true },
              { name: "Captura", href: "/vistas/captura-datos" },
              { name: "Salud", href: "/vistas/registro-salud" },
              { name: "Emergencias", href: "/vistas/emergencias" },
            ].map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  item.active 
                    ? "bg-primary/10 text-primary" 
                    : "text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface"
                }`}
              >
                {item.name}
              </Link>
            ))}

            <div className="relative group">
              <button className="px-4 py-2 rounded-full text-sm font-bold text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface transition-all flex items-center gap-1">
                Seguimiento y Apoyo
                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="w-64 bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden p-2 flex flex-col gap-1">
                  {supportViews.map((view) => (
                    <Link
                      key={view.href}
                      href={view.href}
                      className="px-4 py-3 rounded-xl text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5 transition-colors flex items-center gap-3"
                    >
                      <view.icon className={`w-5 h-5 ${view.color}`} />
                      {view.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 p-0.5 group cursor-pointer">
            <img 
              alt="User Profile" 
              className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3FgT76GhbbDoWRP0F8il11ONiIEm2MoGYJNpm7wnmgLDt_JqX2S8wZFIX8207kquAI53RWOZiBkG_5d1aS15i5nvWYC0Jc7CzXRk2ZZs1_EDwwHesxoX7_JEs5ZXlUiyapRvggYeq3v29Rdsv6Xd8x5RTKzCGUOaedSKwo8VMovojlcsy7J3IXgqr72gW1Wpmfdre_EfrAIXI6cXRiK7omzH-UxWLk-mtDGBxUZeKT4Eg_4Ybuo7SsNK0OOJzz-WhIbDoOiHfo_w"
            />
          </div>
        </div>
      </header>

      <div className="relative pt-32 px-6 md:px-12 max-w-7xl mx-auto space-y-24">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[4rem] overflow-hidden border border-white/20 dark:border-white/10 shadow-2xl shadow-black/20 group"
        >
          {/* Glass Overlay with Border Light */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 dark:to-transparent z-10 pointer-events-none" />
          
          <div className="absolute inset-0 z-0">
            <div className="relative w-full h-full group">

              {/* Holographic Scan Line Effect */}
              <motion.div 
                animate={{ 
                  top: ["0%", "100%", "0%"]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10 opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent dark:from-[#020205] dark:via-[#020205]/40 dark:to-transparent z-[5]" />
            </div>
          </div>

          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.15, delayChildren: 0.4 }
              }
            }}
            initial="hidden"
            animate="show"
            className="relative z-20 p-10 md:p-20 max-w-4xl space-y-10"
          >
            <div className="space-y-4">
              <motion.h1 
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
                }}
                className="text-6xl md:text-8xl font-black tracking-[ -0.05em] leading-[0.85] font-space-grotesk italic"
              >
                TU SALUD. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D92626] to-[#001970]">INTELIGENTE.</span>
              </motion.h1>
              <motion.p 
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
                }}
                className="text-xl md:text-2xl text-on-surface-variant leading-relaxed font-manrope max-w-2xl font-medium opacity-80"
              >
                La evolución del bienestar digital. Mia fusiona biometría avanzada con IA predictiva para transformar tu vida hoy.
              </motion.p>
            </div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="flex flex-wrap gap-6 pt-6"
            >
              <Link href="/vistas/captura-datos" className={cn(buttonVariants({ size: "lg" }), "flex items-center gap-3 rounded-2xl px-10 h-16 bg-[#001970] hover:bg-[#000d4d] text-white font-black text-lg shadow-2xl shadow-[#001970]/30 transition-all hover:scale-105 active:scale-95 group border-0")}>
                INICIAR ESCANEO
                <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
              </Link>
              <Link href="/vistas/avances" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-2xl px-10 h-16 border-2 border-on-surface/20 hover:bg-on-surface/5 font-black text-lg transition-all backdrop-blur-xl")}>
                HISTORIAL BIO
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Simplified Background Layer */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-[30%] -right-[10%] w-[50%] h-[50%] bg-primary/5 blur-[100px] rounded-full" />
        </div>

        {/* Core Functions */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-12 will-change-transform"
        >
          <div className="flex items-end justify-between px-6 border-l-8 border-primary py-2">
            <div className="space-y-1">
              <h2 className="text-4xl font-black font-space-grotesk tracking-tighter uppercase italic">Módulos</h2>
              <p className="text-on-surface-variant text-sm font-bold tracking-widest uppercase opacity-60">Arquitectura de captura y acceso</p>
            </div>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {teamViews.map((view, i) => (
              <motion.div
                key={view.href}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative"
              >
                <div
                  className="group block bg-white/5 dark:bg-white/[0.02] backdrop-blur-2xl rounded-[2.5rem] p-10 h-full border border-white/10 hover:border-primary/50 transition-all duration-500 shadow-xl hover:shadow-primary/20 cursor-default"
                >
                  <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-on-surface/10 to-transparent flex items-center justify-center mb-10 group-hover:rotate-[15deg] group-hover:scale-125 transition-all duration-500 ${view.color}`}>
                    <view.icon className="w-9 h-9" />
                  </div>
                  <h3 className="text-2xl font-black font-space-grotesk mb-4 group-hover:text-primary transition-colors tracking-tighter leading-none">
                    {view.name.toUpperCase()}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-bold opacity-70 group-hover:opacity-100 transition-opacity">
                    {view.focus}
                  </p>
                  
                  {/* Decorative number */}
                  <div className="absolute top-8 right-10 text-6xl font-black text-white/10 italic group-hover:text-white/30 transition-colors">
                    0{i + 1}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Support & Tracking Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-[3.5rem] p-1 md:p-12 overflow-hidden bg-white/5 dark:bg-white/[0.02] border border-white/10 dark:border-white/5 will-change-transform"
        >
          <div className="space-y-12 relative z-10">
            <div className="flex items-end justify-between px-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-black font-space-grotesk tracking-tight">Seguimiento y Apoyo</h2>
                <p className="text-on-surface-variant text-sm font-medium">Herramientas inteligentes para tu día a día.</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {supportViews.map((view, i) => (
                <motion.div
                  key={view.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={view.href}
                    className="group block glass-surface rounded-3xl p-8 transition-all duration-500 hover:glass-surface-active hover:-translate-y-2 border-l-4 border-l-transparent hover:border-l-primary relative"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-12 h-12 rounded-xl bg-on-surface/5 flex items-center justify-center transition-all group-hover:bg-primary/10 ${view.color}`}>
                        <view.icon className="w-7 h-7" />
                      </div>
                      <div className="text-[10px] font-black tracking-[0.3em] uppercase text-on-surface-variant/40 group-hover:text-primary transition-colors">
                        {view.href.split('/').pop()?.replace('-', ' ')}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold font-space-grotesk mb-3 tracking-tight group-hover:text-primary transition-colors">
                      {view.name}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed font-medium line-clamp-2">
                      {view.focus}
                    </p>
                    <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-0 group-hover:scale-100">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                        <span className="text-lg">→</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Rules and Ethics */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid gap-gutter lg:grid-cols-[1fr_auto] will-change-transform"
        >
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
            <h3 className="text-xl font-bold font-public-sans mb-4">Estado del Paciente</h3>
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
        </motion.section>
      </div>
    </main>
  );
}
