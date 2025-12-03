"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sparkles, ArrowRight, Play, Loader2, Trash2, Zap, CheckCircle2, ChevronDown, Settings2, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { STYLIZATION_GUARDRAILS_STORAGE_KEY } from "@/lib/constants";
import { getShowUrl } from "@/lib/slug";
import { cn } from "@/lib/utils";

type ImageModelId = "gpt-image" | "flux" | "nano-banana-pro";
type VideoModelId = "sora-2" | "sora-2-pro" | "veo-3.1";

const IMAGE_MODEL_OPTIONS: Array<{
  id: ImageModelId;
  label: string;
  description: string;
}> = [
  {
    id: "gpt-image",
    label: "GPT Image 1",
    description: "OpenAI's high quality",
  },
  {
    id: "flux",
    label: "FLUX 1.1 Pro",
    description: "Fast, stylized art",
  },
  {
    id: "nano-banana-pro",
    label: "Nano Banana Pro",
    description: "Google's 2K output",
  },
];

const VIDEO_MODEL_OPTIONS: Array<{
  id: VideoModelId;
  label: string;
  description: string;
}> = [
  {
    id: "sora-2",
    label: "Sora 2",
    description: "Fast, good quality",
  },
  {
    id: "sora-2-pro",
    label: "Sora 2 Pro",
    description: "High quality, slower",
  },
  {
    id: "veo-3.1",
    label: "Veo 3.1",
    description: "Google's video model",
  },
];

type Show = {
  id: string;
  title: string;
  showTitle?: string;
  libraryPosterUrl?: string;
  posterUrl?: string;
  trailerUrl?: string;
  updatedAt: string;
  hasEpisodes?: boolean;
};

