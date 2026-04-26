"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Brain, Moon, ShieldCheck, Dumbbell, Utensils, HeartPulse, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { auth, db } from "../../../lib/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { ViewTutorialModal } from "@/components/ui/view-tutorial-modal";

type PatientProfile = {
  nombres: string;
  edad: string;
  peso: string;
  estatura: string;
  genero: string;
  localidad: string;
  tipoSangre: string;
  discapacidad: string;
  medicacion: string;
  alergias: string;
  contactoEmergencia: string;
};

type RecItem = { title: string; desc: string };

type RecommendationsData = {
  exercises: RecItem[];
  foods: RecItem[];
  habits: RecItem[];
  context: string[];
};

// Función de respaldo en caso de que la IA (DeepSeek) falle o no tenga saldo.
function generateRecommendations(profile: PatientProfile | null): RecommendationsData {
  const exercises: RecItem[] = [];
  const foods: RecItem[] = [];
  const habits: RecItem[] = [];
  const context: string[] = [];

  if (!profile) {
    return {
      exercises: [
        { title: "Caminata Ligera", desc: "30 minutos diarios para mantener la circulación activa." },
        { title: "Estiramientos", desc: "Al despertar y antes de dormir para flexibilidad." }
      ],
      foods: [
        { title: "Dieta Balanceada", desc: "Incluye verduras frescas, proteínas magras y carbohidratos complejos." },
        { title: "Hidratación", desc: "Bebe al menos 2 litros de agua al día." }
      ],
      habits: [
        { title: "Higiene del Sueño", desc: "Intenta dormir 7-8 horas a la misma hora todos los días." },
        { title: "Pausas Activas", desc: "Levántate cada hora si trabajas sentado." }
      ],
      context: ["Recomendaciones Generales"]
    };
  }

  const med = (profile.medicacion || "").toLowerCase();
  const disc = (profile.discapacidad || "").toLowerCase();
  const alerg = (profile.alergias || "").toLowerCase();
  
  const hasDiabetes = disc.includes("diabet") || med.includes("metformina") || med.includes("insulina");
  const hasHypertension = disc.includes("hiperten") || disc.includes("presion") || med.includes("losartan") || med.includes("captopril") || med.includes("enalapril");
  const hasAsthma = disc.includes("asma") || med.includes("salbutamol");
  
  if (hasDiabetes) {
    context.push("Control de Glucosa");
    foods.push({ title: "Reducción de Azúcares", desc: "Evita azúcares refinados y opta por frutas de bajo índice glucémico." });
    foods.push({ title: "Fibra en cada comida", desc: "Verduras, legumbres y granos enteros ayudan a estabilizar el azúcar en sangre." });
    exercises.push({ title: "Cardio Moderado", desc: "Caminar o nadar ayuda a mejorar la sensibilidad a la insulina. Revisa tus pies después de ejercitar." });
    habits.push({ title: "Monitoreo Frecuente", desc: "Mide tu glucosa según las indicaciones de tu médico." });
  }

  if (hasHypertension) {
    context.push("Presión Arterial");
    foods.push({ title: "Dieta DASH / Baja en Sodio", desc: "Reduce el consumo de sal. Usa especias naturales para dar sabor a tus comidas." });
    foods.push({ title: "Rico en Potasio", desc: "Plátanos, espinacas y aguacates ayudan a regular la presión." });
    exercises.push({ title: "Ejercicio Aeróbico", desc: "30-40 minutos diarios de ejercicio cardiovascular moderado." });
    habits.push({ title: "Control del Estrés", desc: "Practica técnicas de respiración profunda o meditación diaria." });
  }

  if (hasAsthma) {
    context.push("Salud Respiratoria");
    exercises.push({ title: "Calentamiento Prolongado", desc: "Evita iniciar actividad física bruscamente para prevenir broncoespasmos." });
    habits.push({ title: "Evitar Alérgenos", desc: "Mantén ventilados los espacios y evita hacer ejercicio al aire libre en días de alta contaminación." });
  }

  if (alerg && alerg !== "n/a" && alerg !== "ninguna") {
    context.push("Alerta Alergias");
    foods.push({ title: "Lectura de Etiquetas", desc: `Revisa siempre los ingredientes por tu alergia a: ${profile.alergias}.` });
  }

  // Fallbacks si no hubo coincidencias fuertes
  if (exercises.length === 0) {
    exercises.push({ title: "Movimiento Diario", desc: "Intenta alcanzar los 10,000 pasos al día." });
    exercises.push({ title: "Flexibilidad", desc: "Estiramientos matutinos para evitar rigidez y dolores musculares." });
  }
  if (foods.length === 0) {
    foods.push({ title: "Plato Equilibrado", desc: "50% vegetales, 25% proteína magra, 25% carbohidratos complejos." });
    foods.push({ title: "Hidratación Constante", desc: "Bebe agua regularmente, al menos 8 vasos durante el día." });
  }
  if (habits.length === 0) {
    habits.push({ title: "Descanso Reparador", desc: "Apaga pantallas 1 hora antes de dormir para mejorar la calidad del sueño." });
    habits.push({ title: "Bienestar Mental", desc: "Dedica 15 minutos diarios a la lectura o meditación." });
  }
  if (context.length === 0) {
    context.push("Salud Preventiva General");
  }

  return { exercises, foods, habits, context };
}

