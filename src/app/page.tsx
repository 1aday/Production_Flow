"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sparkles, ArrowRight, Play, Loader2, Trash2, Zap, CheckCircle2, ChevronDown, Settings2, Clapperboard, Maximize2, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { STYLIZATION_GUARDRAILS_STORAGE_KEY } from "@/lib/constants";
import { getShowUrl } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { getPosterDisplayUrl } from "@/lib/image-utils";

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
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isFullscreenEdit, setIsFullscreenEdit] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fullscreenTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height - generous limits for long content
    // Mobile: min 60px, max 280px | Desktop: min 72px, max 400px
    const isMobile = window.innerWidth < 640;
    const minHeight = isMobile ? 60 : 72;
    const maxHeight = isMobile ? 280 : 400;
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    
    textarea.style.height = `${newHeight}px`;
    
    // Check if content is scrollable
    setIsScrollable(textarea.scrollHeight > maxHeight);
  }, []);

  // Handle scroll position tracking
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const isAtBottom = textarea.scrollHeight - textarea.scrollTop - textarea.clientHeight < 20;
    setIsScrolledToBottom(isAtBottom);
  }, []);

  // Adjust height when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Focus fullscreen textarea when opened
  useEffect(() => {
    if (isFullscreenEdit && fullscreenTextareaRef.current) {
      fullscreenTextareaRef.current.focus();
      // Move cursor to end
      fullscreenTextareaRef.current.selectionStart = fullscreenTextareaRef.current.value.length;
    }
  }, [isFullscreenEdit]);

  // Character count for UI feedback
  const charCount = input.length;
  const hasContent = charCount > 0;
  const isLongContent = charCount > 500;

  return (
    <div className="min-h-screen bg-black text-foreground overflow-x-hidden w-full max-w-full">
      {/* Navigation Header */}
      <Navbar variant="transparent" />
      
      {/* Fullscreen Edit Modal - for long content on mobile */}
      {isFullscreenEdit && (
        <div className="fixed inset-0 z-50 bg-black animate-in fade-in duration-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/80 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-white/80">Edit Prompt</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/40 tabular-nums">
                {charCount.toLocaleString()}
              </span>
              <button
                onClick={() => setIsFullscreenEdit(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>
          </div>
          
          {/* Textarea - Full height */}
          <div className="flex-1 overflow-hidden">
            <textarea
              ref={fullscreenTextareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What's your show about? Paste your script, story outline, or idea..."
              className={cn(
                "w-full h-full bg-black resize-none",
                "px-4 py-4",
                "text-[15px] text-white/95 placeholder:text-white/30",
                "leading-[1.8] tracking-[0.01em]",
                "focus:outline-none",
                "scrollbar-thin"
              )}
            />
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/10 bg-zinc-900/80 backdrop-blur-xl">
            <button
              onClick={() => setIsFullscreenEdit(false)}
              className="text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={() => {
                setIsFullscreenEdit(false);
                void handleSubmit();
              }}
              disabled={!input.trim() || isSubmitting}
              className={cn(
                "h-10 px-6 rounded-full font-semibold text-sm",
                "bg-primary hover:bg-primary/90 text-white",
                "shadow-[0_0_20px_rgba(229,9,20,0.4)]",
                "disabled:shadow-none disabled:opacity-40"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Generate Show
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

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

          {/* Input Card */}
          <div className="max-w-3xl mx-auto">
            <div className={cn(
              "relative rounded-2xl transition-all duration-300",
              "bg-zinc-900/70 backdrop-blur-xl",
              "border border-white/10",
              isFocused && "border-white/20 shadow-[0_0_40px_rgba(229,9,20,0.15)]",
              hasContent && "shadow-lg"
            )}>
              {/* Subtle glow effect when focused */}
              <div className={cn(
                "absolute -inset-px rounded-2xl transition-opacity duration-500 pointer-events-none",
                "bg-gradient-to-b from-white/[0.08] to-transparent",
                isFocused ? "opacity-100" : "opacity-0"
              )} />

              {/* Main Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onScroll={handleScroll}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSubmit();
                    }
                  }}
                  placeholder="What's your show about?"
                  disabled={isSubmitting}
                  rows={1}
                  className={cn(
                    "w-full bg-transparent resize-none",
                    "px-5 sm:px-6 pt-5 sm:pt-6",
                    "pb-3 sm:pb-4",
                    "text-[15px] sm:text-[17px] text-white/95 placeholder:text-white/35",
                    "leading-[1.8] tracking-[0.01em]",
                    "focus:outline-none",
                    // Custom scrollbar
                    "scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                  )}
                  style={{ height: 'auto' }}
                />
                
                {/* Scroll fade indicator - shows when content is scrollable and not at bottom */}
                {isScrollable && !isScrolledToBottom && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-900/90 to-transparent pointer-events-none rounded-b-2xl" />
                )}
                
                {/* Expand button for mobile - shows when content is long */}
                {isLongContent && (
                  <button
                    type="button"
                    onClick={() => setIsFullscreenEdit(true)}
                    className={cn(
                      "absolute top-3 right-3 sm:hidden",
                      "h-8 px-2.5 rounded-lg",
                      "bg-white/10 hover:bg-white/20 backdrop-blur-sm",
                      "flex items-center gap-1.5",
                      "text-[10px] font-medium text-white/60 hover:text-white/80",
                      "transition-all duration-200",
                      "border border-white/10"
                    )}
                  >
                    <Maximize2 className="h-3 w-3" />
                    <span>Expand</span>
                  </button>
                )}
              </div>

              {/* Bottom Toolbar */}
              <div className="relative flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-white/[0.06]">
                {/* Left: Settings & Options */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Autopilot Chip */}
                  <button
                    type="button"
                    onClick={() => setAutopilotMode(!autopilotMode)}
                    className={cn(
                      "flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium transition-all",
                      autopilotMode
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                    )}
                  >
                    <Zap className="h-3 w-3" />
                    <span className="hidden sm:inline">Autopilot</span>
                  </button>

                  {/* Settings Dropdown Trigger */}
                  <button
                    type="button"
                    onClick={() => setSettingsExpanded(!settingsExpanded)}
                    className={cn(
                      "flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium transition-all",
                      "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70",
                      settingsExpanded && "bg-white/10 text-white/70"
                    )}
                  >
                    <Settings2 className="h-3 w-3" />
                    <span className="hidden sm:inline">Options</span>
                    <ChevronDown className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      settingsExpanded && "rotate-180"
                    )} />
                  </button>

                  {/* Content stats - appears for longer content */}
                  {isLongContent && (
                    <button
                      type="button"
                      onClick={() => setIsFullscreenEdit(true)}
                      className={cn(
                        "flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[10px] font-medium transition-all",
                        "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60"
                      )}
                    >
                      <span className={cn(
                        "font-mono tabular-nums",
                        charCount > 5000 ? "text-amber-400/60" : ""
                      )}>
                        {charCount.toLocaleString()}
                      </span>
                      <Maximize2 className="h-3 w-3 opacity-50" />
                    </button>
                  )}
                </div>

                {/* Right: Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isSubmitting}
                  size="sm"
                  className={cn(
                    "h-8 sm:h-9 px-4 sm:px-5 rounded-full font-semibold text-xs sm:text-sm",
                    "bg-primary hover:bg-primary/90 text-white",
                    "shadow-[0_0_20px_rgba(229,9,20,0.4)] hover:shadow-[0_0_25px_rgba(229,9,20,0.5)]",
                    "disabled:shadow-none disabled:opacity-40",
                    "transition-all duration-200"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Generate</span>
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>

              {/* Expandable Settings Panel */}
              <div className={cn(
                "grid transition-all duration-300 ease-out border-t border-white/[0.06]",
                settingsExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}>
                <div className="overflow-hidden">
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Features Row */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={toggleStylizationGuardrails}
                        className={cn(
                          "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all",
                          stylizationGuardrails
                            ? "bg-primary/15 text-white border border-primary/40"
                            : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                        )}
                      >
                        <Sparkles className={cn("h-3.5 w-3.5", stylizationGuardrails && "text-primary")} />
                        Stylization Guardrails
                        {stylizationGuardrails && <CheckCircle2 className="h-3 w-3 text-primary" />}
                      </button>
                    </div>

                    {/* Model Selection */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Image Model */}
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Image Model</p>
                        <div className="flex flex-wrap gap-1.5">
                          {IMAGE_MODEL_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setImageModel(option.id)}
                              className={cn(
                                "h-8 px-3 rounded-lg text-xs font-medium transition-all",
                                imageModel === option.id
                                  ? "bg-white/15 text-white border border-white/20"
                                  : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white/70"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Video Model */}
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Video Model</p>
                        <div className="flex flex-wrap gap-1.5">
                          {VIDEO_MODEL_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setVideoModel(option.id)}
                              className={cn(
                                "h-8 px-3 rounded-lg text-xs font-medium transition-all",
                                videoModel === option.id
                                  ? "bg-white/15 text-white border border-white/20"
                                  : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white/70"
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

            {/* Keyboard hint */}
            <p className="text-center text-[11px] text-white/25 mt-3 hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">Enter</kbd> to generate • <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">Shift+Enter</kbd> for new line
            </p>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {shows.map((show, index) => {
                const posterUrl = show.libraryPosterUrl || show.posterUrl;
                const title = show.showTitle || show.title;
                const hasTrailer = !!show.trailerUrl;
                
                const isHovered = hoveredShow === show.id;
                const showActions = isHovered;
                
                return (
                  <div
                    key={show.id}
                    data-show-card
                    role="button"
                    tabIndex={0}
                    className="group relative overflow-hidden rounded-lg bg-zinc-900 transition-all duration-200 cursor-pointer select-none hover:ring-2 hover:ring-white/20 hover:scale-105 hover:z-10 active:scale-100 active:brightness-90"
                    onMouseEnter={() => setHoveredShow(show.id)}
                    onMouseLeave={() => setHoveredShow(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Don't handle clicks on buttons
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) {
                        return;
                      }
                      
                      // Go directly to console page on tap/click
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
                          src={getPosterDisplayUrl(posterUrl)}
                          alt={title}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1536px) 280px, (min-width: 1024px) 240px, (min-width: 768px) 200px, 160px"
                          loading={index < 6 ? "eager" : "lazy"}
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAYH/8QAIBAAAgEEAgMBAAAAAAAAAAAAAQIDBBEABQYSITFBUf/EABQBAQAAAAAAAAAAAAAAAAAAAAX/xAAdEQACAQQDAAAAAAAAAAAAAAABAgADBAURITFB/9oADAMBAAIRAxEAPwCVq+P7K0lptzPcvM9Wq/aqIv8ATRj5YZHY+aVGLMxJJJJyxm/P/9k="
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
