"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Clock, Bed, Bell, AlertCircle, CheckCircle2, Edit2, Plus, Trash2, Smile, Meh, Frown, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { auth, db } from "../../../lib/firebase/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ref, onValue, set } from "firebase/database";
import { ViewTutorialModal } from "@/components/ui/view-tutorial-modal";

export default function HorarioSuenoPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [bedTime, setBedTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [savedData, setSavedData] = useState(false);
  const [lastNotifiedTime, setLastNotifiedTime] = useState("");

  // History states
  type SleepRecord = {
    id: string;
    date: string;
    hours: number;
    quality: 'excellent' | 'good' | 'poor';
    timestamp: number;
  };
  const [sleepHistory, setSleepHistory] = useState<SleepRecord[]>([]);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logHours, setLogHours] = useState(8);
  const [logQuality, setLogQuality] = useState<'excellent'|'good'|'poor'>('excellent');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const sleepRef = ref(db, `users/${currentUser.uid}/sleep`);
        onValue(sleepRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            if (data.bedTime) setBedTime(data.bedTime);
            if (data.wakeTime) setWakeTime(data.wakeTime);
          }
        });

        const historyRef = ref(db, `users/${currentUser.uid}/sleepHistory`);
        onValue(historyRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const arr = Object.values(data) as SleepRecord[];
            arr.sort((a, b) => b.timestamp - a.timestamp);
            setSleepHistory(arr);
          } else {
            setSleepHistory([]);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Interval for checking time and sending notifications
  useEffect(() => {
    if (loading) return;

    const timer = setInterval(() => {
      const now = new Date();
      const currentH = now.getHours().toString().padStart(2, "0");
      const currentM = now.getMinutes().toString().padStart(2, "0");
      const currentTimeStr = `${currentH}:${currentM}`;

      // Only trigger once per minute
      if (currentTimeStr !== lastNotifiedTime) {
        if (currentTimeStr === bedTime) {
          sendNotification("🌙 Hora de dormir", "Cuida tu sueño. Es momento de apagar pantallas y prepararte para descansar.");
          setLastNotifiedTime(currentTimeStr);
        } else if (currentTimeStr === wakeTime) {
          sendNotification("☀️ ¡Buenos días!", "Ya es hora de despertar. Entra a la app y registra tu sueño de hoy.");
          setLastNotifiedTime(currentTimeStr);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(timer);
  }, [bedTime, wakeTime, lastNotifiedTime, loading]);

  const sendNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  const calculateDuration = () => {
    const [bedH, bedM] = bedTime.split(":").map(Number);
    const [wakeH, wakeM] = wakeTime.split(":").map(Number);
    
    let durationMins = (wakeH * 60 + wakeM) - (bedH * 60 + bedM);
    if (durationMins < 0) durationMins += 24 * 60;
    
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    
    return { hours, mins, totalHours: durationMins / 60 };
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await set(ref(db, `users/${user.uid}/sleep`), {
        bedTime,
        wakeTime,
      });
      setSavedData(true);

      // Request notification permissions when they activate it
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
      }

      setTimeout(() => setSavedData(false), 3000);
    } catch (error) {
      console.error("Error saving sleep schedule:", error);
    }
  };

  const handleRegisterSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Create a date object taking timezone into account
    const selectedDateObj = new Date(logDate + 'T12:00:00');
    const newId = selectedDateObj.getTime().toString();
    const displayDate = selectedDateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
    
    try {
      await set(ref(db, `users/${user.uid}/sleepHistory/${newId}`), {
        id: newId,
        date: displayDate,
        hours: logHours,
        quality: logQuality,
        timestamp: selectedDateObj.getTime()
      });
      setShowRegisterForm(false);
    } catch (error) {
      console.error("Error saving sleep log:", error);
    }
  };

  const deleteLog = async (id: string) => {
    if (!user) return;
    try {
      await set(ref(db, `users/${user.uid}/sleepHistory/${id}`), null);
    } catch (error) {
      console.error("Error deleting log:", error);
    }
  };

  const setOptimalBedtime = () => {
    const [wakeH, wakeM] = wakeTime.split(":").map(Number);
    let totalMins = (wakeH * 60 + wakeM) - (8 * 60); // 8 hours back
    if (totalMins < 0) totalMins += 24 * 60;
    
    const bedH = Math.floor(totalMins / 60).toString().padStart(2, "0");
    const bedM = (totalMins % 60).toString().padStart(2, "0");
    setBedTime(`${bedH}:${bedM}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3649cc] border-t-transparent"></div>
          <p className="text-slate-500 font-medium animate-pulse">Cargando tu horario...</p>
        </div>
      </div>
    );
  }

  const { hours, mins, totalHours } = calculateDuration();
  // We consider 7.5 to 9 hours as optimal
  const isOptimal = totalHours >= 7.5 && totalHours <= 9;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pb-20 overflow-x-hidden">
      <ViewTutorialModal 
        viewId="horario-sueno"
        title="Control de Sueño"
        description="Establece tus horas de dormir y despertar para que Mia calcule la calidad de tu descanso. Recibirás alertas suaves para recordarte tu hora de dormir."
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

      <div className="mx-auto max-w-5xl px-6 pt-24">
        
        <div className="mb-10 flex flex-col gap-4 sm:mb-12">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-[#3649cc] dark:text-indigo-400">
              Horario de Sueño
            </p>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl">
              Descansa mejor
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-2xl">
              Un buen descanso es clave para tu salud. Ajusta tu horario para dormir al menos 8 horas diarias y permite que tu cuerpo se recupere.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          
          {/* Section: Configuración del horario */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3649cc]/10 dark:bg-indigo-500/20 text-[#3649cc] dark:text-indigo-400">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Tu Horario</h2>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="flex flex-col gap-8">
                
                {/* Despertar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500 shadow-inner">
                      <Sun className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 px-1 sm:px-2">Despertar</p>
                      <div className="relative group/input inline-block">
                        <input 
                          type="time" 
                          value={wakeTime}
                          onChange={(e) => setWakeTime(e.target.value)}
                          className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors rounded-2xl px-3 sm:px-4 py-2 border border-slate-200 dark:border-white/20 outline-none focus:ring-4 focus:ring-[#3649cc]/20 cursor-pointer w-full sm:w-auto"
                        />
                        <div className="absolute -right-2 -top-2 bg-[#3649cc] dark:bg-indigo-500 text-white rounded-full p-1.5 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none shadow-md">
                          <Edit2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-[2px] w-full bg-slate-100 dark:bg-white/10 relative my-2">
                  <div className="absolute left-1/2 -top-3 -translate-x-1/2 bg-white dark:bg-[#1a1b26] px-4 text-[10px] font-bold text-slate-300 dark:text-slate-500 tracking-widest rounded-full">HASTA</div>
                </div>

                {/* Dormir */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-500 shadow-inner">
                      <Moon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 px-1 sm:px-2">Dormir</p>
                      <div className="relative group/input inline-block">
                        <input 
                          type="time" 
                          value={bedTime}
                          onChange={(e) => setBedTime(e.target.value)}
                          className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors rounded-2xl px-3 sm:px-4 py-2 border border-slate-200 dark:border-white/20 outline-none focus:ring-4 focus:ring-[#3649cc]/20 cursor-pointer w-full sm:w-auto"
                        />
                        <div className="absolute -right-2 -top-2 bg-[#3649cc] dark:bg-indigo-500 text-white rounded-full p-1.5 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none shadow-md">
                          <Edit2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              
              <button 
                onClick={handleSave}
                className="mt-12 w-full rounded-2xl bg-[#3649cc] px-4 py-4 text-sm font-bold text-white shadow-[0_10px_20px_rgba(54,73,204,0.3)] transition-all hover:bg-[#2b3aa3] hover:shadow-[0_10px_25px_rgba(54,73,204,0.4)] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {savedData ? <CheckCircle2 className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                {savedData ? "Horario Guardado" : "Activar Alarma"}
              </button>
            </div>
          </section>

          {/* Section: Análisis y Recomendaciones */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                <Bed className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Análisis del Sueño</h2>
            </div>

            {/* Tarjeta de estado */}
            <div className={`relative overflow-hidden rounded-3xl border p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all ${isOptimal ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10' : 'border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10'}`}>
              <div className="flex items-center gap-4 mb-2">
                <div className={`text-3xl xs:text-4xl sm:text-6xl font-black tracking-tight ${isOptimal ? 'text-emerald-900 dark:text-emerald-400' : 'text-amber-900 dark:text-amber-400'}`}>
                  {hours}<span className="text-xl sm:text-3xl opacity-50 font-bold">h</span> {mins}<span className="text-xl sm:text-3xl opacity-50 font-bold">m</span>
                </div>
              </div>
              <p className={`text-base sm:text-lg font-bold mb-2 ${isOptimal ? 'text-emerald-700 dark:text-emerald-500' : 'text-amber-700 dark:text-amber-500'}`}>Tiempo en cama</p>
              
              {isOptimal ? (
                <div className="flex items-start gap-3 mt-6 text-emerald-800 dark:text-emerald-200 bg-emerald-100/50 dark:bg-emerald-900/30 p-4 rounded-2xl">
                  <CheckCircle2 className="h-6 w-6 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-medium leading-relaxed">¡Excelente! Estás dentro del rango óptimo de 8 horas. Este horario te ayudará a mantener buena salud cardiovascular y mental.</p>
                </div>
              ) : (
                <div className="flex items-start gap-3 mt-6 text-amber-800 dark:text-amber-200 bg-amber-100/50 dark:bg-amber-900/30 p-4 rounded-2xl">
                  <AlertCircle className="h-6 w-6 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm font-medium leading-relaxed">Estás fuera del rango recomendado de 8 horas. Dormir menos afecta tu rendimiento, metabolismo y sistema inmunológico.</p>
                </div>
              )}

              {!isOptimal && (
                <button 
                  onClick={setOptimalBedtime}
                  className="mt-6 w-full rounded-2xl bg-white dark:bg-white/5 px-4 py-4 text-sm font-bold text-amber-700 dark:text-amber-400 shadow-sm transition-all hover:bg-amber-100 dark:hover:bg-white/10 border border-amber-200 dark:border-amber-500/30 active:scale-[0.98]"
                >
                  Ajustar hora de dormir para lograr 8h
                </button>
              )}
            </div>

            <div className="rounded-3xl bg-white dark:bg-white/5 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-white/10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recomendaciones de higiene del sueño</h3>
              <ul className="space-y-5 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3649cc]/10 text-[#3649cc] dark:bg-indigo-500/20 dark:text-indigo-400 shrink-0 mt-0.5 font-bold">
                    1
                  </div>
                  <p className="leading-relaxed"><strong>Desconexión digital:</strong> Evita pantallas (celular, TV) al menos 1 hora antes de tu hora de dormir ({bedTime}).</p>
                </li>
                <li className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3649cc]/10 text-[#3649cc] dark:bg-indigo-500/20 dark:text-indigo-400 shrink-0 mt-0.5 font-bold">
                    2
                  </div>
                  <p className="leading-relaxed"><strong>Ambiente oscuro:</strong> Mantén tu habitación oscura, fresca y sin ruidos para promover la producción de melatonina.</p>
                </li>
                <li className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3649cc]/10 text-[#3649cc] dark:bg-indigo-500/20 dark:text-indigo-400 shrink-0 mt-0.5 font-bold">
                    3
                  </div>
                  <p className="leading-relaxed"><strong>Constancia:</strong> Intenta despertar todos los días a las {wakeTime}, incluso durante los fines de semana.</p>
                </li>
              </ul>
            </div>

          </section>
        </div>

        {/* Section: Historial y Registro */}
        <section className="mt-12 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Moon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Historial de Descanso</h2>
            </div>
            <button 
              onClick={() => setShowRegisterForm(!showRegisterForm)}
              className="flex items-center gap-1 rounded-lg bg-[#3649cc]/10 dark:bg-indigo-500/20 px-3 py-1.5 text-sm font-semibold text-[#3649cc] dark:text-indigo-400 transition-colors hover:bg-[#3649cc]/20 dark:hover:bg-indigo-500/30"
            >
              <Plus className="h-4 w-4" /> Registrar por día
            </button>
          </div>

          {/* Formulario de registro */}
          {showRegisterForm && (
            <div className="mb-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">¿Cuánto dormiste?</h3>
              <form onSubmit={handleRegisterSleep} className="flex flex-col sm:flex-row flex-wrap items-end gap-6">
                
                <div className="w-full sm:w-auto">
                  <label className="mb-2 block text-sm font-bold text-slate-500 dark:text-slate-400">Fecha del registro</label>
                  <input 
                    type="date" 
                    max={new Date().toISOString().split('T')[0]}
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full rounded-2xl bg-slate-100 dark:bg-white/10 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3649cc]/20"
                    required
                  />
                </div>

                <div className="w-full sm:w-1/3">
                  <label className="mb-2 block text-sm font-bold text-slate-500 dark:text-slate-400">Horas dormidas</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" max="14" step="0.5"
                      value={logHours}
                      onChange={(e) => setLogHours(Number(e.target.value))}
                      className="w-full accent-[#3649cc] dark:accent-indigo-400"
                    />
                    <span className="text-xl font-black text-slate-900 dark:text-white w-12 text-center">{logHours}h</span>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex-1">
                  <label className="mb-2 block text-sm font-bold text-slate-500 dark:text-slate-400">Calidad del sueño</label>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setLogQuality('poor')}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${logQuality === 'poor' ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400'}`}
                    >
                      <Frown className="h-6 w-6" /> <span className="text-xs font-bold">Malo</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setLogQuality('good')}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${logQuality === 'good' ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400'}`}
                    >
                      <Meh className="h-6 w-6" /> <span className="text-xs font-bold">Regular</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setLogQuality('excellent')}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${logQuality === 'excellent' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400'}`}
                    >
                      <Smile className="h-6 w-6" /> <span className="text-xs font-bold">Excelente</span>
                    </button>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <button type="submit" className="w-full sm:w-auto rounded-2xl bg-[#3649cc] px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#2b3aa3] active:scale-[0.98]">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Historial y Gráfica */}
          <div className="flex flex-col gap-6">
            {sleepHistory.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-300 dark:border-white/20 p-8 text-center text-slate-500 dark:text-slate-400">
                Aún no has registrado tu sueño. ¡Comienza hoy!
              </div>
            ) : (
              <>
                {/* Gráfica de tendencia */}
                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 sm:p-8 shadow-sm h-72">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wider">Tendencia de horas dormidas</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...sleepHistory].reverse()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3649cc" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3649cc" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                        dy={10} 
                        minTickGap={20}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#3649cc', fontWeight: 'bold' }}
                        labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="hours" 
                        name="Horas"
                        stroke="#3649cc" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorHours)" 
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#3649cc' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Tarjetas individuales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {sleepHistory.map((record) => (
                    <div key={record.id} className="relative group rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 capitalize">{record.date}</p>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">{record.hours}h</span>
                          {record.quality === 'excellent' && <span className="text-emerald-500 flex items-center gap-1 text-sm font-bold"><Smile className="w-4 h-4" /> Bien</span>}
                          {record.quality === 'good' && <span className="text-amber-500 flex items-center gap-1 text-sm font-bold"><Meh className="w-4 h-4" /> Regular</span>}
                          {record.quality === 'poor' && <span className="text-red-500 flex items-center gap-1 text-sm font-bold"><Frown className="w-4 h-4" /> Mal</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteLog(record.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
