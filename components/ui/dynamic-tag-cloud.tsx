"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tag = {
  id: string;
  label: string;
  icon?: React.ElementType;
  color?: string;
};

type DynamicTagCloudProps = {
  tags: Tag[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

export function DynamicTagCloud({
  tags,
  selectedId,
  onSelect,
  className,
}: DynamicTagCloudProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Generamos un offset determinista basado en el index para evitar saltos en re-renders
  // pero que parezca aleatorio.
  const getOffset = (index: number) => {
    const angle = (index / tags.length) * Math.PI * 2;
    return {
      x: Math.cos(angle) * 10,
      y: Math.sin(angle) * 10,
    };
  };

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4 py-8", className)}>
      {tags.map((tag, index) => {
        const offset = getOffset(index);
        const isHovered = hoveredId === tag.id;
        const isSelected = selectedId === tag.id;
        const Icon = tag.icon;

        return (
          <motion.button
            key={tag.id}
            onClick={() => onSelect?.(tag.id)}
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              x: isHovered ? offset.x * 1.5 : 0,
              y: isHovered ? offset.y * 1.5 : 0,
              opacity: 1,
              scale: isHovered ? 1.1 : (isSelected ? 1.05 : 1),
            }}
            whileHover={{
              scale: 1.15,
              zIndex: 10,
            }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 25,
              delay: index * 0.05,
            }}
            onHoverStart={() => setHoveredId(tag.id)}
            onHoverEnd={() => setHoveredId(null)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-3xl transition-all duration-300 min-w-[100px]",
              isSelected 
                ? "glass-surface-active bg-primary/20 border-primary shadow-lg shadow-primary/10" 
                : "glass-surface hover:bg-on-surface/5 border-on-surface/10"
            )}
          >
            {Icon && (
              <Icon className={cn(
                "w-8 h-8 transition-colors duration-300",
                isSelected ? "text-primary fill-primary/10" : "text-on-surface-variant group-hover:text-primary"
              )} />
            )}
            <span className={cn(
              "text-[10px] font-bold tracking-widest uppercase",
              isSelected ? "text-primary" : "text-on-surface-variant"
            )}>
              {tag.label}
            </span>
            
            {isSelected && (
              <motion.div 
                layoutId="active-pill"
                className="absolute -bottom-1 w-6 h-1 bg-primary rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
