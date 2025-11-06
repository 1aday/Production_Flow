"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Library, Loader2, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type LibraryShow = {
  id: string;
  title: string;
  showTitle?: string;
  createdAt: string;
  updatedAt: string;
  model: string;
  posterUrl?: string;
  libraryPosterUrl?: string;
};

export default function LibraryPage() {
  const router = useRouter();
  const [shows, setShows] = useState<LibraryShow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/library");
      if (!response.ok) throw new Error("Failed to load library");
      const data = await response.json() as { shows: LibraryShow[] };
      setShows(data.shows);
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
    router.push(`/?load=${showId}`);
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

      <main className="mx-auto w-full max-w-[1800px] px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {shows.map((show) => (
              <div
                key={show.id}
                className="group relative overflow-hidden rounded-xl bg-black/50 shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_48px_rgba(229,9,20,0.4)]"
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
                        className="object-cover transition-opacity duration-300 group-hover:opacity-75"
                        sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                        <span className="text-6xl font-bold text-foreground/20">
                          {(show.showTitle || show.title).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                    <h3 className="line-clamp-2 text-lg font-bold text-foreground drop-shadow-lg">
                      {show.showTitle || show.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 text-xs text-foreground/70">
                      <Badge variant="outline" className="text-[10px] bg-black/40">
                        {show.model}
                      </Badge>
                      <span>
                        {new Date(show.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => void deleteShow(show.id, e)}
                  className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/60 opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-red-500/80 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

