"use client";

import { useState, useEffect, useRef } from "react";

// Tipos
interface PatientProfile {
  // Obligatorios
  nombres: string;
  edad: string;
  peso: string;
  estatura: string;
  genero: string;
  localidad: string;
  // Opcionales
  tipoSangre: string;
  discapacidad: string;
  medicacion: string;
  alergias: string;
  contactoEmergencia: string;
}

const EMPTY_PROFILE: PatientProfile = {
  nombres: "",
  edad: "",
  peso: "",
  estatura: "",
  genero: "",
  localidad: "",
  tipoSangre: "",
  discapacidad: "",
  medicacion: "",
  alergias: "",
  contactoEmergencia: "",
};

const REQUIRED_FIELDS: (keyof PatientProfile)[] = [
  "nombres", "edad", "peso", "estatura", "genero", "localidad",
];

const OPTIONAL_FIELDS: (keyof PatientProfile)[] = [
  "tipoSangre", "discapacidad", "medicacion", "alergias", "contactoEmergencia",
];

const FORM_CATEGORIES = [
  {
    title: "Datos Personales",
    fields: ["nombres", "edad", "genero", "localidad"],
  },
  {
    title: "Métricas Físicas",
    fields: ["peso", "estatura", "tipoSangre"],
  },
  {
    title: "Información Médica",
    fields: ["discapacidad", "medicacion", "alergias", "contactoEmergencia"],
  },
];

const FIELD_LABELS: Record<string, string> = {
  nombres: "Nombre Completo",
  edad: "Edad (años)",
  genero: "Género",
  localidad: "Localidad / País",
  peso: "Peso (kg)",
  estatura: "Estatura (cm)",
  tipoSangre: "Tipo de Sangre",
  discapacidad: "Discapacidad",
  medicacion: "Medicación",
  alergias: "Alergias",
  contactoEmergencia: "Contacto de Emergencia",
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Tokens que se interpretan como "ninguno" → N/A
const NONE_TOKENS = new Set([
  "ninguna", "ninguno", "ningun", "na", "n/a", "no", "sin", "no tengo",
  "no aplica", "no padezco", "no tomo", "no hay", "nada",
]);

function normalizeOptional(value: string | undefined): string {
  if (!value?.trim()) return "N/A";
  const lower = value.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (NONE_TOKENS.has(lower)) return "N/A";
  return value.trim();
}

function validateProfile(p: PatientProfile): string {
  for (const field of REQUIRED_FIELDS) {
    if (!(p[field] ?? "").trim()) return `El campo "${FIELD_LABELS[field]}" es obligatorio.`;
  }
  const age = Number(p.edad);
  if (!Number.isFinite(age) || age < 1 || age > 120)
    return "La edad debe ser un n\u00famero entre 1 y 120.";
  const weight = Number(p.peso);
  if (!Number.isFinite(weight) || weight < 20 || weight > 300)
    return "El peso debe ser un n\u00famero entre 20 y 300 kg.";
  const height = Number(p.estatura);
  if (!Number.isFinite(height) || height < 90 || height > 250)
    return "La estatura debe ser un n\u00famero entre 90 y 250 cm.";
  // Validar tel\u00e9fono de emergencia solo si fue llenado
  if (p.contactoEmergencia && p.contactoEmergencia !== "N/A") {
    const digits = p.contactoEmergencia.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15)
      return "El tel\u00e9fono de emergencia debe tener entre 7 y 15 d\u00edgitos.";
  }
  return "";
}

const VOICE_FIELDS = [
  { label: "Nombre completo", emoji: "👤" },
  { label: "Edad", emoji: "🎂" },
  { label: "Género", emoji: "⚧" },
  { label: "Localidad / País donde vives", emoji: "🌍" },
  { label: "Peso en kg", emoji: "⚖️" },
  { label: "Estatura en cm", emoji: "📏" },
  { label: "Tipo de sangre (opcional)", emoji: "🩸" },
  { label: "Discapacidad (opcional)", emoji: "♿" },
  { label: "Medicación (opcional)", emoji: "💊" },
  { label: "Alergias (opcional)", emoji: "🌿" },
  { label: "Contacto de emergencia (opcional)", emoji: "📞" },
];


