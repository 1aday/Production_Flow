"use client";

import { useMemo, useState } from "react";
import { Sparkles, Users, FileText, Image, Video, Grid3x3, Film, Loader2, CheckCircle2, XCircle, Clock, ChevronDown } from "lucide-react";
import { type BackgroundTask } from "@/lib/background-tasks";

type ProductionPipelineProps = {
  showId: string;
  tasks: BackgroundTask[];
  showTitle: string;
  // Actual show data from database
  showData?: {
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
};

type PipelineStep = {
  id: string;
  type: BackgroundTask['type'];
  label: string;
  icon: typeof Sparkles;
  order: number;
  isCharacterLevel?: boolean; // If true, will have multiple instances per character
};

const PIPELINE_STEPS: PipelineStep[] = [
  { id: 'show-gen', type: 'show-generation', label: 'Show Blueprint', icon: Sparkles, order: 1 },
  { id: 'char-seeds', type: 'character-seeds', label: 'Character Seeds', icon: Users, order: 2 },
  { id: 'dossiers', type: 'character-dossier', label: 'Character Dossiers', icon: FileText, order: 3, isCharacterLevel: true },
  { id: 'portraits', type: 'portrait', label: 'Portraits', icon: Image, order: 4, isCharacterLevel: true },
  { id: 'videos', type: 'video', label: 'Character Videos', icon: Video, order: 5, isCharacterLevel: true },
  { id: 'grid', type: 'portrait-grid', label: 'Portrait Grid', icon: Grid3x3, order: 6 },
  { id: 'poster', type: 'library-poster', label: 'Show Poster', icon: Sparkles, order: 7 },
  { id: 'trailer', type: 'trailer', label: 'Trailer', icon: Film, order: 8 },
];

export function ProductionPipeline({ showId, tasks, showTitle, showData }: ProductionPipelineProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const pipelineState = useMemo(() => {
    return PIPELINE_STEPS.map(step => {
      const stepTasks = tasks.filter(t => t.type === step.type && t.showId === showId);
      
      // Check actual database state for completion
      let dbCompleted = false;
      let dbTotal = 0;
      let dbCompletedCount = 0;
      
      if (showData) {
        switch (step.type) {
          case 'show-generation':
            dbCompleted = !!showData.blueprint;
            break;
          case 'character-seeds':
            dbCompleted = !!showData.characterSeeds && showData.characterSeeds.length > 0;
            break;
          case 'character-dossier':
            dbTotal = showData.characterSeeds?.length || 0;
            dbCompletedCount = Object.keys(showData.characterDocs || {}).length;
            dbCompleted = dbTotal > 0 && dbCompletedCount === dbTotal;
            break;
          case 'portrait':
            dbTotal = showData.characterSeeds?.length || 0;
            dbCompletedCount = Object.values(showData.characterPortraits || {}).filter(url => url).length;
            dbCompleted = dbTotal > 0 && dbCompletedCount === dbTotal;
            break;
          case 'video':
            dbTotal = showData.characterSeeds?.length || 0;
            dbCompletedCount = Object.values(showData.characterVideos || {}).filter(videos => videos && videos.length > 0).length;
            dbCompleted = dbTotal > 0 && dbCompletedCount === dbTotal;
            break;
          case 'portrait-grid':
            dbCompleted = !!showData.portraitGridUrl;
            break;
          case 'library-poster':
            dbCompleted = !!showData.libraryPosterUrl;
            break;
          case 'poster':
            dbCompleted = !!showData.posterUrl;
            break;
          case 'trailer':
            dbCompleted = !!showData.trailerUrl;
            break;
        }
      }
      
      if (step.isCharacterLevel) {
        // Group by character
        const byCharacter: Record<string, BackgroundTask> = {};
        stepTasks.forEach(task => {
          if (task.characterId) {
            byCharacter[task.characterId] = task;
          }
        });
        
        // Use DB data if available, otherwise task data
        const total = dbTotal || Object.keys(byCharacter).length;
        const completed = dbCompleted ? dbTotal : (dbCompletedCount || Object.values(byCharacter).filter(t => t.status === 'succeeded').length);
        const active = dbCompleted ? 0 : Object.values(byCharacter).filter(t => t.status === 'starting' || t.status === 'processing').length;
        const failed = dbCompleted ? 0 : Object.values(byCharacter).filter(t => t.status === 'failed').length;
        
        // Determine status: DATABASE completion takes priority to avoid stale task issues
        let status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'pending';
        if (dbCompleted) {
          status = 'succeeded';
        } else if (active > 0) {
          status = 'processing';
        } else if (failed > 0) {
          status = 'failed';
        } else if (completed > 0) {
          status = 'succeeded';
        } else {
          status = 'pending';
        }
        
        return {
          ...step,
          tasks: Object.values(byCharacter),
          total,
          completed,
          active,
          failed,
          status,
        };
      } else {
        // Single task
        const task = stepTasks[0];
        
        // Determine status: DATABASE takes priority for completion to handle stale tasks
        let status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'pending';
        
        // If database shows it's complete, mark as succeeded (ignore stale task status)
        if (dbCompleted) {
          status = 'succeeded';
        }
        // Only show as active if task is active AND database doesn't show completion
        else if ((task?.status === 'starting' || task?.status === 'processing') && !dbCompleted) {
          status = task.status;
        }
        // Failed tasks
        else if (task?.status === 'failed') {
          status = 'failed';
        }
        // Task succeeded but DB not updated yet
        else if (task?.status === 'succeeded') {
          status = 'succeeded';
        }
        // Nothing done yet
        else {
          status = 'pending';
        }
        
        return {
          ...step,
          tasks: task ? [task] : [],
          total: 1,
          completed: dbCompleted || task?.status === 'succeeded' ? 1 : 0,
          active: (task?.status === 'starting' || task?.status === 'processing') && !dbCompleted ? 1 : 0,
          failed: task?.status === 'failed' && !dbCompleted ? 1 : 0,
          status,
        };
      }
    });
  }, [tasks, showId, showData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'starting':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'succeeded':
        return <CheckCircle2 className="h-4 w-4 text-foreground" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-foreground/30" />;
    }
  };

  const getStepClasses = (status: string) => {
    switch (status) {
      case 'starting':
      case 'processing':
        return 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(229,9,20,0.3)]';
      case 'succeeded':
        return 'border-white/15 bg-black/40';
      case 'failed':
        return 'border-destructive/30 bg-destructive/10';
      default:
        return 'border-white/8 bg-black/20';
    }
  };

  const activeTasks = pipelineState.filter(s => s.status === 'starting' || s.status === 'processing').length;
  const completedTasks = pipelineState.filter(s => s.status === 'succeeded').length;

  return (
    <div className="space-y-4">
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 pb-3 border-b border-white/12 hover:border-white/20 transition-colors cursor-pointer group"
      >
        <Film className="h-5 w-5 text-primary" />
        <div className="flex-1 text-left">
          <h3 className="text-base font-semibold text-foreground group-hover:text-primary/90 transition-colors">
            {showTitle}
          </h3>
          <p className="text-xs text-foreground/60">
            {activeTasks > 0 ? `${activeTasks} in progress` : `${completedTasks} / ${pipelineState.length} steps complete`}
          </p>
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-foreground/50 transition-transform duration-200 ${
            isExpanded ? '' : '-rotate-90'
          }`}
        />
      </button>

      {/* Pipeline Steps - Collapsible */}
      {isExpanded && (
        <div className="space-y-3">
        {pipelineState.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === pipelineState.length - 1;
          
          return (
            <div key={step.id} className="relative">
              {/* Step Card */}
              <div
                className={`rounded-3xl border p-4 transition-all ${getStepClasses(step.status)}`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-foreground/80" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="text-sm font-medium text-foreground">
                        {step.label}
                      </h4>
                      {getStatusIcon(step.status)}
                    </div>

                    {/* Progress for character-level tasks */}
                    {step.isCharacterLevel && step.total > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground/70">
                            {step.completed} of {step.total} complete
                          </span>
                          {step.active > 0 && (
                            <span className="text-primary">{step.active} in progress</span>
                          )}
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              step.status === 'succeeded' 
                                ? 'bg-foreground' // White/complete
                                : step.status === 'failed'
                                ? 'bg-destructive' // Red for failed
                                : 'bg-primary' // Red for in progress
                            }`}
                            style={{ width: `${(step.completed / step.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Status text for single tasks */}
                    {!step.isCharacterLevel && step.status !== 'pending' && (
                      <p className="text-xs text-foreground/70 capitalize">
                        {step.status === 'starting' || step.status === 'processing' 
                          ? 'In progress...' 
                          : step.status}
                      </p>
                    )}

                    {/* Error messages */}
                    {step.failed > 0 && (
                      <p className="text-xs text-destructive mt-1.5">
                        {step.failed} failed
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Connection Line to Next Step */}
              {!isLast && (
                <div className="absolute left-[30px] top-full w-0.5 h-3 bg-white/12" />
              )}
            </div>
          );
        })}
        </div>
      )}

      {/* Overall Progress - Always visible */}
      {isExpanded && (
        <div className="rounded-3xl border border-white/12 bg-black/40 p-4 mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground/80">
              Overall Progress
            </span>
            <span className="text-xs text-foreground/70">
              {pipelineState.filter(s => s.status === 'succeeded').length} / {pipelineState.length} steps
            </span>
          </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completedTasks === pipelineState.length
                ? 'bg-foreground' // All done - white
                : 'bg-gradient-to-r from-primary to-primary/80' // In progress - red gradient
            }`}
            style={{
              width: `${(pipelineState.filter(s => s.status === 'succeeded').length / pipelineState.length) * 100}%`,
            }}
          />
        </div>
        </div>
      )}
    </div>
  );
}

