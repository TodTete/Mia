"use client";

import { useState, useEffect } from "react";
import { Pill, Calendar, Clock, CheckCircle2, Circle, MapPin, User, ChevronRight, Plus, Mic, X, Trash2, Smile, HelpCircle, Info } from "lucide-react";
import { auth, db } from "../../../lib/firebase/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ref, onValue, set, remove, update } from "firebase/database";

type Medicine = {
  id: string;
  name: string;
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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);


  const [currentTime, setCurrentTime] = useState(Date.now());

  // Forms state
  const [showMedForm, setShowMedForm] = useState(false);
  const [showApptForm, setShowApptForm] = useState(false);

  // New Med Form
  const [medName, setMedName] = useState("");
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

  // Info Modal states
  const [infoModalMed, setInfoModalMed] = useState<Medicine | null>(null);
  const [medInfoData, setMedInfoData] = useState<string>("");
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Firebase auth & real-time sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Listen to user data
        const userRef = ref(db, `users/${currentUser.uid}`);
        const unsubValue = onValue(userRef, (snapshot) => {
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

        return () => {};
      } else {
        // No user logged in — allow page to work without Firebase sync
        setLoadingData(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Update current time every minute for the alarms
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleVoiceInput = (setter: (val: string) => void) => {
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
      frequencyHours: freq,
      durationDays: days,
      startDate: Date.now(),
      lastTaken: null, // start now
    };

    try {
      await set(ref(db, `users/${user.uid}/medicines/${newMedId}`), newMed);
      setMedName("");
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
    <main className="min-h-screen bg-slate-50 px-6 py-10 font-sans text-slate-900 sm:px-10">
      <div className="mx-auto max-w-5xl">
        
        <div className="mb-10 flex flex-col gap-4 sm:mb-12">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-[#3649cc]">
              Recordatorios
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Tu salud al día
            </h1>
            <p className="mt-2 text-slate-500">
              Revisa tus medicamentos y próximas citas médicas.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          
          {/* Section: Medicinas */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3649cc]/10 text-[#3649cc]">
                  <Pill className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Medicinas Activas</h2>
              </div>
              <button 
                onClick={() => setShowMedForm(!showMedForm)}
                className="flex items-center gap-1 rounded-lg bg-[#3649cc]/10 px-3 py-1.5 text-sm font-semibold text-[#3649cc] transition-colors hover:bg-[#3649cc]/20"
              >
                <Plus className="h-4 w-4" /> Agregar
              </button>
            </div>

            {/* Medicine Form */}
            {showMedForm && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Nuevo Medicamento</h3>
                  <button onClick={() => setShowMedForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {medError && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{medError}</div>}
                <form onSubmit={handleAddMedicine} className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del medicamento</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        placeholder="Ej. Paracetamol" 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none focus:border-[#3649cc] focus:bg-white focus:ring-4 focus:ring-[#3649cc]/10"
                      />
                      <button 
                        type="button"
                        onClick={() => handleVoiceInput(setMedName)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Cada (horas)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={medFreq}
                          onChange={(e) => setMedFreq(e.target.value)}
                          placeholder="Ej. 8" 
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none focus:border-[#3649cc] focus:bg-white focus:ring-4 focus:ring-[#3649cc]/10"
                        />
                        <button 
                          type="button"
                          onClick={() => handleVoiceInput(setMedFreq)}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Por (días)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={medDays}
                          onChange={(e) => setMedDays(e.target.value)}
                          placeholder="Ej. 5" 
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none focus:border-[#3649cc] focus:bg-white focus:ring-4 focus:ring-[#3649cc]/10"
                        />
                        <button 
                          type="button"
                          onClick={() => handleVoiceInput(setMedDays)}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="mt-2 w-full rounded-xl bg-[#3649cc] px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#2b3aa3]">
                    Guardar Medicamento
                  </button>
                </form>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {medicines.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  No tienes medicamentos activos.
                </div>
              ) : (
                medicines.map(med => {
                  const doseInfo = getNextDoseInfo(med);
                  
                  return (
                    <div key={med.id} className={`relative overflow-hidden flex flex-col rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${doseInfo.isUrgent ? 'border-[#3649cc]/30 ring-1 ring-[#3649cc]/10' : 'border-slate-100'}`}>
                      {doseInfo.isUrgent && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3649cc]"></div>
                      )}
                      
                      <div className="flex items-center justify-between p-6 pb-4">
                        <div className="flex items-center gap-4 sm:gap-5">
                          <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl font-medium ${doseInfo.isUrgent ? 'bg-[#3649cc]/10 text-[#3649cc]' : 'bg-slate-50 text-slate-500'}`}>
                            <span className="text-sm font-bold uppercase">{doseInfo.dateText.split(' ')[0] || doseInfo.dateText}</span>
                            <span className="text-xs">{doseInfo.dateText.split(' ')[1] || ''}</span>
                          </div>
                          <div>
                            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 line-clamp-1">
                              {med.name}
                              <button 
                                onClick={() => fetchMedInfo(med)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3649cc]/10 text-[#3649cc] transition-all hover:bg-[#3649cc] hover:text-white shadow-sm"
                                title="Información del medicamento"
                              >
                                <HelpCircle className="h-5 w-5" />
                              </button>
                            </h3>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Cada {med.frequencyHours}h</span>
                              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Por {med.durationDays} días</span>
                            </div>
                            <p className={`mt-1.5 text-sm font-semibold ${doseInfo.isUrgent ? 'text-[#3649cc]' : 'text-slate-400'}`}>
                              {doseInfo.text}
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={() => takeMedicine(med.id)}
                          className={`transition-all hover:scale-110 active:scale-95 ${doseInfo.isUrgent ? 'text-[#3649cc]' : 'text-slate-300 hover:text-[#3649cc]'}`}
                          title="Marcar como tomado"
                        >
                          {doseInfo.isUrgent ? <Circle className="h-10 w-10" strokeWidth={2.5} /> : <CheckCircle2 className="h-10 w-10" strokeWidth={2.5} />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/30 px-6 py-3">
                        <button 
                          onClick={() => fetchSideEffects(med)}
                          disabled={loadingSideEffects[med.id]}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#3649cc] transition-colors hover:bg-[#3649cc]/5 disabled:opacity-50"
                        >
                          {loadingSideEffects[med.id] ? "Cargando..." : (medSideEffects[med.id] ? "Ocultar efectos" : "Efectos secundarios")}
                        </button>
                        
                        <button 
                          onClick={() => deleteMedicine(med.id)} 
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Eliminar
                        </button>
                      </div>

                      {medSideEffects[med.id] && (
                        <div className="px-6 pb-6">
                          <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900 shadow-inner">
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                  <Calendar className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Próximas Citas</h2>
              </div>
              <button 
                onClick={() => setShowApptForm(!showApptForm)}
                className="flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-300"
              >
                <Plus className="h-4 w-4" /> Agregar
              </button>
            </div>

            {/* Appointment Form */}
            {showApptForm && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold">{editingApptId ? "Editar Cita" : "Nueva Cita Médica"}</h3>
                  <button onClick={() => { setShowApptForm(false); setEditingApptId(null); }} className="text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {apptError && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{apptError}</div>}
                <form onSubmit={handleAddAppointment} className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Doctor / Motivo</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={apptTitle}
                        onChange={(e) => setApptTitle(e.target.value)}
                        placeholder="Ej. Dra. Elena - Cardiología" 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none focus:border-[#3649cc] focus:bg-white focus:ring-4 focus:ring-[#3649cc]/10"
                      />
                      <button 
                        type="button"
                        onClick={() => handleVoiceInput(setApptTitle)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Fecha</label>
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
                          className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none transition-all focus:border-[#3649cc] focus:bg-white focus:ring-4 focus:ring-[#3649cc]/10"
                        />
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#3649cc]" />
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleVoiceInput(setApptDate); }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Hora</label>
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
                          className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none transition-all focus:border-[#3649cc] focus:bg-white focus:ring-4 focus:ring-[#3649cc]/10"
                        />
                        <Clock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#3649cc]" />
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleVoiceInput(setApptTime); }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-lg p-1.5 transition-colors ${isRecordingVoice ? 'bg-red-100 text-red-500' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="mt-2 w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-700">
                    {editingApptId ? "Actualizar Cita" : "Guardar Cita"}
                  </button>
                </form>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {appointments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  No tienes citas programadas.
                </div>
              ) : (
                appointments.map(appt => {
                  const dateObj = new Date(`${appt.date}T${appt.time}`);
                  const dayText = dateObj.toLocaleDateString([], { day: 'numeric', month: 'short' });
                  const timeText = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={appt.id} className="group relative flex flex-col rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                      <button 
                        onClick={() => deleteAppointment(appt.id)}
                        className="absolute right-4 top-4 hidden text-slate-300 hover:text-red-500 group-hover:block"
                        title="Eliminar cita"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="mb-4 flex items-start justify-between pr-6">
                        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                          Confirmada
                        </div>
                      </div>

                      <div className="mb-6 flex gap-4">
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                          <span className="text-xl font-bold">{dayText.split(' ')[0]}</span>
                          <span className="text-xs font-medium uppercase">{dayText.split(' ')[1]}</span>
                        </div>
                        <div>
                          <h3 className="mb-1 text-lg font-bold text-slate-900 line-clamp-2">{appt.title}</h3>
                          <p className="flex items-center gap-1 text-sm font-medium text-[#3649cc]">
                            <Clock className="h-3.5 w-3.5" /> {timeText}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <button 
                          onClick={() => startReschedule(appt)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setInfoModalMed(null)}
        >
          <div 
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-28 sm:h-32 bg-[#3649cc] p-6 sm:p-8">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-md">
                <Info className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <button 
                onClick={() => setInfoModalMed(null)}
                className="absolute right-4 top-4 sm:right-6 sm:top-6 rounded-full bg-black/10 p-2 text-white hover:bg-black/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute -bottom-5 left-6 sm:left-8 rounded-xl bg-white px-3 py-1.5 shadow-lg border border-slate-50">
                <h4 className="text-[10px] sm:text-xs font-bold text-[#3649cc] uppercase tracking-wider">Información Médica</h4>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 pt-8 sm:pt-10">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">{infoModalMed.name}</h3>
              
              <div className="min-h-[100px] text-slate-600 leading-relaxed text-sm sm:text-base">
                {loadingInfo ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3649cc] border-t-transparent"></div>
                    <p className="text-xs font-medium text-slate-400">Consultando a Mía...</p>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none whitespace-pre-line">
                    {medInfoData}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setInfoModalMed(null)}
                  className="w-full rounded-2xl bg-[#3649cc] py-3 sm:py-4 font-bold text-white shadow-lg shadow-[#3649cc]/30 transition-all hover:bg-[#2b3aa3] hover:shadow-xl active:scale-[0.98]"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}