"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  UserCircle,
  FileAudio,
  Stethoscope,
  Sparkles,
  BellRing,
  TrendingUp,
  AlertTriangle,
  HeartPulse,
  BookHeart,
  MoonStar,
  ArrowRight,
  Heart
} from "lucide-react";
import { MiaChat } from "@/components/ui/mia-chat";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

const supportViews = [
  {
    name: "Expediente",
    href: "/vistas/captura-datos",
    focus: "Registro manual o por voz con validación humana.",
    icon: FileAudio,
    color: "text-purple-500 dark:text-purple-400"
  },
  {
    name: "Diagnóstico",
    href: "/vistas/diagnostico",
    focus: "Registra padecimientos y medicamentos indicados.",
    icon: Stethoscope,
    color: "text-orange-500 dark:text-orange-400"
  },
  {
    name: "Recomendaciones",
    href: "/vistas/recomendaciones",
    focus: "Ejercicios, comida y buenos hábitos personalizados.",
    icon: Sparkles,
    color: "text-amber-500 dark:text-amber-400"
  },
  {
    name: "Recordatorios",
    href: "/vistas/recordatorios",
    focus: "Medicamentos, horarios, consulta y seguimiento.",
    icon: BellRing,
    color: "text-sky-500 dark:text-sky-400"
  },
  {
    name: "Avances",
    href: "/vistas/avances",
    focus: "Evolución de peso, salud y gráfica de progreso.",
    icon: TrendingUp,
    color: "text-emerald-500 dark:text-emerald-400"
  },
  {
    name: "Emergencias",
    href: "/vistas/emergencias",
    focus: "Números locales y aviso visible para síntomas graves.",
    icon: AlertTriangle,
    color: "text-secondary"
  },
  {
    name: "Salud emocional",
    href: "/vistas/registro-emocional",
    focus: "Estado de ánimo, estrés y señales de alerta.",
    icon: HeartPulse,
    color: "text-rose-500 dark:text-rose-400"
  },
  {
    name: "Registro de salud",
    href: "/vistas/registro-salud",
    focus: "Sueño, hábitos y retroalimentación general.",
    icon: BookHeart,
    color: "text-indigo-500 dark:text-indigo-400"
  },
  {
    name: "Horario de sueño",
    href: "/vistas/horario-sueno",
    focus: "Monitoreo de descanso y patrones nocturnos.",
    icon: MoonStar,
    color: "text-indigo-500 dark:text-indigo-400"
  },
];

