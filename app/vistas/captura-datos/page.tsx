"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  UserIcon, 
  ClipboardDocumentCheckIcon, 
  BeakerIcon, 
  HeartIcon, 
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  MicrophoneIcon,
  CommandLineIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { auth, db } from "@/lib/firebase/firebase";
import { ref, set, get, serverTimestamp } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ViewTutorialModal } from "@/components/ui/view-tutorial-modal";

// Tipos
interface PatientProfile {
  nombres: string;
  edad: string;
  peso: string;
  estatura: string;
  genero: string;
  curp: string;
  ocupacion: string;
  localidad: string;
  tipoSangre: string;
  discapacidad: string;
  medicacion: string;
  alergias: string;
  antecedentesHeredofamiliares: string;
  antecedentesPatologicos: string;
  habitosVida: string;
  contactoEmergencia: string;
  nombreContactoEmergencia: string;
}

const EMPTY_PROFILE: PatientProfile = {
  nombres: "",
  edad: "",
  peso: "",
  estatura: "",
  genero: "",
  curp: "",
  ocupacion: "",
  localidad: "",
  tipoSangre: "",
  discapacidad: "",
  medicacion: "",
  alergias: "",
  antecedentesHeredofamiliares: "",
  antecedentesPatologicos: "",
  habitosVida: "",
  contactoEmergencia: "",
  nombreContactoEmergencia: "",
};

const REQUIRED_FIELDS: (keyof PatientProfile)[] = [
  "nombres", "edad", "peso", "estatura", "genero", "localidad",
];

const OPTIONAL_FIELDS: (keyof PatientProfile)[] = [
  "tipoSangre", "discapacidad", "medicacion", "alergias", "contactoEmergencia", "nombreContactoEmergencia",
];

const FORM_CATEGORIES = [
  {
    title: "Identificación Legal",
    fields: ["nombres", "curp", "edad", "genero", "ocupacion", "localidad"],
    icon: UserIcon,
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Métricas y Alergias",
    fields: ["peso", "estatura", "tipoSangre", "alergias", "medicacion"],
    icon: BeakerIcon,
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "Historial Clínico (NOM-004)",
    fields: ["antecedentesHeredofamiliares", "antecedentesPatologicos", "habitosVida"],
    icon: ClipboardDocumentCheckIcon,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "Contactos de Emergencia",
    fields: ["nombreContactoEmergencia", "contactoEmergencia"],
    icon: HeartIcon,
    color: "from-rose-500 to-pink-600",
  },
];

