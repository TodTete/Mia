"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeftIcon,
  HomeIcon,
  FaceSmileIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
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
import { DynamicTagCloud } from "@/components/ui/dynamic-tag-cloud";
import { 
  Label, 
  PolarGrid, 
  PolarRadiusAxis,
  PolarAngleAxis,
  RadialBar, 
  RadialBarChart 
} from "recharts";
import { 
  ChartContainer, 
  type ChartConfig 
} from "@/components/ui/chart";


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

      <main className="pt-36 px-margin max-w-3xl mx-auto space-y-16 pb-12">
        {/* Welcome Section */}
        <section className="text-center space-y-4">
          <h2 className="text-4xl font-extrabold text-on-surface font-public-sans tracking-tight">¿Cómo te sientes hoy?</h2>
          <p className="text-on-surface-variant text-lg font-manrope max-w-lg mx-auto">Registra tu estado actual para el seguimiento de salud bio-digital.</p>
        </section>

        {/* Mood Cloud */}
        <section className="py-4">
          <DynamicTagCloud 
            tags={moods.map(m => ({ id: m.name, label: m.label, icon: m.icon }))}
            selectedId={selectedMood}
            onSelect={setSelectedMood}
          />
        </section>

        {/* Intensity Selector */}
        <section className="glass-surface rounded-[2.5rem] p-10 space-y-10 shadow-2xl shadow-primary/5">
          <div className="flex justify-between items-center border-b border-on-surface/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <AdjustmentsHorizontalIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-public-sans">Intensidad del Sentimiento</h3>
            </div>
            <span className="text-3xl font-black text-primary font-space-grotesk tracking-tighter">{intensity}/10</span>
          </div>
          
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3 space-y-8">
              <div className="space-y-6">
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={intensity} 
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="intensity-slider"
                />
                <div className="flex justify-between text-[11px] font-black tracking-[0.2em] text-on-surface-variant uppercase px-2 opacity-70">
                  <span>Leve</span>
                  <span className="text-primary/60">Moderado</span>
                  <span>Extremo</span>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant/80 font-manrope leading-relaxed">
                Ajusta el control para reflejar qué tan fuerte es la emoción que experimentas en este momento.
              </p>
            </div>

            {/* Radial Chart Visualization */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-4 bg-on-surface/[0.02] rounded-[2rem] border border-on-surface/5">
              <ChartContainer 
                config={{
                  intensity: {
                    label: "Intensidad",
                    color: "hsl(var(--primary))",
                  },
                }} 
                className="mx-auto h-[240px] w-[240px]"
              >
                <RadialBarChart 
                  data={[{ value: intensity, fill: "var(--color-primary)" }]} 
                  startAngle={90} 
                  endAngle={450} 
                  innerRadius={85} 
                  outerRadius={110}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 10]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar 
                    dataKey="value" 
                    background 
                    cornerRadius={15}
                  />
                  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 5} className="fill-on-surface text-5xl font-black font-space-grotesk tracking-tighter">
                                {intensity}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 30} className="fill-on-surface-variant uppercase text-[10px] font-black tracking-[0.3em]">
                                NIVEL
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
            </div>
          </div>
        </section>

        {/* Thoughts Section */}
        <section className="glass-surface rounded-[2.5rem] p-10 space-y-6 shadow-2xl shadow-primary/5">
          <div className="flex items-center gap-sm">
            <div className="p-2 rounded-xl bg-primary/10">
              <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-public-sans">Notas y Contexto</h3>
          </div>
          <textarea 
            placeholder="¿Hay algo específico que esté influyendo en tu estado? (Opcional)"
            className="w-full bg-on-surface/5 border border-on-surface/10 rounded-3xl p-6 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[160px] resize-none text-lg font-manrope"
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
          />
        </section>

        {/* Action Button */}
        <div className="pt-4">
          <Button className="w-full h-20 rounded-[2rem] bg-primary text-on-primary text-xl font-black font-public-sans hover:scale-[1.01] active:scale-[0.99] transition-all shadow-2xl shadow-primary/40 tracking-tight">
            Confirmar Registro Diario
          </Button>
          <p className="text-center text-on-surface-variant/50 text-xs mt-6 font-manrope">
            Tus datos están encriptados y solo son accesibles para tu IA de salud personalizada.
          </p>
        </div>
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