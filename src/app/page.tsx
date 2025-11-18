"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sparkles, ArrowRight, Play, Loader2, Library, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Show = {
  id: string;
  title: string;
  showTitle?: string;
  libraryPosterUrl?: string;
  posterUrl?: string;
  trailerUrl?: string;
  updatedAt: string;
};

export default function LandingPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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
    void loadShows();
  }, []);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setIsSubmitting(true);
    // Store prompt and redirect to console
    sessionStorage.setItem("production-flow.initial-prompt", input);
    router.push("/console");
  };

  const [videoLightbox, setVideoLightbox] = useState<{ url: string; title: string } | null>(null);
  const [hoveredShow, setHoveredShow] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-foreground overflow-x-hidden w-full max-w-full">
      {/* Navigation Header - Transparent over hero */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/60 via-black/30 to-transparent backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-base sm:text-lg font-semibold uppercase tracking-[0.28em] sm:tracking-[0.32em] text-primary drop-shadow-lg">
              Production Flow
            </span>
            <span className="hidden sm:inline text-xs text-white/70 drop-shadow">AI Show Bible Generator</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/console")}
              className="gap-2 rounded-full backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/20"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Show</span>
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/prompts")}
              className="gap-2 rounded-full backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10"
              title="Edit AI prompt templates"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Prompts</span>
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/library")}
              className="gap-2 rounded-full backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <Library className="h-4 w-4" />
              <span className="hidden sm:inline">Library</span>
            </Button>
          </div>
        </div>
      </header>
      
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
                autoPlay
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
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-8">
        {/* Epic Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black to-black" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[90vw] max-w-[1000px] h-[60vw] max-h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.9] tracking-tighter">
              <span className="block text-white/90">Your Next Hit</span>
              <span className="block bg-gradient-to-r from-primary via-primary/70 to-primary/50 bg-clip-text text-transparent">
                Starts Here
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/60 font-light max-w-3xl mx-auto leading-tight">
              Turn <span className="text-white/90 font-medium">one sentence</span> into a complete show bible
            </p>
          </div>

          {/* Input - Clean and Massive */}
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="relative group">
              {/* Animated glow - appears when typing */}
              <div className={`absolute -inset-1 bg-gradient-to-r from-primary via-primary/60 to-primary/40 rounded-2xl blur-2xl transition-opacity duration-700 ${
                input.trim() ? 'opacity-30' : 'opacity-0'
              }`} />
              
              {/* Subtle border animation when typing */}
              <div className={`absolute -inset-px bg-gradient-to-r from-primary/50 via-primary/30 to-transparent rounded-2xl transition-opacity duration-500 ${
                input.trim() ? 'opacity-100' : 'opacity-0'
              }`} />
              
              {/* Focus glow */}
              <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSubmit();
                }}
                placeholder="A robot family navigating suburban life..."
                disabled={isSubmitting}
                className="relative w-full h-20 bg-zinc-900/50 border-2 border-white/20 focus:border-primary/40 rounded-2xl px-8 text-2xl text-white placeholder:text-white/25 focus:outline-none focus:bg-zinc-900/70 transition-all duration-300 backdrop-blur-2xl font-light"
              />
            </div>
            
            <div className="flex items-center justify-center mt-2">
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isSubmitting}
                size="lg"
                className="h-16 px-12 rounded-full bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-white font-bold text-xl shadow-[0_0_80px_rgba(229,9,20,0.8)] hover:shadow-[0_0_100px_rgba(229,9,20,1)] hover:scale-105 transition-all duration-300 border-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    <span>Creating Magic...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Show Bible</span>
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Shows Grid - Netflix Style */}
      {shows.length > 0 ? (
        <section className="relative px-6 pt-0 pb-20 bg-gradient-to-b from-black via-black/98 to-black">
          <div className="max-w-[1800px] mx-auto space-y-6">
            {/* Section Header - Netflix bold */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Recent Shows
              </h2>
              <p className="text-base text-foreground/60">
                Explore shows created by the community
              </p>
            </div>

            {/* Shows Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {shows.map((show, index) => {
                const posterUrl = show.libraryPosterUrl || show.posterUrl;
                const title = show.showTitle || show.title;
                const hasTrailer = !!show.trailerUrl;
                
                const isHovered = hoveredShow === show.id;
                
                return (
                  <div
                    key={show.id}
                    className="group relative overflow-hidden rounded-lg bg-zinc-900 hover:ring-2 hover:ring-white/20 transition-all duration-200 hover:scale-105 hover:z-10 cursor-pointer"
                    onMouseEnter={() => setHoveredShow(show.id)}
                    onMouseLeave={() => setHoveredShow(null)}
                    onClick={() => {
                      router.push(`/show/${show.id}`);
                    }}
                  >
                    {/* Video or Poster */}
                    <div className="relative aspect-[2/3]">
                      {hasTrailer && show.trailerUrl && isHovered ? (
                        // Auto-play trailer on hover with AUDIO
                        <video
                          src={show.trailerUrl}
                          autoPlay
                          loop
                          playsInline
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
                      
                      {/* Title - Hidden when hovered */}
                      <div className={`absolute bottom-0 left-0 right-0 p-3 pb-16 transition-all duration-200 ${isHovered ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                        <h3 className="font-bold text-sm text-white line-clamp-2 drop-shadow-lg">
                          {title}
                        </h3>
                      </div>
                      
                      {/* Hover Actions - Slide up from bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/show/${show.id}`);
                          }}
                          size="sm"
                          className="flex-1 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-10 shadow-lg"
                        >
                          Open Show
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
            <div className="flex justify-center pt-8">
              <Button
                onClick={() => router.push("/library")}
                variant="outline"
                size="lg"
                className="rounded-full border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
              >
                Browse All Shows
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Footer - Minimal like Apple */}
      <footer className="relative px-6 py-12 border-t border-white/5">
        <div className="max-w-[1800px] mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-4 w-4 text-primary/60" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/40">
              Production Flow
            </span>
          </div>
          <p className="text-xs text-foreground/30">
            AI-powered show development • Built for creators
          </p>
        </div>
      </footer>

    </div>
  );
}
