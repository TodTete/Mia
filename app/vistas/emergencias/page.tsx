"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Phone, Copy, Check, ShieldAlert, Heart, User, MapPin, Droplets, AlertTriangle, Clock, ShieldCheck, ChevronRight, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ViewTutorialModal } from "@/components/ui/view-tutorial-modal";

type EmergencyData = Record<string, Record<string, Record<string, string>>>;

const emergencyData: EmergencyData = {
  "México": {
    "Todos los estados": { "Emergencias (General)": "911", "Denuncia Anónima": "089", "Cruz Roja": "065" },
    "Aguascalientes": { "Emergencias": "911", "Locatel": "449 910 2020", "Cruz Roja": "065" },
    "Baja California": { "Emergencias": "911", "Denuncia Anónima": "089", "Cruz Roja": "065" },
    "Baja California Sur": { "Emergencias": "911", "Cruz Roja": "065" },
    "Campeche": { "Emergencias": "911", "Protección Civil": "981 816 8123" },
    "Chiapas": { "Emergencias": "911", "Protección Civil": "961 615 1507" },
    "Chihuahua": { "Emergencias": "911", "Fiscalía General": "089", "Cruz Roja": "065" },
    "Ciudad de México": { "Emergencias": "911", "Locatel": "55 5658 1111", "Cruz Roja": "065", "Bomberos": "55 5768 2532" },
    "Coahuila": { "Emergencias": "911", "Policía Estatal": "844 438 0700" },
    "Colima": { "Emergencias": "911", "Cruz Roja": "065" },
    "Durango": { "Emergencias": "911", "Protección Civil": "618 137 9598" },
    "Estado de México": { "Emergencias": "911", "Infracciones": "800 900 3300", "Cruz Roja": "065" },
    "Guanajuato": { "Emergencias": "911", "Cruz Roja": "065" },
    "Guerrero": { "Emergencias": "911", "Protección Civil": "747 471 2231" },
    "Hidalgo": { "Emergencias": "911", "Cruz Roja": "065" },
    "Jalisco": { "Emergencias": "911", "Cruz Roja": "065", "Bomberos GDL": "33 3619 5155" },
    "Michoacán": { "Emergencias": "911", "Policía Estatal": "443 113 5000" },
    "Morelos": { "Emergencias": "911", "Cruz Roja": "065" },
    "Nayarit": { "Emergencias": "911", "Protección Civil": "311 213 1607" },
    "Nuevo León (Monterrey)": { "Emergencias": "911", "Protección Civil": "81 8343 1118", "Cruz Roja": "065" },
    "Oaxaca": { "Emergencias": "911", "Protección Civil": "951 144 7027" },
    "Puebla": { "Emergencias": "911", "Atención Ciudadana": "222 246 3830", "Cruz Roja": "065" },
    "Querétaro": { "Emergencias": "911", "Locatel": "442 214 4444" },
    "Quintana Roo": { "Emergencias": "911", "Protección Civil": "983 832 2548" },
    "San Luis Potosí": { "Emergencias": "911", "Cruz Roja": "065" },
    "Sinaloa": { "Emergencias": "911", "Cruz Roja": "065" },
    "Sonora": { "Emergencias": "911", "Protección Civil": "662 236 4400" },
    "Tabasco": { "Emergencias": "911", "Protección Civil": "993 358 1125" },
    "Tamaulipas": { "Emergencias": "911", "Protección Civil": "834 305 7000" },
    "Tlaxcala": { "Emergencias": "911", "Cruz Roja": "065" },
    "Veracruz": { "Emergencias": "911", "Protección Civil": "228 820 3170" },
    "Yucatán": { "Emergencias": "911", "SSP Yucatán": "999 930 3200", "Cruz Roja": "065" },
    "Zacatecas": { "Emergencias": "911", "Cruz Roja": "065" }
  },
  "Estados Unidos": {
    "Todos los estados": { "Emergencias (Policía, Ambulancia, Bomberos)": "911", "Asistencia local no urgente": "311" }
  },
  "España": {
    "Todas las comunidades": { "Emergencias (General)": "112", "Policía Nacional": "091", "Ambulancia": "061", "Bomberos": "080", "Guardia Civil": "062" }
  },
  "Colombia": {
    "Todos los departamentos": { "Línea Única de Emergencias": "123", "Policía Nacional": "112", "Ambulancia": "125", "Bomberos": "119", "Tránsito": "127" }
  },
  "Argentina": {
    "Todas las provincias": { "Emergencias": "911", "Policía": "101", "Ambulancia (SAME)": "107", "Bomberos": "100", "Defensa Civil": "103" }
  },
  "Chile": {
    "Todas las regiones": { "Ambulancia (SAMU)": "131", "Bomberos": "132", "Policía (Carabineros)": "133", "Búsqueda y Salvamento": "136" }
  },
  "Perú": {
    "Todos los departamentos": { "Emergencias / Policía": "105", "Ambulancia (SAMU)": "106", "Bomberos": "116" }
  }
};

