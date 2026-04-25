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
  contactoEmergencia: "Contacto de emergencia",
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
  if (
    typeof Intl !== "undefined" &&
    "supportedValuesOf" in Intl &&
    typeof Intl.supportedValuesOf === "function" &&
    typeof Intl.DisplayNames === "function"
  ) {
    try {
      const regions = Intl.supportedValuesOf("region");
      const display = new Intl.DisplayNames(["es"], { type: "region" });
      const names = regions
        .map((code) => display.of(code) ?? "")
        .map((name) => name.trim())
        .filter((name) => name.length > 0 && !name.toLowerCase().includes("unknown"));

      return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "es"));
    } catch {
      return COUNTRY_FALLBACK;
    }
  }

  return COUNTRY_FALLBACK;
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

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const fullTranscriptRef = useRef("");

  const missingRequiredFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((field) => !profile[field].trim());
  }, [profile]);

  function updateField(field: keyof PatientProfile, value: string) {
    setProfile((prev) => ({
      ...prev,
      [field]: normalizeByField(field, value, countryMap),
    }));
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

      setProfile((prev) => mergeProfile(prev, payload.extracted, countryMap));
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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-4xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Captura</p>
          <h1 className="mt-4 text-3xl font-semibold">
            Datos del usuario: manual o por voz
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Aqui se recaban los datos obligatorios y opcionales para continuar con Mia.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "manual"
                  ? "bg-cyan-400 text-slate-950"
                  : "border border-white/20 text-slate-200"
              }`}
            >
              Modo manual
            </button>
            <button
              type="button"
              onClick={() => setMode("voz")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "voz"
                  ? "bg-cyan-400 text-slate-950"
                  : "border border-white/20 text-slate-200"
              }`}
            >
              Modo voz
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-4xl bg-white p-6 text-slate-950">
            <h2 className="text-xl font-semibold">Formulario de captura</h2>
            <p className="mt-2 text-sm text-slate-600">
              Obligatorios: Nombre, Edad, Peso, Estatura, Genero y Localidad.
            </p>

            <form
              className="mt-6 grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                saveProfile();
              }}
            >
              {(Object.keys(FIELD_LABELS) as Array<keyof PatientProfile>).map((field) => {
                const isOptional = OPTIONAL_FIELDS.includes(field);

                return (
                  <label key={field} className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-slate-700">
                      {FIELD_LABELS[field]}
                      {isOptional ? " (opcional)" : ""}
                    </span>

                    {field === "genero" ? (
                      <>
                        <select
                          value={profile.genero}
                          onChange={(event) => updateField(field, event.target.value)}
                          disabled={!isEditing}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-cyan-300 transition focus:ring"
                        >
                          <option value="">Selecciona una opcion</option>
                          <option value="hombre">Hombre</option>
                          <option value="mujer">Mujer</option>
                          <option value="prefiero no decir">Prefiero no decir</option>
                        </select>
                        <span className="text-xs text-slate-500">
                          Este dato ayuda a personalizar mejor la orientacion de salud.
                        </span>
                      </>
                    ) : field === "localidad" ? (
                      <select
                        value={profile.localidad}
                        onChange={(event) => updateField(field, event.target.value)}
                        disabled={!isEditing}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-cyan-300 transition focus:ring"
                      >
                        <option value="">Selecciona un pais</option>
                        {countryOptions.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    ) : field === "tipoSangre" ? (
                      <select
                        value={profile.tipoSangre}
                        onChange={(event) => updateField(field, event.target.value)}
                        disabled={!isEditing}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-cyan-300 transition focus:ring"
                      >
                        <option value="">Sin especificar</option>
                        {BLOOD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                        <option value="N/A">N/A</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        inputMode={
                          field === "edad" ||
                          field === "peso" ||
                          field === "estatura" ||
                          field === "contactoEmergencia"
                            ? "numeric"
                            : "text"
                        }
                        value={profile[field]}
                        onChange={(event) => updateField(field, event.target.value)}
                        disabled={!isEditing}
                        className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-cyan-300 transition focus:ring"
                        placeholder={FIELD_LABELS[field]}
                      />
                    )}

                    {isOptional && (
                      <span className="text-xs text-slate-500">
                        Si no aplica, escribe &quot;ninguna&quot; y se convertira automaticamente a N/A.
                      </span>
                    )}
                  </label>
                );
              })}

              <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!isEditing}
                  className="rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Guardar datos
                </button>

                <button
                  type="button"
                  onClick={clearAllData}
                  disabled={isListening || isAnalyzing}
                  className="rounded-full border border-red-300 px-5 py-2 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Eliminar datos
                </button>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={editSavedData}
                    className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium"
                  >
                    Editar o actualizar
                  </button>
                )}
              </div>
            </form>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {status && (
              <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {status}
              </p>
            )}
          </article>

          <article className="rounded-4xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Captura por voz</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Mia escucha de forma continua hasta que tu la detengas. Al detener,
              analiza toda la conversacion con DeepSeek para separar y llenar cada campo.
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-400">
              Tambien identifica &quot;masculino&quot; como hombre y convierte &quot;ninguna&quot; a N/A
              en los campos opcionales.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startVoiceCapture}
                disabled={mode !== "voz" || isListening || !isEditing || isAnalyzing}
                className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Iniciar escucha
              </button>
              <button
                type="button"
                onClick={() => {
                  void stopVoiceCapture();
                }}
                disabled={!isListening || isAnalyzing}
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                Detener y analizar
              </button>
              <button
                type="button"
                onClick={replayVoiceCapture}
                disabled={mode !== "voz" || isListening || isAnalyzing || !isEditing}
                className="rounded-full border border-cyan-300/40 px-5 py-2 text-sm font-medium text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Volver a grabar
              </button>
            </div>

            {isAnalyzing && (
              <p className="mt-4 rounded-xl bg-cyan-200/20 px-4 py-3 text-sm text-cyan-100">
                Mia esta procesando la conversacion completa con IA...
              </p>
            )}

            <div className="mt-4 rounded-2xl bg-slate-900/80 p-4 text-sm text-slate-200">
              <p className="font-medium">Transcripcion reciente</p>
              <p className="mt-2 min-h-16 text-slate-300">
                {transcript || "Aun no hay transcripcion."}
              </p>
            </div>

            {missingRequiredFields.length > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
                Faltan obligatorios: {missingRequiredFields.map((field) => FIELD_LABELS[field]).join(", ")}.
              </div>
            )}
          </article>
        </section>

        <section className="rounded-4xl bg-white p-6 text-slate-950">
          <h2 className="text-xl font-semibold">Dashboard del usuario</h2>
          <p className="mt-2 text-sm text-slate-600">
            Despues de guardar, aqui puedes consultar y actualizar tus datos cuando sea necesario.
          </p>

          {!savedProfile ? (
            <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              Aun no hay datos guardados.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(Object.keys(FIELD_LABELS) as Array<keyof PatientProfile>).map((field) => (
                <article key={field} className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {FIELD_LABELS[field]}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {savedProfile[field] || "Sin dato"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
