"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "../../../lib/firebase/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  ClipboardList,
  Stethoscope,
  Pill,
  Heart,
  Smile,
  Apple,
  TrendingUp,
  Phone,
  ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const sections = [
  {
    title: "Editar Datos",
    description: "Registra tu perfil de salud: edad, peso, estatura y más.",
    href: "/vistas/captura-datos",
    icon: ClipboardList,
    color: "#3649cc",
    bgColor: "bg-[#3649cc]/10",
  },
  {
    title: "Diagnóstico",
    description: "Registra padecimientos y medicamentos indicados.",
    href: "/vistas/diagnostico",
    icon: Stethoscope,
    color: "#e5890a",
    bgColor: "bg-amber-100",
  },
  {
    title: "Recordatorios",
    description: "Horarios de medicinas y próximas citas médicas.",
    href: "/vistas/recordatorios",
    icon: Pill,
    color: "#3649cc",
    bgColor: "bg-[#3649cc]/10",
  },
  {
    title: "Registro de Salud",
    description: "Sueño, hábitos diarios, comida y actividades.",
    href: "/vistas/registro-salud",
    icon: Heart,
    color: "#e5394b",
    bgColor: "bg-red-100",
  },
  {
    title: "Registro Emocional",
    description: "¿Cómo te sientes hoy? Registra tu estado de ánimo.",
    href: "/vistas/registro-emocional",
    icon: Smile,
    color: "#f59e0b",
    bgColor: "bg-amber-100",
  },
  {
    title: "Recomendaciones",
    description: "Ejercicios, comida y hábitos para tu bienestar.",
    href: "/vistas/recomendaciones",
    icon: Apple,
    color: "#22c55e",
    bgColor: "bg-emerald-100",
  },
  {
    title: "Avances",
    description: "Evolución de tu salud con gráficas y seguimiento.",
    href: "/vistas/avances",
    icon: TrendingUp,
    color: "#8b5cf6",
    bgColor: "bg-violet-100",
  },
  {
    title: "Emergencias",
    description: "Números de emergencia según tu localidad.",
    href: "/vistas/emergencias",
    icon: Phone,
    color: "#ef4444",
    bgColor: "bg-red-100",
  },
];

export default function InicioPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const [greeting, setGreeting] = useState("Hola");

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(
      hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"
    );
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black px-6 py-10 font-sans text-slate-900 dark:text-white sm:px-10 transition-colors duration-500">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 sm:mb-14 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Mia Logo"
                  fill
                  sizes="56px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {greeting}
                </h1>
                <p className="mt-1 text-slate-500">
                  ¿Qué te gustaría hacer hoy?
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href="/vistas/perfil"
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-slate-500 shadow-sm transition-all hover:border-[#3649cc] hover:text-[#3649cc] hover:shadow-md overflow-hidden"
                  aria-label="Mi cuenta"
                >
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Foto de perfil"
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                )}
                </Link>
              </div>
            </div>
        </div>

        {/* Grid de Secciones */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group flex flex-col rounded-3xl border border-slate-100 dark:border-white/5 bg-white dark:bg-zinc-900 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${section.bgColor}`}
                    style={{ color: section.color }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-[#3649cc]" />
                </div>
                <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                  {section.title}
                </h2>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {section.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-14 flex items-center justify-center gap-3 text-sm text-slate-400">
          <div className="relative h-5 w-5 overflow-hidden opacity-50">
            <Image
              src="/logo.png"
              alt=""
              fill
              sizes="20px"
              className="object-contain"
            />
          </div>
          <span>MIA — Tu asistente de salud personal</span>
        </div>
      </div>
    </main>
  );
}