export default function EmergenciasPage() {
  const router = useRouter();
  const countries = Object.keys(emergencyData);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mia_patient_profile");
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error al cargar perfil:", e);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mia_patient_profile");
      if (saved) {
        const profileData = JSON.parse(saved);
        const loc = profileData.localidad || profileData.domicilio;
        
        if (loc) {
          let foundCountry = "";
          let foundState = "";
          
          for (const c of countries) {
            if (loc.toLowerCase().includes(c.toLowerCase())) {
              foundCountry = c;
            }
            
            const stateKeys = Object.keys(emergencyData[c]);
            for (const s of stateKeys) {
              if (s !== "Todos los estados" && loc.toLowerCase().includes(s.toLowerCase())) {
                foundCountry = c;
                foundState = s;
                break;
              }
            }
          }
          
          if (foundCountry) {
            setSelectedCountry(foundCountry);
            if (foundState) {
              setSelectedState(foundState);
            } else {
              const stateKeys = Object.keys(emergencyData[foundCountry]);
              if (stateKeys.length > 0) {
                setSelectedState(stateKeys[0]);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Error al leer el perfil guardado:", e);
    }
  }, []);

  const states = selectedCountry ? Object.keys(emergencyData[selectedCountry]) : [];
  const activeNumbers = (selectedCountry && selectedState) 
    ? emergencyData[selectedCountry][selectedState] 
    : null;

  const handleCopy = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number.replace(/\s+/g, ''));
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(null), 2000);
    } catch (err) {
      console.error("Error al copiar", err);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pt-24 pb-20">
      <ViewTutorialModal 
        viewId="emergencias"
        title="Contactos de Emergencia"
        description="Ten siempre a la mano los números de ayuda y rescate de tu país y estado. Desde aquí puedes copiar rápidamente los números de emergencia y consultar tu propia información crítica en caso de incidentes."
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
        {/* Header Alert */}
        <section className="mb-10 rounded-[2.5rem] border border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5 p-8 shadow-[0_20px_50px_rgba(239,68,68,0.1)] backdrop-blur-sm overflow-hidden relative">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/5 rounded-full blur-3xl" />
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-red-100 dark:bg-red-900/40 shadow-inner">
              <Phone className="h-10 w-10 text-red-600 dark:text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500 dark:text-red-400">Estado de Emergencia</p>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">Números de Emergencia</h1>
              <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400 max-w-3xl">
                Si tú o alguien más presenta dolor fuerte en el pecho, dificultad para respirar, 
                pérdida de conocimiento, o cualquier situación de riesgo inmediato, 
                <strong className="text-red-600 dark:text-red-400 font-black"> contacta a emergencias inmediatamente.</strong> 
                Mia es un apoyo informativo, no sustituye la atención médica de urgencia.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3 mb-12">
          {/* Medical ID Card */}
          <div className="lg:col-span-2">
            <section className="h-full rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <User className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold">Tu Perfil Médico</h2>
                </div>
                <Link href="/vistas/perfil" className="text-xs font-bold text-[#3649cc] hover:underline flex items-center gap-1">
                  Editar <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {profile ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                        <Droplets className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Sangre</p>
                        <p className="text-lg font-black">{profile.tipoSangre || 'No registrado'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alergias</p>
                        <p className="text-sm font-bold truncate max-w-[150px]">{profile.alergias || 'Ninguna'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contacto SOS</p>
                        <p className="text-lg font-black">{profile.contactoEmergencia || 'No registrado'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</p>
                        <p className="text-sm font-bold">{profile.localidad || 'Ubicación actual'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-300 dark:border-white/20">
                  <p className="text-sm font-bold text-slate-400 mb-4 text-center px-6">Completa tu expediente para mostrar tu información crítica aquí.</p>
                  <Link href="/vistas/captura-datos" className="px-6 py-2 bg-[#3649cc] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#3649cc]/20">
                    Completar Perfil
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Location Selection Section */}
          <section className="rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-8 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">Localidad</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">País</label>
                <select 
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedState("");
                  }}
                  className="w-full rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-[#3649cc]/10 appearance-none"
                >
                  <option value="" disabled>País</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</label>
                <select 
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  disabled={!selectedCountry}
                  className="w-full rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-[#3649cc]/10 appearance-none"
                >
                  <option value="" disabled>Estado / Región</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Results Area */}
        {activeNumbers ? (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Central de Ayuda</h3>
              <div className="h-px flex-1 mx-6 bg-slate-100 dark:bg-white/5"></div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(activeNumbers).map(([service, number]) => (
                <div key={service} className="group relative flex flex-col justify-between rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 shadow-sm transition-all hover:scale-[1.02] hover:border-[#3649cc]/50">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest">Activo 24/7</span>
                      <Phone className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{service}</h4>
                    <p className="text-4xl font-black tracking-tighter text-[#3649cc] dark:text-indigo-400">{number}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleCopy(number)}
                    className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black px-6 py-4 text-sm font-black transition-all hover:bg-[#3649cc] dark:hover:bg-indigo-400 hover:text-white active:scale-95 shadow-xl shadow-slate-900/20 dark:shadow-white/10"
                  >
                    {copiedNumber === number ? (
                      <>
                        <ShieldCheck className="h-5 w-5" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        <span>Copiar para marcar</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="mb-12 py-16 flex flex-col items-center justify-center bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 text-center px-6">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-2xl font-black mb-2">Selecciona tu ubicación</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">Para mostrarte los números exactos de tu zona, por favor selecciona un país y estado arriba.</p>
          </div>
        )}

        {/* Action Guide Section */}
        <section className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="rounded-[2.5rem] bg-slate-900 dark:bg-indigo-950 p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <Info className="w-40 h-40" />
            </div>
            <h3 className="text-2xl font-black mb-6 relative z-10">Guía de Acción Rápida</h3>
            <div className="space-y-6 relative z-10">
              {[
                { step: "1", title: "Mantén la calma", desc: "Respira profundo, tu claridad ayudará a los servicios de emergencia." },
                { step: "2", title: "Proporciona tu ubicación", desc: "Sé lo más preciso posible: calle, número y referencias." },
                { step: "3", title: "Describe la situación", desc: "Qué sucede, cuántas personas están afectadas y su estado." },
                { step: "4", title: "Sigue instrucciones", desc: "No cuelgues hasta que el operador te lo indique." }
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white font-black text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{item.title}</h4>
                    <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-6">
                Consejo de Seguridad
              </div>
              <h3 className="text-2xl font-black mb-4">¿Sabías que?</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                El 911 en México y otros países permite la localización GPS automática de tu llamada. 
                Sin embargo, siempre es vital tener un <strong>Contacto de Emergencia</strong> configurado en tu teléfono y en Mia para agilizar el proceso de notificación a tus seres queridos.
              </p>
              
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center gap-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#3649cc]/10 text-[#3649cc]">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold">Primeros Auxilios</p>
                  <p className="text-xs text-slate-500">Consulta guías básicas en la sección de recomendaciones.</p>
                </div>
                <Link href="/vistas/recomendaciones" className="ml-auto h-8 w-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 hover:bg-[#3649cc] hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}