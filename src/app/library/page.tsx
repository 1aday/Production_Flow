"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Library, Loader2, Trash2, CheckCircle2, Clock, Eye, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
// Note: LIBRARY_LOAD_STORAGE_KEY no longer needed - we use URL-based routing now
import { calculateShowCompletion, getCompletionBadgeVariant } from "@/lib/show-completion";
import { getShowUrl } from "@/lib/slug";

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

  const loadShow = (show: LibraryShow) => {
    // Navigate directly to the console with the show ID in the URL
    const consoleUrl = getShowUrl({ 
      id: show.id, 
      title: show.title, 
      showTitle: show.showTitle 
    }).replace('/show/', '/console/');
    router.push(consoleUrl);
  };

  const viewShow = (show: LibraryShow, event: React.MouseEvent) => {
    event.stopPropagation();
    const url = getShowUrl({ id: show.id, title: show.title, showTitle: show.showTitle });
    router.push(url);
  };

  useEffect(() => {
    void loadLibrary();
  }, []);


  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navbar variant="solid" />

      <main className="mx-auto w-full max-w-[1800px] px-2 sm:px-4 lg:px-6 py-4 sm:py-6 pt-20">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-4">
          <Library className="h-5 w-5 text-primary" />
          <h1 className="text-lg sm:text-xl font-sans font-semibold text-white">Show Library</h1>
          <Badge variant="outline" className="text-[10px] h-5">
            {shows.length}
          </Badge>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-foreground/60">Loading your library...</p>
          </div>
        ) : shows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Library className="mb-3 h-12 w-12 text-foreground/30" />
            <p className="text-base text-foreground/60">No shows saved yet</p>
            <p className="mt-1 text-xs text-foreground/45">Create a show to start building your library</p>
            <Button
              type="button"
              variant="default"
              onClick={() => router.push("/")}
              className="mt-4 rounded-full h-9 px-5 text-xs"
            >
              Create Your First Show
            </Button>
          </div>
        ) : (
          <>
            {imageLoadCount < shows.length ? (
              <div className="mb-3 flex items-center gap-2 text-[10px] text-foreground/50">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading posters... {imageLoadCount} of {shows.length}
              </div>
            ) : null}
            <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {shows.map((show, index) => {
              const completion = calculateShowCompletion(show);
              const badgeVariant = getCompletionBadgeVariant(completion.completionPercentage);
              
              return (
              <div
                key={show.id}
                data-show-card
                role="button"
                tabIndex={0}
                className="group relative overflow-hidden rounded-lg sm:rounded-xl border bg-black/30 shadow-[0_6px_20px_rgba(0,0,0,0.4)] transition-all duration-200 cursor-pointer select-none border-white/5 hover:border-primary/40 hover:shadow-[0_10px_35px_rgba(229,9,20,0.25)] active:scale-[0.98] active:brightness-90"
                onClick={(e) => {
                  // Don't handle clicks on buttons
                  const target = e.target as HTMLElement;
                  if (target.closest('button')) {
                    return;
                  }
                  loadShow(show);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    loadShow(show);
                  }
                }}
              >
                <div className="relative block w-full">
                  <div className="relative h-0 w-full pb-[150%]">
                    {show.libraryPosterUrl || show.posterUrl ? (
                      <Image
                        src={show.libraryPosterUrl || show.posterUrl || ""}
                        alt={show.showTitle || show.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-[1.01]"
                        sizes="(min-width: 1536px) 16vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        loading={index < 8 ? "eager" : "lazy"}
                        quality={80}
                        onLoad={() => setImageLoadCount(prev => prev + 1)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                        <span className="text-4xl sm:text-5xl font-bold text-foreground/20">
                          {(show.showTitle || show.title).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Completion Badge */}
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <Badge variant={badgeVariant} className="text-[9px] font-medium h-5 px-1.5">
                        {completion.isFullyComplete ? (
                          <><CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> Done</>
                        ) : (
                          <><Clock className="mr-0.5 h-2.5 w-2.5" /> {completion.completionPercentage}%</>
                        )}
                      </Badge>
                    </div>
                    
                  </div>
                </div>
                
                {/* Action buttons - show on hover (desktop) */}
                <div className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 flex gap-1 transition-all duration-200 opacity-0 group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadShow(show);
                    }}
                    className="h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-black/70 backdrop-blur-md transition duration-200 hover:bg-purple-500/80 active:scale-95"
                    title="Open in Console"
                  >
                    <Terminal className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => viewShow(show, e)}
                    className="h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-black/70 backdrop-blur-md transition duration-200 hover:bg-green-500/80 active:scale-95"
                    title="View show page"
                  >
                    <Eye className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => void deleteShow(show.id, e)}
                    className="h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-black/70 backdrop-blur-md transition duration-200 hover:bg-red-500/80 active:scale-95"
                    title="Delete show"
                  >
                    <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </div>
                
                {/* Show title and info */}
                <div className="p-2.5 sm:p-3 space-y-0.5">
                  <h3 className="font-medium text-xs sm:text-sm line-clamp-1 text-foreground">
                    {show.showTitle || show.title}
                  </h3>
                  <p className="text-[10px] text-foreground/40">
                    {new Date(show.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {completion.stats.totalCharacters > 0 && <span className="ml-1">• {completion.stats.totalCharacters} chars</span>}
                  </p>
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
