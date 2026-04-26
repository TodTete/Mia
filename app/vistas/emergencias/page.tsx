"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Phone, Copy, Check, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mia_patient_profile");
      if (saved) {
        const profile = JSON.parse(saved);
        const loc = profile.localidad || profile.domicilio;
        
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
              // Try to default to "Todos los estados" or similar if available
              const stateKeys = Object.keys(emergencyData[foundCountry]);
              if (stateKeys.includes("Todos los estados") || stateKeys.includes("Todas las comunidades") || stateKeys.includes("Todos los departamentos") || stateKeys.includes("Todas las provincias") || stateKeys.includes("Todas las regiones")) {
                setSelectedState(stateKeys[0]); // Usually the "Todos" option is the first
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Error al leer el perfil guardado:", e);
    }
  }, []); // Run once on mount

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
    <main className="min-h-screen bg-slate-50 dark:bg-background px-6 py-10 font-sans text-slate-900 dark:text-white sm:px-10">
      <div className="mx-auto max-w-5xl">
        
        <div className="mb-8">
          <button 
            onClick={() => router.push('/')} 
            className="mb-6 flex w-fit items-center gap-2 rounded-xl bg-white dark:bg-white/5 px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-white/10 transition-all hover:bg-slate-50 dark:hover:bg-white/10 hover:text-[#3649cc] dark:hover:text-indigo-400 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </button>
        </div>

        {/* Header Alert */}
        <section className="mb-8 rounded-3xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/40">
              <Phone className="h-7 w-7 text-red-600 dark:text-red-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 dark:text-red-400">Aviso Crítico</p>
              <h1 className="mt-1 text-2xl font-bold text-red-900 dark:text-red-200">Números de Emergencia</h1>
              <p className="mt-2 text-sm leading-relaxed text-red-800/90 dark:text-red-200/80 max-w-2xl">
                Si tú o alguien más presenta dolor fuerte en el pecho, dificultad para respirar, 
                pérdida de conocimiento, o cualquier situación de riesgo inmediato, 
                <strong> contacta a emergencias inmediatamente.</strong> Mia es un apoyo, pero no sustituye atención médica urgente.
              </p>
            </div>
          </div>
        </section>

        {/* Selection Area */}
        <section className="mb-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3649cc]/10 dark:bg-indigo-500/20 text-[#3649cc] dark:text-indigo-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Busca los números de tu localidad</h2>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="country" className="block text-sm font-bold text-slate-700 dark:text-slate-300">País</label>
              <div className="relative">
                <select 
                  id="country" 
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedState("");
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white outline-none transition-all focus:border-[#3649cc] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-[#3649cc]/10 dark:focus:ring-indigo-500/20 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecciona un país</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="state" className="block text-sm font-bold text-slate-700 dark:text-slate-300">Estado / Región</label>
              <div className="relative">
                <select 
                  id="state" 
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  disabled={!selectedCountry}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white outline-none transition-all focus:border-[#3649cc] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-[#3649cc]/10 dark:focus:ring-indigo-500/20 disabled:opacity-50 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecciona un estado</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results Area */}
        {activeNumbers && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white px-2">Números disponibles en tu zona</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(activeNumbers).map(([service, number]) => (
                <div key={service} className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:border-red-200 dark:hover:border-red-500/50 hover:shadow-md">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{service}</h4>
                    <p className="mt-3 text-4xl font-black tracking-tight text-slate-900 dark:text-white">{number}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleCopy(number)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all hover:bg-[#3649cc] hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white active:scale-95"
                  >
                    {copiedNumber === number ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copiar número</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
        
      </div>
    </main>
  );
}