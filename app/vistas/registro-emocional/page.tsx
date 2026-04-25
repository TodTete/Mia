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
import { TrendingUpIcon } from "@heroicons/react/24/outline";

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

        {/* Mood Cloud */}
        <section>
          <DynamicTagCloud 
            tags={moods.map(m => ({ id: m.name, label: m.label, icon: m.icon }))}
            selectedId={selectedMood}
            onSelect={setSelectedMood}
          />
        </section>

        {/* Intensity Selector */}
        <section className="glass-surface rounded-3xl p-lg space-y-md">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold font-public-sans">Intensidad</h3>
            <span className="text-2xl font-bold text-primary font-space-grotesk">{intensity}/10</span>
          </div>
          <div className="grid md:grid-cols-2 gap-lg items-center">
            <div className="space-y-md">
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
            </div>

            {/* Radial Chart Visualization */}
            <div className="flex flex-col items-center justify-center">
              <ChartContainer 
                config={{
                  intensity: {
                    label: "Intensidad",
                    color: "hsl(var(--primary))",
                  },
                }} 
                className="mx-auto aspect-square max-h-[180px] w-full"
              >
                <RadialBarChart 
                  data={[{ value: intensity, fill: "var(--color-primary)" }]} 
                  startAngle={90} 
                  endAngle={450} 
                  innerRadius={60} 
                  outerRadius={80}
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
                    cornerRadius={10}
                  />
                  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-on-surface text-2xl font-bold font-space-grotesk">
                                {intensity}/10
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-on-surface-variant uppercase text-[8px] font-bold tracking-widest">
                                Intensidad
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