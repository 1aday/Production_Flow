"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clapperboard, Loader2, ArrowRight, Play, Sparkles, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

type ShowWithEpisodes = {
  id: string;
  title: string;
  showTitle?: string;
  libraryPosterUrl?: string;
  posterUrl?: string;
  episodeCount: number;
  genre?: string;
  logline?: string;
};

export default function EpisodesPage() {
  const [loading, setLoading] = useState(true);
  const [shows, setShows] = useState<ShowWithEpisodes[]>([]);

  useEffect(() => {
    async function fetchShows() {
      try {
        const response = await fetch("/api/episodes/shows");
        if (response.ok) {
          const data = await response.json();
          setShows(data.shows || []);
        }
      } catch (error) {
        console.error("Failed to fetch shows:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchShows();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Gradient Background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-violet-950/30 via-black to-emerald-950/20 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Navbar */}
      <Navbar variant="solid" />
      
      {/* Content */}
      <div className="relative z-10 pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">New Feature</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-primary via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  Episode Studio
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-foreground/60 max-w-2xl mx-auto mb-8">
                Transform your episode loglines into fully visualized storyboards, keyframes, and video clips.
              </p>
            </div>
          </div>
        </section>

        {/* Shows Grid */}
        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-foreground/60">Loading your shows...</p>
              </div>
            ) : shows.length === 0 ? (
              <div className="text-center py-24">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10 mb-6">
                  <Film className="h-10 w-10 text-foreground/30" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">No Shows with Episodes Yet</h2>
                <p className="text-foreground/60 max-w-md mx-auto mb-8">
                  Generate episode loglines from the console first, then come back here to create full episodes.
                </p>
                <Link href="/console">
                  <Button size="lg" className="rounded-full px-8">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Go to Console
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">Your Shows</h2>
                  <span className="text-sm text-foreground/50">{shows.length} show{shows.length !== 1 ? 's' : ''} ready</span>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {shows.map((show) => (
                    <Link
                      key={show.id}
                      href={`/episodes/${show.id}`}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/10"
                    >
                      {/* Poster Background */}
                      <div className="relative aspect-[16/10] overflow-hidden">
                        {(show.libraryPosterUrl || show.posterUrl) ? (
                          <Image
                            src={show.libraryPosterUrl || show.posterUrl || ""}
                            alt={show.showTitle || show.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                            <Clapperboard className="h-12 w-12 text-foreground/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                        
                        {/* Episode Count Badge */}
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 px-3 py-1">
                            <Play className="h-3 w-3 text-primary" />
                            <span className="text-xs font-semibold">{show.episodeCount} Episodes</span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                          {show.showTitle || show.title}
                        </h3>
                        {show.genre && (
                          <p className="text-xs text-foreground/50 uppercase tracking-wider mb-2">{show.genre}</p>
                        )}
                        {show.logline && (
                          <p className="text-sm text-foreground/60 line-clamp-2 mb-4">{show.logline}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground/40">Click to open</span>
                          <ArrowRight className="h-4 w-4 text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