export default function LandingPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stylizationGuardrails, setStylizationGuardrails] = useState(false);
  const [imageModel, setImageModel] = useState<ImageModelId>("nano-banana-pro");
  const [videoModel, setVideoModel] = useState<VideoModelId>("veo-3.1");
  const [autopilotMode, setAutopilotMode] = useState(true); // Default ON

  const loadShows = async () => {
    try {
      const response = await fetch("/api/library");
      if (response.ok) {
        const data = await response.json() as { shows: Show[] };
        setShows(data.shows.slice(0, 12)); // Top 12 shows
      }
    } catch (error) {
      console.error("Failed to load shows:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadShows();
  }, []);

  const deleteShow = async (showId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Delete this show from your library?")) return;
    
    try {
      const response = await fetch(`/api/library/${showId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete show");
      await loadShows();
    } catch (error) {
      console.error("Failed to delete show:", error);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STYLIZATION_GUARDRAILS_STORAGE_KEY);
    if (stored !== null) {
      setStylizationGuardrails(stored === "true");
    }
    
    // Load image model preference
    const storedImageModel = window.localStorage.getItem("production-flow.image-model");
    if (storedImageModel) {
      setImageModel(storedImageModel as ImageModelId);
    }
    
    // Load video model preference
    const storedVideoModel = window.localStorage.getItem("production-flow.video-model");
    if (storedVideoModel) {
      setVideoModel(storedVideoModel as VideoModelId);
    }
    
    // Load autopilot preference
    const storedAutopilot = window.localStorage.getItem("production-flow.autopilot-mode");
    if (storedAutopilot !== null) {
      setAutopilotMode(storedAutopilot === "true");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STYLIZATION_GUARDRAILS_STORAGE_KEY,
      stylizationGuardrails ? "true" : "false"
    );
  }, [stylizationGuardrails]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("production-flow.image-model", imageModel);
  }, [imageModel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("production-flow.video-model", videoModel);
  }, [videoModel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("production-flow.autopilot-mode", autopilotMode ? "true" : "false");
  }, [autopilotMode]);

  // Close tapped show when clicking outside - don't interfere with card clicks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't clear if clicking inside a show card
      if (target.closest('[data-show-card]')) {
        return;
      }
      setTappedShow(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleStylizationGuardrails = () => {
    setStylizationGuardrails((prev) => !prev);
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setIsSubmitting(true);
    // Store prompt and redirect to console
    sessionStorage.setItem("production-flow.initial-prompt", input);
    router.push("/console");
  };

  const [videoLightbox, setVideoLightbox] = useState<{ url: string; title: string } | null>(null);
  const [hoveredShow, setHoveredShow] = useState<string | null>(null);
  const [tappedShow, setTappedShow] = useState<string | null>(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height (min 56px for mobile, 80px for desktop, max 200px)
    const minHeight = window.innerWidth >= 640 ? 80 : 56;
    const maxHeight = 200;
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    
    textarea.style.height = `${newHeight}px`;
  }, []);

  // Adjust height when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  return (
    <div className="min-h-screen bg-black text-foreground overflow-x-hidden w-full max-w-full">
      {/* Navigation Header */}
      <Navbar variant="transparent" />
      
      {/* Video Lightbox - Netflix style */}
      {videoLightbox ? (
        <div 
          className="fixed inset-0 z-50 bg-black/98 animate-in fade-in duration-200"
          onClick={() => setVideoLightbox(null)}
        >
          <div className="h-full flex items-center justify-center p-4 sm:p-12">
            <div className="relative w-full max-w-7xl aspect-video" onClick={(e) => e.stopPropagation()}>
              <video
                src={videoLightbox.url}
                controls
                className="w-full h-full rounded-lg shadow-2xl"
              />
              <button
                onClick={() => setVideoLightbox(null)}
                className="absolute -top-12 right-0 text-white hover:text-primary transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[55vh] flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 pt-24 sm:pt-28 pb-6">
        {/* Epic Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black to-black" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[80vw] max-w-[800px] h-[50vw] max-h-[400px] bg-primary/8 rounded-full blur-[120px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto space-y-5 sm:space-y-6">
          {/* Title */}
          <div className="text-center space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-[0.95] tracking-tight text-shadow-hero">
              <span className="block text-gradient-subtle">Your Next Hit</span>
              <span className="block text-gradient-primary">
                Starts Here
              </span>
            </h1>
            <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto">
              Turn <span className="text-white font-medium">one sentence</span> into a complete show bible
            </p>
          </div>

          {/* Input */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="relative group">
              {/* Animated glow - appears when typing */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary via-primary/60 to-primary/40 rounded-xl blur-xl transition-opacity duration-700 ${
                input.trim() ? 'opacity-25' : 'opacity-0'
              }`} />
              
              {/* Subtle border animation when typing */}
              <div className={`absolute -inset-px bg-gradient-to-r from-primary/50 via-primary/30 to-transparent rounded-xl transition-opacity duration-500 ${
                input.trim() ? 'opacity-100' : 'opacity-0'
              }`} />
              
              {/* Focus glow */}
              <div className="absolute -inset-0.5 bg-primary/15 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Submit on Enter (without shift) or Cmd/Ctrl+Enter
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmit();
                  }
                }}
                placeholder="A robot family navigating suburban life..."
                disabled={isSubmitting}
                rows={1}
                className="relative w-full min-h-[48px] sm:min-h-[64px] max-h-[160px] bg-zinc-900/50 border border-white/20 focus:border-primary/40 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-xl text-white placeholder:text-white/25 focus:outline-none focus:bg-zinc-900/70 transition-all duration-300 backdrop-blur-2xl font-light resize-none overflow-y-auto leading-relaxed"
                style={{ height: 'auto' }}
              />
            </div>

            {/* Collapsible Settings Panel */}
            <div className="rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm overflow-hidden">
              {/* Settings Header - Always Visible */}
              <button
                type="button"
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5 text-white/50" />
                  <span className="text-xs font-medium text-white/80">Settings</span>
                </div>
                
                {/* Compact Summary when collapsed */}
                <div className="flex items-center gap-2">
                  {!settingsExpanded && (
                    <div className="flex items-center gap-1 text-[10px] text-white/50">
                      <span className="px-1.5 py-0.5 rounded bg-white/10">
                        {IMAGE_MODEL_OPTIONS.find(m => m.id === imageModel)?.label}
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/10">
                        {VIDEO_MODEL_OPTIONS.find(m => m.id === videoModel)?.label}
                      </span>
                      {autopilotMode && (
                        <>
                          <span className="text-white/30">•</span>
                          <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                            <Zap className="h-2.5 w-2.5 inline" />
                          </span>
                        </>
                      )}
                  </div>
                  )}
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 text-white/40 transition-transform duration-200",
                    settingsExpanded && "rotate-180"
                  )} />
                </div>
              </button>

              {/* Expandable Content */}
              <div className={cn(
                "grid transition-all duration-300 ease-out",
                settingsExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}>
                <div className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
                    {/* Quick Toggles */}
                    <div className="flex flex-wrap gap-1.5">
                      {/* Autopilot Toggle */}
                      <button
                        type="button"
                        onClick={() => setAutopilotMode(!autopilotMode)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-all",
                          autopilotMode
                            ? "border-primary/60 bg-primary/15 text-white"
                            : "border-white/20 bg-transparent text-white/60 hover:bg-white/5"
                        )}
                      >
                        <Zap className={cn("h-3 w-3", autopilotMode ? "text-primary" : "text-white/40")} />
                        Autopilot
                        {autopilotMode && <CheckCircle2 className="h-2.5 w-2.5 text-primary" />}
                      </button>

                      {/* Guardrails Toggle */}
                      <button
                        type="button"
                        onClick={toggleStylizationGuardrails}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-all",
                          stylizationGuardrails
                            ? "border-primary/60 bg-primary/15 text-white"
                            : "border-white/20 bg-transparent text-white/60 hover:bg-white/5"
                        )}
                      >
                        <Sparkles className={cn("h-3 w-3", stylizationGuardrails ? "text-primary" : "text-white/40")} />
                        Stylization
                        {stylizationGuardrails && <CheckCircle2 className="h-2.5 w-2.5 text-primary" />}
                      </button>
                    </div>

                    {/* Model Selection - Horizontal Scrollable */}
                    <div className="space-y-2">
                      {/* Image Model */}
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase tracking-wider text-white/40 font-medium">Image Model</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                          {IMAGE_MODEL_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setImageModel(option.id)}
                              className={cn(
                                "flex-shrink-0 px-2.5 py-1.5 rounded-md border text-[11px] transition-all whitespace-nowrap",
                                imageModel === option.id
                                  ? "border-primary bg-primary/15 text-white font-medium"
                                  : "border-white/15 bg-transparent text-white/60 hover:bg-white/5 hover:border-white/25"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Video Model */}
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase tracking-wider text-white/40 font-medium">Video Model</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                          {VIDEO_MODEL_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setVideoModel(option.id)}
                              className={cn(
                                "flex-shrink-0 px-2.5 py-1.5 rounded-md border text-[11px] transition-all whitespace-nowrap",
                                videoModel === option.id
                                  ? "border-primary bg-primary/15 text-white font-medium"
                                  : "border-white/15 bg-transparent text-white/60 hover:bg-white/5 hover:border-white/25"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isSubmitting}
                size="lg"
                className="h-11 sm:h-12 px-6 sm:px-10 rounded-full bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-white font-bold text-sm sm:text-base shadow-[0_0_30px_rgba(229,9,20,0.5)] sm:shadow-[0_0_50px_rgba(229,9,20,0.6)] hover:shadow-[0_0_40px_rgba(229,9,20,0.7)] hover:scale-[1.02] transition-all duration-300 border-0 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Show Bible</span>
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Shows Grid - Netflix Style */}
      {shows.length > 0 ? (
        <section className="relative px-4 sm:px-6 pt-0 pb-12 sm:pb-16 bg-gradient-to-b from-black via-black/98 to-black">
          <div className="max-w-[1800px] mx-auto space-y-4">
            {/* Section Header - Editorial style */}
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-semibold text-white">
                Recent Shows
              </h2>
              <p className="text-xs sm:text-sm text-white/50">
                Explore shows created by the community
              </p>
            </div>

            {/* Shows Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-3">
              {shows.map((show, index) => {
                const posterUrl = show.libraryPosterUrl || show.posterUrl;
                const title = show.showTitle || show.title;
                const hasTrailer = !!show.trailerUrl;
                
                const isHovered = hoveredShow === show.id;
                const isTapped = tappedShow === show.id;
                const showActions = isHovered || isTapped;
                
                return (
                  <div
                    key={show.id}
                    data-show-card
                    role="button"
                    tabIndex={0}
                    className={`group relative overflow-hidden rounded-lg bg-zinc-900 transition-all duration-200 cursor-pointer select-none
                      ${isTapped 
                        ? 'ring-2 ring-primary scale-105 z-10 shadow-xl shadow-primary/30' 
                        : 'hover:ring-2 hover:ring-white/20 hover:scale-105 hover:z-10'
                      }
                      active:scale-100 active:brightness-90
                    `}
                    onMouseEnter={() => setHoveredShow(show.id)}
                    onMouseLeave={() => setHoveredShow(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Don't handle clicks on buttons
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) {
                        return;
                      }
                      
                      // On mobile/touch devices, first tap shows actions, second tap opens show
                      const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
                      if (isTouchDevice) {
                        if (!isTapped) {
                          e.preventDefault();
                          setTappedShow(show.id);
                          return;
                        }
                      }
                      // Go to console page (not show page) - replace /show/ with /console/
                      const url = getShowUrl({ id: show.id, title: show.title }).replace('/show/', '/console/');
                      router.push(url);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const url = getShowUrl({ id: show.id, title: show.title }).replace('/show/', '/console/');
                        router.push(url);
                      }
                    }}
                  >
                    {/* Video or Poster */}
                    <div className="relative aspect-[2/3]">
                      {hasTrailer && show.trailerUrl && isHovered ? (
                        // Show trailer on hover but don't autoplay
                        <video
                          src={show.trailerUrl}
                          playsInline
                          muted
                          controls
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={title}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1536px) 280px, (min-width: 1024px) 240px, (min-width: 768px) 200px, 160px"
                          loading={index < 6 ? "eager" : "lazy"}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                          <span className="text-6xl font-black text-white/5">
                            {title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* Gradient overlay - always visible */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      
                      {/* Mobile tap indicator */}
                      <div className={`absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none transition-opacity duration-150 z-20 ${isTapped ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="flex flex-col items-center gap-2 text-white">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center animate-pulse shadow-lg shadow-primary/40">
                            <Play className="h-5 w-5 ml-0.5" />
                          </div>
                          <span className="text-xs font-medium drop-shadow-lg">Tap again to open</span>
                        </div>
                      </div>
                      
                      {/* Delete button - top right, always visible on tap/hover */}
                      <div className={`absolute top-2 right-2 transition-all duration-200 ${showActions ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:pointer-events-auto'}`}>
                        <Button
                          onClick={(e) => void deleteShow(show.id, e)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 rounded-full bg-black/80 hover:bg-red-500/90 text-white backdrop-blur-md p-0"
                          title="Delete show"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Title - Hidden when actions shown */}
                      <div className={`absolute bottom-0 left-0 right-0 p-3 pb-16 transition-all duration-200 ${showActions ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                        <h3 className="font-bold text-sm text-white line-clamp-2 drop-shadow-lg">
                          {title}
                        </h3>
                      </div>
                      
                      {/* Bottom Actions - Slide up from bottom on hover/tap */}
                      <div className={`absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2 transition-transform duration-200 ${
                        showActions 
                          ? 'translate-y-0' 
                          : 'translate-y-full md:translate-y-full md:group-hover:translate-y-0'
                      }`}>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Go to console page (not show page)
                            const url = getShowUrl({ id: show.id, title: show.title, showTitle: show.showTitle }).replace('/show/', '/console/');
                            router.push(url);
                          }}
                          size="sm"
                          className="flex-1 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-10 shadow-lg"
                        >
                          Open Console
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/episodes/${show.id}`);
                          }}
                          size="sm"
                          variant="outline"
                          className="rounded-lg border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-500/20 text-emerald-400 font-medium text-xs h-10 px-3"
                          title="Episode Studio"
                        >
                          <Clapperboard className="h-4 w-4" />
                        </Button>
                        {hasTrailer && show.trailerUrl ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVideoLightbox({
                                url: show.trailerUrl!,
                                title,
                              });
                            }}
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-white/30 hover:border-white hover:bg-white/10 text-white font-medium text-xs h-10 px-3"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => router.push("/library")}
                variant="outline"
                size="sm"
                className="rounded-full border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300 h-9 px-5 text-xs"
              >
                Browse All Shows
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Footer - Minimal */}
      <footer className="relative px-4 sm:px-6 py-8 border-t border-white/5">
        <div className="max-w-[1800px] mx-auto text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-3 w-3 text-primary/60" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/40">
              Production Flow
            </span>
          </div>
          <p className="text-[10px] text-foreground/30">
            AI-powered show development • Built for creators
          </p>
        </div>
      </footer>

    </div>
  );
}
