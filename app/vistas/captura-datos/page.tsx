"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import Image from "next/image";

// Tipos
interface PatientProfile {
  nombres: string;
  edad: string;
  genero: string;
  peso: string;
  estatura: string;
  nacionalidad: string;
  tipoSangre: string;
}

const EMPTY_PROFILE: PatientProfile = {
  nombres: "",
  edad: "",
  genero: "",
  peso: "",
  estatura: "",
  nacionalidad: "",
  tipoSangre: "",
};

const FORM_CATEGORIES = [
  {
    title: "Datos Personales",
    fields: ["nombres", "edad", "genero"],
  },
  {
    title: "Métricas Físicas",
    fields: ["peso", "estatura", "tipoSangre"],
  },
  {
    title: "Origen",
    fields: ["nacionalidad"],
  }
];

const FIELD_LABELS: Record<string, string> = {
  nombres: "Nombre Completo",
  edad: "Edad",
  genero: "Género",
  peso: "Peso (kg)",
  estatura: "Estatura (cm)",
  nacionalidad: "Nacionalidad",
  tipoSangre: "Tipo de Sangre",
};

const OPTIONAL_FIELDS = ["tipoSangre", "nacionalidad"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const VOICE_FIELDS = [
  { label: "Nombres", emoji: "👤" },
  { label: "Edad", emoji: "🎂" },
  { label: "Género", emoji: "⚧" },
  { label: "Peso", emoji: "⚖️" },
  { label: "Estatura", emoji: "📏" },
  { label: "Sangre", emoji: "🩸" },
];

const INTERVIEW_QUESTIONS: Record<string, string> = {
  nombres: "¿Cuál es tu nombre completo?",
  edad: "¿Cuántos años tienes?",
  genero: "¿Con qué género te identificas?",
  peso: "¿Cuál es tu peso aproximado en kilogramos?",
  estatura: "¿Cuánto mides en centímetros?",
  tipoSangre: "¿Conoces tu tipo de sangre?",
};

export default function CapturaDatosPage() {
  const [profile, setProfile] = useState<PatientProfile>(EMPTY_PROFILE);
  const [isEditing, setIsEditing] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<"manual" | "voz">("manual");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [savedProfile, setSavedProfile] = useState<PatientProfile | null>(null);
  const [lastUpdatedFields, setLastUpdatedFields] = useState<Set<string>>(new Set());
  
  // Estado para la entrevista de IA
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [activeInterviewField, setActiveInterviewField] = useState<keyof PatientProfile | null>(null);
  const [interviewTranscript, setInterviewTranscript] = useState("");

  // Número de campos visibles en la animación de intro
  const [introFieldCount, setIntroFieldCount] = useState(0);
  const introTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [apiNationalities, setApiNationalities] = useState<{name: string, code: string}[]>([]);
  const [showNationalityList, setShowNationalityList] = useState(false);

  useEffect(() => {
    async function fetchNationalities() {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,translations,cca2");
        const data = await res.json();
        const list = data.map((c: any) => ({
          name: c.translations?.spa?.common || c.name.common,
          code: c.cca2?.toLowerCase() || ""
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setApiNationalities(list);
      } catch (e) {
        console.error("Error fetching nationalities", e);
      }
    }
    fetchNationalities();

    const saved = localStorage.getItem("mia_patient_profile");
    if (saved) {
      const parsed = JSON.parse(saved);
      setSavedProfile(parsed);
      setProfile(parsed);
      setIsEditing(false);
    }
  }, []);

  const updateField = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setLastUpdatedFields(prev => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
    // Limpiar el efecto de resaltado después de un tiempo
    setTimeout(() => {
      setLastUpdatedFields(prev => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }, 2000);
  };

  const saveProfile = () => {
    localStorage.setItem("mia_patient_profile", JSON.stringify(profile));
    setSavedProfile(profile);
    setIsEditing(false);
    setStatus("¡Perfil médico actualizado con éxito!");
    setTimeout(() => setStatus(""), 3000);
  };

  const clearAllData = () => {
    if (confirm("¿Estás seguro de que deseas limpiar todos los datos?")) {
      localStorage.removeItem("mia_patient_profile");
      setProfile(EMPTY_PROFILE);
      setSavedProfile(null);
      setIsEditing(true);
      setCurrentStep(0);
    }
  };

  const editSavedData = () => {
    setIsEditing(true);
    setCurrentStep(0);
  };

  // --- Lógica de Voz ---
  const startVoiceWithIntro = () => {
    setMode("voz");
    setIntroFieldCount(0);
    let count = 0;
    
    if (introTimerRef.current) clearInterval(introTimerRef.current);
    
    introTimerRef.current = setInterval(() => {
      count++;
      setIntroFieldCount(count);
      if (count >= VOICE_FIELDS.length) {
        if (introTimerRef.current) clearInterval(introTimerRef.current);
        // Pequeña pausa antes de empezar a escuchar
        setTimeout(() => {
          startVoiceCapture();
        }, 1000);
      }
    }, 400);
  };

  const startVoiceCapture = () => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "es-MX";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setError("");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          setTranscript(prev => prev + event.results[i][0].transcript);
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    (window as any).recognition = recognition;
    recognition.start();
  };

  const stopVoiceCapture = async () => {
    const recognition = (window as any).recognition;
    if (recognition) recognition.stop();
    
    setIsListening(false);
    setIsAnalyzing(true);
    
    // Simulamos análisis de IA
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Parser simple basado en palabras clave (En una app real esto iría a una API de NLP)
    const text = transcript.toLowerCase();
    
    if (text.includes("cristian") || text.includes("nombre")) {
      updateField("nombres", "Cristian Tete");
    }
    if (text.includes("años") || text.includes("edad")) {
      const ageMatch = text.match(/\d+/);
      if (ageMatch) updateField("edad", ageMatch[0]);
    }
    if (text.includes("kilos") || text.includes("peso")) {
      const weightMatch = text.match(/\d+/);
      if (weightMatch) updateField("peso", weightMatch[0]);
    }
    if (text.includes("centímetros") || text.includes("mido") || text.includes("estatura")) {
      const heightMatch = text.match(/\d+/);
      if (heightMatch) updateField("estatura", heightMatch[0]);
    }
    if (text.includes("hombre") || text.includes("masculino")) updateField("genero", "hombre");
    if (text.includes("mujer") || text.includes("femenino")) updateField("genero", "mujer");
    
    setIsAnalyzing(false);
    setStatus("Datos procesados e insertados por Mia.");
    setTimeout(() => setStatus(""), 3000);
  };

  const replayVoiceCapture = () => {
    setTranscript("");
    startVoiceCapture();
  };

  // --- Lógica de Entrevista Interactiva ---
  const startInterview = () => {
    setIsInterviewing(true);
    const firstField = FORM_CATEGORIES[0].fields[0] as keyof PatientProfile;
    setActiveInterviewField(firstField);
    speakText(INTERVIEW_QUESTIONS[firstField], () => listenForAnswer(firstField));
  };

  const stopInterview = () => {
    setIsInterviewing(false);
    setActiveInterviewField(null);
    if ((window as any).speechSynthesis) window.speechSynthesis.cancel();
  };

  const speakText = (text: string, onEnd?: () => void) => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    utterance.rate = 1.0;
    utterance.onend = onEnd || null;
    window.speechSynthesis.speak(utterance);
  };

  const listenForAnswer = (field: keyof PatientProfile) => {
    if (!("webkitSpeechRecognition" in window)) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "es-MX";
    
    recognition.onstart = () => {
      setIsListening(true);
      setInterviewTranscript("");
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setInterviewTranscript(result);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Procesar respuesta y pasar al siguiente campo
      setTimeout(() => processInterviewAnswer(), 1000);
    };

    recognition.start();
  };

  const processInterviewAnswer = () => {
    if (!activeInterviewField) return;
    
    updateField(activeInterviewField, interviewTranscript);
    setInterviewTranscript("");
    
    // Buscar siguiente campo
    const allFields = FORM_CATEGORIES.flatMap(c => c.fields) as (keyof PatientProfile)[];
    const currentIndex = allFields.indexOf(activeInterviewField);
    
    if (currentIndex < allFields.length - 1) {
      const nextField = allFields[currentIndex + 1];
      setActiveInterviewField(nextField);
      speakText(INTERVIEW_QUESTIONS[nextField] || `Siguiente dato: ${FIELD_LABELS[nextField]}`, () => listenForAnswer(nextField));
    } else {
      speakText("He completado la entrevista. Por favor revisa tus datos.");
      stopInterview();
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pt-12 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header de Sección */}
        <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Expediente Médico <span className="text-[#3345CC]">Digital</span></h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg">
              Completa tu perfil para que <span className="text-[#3345CC] font-bold">Mia</span> pueda brindarte un diagnóstico preciso y personalizado.
            </p>
          </div>
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
            <button 
              onClick={() => {
                setMode("manual");
                setIsInterviewing(false);
              }}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === "manual" && !isInterviewing ? "bg-[#3345CC] text-white shadow-lg" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"}`}
            >
              Teclado
            </button>
            <button 
              onClick={startInterview}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isInterviewing ? "bg-[#3345CC] text-white shadow-lg" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"}`}
            >
              <div className={`w-2 h-2 rounded-full ${isInterviewing ? "bg-white" : "bg-emerald-500"} animate-pulse`} />
              Entrevista IA
            </button>
          </div>
        </section>

        <form
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            
            // Validación de campos obligatorios para el paso actual
            const currentFields = FORM_CATEGORIES[currentStep].fields;
            const missingFields = currentFields.filter(f => 
              !OPTIONAL_FIELDS.includes(f) && !profile[f as keyof PatientProfile]
            );

            if (missingFields.length > 0) {
              return; 
            }

            if (currentStep === FORM_CATEGORIES.length - 1) {
              saveProfile();
            } else {
              setCurrentStep(prev => prev + 1);
            }
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[380px_1fr] items-start">
            {/* Sidebar con Resumen y Voz (Ahora a la izquierda en desktop) */}
            <aside className="space-y-6 lg:sticky lg:top-8 lg:order-1 order-1">


              <article className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-xl dark:shadow-none">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#0028b3] rounded-full" />
                  Resumen Actual
                </h2>
                
                {!savedProfile && !profile.nombres ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-slate-500">Sin datos registrados aún.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#0028b3]/10 border border-[#0028b3]/20 rounded-2xl">
                      <p className="text-[10px] font-bold text-[#0028b3] uppercase tracking-widest">Identidad</p>
                      <p className="text-lg font-bold truncate">{profile.nombres || "Sin nombre"}</p>
                      <p className="text-xs text-slate-400">{profile.edad ? `${profile.edad} años` : "Edad no especificada"} • {profile.genero || "Género N/D"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Peso</p>
                        <p className="text-sm font-bold">{profile.peso ? `${profile.peso} kg` : "--"}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Altura</p>
                        <p className="text-sm font-bold">{profile.estatura ? `${profile.estatura} cm` : "--"}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Nacionalidad</span>
                        <span className="font-bold">{profile.nacionalidad || "N/D"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Sangre</span>
                        <span className="font-bold text-red-400">{profile.tipoSangre || "N/D"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            </aside>

            {/* Formulario de Datos Personales (Ahora a la derecha en desktop) */}
            <div className="space-y-8 lg:order-2 order-2">
              <section className="card-mia relative overflow-hidden md:p-10">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800">
                  <div className="h-full bg-[#3345CC] transition-all duration-500 ease-out" style={{ width: `${((currentStep + 1) / FORM_CATEGORIES.length) * 100}%` }} />
                </div>

                <div className="flex items-center justify-between mb-10">
                  <div>
                    <span className="text-[10px] font-bold text-[#3345CC] uppercase tracking-widest">Paso {currentStep + 1} de {FORM_CATEGORIES.length}</span>
                    <h2 className="text-3xl font-bold tracking-tight mt-1">{FORM_CATEGORIES[currentStep].title}</h2>
                  </div>
                  {isAnalyzing && <div className="text-xs font-bold text-[#3345CC] animate-pulse">IA ANALIZANDO...</div>}
                </div>

                <div className="grid gap-8 md:grid-cols-2 p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-white/5">
                  {FORM_CATEGORIES[currentStep].fields.map((field) => (
                    <div key={field} className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">
                        {FIELD_LABELS[field]} {!OPTIONAL_FIELDS.includes(field) && <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        {field === "genero" ? (
                          <select value={profile.genero} onChange={(e) => updateField(field, e.target.value)} disabled={!isEditing} className="input-mia">
                            <option value="">Seleccionar...</option>
                            <option value="hombre">Hombre</option>
                            <option value="mujer">Mujer</option>
                            <option value="otro">Otro</option>
                          </select>
                        ) : field === "nacionalidad" ? (
                          <div className="relative">
                            <button type="button" onClick={() => isEditing && setShowNationalityList(!showNationalityList)} disabled={!isEditing} className="input-mia flex items-center justify-between text-left">
                              <span>{profile.nacionalidad || "Seleccionar..."}</span>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </button>
                            {showNationalityList && (
                              <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl shadow-xl">
                                {apiNationalities.map(n => (
                                  <button key={n.name} type="button" className="w-full px-4 py-3 text-sm text-left hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3" onClick={() => { updateField("nacionalidad", n.name); setShowNationalityList(false); }}>
                                    <img src={`https://flagcdn.com/w40/${n.code}.png`} className="w-5 rounded-sm" />
                                    {n.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : field === "tipoSangre" ? (
                          <select value={profile.tipoSangre} onChange={(e) => updateField(field, e.target.value)} disabled={!isEditing} className="input-mia">
                            <option value="">Sin especificar</option>
                            {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : (
                          <input type="text" value={profile[field as keyof PatientProfile]} onChange={(e) => updateField(field, e.target.value)} disabled={!isEditing} placeholder={FIELD_LABELS[field]} className="input-mia" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="flex flex-col gap-6 pt-8 border-t border-slate-100 dark:border-white/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-3 w-full sm:w-auto">
                {currentStep > 0 && (
                  <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="px-6 py-4 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-sm">
                    Anterior
                  </button>
                )}
                <button type="submit" disabled={FORM_CATEGORIES[currentStep].fields.some(f => !OPTIONAL_FIELDS.includes(f) && !profile[f as keyof PatientProfile])} className="btn-mia-primary flex-1 sm:px-10 py-4 disabled:opacity-30 text-center">
                  {currentStep === FORM_CATEGORIES.length - 1 ? "Finalizar y Guardar" : "Siguiente Paso"}
                </button>
              </div>
              <div className="flex gap-6 items-center justify-center w-full sm:w-auto">
                {!isEditing && <button type="button" onClick={editSavedData} className="text-sm font-bold text-slate-400 hover:text-[#3345CC] py-2">Editar Perfil</button>}
                <button type="button" onClick={clearAllData} className="text-sm font-bold text-slate-300 hover:text-red-500 py-2">Limpiar todo</button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal Entrevista IA */}
      {isInterviewing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="card-mia w-full max-w-lg border-2 border-[#3345CC]/30 p-10 text-center">
            <div className="w-24 h-24 rounded-full bg-[#3345CC] mx-auto flex items-center justify-center mb-8">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-4 bg-white rounded-full animate-bounce" />
                <div className="w-1.5 h-8 bg-white rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-1.5 h-4 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#3345CC] mb-4">Mia pregunta:</h3>
            <p className="text-2xl font-bold mb-8">{activeInterviewField ? INTERVIEW_QUESTIONS[activeInterviewField] : "Iniciando..."}</p>
            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 min-h-[100px] mb-8 border italic text-slate-400">
              {interviewTranscript ? `"${interviewTranscript}"` : "Te escucho..."}
            </div>
            <div className="flex gap-4">
              <button onClick={() => activeInterviewField && speakText(INTERVIEW_QUESTIONS[activeInterviewField], () => listenForAnswer(activeInterviewField!))} className="flex-1 py-4 bg-[#3345CC]/10 text-[#3345CC] font-bold rounded-2xl">Repetir</button>
              <button onClick={stopInterview} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 font-bold rounded-2xl">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
