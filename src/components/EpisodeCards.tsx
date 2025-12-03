"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, RotateCcw, Sparkles, Play, Users, Clapperboard, Zap, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Episode = {
  episode_number: number;
  title: string;
  logline: string;
  cold_open_hook: string;
  a_plot: string;
  b_plot: string;
  act_3_crisis?: string;
  featured_characters: string[];
  themes: string[];
  episode_type: string;
  cliffhanger_or_button: string;
  tag_scene?: string;
};

type Props = {
  episodes: Episode[];
  seasonArc?: string;
  characterSeeds?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
  onRegenerate?: () => void;
  onEditEpisode?: (episode: Episode, index: number) => void;
  showId?: string; // For linking to Episode Studio
};

const EPISODE_TYPE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  pilot: { bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-400" },
  "case-of-week": { bg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-400" },
  "character-focus": { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-400" },
  mythology: { bg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-400" },
  "bottle-episode": { bg: "bg-rose-500/15", border: "border-rose-500/30", text: "text-rose-400" },
  finale: { bg: "bg-primary/15", border: "border-primary/30", text: "text-primary" },
  default: { bg: "bg-white/10", border: "border-white/20", text: "text-foreground/70" },
};

export function EpisodeCards({ 
  episodes, 
  seasonArc, 
  characterSeeds,
  isLoading, 
  onRegenerate,
  showId,
}: Props) {
  const [selectedEpisode, setSelectedEpisode] = useState<number>(0);

  const getCharacterName = (charId: string) => {
    const char = characterSeeds?.find(c => c.id === charId);
    return char?.name || charId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getEpisodeTypeStyle = (type: string) => {
    const normalizedType = type.toLowerCase().replace(/\s+/g, "-");
    return EPISODE_TYPE_STYLES[normalizedType] || EPISODE_TYPE_STYLES.default;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Season One</h3>
            <p className="text-xs text-foreground/50">Episode Loglines</p>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-8 sm:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-primary/5" />
          <div className="relative flex flex-col items-center justify-center gap-4">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-primary/20 border-b-primary animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <Clapperboard className="absolute inset-0 m-auto h-6 w-6 text-emerald-400 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground/80">Writing Episode Loglines</p>
              <p className="text-sm text-foreground/50 mt-1">Crafting 6 compelling stories</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Season One</h3>
            <p className="text-xs text-foreground/50">Episode Loglines</p>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/20 bg-black/30 p-8 sm:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-primary/5 opacity-50" />
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <BookOpen className="h-8 w-8 text-foreground/30" />
            </div>
            <h4 className="text-lg font-semibold mb-2">No Episodes Yet</h4>
            <p className="text-sm text-foreground/50 max-w-sm mx-auto mb-6">
              Generate your episode format first, then create loglines for your first season.
            </p>
            {onRegenerate && (
              <Button onClick={onRegenerate} size="lg" className="rounded-full px-6">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Episodes
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentEpisode = episodes[selectedEpisode];
  const typeStyle = currentEpisode ? getEpisodeTypeStyle(currentEpisode.episode_type) : EPISODE_TYPE_STYLES.default;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Season One</h3>
          <p className="text-xs text-foreground/50">{episodes.length} Episodes</p>
        </div>
        <div className="flex items-center gap-2">
          {showId && (
            <Link href={`/episodes/${showId}`}>
              <Button variant="outline" size="sm" className="rounded-full h-8 px-3 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50">
                <Clapperboard className="h-3 w-3 mr-1.5" />
                Episode Studio
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          )}
          {onRegenerate && (
            <Button variant="ghost" size="sm" onClick={onRegenerate} className="rounded-full h-8 px-3 text-xs">
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      {/* Season Arc */}
      {seasonArc && (
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-primary/10 via-transparent to-emerald-500/10 p-4">
          <p className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold mb-1.5">Season Arc</p>
          <p className="text-sm text-foreground/70 leading-relaxed">{seasonArc}</p>
        </div>
      )}

      {/* Main Container */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-primary/5" />
        
        <div className="relative">
          {/* Episode Selector - Horizontal Pills */}
          <div className="border-b border-white/10 p-3 sm:p-4">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
              {episodes.map((ep, index) => {
                const isSelected = selectedEpisode === index;
                const isPilot = ep.episode_number === 1;
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedEpisode(index)}
                    className={cn(
                      "flex-shrink-0 relative rounded-xl border px-4 py-2.5 transition-all duration-200",
                      "min-w-[80px] sm:min-w-[100px]",
                      isSelected
                        ? "bg-white/10 border-white/20 ring-1 ring-white/10"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/15"
                    )}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      {isPilot ? (
                        <span className={cn(
                          "text-[10px] font-bold tracking-wider",
                          isSelected ? "text-amber-400" : "text-foreground/50"
                        )}>
                          PILOT
                        </span>
                      ) : (
                        <>
                          <span className={cn(
                            "text-[9px] uppercase tracking-wider",
                            isSelected ? "text-foreground/60" : "text-foreground/40"
                          )}>
                            Episode
                          </span>
                          <span className={cn(
                            "text-lg font-bold leading-none",
                            isSelected ? "text-foreground" : "text-foreground/60"
                          )}>
                            {ep.episode_number}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Episode Content */}
          {currentEpisode && (
            <div className="relative p-4 sm:p-6 animate-in fade-in duration-200">
              {/* Episode Header */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-3 sm:hidden">
                  <span className="text-xs font-bold text-foreground/40">
                    S01E{String(currentEpisode.episode_number).padStart(2, "0")}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", typeStyle.bg, typeStyle.border, typeStyle.text)}>
                    {currentEpisode.episode_type}
                  </span>
                </div>
                
                <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex-shrink-0">
                  <div className="text-center">
                    <span className="text-[10px] text-foreground/40 block">S01</span>
                    <span className="text-lg font-bold text-foreground/80">E{currentEpisode.episode_number}</span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="hidden sm:flex items-center gap-2 mb-1">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", typeStyle.bg, typeStyle.border, typeStyle.text)}>
                      {currentEpisode.episode_type}
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-semibold text-foreground/90 leading-tight">
                    &quot;{currentEpisode.title}&quot;
                  </h4>
                </div>
              </div>

              {/* Logline */}
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed mb-5">
                {currentEpisode.logline}
              </p>

              {/* Cold Open */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 sm:p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400/80">Cold Open</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/60">{currentEpisode.cold_open_hook}</p>
              </div>

              {/* Plots Grid */}
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">A</span>
                    <span className="text-[10px] uppercase tracking-wider font-medium text-foreground/40">Main Plot</span>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/60">{currentEpisode.a_plot}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">B</span>
                    <span className="text-[10px] uppercase tracking-wider font-medium text-foreground/40">Subplot</span>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/60">{currentEpisode.b_plot}</p>
                </div>
              </div>

              {/* Featured Characters */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <div className="flex items-center gap-1.5 text-foreground/40">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-medium">Featuring</span>
                </div>
                {currentEpisode.featured_characters.map((charId, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-[11px] bg-white/10 border border-white/10 text-foreground/60">
                    {getCharacterName(charId)}
                  </span>
                ))}
              </div>

              {/* Themes */}
              {currentEpisode.themes?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="text-[10px] uppercase tracking-wider font-medium text-foreground/40">Themes</span>
                  {currentEpisode.themes.map((theme, i) => (
                    <span key={i} className="text-xs text-foreground/50">
                      {theme}{i < currentEpisode.themes.length - 1 ? " •" : ""}
                    </span>
                  ))}
                </div>
              )}

              {/* Episode Ending */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <Play className="h-3 w-3 text-foreground/40" />
                  <span className="text-[10px] uppercase tracking-wider font-medium text-foreground/40">Episode Ends</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/50 italic">&quot;{currentEpisode.cliffhanger_or_button}&quot;</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Episode Quick Nav - Mobile friendly grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {episodes.map((ep, index) => {
          const isSelected = selectedEpisode === index;
          const style = getEpisodeTypeStyle(ep.episode_type);
          
          return (
            <button
              key={index}
              onClick={() => setSelectedEpisode(index)}
              className={cn(
                "rounded-lg border p-2 sm:p-3 transition-all text-left",
                isSelected
                  ? `${style.bg} ${style.border}`
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={cn("text-[10px] font-bold", isSelected ? style.text : "text-foreground/50")}>
                  E{ep.episode_number}
                </span>
                {ep.episode_number === 1 && (
                  <span className="text-[8px] px-1 rounded bg-amber-500/20 text-amber-400">PILOT</span>
                )}
              </div>
              <p className={cn(
                "text-[10px] sm:text-xs line-clamp-2 leading-tight",
                isSelected ? "text-foreground/70" : "text-foreground/40"
              )}>
                {ep.title}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
