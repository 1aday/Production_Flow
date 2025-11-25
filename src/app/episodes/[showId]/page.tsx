"use client";

import { useEffect, useState, use } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { type Episode } from "@/components/EpisodeCards";
import { type ShowFormat } from "@/components/ShowFormatVisualizer";
import { Navbar } from "@/components/Navbar";

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
  icon 
}: { 
  label: string; 
  description: string; 
  color: keyof typeof STORYBOARD_COLORS;
  icon: React.ReactNode;
}) {
  const colors = STORYBOARD_COLORS[color];
  
  return (
    <div className={cn("rounded-xl border p-4", colors.bg, colors.border)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors.icon, colors.text)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className={cn("text-xs font-bold tracking-wider", colors.text)}>{label}</span>
          <p className="text-xs text-foreground/50 line-clamp-1 mt-0.5">{description}</p>
        </div>
      </div>
      
      {/* 4 Image Placeholders */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((num) => (
          <button
            key={num}
            className="group aspect-video rounded-lg border-2 border-dashed border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/40 transition-all flex flex-col items-center justify-center gap-1"
          >
            <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
              <Plus className="h-3 w-3 text-foreground/30 group-hover:text-foreground/50" />
            </div>
            <span className="text-[9px] text-foreground/30 group-hover:text-foreground/50">Shot {num}</span>
          </button>
        ))}
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

  const currentEpisode = showData?.episodes?.[selectedEpisode];
  const posterUrl = showData?.libraryPosterUrl || showData?.posterUrl;

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

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Page Content */}
      <div className="pt-16 lg:pt-20">
        <div className="flex min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)]">
          
          {/* Sidebar - Hidden on mobile, visible on desktop */}
          <aside 
            className={cn(
              "fixed lg:sticky top-16 lg:top-20 left-0 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] z-40 flex flex-col border-r border-white/10 bg-black/95 lg:bg-black/50 backdrop-blur-xl transition-all duration-300 ease-in-out",
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
              sidebarCollapsed ? "lg:w-16" : "w-72 lg:w-64"
            )}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between h-12 px-3 border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <Clapperboard className="h-4 w-4 text-primary flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="font-medium text-sm truncate">Episodes</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hidden lg:flex"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="h-3.5 w-3.5" />
                  ) : (
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 lg:hidden"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Show Poster & Info */}
            {!sidebarCollapsed && (
              <div className="p-3 border-b border-white/10">
                <div className="flex gap-3">
                  {posterUrl ? (
                    <div className="relative w-16 h-24 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 shadow-lg">
                      <Image
                        src={posterUrl}
                        alt={showData.showTitle || showData.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-24 flex-shrink-0 flex items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-primary/10 to-violet-500/10">
                      <Film className="h-6 w-6 text-foreground/30" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 py-1">
                    <h2 className="font-semibold text-sm line-clamp-2 leading-tight">
                      {showData.showTitle || showData.title}
                    </h2>
                    {showData.genre && (
                      <p className="text-[10px] uppercase tracking-wider text-foreground/50 mt-1">{showData.genre}</p>
                    )}
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 mt-2">
                      {showData.episodes.length} eps
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="p-2 border-b border-white/10 space-y-1">
              <Link href={`/show/${showId}`}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 text-foreground/70 hover:text-foreground h-8 text-xs",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                  size="sm"
                >
                  <Home className="h-3.5 w-3.5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Show Page</span>}
                </Button>
              </Link>
              <Link href="/episodes">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 text-foreground/70 hover:text-foreground h-8 text-xs",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                  size="sm"
                >
                  <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>All Shows</span>}
                </Button>
              </Link>
            </div>

            {/* Episode List */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
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
                        "w-full text-left rounded-lg border transition-all duration-200",
                        sidebarCollapsed ? "p-2 flex items-center justify-center" : "p-2.5",
                        isSelected
                          ? "bg-primary/15 border-primary/30"
                          : "bg-white/5 border-transparent hover:bg-white/10"
                      )}
                    >
                      {sidebarCollapsed ? (
                        <div className={cn(
                          "w-7 h-7 rounded flex items-center justify-center text-xs font-bold",
                          isSelected ? "bg-primary/30 text-primary" : "bg-white/10 text-foreground/60"
                        )}>
                          {isComplete ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            episode.episode_number
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs font-bold",
                            isSelected ? "bg-primary/30 text-primary" : "bg-white/10 text-foreground/60"
                          )}>
                            {isComplete ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              episode.episode_number
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              {isPilot && (
                                <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">P</span>
                              )}
                              <span className={cn("text-[8px] px-1 py-0.5 rounded font-medium", typeStyle.bg, typeStyle.text)}>
                                {episode.episode_type.split('-')[0]}
                              </span>
                            </div>
                            <p className={cn(
                              "text-[11px] font-medium line-clamp-1",
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
            <header className="sticky top-16 lg:top-20 z-30 h-12 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 lg:hidden"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                {currentEpisode && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-foreground/50">S01</span>
                      <span className="text-sm font-bold">E{currentEpisode.episode_number}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <h1 className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
                      {currentEpisode.title}
                    </h1>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Badge className={cn(
                  "text-[10px] h-5",
                  getEpisodeTypeStyle(currentEpisode?.episode_type || "").bg,
                  getEpisodeTypeStyle(currentEpisode?.episode_type || "").text,
                  "border",
                  getEpisodeTypeStyle(currentEpisode?.episode_type || "").border
                )}>
                  {currentEpisode?.episode_type}
                </Badge>
                {currentEpisode?.episode_number === 1 && (
                  <Badge className="text-[10px] h-5 bg-amber-500/20 text-amber-400 border-amber-500/30">PILOT</Badge>
                )}
              </div>
            </header>

          {/* Content Area - Storyboard */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 sm:p-6 space-y-4">
              {currentEpisode && (
                <>
                  {/* Episode Logline - Compact */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-foreground/70 leading-relaxed">{currentEpisode.logline}</p>
                  </div>

                  {/* Storyboard Sections */}
                  <div className="space-y-3">
                    {/* Teaser / Cold Open */}
                    <StoryboardSection
                      label="TEASER"
                      description={currentEpisode.cold_open_hook}
                      color="amber"
                      icon={<Zap className="h-4 w-4" />}
                    />

                    {/* Act 1 */}
                    <StoryboardSection
                      label="ACT 1"
                      description={currentEpisode.a_plot}
                      color="blue"
                      icon={<Play className="h-4 w-4" />}
                    />

                    {/* Act 2 */}
                    <StoryboardSection
                      label="ACT 2"
                      description={currentEpisode.b_plot || "Complications arise..."}
                      color="emerald"
                      icon={<Target className="h-4 w-4" />}
                    />

                    {/* Act 3 */}
                    <StoryboardSection
                      label="ACT 3"
                      description="Crisis point and confrontation"
                      color="rose"
                      icon={<Zap className="h-4 w-4" />}
                    />

                    {/* Act 4 */}
                    <StoryboardSection
                      label="ACT 4"
                      description={currentEpisode.cliffhanger_or_button}
                      color="violet"
                      icon={<Sparkles className="h-4 w-4" />}
                    />

                    {/* Tag */}
                    <StoryboardSection
                      label="TAG"
                      description="Final comedic or emotional beat"
                      color="slate"
                      icon={<Film className="h-4 w-4" />}
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