export default function CapturaDatosPage() {
  const [profile, setProfile] = useState<PatientProfile>(EMPTY_PROFILE);
  const [isEditing, setIsEditing] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<"manual" | "voz">("manual");
  // Estados de voz
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedProfile, setSavedProfile] = useState<PatientProfile | null>(null);
  const [lastUpdatedFields, setLastUpdatedFields] = useState<Set<string>>(new Set());

  // Sistema de toast (alertas auto-desaparecibles)
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: "error" | "success" | "info" = "info", ms = 4000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), ms);
  };

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
    // Normalizar campos opcionales: si quedan vacíos → N/A
    const normalized: PatientProfile = { ...profile };
    for (const field of OPTIONAL_FIELDS) {
      normalized[field] = normalizeOptional(normalized[field]);
    }

    // Validar campos obligatorios
    const validationError = validateProfile(normalized);
    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    localStorage.setItem("mia_patient_profile", JSON.stringify(normalized));
    setProfile(normalized);
    setSavedProfile(normalized);
    setIsEditing(false);
    showToast("✅ Perfil médico guardado correctamente.", "success");
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

  // ref para acumular el transcript final (evita stale closure)
  const fullTranscriptRef = useRef("");

  // --- Lógica de Voz: intro animada + grabación continua + DeepSeek ---
  const speakText = (text: string, onEnd?: () => void) => {
    if (!("speechSynthesis" in window)) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    utterance.rate = 1.05;
    utterance.pitch = 1.6;
    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith("es") && v.name.toLowerCase().includes("google"))
        ?? voices.find(v => v.lang.startsWith("es"));
      if (voice) utterance.voice = voice;
      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();
      window.speechSynthesis.speak(utterance);
    };
    if (window.speechSynthesis.getVoices().length > 0) trySpeak();
    else { window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; trySpeak(); }; }
  };

  const startVoiceWithIntro = () => {
    setMode("voz");
    setIntroFieldCount(0);
    setTranscript("");
    fullTranscriptRef.current = "";

    const intro = [
      "Hola, soy Mia, tu asistente de salud personal.",
      "Para crear tu perfil, por favor dime en voz alta los siguientes datos:",
      "Tu nombre completo, tu edad, tu género, y la localidad o país donde vives.",
      "Tu peso en kilogramos y tu estatura en centímetros.",
      "Si lo conoces, tu tipo de sangre.",
      "Si tienes alguna discapacidad, qué medicamentos tomas, o si padeces alguna alergia.",
      "Y el teléfono de tu contacto de emergencia.",
      "Si algún dato no aplica, simplemente di: no tengo o ninguna.",
      "Cuando termines, presiona el botón Enviar y Procesar.",
    ].join(" ");

    // Mostrar campos uno a uno mientras Mia habla (~1.8s por campo)
    if (introTimerRef.current) clearInterval(introTimerRef.current);
    let count = 0;
    introTimerRef.current = setInterval(() => {
      count++;
      setIntroFieldCount(count);
      if (count >= VOICE_FIELDS.length) {
        if (introTimerRef.current) clearInterval(introTimerRef.current);
      }
    }, 1800);

    speakText(intro, () => {
      startVoiceCapture();
    });
  };

  const startVoiceCapture = () => {
    const win = window as any;
    const SpeechCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SpeechCtor) {
      showToast("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.", "error");
      return;
    }

    const rec = new SpeechCtor();
    rec.lang = "es-MX";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => { setIsListening(true); };

    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          fullTranscriptRef.current += " " + chunk;
        } else {
          interim = chunk;
        }
      }
      setTranscript((fullTranscriptRef.current + " " + interim).trim());
    };

    rec.onerror = (event: any) => {
      if (event.error !== "no-speech") showToast("Error de micrófono: " + event.error, "error");
    };

    rec.onend = () => { setIsListening(false); };

    win._miaRecognition = rec;
    rec.start();
  };

  const stopAndSendToAI = async () => {
    const win = window as any;
    if (win._miaRecognition) { try { win._miaRecognition.stop(); } catch (_) {} }
    setIsListening(false);

    const fullText = fullTranscriptRef.current.trim() || transcript.trim();
    if (!fullText) {
      showToast("No capturé ningún audio. Intenta hablar de nuevo.", "error");
      return;
    }

    setIsAnalyzing(true);
    showToast("Mia está analizando tu respuesta...", "info", 30000);

    try {
      const res = await fetch("/api/deepseek/extract-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullText, currentProfile: profile }),
      });

      if (!res.ok) throw new Error("Error en la API");
      const { extracted } = await res.json() as { extracted: Partial<PatientProfile> };

      // Merge con perfil actual
      setProfile(prev => {
        const next = { ...prev };
        for (const k of Object.keys(extracted) as (keyof PatientProfile)[]) {
          if (extracted[k]) next[k] = extracted[k]!;
        }
        return next;
      });

      const updated = Object.keys(extracted).filter(k => !!extracted[k as keyof PatientProfile]);
      setLastUpdatedFields(new Set(updated));
      setTimeout(() => setLastUpdatedFields(new Set()), 3000);

      showToast("✅ Mia llenó tu perfil. Revisa los datos y guarda.", "success");
      setMode("manual");
      setIntroFieldCount(0);
    } catch (err) {
      showToast("No se pudo procesar con DeepSeek. Revisa tu conexión.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const replayVoiceCapture = () => {
    setTranscript("");
    fullTranscriptRef.current = "";
    startVoiceCapture();
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pt-24 pb-20">
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
              onClick={() => { setMode("manual"); setIntroFieldCount(0); }}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === "manual" ? "bg-[#3345CC] text-white shadow-lg" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"}`}
            >
              Teclado
            </button>
            <button 
              onClick={startVoiceWithIntro}
              disabled={isListening || isAnalyzing}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === "voz" ? "bg-[#3345CC] text-white shadow-lg" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"}`}
            >
              <div className={`w-2 h-2 rounded-full ${isListening ? "bg-red-400 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
              Hablar con Mia
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
              !OPTIONAL_FIELDS.includes(f as keyof PatientProfile) && !profile[f as keyof PatientProfile]
            );

            if (missingFields.length > 0) {
              showToast(`Completa los campos obligatorios: ${missingFields.map(f => FIELD_LABELS[f]).join(", ")}`, "error");
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
              {/* Card de voz */}
              {mode === "voz" && (
                <article className={`rounded-3xl border transition-all duration-500 ${
                  isListening
                    ? "border-[#3345CC] bg-[#3345CC]/10 dark:bg-[#3345CC]/20"
                    : isAnalyzing
                    ? "border-emerald-400/30 bg-emerald-500/5"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5"
                } p-6 shadow-sm dark:shadow-none`}>

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isListening ? "bg-[#3345CC]" : isAnalyzing ? "bg-emerald-500" : "bg-slate-100 dark:bg-white/10"
                    }`}>
                      {isListening ? (
                        <div className="flex gap-0.5 items-center">
                          <div className="w-0.5 h-3 bg-white rounded-full animate-bounce" style={{animationDuration:"0.5s"}} />
                          <div className="w-0.5 h-5 bg-white rounded-full animate-bounce" style={{animationDuration:"0.5s",animationDelay:"0.1s"}} />
                          <div className="w-0.5 h-3 bg-white rounded-full animate-bounce" style={{animationDuration:"0.5s",animationDelay:"0.2s"}} />
                        </div>
                      ) : isAnalyzing ? (
                        <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold">Captura por Voz</h2>
                      <p className="text-[10px] text-slate-400">
                        {isListening ? "Escuchando..." : isAnalyzing ? "Procesando con IA..." : "Lista para escuchar"}
                      </p>
                    </div>
                  </div>

                  {/* Lista animada de campos */}
                  {introFieldCount > 0 && (
                    <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#3345CC]/10 border-b border-[#3345CC]/20">
                        <div className={`w-2 h-2 rounded-full ${isListening ? "bg-red-500 animate-pulse" : "bg-[#3345CC]"}`} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#3345CC]">
                          {isListening ? "Habla estos datos ahora" : "Datos que Mia necesita"}
                        </p>
                      </div>
                      <div className="p-3 space-y-1">
                        {VOICE_FIELDS.map((field, idx) => (
                          <div
                            key={field.label}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-500 ${
                              idx < introFieldCount
                                ? "opacity-100 translate-y-0 bg-white dark:bg-white/5 shadow-sm"
                                : "opacity-0 translate-y-2 pointer-events-none h-0 overflow-hidden p-0"
                            }`}
                          >
                            <span className="text-base">{field.emoji}</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{field.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transcripción en tiempo real */}
                  {(isListening || transcript) && (
                    <div className="mb-4 p-3 bg-black/20 dark:bg-black/40 rounded-2xl border border-white/5 min-h-[56px]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Escuchando...</p>
                      <p className="text-xs text-slate-300 italic leading-relaxed line-clamp-3">&quot;{transcript || "..."}&quot;</p>
                    </div>
                  )}

                  {/* Error / Status en card de voz */}
                  {isAnalyzing && <p className="text-xs text-emerald-400 mb-3 animate-pulse">Mia está analizando...</p>}

                  {/* Botones */}
                  <div className="space-y-2">
                    {/* Botón principal: solo si NO está escuchando ni analizando */}
                    {!isListening && !isAnalyzing && introFieldCount === 0 && (
                      <button
                        onClick={startVoiceWithIntro}
                        className="btn-mia-primary w-full py-4 flex items-center justify-center gap-3 text-sm font-bold"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                        Hablar con Mia
                      </button>
                    )}

                    {/* Botón Enviar: solo cuando está escuchando */}
                    {isListening && (
                      <button
                        onClick={stopAndSendToAI}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                        Enviar y Procesar
                      </button>
                    )}

                    {/* Analizando */}
                    {isAnalyzing && (
                      <div className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 animate-pulse">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Mia está analizando...
                      </div>
                    )}

                    {/* Reiniciar grabación */}
                    {(transcript || isListening) && !isAnalyzing && (
                      <button
                        onClick={replayVoiceCapture}
                        disabled={isListening}
                        className="w-full py-2.5 bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30"
                      >
                        Reiniciar grabación
                      </button>
                    )}
                  </div>
                </article>
              )}
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
                  <div className="space-y-3">
                    <div className="p-4 bg-[#0028b3]/10 border border-[#0028b3]/20 rounded-2xl">
                      <p className="text-[10px] font-bold text-[#0028b3] uppercase tracking-widest">Identidad</p>
                      <p className="text-lg font-bold truncate">{profile.nombres || "Sin nombre"}</p>
                      <p className="text-xs text-slate-400">{profile.edad ? `${profile.edad} años` : "Edad N/D"} • {profile.genero || "Género N/D"}</p>
                      <p className="text-xs text-slate-400 mt-0.5">📍 {profile.localidad || "Localidad N/D"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Peso</p>
                        <p className="text-sm font-bold">{profile.peso ? `${profile.peso} kg` : "--"}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Altura</p>
                        <p className="text-sm font-bold">{profile.estatura ? `${profile.estatura} cm` : "--"}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1.5">
                      {[
                        { label: "Sangre", value: profile.tipoSangre, color: "text-red-400" },
                        { label: "Discapacidad", value: profile.discapacidad, color: "" },
                        { label: "Medicación", value: profile.medicacion, color: "" },
                        { label: "Alergias", value: profile.alergias, color: "" },
                        { label: "Emergencia", value: profile.contactoEmergencia, color: "" },
                      ].map(({ label, value, color }) => value ? (
                        <div key={label} className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">{label}</span>
                          <span className={`font-bold truncate max-w-[120px] ${color}`}>{value}</span>
                        </div>
                      ) : null)}
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
                  {FORM_CATEGORIES[currentStep].fields.map((field) => {
                    const isOptional = OPTIONAL_FIELDS.includes(field as keyof PatientProfile);
                    const isUpdated = lastUpdatedFields.has(field);
                    return (
                    <div key={field} className={`space-y-2 transition-all duration-500 ${isUpdated ? "ring-2 ring-emerald-400 rounded-xl" : ""}`}>
                      <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">
                        {FIELD_LABELS[field]}
                        {!isOptional && <span className="text-red-500">*</span>}
                        {isOptional && <span className="text-slate-400 font-normal">(opcional)</span>}
                      </label>
                      <div className="relative">
                        {field === "genero" ? (
                          <select value={profile.genero} onChange={(e) => updateField(field, e.target.value)} disabled={!isEditing} className="input-mia">
                            <option value="">Seleccionar...</option>
                            <option value="hombre">Hombre</option>
                            <option value="mujer">Mujer</option>
                            <option value="otro">Otro</option>
                            <option value="prefiero no decir">Prefiero no decir</option>
                          </select>
                        ) : field === "localidad" ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => isEditing && setShowNationalityList(!showNationalityList)}
                              disabled={!isEditing}
                              className="input-mia flex items-center justify-between text-left w-full"
                            >
                              <span>{profile.localidad || "Seleccionar pa\u00eds / localidad..."}</span>
                              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </button>
                            {showNationalityList && (
                              <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl">
                                {apiNationalities.length > 0 ? apiNationalities.map(n => (
                                  <button
                                    key={n.name}
                                    type="button"
                                    className="w-full px-4 py-3 text-sm text-left hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                    onClick={() => { updateField("localidad", n.name); setShowNationalityList(false); }}
                                  >
                                    <img src={`https://flagcdn.com/w40/${n.code}.png`} alt={n.name} className="w-5 h-3.5 rounded-sm object-cover flex-shrink-0" />
                                    <span>{n.name}</span>
                                  </button>
                                )) : (
                                  <div className="px-4 py-3 text-xs text-slate-500">Cargando pa\u00edses...</div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : field === "tipoSangre" ? (
                          <select value={profile.tipoSangre} onChange={(e) => updateField(field, e.target.value)} disabled={!isEditing} className="input-mia">
                            <option value="">Sin especificar</option>
                            {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : (
                          <input
                            type={field === "edad" || field === "peso" || field === "estatura" ? "number" : "text"}
                            inputMode={field === "contactoEmergencia" ? "tel" : undefined}
                            value={profile[field as keyof PatientProfile] ?? ""}
                            onChange={(e) => updateField(field, e.target.value)}
                            disabled={!isEditing}
                            placeholder={isOptional ? `${FIELD_LABELS[field]} (opcional)` : FIELD_LABELS[field]}
                            className="input-mia"
                          />
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 dark:border-white/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-3 w-full sm:w-auto">
                {currentStep > 0 && (
                  <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="px-6 py-4 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-sm">
                    Anterior
                  </button>
                )}
                <button
                  type="submit"
                  disabled={FORM_CATEGORIES[currentStep].fields.some(f => !OPTIONAL_FIELDS.includes(f as keyof PatientProfile) && !profile[f as keyof PatientProfile])}
                  className="btn-mia-primary flex-1 sm:px-10 py-4 disabled:opacity-30 text-center"
                >
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

      {/* Toast — esquina superior derecha, auto-desaparece */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "1.5rem",
            right: "1.5rem",
            zIndex: 9999,
            maxWidth: "22rem",
            width: "100%",
            animation: "miaSlideIn 0.3s ease-out",
          }}
          className={`px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3 border backdrop-blur-xl relative overflow-hidden ${
            toast.type === "error"
              ? "bg-red-950/95 border-red-500/40 text-red-100"
              : toast.type === "success"
              ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-100"
              : "bg-slate-900/95 border-white/10 text-slate-100"
          }`}
        >
          {/* Icono */}
          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black ${
            toast.type === "error" ? "bg-red-500 text-white" :
            toast.type === "success" ? "bg-emerald-500 text-slate-900" :
            "bg-slate-600 text-white"
          }`}>
            {toast.type === "error" ? "!" : toast.type === "success" ? "\u2713" : "i"}
          </div>
          {/* Contenido */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-bold leading-tight">
              {toast.type === "error" ? "Atenci\u00f3n" : toast.type === "success" ? "\u00a1Guardado!" : "Aviso"}
            </p>
            <p className="text-xs opacity-80 mt-1 leading-relaxed">{toast.msg}</p>
          </div>
          {/* X cerrar */}
          <button
            onClick={() => setToast(null)}
            style={{ lineHeight: 1 }}
            className="text-2xl leading-none opacity-40 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            &times;
          </button>
          {/* Barra de progreso animada */}
          <div
            style={{ animation: "miaShrink 4s linear forwards" }}
            className={`absolute bottom-0 left-0 h-0.5 ${
              toast.type === "error" ? "bg-red-400" :
              toast.type === "success" ? "bg-emerald-400" : "bg-slate-400"
            }`}
          />
        </div>
      )}

      <style>{`
        @keyframes miaSlideIn {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes miaShrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </main>
  );
}