export default function RecomendacionesPage() {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"ai" | "local" | null>(null);

  const fetchAIRecommendations = async () => {
    setLoading(true);
    try {
      let localProfile: PatientProfile | null = null;
      const saved = localStorage.getItem("mia_patient_profile");
      if (saved) {
        localProfile = JSON.parse(saved);
      }

      // Obtener medicinas de recordatorios en Firebase
      const getFirebaseMedicines = () => new Promise<any[]>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          unsubscribe();
          if (user) {
            try {
              const medRef = ref(db, `users/${user.uid}/medicines`);
              const snapshot = await get(medRef);
              const medsData = snapshot.val();
              if (medsData) {
                resolve(Object.values(medsData));
                return;
              }
            } catch(e) {
              console.error(e);
            }
          }
          resolve([]);
        });
        setTimeout(() => resolve([]), 3000);
      });

      const medicines = await getFirebaseMedicines();

      // Consultar la IA
      const response = await fetch("/api/deepseek/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: localProfile, medicines })
      });

      if (!response.ok) {
        throw new Error("DeepSeek API devolvió un error.");
      }

      const json = await response.json();
      if (json.recommendations && json.recommendations.context) {
        setData(json.recommendations);
        setSource("ai");
      } else {
        throw new Error("JSON mal formado desde la IA.");
      }
    } catch (error) {
      console.error("Error al obtener recomendaciones IA:", error);
      // Fallback local en caso de error (ej. sin saldo en API)
      const local = localStorage.getItem("mia_patient_profile");
      setData(generateRecommendations(local ? JSON.parse(local) : null));
      setSource("local");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIRecommendations();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 font-manrope selection:bg-[#3345CC]/30 pb-24 transition-colors duration-500">
      <ViewTutorialModal 
        viewId="recomendaciones"
        title="Recomendaciones"
        description="Recibe sugerencias personalizadas de alimentación, ejercicio y hábitos diarios. Mia analiza todo tu expediente médico para darte consejos seguros y adecuados a tu condición."
      />
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

      <main className="pt-32 px-6 md:px-10 max-w-6xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3345CC]/10 text-[#3345CC] mb-6">
              <Brain className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {source === "ai" ? "Inteligencia Artificial" : "Motor Preventivo Local"}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-public-sans tracking-tight mb-4">
              Recomendaciones para ti
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
              Sugerencias hiper-personalizadas basadas en tu perfil de paciente y tus medicamentos registrados.
            </p>
          </div>
          <button 
            onClick={fetchAIRecommendations}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            Regenerar con IA
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-[#3345CC] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Analizando tu perfil y medicamentos...</p>
          </div>
        ) : data && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-12"
          >
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500 flex items-center mr-2">
                Contexto Analizado por Mia:
              </span>
              {data.context.map((ctx, i) => (
                <div key={i} className="px-4 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4" />
                  {ctx}
                </div>
              ))}
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              
              <motion.section variants={itemVariants} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold font-public-sans">Ejercicios</h3>
                </div>
                <div className="space-y-4">
                  {data.exercises.map((item, idx) => (
                    <article key={idx} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-lg shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 transition-transform duration-300">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{item.title}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </article>
                  ))}
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold font-public-sans">Alimentación</h3>
                </div>
                <div className="space-y-4">
                  {data.foods.map((item, idx) => (
                    <article key={idx} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-lg shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 transition-transform duration-300">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{item.title}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </article>
                  ))}
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Moon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold font-public-sans">Hábitos</h3>
                </div>
                <div className="space-y-4">
                  {data.habits.map((item, idx) => (
                    <article key={idx} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-lg shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 transition-transform duration-300">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{item.title}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </article>
                  ))}
                </div>
              </motion.section>

            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}