"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Smile, Meh, Frown, Moon, ArrowLeft, Clock, User, Edit, Check, TrendingUp, BarChart2, Sparkles, Pill, Stethoscope, ArrowRight } from "lucide-react";
import { auth, db } from "../../../lib/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { ViewTutorialModal } from "@/components/ui/view-tutorial-modal";

export default function AvancesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [diagnostico, setDiagnostico] = useState<string>("");
  
  const [isEditingDiag, setIsEditingDiag] = useState(false);
  const [editDiag, setEditDiag] = useState("");
  const [isGeneratingDiag, setIsGeneratingDiag] = useState(false);
  const [latestSleep, setLatestSleep] = useState<any>(null);
  const [fullSleepHistory, setFullSleepHistory] = useState<any[]>([]);

  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [medicines, setMedicines] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load profile
    const savedProfile = localStorage.getItem("mia_patient_profile");
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      if (parsed.lastUpdated) {
        setLastUpdated(parsed.lastUpdated);
      } else {
        setLastUpdated(new Date().toISOString());
      }
    }

    // Load diagnosis
    const savedDiag = localStorage.getItem("mia_diagnostico");
    if (savedDiag) {
      setDiagnostico(savedDiag);
      setEditDiag(savedDiag);
    } else {
      const defDiag = "Aún no se ha generado un diagnóstico.";
      setDiagnostico(defDiag);
      setEditDiag(defDiag);
    }

    // Load mood history
    const savedMood = localStorage.getItem("mia_mood_history");
    if (savedMood) {
      const parsedMoods = JSON.parse(savedMood);
      const chartData = parsedMoods.map((m: any) => {
        const date = new Date(m.date);
        return {
          name: `${date.getDate()}/${date.getMonth()+1}`,
          intensidad: m.intensity,
          mood: m.mood,
          fullDate: date.toLocaleDateString()
        };
      });
      setMoodHistory(chartData);
    }

    // Load latest sleep from Firebase
    const getSleepData = () => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user) {
          try {
            const historyRef = ref(db, `users/${user.uid}/sleepHistory`);
            const snapshot = await get(historyRef);
            const data = snapshot.val();
            if (data) {
              const arr = Object.values(data) as any[];
              arr.sort((a, b) => b.timestamp - a.timestamp);
              setFullSleepHistory(arr);
              if (arr.length > 0) {
                setLatestSleep(arr[0]);
              }
            }
          } catch (e) {
            console.error("Error fetching sleep data", e);
          }
        }
      });
    };

    // Load medicines from Firebase
    const getMedicinesData = () => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user) {
          try {
            const medRef = ref(db, `users/${user.uid}/medicines`);
            const snapshot = await get(medRef);
            const data = snapshot.val();
            if (data) {
              setMedicines(Object.values(data));
            }
          } catch (e) {
            console.error("Error fetching medicines", e);
          }
        }
      });
    };

    getSleepData();
    getMedicinesData();
  }, []);

  const saveDiag = () => {
    localStorage.setItem("mia_diagnostico", editDiag);
    setDiagnostico(editDiag);
    setIsEditingDiag(false);
  };

  const generateDiagnosisWithAI = async () => {
    setIsGeneratingDiag(true);
    try {
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
      
      const response = await fetch("/api/deepseek/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, medicines, moodHistory, sleepHistory: fullSleepHistory })
      });
      
      if (!response.ok) throw new Error("Error fetching diagnosis from AI");
      
      const json = await response.json();
      if (json.diagnostico) {
        setDiagnostico(json.diagnostico);
        setEditDiag(json.diagnostico);
        localStorage.setItem("mia_diagnostico", json.diagnostico);
      }
    } catch (error) {
      console.error("Error generating diagnosis", error);
      alert("Hubo un error al generar el diagnóstico con IA.");
    } finally {
      setIsGeneratingDiag(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/D";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-MX', { 
      day: 'numeric', month: 'long', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).format(d);
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pt-24 pb-20">
      <ViewTutorialModal 
        viewId="avances"
        title="Historia Bio-Digital"
        description="Visualiza tu progreso a lo largo del tiempo. Aquí encontrarás gráficas con tu historial emocional, calidad de sueño, resumen de medicamentos e insights de tu diagnóstico."
      />
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

      <div className="mx-auto max-w-5xl px-6">
        
        <div className="mb-10 flex flex-col gap-4 sm:mb-12">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-[#3649cc] dark:text-indigo-400">
              Avances y Bio
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Historia Bio-Digital
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Monitorea tu evolución, actualiza tus métricas vitales y revisa tu progreso emocional a lo largo del tiempo.
            </p>
            {lastUpdated && (
              <div className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-medium border border-emerald-100 dark:border-emerald-500/20">
                <Clock className="w-4 h-4" />
                Última actualización: {formatDate(lastUpdated)}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Bio Data Section */}
          <section className="bg-white dark:bg-white/5 rounded-3xl p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            {/* Standard icon placement */}
            <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-all duration-500 rotate-12">
              <User className="w-24 h-24 text-[#3649cc] dark:text-indigo-400" />
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <div className="w-2 h-6 bg-[#3649cc] dark:bg-indigo-500 rounded-full" />
                Datos Físicos
              </h2>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 transition-all">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Edad Actual</p>
                <p className="text-4xl font-black text-[#3649cc] dark:text-indigo-400">{profile?.edad || "--"} <span className="text-lg font-medium text-slate-400 dark:text-slate-500">años</span></p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">* Se incrementa automáticamente con el paso del tiempo.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Peso</p>
                  <p className="text-3xl font-bold">{profile?.peso || "--"} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">kg</span></p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estatura</p>
                  <p className="text-3xl font-bold">{profile?.estatura || "--"} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">cm</span></p>
                </div>
              </div>

              {/* Último Sueño Card */}
              {latestSleep && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 transition-all flex items-center justify-between group-hover:shadow-md">
                  <div>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Moon className="w-4 h-4" /> Último Descanso
                    </p>
                    <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400">
                      {latestSleep.hours} <span className="text-lg font-medium opacity-70">h</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 capitalize">{latestSleep.date}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-white dark:bg-black/20 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-500/10">
                    {latestSleep.quality === 'excellent' && <Smile className="w-8 h-8 text-emerald-500 mb-1" />}
                    {latestSleep.quality === 'good' && <Meh className="w-8 h-8 text-amber-500 mb-1" />}
                    {latestSleep.quality === 'poor' && <Frown className="w-8 h-8 text-red-500 mb-1" />}
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {latestSleep.quality === 'excellent' ? 'Bien' : latestSleep.quality === 'good' ? 'Regular' : 'Mal'}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </section>

          {/* Clinical Insights Link Section */}
          <section className="bg-white dark:bg-white/5 rounded-3xl p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 flex flex-col group hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            <div className="absolute -bottom-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-all duration-500">
              <Stethoscope className="w-24 h-24 text-blue-600" />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 relative z-10 gap-4 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-600 rounded-full" />
                Análisis Clínico
              </h2>
              <Link href="/vistas/diagnostico" className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:scale-110 transition-transform">
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex-1 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl p-6 border border-blue-100 dark:border-blue-500/10 relative z-10">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-4">
                {diagnostico.length > 100 ? `${diagnostico.substring(0, 100)}...` : diagnostico}
              </p>
              <Link 
                href="/vistas/diagnostico"
                className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2 hover:gap-3 transition-all"
              >
                Ver Diagnóstico Completo y Análisis de IA <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </section>

          {/* Medicines Section */}
          <section className="bg-white dark:bg-white/5 rounded-3xl p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 flex flex-col group hover:shadow-2xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <div className="w-2 h-6 bg-purple-500 rounded-full" />
                Medicamentos
              </h2>
              <Link href="/vistas/recordatorios" className="text-sm font-bold text-purple-500 hover:underline">
                Ver Horarios
              </Link>
            </div>

            <div className="space-y-4">
              {medicines.length > 0 ? (
                medicines.map((med, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                        <Pill className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{med.name}</p>
                        <p className="text-xs text-slate-500">{med.dosage} • {med.frequency}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 dark:bg-black/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                  <Pill className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500">No hay medicamentos registrados</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Mood Progress Section */}
        <section className="mt-8 bg-white dark:bg-white/5 rounded-3xl p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 hover:shadow-2xl transition-all duration-300 w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div className="p-3 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl self-start sm:self-auto">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Progreso Emocional</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Historial de tu estado de ánimo (0-10)</p>
            </div>
          </div>

          {moodHistory.length > 0 ? (
            <div className="h-[250px] sm:h-[350px] w-full mt-6 bg-slate-50 dark:bg-black/20 rounded-2xl p-2 sm:p-4 border border-slate-100 dark:border-white/5">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIntensidad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#888', fontSize: 10, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 12, fontWeight: 500 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      color: 'white'
                    }}
                    itemStyle={{ color: '#f43f5e', fontWeight: 'bold' }}
                    labelStyle={{ color: '#aaa', marginBottom: '4px', fontSize: '12px' }}
                    formatter={(value: any, name: any, props: any) => [
                      `${value} (${props.payload.mood})`, 
                      "Intensidad"
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="intensidad" 
                    stroke="#f43f5e" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorIntensidad)" 
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#f43f5e', stroke: 'white' }}
                  />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-slate-200 dark:bg-white/10 h-10 w-10"></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-black/20 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
              <BarChart2 className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-6" />
              <p className="text-slate-600 dark:text-slate-400 font-medium mb-3 text-lg">Aún no hay registros emocionales.</p>
              <Link 
                href="/vistas/registro-emocional" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#3649cc] dark:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-[#3649cc]/20 dark:shadow-indigo-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Captura cómo te sientes hoy
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          )}
        </section>

        {/* Sleep Progress Section */}
        <section className="mt-8 mb-16 bg-white dark:bg-white/5 rounded-3xl p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 hover:shadow-2xl transition-all duration-300 w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl self-start sm:self-auto">
              <Moon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Historial de Sueño</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Horas de descanso registradas por día</p>
            </div>
          </div>

          {fullSleepHistory.length > 0 ? (
            <div className="h-[250px] sm:h-[350px] w-full mt-6 bg-slate-50 dark:bg-black/20 rounded-2xl p-2 sm:p-4 border border-slate-100 dark:border-white/5">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...fullSleepHistory].reverse().map(s => {
                    const d = new Date(s.timestamp || s.date);
                    return {
                      name: isNaN(d.getTime()) ? s.date.slice(5) : `${d.getDate()}/${d.getMonth()+1}`,
                      horas: s.hours,
                      quality: s.quality,
                      fullDate: isNaN(d.getTime()) ? s.date : d.toLocaleDateString()
                    };
                  })} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHoras" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#888', fontSize: 10, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 14]} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 12, fontWeight: 500 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      color: 'white'
                    }}
                    itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                    labelStyle={{ color: '#aaa', marginBottom: '4px', fontSize: '12px' }}
                    formatter={(value: any) => [`${value} horas`, "Descanso"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="horas" 
                    stroke="#6366f1" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorHoras)" 
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1', stroke: 'white' }}
                  />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-slate-200 dark:bg-white/10 h-10 w-10"></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-black/20 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
              <Moon className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-6" />
              <p className="text-slate-600 dark:text-slate-400 font-medium mb-3 text-lg">Aún no hay registros de sueño.</p>
              <Link 
                href="/vistas/horario-sueno" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#3649cc] dark:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-[#3649cc]/20 dark:shadow-indigo-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Captura cómo dormiste
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}