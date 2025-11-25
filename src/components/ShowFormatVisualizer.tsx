"use client";

import { useState } from "react";
import { ChevronRight, Clock, Sparkles, RotateCcw, Zap, Film, Target, Flame, Trophy, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ShowFormat = {
  structure: {
    cold_open: {
      duration_minutes: string;
      purpose: string;
      signature_elements: string[];
      tone: string;
    };
    act_1: {
      duration_minutes: string;
      purpose: string;
      typical_beats: string[];
      ends_with: string;
    };
    act_2: {
      duration_minutes: string;
      purpose: string;
      typical_beats: string[];
      ends_with: string;
    };
    act_3: {
      duration_minutes: string;
      purpose: string;
      typical_beats: string[];
      ends_with: string;
    };
    act_4: {
      duration_minutes: string;
      purpose: string;
      typical_beats: string[];
      ends_with: string;
    };
    tag: {
      duration_minutes: string;
      purpose: string;
      types: string[];
    };
  };
  recurring_elements: {
    signature_scenes: Array<{
      name: string;
      description: string;
      typical_placement: string;
    }>;
    running_threads: string[];
    character_moments: string[];
    visual_motifs: string[];
  };
  plot_guidelines: {
    a_plot_focus: string;
    b_plot_focus: string;
    c_plot_focus: string;
    serialized_elements: string[];
  };
  tone_bible: {
    overall_tone: string;
    humor_style: string;
    emotional_core: string;
    tension_style: string;
  };
  episode_types: Array<{
    type: string;
    frequency: string;
    description: string;
  }>;
};

type Props = {
  format: ShowFormat | null;
  showTitle: string;
  isLoading?: boolean;
  onRegenerate?: () => void;
  onEdit?: (format: ShowFormat) => void;
};

const ACT_CONFIG = {
  cold_open: { 
    label: "TEASER", 
    subtitle: "Hook the Audience",
    icon: Zap,
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400"
  },
  act_1: { 
    label: "ACT ONE", 
    subtitle: "Setup & Stakes",
    icon: Film,
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400"
  },
  act_2: { 
    label: "ACT TWO", 
    subtitle: "Complications",
    icon: Target,
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400"
  },
  act_3: { 
    label: "ACT THREE", 
    subtitle: "Crisis Point",
    icon: Flame,
    gradient: "from-rose-500 to-pink-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-400"
  },
  act_4: { 
    label: "ACT FOUR", 
    subtitle: "Resolution",
    icon: Trophy,
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-400"
  },
  tag: { 
    label: "TAG", 
    subtitle: "Final Beat",
    icon: Coffee,
    gradient: "from-slate-500 to-zinc-500",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    text: "text-slate-400"
  },
};

export function ShowFormatVisualizer({ format, showTitle, isLoading, onRegenerate }: Props) {
  const [selectedAct, setSelectedAct] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"structure" | "elements" | "tone">("structure");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Episode Formula</h3>
            <p className="text-xs text-foreground/50">Teaser + 4 Acts + Tag</p>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-8 sm:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
          <div className="relative flex flex-col items-center justify-center gap-4">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-violet-500/20 border-b-violet-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground/80">Designing Episode Formula</p>
              <p className="text-sm text-foreground/50 mt-1">Creating the DNA for &quot;{showTitle}&quot;</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!format) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Episode Formula</h3>
            <p className="text-xs text-foreground/50">Teaser + 4 Acts + Tag</p>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/20 bg-black/30 p-8 sm:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 opacity-50" />
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <Film className="h-8 w-8 text-foreground/30" />
            </div>
            <h4 className="text-lg font-semibold mb-2">No Episode Format Yet</h4>
            <p className="text-sm text-foreground/50 max-w-sm mx-auto mb-6">
              Generate the structural DNA that makes every episode feel consistent while allowing creative freedom.
            </p>
            {onRegenerate && (
              <Button onClick={onRegenerate} size="lg" className="rounded-full px-6">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Format
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const acts = ["cold_open", "act_1", "act_2", "act_3", "act_4", "tag"] as const;
  const selectedActData = selectedAct ? format.structure[selectedAct as keyof typeof format.structure] : null;
  const selectedActConfig = selectedAct ? ACT_CONFIG[selectedAct as keyof typeof ACT_CONFIG] : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Episode Formula</h3>
          <p className="text-xs text-foreground/50">Teaser + 4 Acts + Tag Structure</p>
        </div>
        {onRegenerate && (
          <Button variant="ghost" size="sm" onClick={onRegenerate} className="rounded-full h-8 px-3 text-xs">
            <RotateCcw className="h-3 w-3 mr-1.5" />
            Regenerate
          </Button>
        )}
      </div>

      {/* Main Container */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
        
        {/* Section Tabs */}
        <div className="relative border-b border-white/10 p-2">
          <div className="flex gap-1">
            {[
              { id: "structure", label: "Structure" },
              { id: "elements", label: "Recurring" },
              { id: "tone", label: "Tone" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as typeof activeSection)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-medium transition-all",
                  activeSection === tab.id
                    ? "bg-white/10 text-foreground"
                    : "text-foreground/50 hover:text-foreground/70 hover:bg-white/5"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative p-4 sm:p-6">
          {/* Structure Tab */}
          {activeSection === "structure" && (
            <div className="space-y-4">
              {/* Act Timeline - Horizontal scroll on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                {acts.map((actKey) => {
                  const config = ACT_CONFIG[actKey];
                  const act = format.structure[actKey];
                  const isSelected = selectedAct === actKey;
                  const Icon = config.icon;
                  
                  return (
                    <button
                      key={actKey}
                      onClick={() => setSelectedAct(isSelected ? null : actKey)}
                      className={cn(
                        "flex-shrink-0 group relative rounded-xl border p-3 sm:p-4 transition-all duration-200",
                        "min-w-[100px] sm:min-w-[120px] sm:flex-1",
                        isSelected
                          ? `${config.bg} ${config.border} ring-1 ring-white/20`
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          isSelected ? `bg-gradient-to-br ${config.gradient}` : "bg-white/10"
                        )}>
                          <Icon className={cn("h-5 w-5", isSelected ? "text-white" : "text-foreground/60")} />
                        </div>
                        <div className="text-center">
                          <p className={cn(
                            "text-[10px] font-bold tracking-wider",
                            isSelected ? config.text : "text-foreground/70"
                          )}>
                            {config.label}
                          </p>
                          <p className="text-[9px] text-foreground/40 mt-0.5 hidden sm:block">
                            {config.subtitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-foreground/40">
                          <Clock className="h-2.5 w-2.5" />
                          <span className="text-[10px]">{act.duration_minutes}m</span>
                        </div>
                      </div>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className={cn("absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r", config.gradient)} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Act Details */}
              {selectedAct && selectedActData && selectedActConfig && (
                <div className={cn(
                  "rounded-xl border p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-200",
                  selectedActConfig.bg,
                  selectedActConfig.border
                )}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br", selectedActConfig.gradient)}>
                      <selectedActConfig.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn("font-semibold", selectedActConfig.text)}>{selectedActConfig.label}</h4>
                      <p className="text-sm text-foreground/60 mt-0.5">{selectedActData.purpose}</p>
                    </div>
                    <button
                      onClick={() => setSelectedAct(null)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/40 hover:text-foreground/60 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 rotate-90" />
                    </button>
                  </div>
                  
                  {/* Act-specific content */}
                  {selectedAct !== "tag" && selectedAct !== "cold_open" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-medium mb-2">Typical Beats</p>
                        <div className="space-y-1.5">
                          {((selectedActData as { typical_beats?: string[] }).typical_beats || []).map((beat, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                              <span className={cn("w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0", selectedActConfig.bg, selectedActConfig.text)}>
                                {i + 1}
                              </span>
                              <span>{beat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-medium mb-1">Act Break</p>
                        <p className="text-sm text-foreground/60 italic">
                          &quot;{(selectedActData as { ends_with?: string }).ends_with}&quot;
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedAct === "cold_open" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-medium mb-2">Signature Elements</p>
                        <div className="flex flex-wrap gap-2">
                          {(format.structure.cold_open.signature_elements || []).map((el, i) => (
                            <span key={i} className={cn("px-2.5 py-1 rounded-full text-xs", selectedActConfig.bg, selectedActConfig.border, "border")}>
                              {el}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-medium mb-1">Tone</p>
                        <p className="text-sm text-foreground/60">{format.structure.cold_open.tone}</p>
                      </div>
                    </div>
                  )}

                  {selectedAct === "tag" && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-medium mb-2">Tag Types</p>
                      <div className="flex flex-wrap gap-2">
                        {(format.structure.tag.types || []).map((type, i) => (
                          <span key={i} className={cn("px-2.5 py-1 rounded-full text-xs", selectedActConfig.bg, selectedActConfig.border, "border")}>
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Prompt to select */}
              {!selectedAct && (
                <div className="text-center py-4 text-sm text-foreground/40">
                  Tap an act above to see details
                </div>
              )}
            </div>
          )}

          {/* Recurring Elements Tab */}
          {activeSection === "elements" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Signature Scenes */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-3 flex items-center gap-2">
                  <Film className="h-3.5 w-3.5" />
                  Signature Scenes
                </h5>
                <div className="space-y-3">
                  {format.recurring_elements.signature_scenes.map((scene, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium text-foreground/80">{scene.name}</p>
                      <p className="text-xs text-foreground/50 mt-0.5">{scene.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plot Structure */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80 mb-3 flex items-center gap-2">
                  <Target className="h-3.5 w-3.5" />
                  Plot Structure
                </h5>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">A</span>
                    <p className="text-xs text-foreground/60 flex-1">{format.plot_guidelines.a_plot_focus}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">B</span>
                    <p className="text-xs text-foreground/60 flex-1">{format.plot_guidelines.b_plot_focus}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">C</span>
                    <p className="text-xs text-foreground/60 flex-1">{format.plot_guidelines.c_plot_focus}</p>
                  </div>
                </div>
              </div>

              {/* Visual Motifs */}
              {format.recurring_elements.visual_motifs?.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-violet-400/80 mb-3">Visual Motifs</h5>
                  <div className="flex flex-wrap gap-2">
                    {format.recurring_elements.visual_motifs.map((motif, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300">
                        {motif}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tone Tab */}
          {activeSection === "tone" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-medium mb-1">Overall Tone</p>
                  <p className="text-sm text-foreground/80">{format.tone_bible.overall_tone}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-medium mb-1">Emotional Core</p>
                  <p className="text-sm text-foreground/80">{format.tone_bible.emotional_core}</p>
                </div>
                {format.tone_bible.humor_style && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-medium mb-1">Humor Style</p>
                    <p className="text-sm text-foreground/80">{format.tone_bible.humor_style}</p>
                  </div>
                )}
                {format.tone_bible.tension_style && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-medium mb-1">Tension Style</p>
                    <p className="text-sm text-foreground/80">{format.tone_bible.tension_style}</p>
                  </div>
                )}
              </div>

              {/* Episode Types */}
              {format.episode_types?.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-3">Episode Types</h5>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {format.episode_types.map((epType, i) => (
                      <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground/80">{epType.type}</span>
                          <span className="text-[10px] text-foreground/40 uppercase">{epType.frequency}</span>
                        </div>
                        <p className="text-xs text-foreground/50">{epType.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