export default function Home() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Mouse tracking for 3D logo effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [25, -25]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-25, 25]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/vistas/login");
      } else {
        setUser(currentUser);
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
                sizes="(max-width: 768px) 100vw, 96px"
                className="object-contain dark:hidden group-hover:scale-105 transition-transform" 
                priority
              />
              <Image 
                src="/mia-white.png" 
                alt="Mia Logo" 
                fill 
                sizes="(max-width: 768px) 100vw, 96px"
                className="object-contain hidden dark:block group-hover:scale-105 transition-transform" 
                priority
              />
            </div>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-1">
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
                      key={view.name}
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
          <Link href="/vistas/perfil" className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 p-0.5 group cursor-pointer bg-slate-50 dark:bg-zinc-900 flex items-center justify-center text-slate-400 hover:border-[#3649cc] hover:text-[#3649cc] transition-all">
            {user?.photoURL ? (
              <img 
                alt="User Profile" 
                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" 
                src={user.photoURL}
              />
            ) : (
              <UserCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            )}
          </Link>
        </div>
      </header>

      <div className="relative pt-32 px-6 md:px-12 max-w-7xl mx-auto space-y-24">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[15px] overflow-hidden shadow-2xl shadow-black/20 group"
        >
          {/* Glass Overlay with Border Light */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 dark:to-transparent z-10 pointer-events-none" />
          
          <div className="absolute inset-0 z-0">
            <div className="relative w-full h-full group">

              {/* Soft Ambient Light Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#3649cc]/10 via-transparent to-emerald-500/10 z-[5]" />
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
            className="relative z-20 p-14 md:p-20 w-full flex flex-col lg:flex-row items-center justify-between gap-12"
          >
            <div className="space-y-10 max-w-2xl flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="space-y-6 flex flex-col items-center lg:items-start">
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
                  }}
                  className="lg:hidden relative w-16 h-16 mb-2"
                >
                  <Image 
                    src="/icon.png" 
                    alt="Mia Icon" 
                    fill 
                    sizes="64px"
                    className="object-contain drop-shadow-xl"
                  />
                </motion.div>
              <motion.h1 
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
                }}
                className="text-4xl sm:text-6xl md:text-8xl font-black tracking-[-0.05em] leading-[0.9] italic"
              >
                TU SALUD <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D92626] to-[#001970]">INTELIGENTE.</span>
              </motion.h1>
              <motion.p 
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
                }}
                className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl font-medium"
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
              {/* Button removed as requested */}
            </motion.div>
            </div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                show: { opacity: 1, scale: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d"
              }}
              className="hidden lg:flex relative w-[280px] h-[280px] xl:w-[350px] xl:h-[350px] flex-shrink-0 perspective-[1000px] cursor-pointer"
            >
              <div 
                className="absolute inset-0 bg-[#3649cc]/20 blur-[60px] rounded-full" 
                style={{ transform: "translateZ(-50px)" }}
              />
              <motion.div 
                className="w-full h-full relative"
                style={{ transform: "translateZ(50px)" }}
              >
                <Image 
                  src="/icon.png" 
                  alt="Mia Icon" 
                  fill 
                  sizes="(max-width: 768px) 280px, 350px"
                  className="object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.6)] z-10 pointer-events-none"
                  priority
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Simplified Background Layer */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-[30%] -right-[10%] w-[50%] h-[50%] bg-primary/5 blur-[100px] rounded-full" />
        </div>

        {/* Support & Tracking Section */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[15px] p-6 md:p-12 overflow-hidden bg-white/5 dark:bg-white/[0.02] border border-white/10 dark:border-white/5 will-change-transform"
        >
          <div className="space-y-12 relative z-10">
            <div className="flex items-end justify-between px-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-black font-space-grotesk tracking-tight">Cuidando de ti</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Herramientas diseñadas para tu tranquilidad diaria.</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {supportViews.map((view, i) => (
                <motion.div
                  key={view.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div
                    onClick={() => router.push(view.href)}
                    className="cursor-pointer group block bg-white dark:bg-zinc-900/50 rounded-3xl p-6 md:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-[#3649cc]/10 hover:-translate-y-2 border border-slate-100 dark:border-white/5 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50 dark:to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <motion.div 
                        whileHover={{ scale: 1.15, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                        className={`w-14 h-14 rounded-2xl bg-slate-50 dark:bg-black flex items-center justify-center transition-colors group-hover:bg-[#3649cc] group-hover:!text-white shadow-sm border border-slate-100 dark:border-white/5 ${view.color}`}
                      >
                        <view.icon className="w-7 h-7" />
                      </motion.div>
                      <div className="text-[10px] font-black tracking-widest uppercase text-slate-300 dark:text-slate-600 group-hover:text-[#3649cc] dark:group-hover:text-sky-400 transition-colors">
                        Módulo
                      </div>
                    </div>
                    <h3 className="text-xl font-bold font-manrope mb-3 text-slate-900 dark:text-white group-hover:text-[#3649cc] dark:group-hover:text-sky-400 transition-colors relative z-10">
                      {view.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2 relative z-10">
                      {view.focus}
                    </p>
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                      <div className="w-8 h-8 rounded-full bg-[#3649cc] flex items-center justify-center text-white shadow-lg">
                        <ArrowRight className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  </div>
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
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 dark:border-white/5 space-y-8">
            <h2 className="text-3xl font-black font-manrope flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-500" />
              Nuestra Promesa de Cuidado
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="text-[#3649cc] font-bold text-sm uppercase tracking-widest">Para tu tranquilidad</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Mia está diseñada para ser tu apoyo diario. Tus datos son privados y seguros. Recuerda que Mia ofrece sugerencias amigables, pero siempre debes consultar a tu médico para decisiones importantes.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-emerald-600 font-bold text-sm uppercase tracking-widest">Principios</h4>
                <ul className="space-y-4">
                  {[
                    "Orientación y apoyo constante.",
                    "Alertas claras en caso de emergencias.",
                    "Enfoque en tus hábitos saludables.",
                    "Fácil de usar, sin complicaciones."
                  ].map((rule, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#3649cc]/10 to-purple-500/10 rounded-[2.5rem] p-8 md:p-10 border border-[#3649cc]/20 flex flex-col justify-center items-center text-center w-full md:max-w-xs shadow-inner">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 rounded-3xl bg-white dark:bg-black flex items-center justify-center mb-6 shadow-md"
            >
              <Heart className="w-8 h-8 text-rose-500 fill-rose-500/20" />
            </motion.div>
            <h3 className="text-xl font-bold font-manrope mb-4 text-slate-900 dark:text-white">Siempre Contigo</h3>
            <div className="space-y-2 w-full">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
                Tu bienestar es nuestra prioridad número uno en cada paso que das.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
      <MiaChat />
    </main>
  );
}
