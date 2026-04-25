"use client";

import { useState, useEffect } from "react";
import { Pill, Calendar, Clock, CheckCircle2, Circle, MapPin, User, ChevronRight, Plus, Mic, X, Trash2, Flame } from "lucide-react";
import { auth, db } from "../../../lib/firebase/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ref, onValue, set, remove, update } from "firebase/database";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastStreakUpdate, setLastStreakUpdate] = useState(0);

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
            setStreak(data.streak || 0);
            setLastStreakUpdate(data.lastStreakUpdate || 0);
          } else {
            // First time setup if empty somehow
            setMedicines([]);
            setAppointments([]);
          }
          setLoadingData(false);
        });

        return () => {
          // Cleanup real-time listener is tricky inside onAuthStateChanged,
          // but we can just let it be or rely on unmount.
        };
      } else {
        router.push("/vistas/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

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

    const newApptId = Date.now().toString();
    const newAppt: Appointment = {
      id: newApptId,
      title: apptTitle,
      date: apptDate,
      time: apptTime,
    };

    try {
      await set(ref(db, `users/${user.uid}/appointments/${newApptId}`), newAppt);
      setApptTitle("");
      setApptDate("");
      setApptTime("");
      setShowApptForm(false);
    } catch (err) {
      setApptError("Error al guardar la cita.");
    }
  };

  const takeMedicine = async (id: string) => {
    if (!user) return;
    
    // Update the medicine's lastTaken
    const now = Date.now();
    await update(ref(db, `users/${user.uid}/medicines/${id}`), { lastTaken: now });

    // Handle Streak Logic
    const todayStr = new Date().toDateString(); // e.g. "Mon May 14 2026"
    const lastUpdateStr = lastStreakUpdate ? new Date(lastStreakUpdate).toDateString() : "";
    
    // Si no lo hemos actualizado hoy
    if (todayStr !== lastUpdateStr) {
      // Checar si es el día consecutivo
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const lastUpdate = new Date(lastStreakUpdate);
      lastUpdate.setHours(0,0,0,0);
      
      const diffTime = Math.abs(today.getTime() - lastUpdate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      let newStreak = streak;
      if (diffDays === 1) {
        // Consecutivo
        newStreak += 1;
      } else if (diffDays > 1 || lastStreakUpdate === 0) {
        // Se rompió la racha o es la primera vez
        newStreak = 1;
      }
      
      // Si difDays === 0, ya se actualizó hoy (cubierto por el primer if todayStr !== lastUpdateStr)
      
      await update(ref(db, `users/${user.uid}`), { 
        streak: newStreak, 
        lastStreakUpdate: now 
      });
    }
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
        <p className="text-slate-500 font-medium">Cargando recordatorios...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 font-sans text-slate-900 sm:px-10">
      <div className="mx-auto max-w-5xl">
        
        {/* Header con Racha */}
        <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-start sm:justify-between">
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
          
          {/* Tarjeta de Racha */}
          <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-orange-50 to-orange-100 p-5 shadow-sm border border-orange-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-inner shadow-orange-700/50">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Racha de tomas</p>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-black text-slate-900 leading-none">{streak}</span>
                <span className="text-sm font-medium text-slate-600 pb-0.5">días seguidos</span>
              </div>
            </div>
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
                    <div key={med.id} className={`relative overflow-hidden flex items-center justify-between rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${doseInfo.isUrgent ? 'border-[#3649cc]' : 'border-slate-100'}`}>
                      {doseInfo.isUrgent && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3649cc]"></div>
                      )}
                      
                      <div className="flex flex-1 items-center gap-4 sm:gap-5 pl-2">
                        <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl font-medium ${doseInfo.isUrgent ? 'bg-[#3649cc]/10 text-[#3649cc]' : 'bg-slate-50 text-slate-500'}`}>
                          <span className="text-sm font-bold uppercase">{doseInfo.dateText.split(' ')[0] || doseInfo.dateText}</span>
                          <span className="text-xs">{doseInfo.dateText.split(' ')[1] || ''}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 line-clamp-1">
                            {med.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Cada {med.frequencyHours}h</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Por {med.durationDays} días</span>
                          </div>
                          <p className={`mt-1.5 text-sm font-medium ${doseInfo.isUrgent ? 'text-[#3649cc]' : 'text-slate-400'}`}>
                            {doseInfo.text}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex shrink-0 flex-col items-center gap-2">
                        <button 
                          onClick={() => takeMedicine(med.id)}
                          className={`transition-transform hover:scale-110 ${doseInfo.isUrgent ? 'text-[#3649cc]' : 'text-slate-300 hover:text-[#3649cc]'}`}
                          title="Marcar como tomado"
                        >
                          {doseInfo.isUrgent ? <Circle className="h-8 w-8" strokeWidth={2} /> : <CheckCircle2 className="h-8 w-8" strokeWidth={2} />}
                        </button>
                        <button onClick={() => deleteMedicine(med.id)} className="text-slate-300 hover:text-red-500" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
                  <h3 className="text-lg font-bold">Nueva Cita Médica</h3>
                  <button onClick={() => setShowApptForm(false)} className="text-slate-400 hover:text-slate-600">
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
                    Guardar Cita
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

                      <div className="mt-auto grid grid-cols-2 gap-3">
                        <button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900">
                          Reprogramar
                        </button>
                        <button className="rounded-xl bg-[#3649cc] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#3649cc]/20 transition-all hover:bg-[#2b3aa3] hover:shadow-lg hover:shadow-[#3649cc]/30">
                          Ver Detalles
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
    </main>
  );
}