const FIELD_LABELS: Record<string, string> = {
  nombres: "Nombre Completo",
  edad: "Edad",
  genero: "Género",
  curp: "CURP",
  ocupacion: "Ocupación",
  localidad: "Estado / Localidad",
  peso: "Peso (kg)",
  estatura: "Estatura (cm)",
  tipoSangre: "Tipo de Sangre",
  discapacidad: "Discapacidad",
  medicacion: "Medicación Actual",
  alergias: "Alergias",
  antecedentesHeredofamiliares: "Herencia (Diabetes, HTA, etc.)",
  antecedentesPatologicos: "Patologías (Cirugías, Crónicas)",
  habitosVida: "Hábitos (Fumo, Ejercicio, etc.)",
  nombreContactoEmergencia: "Nombre de Contacto SOS",
  contactoEmergencia: "Tel. de Emergencia",
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const VOICE_FIELDS = [
  { label: "Identidad (Nombre, CURP, Ocupación)", icon: UserIcon },
  { label: "Perfil Físico (Edad, Peso, Talla)", icon: InformationCircleIcon },
  { label: "Ubicación", icon: MapPinIcon },
  { label: "Clínicos (Sangre, Alergias)", icon: BeakerIcon },
  { label: "Antecedentes (Herencia, Cirugías)", icon: ClipboardDocumentCheckIcon },
  { label: "Contactos SOS", icon: HeartIcon },
];

export default function CapturaDatosPage() {
  const [profile, setProfile] = useState<PatientProfile>(EMPTY_PROFILE);
  const [isEditing, setIsEditing] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [mode, setMode] = useState<"manual" | "voz">("manual");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMiaSpeaking, setIsMiaSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedProfile, setSavedProfile] = useState<PatientProfile | null>(null);
  const [lastUpdatedFields, setLastUpdatedFields] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [apiNationalities, setApiNationalities] = useState<{name: string, code: string}[]>([]);
  const [showNationalityList, setShowNationalityList] = useState(false);
  const fullTranscriptRef = useRef("");
  const shouldListenRef = useRef(false);

  // Mostrar todos los campos para que los dicte de un jalón
  const voiceLabels = [
    "Nombre Completo",
    "Edad",
    "Género",
    "CURP",
    "Estado / Localidad",
    "Peso (kg)",
    "Estatura (cm)",
    "Tipo de Sangre",
    "Alergias",
    "Discapacidad",
    "Medicación Actual",
    "Patologías (Cirugías, Crónicas)",
    "Hábitos (Fumo, Ejercicio, etc.)",
    "Tel. de Emergencia"
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const profileRef = ref(db, `users/${u.uid}/profile`);
          const snapshot = await get(profileRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            setProfile(data);
            setSavedProfile(data);
            setIsEditing(false);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    });

    async function fetchNationalities() {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,translations,cca2");
        const data = await res.json();
        const list = data.map((c: any) => ({
          name: c.translations?.spa?.common || c.name.common,
          code: c.cca2?.toLowerCase() || ""
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        setApiNationalities(list);
      } catch (e) { console.error(e); }
    }
    fetchNationalities();
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string, type: "error" | "success" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const updateField = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setLastUpdatedFields(prev => new Set(prev).add(field));
    setTimeout(() => {
      setLastUpdatedFields(prev => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }, 2000);
  };

  const saveProfile = async () => {
    // Validar campos requeridos
    const missing = REQUIRED_FIELDS.filter(f => !profile[f]);
    if (missing.length > 0) {
      showToast(`Faltan campos obligatorios: ${missing.map(m => FIELD_LABELS[m] || m).join(', ')}`, "error");
      return;
    }

    setLoading(true);
    try {
      if (user) {
        const profileRef = ref(db, `users/${user.uid}/profile`);
        await set(profileRef, { ...profile, updatedAt: serverTimestamp() });
      }
      localStorage.setItem("mia_patient_profile", JSON.stringify(profile));
      setSavedProfile(profile);
      setIsEditing(false);
      showToast("Perfil actualizado correctamente.", "success");
    } catch (error: any) {
      showToast("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
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


  // --- Lógica de Voz: intro animada + grabación continua + DeepSeek ---
  const speakText = (text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { onEnd?.(); return; }
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
      
      utterance.onend = () => {
        (window as any)._miaUtterance = null;
        onEnd?.();
      };
      utterance.onerror = () => {
        (window as any)._miaUtterance = null;
        onEnd?.();
      };
      
      (window as any)._miaUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    };
    if (window.speechSynthesis.getVoices().length > 0) trySpeak();
    else { window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; trySpeak(); }; }
  };

  const startVoiceWithIntro = async () => {
    setMode("voz");
    setTranscript("");
    fullTranscriptRef.current = "";
    shouldListenRef.current = false;
    
    setIsMiaSpeaking(true);
    try {
      const res = await fetch("/api/deepseek/generate-voice-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProfile: profile }),
      });
      const data = await res.json();
      if (data.message) {
        speakText(data.message, () => {
          setIsMiaSpeaking(false);
          startVoiceCapture();
        });
      } else {
        setIsMiaSpeaking(false);
        startVoiceCapture();
      }
    } catch (err) {
      console.error(err);
      setIsMiaSpeaking(false);
      startVoiceCapture();
    }
  };

  const startVoiceCapture = () => {
    if (typeof window === "undefined") return;
    const win = window as any;
    const SpeechCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SpeechCtor) {
      showToast("Navegador no compatible con voz.", "error");
      return;
    }
    
    if (win._miaRecognition) {
      try { win._miaRecognition.onend = null; win._miaRecognition.stop(); } catch (_) {}
    }

    const rec = new SpeechCtor();
    rec.lang = "es-MX";
    rec.continuous = true;
    rec.interimResults = true;
    
    let currentInterim = "";

    rec.onstart = () => setIsListening(true);
    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          fullTranscriptRef.current += " " + chunk;
          currentInterim = "";
        } else {
          interim += chunk;
        }
      }
      currentInterim = interim;
      setTranscript((fullTranscriptRef.current + " " + currentInterim).trim());
    };
    
    rec.onend = () => {
      setIsListening(false);
      if (currentInterim) {
        fullTranscriptRef.current += " " + currentInterim;
        currentInterim = "";
        setTranscript(fullTranscriptRef.current.trim());
      }
      if (shouldListenRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current) startVoiceCapture();
        }, 200);
      }
    };
    
    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed') shouldListenRef.current = false;
    };

    win._miaRecognition = rec;
    shouldListenRef.current = true;
    try { rec.start(); } catch(e) { console.error(e); }
  };

  const stopAndSendToAI = async () => {
    shouldListenRef.current = false;
    if (typeof window !== "undefined") {
      const win = window as any;
      if (win._miaRecognition) { 
        try { win._miaRecognition.onend = null; win._miaRecognition.stop(); } catch (_) {} 
      }
      window.speechSynthesis.cancel();
    }
    setIsListening(false);
    setIsMiaSpeaking(false);
    const fullText = transcript.trim();
    if (!fullText) {
      showToast("No se detectó audio.", "info");
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/deepseek/extract-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullText, currentProfile: profile }),
      });
      const { extracted } = await res.json();
      
      setProfile(prev => {
        const next = { ...prev };
        for (const key in extracted) {
          if (extracted[key as keyof PatientProfile]) {
            next[key as keyof PatientProfile] = extracted[key as keyof PatientProfile];
          }
        }
        return next;
      });
      showToast("Datos extraídos por la IA.", "success");
      setMode("manual");
    } catch (err) {
      showToast("Error al procesar audio.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stopVoiceCapture = () => {
    shouldListenRef.current = false;
    if (typeof window !== "undefined") {
      const win = window as any;
      if (win._miaRecognition) {
        try { win._miaRecognition.onend = null; win._miaRecognition.stop(); } catch (_) {}
      }
      window.speechSynthesis.cancel();
    }
    setIsListening(false);
    setIsMiaSpeaking(false);
  };

  const replayVoiceCapture = () => {
    shouldListenRef.current = false;
    setIsMiaSpeaking(false);
    if (typeof window !== "undefined") {
      const win = window as any;
      if (win._miaRecognition) {
        try { win._miaRecognition.onend = null; win._miaRecognition.stop(); } catch (_) {}
      }
      window.speechSynthesis.cancel();
    }
    setTranscript("");
    fullTranscriptRef.current = "";
    setTimeout(() => {
      startVoiceWithIntro();
    }, 400);
  };
  return (
    <main className="min-h-screen bg-[#fcfcfd] dark:bg-[#050505] text-slate-900 dark:text-white pb-32 overflow-x-hidden">
      <ViewTutorialModal 
        viewId="captura-datos"
        title="Expediente Médico"
        description="Aquí podrás crear o actualizar tu perfil de salud. Puedes llenar los campos manualmente o dejar que Mia te escuche y complete todo automáticamente. Mantener tu perfil al día ayuda a Mia a darte mejores diagnósticos."
      />
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      {/* Modern Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-black/70 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5 h-16 flex items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 group-hover:bg-blue-500/10 transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-slate-500 group-hover:text-blue-500 transition-colors" />
          </div>
          <span className="hidden sm:block text-sm font-bold text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Volver</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-white/10" />
          <Link href="/vistas/perfil" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px]">CG</div>
            <span className="text-xs font-bold hidden xs:block">Cristian</span>
          </Link>
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-8 sm:pt-12">
        {/* Title Section */}
        <section className="mb-12 text-center sm:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            Salud Inteligente
          </motion.div>
          <h1 className="text-3xl sm:text-6xl font-black tracking-tight mb-4 leading-[1.1]">
            Expediente <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 block sm:inline">Médico</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl leading-relaxed">
            Organiza tu historia clínica con la ayuda de <span className="text-blue-600 font-bold">Mia AI</span>.
          </p>
          
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            SUS DATOS SON PRIVADOS: NO SE RECABAN EN SERVIDORES EXTERNOS Y SE ALMACENAN LOCALMENTE.
          </div>
        </section>

        {/* Mode Selector - Floating Style */}
        <div className="flex justify-center sm:justify-start mb-12">
          <div className="p-1.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-1">
            <button 
              onClick={() => setMode("manual")}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                mode === "manual" ? "bg-white dark:bg-white/10 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <CommandLineIcon className="w-4 h-4" />
              Manual
            </button>
            <button 
              onClick={startVoiceWithIntro}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                mode === "voz" ? "bg-white dark:bg-white/10 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <MicrophoneIcon className={cn("w-4 h-4", isListening ? "text-red-500" : "text-blue-500")} />
              Voz / IA
            </button>
          </div>
        </div>

        <div className="flex flex-col-reverse lg:grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          
          {/* Main Form Area */}
          <div className="w-full space-y-8">
            <AnimatePresence>
              {(isEditing || !savedProfile) && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (currentStep < FORM_CATEGORIES.length - 1) setCurrentStep(currentStep + 1);
                    else saveProfile();
                  }}
                  className="w-full relative overflow-hidden"
                >
              <div className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm shadow-slate-200/50 dark:shadow-none">
                {/* Stepper Header */}
                <div className="relative h-1 bg-slate-100 dark:bg-white/5">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-blue-600"
                    animate={{ width: `${((currentStep + 1) / FORM_CATEGORIES.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                  />
                </div>

                <div className="p-6 sm:p-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg", FORM_CATEGORIES[currentStep].color)}>
                        {(() => { const Icon = FORM_CATEGORIES[currentStep].icon; return <Icon className="w-7 h-7" />; })()}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1">Paso {currentStep + 1} de 3</p>
                        <h2 className="text-2xl font-bold tracking-tight">{FORM_CATEGORIES[currentStep].title}</h2>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {FORM_CATEGORIES.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-500",
                            currentStep === idx ? "w-8 bg-blue-600" : "w-3 bg-slate-200 dark:bg-white/10"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid gap-6 md:grid-cols-2"
                    >
                      {FORM_CATEGORIES[currentStep].fields.map((field) => (
                        <div key={field} className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            {FIELD_LABELS[field]}
                            {!REQUIRED_FIELDS.includes(field as any) && <span className="lowercase font-normal opacity-60 italic ml-2">(opc)</span>}
                          </label>
                          {field === "genero" ? (
                            <select 
                              value={profile.genero} 
                              onChange={(e) => updateField(field, e.target.value)}
                              disabled={!isEditing}
                              required={REQUIRED_FIELDS.includes(field as any)}
                              className="w-full h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-sm outline-none focus:border-blue-600 transition-colors disabled:opacity-50"
                            >
                              <option value="">Seleccionar...</option>
                              <option value="hombre">Hombre</option>
                              <option value="mujer">Mujer</option>
                              <option value="otro">Otro</option>
                            </select>
                          ) : field === "localidad" ? (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowNationalityList(!showNationalityList)}
                                className="w-full h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-sm text-left flex items-center justify-between"
                              >
                                {profile.localidad || "Seleccionar..."}
                                <MapPinIcon className="w-4 h-4 text-slate-400" />
                              </button>
                              {showNationalityList && (
                                <div className="absolute z-50 top-full mt-2 w-full max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl">
                                  {apiNationalities.map(n => (
                                    <button 
                                      key={n.name}
                                      onClick={() => { updateField("localidad", n.name); setShowNationalityList(false); }}
                                      className="w-full px-4 py-2 text-left text-xs hover:bg-blue-500/10 transition-colors"
                                    >
                                      {n.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : field === "tipoSangre" ? (
                            <select 
                              value={profile.tipoSangre} 
                              onChange={(e) => updateField(field, e.target.value)}
                              disabled={!isEditing}
                              required={REQUIRED_FIELDS.includes(field as any)}
                              className="w-full h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-sm outline-none focus:border-blue-600 transition-colors disabled:opacity-50"
                            >
                              <option value="">Seleccionar...</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                            </select>
                          ) : (
                            <input 
                              type="text"
                              disabled={!isEditing}
                              value={(profile as any)[field]}
                              onChange={(e) => e.target.value !== undefined && updateField(field, e.target.value)}
                              required={REQUIRED_FIELDS.includes(field as any)}
                              placeholder="..."
                              className="w-full h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-sm outline-none focus:border-blue-600 transition-colors disabled:opacity-50"
                            />
                          )}
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button 
                        type="button"
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                        Atrás
                      </button>
                      
                      {currentStep < FORM_CATEGORIES.length - 1 && (
                        <button 
                          type="button"
                          onClick={() => setCurrentStep(currentStep + 1)}
                          className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                        >
                          Saltar
                        </button>
                      )}
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      {currentStep < FORM_CATEGORIES.length - 1 ? (
                        <>Continuar <ChevronRightIcon className="w-4 h-4" /></>
                      ) : (
                        <>{loading ? "Guardando..." : "Finalizar Perfil"}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.form>
            )}
            </AnimatePresence>

            {/* Edit Mode Trigger - Shown when form is hidden */}
            {!isEditing && savedProfile && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full p-8 bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl flex flex-col items-center justify-center text-center gap-6"
              >
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600">
                  <ClipboardDocumentCheckIcon className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Expediente Protegido</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    Tus datos personales y métricas médicas están guardados de forma segura. Presiona el botón para realizar modificaciones.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    MODIFICAR DATOS
                  </button>
                  <Link 
                    href="/"
                    className="px-10 py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                  >
                    OMITIR Y VOLVER
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Voice Analysis Box - Embedded style */}
            {mode === "voz" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-500/20"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <SparklesIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold">Analista de Voz Mia</h3>
                      <p className="text-xs text-white/70">Habla con libertad, yo extraigo los datos.</p>
                    </div>
                  </div>
                  {isMiaSpeaking && <div className="px-3 py-1 rounded-full bg-blue-500/50 text-[10px] font-bold animate-pulse">MIA HABLANDO</div>}
                  {isListening && <div className="px-3 py-1 rounded-full bg-red-500 text-[10px] font-bold animate-pulse">EN VIVO</div>}
                </div>

                <AnimatePresence>
                  {isMiaSpeaking && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-6"
                    >
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-inner">
                        <div className="flex items-center gap-2 mb-3 text-white font-bold text-sm">
                          <InformationCircleIcon className="w-5 h-5 text-blue-200" />
                          Por favor, indícame lo siguiente:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {voiceLabels.map(label => (
                            <span key={label} className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-1.5 rounded-lg shadow-sm border border-white/10">
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="bg-black/10 rounded-2xl p-5 border border-white/10 min-h-[100px] mb-8">
                  <p className="text-sm italic text-white/90 leading-relaxed">
                    {isMiaSpeaking ? "Escucha atentamente las instrucciones..." : transcript || "Comienza a hablar..."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={stopAndSendToAI}
                    disabled={isAnalyzing}
                    className="flex-1 bg-white text-blue-600 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    {isAnalyzing ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Enviar y Procesar <CheckCircleIcon className="w-5 h-5" /></>
                    )}
                  </button>
                  <button 
                    onClick={replayVoiceCapture}
                    className="px-6 h-12 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-sm transition-all"
                  >
                    Reiniciar
                  </button>
                  <button 
                    onClick={stopVoiceCapture}
                    className="px-6 h-12 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-200 font-bold text-sm transition-all"
                  >
                    Detener
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar / Summary Area - Mobile First: Stacks below form on mobile */}
          <aside className="w-full space-y-6 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-[#0c0c0c] rounded-[15px] p-8 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 dark:bg-blue-600/20 blur-[50px] rounded-full" />
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Resumen Actual</h3>
                </div>
                {savedProfile && !isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-[10px] font-bold text-blue-500 hover:underline"
                  >
                    Editar
                  </button>
                )}
              </div>
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase mb-2">Paciente</p>
                  <p className="text-xl font-black">{profile.nombres || "Pendiente..."}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">{profile.edad || "--"} años</span>
                    <span className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/60">{profile.genero || "--"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 text-center border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-400 dark:text-white/40 mb-1">Peso</p>
                    <p className="font-bold">{profile.peso || "--"} <span className="text-[10px] font-normal">kg</span></p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 text-center border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-400 dark:text-white/40 mb-1">Altura</p>
                    <p className="font-bold">{profile.estatura || "--"} <span className="text-[10px] font-normal">cm</span></p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                  {[
                    { label: "Sangre", val: profile.tipoSangre, icon: BeakerIcon },
                    { label: "Medicación", val: profile.medicacion, icon: ClipboardDocumentCheckIcon },
                    { label: "Alergias", val: profile.alergias, icon: ExclamationTriangleIcon },
                    { label: "Emergencia", val: profile.contactoEmergencia, icon: PhoneIcon },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs group">
                      <div className="flex items-center gap-2 text-slate-400 dark:text-white/40">
                        <item.icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-white/90 truncate max-w-[120px]">{item.val || "---"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <button 
                  onClick={() => setShowQRModal(true)}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 transition-all"
                >
                  <ShieldCheckIcon className="w-5 h-5" />
                  Perfil de Emergencia QR
                </button>
                <p className="text-[10px] text-slate-400 text-center px-4 leading-relaxed">
                  Genera un código QR con tus datos vitales para personal médico en caso de emergencia.
                </p>
              </div>
            </div>

            {/* Help Tip */}
            <div className="p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tus datos están encriptados y protegidos. Mia utiliza esta información únicamente para personalizar tus diagnósticos.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Emergency QR Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setShowQRModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[3rem] p-8 border border-white/10 shadow-2xl text-center space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-red-600 uppercase tracking-tighter">Perfil de Emergencia</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Escaneo Vital para Paramédicos</p>
              </div>

              <div className="p-6 bg-white rounded-[2rem] shadow-inner flex flex-col items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                    `EMERGENCIA MIA: ${profile.nombres} | SANGRE: ${profile.tipoSangre} | ALERGIAS: ${profile.alergias} | CONTACTO SOS: ${profile.nombreContactoEmergencia} (${profile.contactoEmergencia})`
                  )}`}
                  alt="QR Emergencia"
                  className="w-48 h-48"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Sangre</p>
                  <p className="text-lg font-black text-red-600">{profile.tipoSangre || '??'}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Alergias</p>
                  <p className="text-[10px] font-black line-clamp-2">{profile.alergias || 'Ninguna'}</p>
                </div>
              </div>

              <button 
                onClick={() => setShowQRModal(false)}
                className="w-full py-4 bg-slate-100 dark:bg-white/10 rounded-2xl font-bold text-sm"
              >
                Cerrar Perfil
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-2xl flex items-center gap-3"
          >
            <div className={cn("w-2 h-2 rounded-full animate-pulse", toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500')} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
