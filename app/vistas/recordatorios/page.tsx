"use client";

import { useState, useEffect, useRef } from "react";
import { Pill, Calendar, Clock, CheckCircle2, Circle, MapPin, User, ChevronRight, Plus, Mic, X, Trash2, Smile, HelpCircle, Info, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth, db } from "../../../lib/firebase/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ref, onValue, set, remove, update } from "firebase/database";
import { ViewTutorialModal } from "@/components/ui/view-tutorial-modal";

type Medicine = {
  id: string;
  name: string;
  dosage?: string;
  route?: string;
  frequencyHours: number;
  durationDays: number;
  startDate: number; 
  lastTaken: number | null;
};

type Appointment = {
  id: string;
  title: string;
  date: string;
  time: string;
};

export default function RecordatoriosPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);


  const [currentTime, setCurrentTime] = useState(Date.now());

  // Forms state
  const [showMedForm, setShowMedForm] = useState(false);
  const [showApptForm, setShowApptForm] = useState(false);

  // New Med Form
  const [medName, setMedName] = useState("");
  const [medDose, setMedDose] = useState("");
  const [medRoute, setMedRoute] = useState("");
  const [medFreq, setMedFreq] = useState("");
  const [medDays, setMedDays] = useState("");
  const [medError, setMedError] = useState("");

  // New Appt Form
  const [apptTitle, setApptTitle] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [apptError, setApptError] = useState("");

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // New state for rescheduling and side effects
  const [editingApptId, setEditingApptId] = useState<string | null>(null);
  const [medSideEffects, setMedSideEffects] = useState<Record<string, string>>({});
  const [loadingSideEffects, setLoadingSideEffects] = useState<Record<string, boolean>>({});

  const [infoModalMed, setInfoModalMed] = useState<Medicine | null>(null);
  const [medInfoData, setMedInfoData] = useState<string>("");
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Magic Voice states
  const [isAnalyzingMed, setIsAnalyzingMed] = useState(false);
  const [medVoiceTranscript, setMedVoiceTranscript] = useState("");
  const [isListeningMed, setIsListeningMed] = useState(false);
  const medFullTranscriptRef = useRef("");

  // Firebase auth & real-time sync
  useEffect(() => {
    let unsubValue: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Listen to user data
        const userRef = ref(db, `users/${currentUser.uid}`);
        unsubValue = onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            if (data.medicines) {
              setMedicines(Object.values(data.medicines));
            } else {
              setMedicines([]);
            }
            if (data.appointments) {
              setAppointments(Object.values(data.appointments));
            } else {
              setAppointments([]);
            }
          } else {
            setMedicines([]);
            setAppointments([]);
          }
          setLoadingData(false);
        });
      } else {
        // No user logged in — allow page to work without Firebase sync
        setUser(null);
        if (unsubValue) {
          unsubValue();
          unsubValue = null;
        }
        setLoadingData(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubValue) unsubValue();
    };
  }, []);

  // Update current time every minute for the alarms
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleVoiceInput = (setter: (val: string) => void) => {
    if (typeof window === "undefined") return;
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta entrada de voz.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecordingVoice(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setter(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecordingVoice(false);
    };

    recognition.onend = () => {
      setIsRecordingVoice(false);
    };

    recognition.start();
  };

  const handleMagicVoiceMed = () => {
    if (typeof window === "undefined") return;
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta entrada de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-MX";
    recognition.interimResults = true; 
    recognition.continuous = false; 

    recognition.onstart = () => {
      setIsListeningMed(true);
      setMedVoiceTranscript("");
      medFullTranscriptRef.current = "";
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          medFullTranscriptRef.current += " " + chunk;
        } else {
          interimTranscript = chunk;
        }
      }
      setMedVoiceTranscript((medFullTranscriptRef.current + " " + interimTranscript).trim());
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      alert("Error en el micrófono: " + event.error);
      setIsListeningMed(false);
    };

    recognition.onend = async () => {
      // Don't auto-process here to give user control, 
      // or we can auto-process if we want.
      // For now, let's keep it manual or auto-process if transcript is long enough.
    };

    if (typeof window !== "undefined") {
      (window as any)._medRecognition = recognition;
    }
    recognition.start();
  };

  const processMedVoiceWithAI = async () => {
    if (typeof window !== "undefined" && (window as any)._medRecognition) {
      (window as any)._medRecognition.stop();
    }
    setIsListeningMed(false);

    const finalTranscript = medFullTranscriptRef.current.trim() || medVoiceTranscript.trim();
    if (!finalTranscript) return;

    setIsAnalyzingMed(true);
    try {
      const res = await fetch("/api/deepseek/extract-med", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: finalTranscript }),
      });

      const data = await res.json();
      if (data.error) {
        alert("Error de la IA: " + data.error);
        return;
      }
      
      if (data.extracted) {
        const { name, dosage, route, frequencyHours, durationDays } = data.extracted;
        if (name) setMedName(name);
        if (dosage) setMedDose(dosage);
        if (route) setMedRoute(route);
        if (frequencyHours) setMedFreq(frequencyHours);
        if (durationDays) setMedDays(durationDays);
      } else {
        alert("No se pudo extraer información. Prueba a hablar más claro.");
      }
    } catch (error) {
      console.error("Error processing medicine voice:", error);
      alert("Error al procesar con IA. Revisa tu conexión.");
    } finally {
      setIsAnalyzingMed(false);
      setMedVoiceTranscript("");
    }
  };

  const processApptVoiceWithAI = async () => {
    if (typeof window !== "undefined" && (window as any)._medRecognition) {
      (window as any)._medRecognition.stop();
    }
    setIsListeningMed(false);

    const finalTranscript = medFullTranscriptRef.current.trim() || medVoiceTranscript.trim();
    if (!finalTranscript) return;

    setIsAnalyzingMed(true);
    try {
      const res = await fetch("/api/deepseek/extract-med", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: finalTranscript, type: 'appointment' }),
      });

      const data = await res.json();
      if (data.error) {
        alert("Error de la IA: " + data.error);
        return;
      }

      if (data.extracted) {
        const { title, date, time } = data.extracted;
        if (title) setApptTitle(title);
        if (date) setApptDate(date);
        if (time) setApptTime(time);
      } else {
        alert("No se pudo extraer información de la cita.");
      }
    } catch (error) {
      console.error("Error processing appointment voice:", error);
      alert("Error al procesar cita con IA.");
    } finally {
      setIsAnalyzingMed(false);
      setMedVoiceTranscript("");
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMedError("");

    if (!medName.trim() || !medFreq || !medDays) {
      setMedError("Todos los campos son obligatorios.");
      return;
    }

    const freq = parseInt(medFreq);
    const days = parseInt(medDays);

    if (isNaN(freq) || freq <= 0) {
      setMedError("La frecuencia debe ser un número mayor a 0.");
      return;
    }

    if (isNaN(days) || days <= 0) {
      setMedError("Los días deben ser un número mayor a 0.");
      return;
    }

    const newMedId = Date.now().toString();
    const newMed: Medicine = {
      id: newMedId,
      name: medName,
      dosage: medDose,
      route: medRoute,
      frequencyHours: freq,
      durationDays: days,
      startDate: Date.now(),
      lastTaken: null, // start now
    };

    try {
      await set(ref(db, `users/${user.uid}/medicines/${newMedId}`), newMed);
      setMedName("");
      setMedDose("");
      setMedRoute("");
      setMedFreq("");
      setMedDays("");
      setShowMedForm(false);
    } catch (err) {
      setMedError("Error al guardar el medicamento.");
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setApptError("");

    if (!apptTitle.trim() || !apptDate || !apptTime) {
      setApptError("Todos los campos son obligatorios.");
      return;
    }

    const apptId = editingApptId || Date.now().toString();
    const newAppt: Appointment = {
      id: apptId,
      title: apptTitle,
      date: apptDate,
      time: apptTime,
    };

    try {
      await set(ref(db, `users/${user.uid}/appointments/${apptId}`), newAppt);
      setApptTitle("");
      setApptDate("");
      setApptTime("");
      setEditingApptId(null);
      setShowApptForm(false);
    } catch (err) {
      setApptError("Error al guardar la cita.");
    }
  };

  const fetchSideEffects = async (med: Medicine) => {
    if (medSideEffects[med.id]) {
      const newEffects = { ...medSideEffects };
      delete newEffects[med.id];
      setMedSideEffects(newEffects);
      return;
    }

    setLoadingSideEffects(prev => ({ ...prev, [med.id]: true }));
    try {
      const res = await fetch("/api/deepseek/side-effects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ medicineName: med.name }),
      });
      const data = await res.json();
      if (data.sideEffects) {
        setMedSideEffects(prev => ({ ...prev, [med.id]: data.sideEffects }));
      } else if (data.error) {
        setMedSideEffects(prev => ({ ...prev, [med.id]: `Error: ${data.error}` }));
      }
    } catch (error) {
      console.error("Error fetching side effects:", error);
    } finally {
      setLoadingSideEffects(prev => ({ ...prev, [med.id]: false }));
    }
  };
  const fetchMedInfo = async (med: Medicine) => {
    setInfoModalMed(med);
    setLoadingInfo(true);
    setMedInfoData("");
    try {
      const res = await fetch("/api/deepseek/med-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ medicineName: med.name }),
      });
      const data = await res.json();
      if (data.info) {
        setMedInfoData(data.info);
      } else if (data.error) {
        setMedInfoData(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error fetching med info:", error);
      setMedInfoData("Error al obtener la información.");
    } finally {
      setLoadingInfo(false);
    }
  };

  const startReschedule = (appt: Appointment) => {
    setApptTitle(appt.title);
    setApptDate(appt.date);
    setApptTime(appt.time);
    setEditingApptId(appt.id);
    setShowApptForm(true);
  };

  const takeMedicine = async (id: string) => {
    if (!user) return;
    
    // Update the medicine's lastTaken
    const now = Date.now();
    await update(ref(db, `users/${user.uid}/medicines/${id}`), { lastTaken: now });


  };

  const deleteMedicine = async (id: string) => {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/medicines/${id}`));
  };

  const deleteAppointment = async (id: string) => {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/appointments/${id}`));
  };

  const getNextDoseInfo = (med: Medicine) => {
    if (!med.lastTaken) {
      return { text: "¡Tomar primera dosis ahora!", isUrgent: true, dateText: "Ahora" };
    }
    
    const nextDoseTime = med.lastTaken + (med.frequencyHours * 60 * 60 * 1000);
    const timeDiff = nextDoseTime - currentTime;
    
    if (timeDiff <= 0) {
      return { text: "¡Es hora de tu medicina!", isUrgent: true, dateText: "Ahora" };
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    const dateObj = new Date(nextDoseTime);
    const dateText = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let text = "Próxima dosis en ";
    if (hours > 0) text += `${hours}h `;
    text += `${minutes}m`;

    return { text, isUrgent: false, dateText };
  };

  if (loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3649cc] border-t-transparent"></div>
          <p className="text-slate-500 font-medium animate-pulse">Cargando Mía...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pt-24 pb-20">
      <ViewTutorialModal 
        viewId="recordatorios"
        title="Alertas Médicas"
        description="Lleva el control de todos tus medicamentos y citas. Mia te recordará cuándo tomar tus pastillas y te alertará de posibles interacciones usando IA avanzada."
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
              Recordatorios
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Tu salud al día
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Revisa tus medicamentos y próximas citas médicas.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          
          {/* Section: Medicinas */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3649cc]/10 dark:bg-indigo-500/20 text-[#3649cc] dark:text-indigo-400">
                  <Pill className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Medicinas Activas</h2>
              </div>
              <button 
                onClick={() => setShowMedForm(!showMedForm)}
                className="flex items-center gap-1 rounded-lg bg-[#3649cc]/10 dark:bg-indigo-500/20 px-3 py-1.5 text-sm font-semibold text-[#3649cc] dark:text-indigo-400 transition-colors hover:bg-[#3649cc]/20 dark:hover:bg-indigo-500/30"
              >
                <Plus className="h-4 w-4" /> Agregar
              </button>
            </div>

            {/* Medicine Form */}
            {showMedForm && (
              <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nuevo Medicamento</h3>
                  <button onClick={() => setShowMedForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {medError && <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm font-medium text-red-600 dark:text-red-400">{medError}</div>}
                
                {/* Magic Voice UI */}
                <div className="mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20">
                  <div className="rounded-[14px] bg-white dark:bg-slate-900 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                          <Mic className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">Llenado con Voz</span>
                      </div>
                      {isListeningMed ? (
                        <button 
                          onClick={processMedVoiceWithAI}
                          className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-indigo-700 active:scale-95"
                        >
                          <div className="h-2 w-2 animate-pulse rounded-full bg-red-400"></div>
                          Terminar y Procesar
                        </button>
                      ) : (
                        <button 
                          onClick={handleMagicVoiceMed}
                          disabled={isAnalyzingMed}
                          className="flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-4 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-all hover:bg-indigo-200 dark:hover:bg-indigo-900/50 disabled:opacity-50"
                        >
                          {isAnalyzingMed ? "Procesando..." : "Comenzar a hablar"}
                        </button>
                      )}
                    </div>
                    
                    {isListeningMed && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 mb-1">Mía te escucha...</p>
                        <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 text-sm text-slate-600 dark:text-slate-300 italic min-h-[60px] border border-slate-100 dark:border-white/10">
                          {medVoiceTranscript || "Di algo como: 'Tengo que tomar Paracetamol de 500mg vía oral cada 8 horas por 5 días'"}
                        </div>
                      </div>
                    )}
                    
                    {isAnalyzingMed && (
                      <div className="mt-3 flex flex-col items-center justify-center py-4 gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                        <p className="text-xs font-medium text-slate-500">Mía está extrayendo los datos...</p>
                      </div>
                    )}
                  </div>
                </div>
                <form onSubmit={handleAddMedicine} className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del medicamento</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        placeholder="Ej. Paracetamol" 
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 pr-12 text-sm outline-none focus:border-[#3649cc] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-[#3649cc]/10 dark:focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                      />
                      <button 
                        type="button"
                        onClick={() => handleVoiceInput(setMedName)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Dosis</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={medDose}
                          onChange={(e) => setMedDose(e.target.value)}
                          placeholder="Ej. 500mg" 
                          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 pr-10 text-sm outline-none focus:border-[#3649cc] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-[#3649cc]/10 dark:focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                        />
                        <button 
                          type="button"
                          onClick={() => handleVoiceInput(setMedDose)}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Vía</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={medRoute}
                          onChange={(e) => setMedRoute(e.target.value)}
                          placeholder="Ej. Oral" 
                          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 pr-10 text-sm outline-none focus:border-[#3649cc] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-[#3649cc]/10 dark:focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                        />
                        <button 
                          type="button"
                          onClick={() => handleVoiceInput(setMedRoute)}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cada (horas)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={medFreq}
                          onChange={(e) => setMedFreq(e.target.value)}
                          placeholder="Ej. 8" 
                          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 pr-10 text-sm outline-none focus:border-[#3649cc] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-[#3649cc]/10 dark:focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                        />
                        <button 
                          type="button"
                          onClick={() => handleVoiceInput(setMedFreq)}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Por (días)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={medDays}
                          onChange={(e) => setMedDays(e.target.value)}
                          placeholder="Ej. 5" 
                          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 pr-10 text-sm outline-none focus:border-[#3649cc] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-[#3649cc]/10 dark:focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                        />
                        <button 
                          type="button"
                          onClick={() => handleVoiceInput(setMedDays)}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="mt-2 w-full rounded-xl bg-[#3649cc] dark:bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#2b3aa3] dark:hover:bg-indigo-500">
                    Guardar Medicamento
                  </button>
                </form>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {medicines.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/20 p-8 text-center text-slate-500 dark:text-slate-400">
                  No tienes medicamentos activos.
                </div>
              ) : (
                medicines.map(med => {
                  const doseInfo = getNextDoseInfo(med);
                  
                  return (
                    <div key={med.id} className={`relative overflow-hidden flex flex-col rounded-3xl bg-white dark:bg-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${doseInfo.isUrgent ? 'border-[#3649cc]/30 dark:border-indigo-500/50 ring-1 ring-[#3649cc]/10 dark:ring-indigo-500/20' : 'border-slate-100 dark:border-white/10'}`}>
                      {doseInfo.isUrgent && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3649cc] dark:bg-indigo-500"></div>
                      )}
                      
                      <div className="flex items-center justify-between p-6 pb-4">
                        <div className="flex items-center gap-4 sm:gap-5">
                          <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl font-medium ${doseInfo.isUrgent ? 'bg-[#3649cc]/10 dark:bg-indigo-500/20 text-[#3649cc] dark:text-indigo-400' : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}>
                            <span className="text-sm font-bold uppercase">{doseInfo.dateText.split(' ')[0] || doseInfo.dateText}</span>
                            <span className="text-xs">{doseInfo.dateText.split(' ')[1] || ''}</span>
                          </div>
                          <div>
                            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                              {med.name}
                              <button 
                                onClick={() => fetchMedInfo(med)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3649cc]/10 dark:bg-indigo-500/20 text-[#3649cc] dark:text-indigo-400 transition-all hover:bg-[#3649cc] dark:hover:bg-indigo-500 hover:text-white dark:hover:text-white shadow-sm"
                                title="Información del medicamento"
                              >
                                <HelpCircle className="h-5 w-5" />
                              </button>
                            </h3>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Cada {med.frequencyHours}h</span>
                              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Por {med.durationDays} días</span>
                              {med.dosage && <span className="flex items-center gap-1 font-medium text-[#3649cc]/80 dark:text-indigo-400/80">Dosis: {med.dosage}</span>}
                              {med.route && <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400 italic">({med.route})</span>}
                            </div>
                            <p className={`mt-1.5 text-sm font-semibold ${doseInfo.isUrgent ? 'text-[#3649cc] dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                              {doseInfo.text}
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={() => takeMedicine(med.id)}
                          className={`transition-all hover:scale-110 active:scale-95 ${doseInfo.isUrgent ? 'text-[#3649cc] dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600 hover:text-[#3649cc] dark:hover:text-indigo-400'}`}
                          title="Marcar como tomado"
                        >
                          {doseInfo.isUrgent ? <Circle className="h-10 w-10" strokeWidth={2.5} /> : <CheckCircle2 className="h-10 w-10" strokeWidth={2.5} />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-black/10 px-6 py-3">
                        <button 
                          onClick={() => fetchSideEffects(med)}
                          disabled={loadingSideEffects[med.id]}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#3649cc] dark:text-indigo-400 transition-colors hover:bg-[#3649cc]/5 dark:hover:bg-indigo-500/10 disabled:opacity-50"
                        >
                          {loadingSideEffects[med.id] ? "Cargando..." : (medSideEffects[med.id] ? "Ocultar efectos" : "Efectos secundarios")}
                        </button>
                        
                        <button 
                          onClick={() => deleteMedicine(med.id)} 
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Eliminar
                        </button>
                      </div>

                      {medSideEffects[med.id] && (
                        <div className="px-6 pb-6">
                          <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200 shadow-inner">
                            <p className="mb-2 flex items-center gap-2 font-bold">
                              <Smile className="h-4 w-4 text-amber-600" /> Información de IA:
                            </p>
                            <div className="leading-relaxed whitespace-pre-line opacity-90">
                              {medSideEffects[med.id]}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Section: Próximas Citas */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                  <Calendar className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Próximas Citas</h2>
              </div>
              <button 
                onClick={() => setShowApptForm(!showApptForm)}
                className="flex items-center gap-1 rounded-lg bg-slate-200 dark:bg-white/10 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-300 dark:hover:bg-white/20"
              >
                <Plus className="h-4 w-4" /> Agregar
              </button>
            </div>

            {/* Appointment Form */}
            {showApptForm && (
              <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingApptId ? "Editar Cita" : "Nueva Cita Médica"}</h3>
                  <button onClick={() => { setShowApptForm(false); setEditingApptId(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {apptError && <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm font-medium text-red-600 dark:text-red-400">{apptError}</div>}

                {/* Magic Voice UI for Appointments */}
                <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-lg shadow-emerald-500/20">
                  <div className="rounded-[14px] bg-white dark:bg-slate-900 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                          <Mic className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">Cita con Voz</span>
                      </div>
                      {isListeningMed ? ( // Reuse listening state
                        <button 
                          onClick={processApptVoiceWithAI}
                          className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95"
                        >
                          <div className="h-2 w-2 animate-pulse rounded-full bg-red-400"></div>
                          Terminar y Procesar
                        </button>
                      ) : (
                        <button 
                          onClick={handleMagicVoiceMed} // Reuse recognition start
                          disabled={isAnalyzingMed}
                          className="flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-200 dark:hover:bg-indigo-900/50 disabled:opacity-50"
                        >
                          {isAnalyzingMed ? "Procesando..." : "Comenzar a hablar"}
                        </button>
                      )}
                    </div>
                    
                    {isListeningMed && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 mb-1">Mía te escucha...</p>
                        <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 text-sm text-slate-600 dark:text-slate-300 italic min-h-[60px] border border-slate-100 dark:border-white/10">
                          {medVoiceTranscript || "Di algo como: 'Tengo cita con el dentista mañana a las 4 de la tarde'"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <form onSubmit={handleAddAppointment} className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Doctor / Motivo</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={apptTitle}
                        onChange={(e) => setApptTitle(e.target.value)}
                        placeholder="Ej. Dra. Elena - Cardiología" 
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 pr-12 text-sm outline-none focus:border-[#3649cc] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-[#3649cc]/10 dark:focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                      />
                      <button 
                        type="button"
                        onClick={() => handleVoiceInput(setApptTitle)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Fecha</label>
                      <div 
                        className="relative cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          const input = e.currentTarget.querySelector('input');
                          if (input && 'showPicker' in HTMLInputElement.prototype) {
                            try { input.showPicker(); } catch (err) {}
                          }
                        }}
                      >
                        <input 
                          type="date" 
                          value={apptDate}
                          onChange={(e) => setApptDate(e.target.value)}
                          className="w-full cursor-pointer rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-3 pl-10 pr-10 text-sm outline-none transition-all focus:border-[#3649cc] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-[#3649cc]/10 dark:focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                        />
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#3649cc] dark:text-indigo-400" />
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleVoiceInput(setApptDate); }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Hora</label>
                      <div 
                        className="relative cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          const input = e.currentTarget.querySelector('input');
                          if (input && 'showPicker' in HTMLInputElement.prototype) {
                            try { input.showPicker(); } catch (err) {}
                          }
                        }}
                      >
                        <input 
                          type="time" 
                          value={apptTime}
                          onChange={(e) => setApptTime(e.target.value)}
                          className="w-full cursor-pointer rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-3 pl-10 pr-10 text-sm outline-none transition-all focus:border-[#3649cc] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-[#3649cc]/10 dark:focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                        />
                        <Clock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#3649cc] dark:text-indigo-400" />
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleVoiceInput(setApptTime); }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="mt-2 w-full rounded-xl bg-slate-800 dark:bg-white px-4 py-3 text-sm font-semibold text-white dark:text-slate-900 shadow-md transition-all hover:bg-slate-700 dark:hover:bg-slate-200">
                    {editingApptId ? "Actualizar Cita" : "Guardar Cita"}
                  </button>
                </form>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {appointments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/20 p-8 text-center text-slate-500 dark:text-slate-400">
                  No tienes citas programadas.
                </div>
              ) : (
                appointments.map(appt => {
                  const dateObj = new Date(`${appt.date}T${appt.time}`);
                  const dayText = dateObj.toLocaleDateString([], { day: 'numeric', month: 'short' });
                  const timeText = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={appt.id} className="group relative flex flex-col rounded-3xl bg-white dark:bg-white/5 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-white/10 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                      <button 
                        onClick={() => deleteAppointment(appt.id)}
                        className="absolute right-4 top-4 hidden text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 group-hover:block transition-colors"
                        title="Eliminar cita"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="mb-4 flex items-start justify-between pr-6">
                        <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Confirmada
                        </div>
                      </div>

                      <div className="mb-6 flex gap-4">
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                          <span className="text-xl font-bold">{dayText.split(' ')[0]}</span>
                          <span className="text-xs font-medium uppercase">{dayText.split(' ')[1]}</span>
                        </div>
                        <div>
                          <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white line-clamp-2">{appt.title}</h3>
                          <p className="flex items-center gap-1 text-sm font-medium text-[#3649cc] dark:text-indigo-400">
                            <Clock className="h-3.5 w-3.5" /> {timeText}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <button 
                          onClick={() => startReschedule(appt)}
                          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                        >
                          Reprogramar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>
      </div>

      {/* Medicine Info Modal */}
      {infoModalMed && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setInfoModalMed(null)}
        >
          <div 
            className="w-full max-w-md h-auto max-h-[85vh] sm:max-h-[600px] flex flex-col rounded-[32px] bg-white dark:bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Fixed */}
            <div className="relative h-28 sm:h-32 bg-[#3649cc] p-6 sm:p-8 shrink-0">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-md">
                <Info className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <button 
                onClick={() => setInfoModalMed(null)}
                className="absolute right-4 top-4 sm:right-6 sm:top-6 rounded-full bg-black/10 p-2 text-white hover:bg-black/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute -bottom-5 left-6 sm:left-8 rounded-xl bg-white dark:bg-zinc-800 px-3 py-1.5 shadow-lg border border-slate-50 dark:border-white/5">
                <h4 className="text-[10px] sm:text-xs font-bold text-[#3649cc] dark:text-indigo-400 uppercase tracking-wider">Información Médica</h4>
              </div>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-10 sm:pt-12 custom-scrollbar">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">{infoModalMed.name}</h3>
              
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {loadingInfo ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3649cc] border-t-transparent"></div>
                    <p className="text-xs font-medium text-slate-400">Consultando a Mía...</p>
                  </div>
                ) : (
                  <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-line">
                    {medInfoData || "Cargando información..."}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-6 pt-2 shrink-0 border-t border-slate-50 dark:border-white/5">
              <button 
                onClick={() => setInfoModalMed(null)}
                className="w-full rounded-2xl bg-[#3649cc] dark:bg-indigo-600 py-3 sm:py-4 font-bold text-white shadow-lg shadow-[#3649cc]/30 dark:shadow-indigo-900/30 transition-all hover:bg-[#2b3aa3] dark:hover:bg-indigo-500 hover:shadow-xl active:scale-[0.98]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}