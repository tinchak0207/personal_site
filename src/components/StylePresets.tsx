"use client";

import { Camera, Sparkles, Zap, Package, Layout, Droplets } from "lucide-react";
import { STYLE_PRESETS, type StylePreset } from "@/lib/prompt-enhancer";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Camera, Sparkles, Zap, Package, Layout, Droplets,
};

interface StylePresetsProps {
  value: StylePreset;
  onChange: (preset: StylePreset) => void;
  /** When true, renders chips only (no wrapper div) — for inline use */
  inline?: boolean;
  className?: string;
}

export function StylePresets({ value, onChange, inline, className }: StylePresetsProps) {
  const chips = STYLE_PRESETS.map((preset) => {
    const Icon = ICON_MAP[preset.icon] ?? Camera;
    const isActive = value === preset.key;
    return (
      <button
        key={preset.key}
        type="button"
        onClick={() => onChange(isActive ? "none" : preset.key)}
        className={cn("style-chip", isActive && "active")}
        aria-pressed={isActive}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {preset.label}
      </button>
    );
  });

  if (inline) {
    // Render chips as a fragment — parent controls layout
    return <>{chips}</>;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips}
    </div>
  );
}
