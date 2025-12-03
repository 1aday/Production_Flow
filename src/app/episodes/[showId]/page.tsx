"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Clapperboard, 
  Loader2, 
  Play, 
  Sparkles, 
  Zap,
  Target,
  Film,
  CheckCircle2,
  PanelLeftClose,
  PanelLeft,
  Home,
  ArrowLeft,
  Menu,
  X,
  Plus,
  RotateCcw,
  Video,
  ImageIcon,
  AlertCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { type Episode } from "@/components/EpisodeCards";
import { type ShowFormat } from "@/components/ShowFormatVisualizer";
import { Navbar } from "@/components/Navbar";

// Helper to pause all other videos when one starts playing
function pauseOtherVideos(currentVideo: HTMLVideoElement) {
  const allVideos = document.querySelectorAll('video');
  allVideos.forEach((video) => {
    if (video !== currentVideo && !video.paused) {
      video.pause();
    }
  });
}

type ShowData = {
  id: string;
  title: string;
  showTitle?: string;
  logline?: string;
  genre?: string;
  libraryPosterUrl?: string;
  posterUrl?: string;
  showFormat?: ShowFormat;
  episodes?: Episode[];
  characterSeeds?: Array<{ id: string; name: string }>;
};

type EpisodeStatus = {
  storyboard: "pending" | "generating" | "complete";
  keyframes: "pending" | "generating" | "complete";
  videos: "pending" | "generating" | "complete";
};

type VideoGenerationStatus = {
  key: string;
  episodeNumber: number;
  sectionLabel: string;
  status: "queued" | "starting" | "processing" | "succeeded" | "failed";
  progress?: number;
  error?: string;
  startTime: number;
  model?: string;
  attempts?: number;
};

