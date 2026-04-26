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
import { Smile, Meh, Frown, Moon, ArrowLeft, Clock, User, Edit, Check, TrendingUp, BarChart2, Sparkles } from "lucide-react";
import { auth, db } from "../../../lib/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";

export default function AvancesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [diagnostico, setDiagnostico] = useState<string>("");
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editPeso, setEditPeso] = useState("");
  const [editEstatura, setEditEstatura] = useState("");
  
  const [isEditingDiag, setIsEditingDiag] = useState(false);
  const [editDiag, setEditDiag] = useState("");
  const [isGeneratingDiag, setIsGeneratingDiag] = useState(false);
  const [latestSleep, setLatestSleep] = useState<any>(null);

  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    // Load profile
    const savedProfile = localStorage.getItem("mia_patient_profile");
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      setEditPeso(parsed.peso || "");
      setEditEstatura(parsed.estatura || "");
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
    getSleepData();

  }, []);

  const saveBio = () => {
    if (!profile) return;
    const now = new Date().toISOString();
    const updatedProfile = {
      ...profile,
      peso: editPeso,
      estatura: editEstatura,
      lastUpdated: now
    };
    localStorage.setItem("mia_patient_profile", JSON.stringify(updatedProfile));
    setProfile(updatedProfile);
    setLastUpdated(now);
    setIsEditingBio(false);
  };

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
        body: JSON.stringify({ profile, medicines, moodHistory })
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

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pt-24 pb-20">
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
          <section className="bg-white dark:bg-white/5 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            {/* Standard icon placement */}
            <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-all duration-500 rotate-12">
              <User className="w-24 h-24 text-[#3649cc] dark:text-indigo-400" />
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <div className="w-2 h-6 bg-[#3649cc] dark:bg-indigo-500 rounded-full" />
                Datos Físicos
              </h2>
              {!isEditingBio ? (
                <button onClick={() => setIsEditingBio(true)} className="p-2 text-slate-400 hover:text-[#3649cc] dark:hover:text-indigo-400 transition-colors bg-slate-100 dark:bg-white/5 rounded-xl">
                  <Edit className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={saveBio} className="px-4 py-2 text-white bg-emerald-500 hover:bg-emerald-600 transition-colors rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-emerald-500/20">
                  <Check className="w-5 h-5" />
                  Guardar
                </button>
              )}
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
                  {isEditingBio ? (
                    <div className="flex items-end gap-2">
                      <input 
                        type="number" 
                        value={editPeso} 
                        onChange={(e) => setEditPeso(e.target.value)}
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xl font-bold focus:ring-2 focus:ring-[#3649cc] dark:focus:ring-indigo-500 outline-none transition-shadow"
                      />
                      <span className="text-slate-400 font-bold mb-2">kg</span>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold">{profile?.peso || "--"} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">kg</span></p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estatura</p>
                  {isEditingBio ? (
                    <div className="flex items-end gap-2">
                      <input 
                        type="number" 
                        value={editEstatura} 
                        onChange={(e) => setEditEstatura(e.target.value)}
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xl font-bold focus:ring-2 focus:ring-[#3649cc] dark:focus:ring-indigo-500 outline-none transition-shadow"
                      />
                      <span className="text-slate-400 font-bold mb-2">cm</span>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold">{profile?.estatura || "--"} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">cm</span></p>
                  )}
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

          {/* Diagnosis Section */}
          <section className="bg-white dark:bg-white/5 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 flex flex-col group hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <div className="w-2 h-6 bg-[#3649cc] dark:bg-indigo-500 rounded-full" />
                Diagnóstico Actual
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={generateDiagnosisWithAI} 
                  disabled={isGeneratingDiag}
                  className="px-4 py-2 text-white bg-[#3649cc] hover:bg-[#2b3aa3] transition-colors rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  <Sparkles className={isGeneratingDiag ? "w-5 h-5 animate-pulse" : "w-5 h-5"} />
                  {isGeneratingDiag ? "Generando..." : "Generar con IA"}
                </button>
                {!isEditingDiag ? (
                  <button onClick={() => setIsEditingDiag(true)} className="p-2 text-slate-400 hover:text-[#3649cc] transition-colors bg-slate-100 dark:bg-white/5 rounded-xl">
                    <Edit className="w-5 h-5" />
                  </button>
                ) : (
                  <button onClick={saveDiag} className="px-4 py-2 text-white bg-emerald-500 hover:bg-emerald-600 transition-colors rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-emerald-500/20">
                    <Check className="w-5 h-5" />
                    Guardar
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-500/10">
              {isEditingDiag ? (
                <textarea
                  value={editDiag}
                  onChange={(e) => setEditDiag(e.target.value)}
                  className="w-full h-full min-h-[180px] bg-white dark:bg-black/50 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-4 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-shadow"
                  placeholder="Describe o actualiza tu diagnóstico médico actual..."
                />
              ) : (
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {diagnostico}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Mood Progress Section */}
        <section className="mt-8 bg-white dark:bg-white/5 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Progreso Emocional</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Historial de tu estado de ánimo en escala de intensidad (0-10)</p>
            </div>
          </div>

          {moodHistory.length > 0 ? (
            <div className="h-[350px] w-full mt-6 bg-slate-50 dark:bg-black/20 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={moodHistory} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
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
                    tick={{ fill: '#888', fontSize: 12, fontWeight: 500 }}
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
      </div>
    </main>
  );
}