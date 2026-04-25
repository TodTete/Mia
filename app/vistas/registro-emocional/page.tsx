"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeftIcon,
  HomeIcon,
  FaceSmileIcon,
  SparklesIcon,
  CpuChipIcon,
  FaceFrownIcon,
  BoltIcon,
  DocumentCheckIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  Squares2X2Icon,
  HeartIcon,
  Cog6ToothIcon,
  ChatBubbleBottomCenterTextIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegistroEmocionalPage() {
  const [selectedMood, setSelectedMood] = useState<string>("Ansioso");
  const [intensity, setIntensity] = useState<number>(7);
  const [thoughts, setThoughts] = useState<string>("");

  const moods = [
    { name: "Feliz", icon: FaceSmileIcon, label: "FELIZ" },
    { name: "Tranquilo", icon: SparklesIcon, label: "TRANQUILO" },
    { name: "Ansioso", icon: CpuChipIcon, label: "ANSIOSO" },
    { name: "Triste", icon: FaceFrownIcon, label: "TRISTE" },
    { name: "Enojado", icon: BoltIcon, label: "ENOJADO" },
  ];

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface font-manrope selection:bg-primary/30 pb-24 transition-colors duration-300">
      <style jsx global>{`
        .intensity-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          background: rgba(var(--color-on-surface), 0.1);
          border-radius: 4px;
          cursor: pointer;
        }
        .intensity-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: var(--color-primary);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(var(--color-primary), 0.4);
          border: 2px solid var(--color-surface);
        }
      `}</style>

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-margin h-16 bg-surface/80 backdrop-blur-xl border-b border-on-surface/10 shadow-lg transition-colors duration-300">
        <div className="flex items-center gap-sm">
          <Link 
            href="/" 
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full text-primary hover:bg-on-surface/10")}
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold tracking-tight text-primary font-public-sans">Registro Emocional</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="w-10 h-10 rounded-full overflow-hidden border border-on-surface/20">
            <img 
              alt="User Profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3FgT76GhbbDoWRP0F8il11ONiIEm2MoGYJNpm7wnmgLDt_JqX2S8wZFIX8207kquAI53RWOZiBkG_5d1aS15i5nvWYC0Jc7CzXRk2ZZs1_EDwwHesxoX7_JEs5ZXlUiyapRvggYeq3v29Rdsv6Xd8x5RTKzCGUOaedSKwo8VMovojlcsy7J3IXgqr72gW1Wpmfdre_EfrAIXI6cXRiK7omzH-UxWLk-mtDGBxUZeKT4Eg_4Ybuo7SsNK0OOJzz-WhIbDoOiHfo_w"
            />
          </div>
        </div>
      </header>

      <main className="pt-32 px-margin max-w-2xl mx-auto space-y-lg pb-12">
        {/* Welcome Section */}
        <section className="text-center space-y-xs">
          <h2 className="text-3xl font-bold text-on-surface font-public-sans">¿Cómo te sientes hoy?</h2>
          <p className="text-on-surface-variant text-base font-manrope">Registra tu estado actual para el seguimiento de salud bio-digital.</p>
        </section>

        {/* Mood Grid */}
        <section className="grid grid-cols-5 gap-sm">
          {moods.map((mood) => {
            const isActive = selectedMood === mood.name;
            return (
              <button 
                key={mood.name}
                onClick={() => setSelectedMood(mood.name)}
                className={cn(
                  "p-sm rounded-2xl flex flex-col items-center gap-xs transition-all duration-300 group",
                  isActive ? "glass-surface-active bg-primary/20 scale-105" : "glass-surface hover:bg-on-surface/5"
                )}
              >
                <mood.icon className={cn(
                  "w-8 h-8 transition-colors",
                  isActive ? "text-primary fill-primary/20" : "text-on-surface-variant group-hover:text-primary"
                )} />
                <span className={cn(
                  "text-[10px] font-bold tracking-widest",
                  isActive ? "text-primary" : "text-on-surface-variant"
                )}>{mood.label}</span>
              </button>
            );
          })}
        </section>

        {/* Intensity Selector */}
        <section className="glass-surface rounded-3xl p-lg space-y-md">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold font-public-sans">Intensidad</h3>
            <span className="text-2xl font-bold text-primary font-space-grotesk">{intensity}/10</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={intensity} 
            onChange={(e) => setIntensity(parseInt(e.target.value))}
            className="intensity-slider"
          />
          <div className="flex justify-between text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
            <span>Leve</span>
            <span>Moderado</span>
            <span>Extremo</span>
          </div>
        </section>

        {/* Thoughts Section */}
        <section className="glass-surface rounded-3xl p-lg space-y-md">
          <div className="flex items-center gap-sm">
            <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold font-public-sans">Pensamientos</h3>
          </div>
          <textarea 
            placeholder="¿Hay algo específico que esté influyendo en tu estado?"
            className="w-full bg-on-surface/5 border border-on-surface/10 rounded-2xl p-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[120px] resize-none"
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
          />
        </section>

        {/* Action Button */}
        <Button className="w-full h-16 rounded-2xl bg-primary text-on-primary text-lg font-bold font-public-sans hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20">
          Guardar Registro Salud
        </Button>
      </main>

      {/* Navigation Bar (Mobile) */}
      <nav className="fixed bottom-0 w-full h-20 bg-surface/80 backdrop-blur-xl border-t border-on-surface/10 flex items-center justify-around px-margin z-50 transition-colors duration-300">
        <Link 
          href="/" 
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-primary")}
        >
          <HomeIcon className="w-7 h-7" />
        </Link>
        <Button variant="ghost" size="icon" className="text-on-surface-variant"><ClockIcon className="w-7 h-7" /></Button>
        <Button variant="ghost" size="icon" className="text-on-surface-variant"><ArrowTrendingUpIcon className="w-7 h-7" /></Button>
        <Button variant="ghost" size="icon" className="text-on-surface-variant"><Cog6ToothIcon className="w-7 h-7" /></Button>
      </nav>
    </div>
  );
}