// Prompt Editor Modal Component
function PromptEditorModal({
  isOpen,
  onClose,
  sectionLabel,
  imagePrompt,
  videoPrompt,
  onGenerateWithPrompt,
  onGenerateVideoWithPrompt,
  isGenerating,
  isGeneratingVideo,
  hasImage,
}: {
  isOpen: boolean;
  onClose: () => void;
  sectionLabel: string;
  imagePrompt: string;
  videoPrompt: string;
  onGenerateWithPrompt: (prompt: string) => void;
  onGenerateVideoWithPrompt: (prompt: string) => void;
  isGenerating: boolean;
  isGeneratingVideo: boolean;
  hasImage: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");
  const [editedImagePrompt, setEditedImagePrompt] = useState(imagePrompt);
  const [editedVideoPrompt, setEditedVideoPrompt] = useState(videoPrompt);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedVideo, setCopiedVideo] = useState(false);

  // Reset edited prompts when modal opens with new prompts
  useEffect(() => {
    setEditedImagePrompt(imagePrompt);
    setEditedVideoPrompt(videoPrompt);
  }, [imagePrompt, videoPrompt, isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, type: "image" | "video") => {
    await navigator.clipboard.writeText(text);
    if (type === "image") {
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } else {
      setCopiedVideo(true);
      setTimeout(() => setCopiedVideo(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] mx-4 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Edit Prompts</h3>
              <p className="text-xs text-foreground/50">{sectionLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-foreground/50 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("image")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === "image"
                ? "text-foreground"
                : "text-foreground/50 hover:text-foreground/70"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Image Prompt
            </div>
            {activeTab === "image" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === "video"
                ? "text-foreground"
                : "text-foreground/50 hover:text-foreground/70"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Video className="h-4 w-4" />
              Video Prompt
            </div>
            {activeTab === "video" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "image" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground/70">Image Generation Prompt</label>
                <button
                  onClick={() => copyToClipboard(editedImagePrompt, "image")}
                  className="flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground transition-colors"
                >
                  {copiedImage ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={editedImagePrompt}
                onChange={(e) => setEditedImagePrompt(e.target.value)}
                className="w-full h-64 p-3 bg-black/50 border border-white/10 rounded-lg text-sm text-foreground/90 placeholder:text-foreground/30 resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                placeholder="Enter image generation prompt..."
              />
              <p className="text-[10px] text-foreground/40">
                This prompt is sent to the image generation model (Nano Banana Pro) to create the scene still.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground/70">Video Generation Prompt</label>
                <button
                  onClick={() => copyToClipboard(editedVideoPrompt, "video")}
                  className="flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground transition-colors"
                >
                  {copiedVideo ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={editedVideoPrompt}
                onChange={(e) => setEditedVideoPrompt(e.target.value)}
                className="w-full h-64 p-3 bg-black/50 border border-white/10 rounded-lg text-sm text-foreground/90 placeholder:text-foreground/30 resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                placeholder="Enter video generation prompt..."
              />
              <p className="text-[10px] text-foreground/40">
                This prompt is sent to VEO 3.1 along with the still image to animate the scene.
              </p>
              {!hasImage && (
                <p className="text-[10px] text-amber-400/80 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Generate an image first before creating a video.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setEditedImagePrompt(imagePrompt);
              setEditedVideoPrompt(videoPrompt);
            }}
            className="px-3 py-2 text-xs text-foreground/50 hover:text-foreground transition-colors"
          >
            Reset to Default
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            {activeTab === "image" ? (
              <Button
                size="sm"
                onClick={() => {
                  onGenerateWithPrompt(editedImagePrompt);
                  onClose();
                }}
                disabled={isGenerating || !editedImagePrompt.trim()}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Image
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  onGenerateVideoWithPrompt(editedVideoPrompt);
                  onClose();
                }}
                disabled={isGeneratingVideo || !editedVideoPrompt.trim() || !hasImage}
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Video className="h-3.5 w-3.5" />
                    Generate Video
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Storyboard Section Component
const STORYBOARD_COLORS = {
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: "bg-amber-500/20" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", icon: "bg-blue-500/20" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", icon: "bg-emerald-500/20" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", icon: "bg-rose-500/20" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", icon: "bg-violet-500/20" },
  slate: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-400", icon: "bg-slate-500/20" },
};

function StoryboardSection({ 
  label, 
  description, 
  color, 
  icon,
  imageUrl,
  videoUrl,
  isGenerating,
  isGeneratingVideo,
  videoStatus,
  imagePrompt,
  videoPrompt,
  onGenerate,
  onGenerateVideo,
  onGenerateWithPrompt,
  onGenerateVideoWithPrompt,
}: { 
  label: string; 
  description: string; 
  color: keyof typeof STORYBOARD_COLORS;
  icon: React.ReactNode;
  imageUrl?: string;
  videoUrl?: string;
  isGenerating?: boolean;
  isGeneratingVideo?: boolean;
  videoStatus?: VideoGenerationStatus;
  imagePrompt: string;
  videoPrompt: string;
  onGenerate: () => void;
  onGenerateVideo?: () => void;
  onGenerateWithPrompt: (prompt: string) => void;
  onGenerateVideoWithPrompt: (prompt: string) => void;
}) {
  const colors = STORYBOARD_COLORS[color];
  // Track if user has explicitly toggled to prefer image over video
  const [userPrefersImage, setUserPrefersImage] = useState(false);
  // Show video if available and user hasn't toggled to prefer image
  const showVideo = !!videoUrl && !userPrefersImage;
  // Prompt editor modal state
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  
  return (
    <div className={cn("rounded-lg border p-3", colors.bg, colors.border)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", colors.icon, colors.text)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className={cn("text-[10px] font-bold tracking-wider", colors.text)}>{label}</span>
          <p className="text-[10px] text-foreground/50 line-clamp-1">{description}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Prompt editor button */}
          <button
            onClick={() => setShowPromptEditor(true)}
            className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-foreground/40 hover:text-foreground/70 transition-colors"
            title="View & edit prompts"
          >
            <FileText className="h-3 w-3" />
          </button>
          {/* Toggle between image/video when both exist */}
          {imageUrl && videoUrl && (
            <button
              onClick={() => setUserPrefersImage(!userPrefersImage)}
              className={cn(
                "p-1 rounded-md transition-colors",
                showVideo ? "bg-violet-500/20 text-violet-400" : "bg-white/10 text-foreground/50 hover:text-foreground/70"
              )}
              title={showVideo ? "Show image" : "Show video"}
            >
              {showVideo ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>
      
      {/* Prompt Editor Modal */}
      <PromptEditorModal
        isOpen={showPromptEditor}
        onClose={() => setShowPromptEditor(false)}
        sectionLabel={label}
        imagePrompt={imagePrompt}
        videoPrompt={videoPrompt}
        onGenerateWithPrompt={onGenerateWithPrompt}
        onGenerateVideoWithPrompt={onGenerateVideoWithPrompt}
        isGenerating={isGenerating || false}
        isGeneratingVideo={isGeneratingVideo || false}
        hasImage={!!imageUrl}
      />
      
      {/* Video, Image, or Placeholder */}
      {videoUrl && showVideo ? (
        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/10 group">
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            controls
            playsInline
            preload="metadata"
            onPlay={(e) => pauseOtherVideos(e.currentTarget)}
          />
          {/* Regenerate video overlay on hover */}
          {!isGeneratingVideo && onGenerateVideo && (
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onGenerateVideo}
                className="px-2 py-1 rounded-md bg-black/80 hover:bg-violet-600 text-xs font-medium text-white/80 hover:text-white transition-all flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Regen Video
              </button>
            </div>
          )}
        </div>
      ) : imageUrl ? (
        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/10 group">
          <Image
            src={imageUrl}
            alt={`${label} keyframe`}
            fill
            className="object-cover"
          />
          {/* Generating video overlay */}
          {isGeneratingVideo && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 p-4 text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="h-8 w-8 text-violet-400 animate-spin relative" />
                </div>
                <div>
                  <span className="text-sm font-medium text-white/90">
                    {videoStatus?.status === "starting" ? "Starting model..." : "Generating Video..."}
                  </span>
                  <p className="text-[10px] text-white/50 mt-1">
                    {videoStatus?.status === "starting" 
                      ? "Cold start may take 30-60s" 
                      : "This typically takes 2-3 minutes"}
                  </p>
                </div>
                {/* Progress indicator */}
                <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      videoStatus?.status === "starting"
                        ? "bg-blue-500 w-1/4 animate-pulse"
                        : "bg-violet-500 w-3/4"
                    )}
                  />
                </div>
              </div>
            </div>
          )}
          {/* Error overlay - show when video generation failed */}
          {videoStatus?.status === "failed" && !isGeneratingVideo && (
            <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 p-4 text-center max-w-[200px]">
                <AlertCircle className="h-6 w-6 text-red-400" />
                <span className="text-xs font-medium text-red-300">Video generation failed</span>
                <p className="text-[10px] text-red-400/80 line-clamp-2">
                  {videoStatus.error || "Unknown error"}
                </p>
                {onGenerateVideo && (
                  <button
                    onClick={onGenerateVideo}
                    className="mt-1 px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-xs font-medium text-red-300 hover:text-red-200 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Regenerating still overlay */}
          {isGenerating && !isGeneratingVideo && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
                <span className="text-xs text-white/80">Regenerating...</span>
              </div>
            </div>
          )}
          {/* Action buttons - visible on hover */}
          {!isGenerating && !isGeneratingVideo && (
            <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onGenerate}
                className="px-2 py-1.5 rounded-md bg-black/80 hover:bg-primary text-xs font-medium text-white/80 hover:text-white transition-all flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Still
              </button>
              {onGenerateVideo && (
                <button
                  onClick={onGenerateVideo}
                  className="px-2 py-1.5 rounded-md bg-violet-600/80 hover:bg-violet-600 text-xs font-medium text-white/90 hover:text-white transition-all flex items-center gap-1"
                >
                  <Video className="h-3 w-3" />
                  Video
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <button 
          onClick={onGenerate}
          disabled={isGenerating}
          className="group w-full aspect-[16/9] rounded-lg border-2 border-dashed border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/40 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-6 w-6 text-foreground/50 animate-spin" />
              <span className="text-xs text-foreground/50">Generating...</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <Plus className="h-5 w-5 text-foreground/30 group-hover:text-foreground/50" />
              </div>
              <span className="text-xs text-foreground/30 group-hover:text-foreground/50">Generate Still</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Video Generation Status Panel Component
function VideoGenerationPanel({
  activeGenerations,
  onDismiss,
  onRetry,
}: {
  activeGenerations: VideoGenerationStatus[];
  onDismiss: (key: string) => void;
  onRetry: (key: string) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  if (activeGenerations.length === 0) return null;
  
  const activeCount = activeGenerations.filter(g => 
    g.status === "queued" || g.status === "starting" || g.status === "processing"
  ).length;
  const failedCount = activeGenerations.filter(g => g.status === "failed").length;
  const completedCount = activeGenerations.filter(g => g.status === "succeeded").length;
  
  const formatElapsedTime = (startTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };
  
  const getStatusIcon = (status: VideoGenerationStatus["status"]) => {
    switch (status) {
      case "queued": return <Clock className="h-3.5 w-3.5 text-foreground/50" />;
      case "starting": return <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />;
      case "processing": return <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />;
      case "succeeded": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
      case "failed": return <XCircle className="h-3.5 w-3.5 text-red-400" />;
    }
  };
  
  const getStatusText = (status: VideoGenerationStatus["status"]) => {
    switch (status) {
      case "queued": return "Queued";
      case "starting": return "Starting model...";
      case "processing": return "Generating video...";
      case "succeeded": return "Complete";
      case "failed": return "Failed";
    }
  };
  
  const getStatusColor = (status: VideoGenerationStatus["status"]) => {
    switch (status) {
      case "queued": return "text-foreground/50";
      case "starting": return "text-blue-400";
      case "processing": return "text-violet-400";
      case "succeeded": return "text-emerald-400";
      case "failed": return "text-red-400";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <div className="rounded-xl border border-white/20 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between p-3 border-b border-white/10 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium">Video Generation</span>
            <div className="flex items-center gap-1.5 ml-2">
              {activeCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/20 text-violet-400">
                  {activeCount} active
                </span>
              )}
              {failedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-400">
                  {failedCount} failed
                </span>
              )}
              {completedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                  {completedCount} done
                </span>
              )}
            </div>
          </div>
          {isCollapsed ? (
            <ChevronUp className="h-4 w-4 text-foreground/50" />
          ) : (
            <ChevronDown className="h-4 w-4 text-foreground/50" />
          )}
        </button>
        
        {/* Content */}
        {!isCollapsed && (
          <div className="max-h-64 overflow-y-auto">
            {activeGenerations.map((gen) => (
              <div
                key={gen.key}
                className={cn(
                  "p-3 border-b border-white/5 last:border-0",
                  gen.status === "failed" && "bg-red-500/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    {getStatusIcon(gen.status)}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        Ep{gen.episodeNumber} · {gen.sectionLabel}
                      </p>
                      <p className={cn("text-[10px]", getStatusColor(gen.status))}>
                        {getStatusText(gen.status)}
                        {(gen.status === "starting" || gen.status === "processing") && (
                          <span className="text-foreground/40 ml-1">
                            ({formatElapsedTime(gen.startTime)})
                          </span>
                        )}
                      </p>
                      {gen.error && (
                        <p className="text-[10px] text-red-400/80 mt-1 line-clamp-2">
                          {gen.error}
                        </p>
                      )}
                      {gen.status === "succeeded" && (
                        <p className="text-[10px] text-foreground/30 mt-0.5">
                          {gen.model}{gen.attempts && gen.attempts > 1 ? ` (${gen.attempts} attempts)` : ""}
                        </p>
                      )}
                      {gen.status === "failed" && gen.attempts && gen.attempts > 1 && (
                        <p className="text-[10px] text-red-400/60 mt-0.5">
                          Failed after {gen.attempts} attempts
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {gen.status === "failed" && (
                      <button
                        onClick={() => onRetry(gen.key)}
                        className="p-1 rounded hover:bg-white/10 text-foreground/50 hover:text-foreground transition-colors"
                        title="Retry"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}
                    {(gen.status === "succeeded" || gen.status === "failed") && (
                      <button
                        onClick={() => onDismiss(gen.key)}
                        className="p-1 rounded hover:bg-white/10 text-foreground/50 hover:text-foreground transition-colors"
                        title="Dismiss"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Progress bar for active generations */}
                {(gen.status === "starting" || gen.status === "processing") && (
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        gen.status === "starting" 
                          ? "bg-blue-500 w-1/4 animate-pulse" 
                          : "bg-violet-500 w-3/4"
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const EPISODE_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pilot: { bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-400" },
  "case-of-week": { bg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-400" },
  "character-focus": { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-400" },
  mythology: { bg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-400" },
  "bottle-episode": { bg: "bg-rose-500/15", border: "border-rose-500/30", text: "text-rose-400" },
  finale: { bg: "bg-primary/15", border: "border-primary/30", text: "text-primary" },
  default: { bg: "bg-white/10", border: "border-white/20", text: "text-foreground/70" },
};

export default function ShowEpisodesPage({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = use(params);
  const [loading, setLoading] = useState(true);
  const [showData, setShowData] = useState<ShowData | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(0);
  const [episodeStatuses] = useState<Record<number, EpisodeStatus>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Stills generation state: { [episodeNumber]: { [sectionLabel]: imageUrl } }
  const [generatedStills, setGeneratedStills] = useState<Record<number, Record<string, string>>>({});
  const [generatingStills, setGeneratingStills] = useState<Record<string, boolean>>({});
  const [portraitGridUrl, setPortraitGridUrl] = useState<string | undefined>();
  
  // Clips (video) generation state: { [episodeNumber]: { [sectionLabel]: videoUrl } }
  const [generatedClips, setGeneratedClips] = useState<Record<number, Record<string, string>>>({});
  const [generatingClips, setGeneratingClips] = useState<Record<string, boolean>>({});
  
  // Video generation status tracking
  const [videoGenerationStatuses, setVideoGenerationStatuses] = useState<VideoGenerationStatus[]>([]);

  useEffect(() => {
    async function fetchShow() {
      try {
        const response = await fetch(`/api/show/${showId}`);
        if (response.ok) {
          const data = await response.json();
          setShowData({
            id: data.show.id,
            title: data.show.title,
            showTitle: data.show.showTitle || data.show.blueprint?.show_title,
            logline: data.show.blueprint?.show_logline,
            genre: data.show.blueprint?.genre,
            libraryPosterUrl: data.assets?.libraryPoster,
            posterUrl: data.assets?.poster,
            showFormat: data.show.showFormat,
            episodes: data.show.episodes,
            characterSeeds: data.show.characterSeeds,
          });
          // Also get portrait grid for image generation
          if (data.assets?.portraitGrid) {
            setPortraitGridUrl(data.assets.portraitGrid);
          }
          // Load saved episode stills
          if (data.show.episodeStills) {
            // Convert string keys to numbers for our state
            const stills: Record<number, Record<string, string>> = {};
            Object.entries(data.show.episodeStills).forEach(([epNum, sections]) => {
              stills[parseInt(epNum)] = sections as Record<string, string>;
            });
            setGeneratedStills(stills);
          }
          // Load saved episode clips (videos)
          if (data.show.episodeClips) {
            const clips: Record<number, Record<string, string>> = {};
            Object.entries(data.show.episodeClips).forEach(([epNum, sections]) => {
              clips[parseInt(epNum)] = sections as Record<string, string>;
            });
            setGeneratedClips(clips);
          }
        }
      } catch (error) {
        console.error("Failed to fetch show:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchShow();
  }, [showId]);

  const getEpisodeTypeStyle = (type: string) => {
    const normalizedType = type.toLowerCase().replace(/\s+/g, "-");
    return EPISODE_TYPE_COLORS[normalizedType] || EPISODE_TYPE_COLORS.default;
  };

  const getCharacterName = (charId: string) => {
    const char = showData?.characterSeeds?.find(c => c.id === charId);
    return char?.name || charId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getEpisodeStatus = (episodeNum: number): EpisodeStatus => {
    return episodeStatuses[episodeNum] || {
      storyboard: "pending",
      keyframes: "pending",
      videos: "pending",
    };
  };

  // Define the section order and get previous scene for continuity
  const getSectionContext = (sectionLabel: string) => {
    if (!currentEpisode) return { previousScene: undefined };
    
    const sections = [
      { label: "TEASER", description: currentEpisode.cold_open_hook },
      { label: "ACT 1", description: currentEpisode.a_plot },
      { label: "ACT 2", description: currentEpisode.b_plot || "Complications arise..." },
      { label: "ACT 3", description: currentEpisode.act_3_crisis || "Crisis point and confrontation" },
      { label: "ACT 4", description: currentEpisode.cliffhanger_or_button },
      { label: "TAG", description: currentEpisode.tag_scene || "Final comedic or emotional beat" },
    ];
    
    const currentIndex = sections.findIndex(s => s.label === sectionLabel);
    const previousScene = currentIndex > 0 ? sections[currentIndex - 1].description : undefined;
    
    return { previousScene };
  };

  // Get character names from characterSeeds
  const getCharacterNames = (): string[] => {
    if (!showData?.characterSeeds) return [];
    return showData.characterSeeds
      .map((char: { name?: string }) => char.name)
      .filter((name: string | undefined): name is string => !!name);
  };

  // Current episode - needed for prompt building
  const currentEpisode = showData?.episodes?.[selectedEpisode];

  // Build image prompt for a section
  const buildImagePrompt = useCallback((sectionLabel: string, sectionDescription: string) => {
    if (!currentEpisode || !showData) return "";
    
    const characterNames = getCharacterNames();
    const { previousScene } = getSectionContext(sectionLabel);
    
    const characterString = characterNames.length > 0 
      ? `Characters in this scene: ${characterNames.join(", ")}.` 
      : "";
    
    const settingNote = showData.genre 
      ? `Setting: A ${showData.genre.toLowerCase()} TV series.` 
      : "";
    
    const continuityNote = previousScene 
      ? `CONTINUITY: This follows from "${previousScene.slice(0, 100)}..."` 
      : "";
    
    const prompt = portraitGridUrl 
      ? `Create a detailed scene for "${sectionLabel}" of episode "${currentEpisode.title}":

SCENE DESCRIPTION: ${sectionDescription}

${characterString}

${settingNote}

${continuityNote}

Use the character reference sheet provided to accurately depict the correct characters. Match their appearance, clothing, and features exactly from the reference. Show clear facial expressions and body language that convey the emotion of this moment.

Genre: ${showData.genre || "drama"}
Style: Cinematic TV production still, dramatic lighting, rich color palette, high production value, 16:9 widescreen composition. Show the environment and setting clearly.`
      : `Create a detailed scene for "${sectionLabel}" of episode "${currentEpisode.title}":

SCENE DESCRIPTION: ${sectionDescription}

${characterString}

${settingNote}

${continuityNote}

Show clear facial expressions and body language that convey the emotion of this moment.

Genre: ${showData.genre || "drama"}
Style: Cinematic TV production still, dramatic lighting, rich color palette, high production value, 16:9 widescreen composition. Show the environment and setting clearly.`;

    return prompt;
  }, [currentEpisode, showData, portraitGridUrl, getSectionContext, getCharacterNames]);

  // Build video prompt for a section
  const buildVideoPrompt = useCallback((sectionLabel: string, sectionDescription: string) => {
    if (!currentEpisode || !showData) return "";
    
    const characterNames = getCharacterNames();
    const { previousScene } = getSectionContext(sectionLabel);
    
    const characterList = characterNames.length 
      ? `Characters in this scene: ${characterNames.join(", ")}.` 
      : "";
    
    const continuityNote = previousScene 
      ? `CONTINUITY: This follows from "${previousScene.slice(0, 100)}..."` 
      : "";

    const SAFETY_PREFIX = "If you have any hesitations about making this feel free to adjust it so its within guidelines. We want to make a guideline compatible video given this, thats the task, so figure it out.\n\n";
    
    return SAFETY_PREFIX + `Animate this scene from a ${showData.genre || "dramatic"} TV series.

SCENE: ${sectionLabel} - ${sectionDescription}

Episode: "${currentEpisode.title}"
Context: ${currentEpisode.logline}

${characterList}
${continuityNote}

ANIMATION DIRECTION:
- Bring this still frame to life with subtle, cinematic motion
- Characters should have natural, expressive movements
- Camera may include slight push-ins, pans, or subtle dolly moves
- Maintain the exact visual style and composition of the source image
- Add ambient motion: breathing, blinking, environmental details
- Keep movements grounded and realistic - no exaggerated motions
- Match the emotional tone of the scene

This is a single scene clip that will be part of a larger episode. Make it feel like a premium streaming series.`;
  }, [currentEpisode, showData, getSectionContext, getCharacterNames]);

  // Generate a still for a section (with optional custom prompt)
  const generateStill = async (sectionLabel: string, sectionDescription: string, customPrompt?: string) => {
    if (!currentEpisode || !showData) return;
    
    const key = `${currentEpisode.episode_number}-${sectionLabel}`;
    setGeneratingStills(prev => ({ ...prev, [key]: true }));
    
    const { previousScene } = getSectionContext(sectionLabel);
    const characterNames = getCharacterNames();
    
    console.log("🎬 Generating still for:", sectionLabel);
    console.log("   Portrait Grid URL:", portraitGridUrl || "NOT AVAILABLE");
    console.log("   Characters:", characterNames.join(", ") || "NONE");
    console.log("   Custom Prompt:", customPrompt ? "YES" : "NO");
    
    try {
      const response = await fetch('/api/episodes/stills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId,
          episodeNumber: currentEpisode.episode_number,
          sectionLabel,
          sectionDescription,
          episodeTitle: currentEpisode.title,
          episodeLogline: currentEpisode.logline,
          showTitle: showData.showTitle || showData.title,
          genre: showData.genre,
          characterGridUrl: portraitGridUrl,
          characterNames,
          previousScene,
          customPrompt, // Pass custom prompt if provided
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          // Add cache-busting parameter to force browser to load new image
          const cacheBustedUrl = `${data.imageUrl}?t=${Date.now()}`;
          setGeneratedStills(prev => ({
            ...prev,
            [currentEpisode.episode_number]: {
              ...(prev[currentEpisode.episode_number] || {}),
              [sectionLabel]: cacheBustedUrl,
            },
          }));
        }
      } else {
        console.error('Failed to generate still');
      }
    } catch (error) {
      console.error('Error generating still:', error);
    } finally {
      setGeneratingStills(prev => ({ ...prev, [key]: false }));
    }
  };

  // Generate still with custom prompt wrapper
  const generateStillWithPrompt = useCallback((sectionLabel: string, sectionDescription: string) => {
    return (customPrompt: string) => {
      generateStill(sectionLabel, sectionDescription, customPrompt);
    };
  }, [generateStill]);

  // Update video generation status
  const updateVideoStatus = useCallback((key: string, updates: Partial<VideoGenerationStatus>) => {
    setVideoGenerationStatuses(prev => {
      const idx = prev.findIndex(s => s.key === key);
      if (idx === -1) return prev;
      const newStatuses = [...prev];
      newStatuses[idx] = { ...newStatuses[idx], ...updates };
      return newStatuses;
    });
  }, []);

  // Add a new video generation status
  const addVideoStatus = useCallback((status: VideoGenerationStatus) => {
    setVideoGenerationStatuses(prev => {
      // Remove any existing status with the same key
      const filtered = prev.filter(s => s.key !== status.key);
      return [...filtered, status];
    });
  }, []);

  // Remove a video generation status
  const removeVideoStatus = useCallback((key: string) => {
    setVideoGenerationStatuses(prev => prev.filter(s => s.key !== key));
  }, []);

  // Generate a video clip from a still image (with optional custom prompt)
  const generateClip = async (sectionLabel: string, sectionDescription: string, epNumber?: number, customPrompt?: string) => {
    const episodeNum = epNumber || currentEpisode?.episode_number;
    if (!episodeNum || !showData) return;
    
    const episode = showData.episodes?.find(e => e.episode_number === episodeNum);
    if (!episode) return;
    
    // Need the still image URL to generate video
    const stillUrl = generatedStills[episodeNum]?.[sectionLabel];
    if (!stillUrl) {
      console.error("No still image available to generate video from");
      // Show error in status panel
      const key = `${episodeNum}-${sectionLabel}`;
      addVideoStatus({
        key,
        episodeNumber: episodeNum,
        sectionLabel,
        status: "failed",
        error: "No still image available. Generate a still first.",
        startTime: Date.now(),
      });
      return;
    }
    
    const key = `${episodeNum}-${sectionLabel}`;
    setGeneratingClips(prev => ({ ...prev, [key]: true }));
    
    // Add to status tracking
    addVideoStatus({
      key,
      episodeNumber: episodeNum,
      sectionLabel,
      status: "starting",
      startTime: Date.now(),
    });
    
    const { previousScene } = getSectionContext(sectionLabel);
    const characterNames = getCharacterNames();
    
    console.log("🎬 Generating clip for:", sectionLabel);
    console.log("   Still Image URL:", stillUrl);
    console.log("   Custom Prompt:", customPrompt ? "YES" : "NO");
    
    try {
      // Update status to processing (API will do the actual work)
      updateVideoStatus(key, { status: "processing" });
      
      const response = await fetch('/api/episodes/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId,
          episodeNumber: episodeNum,
          sectionLabel,
          sectionDescription,
          episodeTitle: episode.title,
          episodeLogline: episode.logline,
          genre: showData.genre,
          stillImageUrl: stillUrl.split('?')[0], // Remove cache bust param
          characterNames,
          previousScene,
          customPrompt, // Pass custom prompt if provided
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.videoUrl) {
          // Add cache-busting parameter
          const cacheBustedUrl = `${data.videoUrl}?t=${Date.now()}`;
          setGeneratedClips(prev => ({
            ...prev,
            [episodeNum]: {
              ...(prev[episodeNum] || {}),
              [sectionLabel]: cacheBustedUrl,
            },
          }));
          
          // Update status to succeeded (include attempts if > 1)
          updateVideoStatus(key, { 
            status: "succeeded", 
            model: data.model || "veo-3.1",
            attempts: data.attempts || 1,
          });
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to generate clip:', errorData.error);
        
        // Update status to failed (include attempts info)
        updateVideoStatus(key, { 
          status: "failed", 
          error: errorData.error || "Failed to generate video",
          attempts: errorData.attempts || 1,
        });
      }
    } catch (error) {
      console.error('Error generating clip:', error);
      
      // Update status to failed
      updateVideoStatus(key, { 
        status: "failed", 
        error: error instanceof Error ? error.message : "Network error occurred"
      });
    } finally {
      setGeneratingClips(prev => ({ ...prev, [key]: false }));
    }
  };

  // Generate video with custom prompt wrapper
  const generateClipWithPrompt = useCallback((sectionLabel: string, sectionDescription: string) => {
    return (customPrompt: string) => {
      generateClip(sectionLabel, sectionDescription, undefined, customPrompt);
    };
  }, [generateClip]);

  // Retry a failed video generation
  const retryVideoGeneration = useCallback((key: string) => {
    const status = videoGenerationStatuses.find(s => s.key === key);
    if (!status) return;
    
    // Get the section description
    const episode = showData?.episodes?.find(e => e.episode_number === status.episodeNumber);
    if (!episode) return;
    
    const sectionDescriptions: Record<string, string> = {
      "TEASER": episode.cold_open_hook,
      "ACT 1": episode.a_plot,
      "ACT 2": episode.b_plot || "Complications arise...",
      "ACT 3": episode.act_3_crisis || "Crisis point and confrontation",
      "ACT 4": episode.cliffhanger_or_button,
      "TAG": episode.tag_scene || "Final comedic or emotional beat",
    };
    
    const description = sectionDescriptions[status.sectionLabel];
    if (description) {
      generateClip(status.sectionLabel, description, status.episodeNumber);
    }
  }, [videoGenerationStatuses, showData]);

  const posterUrl = showData?.libraryPosterUrl || showData?.posterUrl;
  const currentStills = currentEpisode ? generatedStills[currentEpisode.episode_number] || {} : {};
  const currentClips = currentEpisode ? generatedClips[currentEpisode.episode_number] || {} : {};

  // Generate all scenes for current episode
  const generateAllScenes = async () => {
    if (!currentEpisode || !showData) return;
    
    const sections = [
      { label: "TEASER", description: currentEpisode.cold_open_hook },
      { label: "ACT 1", description: currentEpisode.a_plot },
      { label: "ACT 2", description: currentEpisode.b_plot || "Complications arise..." },
      { label: "ACT 3", description: currentEpisode.act_3_crisis || "Crisis point and confrontation" },
      { label: "ACT 4", description: currentEpisode.cliffhanger_or_button },
      { label: "TAG", description: currentEpisode.tag_scene || "Final comedic or emotional beat" },
    ];
    
    // Generate all in parallel
    await Promise.all(
      sections.map(({ label, description }) => generateStill(label, description))
    );
  };

  // Check if any scene is currently generating
  const isAnyGenerating = currentEpisode 
    ? Object.keys(generatingStills).some(key => 
        key.startsWith(`${currentEpisode.episode_number}-`) && generatingStills[key]
      )
    : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar variant="solid" />
        </div>
        <div className="flex items-center justify-center min-h-screen pt-16">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-foreground/60">Loading episode data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!showData || !showData.episodes || showData.episodes.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar variant="solid" />
        </div>
        <div className="flex items-center justify-center min-h-screen pt-16">
          <div className="text-center">
            <Clapperboard className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Episodes Found</h2>
            <p className="text-foreground/60 mb-6">This show doesn&apos;t have episode loglines yet.</p>
            <Link href="/console">
              <Button>Go to Console</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar variant="solid" />
      </div>

      {/* Video Generation Status Panel */}
      <VideoGenerationPanel
        activeGenerations={videoGenerationStatuses}
        onDismiss={removeVideoStatus}
        onRetry={retryVideoGeneration}
      />

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Page Content */}
      <div className="pt-14 lg:pt-16">
        <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
          
          {/* Sidebar - Hidden on mobile, visible on desktop */}
        <aside 
          className={cn(
              "fixed lg:sticky top-14 lg:top-16 left-0 h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem)] z-40 flex flex-col border-r border-white/10 bg-black/95 lg:bg-black/50 backdrop-blur-xl transition-all duration-300 ease-in-out",
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
              sidebarCollapsed ? "lg:w-14" : "w-64 lg:w-56"
          )}
        >
          {/* Sidebar Header */}
            <div className="flex items-center justify-between h-10 px-2.5 border-b border-white/10">
              <div className="flex items-center gap-1.5 min-w-0">
                <Clapperboard className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="font-medium text-xs truncate">Episodes</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hidden lg:flex"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="h-3 w-3" />
                  ) : (
                    <PanelLeftClose className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 lg:hidden"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
          </div>

          {/* Show Poster & Info */}
            {!sidebarCollapsed && (
              <div className="p-2.5 border-b border-white/10">
                <div className="flex gap-2">
            {posterUrl ? (
                    <div className="relative w-12 h-[72px] flex-shrink-0 overflow-hidden rounded-md border border-white/10 shadow-md">
                <Image
                  src={posterUrl}
                  alt={showData.showTitle || showData.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
                    <div className="w-12 h-[72px] flex-shrink-0 flex items-center justify-center rounded-md border border-white/10 bg-gradient-to-br from-primary/10 to-violet-500/10">
                      <Film className="h-5 w-5 text-foreground/30" />
              </div>
            )}
                  <div className="min-w-0 flex-1">
                <h2 className="font-medium text-xs line-clamp-2 leading-tight">
                  {showData.showTitle || showData.title}
                </h2>
                {showData.genre && (
                      <p className="text-[9px] uppercase tracking-wider text-foreground/50 mt-0.5">{showData.genre}</p>
                )}
                    <Badge variant="outline" className="text-[8px] h-4 px-1 mt-1">
                      {showData.episodes.length} eps
                    </Badge>
                  </div>
                </div>
              </div>
            )}

          {/* Navigation Links */}
            <div className="p-1.5 border-b border-white/10 space-y-0.5">
                <Link href={`/show/${showId}`}>
                  <Button
                    variant="ghost"
                    className={cn(
                    "w-full justify-start gap-1.5 text-foreground/70 hover:text-foreground h-7 text-[11px]",
                      sidebarCollapsed && "justify-center px-1.5"
                    )}
                    size="sm"
                  >
                  <Home className="h-3 w-3 flex-shrink-0" />
                    {!sidebarCollapsed && <span>Show Page</span>}
                  </Button>
                </Link>
                <Link href="/episodes">
                  <Button
                    variant="ghost"
                    className={cn(
                    "w-full justify-start gap-1.5 text-foreground/70 hover:text-foreground h-7 text-[11px]",
                      sidebarCollapsed && "justify-center px-1.5"
                    )}
                    size="sm"
                  >
                  <ArrowLeft className="h-3 w-3 flex-shrink-0" />
                    {!sidebarCollapsed && <span>All Shows</span>}
                  </Button>
                </Link>
            </div>

          {/* Episode List */}
          <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-0.5">
              {showData.episodes.map((episode, index) => {
                const isSelected = selectedEpisode === index;
                const isPilot = episode.episode_number === 1;
                const typeStyle = getEpisodeTypeStyle(episode.episode_type);
                const status = getEpisodeStatus(episode.episode_number);
                const isComplete = status.storyboard === "complete" && status.keyframes === "complete" && status.videos === "complete";
                
                return (
                      <button
                      key={index}
                      onClick={() => {
                        setSelectedEpisode(index);
                        setMobileSidebarOpen(false);
                      }}
                        className={cn(
                          "w-full text-left rounded-md border transition-all duration-200",
                        sidebarCollapsed ? "p-1.5 flex items-center justify-center" : "p-2",
                          isSelected
                          ? "bg-primary/15 border-primary/30"
                          : "bg-white/5 border-transparent hover:bg-white/10"
                        )}
                      >
                        {sidebarCollapsed ? (
                        <div className={cn(
                          "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold",
                          isSelected ? "bg-primary/30 text-primary" : "bg-white/10 text-foreground/60"
                        )}>
                          {isComplete ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          ) : (
                            episode.episode_number
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold",
                            isSelected ? "bg-primary/30 text-primary" : "bg-white/10 text-foreground/60"
                          )}>
                            {isComplete ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              ) : (
                                episode.episode_number
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-0.5 mb-0.5">
                                {isPilot && (
                                  <span className="text-[7px] px-0.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">P</span>
                                )}
                              <span className={cn("text-[7px] px-0.5 py-0.5 rounded font-medium", typeStyle.bg, typeStyle.text)}>
                                  {episode.episode_type.split('-')[0]}
                                </span>
                              </div>
                              <p className={cn(
                              "text-[10px] font-medium line-clamp-1",
                                isSelected ? "text-foreground" : "text-foreground/70"
                              )}>
                                {episode.title}
                              </p>
                            </div>
                          </div>
                        )}
                      </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
          <main className={cn(
            "flex-1 flex flex-col min-w-0",
            !sidebarCollapsed && "lg:ml-0"
          )}>
          {/* Top Bar */}
            <header className="sticky top-14 lg:top-16 z-30 h-10 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 lg:hidden"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <Menu className="h-3.5 w-3.5" />
                </Button>
              {currentEpisode && (
                <>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-foreground/50">S01</span>
                      <span className="text-xs font-bold">E{currentEpisode.episode_number}</span>
                  </div>
                    <Separator orientation="vertical" className="h-3" />
                    <h1 className="text-xs font-medium truncate max-w-[180px] sm:max-w-none">
                      {currentEpisode.title}
                  </h1>
                </>
              )}
            </div>
              <div className="flex items-center gap-1">
              <Badge className={cn(
                  "text-[9px] h-4",
                getEpisodeTypeStyle(currentEpisode?.episode_type || "").bg,
                getEpisodeTypeStyle(currentEpisode?.episode_type || "").text,
                "border",
                getEpisodeTypeStyle(currentEpisode?.episode_type || "").border
              )}>
                {currentEpisode?.episode_type}
              </Badge>
              {currentEpisode?.episode_number === 1 && (
                  <Badge className="text-[9px] h-4 bg-amber-500/20 text-amber-400 border-amber-500/30">PILOT</Badge>
              )}
            </div>
          </header>

          {/* Content Area - Storyboard */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 sm:p-4 space-y-3">
              {currentEpisode && (
                <>
                  {/* Episode Logline - Compact */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs text-foreground/70 leading-relaxed">{currentEpisode.logline}</p>
                  </div>

                  {/* Generate All Button */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-medium text-foreground/70">Storyboard Scenes</h2>
                    <Button
                      onClick={generateAllScenes}
                      disabled={isAnyGenerating}
                      size="sm"
                      className="gap-1.5 h-7 text-[11px] px-3"
                    >
                      {isAnyGenerating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Generate All
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Storyboard Sections - 2 Column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <StoryboardSection
                      label="TEASER"
                      description={currentEpisode.cold_open_hook}
                      color="amber"
                      icon={<Zap className="h-4 w-4" />}
                      imageUrl={currentStills["TEASER"]}
                      videoUrl={currentClips["TEASER"]}
                      isGenerating={generatingStills[`${currentEpisode.episode_number}-TEASER`]}
                      isGeneratingVideo={generatingClips[`${currentEpisode.episode_number}-TEASER`]}
                      videoStatus={videoGenerationStatuses.find(s => s.key === `${currentEpisode.episode_number}-TEASER`)}
                      imagePrompt={buildImagePrompt("TEASER", currentEpisode.cold_open_hook)}
                      videoPrompt={buildVideoPrompt("TEASER", currentEpisode.cold_open_hook)}
                      onGenerate={() => generateStill("TEASER", currentEpisode.cold_open_hook)}
                      onGenerateVideo={() => generateClip("TEASER", currentEpisode.cold_open_hook)}
                      onGenerateWithPrompt={generateStillWithPrompt("TEASER", currentEpisode.cold_open_hook)}
                      onGenerateVideoWithPrompt={generateClipWithPrompt("TEASER", currentEpisode.cold_open_hook)}
                    />
                    <StoryboardSection
                      label="ACT 1"
                      description={currentEpisode.a_plot}
                      color="blue"
                      icon={<Play className="h-4 w-4" />}
                      imageUrl={currentStills["ACT 1"]}
                      videoUrl={currentClips["ACT 1"]}
                      isGenerating={generatingStills[`${currentEpisode.episode_number}-ACT 1`]}
                      isGeneratingVideo={generatingClips[`${currentEpisode.episode_number}-ACT 1`]}
                      videoStatus={videoGenerationStatuses.find(s => s.key === `${currentEpisode.episode_number}-ACT 1`)}
                      imagePrompt={buildImagePrompt("ACT 1", currentEpisode.a_plot)}
                      videoPrompt={buildVideoPrompt("ACT 1", currentEpisode.a_plot)}
                      onGenerate={() => generateStill("ACT 1", currentEpisode.a_plot)}
                      onGenerateVideo={() => generateClip("ACT 1", currentEpisode.a_plot)}
                      onGenerateWithPrompt={generateStillWithPrompt("ACT 1", currentEpisode.a_plot)}
                      onGenerateVideoWithPrompt={generateClipWithPrompt("ACT 1", currentEpisode.a_plot)}
                    />
                    <StoryboardSection
                      label="ACT 2"
                      description={currentEpisode.b_plot || "Complications arise..."}
                      color="emerald"
                      icon={<Target className="h-4 w-4" />}
                      imageUrl={currentStills["ACT 2"]}
                      videoUrl={currentClips["ACT 2"]}
                      isGenerating={generatingStills[`${currentEpisode.episode_number}-ACT 2`]}
                      isGeneratingVideo={generatingClips[`${currentEpisode.episode_number}-ACT 2`]}
                      videoStatus={videoGenerationStatuses.find(s => s.key === `${currentEpisode.episode_number}-ACT 2`)}
                      imagePrompt={buildImagePrompt("ACT 2", currentEpisode.b_plot || "Complications arise...")}
                      videoPrompt={buildVideoPrompt("ACT 2", currentEpisode.b_plot || "Complications arise...")}
                      onGenerate={() => generateStill("ACT 2", currentEpisode.b_plot || "Complications arise...")}
                      onGenerateVideo={() => generateClip("ACT 2", currentEpisode.b_plot || "Complications arise...")}
                      onGenerateWithPrompt={generateStillWithPrompt("ACT 2", currentEpisode.b_plot || "Complications arise...")}
                      onGenerateVideoWithPrompt={generateClipWithPrompt("ACT 2", currentEpisode.b_plot || "Complications arise...")}
                    />
                    <StoryboardSection
                      label="ACT 3"
                      description={currentEpisode.act_3_crisis || "Crisis point and confrontation"}
                      color="rose"
                      icon={<Zap className="h-4 w-4" />}
                      imageUrl={currentStills["ACT 3"]}
                      videoUrl={currentClips["ACT 3"]}
                      isGenerating={generatingStills[`${currentEpisode.episode_number}-ACT 3`]}
                      isGeneratingVideo={generatingClips[`${currentEpisode.episode_number}-ACT 3`]}
                      videoStatus={videoGenerationStatuses.find(s => s.key === `${currentEpisode.episode_number}-ACT 3`)}
                      imagePrompt={buildImagePrompt("ACT 3", currentEpisode.act_3_crisis || "Crisis point and confrontation")}
                      videoPrompt={buildVideoPrompt("ACT 3", currentEpisode.act_3_crisis || "Crisis point and confrontation")}
                      onGenerate={() => generateStill("ACT 3", currentEpisode.act_3_crisis || "Crisis point and confrontation")}
                      onGenerateVideo={() => generateClip("ACT 3", currentEpisode.act_3_crisis || "Crisis point and confrontation")}
                      onGenerateWithPrompt={generateStillWithPrompt("ACT 3", currentEpisode.act_3_crisis || "Crisis point and confrontation")}
                      onGenerateVideoWithPrompt={generateClipWithPrompt("ACT 3", currentEpisode.act_3_crisis || "Crisis point and confrontation")}
                    />
                    <StoryboardSection
                      label="ACT 4"
                      description={currentEpisode.cliffhanger_or_button}
                      color="violet"
                      icon={<Sparkles className="h-4 w-4" />}
                      imageUrl={currentStills["ACT 4"]}
                      videoUrl={currentClips["ACT 4"]}
                      isGenerating={generatingStills[`${currentEpisode.episode_number}-ACT 4`]}
                      isGeneratingVideo={generatingClips[`${currentEpisode.episode_number}-ACT 4`]}
                      videoStatus={videoGenerationStatuses.find(s => s.key === `${currentEpisode.episode_number}-ACT 4`)}
                      imagePrompt={buildImagePrompt("ACT 4", currentEpisode.cliffhanger_or_button)}
                      videoPrompt={buildVideoPrompt("ACT 4", currentEpisode.cliffhanger_or_button)}
                      onGenerate={() => generateStill("ACT 4", currentEpisode.cliffhanger_or_button)}
                      onGenerateVideo={() => generateClip("ACT 4", currentEpisode.cliffhanger_or_button)}
                      onGenerateWithPrompt={generateStillWithPrompt("ACT 4", currentEpisode.cliffhanger_or_button)}
                      onGenerateVideoWithPrompt={generateClipWithPrompt("ACT 4", currentEpisode.cliffhanger_or_button)}
                    />
                    <StoryboardSection
                      label="TAG"
                      description={currentEpisode.tag_scene || "Final comedic or emotional beat"}
                      color="slate"
                      icon={<Film className="h-4 w-4" />}
                      imageUrl={currentStills["TAG"]}
                      videoUrl={currentClips["TAG"]}
                      isGenerating={generatingStills[`${currentEpisode.episode_number}-TAG`]}
                      isGeneratingVideo={generatingClips[`${currentEpisode.episode_number}-TAG`]}
                      videoStatus={videoGenerationStatuses.find(s => s.key === `${currentEpisode.episode_number}-TAG`)}
                      imagePrompt={buildImagePrompt("TAG", currentEpisode.tag_scene || "Final comedic or emotional beat")}
                      videoPrompt={buildVideoPrompt("TAG", currentEpisode.tag_scene || "Final comedic or emotional beat")}
                      onGenerate={() => generateStill("TAG", currentEpisode.tag_scene || "Final comedic or emotional beat")}
                      onGenerateVideo={() => generateClip("TAG", currentEpisode.tag_scene || "Final comedic or emotional beat")}
                      onGenerateWithPrompt={generateStillWithPrompt("TAG", currentEpisode.tag_scene || "Final comedic or emotional beat")}
                      onGenerateVideoWithPrompt={generateClipWithPrompt("TAG", currentEpisode.tag_scene || "Final comedic or emotional beat")}
                    />
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </main>
        </div>
      </div>
    </div>
  );
}
