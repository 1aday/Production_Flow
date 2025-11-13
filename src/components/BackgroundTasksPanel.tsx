"use client";

import { useEffect, useState } from "react";
import { X, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllTasks, cleanupStaleTasks, type BackgroundTask } from "@/lib/background-tasks";
import { ProductionPipeline } from "./ProductionPipeline";

type BackgroundTasksPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ShowData = {
  blueprint?: unknown;
  characterSeeds?: unknown[];
  characterDocs?: Record<string, unknown>;
  characterPortraits?: Record<string, string | null>;
  characterVideos?: Record<string, string[]>;
  portraitGridUrl?: string | null;
  libraryPosterUrl?: string | null;
  posterUrl?: string | null;
  trailerUrl?: string | null;
};

type TasksByShow = {
  [showId: string]: {
    showTitle: string;
    tasks: BackgroundTask[];
    showData?: ShowData;
  };
};


export function BackgroundTasksPanel({ isOpen, onClose }: BackgroundTasksPanelProps) {
  const [tasksByShow, setTasksByShow] = useState<TasksByShow>({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const updateTasks = async () => {
      // Clean up stale tasks before updating
      cleanupStaleTasks();
      
      const allTasks = getAllTasks();
      
      // Group tasks by show
      const grouped: TasksByShow = {};
      allTasks.forEach(task => {
        if (!grouped[task.showId]) {
          grouped[task.showId] = {
            showTitle: task.metadata?.showTitle as string || "Untitled Show",
            tasks: [],
          };
        }
        grouped[task.showId].tasks.push(task);
      });

      // Only fetch show data when panel is open and there are tasks
      if (isOpen && Object.keys(grouped).length > 0) {
        // Fetch actual show data for each show to check completion
        await Promise.all(
          Object.keys(grouped).map(async (showId) => {
            try {
              const response = await fetch(`/api/library/${showId}`);
              if (response.ok) {
                const data = await response.json() as { show: any };
                grouped[showId].showData = {
                  blueprint: data.show.blueprint,
                  characterSeeds: data.show.characterSeeds,
                  characterDocs: data.show.characterDocs,
                  characterPortraits: data.show.characterPortraits,
                  characterVideos: data.show.characterVideos,
                  portraitGridUrl: data.show.portraitGridUrl,
                  libraryPosterUrl: data.show.libraryPosterUrl,
                  posterUrl: data.show.posterUrl,
                  trailerUrl: data.show.trailerUrl,
                };
                // Update title from actual show data if available
                if (data.show.blueprint?.show_title) {
                  grouped[showId].showTitle = data.show.blueprint.show_title;
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch show data for ${showId}:`, error);
              // Continue without show data - will just use task data
            }
          })
        );
      }

      // Sort tasks within each show by startedAt (newest first)
      Object.values(grouped).forEach(show => {
        show.tasks.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
      });

      setTasksByShow(grouped);
    };

    void updateTasks();
    
    // Only poll when panel is open
    if (isOpen) {
      const interval = setInterval(() => {
        void updateTasks();
      }, 2000); // Check every 2 seconds
      return () => clearInterval(interval);
    }
    
    // Always return a cleanup function (even if it does nothing)
    return () => {};
  }, [isOpen]);

  // Update current time for elapsed time calculations
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeTaskCount = Object.values(tasksByShow).reduce(
    (total, show) => 
      total + show.tasks.filter(t => t.status === "starting" || t.status === "processing").length,
    0
  );

  const completedTaskCount = Object.values(tasksByShow).reduce(
    (total, show) => 
      total + show.tasks.filter(t => t.status === "succeeded").length,
    0
  );

  const failedTaskCount = Object.values(tasksByShow).reduce(
    (total, show) => 
      total + show.tasks.filter(t => t.status === "failed").length,
    0
  );

  const totalTasks = Object.values(tasksByShow).reduce(
    (total, show) => total + show.tasks.length,
    0
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[500px] bg-black border-l border-white/12 shadow-[0_24px_80px_rgba(0,0,0,0.7)] transition-transform duration-200 ease-out z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/12 bg-black/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20">
                <Film className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Background Tasks</h2>
                <p className="text-xs text-foreground/60">
                  {activeTaskCount > 0 ? `${activeTaskCount} in progress` : "All caught up"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Summary Stats */}
          {totalTasks > 0 && (
            <div className="grid grid-cols-3 gap-3 px-6 pb-5">
              <div className="rounded-3xl border border-white/12 bg-black/40 px-3 py-2.5">
                <div className="text-xs text-foreground/60 mb-0.5">Active</div>
                <div className="text-xl font-bold text-primary">{activeTaskCount}</div>
              </div>
              <div className="rounded-3xl border border-white/12 bg-black/40 px-3 py-2.5">
                <div className="text-xs text-foreground/60 mb-0.5">Done</div>
                <div className="text-xl font-bold text-foreground">{completedTaskCount}</div>
              </div>
              <div className="rounded-3xl border border-white/12 bg-black/40 px-3 py-2.5">
                <div className="text-xs text-foreground/60 mb-0.5">Failed</div>
                <div className="text-xl font-bold text-destructive">{failedTaskCount}</div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="h-[calc(100%-180px)] overflow-y-auto px-6 py-6 space-y-8">
          {totalTasks === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="h-20 w-20 rounded-3xl bg-black/40 border border-white/12 flex items-center justify-center mb-4">
                <Film className="h-10 w-10 text-primary/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Shows Yet</h3>
              <p className="text-sm text-foreground/60 max-w-xs">
                Generate a show to see the full production pipeline here.
              </p>
            </div>
          ) : (
            Object.entries(tasksByShow).map(([showId, { showTitle, tasks, showData }]) => (
              <ProductionPipeline
                key={showId}
                showId={showId}
                tasks={tasks}
                showTitle={showTitle}
                showData={showData}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {totalTasks > 0 && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/12 bg-black/95 backdrop-blur-xl px-6 py-4">
            <p className="text-xs text-center text-foreground/60">
              Tasks are tracked in your browser and will resume if you refresh
            </p>
          </div>
        )}
      </div>
    </>
  );
}

