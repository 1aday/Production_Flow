"use client";

import { useEffect, useState } from "react";
import { getAllTasks } from "@/lib/background-tasks";
import { BackgroundTasksPanel } from "./BackgroundTasksPanel";

type BackgroundTasksIndicatorProps = {
  showId: string | null;
  onTaskUpdate?: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BackgroundTasksIndicator({ showId, onTaskUpdate, isOpen, onOpenChange }: BackgroundTasksIndicatorProps) {
  const [tasks, setTasks] = useState<number>(0);

  useEffect(() => {
    const updateTasks = () => {
      const allTasks = getAllTasks();
      const activeTasks = allTasks.filter(
        t => t.status === 'starting' || t.status === 'processing'
      );
      setTasks(activeTasks.length);
      onTaskUpdate?.();
    };

    updateTasks();
    const interval = setInterval(updateTasks, 1000);
    return () => clearInterval(interval);
  }, [onTaskUpdate]);

  return (
    <>
      {/* Floating Button - Only show when there are active tasks */}
      {tasks > 0 && (
        <button
          onClick={() => onOpenChange(true)}
          className="fixed bottom-6 right-6 z-40 h-auto rounded-3xl pl-6 pr-8 py-4 shadow-[0_12px_40px_rgba(229,9,20,0.35)] border border-white/12 bg-black/60 hover:bg-black/80 backdrop-blur-xl transition-all duration-200 cursor-pointer w-[280px]"
        >
          <div className="flex items-center gap-3">
            {/* Netflix-style Loader Bars - 30% */}
            <div className="flex items-center justify-center w-[30%]">
              <div className="netflix-loader" style={{ height: '1.75rem', gap: '0.35rem' }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="netflix-loader-bar"
                    style={{
                      width: '0.3rem',
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Text - 70% */}
            <div className="flex flex-col items-start gap-1 w-[70%]">
              <span className="text-sm font-semibold text-foreground leading-none">
                {tasks} Active Task{tasks !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-foreground/60 leading-none">
                Click to view pipeline
              </span>
            </div>
          </div>
        </button>
      )}

      {/* Sliding Panel */}
      <BackgroundTasksPanel
        isOpen={isOpen}
        onClose={() => onOpenChange(false)}
      />
    </>
  );
}

