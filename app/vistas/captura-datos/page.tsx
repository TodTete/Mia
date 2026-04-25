"use client";

import { useMemo, useRef, useState } from "react";

type CaptureMode = "manual" | "voz";

type PatientProfile = {
  nombre: string;
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

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex?: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type WindowWithSpeech = Window & {
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  SpeechRecognition?: new () => SpeechRecognitionLike;
};

const STORAGE_KEY = "mia-profile-v1";

const EMPTY_PROFILE: PatientProfile = {
  nombre: "",
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

const REQUIRED_FIELDS: Array<keyof PatientProfile> = [
  "nombre",
  "edad",
  "peso",
  "estatura",
  "genero",
  "localidad",
];

const FORM_CATEGORIES = [
  {
    title: "Datos Personales",
    fields: ["nombre", "edad", "genero", "localidad"] as Array<keyof PatientProfile>,
  },
  {
    title: "Medidas Físicas",
    fields: ["peso", "estatura", "tipoSangre"] as Array<keyof PatientProfile>,
  },
  {
    title: "Información Médica",
    fields: ["medicacion", "alergias", "discapacidad", "contactoEmergencia"] as Array<keyof PatientProfile>,
  },
];

const PUEBLA_LOCALITIES = [
  "Puebla, Pue",
  "Tecamachalco, Pue",
  "Tehuacán, Pue",
  "San Andrés Cholula, Pue",
  "San Pedro Cholula, Pue",
  "Atlixco, Pue",
  "Amozoc, Pue",
  "Huauchinango, Pue",
  "San Martín Texmelucan, Pue",
];

const FIELD_LABELS: Record<keyof PatientProfile, string> = {
  nombre: "Nombre",
  edad: "Edad",
  peso: "Peso (kg)",
  estatura: "Estatura (cm)",
  genero: "Genero",
  localidad: "Localidad",
  tipoSangre: "Tipo de sangre",
  discapacidad: "Discapacidad",
  medicacion: "Medicacion",
  alergias: "Alergias",
  contactoEmergencia: "Contacto de Emergencia",
};

const INTERVIEW_QUESTIONS: Record<keyof PatientProfile, string> = {
  nombre: "Hola, soy Mia. ¿Cuál es tu nombre completo?",
  edad: "Mucho gusto. ¿Cuántos años tienes?",
  peso: "Perfecto. Ahora dime, ¿cuál es tu peso en kilogramos?",
  estatura: "Entendido. ¿Y cuánto mides en centímetros?",
  genero: "¿Cómo defines tu género?",
  localidad: "¿En qué país vives actualmente?",
  tipoSangre: "¿Cuál es tu tipo de sangre?",
  discapacidad: "¿Tienes alguna discapacidad que debamos registrar?",
  medicacion: "¿Tomas algún medicamento actualmente?",
  alergias: "¿Padeces alguna alergia?",
  contactoEmergencia: "Finalmente, ¿cuál es el teléfono de tu contacto de emergencia?",
};

const OPTIONAL_FIELDS: Array<keyof PatientProfile> = [
  "tipoSangre",
  "discapacidad",
  "medicacion",
  "alergias",
  "contactoEmergencia",
];

const GENDER_OPTIONS = ["hombre", "mujer", "prefiero no decir"] as const;
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const COUNTRY_FALLBACK = [
  "Afganistan",
  "Albania",
  "Alemania",
  "Andorra",
  "Arabia Saudita",
  "Argelia",
  "Argentina",
  "Australia",
  "Austria",
  "Belgica",
  "Bolivia",
  "Brasil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Corea del Sur",
  "Costa Rica",
  "Cuba",
  "Dinamarca",
  "Ecuador",
  "Egipto",
  "El Salvador",
  "Emiratos Arabes Unidos",
  "Espana",
  "Estados Unidos",
  "Filipinas",
  "Finlandia",
  "Francia",
  "Grecia",
  "Guatemala",
  "Honduras",
  "India",
  "Indonesia",
  "Irlanda",
  "Israel",
  "Italia",
  "Japon",
  "Marruecos",
  "Mexico",
  "Nicaragua",
  "Noruega",
  "Nueva Zelanda",
  "Paises Bajos",
  "Panama",
  "Paraguay",
  "Peru",
  "Polonia",
  "Portugal",
  "Reino Unido",
  "Republica Dominicana",
  "Rumania",
  "Rusia",
  "Suecia",
  "Suiza",
  "Turquia",
  "Ucrania",
  "Uruguay",
  "Venezuela",
];

const NONE_TOKENS = new Set([
  "ninguna",
  "ninguno",
  "ningun",
  "na",
  "n/a",
  "no",
  "sin",
  "no tengo",
  "no aplica",
]);

function readStoredProfile(): PatientProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as PatientProfile;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getCountryOptions() {
  return Array.from(new Set(COUNTRY_FALLBACK)).sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

function valueFromPattern(input: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return "";
}

function normalizeNumberValue(value: string) {
  return value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
}

function normalizeEmergencyContact(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const normalized = normalize(trimmed);
  if (NONE_TOKENS.has(normalized)) {
    return "N/A";
  }

  return trimmed;
}

function normalizeGenderValue(value: string) {
  const normalized = normalize(value.trim());

  if (["hombre", "masculino", "male", "varon"].includes(normalized)) {
    return "hombre";
  }

  if (["mujer", "femenino", "female"].includes(normalized)) {
    return "mujer";
  }

  if (["prefiero no decir", "no decir", "omitir"].includes(normalized)) {
    return "prefiero no decir";
  }

  return value.trim();
}

function normalizeBloodTypeValue(value: string) {
  const raw = normalize(value).replace(/\s+/g, "");
  if (!raw) {
    return "";
  }

  if (NONE_TOKENS.has(raw)) {
    return "N/A";
  }

  const expanded = raw.replace("positivo", "+").replace("negativo", "-");
  const upper = expanded.toUpperCase();

  if ((BLOOD_TYPES as readonly string[]).includes(upper)) {
    return upper;
  }

  return value.trim().toUpperCase();
}

function buildCountryMap(countryOptions: string[]) {
  const entries = countryOptions.map((country) => [normalize(country), country] as const);
  const map = new Map<string, string>(entries);

  map.set("mexico", "Mexico");
  map.set("estados unidos", "Estados Unidos");
  map.set("eeuu", "Estados Unidos");
  map.set("usa", "Estados Unidos");
  map.set("reino unido", "Reino Unido");

  return map;
}

function normalizeCountry(value: string, countryMap: Map<string, string>) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return countryMap.get(normalize(trimmed)) ?? trimmed;
}

function normalizeByField(
  field: keyof PatientProfile,
  value: string,
  countryMap: Map<string, string>,
) {
  if (field === "edad" || field === "peso" || field === "estatura") {
    return normalizeNumberValue(value);
  }

  if (field === "contactoEmergencia") {
    const digits = normalizeEmergencyContact(value);
    return normalizeOptional(digits);
  }

  if (field === "genero") {
    return normalizeGenderValue(value);
  }

  if (field === "localidad") {
    return normalizeCountry(value, countryMap);
  }

  if (field === "tipoSangre") {
    return normalizeBloodTypeValue(value);
  }

  if (OPTIONAL_FIELDS.includes(field)) {
    return normalizeOptional(value);
  }

  return value.trim();
}

function parseVoiceTranscript(transcript: string) {
  const source = normalize(transcript);

  const nombre = valueFromPattern(source, [
    /(?:me llamo|mi nombre es|soy)\s+([a-z\s]{2,40})/i,
  ]);

  const edad = valueFromPattern(source, [
    /(?:tengo|edad)\s+([0-9]{1,3})\s*(?:anos|anios)?/i,
  ]);

  const peso = valueFromPattern(source, [
    /(?:peso|mi peso es)\s+([0-9]{2,3}(?:[\.,][0-9])?)/i,
  ]);

  const estatura = valueFromPattern(source, [
    /(?:mido|estatura|mi estatura es)\s+([0-9]{2,3}(?:[\.,][0-9]{1,2})?)/i,
  ]);

  const genero = valueFromPattern(source, [
    /(?:soy|genero)\s+(hombre|mujer|masculino|femenino|prefiero no decir)/i,
  ]);

  const localidad = valueFromPattern(source, [
    /(?:vivo en|soy de|localidad)\s+([a-z\s]{2,50})/i,
  ]);

  const tipoSangre = valueFromPattern(source, [
    /(?:tipo de sangre|sangre)\s+((?:a|b|ab|o)[+-]|[ab0o]{1,2}\s+(?:positivo|negativo))/i,
  ]).toUpperCase();

  const discapacidad = valueFromPattern(source, [
    /(?:discapacidad|tengo discapacidad)\s+([a-z\s]{2,60})/i,
  ]);

  const medicacion = valueFromPattern(source, [
    /(?:medicacion|medicamento|tomo)\s+([a-z0-9\s,.-]{2,80})/i,
  ]);

  const alergias = valueFromPattern(source, [
    /(?:alergia|alergias|soy alergico a)\s+([a-z0-9\s,.-]{2,80})/i,
  ]);

  const contactoEmergencia = valueFromPattern(source, [
    /(?:contacto de emergencia|telefono de emergencia|emergencia)\s+([a-z0-9\s,.-]{2,80})/i,
  ]);

  return {
    nombre,
    edad,
    peso,
    estatura,
    genero,
    localidad,
    tipoSangre,
    discapacidad,
    medicacion,
    alergias,
    contactoEmergencia,
  };
}

function mergeProfile(
  current: PatientProfile,
  incoming: Partial<PatientProfile>,
  countryMap: Map<string, string>,
): PatientProfile {
  const next: PatientProfile = { ...current };

  for (const key of Object.keys(current) as Array<keyof PatientProfile>) {
    const value = normalizeByField(key, incoming[key] ?? "", countryMap);
    if (value) {
      next[key] = value;
    }
  }

  return next;
}

export default function CapturaDatosPage() {
  const countryOptions = useMemo(() => getCountryOptions(), []);
  const countryMap = useMemo(() => buildCountryMap(countryOptions), [countryOptions]);
  const initialStoredProfile = useMemo(() => readStoredProfile(), []);

  const [mode, setMode] = useState<CaptureMode>("manual");
  const [profile, setProfile] = useState<PatientProfile>(
    initialStoredProfile ?? EMPTY_PROFILE,
  );
  const [savedProfile, setSavedProfile] = useState<PatientProfile | null>(
    initialStoredProfile,
  );
  const [isEditing, setIsEditing] = useState(!initialStoredProfile);
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [activeInterviewField, setActiveInterviewField] = useState<keyof PatientProfile | null>(null);
  const [interviewTranscript, setInterviewTranscript] = useState("");
  const [lastUpdatedFields, setLastUpdatedFields] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const fullTranscriptRef = useRef("");

  const missingRequiredFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((field) => !profile[field].trim());
  }, [profile]);

  function updateField(field: keyof PatientProfile, value: string, isFromIA = false) {
    const normalizedValue = normalizeByField(field, value, countryMap);
    setProfile((prev) => ({
      ...prev,
      [field]: normalizedValue,
    }));

    if (isFromIA) {
      setLastUpdatedFields((prev) => new Set([...prev, field]));
      setTimeout(() => {
        setLastUpdatedFields((prev) => {
          const next = new Set(prev);
          next.delete(field);
          return next;
        });
      }, 2000);
    }
  }

  function validate(profileToValidate: PatientProfile) {
    const missing = REQUIRED_FIELDS.filter(
      (field) => !profileToValidate[field].trim(),
    );

    if (missing.length > 0) {
      const labels = missing.map((field) => FIELD_LABELS[field]).join(", ");
      return `Faltan datos obligatorios: ${labels}.`;
    }

    const age = Number(profileToValidate.edad);
    if (!Number.isFinite(age) || age < 1 || age > 120) {
      return "La edad debe ser numerica y estar entre 1 y 120.";
    }

    const weight = Number(profileToValidate.peso);
    if (!Number.isFinite(weight) || weight < 20 || weight > 250) {
      return "El peso debe ser numerico y estar entre 20 y 250 kg para evitar errores de captura.";
    }

    const height = Number(profileToValidate.estatura);
    if (!Number.isFinite(height) || height < 90 || height > 250) {
      return "La estatura debe ser numerica y estar entre 90 y 250 cm.";
    }

    if (!(GENDER_OPTIONS as readonly string[]).includes(profileToValidate.genero)) {
      return "Selecciona un genero valido: hombre, mujer o prefiero no decir.";
    }

    if (!countryMap.has(normalize(profileToValidate.localidad))) {
      return "La localidad debe ser un pais valido de la lista.";
    }

    if (
      profileToValidate.tipoSangre &&
      profileToValidate.tipoSangre !== "N/A" &&
      !(BLOOD_TYPES as readonly string[]).includes(profileToValidate.tipoSangre)
    ) {
      return "El tipo de sangre no es valido. Usa: A+, A-, B+, B-, AB+, AB-, O+, O-.";
    }

    if (
      profileToValidate.contactoEmergencia &&
      profileToValidate.contactoEmergencia !== "N/A" &&
      !/^\d{7,15}$/.test(profileToValidate.contactoEmergencia)
    ) {
      return "El contacto de emergencia debe ser numerico y tener entre 7 y 15 digitos.";
    }

    return "";
  }

  function saveProfile() {
    const validationError = validate(profile);
    if (validationError) {
      setError(validationError);
      setStatus("");
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSavedProfile(profile);
    setIsEditing(false);
    setError("");
    setStatus("Datos guardados correctamente. Ya puedes continuar al dashboard.");
  }

  async function analyzeWithDeepSeek(fullTranscript: string) {
    if (!fullTranscript.trim()) {
      setError("No hay conversacion para analizar.");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setStatus("Analizando conversacion completa con IA de Mia...");

    try {
      const response = await fetch("/api/deepseek/extract-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullTranscript,
          currentProfile: profile,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: string;
          code?: string;
          detail?: string;
        };

        if (payload.code === "insufficient_balance") {
          throw new Error(
            "DeepSeek sin saldo. Recarga creditos o usa otra API key activa.",
          );
        }

        throw new Error(payload.detail || payload.error || "Fallo la extraccion");
      }

      const payload = (await response.json()) as {
        extracted: Partial<PatientProfile>;
      };

      const extracted = payload.extracted;
      setProfile((prev) => mergeProfile(prev, extracted, countryMap));
      
      // Highlight updated fields
      const updatedKeys = Object.keys(extracted).filter(k => !!extracted[k as keyof PatientProfile]);
      setLastUpdatedFields(new Set(updatedKeys));
      setTimeout(() => setLastUpdatedFields(new Set()), 3000);

      setStatus(
        "Extraccion completada. Revisa y corrige manualmente cualquier dato necesario.",
      );
    } catch (err) {
      const localParsed = parseVoiceTranscript(fullTranscript);
      setProfile((prev) => mergeProfile(prev, localParsed, countryMap));

      const message = err instanceof Error ? err.message : "Error desconocido";

      setError(
        `No se pudo procesar con DeepSeek (${message}). Se aplico extraccion local de respaldo.`,
      );
      setStatus("Verifica y ajusta manualmente antes de guardar.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function askQuestion(field: keyof PatientProfile) {
    const text = INTERVIEW_QUESTIONS[field];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    utterance.rate = 1.0;
    utterance.pitch = 2.0; // Un tono ligeramente más femenino

    // Intentar encontrar una voz femenina en español
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      (v.lang.includes("es") || v.lang.includes("ES")) && 
      (v.name.toLowerCase().includes("google") || 
       v.name.toLowerCase().includes("female") || 
       v.name.toLowerCase().includes("monica") || 
       v.name.toLowerCase().includes("paulina") || 
       v.name.toLowerCase().includes("helena") ||
       v.name.toLowerCase().includes("sabina"))
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.onstart = () => {
       setIsListening(false);
    };

    utterance.onend = () => {
      startInterviewListening();
    };

    window.speechSynthesis.speak(utterance);
  }

  function startInterviewListening() {
    const voiceWindow = window as WindowWithSpeech;
    const SpeechCtor = voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
    if (!SpeechCtor) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    const recognition = new SpeechCtor();
    recognition.lang = "es-MX";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const result = event.results[0];
      const transcript = result[0].transcript;
      setInterviewTranscript(transcript);

      if (result.isFinal && activeInterviewField) {
        processInterviewAnswer(activeInterviewField, transcript);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }

  async function processInterviewAnswer(field: keyof PatientProfile, answer: string) {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/deepseek/extract-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: `Para el campo ${FIELD_LABELS[field]}, el usuario respondió: ${answer}`,
          currentProfile: profile,
        }),
      });

      if (response.ok) {
        const { extracted } = await response.json();
        const newVal = extracted[field];
        if (newVal) {
          setProfile(prev => ({ ...prev, [field]: newVal }));
          setLastUpdatedFields(new Set([field]));
          setTimeout(() => setLastUpdatedFields(new Set()), 2000);
        }
      }
    } catch (e) {
      console.error("Error", e);
    } finally {
      setIsAnalyzing(false);
      setInterviewTranscript("");
      moveToNextInterviewField(field);
    }
  }

  function moveToNextInterviewField(currentField: keyof PatientProfile) {
    const fields = Object.keys(INTERVIEW_QUESTIONS) as Array<keyof PatientProfile>;
    const currentIndex = fields.indexOf(currentField);
    
    if (currentIndex < fields.length - 1) {
      const nextField = fields[currentIndex + 1];
      setActiveInterviewField(nextField);
      askQuestion(nextField);
    } else {
      setIsInterviewing(false);
      setActiveInterviewField(null);
      setStatus("Entrevista completada.");
    }
  }

  function startInterview() {
    setIsInterviewing(true);
    setMode("voz");
    const firstField = "nombre" as keyof PatientProfile;
    setActiveInterviewField(firstField);
    askQuestion(firstField);
  }

  function stopInterview() {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
    }
    setIsInterviewing(false);
    setActiveInterviewField(null);
  }

  function startVoiceCapture() {
    const voiceWindow = window as WindowWithSpeech;
    const SpeechCtor =
      voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;

    if (!SpeechCtor) {
      setError(
        "Tu navegador no soporta reconocimiento de voz. Puedes continuar manualmente.",
      );
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechCtor();
      recognitionRef.current.lang = "es-MX";
      recognitionRef.current.interimResults = true;
      recognitionRef.current.continuous = true;

      recognitionRef.current.onresult = (event) => {
        let finalized = "";
        let current = "";
        const start = event.resultIndex ?? 0;

        for (let i = start; i < event.results.length; i += 1) {
          const result = event.results[i];
          const piece = result[0]?.transcript ?? "";
          const isFinal = (result as unknown as { isFinal?: boolean }).isFinal;

          if (isFinal) {
            finalized += `${piece} `;
          } else {
            current += `${piece} `;
          }
        }

        if (finalized.trim()) {
          fullTranscriptRef.current = `${fullTranscriptRef.current} ${finalized}`.trim();
        }

        setTranscript(`${fullTranscriptRef.current} ${current}`.trim());
        setStatus("Escuchando en tiempo real. Presiona detener cuando termines.");
        setError("");
      };

      recognitionRef.current.onerror = () => {
        setError("Ocurrio un problema en la captura de voz. Intenta nuevamente.");
      };

      recognitionRef.current.onend = () => {
        if (shouldKeepListeningRef.current) {
          try {
            recognitionRef.current?.start();
            return;
          } catch {
            setError("No fue posible reanudar la escucha automaticamente.");
          }
        }
        setIsListening(false);
      };
    }

    shouldKeepListeningRef.current = true;
    fullTranscriptRef.current = "";
    setIsListening(true);
    setError("");
    setTranscript("");
    setStatus("Escuchando de forma continua. Deten cuando termines de hablar.");
    recognitionRef.current.start();
  }

  async function stopVoiceCapture() {
    shouldKeepListeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);

    const transcriptToAnalyze = fullTranscriptRef.current || transcript;
    await analyzeWithDeepSeek(transcriptToAnalyze);
  }

  function replayVoiceCapture() {
    if (isListening || isAnalyzing || !isEditing) {
      return;
    }

    setTranscript("");
    fullTranscriptRef.current = "";
    setError("");
    setStatus("Transcripcion reiniciada. Puedes volver a grabar.");
  }

  function clearAllData() {
    shouldKeepListeningRef.current = false;
    recognitionRef.current?.stop();

    localStorage.removeItem(STORAGE_KEY);
    setProfile(EMPTY_PROFILE);
    setSavedProfile(null);
    setTranscript("");
    fullTranscriptRef.current = "";
    setIsListening(false);
    setIsAnalyzing(false);
    setIsEditing(true);
    setError("");
    setStatus("Se eliminaron todos los datos. Puedes iniciar de nuevo.");
  }

  function editSavedData() {
    setIsEditing(true);
    setStatus("Modo edicion activado.");
  }

  const SoundWave = () => (
    <div className="flex items-center gap-1 h-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-1 bg-[#3345CC] rounded-full animate-bounce"
          style={{
            height: `${Math.random() * 100 + 20}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: "0.5s",
          }}
        />
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black px-4 py-8 text-slate-900 dark:text-white sm:px-10 font-manrope transition-colors duration-300">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 md:p-8 shadow-sm dark:shadow-none">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-2 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-black dark:text-white">Captura Inteligente</p>
              <div className="flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white">
                  Perfil Biométrico
                </h1>
                <div className="md:hidden">
                  
                </div>
              </div>
              <p className="text-sm text-slate-400 max-w-xl">
                Completa tu información paso a paso para que Mia pueda ofrecerte recomendaciones personalizadas.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                
              </div>
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit border border-white/10">
                <button
                  onClick={() => setMode("manual")}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    mode === "manual" ? "bg-[#0028b3] text-white shadow-lg shadow-[#0028b3]/20" : "text-black dark:text-white/60 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Manual
                </button>
                <button
                  onClick={() => setMode("voz")}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    mode === "voz" ? "bg-[#0028b3] text-white shadow-lg shadow-[#0028b3]/20" : "text-black dark:text-white/60 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Voz
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
          <div className="space-y-8">
            <section className="card-mia relative overflow-hidden md:p-10">
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800">
                <div 
                  className="h-full bg-[#3345CC] transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep + 1) / FORM_CATEGORIES.length) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between mb-10">
                <div>
                  <span className="text-[10px] font-bold text-[#3345CC] dark:text-[#3345CC] uppercase tracking-widest">Paso {currentStep + 1} de {FORM_CATEGORIES.length}</span>
                  <h2 className="text-3xl font-bold tracking-tight mt-1 text-black dark:text-white">{FORM_CATEGORIES[currentStep].title}</h2>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-[#3345CC]/10 dark:bg-[#3345CC]/20 text-[#3345CC] dark:text-[#3345CC] rounded-full text-xs font-bold animate-pulse">
                    <div className="w-2 h-2 bg-[#3345CC] rounded-full animate-ping" />
                    IA ANALIZANDO...
                  </div>
                )}
              </div>

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
                    // Podríamos mostrar un mensaje más elegante, pero por ahora esto cumple el requisito
                    return; 
                  }

                  if (currentStep === FORM_CATEGORIES.length - 1) {
                    saveProfile();
                  } else {
                    setCurrentStep(prev => prev + 1);
                  }
                }}
              >
                <div className="grid gap-8 md:grid-cols-2 p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-white/5">
                  {FORM_CATEGORIES[currentStep].fields.map((field) => {
                    const isOptional = OPTIONAL_FIELDS.includes(field);
                    const isUpdated = lastUpdatedFields.has(field);
                    
                    return (
                      <div key={field} className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
                          {FIELD_LABELS[field]} {!isOptional && <span className="text-red-500 font-bold">*</span>}
                        </label>
                        
                        <div className={`relative transition-all duration-500 ${isUpdated ? "scale-[1.02] ring-2 ring-emerald-400 rounded-xl" : ""}`}>
                          {field === "genero" ? (
                            <select
                              value={profile.genero}
                              onChange={(e) => updateField(field, e.target.value)}
                              disabled={!isEditing}
                              className="input-mia"
                            >
                              <option value="">Seleccionar...</option>
                              <option value="hombre">Hombre</option>
                              <option value="mujer">Mujer</option>
                              <option value="otro">Otro</option>
                              <option value="prefiero no decir">Prefiero no decir</option>
                            </select>
                          ) : field === "localidad" ? (
                            <div className="relative">
                              <input
                                list="localities"
                                type="text"
                                value={profile.localidad}
                                onChange={(e) => updateField(field, e.target.value)}
                                placeholder="Ej: Puebla, Pue"
                                disabled={!isEditing}
                                className="input-mia"
                              />
                              <datalist id="localities">
                                {PUEBLA_LOCALITIES.map(l => <option key={l} value={l} />)}
                                {countryOptions.map(c => <option key={c} value={c} />)}
                              </datalist>
                            </div>
                          ) : field === "tipoSangre" ? (
                            <select
                              value={profile.tipoSangre}
                              onChange={(e) => updateField(field, e.target.value)}
                              disabled={!isEditing}
                              className="input-mia"
                            >
                              <option value="">Sin especificar</option>
                              {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              <option value="N/A">N/A</option>
                            </select>
                          ) : (
                            <div className="relative group">
                              <input
                                type="text"
                                inputMode={(field === "edad" || field === "peso" || field === "estatura") ? "numeric" : "text"}
                                value={profile[field]}
                                onChange={(e) => updateField(field, e.target.value)}
                                disabled={!isEditing}
                                placeholder={FIELD_LABELS[field]}
                                className="input-mia"
                              />
                              {(field === "peso" || field === "estatura") && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => updateField(field, (parseFloat(profile[field] || "0") - 1).toString())}
                                    className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                                  >-</button>
                                  <button
                                    type="button"
                                    onClick={() => updateField(field, (parseFloat(profile[field] || "0") + 1).toString())}
                                    className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                                  >+</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100 dark:border-white/5">
                  <div className="flex gap-3 w-full sm:w-auto">
                    {currentStep > 0 && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="px-8 py-4 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-95"
                      >
                        Anterior
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={FORM_CATEGORIES[currentStep].fields.some(f => !OPTIONAL_FIELDS.includes(f) && !profile[f as keyof PatientProfile])}
                      className="btn-mia-primary flex-1 sm:flex-none px-10 py-4 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {currentStep === FORM_CATEGORIES.length - 1 ? "Finalizar y Guardar" : "Siguiente Paso"}
                    </button>
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={editSavedData}
                        className="text-sm font-bold text-slate-400 hover:text-[#3345CC] transition-colors"
                      >
                        Editar Perfil
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={clearAllData}
                      className="text-sm font-bold text-slate-300 hover:text-red-500 transition-colors"
                    >
                      Limpiar todo
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8">
            {mode === "voz" && (
              <article className={`rounded-3xl border transition-all duration-500 ${isListening ? "border-[#3345CC] bg-[#3345CC]/10 dark:bg-[#3345CC]/20" : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5"} p-6 shadow-sm dark:shadow-none`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Captura por Voz</h2>
                  {isListening && <SoundWave />}
                </div>
                
                <p className="text-xs leading-relaxed text-slate-400 mb-6">
                  Habla con naturalidad sobre tu salud. Mia extraerá los datos automáticamente usando inteligencia artificial.
                </p>

                <div className="space-y-3">
                  {!isListening ? (
                    <button
                      onClick={startInterview}
                      disabled={isInterviewing || isAnalyzing}
                      className="btn-mia-primary w-full py-4 flex items-center justify-center gap-3"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                      Iniciar Entrevista con Mia
                    </button>
                  ) : (
                    <button
                      onClick={() => void stopVoiceCapture()}
                      className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm animate-pulse flex items-center justify-center gap-3 transition-all"
                    >
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      Detener y Procesar
                    </button>
                  )}
                  
                  <button
                    onClick={replayVoiceCapture}
                    disabled={isListening || isAnalyzing || !isEditing}
                    className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30"
                  >
                    Reiniciar Grabación
                  </button>
                </div>

                {(transcript || isListening) && (
                  <div className="mt-6 p-4 bg-black/40 rounded-2xl border border-white/5">

                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Transcripción</p>
                    <p className="text-sm text-slate-300 italic line-clamp-4">
                      &quot;{transcript || "Escuchando..."}&quot;
                    </p>
                  </div>
                )}
              </article>
            )}

            <article className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-xl dark:shadow-none">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#0028b3] rounded-full" />
                Resumen Actual
              </h2>
              
              {!savedProfile && !profile.nombre ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 bg-white/5 rounded-full mx-auto flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-500">Sin datos registrados aún.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-[#0028b3]/10 border border-[#0028b3]/20 rounded-2xl">
                    <p className="text-[10px] font-bold text-[#0028b3] uppercase tracking-widest">Identidad</p>
                    <p className="text-lg font-bold truncate">{profile.nombre || "Sin nombre"}</p>
                    <p className="text-xs text-slate-400">{profile.edad ? `${profile.edad} años` : "Edad no especificada"} • {profile.genero || "Género N/D"}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Peso</p>
                      <p className="text-sm font-bold">{profile.peso ? `${profile.peso} kg` : "--"}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Altura</p>
                      <p className="text-sm font-bold">{profile.estatura ? `${profile.estatura} cm` : "--"}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Localidad</span>
                      <span className="text-xs font-bold">{profile.localidad || "N/D"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Sangre</span>
                      <span className="text-xs font-bold text-red-400">{profile.tipoSangre || "N/D"}</span>
                    </div>
                  </div>
                </div>
              )}
            </article>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3">
                <div className="w-5 h-5 bg-red-500 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold">!</div>
                <p className="text-xs text-red-200 leading-relaxed">{error}</p>
              </div>
            )}
            {status && !error && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3">
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-900">✓</div>
                <p className="text-xs text-emerald-100 leading-relaxed">{status}</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Modal de Entrevista */}
      {isInterviewing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="card-mia w-full max-w-lg border-2 border-[#3345CC]/30 shadow-[0_0_50px_rgba(51,69,204,0.2)]">
            <div className="flex flex-col items-center text-center space-y-8 py-6">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full bg-[#3345CC] flex items-center justify-center shadow-xl shadow-[#3345CC]/40 transition-all duration-300 ${isListening ? "scale-110" : "scale-100"}`}>
                   {isListening ? (
                     <div className="flex gap-1.5 items-center">
                        <div className="w-1.5 h-4 bg-white rounded-full animate-[bounce_0.6s_infinite]" />
                        <div className="w-1.5 h-8 bg-white rounded-full animate-[bounce_0.6s_infinite_0.1s]" />
                        <div className="w-1.5 h-4 bg-white rounded-full animate-[bounce_0.6s_infinite_0.2s]" />
                     </div>
                   ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                     </svg>
                   )}
                </div>
                {isAnalyzing && (
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse shadow-lg">
                    PROCESANDO...
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#3345CC]">Mia pregunta:</h3>
                <p className="text-2xl font-bold leading-tight">
                  {activeInterviewField ? INTERVIEW_QUESTIONS[activeInterviewField] : "Iniciando..."}
                </p>
              </div>

              <div className="w-full bg-slate-50 dark:bg-white/5 rounded-2xl p-6 min-h-[100px] flex items-center justify-center border border-slate-100 dark:border-white/5">
                {interviewTranscript ? (
                  <p className="text-xl font-medium text-black dark:text-white italic">
                    &quot;{interviewTranscript}&quot;
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">
                    {isListening ? "Te escucho..." : "Mia está hablando..."}
                  </p>
                )}
              </div>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => activeInterviewField && askQuestion(activeInterviewField)}
                  disabled={isAnalyzing}
                  className="flex-1 py-4 bg-[#3345CC]/10 text-[#3345CC] hover:bg-[#3345CC]/20 text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Repetir Pregunta
                </button>
                <button
                  onClick={stopInterview}
                  className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-sm font-bold rounded-2xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
