"use client";

import { useState } from "react";
import { DocumentDuplicateIcon, CheckIcon, PhoneIcon } from "@heroicons/react/24/outline";

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
  const countries = Object.keys(emergencyData);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

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
    <main className="min-h-[100dvh] bg-slate-50 px-6 py-12 font-sans text-slate-900 sm:px-10">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        
        {/* Header Alert */}
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-100">
              <PhoneIcon className="h-7 w-7 text-red-600 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Aviso Crítico</p>
              <h1 className="mt-1 text-2xl font-bold text-red-900">Números de Emergencia</h1>
              <p className="mt-2 text-sm leading-relaxed text-red-800/90 max-w-2xl">
                Si tú o alguien más presenta dolor fuerte en el pecho, dificultad para respirar, 
                pérdida de conocimiento, o cualquier situación de riesgo inmediato, 
                <strong> contacta a emergencias inmediatamente.</strong> Mia es un apoyo, pero no sustituye atención médica urgente.
              </p>
            </div>
          </div>
        </section>

        {/* Selection Area */}
        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="mb-6 text-xl font-bold text-slate-800">Busca los números de tu localidad</h2>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="country" className="block text-sm font-medium text-slate-700">País</label>
              <select 
                id="country" 
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedState("");
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="" disabled>Selecciona un país</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="state" className="block text-sm font-medium text-slate-700">Estado / Región</label>
              <select 
                id="state" 
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                disabled={!selectedCountry}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
              >
                <option value="" disabled>Selecciona un estado</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Results Area */}
        {activeNumbers && (
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 px-2">Números disponibles</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(activeNumbers).map(([service, number]) => (
                <div key={service} className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-red-200 hover:shadow-md">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500">{service}</h4>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{number}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleCopy(number)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {copiedNumber === number ? (
                      <>
                        <CheckIcon className="h-5 w-5 text-green-500" />
                        <span className="text-green-600">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <DocumentDuplicateIcon className="h-5 w-5" />
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