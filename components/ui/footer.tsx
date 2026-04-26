import React from "react";
import { ShieldAlert } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full pt-12 pb-32 px-6 border-t border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-[#3649cc] dark:text-indigo-400">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest">Aviso Legal e Informativo</span>
        </div>
        
        <div className="max-w-3xl text-center space-y-4">
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Mia es una asistente basada en inteligencia artificial diseñada para proporcionar apoyo informativo y herramientas de seguimiento de salud. 
            <span className="font-bold text-slate-900 dark:text-white"> No es un médico, no realiza diagnósticos clínicos, no prescribe medicamentos ni sustituye la atención profesional de la salud.</span>
          </p>
          
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            La precisión de la información generada por Mia puede variar y no está garantizada. En caso de una emergencia médica o síntomas graves, 
            comuníquese de inmediato con los servicios de urgencias locales (911) o acuda al centro de salud más cercano. 
            El uso de esta aplicación es bajo su propia responsabilidad.
          </p>
        </div>

        <div className="pt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-[9px] font-bold text-slate-300 dark:text-white/20 uppercase tracking-[0.4em] text-center">
            © 2026 MIA - Medical Intelligent Assistant
          </p>
          <div className="flex gap-4">
            <span className="text-[8px] text-slate-400 hover:text-[#3649cc] cursor-pointer transition-colors">Términos de Uso</span>
            <span className="text-[8px] text-slate-400 hover:text-[#3649cc] cursor-pointer transition-colors">Privacidad</span>
            <span className="text-[8px] text-slate-400 hover:text-[#3649cc] cursor-pointer transition-colors">Ética de IA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
