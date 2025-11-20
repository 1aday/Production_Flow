"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Library, Loader2, Trash2, ArrowLeft, Copy, CheckCircle2, Clock, Settings, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LIBRARY_LOAD_STORAGE_KEY } from "@/lib/constants";
import { calculateShowCompletion, getCompletionBadgeVariant } from "@/lib/show-completion";

type LibraryShow = {
  id: string;
  title: string;
  showTitle?: string;
  createdAt: string;
  updatedAt: string;
  model: string;
  posterUrl?: string;
  libraryPosterUrl?: string;
  portraitGridUrl?: string;
  trailerUrl?: string;
  // For completion calculation
  characterSeeds?: Array<{ id: string }>;
  characterDocs?: Record<string, unknown>;
  characterPortraits?: Record<string, string | null>;
  characterVideos?: Record<string, string[]>;
};

export default function LibraryPage() {
  const router = useRouter();
  const [shows, setShows] = useState<LibraryShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageLoadCount, setImageLoadCount] = useState(0);
  const [copiedShowId, setCopiedShowId] = useState<string | null>(null);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      console.time("Library load");
      const response = await fetch("/api/library");
      if (!response.ok) throw new Error("Failed to load library");
      const data = await response.json() as { shows: LibraryShow[] };
      console.timeEnd("Library load");
      console.log(`Loaded ${data.shows.length} shows`);
      
      // Sort: Shows with library posters first, then by date
      const sorted = data.shows.sort((a, b) => {
        const aHasLibraryPoster = Boolean(a.libraryPosterUrl);
        const bHasLibraryPoster = Boolean(b.libraryPosterUrl);
        
        if (aHasLibraryPoster && !bHasLibraryPoster) return -1;
        if (!aHasLibraryPoster && bHasLibraryPoster) return 1;
        
        // Both same poster status, sort by date
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      setShows(sorted);
    } catch (error) {
      console.error("Failed to load library:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteShow = async (showId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Delete this show from your library?")) return;
    
    try {
      const response = await fetch(`/api/library/${showId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete show");
      await loadLibrary();
    } catch (error) {
      console.error("Failed to delete show:", error);
    }
  };

  const loadShow = (showId: string) => {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(LIBRARY_LOAD_STORAGE_KEY, showId);
      } catch (error) {
        console.error("Failed to stash pending show ID", error);
      }
    }
    router.push("/console");
  };

  const copyShowUrl = async (showId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const url = `${window.location.origin}/show/${showId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedShowId(showId);
      setTimeout(() => setCopiedShowId(null), 2000);
      console.log("✅ Show URL copied:", url);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const viewShow = (showId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    // Use slug if available, fall back to ID
    const identifier = show?.slug || showId;
    router.push(`/show/${identifier}`);
  };

  useEffect(() => {
    void loadLibrary();
  }, []);

  return (
    <div className="min-h-screen bg-black text-foreground">
      <header className="border-b border-white/12 bg-black/90">
        <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold uppercase tracking-[0.32em] text-primary">
                Show Library
              </span>
              <Badge variant="outline" className="text-[11px]">
                {shows.length} {shows.length === 1 ? "show" : "shows"}
              </Badge>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/")}
            className="rounded-full"
          >
            Create New Show
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 py-8 sm:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-foreground/60">Loading your library...</p>
          </div>
        ) : shows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Library className="mb-4 h-16 w-16 text-foreground/30" />
            <p className="text-lg text-foreground/60">No shows saved yet</p>
            <p className="mt-2 text-sm text-foreground/45">Create a show to start building your library</p>
            <Button
              type="button"
              variant="default"
              onClick={() => router.push("/")}
              className="mt-6 rounded-full"
            >
              Create Your First Show
            </Button>
          </div>
        ) : (
          <>
            {imageLoadCount < shows.length ? (
              <div className="mb-4 flex items-center gap-2 text-xs text-foreground/50">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading posters... {imageLoadCount} of {shows.length}
              </div>
            ) : null}
            <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {shows.map((show, index) => {
              const completion = calculateShowCompletion(show);
              const badgeVariant = getCompletionBadgeVariant(completion.completionPercentage);
              
              return (
              <div
                key={show.id}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-black/30 shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-primary/40 hover:shadow-[0_18px_60px_rgba(229,9,20,0.35)] cursor-pointer"
                onDoubleClick={() => loadShow(show.id)}
              >
                <button
                  type="button"
                  onClick={() => loadShow(show.id)}
                  className="relative block w-full"
                >
                  <div className="relative h-0 w-full pb-[177.78%]">
                    {show.libraryPosterUrl || show.posterUrl ? (
                      <Image
                        src={show.libraryPosterUrl || show.posterUrl || ""}
                        alt={show.showTitle || show.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-[1.015]"
                        sizes="(min-width: 1536px) 16vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        loading={index < 8 ? "eager" : "lazy"}
                        quality={85}
                        onLoad={() => setImageLoadCount(prev => prev + 1)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/25 to-transparent">
                        <span className="text-6xl font-bold text-foreground/25">
                          {(show.showTitle || show.title).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Completion Badge */}
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <Badge variant={badgeVariant} className="text-[10px] font-semibold">
                        {completion.isFullyComplete ? (
                          <><CheckCircle2 className="mr-1 h-3 w-3" /> Complete</>
                        ) : (
                          <><Clock className="mr-1 h-3 w-3" /> {completion.completionPercentage}%</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </button>
                
                {/* Action buttons */}
                <div className="absolute right-3 top-3 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/control-panel?show=${show.id}`);
                    }}
                    className="h-9 w-9 rounded-full bg-black/60 opacity-0 backdrop-blur-md transition duration-200 hover:bg-blue-500/80 group-hover:opacity-100"
                    title="Edit prompts"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => viewShow(show.id, e)}
                    className="h-9 w-9 rounded-full bg-black/60 opacity-0 backdrop-blur-md transition duration-200 hover:bg-green-500/80 group-hover:opacity-100"
                    title="View show page"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => void copyShowUrl(show.id, e)}
                    className="h-9 w-9 rounded-full bg-black/60 opacity-0 backdrop-blur-md transition duration-200 hover:bg-primary/80 group-hover:opacity-100"
                    title={copiedShowId === show.id ? "Copied!" : "Copy show URL"}
                  >
                    {copiedShowId === show.id ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => void deleteShow(show.id, e)}
                    className="h-9 w-9 rounded-full bg-black/60 opacity-0 backdrop-blur-md transition duration-200 hover:bg-red-500/80 group-hover:opacity-100"
                    title="Delete show"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Show title and info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm line-clamp-2 text-foreground">
                    {show.showTitle || show.title}
                  </h3>
                  
                  {!completion.isFullyComplete && completion.missingItems.length > 0 ? (
                    <p className="text-[11px] text-amber-400/70 line-clamp-2">
                      Missing: {completion.missingItems.slice(0, 2).join(", ")}
                      {completion.missingItems.length > 2 ? `, +${completion.missingItems.length - 2} more` : ""}
                    </p>
                  ) : (
                    <p className="text-[11px] text-foreground/50">
                      {new Date(show.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-[10px] text-foreground/40">
                    <span>{show.model}</span>
                    {completion.stats.totalCharacters > 0 ? (
                      <span>• {completion.stats.totalCharacters} chars</span>
                    ) : null}
                  </div>
                </div>
              </div>
              );
            })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
