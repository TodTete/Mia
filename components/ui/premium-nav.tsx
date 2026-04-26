"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  HeartIcon, 
  UserIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { icon: HomeIcon, href: "/", label: "Inicio" },
  { icon: ChartBarIcon, href: "/vistas/avances", label: "Avances" },
  { icon: HeartIcon, href: "/vistas/registro-salud", label: "Salud" },
  { icon: UserIcon, href: "/vistas/perfil", label: "Perfil" },
];

export function PremiumNav() {
  const pathname = usePathname();

  if (pathname === "/vistas/login") return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-white/5 px-4 h-20 pb-[env(safe-area-inset-bottom,0px)] flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300",
                isActive 
                  ? "text-[#3649cc] dark:text-primary" 
                  : "text-slate-400 dark:text-slate-500"
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0
                }}
                className="flex flex-col items-center gap-1"
              >
                <item.icon className={cn(
                  "w-6 h-6 transition-all duration-300", 
                  isActive ? "stroke-[2.5]" : "stroke-[1.5] opacity-70",
                )} />
                
                <span className={cn(
                  "text-[10px] font-bold transition-all duration-300",
                  isActive ? "opacity-100 scale-100" : "opacity-0 scale-90 h-0 overflow-hidden"
                )}>
                  {item.label}
                </span>
              </motion.div>
              
              {isActive && (
                <motion.div 
                  layoutId="active-nav-bg"
                  className="absolute inset-0 bg-[#3649cc]/5 dark:bg-primary/10 -z-10 rounded-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe Area Spacer for iOS */}
      <div className="bg-white/80 dark:bg-black/80 h-[env(safe-area-inset-bottom,0px)] w-full" />
    </nav>
  );
}
