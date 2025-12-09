"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  ArrowLeft,
  Share2,
  Palette,
  Camera,
  Film,
  Users,
  Sparkles,
  Download,
  CheckCircle2,
  MapPin,
  Lightbulb,
  Zap,
  Eye,
  Settings2,
  Monitor,
  Layers,
  Play,
  Pause,
  Info,
  Ruler,
  Weight,
  User,
  Shirt,
  Smile,
  Mic,
  Library,
  Volume2,
  VolumeX,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { calculateShowCompletion } from "@/lib/show-completion";
import { sanitizeText, getDisplayName } from "@/lib/text-utils";
import { getShowUrl } from "@/lib/slug";
import { ShowFormatVisualizer, type ShowFormat } from "@/components/ShowFormatVisualizer";
import { EpisodeCards, type Episode } from "@/components/EpisodeCards";
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

type ShowAssets = {
  portraits: string[];
  characterPortraits?: Record<string, string>;
  characterVideos?: Record<string, string[]>;
  poster?: string;
  trailer?: string;
  libraryPoster?: string;
  portraitGrid?: string;
};

type GeneratedContent = {
  hero_tagline: string;
  expanded_description: string[];
  character_highlights: Array<{ character_id: string; highlight: string }>;
  visual_identity: string;
  unique_features: string[];
  behind_the_scenes: string;
  episode_concepts?: Array<{ title: string; description: string }>;
  tone_keywords?: string[];
};

type CharacterSeed = {
  id: string;
  name: string;
  summary?: string;
  role: string;
  age?: number;
  description?: string;
  personality?: string[];
  vibe?: string;
};

type CharacterDoc = {
  character: string;
  metadata?: {
    role?: string;
    function?: string;
    tags?: string[];
  };
  character_details?: {
    species?: {
      type?: string;
      subtype?: string;
      visual_markers?: string;
      materiality?: string;
    };
    skin_color?: { hex: string; description: string };
    eye_color?: { hex: string; description: string };
    build?: { body_type?: string; notes?: string };
    voice?: {
      descriptors?: string[];
      pitch_range?: string;
      tempo?: string;
      timbre_notes?: string;
    };
    accent?: { style?: string; strength?: string };
    tics?: {
      motor?: string[];
      verbal?: string[];
      frequency?: string;
    };
  };
  look?: {
    silhouette?: string;
    palette?: {
      anchors?: string[];
      notes?: string;
    };
    surface?: {
      materials?: string;
      finish?: string;
      texture_rules?: string;
    };
    eyes?: {
      type?: string;
      catchlight_shape?: string;
      behaviors?: string[];
    };
    face_system?: {
      modularity?: string;
      mouths_phonemes?: string[];
      mouths_gag?: string[];
    };
    wardrobe?: {
      items?: string[];
      accessories?: string[];
      avoid?: string[];
    };
  };
  performance?: {
    pose_defaults?: string;
    expression_set?: string[];
    gestural_loops?: string[];
  };
  scene_presence?: {
    camera_override?: {
      lenses?: string[];
      framing?: string;
      movement?: string;
    };
    lighting_override?: {
      key?: string;
      fill?: string;
      edge?: string;
    };
  };
  showcase_scene_prompt?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Blueprint = Record<string, any>;

type ShowData = {
  id: string;
  title: string;
  showTitle?: string;
  blueprint: Blueprint;
  videoAspectRatio?: "portrait" | "landscape";
  characterSeeds?: CharacterSeed[];
  characterDocs?: Record<string, CharacterDoc>;
  showFormat?: ShowFormat;
  episodes?: Episode[];
};

export default function ShowPageClient({ showId }: { showId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [showData, setShowData] = useState<ShowData | null>(null);
  const [assets, setAssets] = useState<ShowAssets | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [trailerPlaying, setTrailerPlaying] = useState(false);
  const [trailerMuted, setTrailerMuted] = useState(true);
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null);
  const [completionStatus, setCompletionStatus] = useState<ReturnType<typeof calculateShowCompletion> | null>(null);
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>({});
  const [trailerReady, setTrailerReady] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Pause all other videos when one starts playing
  useEffect(() => {
    const handleVideoPlay = (e: Event) => {
      const target = e.target;
      // Only handle video elements
      if (!(target instanceof HTMLVideoElement)) return;
      
      const playingVideo = target;
      
      // Small delay to let the video actually start playing
      // Prevents the handler from pausing the video that just started
      setTimeout(() => {
        // Get all video elements on the page
        const allVideos = document.querySelectorAll('video');
        
        // Pause all other videos (not the one that triggered this)
        allVideos.forEach((video) => {
          if (video !== playingVideo && !video.paused) {
            video.pause();
          }
        });
      }, 100);
    };

    // Use event delegation at document level to catch all video play events
    // This works for dynamically added videos too
    document.addEventListener('play', handleVideoPlay, true); // true = capture phase

    // Cleanup
    return () => {
      document.removeEventListener('play', handleVideoPlay, true);
    };
  }, []); // Only run once on mount

  const loadShowData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/show/${showId}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.error("Show not found:", showId);
          // Wait a moment before redirecting in case of temporary issue
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try one more time before giving up
          const retryResponse = await fetch(`/api/show/${showId}`);
          if (!retryResponse.ok) {
            alert("Show not found. Redirecting to library...");
            router.push("/library");
            return;
          }
          // If retry succeeded, continue with retry response
          const retryData = await retryResponse.json();
          setShowData(retryData.show);
          setAssets(retryData.assets);
          
          const completion = calculateShowCompletion({
            characterSeeds: retryData.show.characterSeeds,
            characterDocs: retryData.show.characterDocs,
            characterPortraits: retryData.assets.characterPortraits,
            characterVideos: retryData.assets.characterVideos,
            posterUrl: retryData.assets.poster,
            libraryPosterUrl: retryData.assets.libraryPoster,
            portraitGridUrl: retryData.assets.portraitGrid,
            trailerUrl: retryData.assets.trailer,
          });
          setCompletionStatus(completion);
          return;
        }
        throw new Error(`Failed to load show: ${response.status}`);
      }

      const data = await response.json();
      setShowData(data.show);
      setAssets(data.assets);

      // Calculate completion status
      const completion = calculateShowCompletion({
        characterSeeds: data.show.characterSeeds,
        characterDocs: data.show.characterDocs,
        characterPortraits: data.assets.characterPortraits,
        characterVideos: data.assets.characterVideos,
        posterUrl: data.assets.poster,
        libraryPosterUrl: data.assets.libraryPoster,
        portraitGridUrl: data.assets.portraitGrid,
        trailerUrl: data.assets.trailer,
      });
      setCompletionStatus(completion);

      // Check if we already have generated content from the database
      if (data.show.generatedContent) {
        console.log("📦 Using cached generated content");
        setGeneratedContent(data.show.generatedContent);
      } else {
        // Generate content in background - don't block page load
        setGeneratingContent(true);
        fetch(`/api/show/${showId}/generate-content`, {
          method: "POST",
        })
          .then(res => res.ok ? res.json() : null)
          .then(contentData => {
            if (contentData?.content) {
              setGeneratedContent(contentData.content);
            }
          })
          .catch(err => console.warn("Failed to generate content:", err))
          .finally(() => setGeneratingContent(false));
      }
    } catch (error) {
      console.error("Error loading show:", error);
      // Don't redirect on error - just show alert and stay on page
      alert(`Failed to load show: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [showId, router]);

  useEffect(() => {
    void loadShowData();
  }, [loadShowData]);

  // Auto-hide controls after 3 seconds when playing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (trailerPlaying) {
      // Show controls initially
      setShowControls(true);
      
      // Hide after 3 seconds
      timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      // Show controls when paused
      setShowControls(true);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [trailerPlaying]);

  const copyShareUrl = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const downloadShow = async () => {
    try {
      const response = await fetch(`/api/show/${showId}/download`);
      if (!response.ok) throw new Error("Failed to download");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${showData?.showTitle || showData?.title || showId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download show:", error);
      alert("Failed to download show");
    }
  };

  const toggleTrailer = () => {
    const video = document.getElementById('trailer-video') as HTMLVideoElement;
    if (video) {
      if (trailerPlaying) {
        video.pause();
      } else {
        // Unmute when playing via button
        video.muted = false;
        setTrailerMuted(false);
        video.play();
      }
    }
  };

  const toggleTrailerAudio = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering play/pause
    const video = document.getElementById('trailer-video') as HTMLVideoElement;
    if (video) {
      video.muted = !video.muted;
      setTrailerMuted(video.muted);
    }
  };

  const continueProduction = () => {
    // Navigate directly to the console with the show ID in the URL
    const consoleUrl = getShowUrl({
      id: showId,
      title: showData?.title,
      showTitle: showData?.showTitle,
      blueprint: showData?.blueprint,
    }).replace('/show/', '/console/');
    router.push(consoleUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar variant="solid" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-foreground/60">Loading show...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!showData || !assets) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar variant="solid" />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-foreground/60">Show not found</p>
        </div>
      </div>
    );
  }

  const displayTitle = showData.showTitle || showData.blueprint?.show_title || showData.title;
  const logline = showData.blueprint?.show_logline || "";
  const productionStyle = showData.blueprint?.production_style;
  const visualAesthetics = showData.blueprint?.visual_aesthetics;
  const characters = showData.characterSeeds || [];
  const characterDocs = showData.characterDocs || {};
  const posterDesc = showData.blueprint?.poster_description;
  const videoAspectRatio = (showData.videoAspectRatio as "portrait" | "landscape") || "portrait";
  const isLandscapeVideo = videoAspectRatio === "landscape";
  const showPoster = Boolean(assets.libraryPoster || assets.poster);
  const uniquePortraits = Array.from(
    new Set(
      (assets.portraits ?? []).filter(
        (url): url is string => typeof url === "string" && url.length > 0
      )
    )
  );
  const previewPortraits = uniquePortraits.slice(0, 4);
  const extraPortraitCount = Math.max(0, uniquePortraits.length - previewPortraits.length);

  return (
    <div className="show-page min-h-screen bg-black text-foreground w-full overflow-x-hidden relative" style={{ margin: 0, padding: 0 }}>
      {/* Navbar */}
      <Navbar variant="solid" />

      {/* Show-specific action bar */}
      <div className="fixed top-[72px] left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-end px-3 py-2 sm:px-6">
          <div className="flex gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadShow}
              className="rounded-full text-xs sm:text-sm h-9 touch-manipulation px-3 sm:px-4"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={copyShareUrl}
              className="rounded-full text-xs sm:text-sm h-9 touch-manipulation px-3 sm:px-4"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Copied!</span>
                  <span className="sm:hidden">✓</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header + action bar */}
      <div className="h-[120px] sm:h-[120px]" />

      {/* Incomplete Show Banner */}
      {completionStatus && !completionStatus.isFullyComplete && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20">
          <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5 sm:gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-lg font-semibold text-amber-100 mb-1 leading-tight">
                    Production Incomplete ({completionStatus.completionPercentage}%)
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-200/80 mb-2 leading-relaxed">
                    This show is missing some assets. Continue production to complete it.
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {completionStatus.missingItems.map((item, i) => (
                      <Badge key={i} variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200 text-[10px] sm:text-xs px-2 py-0.5">
                        Missing: {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={continueProduction}
                size="default"
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-full shadow-lg hover:shadow-xl transition-all flex-shrink-0 w-full sm:w-auto text-sm min-h-[44px] touch-manipulation mt-2 sm:mt-0"
              >
                <PlayCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Continue Production
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Trailer */}
      {assets.trailer ? (
        <div
          className="media-frame relative overflow-hidden group w-full"
          style={{
            aspectRatio: '16 / 9',
            maxHeight: '75vh',
            position: 'relative',
            margin: '0 auto',
            padding: 0,
            boxSizing: 'border-box',
          }}
          onMouseEnter={() => setShowControls(true)}
          onMouseMove={() => setShowControls(true)}
        >
          <video
            id="trailer-video"
            src={assets.trailer}
            preload="metadata"
            playsInline
            controls
            onPlay={(e) => {
              const video = e.currentTarget;
              // Pause other videos
              pauseOtherVideos(video);
              // On first play, restart from beginning and unmute
              if (!trailerPlaying && video.currentTime > 0) {
                video.currentTime = 0;
              }
              // Unmute on play
              video.muted = false;
              setTrailerMuted(false);
              setTrailerPlaying(true);
            }}
            onPause={() => setTrailerPlaying(false)}
            onVolumeChange={(e) => setTrailerMuted(e.currentTarget.muted)}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              // Seek to 2 seconds for thumbnail, but don't play
              video.muted = true; // Mute initially for thumbnail
              video.currentTime = 2;
              video.pause(); // Ensure it doesn't autoplay
              setTrailerMuted(true);
            }}
            onSeeked={(e) => {
              const video = e.currentTarget;
              // Pause after seek to prevent autoplay
              if (!trailerReady && video.currentTime === 2) {
                video.pause();
                setTrailerReady(true);
              }
            }}
            className="absolute inset-0 w-full h-full object-contain transition-all duration-500"
            style={{ 
              backgroundColor: '#000',
            }}
          />
          
          {/* Subtle Play Button - Shows ONLY when not playing */}
          {!trailerPlaying && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                const video = document.getElementById('trailer-video') as HTMLVideoElement;
                if (video) {
                  video.play();
                }
              }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm shadow-xl transition-all active:scale-95 hover:scale-110 hover:bg-black/80 z-10 border-2 border-white/30 touch-manipulation cursor-pointer"
            >
              <Play className="ml-0.5 h-6 w-6 sm:h-7 sm:w-7 text-white pointer-events-none" />
            </div>
          )}

          {/* Pause Button - Shows on hover or for first 3 seconds */}
          {trailerPlaying && !trailerMuted && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                const video = document.getElementById('trailer-video') as HTMLVideoElement;
                if (video) {
                  video.pause();
                }
              }}
              onMouseEnter={() => setShowControls(true)}
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 items-center justify-center rounded-full bg-black/80 backdrop-blur-sm shadow-2xl transition-all active:scale-95 hover:scale-110 hover:bg-black/90 z-10 touch-manipulation cursor-pointer ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <Pause className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white pointer-events-none" />
            </div>
          )}

          {/* Audio Toggle Button - Auto-hides after 3 seconds, shows on hover */}
          {trailerPlaying && (
            <button
              onClick={toggleTrailerAudio}
              onMouseEnter={() => setShowControls(true)}
              className={`absolute top-3 right-3 sm:top-6 sm:right-6 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/80 backdrop-blur-sm shadow-xl transition-all active:scale-95 hover:scale-110 hover:bg-black/90 z-10 touch-manipulation ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              aria-label={trailerMuted ? "Unmute trailer" : "Mute trailer"}
            >
              {trailerMuted ? (
                <VolumeX className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              )}
            </button>
          )}
        </div>
      ) : assets.libraryPoster || assets.poster ? (
      <div className="media-frame relative overflow-hidden" style={{ height: '50vh', minHeight: '50vh', maxHeight: '70vh', position: 'relative', left: 0, right: 0 }}>
          <Image
            src={assets.libraryPoster || assets.poster || ""}
            alt={displayTitle}
            fill
            className="object-cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%', maxHeight: '100%', objectFit: 'cover', margin: 0, padding: 0 }}
            priority
            quality={95}
            sizes="100vw"
          />
          {/* Darkening overlay - Desktop only */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent hidden lg:block" />
          
          <div className="absolute bottom-12 sm:bottom-20 lg:bottom-24 left-0 right-0 px-3 sm:px-6 safe-area-inset-bottom">
            <div className="mx-auto max-w-7xl">
              <h1 className="font-sans text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-1 sm:mb-2 leading-tight">
                {displayTitle}
              </h1>
              {generatedContent?.hero_tagline && (
                <p className="text-sm sm:text-lg lg:text-xl xl:text-2xl text-foreground/90 max-w-3xl leading-relaxed">
                  {generatedContent.hero_tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
      <div className="media-frame relative overflow-hidden bg-gradient-to-br from-primary/20 to-transparent" style={{ minHeight: '40vh', maxHeight: '50vh' }}>
          <div className="absolute bottom-12 sm:bottom-20 lg:bottom-24 left-0 right-0 px-3 sm:px-6 pt-8 sm:pt-20 lg:pt-24 safe-area-inset-bottom">
            <div className="mx-auto max-w-7xl">
              <h1 className="font-sans text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-1 sm:mb-2 leading-tight">
                {displayTitle}
              </h1>
              {generatedContent?.hero_tagline && (
                <p className="text-sm sm:text-lg lg:text-xl xl:text-2xl text-foreground/90 max-w-3xl leading-relaxed">
                  {generatedContent.hero_tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show Title Section - Clean, no overlay */}
      {assets.trailer && (
        <div className="mx-auto max-w-7xl w-full px-3 pt-4 sm:px-6 sm:pt-8 lg:pt-12">
          <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-2 sm:mb-3 leading-tight">
            {displayTitle}
          </h1>
          {generatedContent?.hero_tagline && (
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-foreground/80 max-w-4xl leading-relaxed">
              {generatedContent.hero_tagline}
            </p>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto max-w-7xl w-full space-y-4 sm:space-y-6 lg:space-y-8 px-3 py-3 sm:px-6 sm:py-6 lg:py-8" style={{ boxSizing: 'border-box' }}>
        
        {/* Quick Info Bar */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {generatedContent?.tone_keywords?.map((keyword: string, i: number) => (
            <Badge
              key={i}
              variant="outline"
              className="border-white/20 bg-white/5 px-2.5 py-1 text-xs sm:text-sm"
            >
              {keyword}
            </Badge>
          ))}
        </div>

        {/* Logline & Description */}
        <section className="space-y-3 sm:space-y-4">
          {logline && (
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl font-light leading-relaxed text-foreground/90 italic border-l-4 border-primary pl-3 sm:pl-4 lg:pl-6">
              {logline}
            </p>
          )}
          
          {generatingContent ? (
            <div className="flex items-center gap-3 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
              <span className="text-sm sm:text-base text-foreground/60">Generating enhanced content...</span>
            </div>
          ) : generatedContent?.expanded_description && (
            <div className="space-y-3 sm:space-y-4">
              {generatedContent.expanded_description.map((paragraph: string, i: number) => (
                <p key={i} className="text-base sm:text-lg leading-relaxed text-foreground/80">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </section>

        {/* Visual Goal + Poster */}
        {(showPoster || visualAesthetics?.goal || posterDesc) && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
            {/* Poster */}
            {showPoster && (
              <div className="w-full lg:col-span-1">
                <div className="media-frame relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl max-w-[520px] lg:max-w-full mx-auto lg:mx-0" style={{ aspectRatio: '2 / 3' }}>
                  <Image
                    src={assets.libraryPoster || assets.poster || ""}
                    alt={`${displayTitle} Poster`}
                    fill
                    className="object-cover"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    sizes="(min-width: 1024px) 33vw, 100vw"
                  />
                  <div className="absolute inset-x-3 bottom-3 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-white/80 border border-white/10">
                    Key Art Preview
                  </div>
                </div>
              </div>
            )}

            {/* Visual Vision */}
            {(visualAesthetics?.goal || posterDesc) && (
            <div className={`space-y-4 sm:space-y-6 w-full ${showPoster ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                {visualAesthetics?.goal && (
                  <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 to-transparent p-4 sm:p-6 lg:p-8">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="rounded-full bg-primary/20 p-2.5 sm:p-3 flex-shrink-0">
                        <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">Visual Vision</h3>
                        <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">{visualAesthetics.goal}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Poster Description */}
                {posterDesc && (
                  <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-6 lg:p-8">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="rounded-full bg-white/10 p-2.5 sm:p-3 flex-shrink-0">
                        <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">Key Art Description</h3>
                        <p className="text-sm sm:text-base text-foreground/80 leading-relaxed italic">{posterDesc}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Series Format & Episodes */}
        {(showData?.showFormat || (showData?.episodes && showData.episodes.length > 0)) && (
          <section className="space-y-6 sm:space-y-8 w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <Film className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
              <h2 className="font-sans text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight">Series Format & Season One</h2>
            </div>

            {/* Episode Format Overview - Interactive */}
            {showData?.showFormat && (
              <ShowFormatVisualizer 
                format={showData.showFormat} 
                showTitle={showData?.showTitle || showData?.blueprint?.show_title || "Show"} 
              />
            )}

            {/* Episode List */}
            {showData?.episodes && showData.episodes.length > 0 && (
              <EpisodeCards 
                episodes={showData.episodes} 
                characterSeeds={showData.characterSeeds?.map(s => ({ id: s.id, name: s.name }))}
                showId={showId}
              />
            )}
          </section>
        )}

        {/* Lookbook & Key Visuals */}
        {(assets.portraitGrid || previewPortraits.length > 0) && (
          <section className="space-y-4 sm:space-y-6 lg:space-y-8 w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <Palette className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
              <h2 className="font-sans text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight">Lookbook & Keyframes</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
              {assets.portraitGrid && (
                <div className="media-frame relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent shadow-2xl max-w-[540px] lg:max-w-full mx-auto lg:mx-0" style={{ aspectRatio: '4 / 3' }}>
                  <Image
                    src={assets.portraitGrid}
                    alt={`${displayTitle} character grid`}
                    fill
                    className="object-cover"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 py-4">
                    <p className="text-sm font-semibold text-white">Character Grid</p>
                    <p className="text-xs text-foreground/70">Full ensemble styling at a glance</p>
                  </div>
                </div>
              )}

              {previewPortraits.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-6 flex flex-col gap-4 shadow-xl max-w-[540px] lg:max-w-full mx-auto lg:mx-0">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {previewPortraits.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="media-frame relative overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-inner"
                        style={{ aspectRatio: '1 / 1' }}
                      >
                        <Image
                          src={url}
                          alt={`Character portrait ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(min-width: 768px) 25vw, 50vw"
                        />
                      </div>
                    ))}
                  </div>
                  {extraPortraitCount > 0 && (
                    <p className="text-center text-xs sm:text-sm text-foreground/70">
                      +{extraPortraitCount} more character looks saved
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Characters - COMPREHENSIVE */}
        {characters.length > 0 && (
          <section className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
              <h2 className="font-sans text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight">Full Character Dossiers</h2>
            </div>

            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {characters.map((character) => {
                const portraitUrl = assets.characterPortraits?.[character.id] || 
                  assets.portraits.find((p) =>
                    p.toLowerCase().includes(character.id.toLowerCase())
                  );
                
                const characterVideoUrls = assets.characterVideos?.[character.id] || [];
                const hasVideo = characterVideoUrls.length > 0;
                const videoUrl = hasVideo ? characterVideoUrls[0] : null;
                
                const charDoc = characterDocs[character.id];
                const isExpanded = expandedCharacter === character.id;
                const mediaAspectRatio = hasVideo
                  ? (isLandscapeVideo ? '16/9' : '9/16')
                  : '1/1';

                return (
                  <div
                    key={character.id}
                    className="overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent"
                  >
                    {/* Character Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 w-full">
                      {/* Portrait or Video */}
                      <div className={`media-frame relative overflow-hidden rounded-lg sm:rounded-xl max-w-[540px] lg:max-w-full mx-auto lg:mx-0 w-full bg-black`} style={{ minWidth: 0, aspectRatio: mediaAspectRatio, position: 'relative', minHeight: '200px' }}>
                        {hasVideo && videoUrl ? (
                            <video
                              src={videoUrl}
                              playsInline
                              muted={false}
                              controls
                              className="absolute inset-0 w-full h-full object-cover bg-black rounded-lg sm:rounded-xl"
                              onPlay={(e) => {
                                pauseOtherVideos(e.currentTarget);
                                setPlayingVideos(prev => ({ ...prev, [character.id]: true }));
                              }}
                              onPause={() => setPlayingVideos(prev => ({ ...prev, [character.id]: false }))}
                            />
                        ) : portraitUrl ? (
                          <div className="absolute inset-0" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                            <Image
                              src={portraitUrl}
                              alt={getDisplayName(character.name, "Character portrait")}
                              fill
                              className="object-cover"
                              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                              sizes="(min-width: 1024px) 33vw, 100vw"
                            />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-transparent" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                            <span className="text-8xl font-bold text-foreground/20">
                              {getDisplayName(character.name, "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Basic Info */}
                      <div className="space-y-3 sm:space-y-4 lg:space-y-6 min-w-0 lg:col-span-2">
                        <div>
                          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 leading-tight">{getDisplayName(character.name, "Character")}</h3>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                            <Badge variant="default" className="text-xs sm:text-sm px-2 py-0.5">
                              {sanitizeText(character.role) || "Character"}
                            </Badge>
                            {character.vibe && (
                              <Badge variant="outline" className="text-xs sm:text-sm px-2 py-0.5">
                                {sanitizeText(character.vibe)}
                              </Badge>
                            )}
                          </div>
                          {character.summary && sanitizeText(character.summary) && (
                            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
                              {sanitizeText(character.summary)}
                            </p>
                          )}
                          {character.description && sanitizeText(character.description) && (
                            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-foreground/70 leading-relaxed">
                              {sanitizeText(character.description)}
                            </p>
                          )}
                        </div>

                        {/* Function */}
                        {charDoc?.metadata?.function && (
                          <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                            <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Function</span>
                            <p className="mt-1 text-sm sm:text-base text-foreground/90">{charDoc.metadata.function}</p>
                          </div>
                        )}

                        {/* AI Highlight */}
                        {(() => {
                          const highlight = generatedContent?.character_highlights?.find(h => h.character_id === character.id);
                          return highlight ? (
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
                              <p className="text-xs sm:text-sm leading-relaxed text-foreground/80 italic">
                                {highlight.highlight}
                              </p>
                            </div>
                          ) : null;
                        })()}

                        {/* Expand Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedCharacter(isExpanded ? null : character.id)}
                          className="w-full min-h-[44px] touch-manipulation"
                        >
                          <Info className="mr-2 h-4 w-4" />
                          {isExpanded ? 'Hide' : 'Show'} Full Dossier
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && charDoc && (
                      <div className="border-t border-white/10 p-4 sm:p-6 space-y-6 sm:space-y-8">
                        
                        {/* Character Details */}
                        {charDoc.character_details && (
                          <div className="space-y-3 sm:space-y-4">
                            <h4 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-primary">
                              <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                              Physical Characteristics
                            </h4>
                            
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                              {/* Species */}
                              {charDoc.character_details.species && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                                  <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Species</span>
                                  <p className="mt-1 text-sm sm:text-base font-medium">{charDoc.character_details.species.type}</p>
                                  {charDoc.character_details.species.subtype && (
                                    <p className="text-xs sm:text-sm text-foreground/70">{charDoc.character_details.species.subtype}</p>
                                  )}
                                  {charDoc.character_details.species.visual_markers && (
                                    <p className="mt-2 text-[10px] sm:text-xs text-foreground/60">{charDoc.character_details.species.visual_markers}</p>
                                  )}
                                </div>
                              )}

                              {/* Build */}
                              {charDoc.character_details.build && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Build</span>
                                  <p className="mt-1 font-medium capitalize">{charDoc.character_details.build.body_type}</p>
                                  {charDoc.character_details.build.notes && (
                                    <p className="mt-1 text-xs text-foreground/60">{charDoc.character_details.build.notes}</p>
                                  )}
                                </div>
                              )}

                              {/* Colors */}
                              {charDoc.character_details.skin_color && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Skin/Surface</span>
                                  <div className="mt-2 flex items-center gap-2">
                                    <div
                                      className="h-8 w-8 rounded border border-white/20"
                                      style={{ backgroundColor: charDoc.character_details.skin_color.hex }}
                                    />
                                    <div>
                                      <p className="text-sm font-medium">{charDoc.character_details.skin_color.description}</p>
                                      <p className="text-xs font-mono text-foreground/60">{charDoc.character_details.skin_color.hex}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {charDoc.character_details.eye_color && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide flex items-center gap-1">
                                    <Eye className="h-3 w-3" /> Eyes
                                  </span>
                                  <div className="mt-2 flex items-center gap-2">
                                    <div
                                      className="h-8 w-8 rounded-full border border-white/20"
                                      style={{ backgroundColor: charDoc.character_details.eye_color.hex }}
                                    />
                                    <div>
                                      <p className="text-sm font-medium">{charDoc.character_details.eye_color.description}</p>
                                      <p className="text-xs font-mono text-foreground/60">{charDoc.character_details.eye_color.hex}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Voice */}
                            {charDoc.character_details.voice && (
                              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                                <span className="text-xs text-foreground/60 uppercase tracking-wide flex items-center gap-1 mb-3">
                                  <Mic className="h-3 w-3" /> Voice Characteristics
                                </span>
                                <div className="grid gap-3 sm:grid-cols-3">
                                  {charDoc.character_details.voice.pitch_range && (
                                    <div>
                                      <p className="text-xs text-foreground/60">Pitch</p>
                                      <p className="text-sm font-medium capitalize">{charDoc.character_details.voice.pitch_range}</p>
                                    </div>
                                  )}
                                  {charDoc.character_details.voice.tempo && (
                                    <div>
                                      <p className="text-xs text-foreground/60">Tempo</p>
                                      <p className="text-sm font-medium capitalize">{charDoc.character_details.voice.tempo}</p>
                                    </div>
                                  )}
                                  {charDoc.character_details.voice.timbre_notes && (
                                    <div>
                                      <p className="text-xs text-foreground/60">Timbre</p>
                                      <p className="text-sm font-medium capitalize">{charDoc.character_details.voice.timbre_notes}</p>
                                    </div>
                                  )}
                                </div>
                                {charDoc.character_details.voice.descriptors && charDoc.character_details.voice.descriptors.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {charDoc.character_details.voice.descriptors.map((desc: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {desc}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tics */}
                            {charDoc.character_details.tics && (
                              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                                <span className="text-xs text-foreground/60 uppercase tracking-wide mb-3 block">
                                  Behavioral Tics ({charDoc.character_details.tics.frequency})
                                </span>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {charDoc.character_details.tics.motor && charDoc.character_details.tics.motor.length > 0 && (
                                    <div>
                                      <p className="text-xs text-foreground/60 mb-1">Motor</p>
                                      <div className="space-y-1">
                                        {charDoc.character_details.tics.motor.map((tic: string, i: number) => (
                                          <p key={i} className="text-sm">• {tic}</p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {charDoc.character_details.tics.verbal && charDoc.character_details.tics.verbal.length > 0 && (
                                    <div>
                                      <p className="text-xs text-foreground/60 mb-1">Verbal</p>
                                      <div className="space-y-1">
                                        {charDoc.character_details.tics.verbal.map((tic: string, i: number) => (
                                          <p key={i} className="text-sm">• {tic}</p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Look & Style */}
                        {charDoc.look && (
                          <div className="space-y-3 sm:space-y-4">
                            <h4 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-primary">
                              <Palette className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                              Visual Design
                            </h4>

                            <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                              {/* Silhouette & Surface */}
                              {charDoc.look.silhouette && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                                  <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Silhouette</span>
                                  <p className="mt-1 text-sm sm:text-base">{charDoc.look.silhouette}</p>
                                </div>
                              )}

                              {charDoc.look.surface && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                                  <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Surface</span>
                                  <p className="mt-1 text-sm sm:text-base">{charDoc.look.surface.materials}</p>
                                  {charDoc.look.surface.finish && (
                                    <p className="text-xs sm:text-sm text-foreground/70 capitalize">{charDoc.look.surface.finish} finish</p>
                                  )}
                                  {charDoc.look.surface.texture_rules && (
                                    <p className="mt-2 text-[10px] sm:text-xs text-foreground/60">{charDoc.look.surface.texture_rules}</p>
                                  )}
                                </div>
                              )}

                              {/* Color Palette */}
                              {charDoc.look.palette?.anchors && charDoc.look.palette.anchors.length > 0 && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4 lg:col-span-2">
                                  <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide mb-2.5 sm:mb-3 block">Character Palette</span>
                                  <div className="flex flex-wrap gap-2 sm:gap-3">
                                    {charDoc.look.palette.anchors.map((color: string, i: number) => (
                                      <div key={i} className="flex flex-col items-center gap-1.5 sm:gap-2">
                                        <div
                                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg border-2 border-white/20 shadow-lg"
                                          style={{ backgroundColor: color }}
                                        />
                                        <span className="text-[10px] sm:text-xs font-mono text-foreground/60 break-all text-center max-w-[60px] sm:max-w-none">{color}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {charDoc.look.palette.notes && (
                                    <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-foreground/70">{charDoc.look.palette.notes}</p>
                                  )}
                                </div>
                              )}

                              {/* Eyes */}
                              {charDoc.look.eyes && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                                  <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide flex items-center gap-1">
                                    <Eye className="h-3 w-3 flex-shrink-0" /> Eye Design
                                  </span>
                                  <p className="mt-1 text-sm sm:text-base capitalize">{charDoc.look.eyes.type}</p>
                                  {charDoc.look.eyes.catchlight_shape && (
                                    <p className="text-xs sm:text-sm text-foreground/70">Catchlight: {charDoc.look.eyes.catchlight_shape}</p>
                                  )}
                                  {charDoc.look.eyes.behaviors && charDoc.look.eyes.behaviors.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {charDoc.look.eyes.behaviors.map((behavior: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-[9px] sm:text-[10px] px-1.5 py-0.5">
                                          {behavior}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Wardrobe */}
                              {charDoc.look.wardrobe && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                                  <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide flex items-center gap-1">
                                    <Shirt className="h-3 w-3 flex-shrink-0" /> Wardrobe
                                  </span>
                                  {charDoc.look.wardrobe.items && charDoc.look.wardrobe.items.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-[10px] sm:text-xs text-foreground/60 mb-1">Items</p>
                                      {charDoc.look.wardrobe.items.map((item: string, i: number) => (
                                        <p key={i} className="text-xs sm:text-sm">• {item}</p>
                                      ))}
                                    </div>
                                  )}
                                  {charDoc.look.wardrobe.accessories && charDoc.look.wardrobe.accessories.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-[10px] sm:text-xs text-foreground/60 mb-1">Accessories</p>
                                      {charDoc.look.wardrobe.accessories.map((item: string, i: number) => (
                                        <p key={i} className="text-xs sm:text-sm">• {item}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Performance */}
                        {charDoc.performance && (
                          <div className="space-y-3 sm:space-y-4">
                            <h4 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-primary">
                              <Smile className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                              Performance Specs
                            </h4>

                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                              {charDoc.performance.pose_defaults && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                                  <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Default Pose</span>
                                  <p className="mt-1 text-xs sm:text-sm">{charDoc.performance.pose_defaults}</p>
                                </div>
                              )}

                              {charDoc.performance.expression_set && charDoc.performance.expression_set.length > 0 && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                                  <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Expressions</span>
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {charDoc.performance.expression_set.map((expr: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5">
                                        {expr}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {charDoc.performance.gestural_loops && charDoc.performance.gestural_loops.length > 0 && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4 sm:col-span-2">
                                  <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Signature Gestures</span>
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {charDoc.performance.gestural_loops.map((gesture: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5">
                                        {gesture}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Scene Presence */}
                        {charDoc.scene_presence && (
                          <div className="space-y-3 sm:space-y-4">
                            <h4 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-primary">
                              <Camera className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                              Cinematography Override
                            </h4>

                            <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                              {charDoc.scene_presence.camera_override && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                                  <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Camera</span>
                                  {charDoc.scene_presence.camera_override.lenses && (
                                    <p className="mt-1 text-xs sm:text-sm">Lenses: {charDoc.scene_presence.camera_override.lenses.join(", ")}</p>
                                  )}
                                  {charDoc.scene_presence.camera_override.framing && (
                                    <p className="text-xs sm:text-sm">Framing: {charDoc.scene_presence.camera_override.framing}</p>
                                  )}
                                  {charDoc.scene_presence.camera_override.movement && (
                                    <p className="text-xs sm:text-sm">Movement: {charDoc.scene_presence.camera_override.movement}</p>
                                  )}
                                </div>
                              )}

                              {charDoc.scene_presence.lighting_override && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                                  <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Lighting</span>
                                  {charDoc.scene_presence.lighting_override.key && (
                                    <p className="mt-1 text-xs sm:text-sm">Key: {charDoc.scene_presence.lighting_override.key}</p>
                                  )}
                                  {charDoc.scene_presence.lighting_override.fill && (
                                    <p className="text-xs sm:text-sm">Fill: {charDoc.scene_presence.lighting_override.fill}</p>
                                  )}
                                  {charDoc.scene_presence.lighting_override.edge && (
                                    <p className="text-xs sm:text-sm">Edge: {charDoc.scene_presence.lighting_override.edge}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Showcase Scene */}
                        {charDoc.showcase_scene_prompt && (
                          <div className="rounded-lg sm:rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 sm:p-5 lg:p-6">
                            <span className="text-[10px] sm:text-xs text-primary uppercase tracking-wide font-semibold">Showcase Scene</span>
                            <p className="mt-2 text-sm sm:text-base text-foreground/90 leading-relaxed italic">
                              {charDoc.showcase_scene_prompt}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Species/Character Types Design */}
        {visualAesthetics?.species_design?.types && visualAesthetics.species_design.types.length > 0 && (
          <section className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
              <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Character Design System</h2>
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {visualAesthetics.species_design.types.map((type: Blueprint, idx: number) => (
                <div
                  key={idx}
                  className="space-y-3 sm:space-y-4 rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 lg:p-6"
                >
                  <h3 className="text-xl sm:text-2xl font-semibold text-primary leading-tight">{type.name}</h3>
                  
                  <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                    {type.silhouette && (
                      <div>
                        <span className="text-foreground/60">Silhouette:</span>
                        <p className="mt-1 text-foreground/90">{type.silhouette}</p>
                      </div>
                    )}
                    {type.surface_finish && (
                      <div>
                        <span className="text-foreground/60">Surface:</span>
                        <p className="mt-1 text-foreground/90">{type.surface_finish}</p>
                      </div>
                    )}
                    {type.materials && (
                      <div>
                        <span className="text-foreground/60">Materials:</span>
                        <p className="mt-1 text-foreground/90">{type.materials}</p>
                      </div>
                    )}
                    {type.eyes && (
                      <div>
                        <span className="text-foreground/60">Eyes:</span>
                        <p className="mt-1 text-foreground/90">
                          {type.eyes.type} with {type.eyes.catchlight_shape} catchlight
                        </p>
                        {type.eyes.behaviors && type.eyes.behaviors.length > 0 && (
                          <ul className="mt-2 space-y-1 ml-4">
                            {type.eyes.behaviors.map((behavior: string, i: number) => (
                              <li key={i} className="text-xs text-foreground/70">• {behavior}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {type.stress_cues && (
                      <div>
                        <span className="text-foreground/60">Stress Cues:</span>
                        <p className="mt-1 text-foreground/90">{type.stress_cues}</p>
                      </div>
                    )}
                    {type.palette?.anchors && type.palette.anchors.length > 0 && (
                      <div>
                        <span className="text-foreground/60">Color Palette:</span>
                        <div className="mt-2 flex gap-2">
                          {type.palette.anchors.map((color: string, i: number) => (
                            <div
                              key={i}
                              className="h-10 w-10 rounded-lg border border-white/20 shadow-lg"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                        {type.palette.notes && (
                          <p className="mt-2 text-xs text-foreground/70">{type.palette.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Production Design Grid */}
        <section className="space-y-4 sm:space-y-6 lg:space-y-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Film className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
            <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Production Design</h2>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Production Style */}
            {productionStyle && (
              <div className="space-y-3 sm:space-y-4 rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 lg:p-6">
                <h3 className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-semibold leading-tight">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                  Visual Style
                </h3>
                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-foreground/60">Medium:</span>
                    <p className="mt-1 font-medium text-base sm:text-lg">{productionStyle.medium}</p>
                  </div>
                  <div>
                    <span className="text-foreground/60">Stylization:</span>
                    <p className="mt-1 font-medium capitalize">
                      {productionStyle.stylization_level?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <span className="text-foreground/60">Treatment:</span>
                    <p className="mt-2 text-foreground/80 leading-relaxed">
                      {productionStyle.visual_treatment}
                    </p>
                  </div>
                  {productionStyle.cinematic_references?.length > 0 && (
                    <div>
                      <span className="text-foreground/60">Cinematic References:</span>
                      <ul className="mt-2 space-y-2">
                        {productionStyle.cinematic_references.map((ref: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-foreground/80">
                            <Sparkles className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                            {ref}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Color Palette */}
            {visualAesthetics?.color && (
              <div className="space-y-3 sm:space-y-4 rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 lg:p-6">
                <h3 className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-semibold leading-tight">
                  <Palette className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                  Color Design
                </h3>
                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-foreground/60">Palette Approach:</span>
                    <p className="mt-1 font-medium capitalize">{visualAesthetics.color.palette_bias}</p>
                  </div>
                  {visualAesthetics.color.anchor_hex && visualAesthetics.color.anchor_hex.length > 0 && (
                    <div>
                      <span className="text-foreground/60">Primary Colors:</span>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {visualAesthetics.color.anchor_hex.map((color: string, i: number) => (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <div
                              className="h-16 w-16 rounded-xl border-2 border-white/20 shadow-xl"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-mono text-foreground/60">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {visualAesthetics.color.skin_protection && (
                    <div>
                      <span className="text-foreground/60">Skin Tones:</span>
                      <p className="mt-1 text-foreground/80">{visualAesthetics.color.skin_protection}</p>
                    </div>
                  )}
                  {visualAesthetics.color.white_balance_baseline_K && (
                    <div>
                      <span className="text-foreground/60">White Balance:</span>
                      <p className="mt-1 text-foreground/80">{visualAesthetics.color.white_balance_baseline_K}K</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lighting */}
            {visualAesthetics?.lighting && (
              <div className="space-y-3 sm:space-y-4 rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 lg:p-6">
                <h3 className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-semibold leading-tight">
                  <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                  Lighting Design
                </h3>
                <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-foreground/60">Temperature Model:</span>
                    <p className="mt-1 text-foreground/90">{visualAesthetics.lighting.temperature_model}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-foreground/60">Key:</span>
                      <p className="mt-1 text-foreground/90">{visualAesthetics.lighting.key}</p>
                    </div>
                    {visualAesthetics.lighting.fill && (
                      <div>
                        <span className="text-foreground/60">Fill:</span>
                        <p className="mt-1 text-foreground/90">{visualAesthetics.lighting.fill}</p>
                      </div>
                    )}
                  </div>
                  {visualAesthetics.lighting.edge && (
                    <div>
                      <span className="text-foreground/60">Edge:</span>
                      <p className="mt-1 text-foreground/90">{visualAesthetics.lighting.edge}</p>
                    </div>
                  )}
                  {visualAesthetics.lighting.halation_policy && (
                    <div>
                      <span className="text-foreground/60">Halation:</span>
                      <p className="mt-1 text-foreground/90">{visualAesthetics.lighting.halation_policy}</p>
                    </div>
                  )}
                  {visualAesthetics.lighting.practicals_in_frame !== undefined && (
                    <div>
                      <span className="text-foreground/60">Practicals in Frame:</span>
                      <p className="mt-1 text-foreground/90">{visualAesthetics.lighting.practicals_in_frame ? "Yes" : "No"}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Camera */}
            {visualAesthetics?.camera && (
              <div className="space-y-3 sm:space-y-4 rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 lg:p-6">
                <h3 className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-semibold leading-tight">
                  <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                  Camera & Lenses
                </h3>
                <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                  {visualAesthetics.camera.sensor && (
                    <div>
                      <span className="text-foreground/60">Sensor:</span>
                      <p className="mt-1 text-foreground/90">{visualAesthetics.camera.sensor}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-foreground/60">Lenses:</span>
                    <p className="mt-1 text-foreground/90">{visualAesthetics.camera.lens_family.join(", ")}</p>
                  </div>
                  {visualAesthetics.camera.dof_guides && (
                    <div>
                      <span className="text-foreground/60">Depth of Field:</span>
                      <p className="mt-1 text-foreground/90">{visualAesthetics.camera.dof_guides}</p>
                    </div>
                  )}
                  {visualAesthetics.camera.movement && visualAesthetics.camera.movement.length > 0 && (
                    <div>
                      <span className="text-foreground/60">Camera Movement:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {visualAesthetics.camera.movement.map((move: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {move}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {visualAesthetics.camera.coverage_rules && visualAesthetics.camera.coverage_rules.length > 0 && (
                    <div>
                      <span className="text-foreground/60">Coverage Rules:</span>
                      <ul className="mt-2 space-y-1">
                        {visualAesthetics.camera.coverage_rules.map((rule: string, i: number) => (
                          <li key={i} className="text-xs text-foreground/70">• {rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sets & Locations */}
        {visualAesthetics?.sets_and_prop_visuals?.primary_sets && visualAesthetics.sets_and_prop_visuals.primary_sets.length > 0 && (
          <section className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
              <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Locations & Sets</h2>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {visualAesthetics.sets_and_prop_visuals.primary_sets.map((set: string, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 sm:gap-3 rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-3 sm:p-4"
                >
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <p className="text-sm sm:text-base font-medium min-w-0">{set}</p>
                </div>
              ))}
            </div>

            {visualAesthetics.sets_and_prop_visuals.prop_style && (
              <div className="rounded-lg sm:rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <span className="text-xs sm:text-sm text-foreground/60">Prop Style:</span>
                <p className="mt-2 text-sm sm:text-base text-foreground/90">{visualAesthetics.sets_and_prop_visuals.prop_style}</p>
              </div>
            )}

            {visualAesthetics.sets_and_prop_visuals.runner_gags_visual && visualAesthetics.sets_and_prop_visuals.runner_gags_visual.length > 0 && (
              <div className="rounded-lg sm:rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <span className="text-xs sm:text-sm text-foreground/60">Running Gags:</span>
                <ul className="mt-2.5 sm:mt-3 space-y-1.5 sm:space-y-2">
                  {visualAesthetics.sets_and_prop_visuals.runner_gags_visual.map((gag: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm sm:text-base text-foreground/80">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span className="min-w-0">{gag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Post-Production */}
        {visualAesthetics?.post_grade && (
          <section className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <Settings2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
              <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Post-Production</h2>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              {visualAesthetics.post_grade.curve && (
                <div className="rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5">
                  <span className="text-xs sm:text-sm text-foreground/60">Color Curve:</span>
                  <p className="mt-2 text-base sm:text-lg font-medium text-foreground/90">{visualAesthetics.post_grade.curve}</p>
                </div>
              )}
              {visualAesthetics.post_grade.lut && (
                <div className="rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5">
                  <span className="text-xs sm:text-sm text-foreground/60">LUT:</span>
                  <p className="mt-2 text-base sm:text-lg font-medium text-foreground/90">{visualAesthetics.post_grade.lut}</p>
                </div>
              )}
              {visualAesthetics.post_grade.grain && (
                <div className="rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5">
                  <span className="text-xs sm:text-sm text-foreground/60">Film Grain:</span>
                  <p className="mt-2 text-sm sm:text-base text-foreground/90">
                    {visualAesthetics.post_grade.grain.intensity} • {visualAesthetics.post_grade.grain.placement}
                  </p>
                </div>
              )}
              {visualAesthetics.post_grade.halation && (
                <div className="rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5">
                  <span className="text-xs sm:text-sm text-foreground/60">Halation:</span>
                  <p className="mt-2 text-sm sm:text-base text-foreground/90">
                    {visualAesthetics.post_grade.halation.strength} • {visualAesthetics.post_grade.halation.scope}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Technical Pipeline */}
        {visualAesthetics?.pipeline && (
          <section className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <Layers className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
              <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Technical Specifications</h2>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {visualAesthetics.pipeline.color_management && (
                <div className="rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5">
                  <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-2 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground/60">Color Management:</span>
                  <p className="mt-2 text-sm sm:text-base font-medium text-foreground/90">{visualAesthetics.pipeline.color_management}</p>
                </div>
              )}
              {visualAesthetics.pipeline.aspect_ratio && (
                <div className="rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5">
                  <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-2 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground/60">Aspect Ratio:</span>
                  <p className="mt-2 text-sm sm:text-base font-medium text-foreground/90">{visualAesthetics.pipeline.aspect_ratio}</p>
                </div>
              )}
              {visualAesthetics.pipeline.frame_rates && (
                <div className="rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5">
                  <Film className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-2 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground/60">Frame Rate:</span>
                  <p className="mt-2 text-sm sm:text-base font-medium text-foreground/90">{visualAesthetics.pipeline.frame_rates.playback} fps</p>
                </div>
              )}
            </div>

            {visualAesthetics.pipeline.render_order && visualAesthetics.pipeline.render_order.length > 0 && (
              <div className="rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 lg:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 leading-tight">Render Pipeline</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {visualAesthetics.pipeline.render_order.map((step: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                      <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5">
                        {i + 1}. {step}
                      </Badge>
                      {i < visualAesthetics.pipeline.render_order!.length - 1 && (
                        <span className="text-foreground/30 text-xs sm:text-sm">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Unique Features */}
        {generatedContent?.unique_features && generatedContent.unique_features.length > 0 && (
          <section className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
              <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">What Makes It Special</h2>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {generatedContent.unique_features.map((feature: string, i: number) => (
                <div
                  key={i}
                  className="flex gap-2.5 sm:gap-3 rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary/20">
                      <Sparkles className="h-3 w-3 sm:h-3 sm:w-3 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground/80 min-w-0">{feature}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Behind the Scenes */}
        {generatedContent?.behind_the_scenes && (
          <section className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <Film className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
              <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Behind the Scenes</h2>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-6 lg:p-8">
              <p className="text-base sm:text-lg leading-relaxed text-foreground/80">
                {generatedContent.behind_the_scenes}
              </p>
            </div>
          </section>
        )}

        {/* Episode Concepts */}
        {generatedContent?.episode_concepts && generatedContent.episode_concepts.length > 0 && (
          <section className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <Film className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
              <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Story Concepts</h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {generatedContent.episode_concepts.map((episode: Blueprint, i: number) => (
                <div
                  key={i}
                  className="rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 lg:p-6"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary text-base sm:text-lg">
                      {i + 1}
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold leading-tight">{episode.title}</h3>
                      <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                        {episode.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Raw Show Data */}
        <section className="space-y-4 sm:space-y-6 lg:space-y-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Settings2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
            <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Show Metadata</h2>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Show ID */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
              <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Show ID</span>
              <p className="mt-2 font-mono text-xs sm:text-sm text-foreground/90 break-all">{showData.id}</p>
            </div>

            {/* Model */}
            {showData.blueprint && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">AI Model</span>
                <p className="mt-2 text-sm sm:text-base text-foreground/90">GPT-4o</p>
              </div>
            )}

            {/* Created Date */}
            {showData.blueprint && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Created</span>
                <p className="mt-2 text-xs sm:text-sm text-foreground/90">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}

            {/* Character Count */}
            {characters.length > 0 && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Characters</span>
                <p className="mt-2 text-xl sm:text-2xl font-bold text-primary">{characters.length}</p>
              </div>
            )}

            {/* Assets Count */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
              <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Total Assets</span>
              <p className="mt-2 text-xl sm:text-2xl font-bold text-primary">
                {(assets.portraits?.length || 0) + 
                 (assets.poster ? 1 : 0) + 
                 (assets.libraryPoster ? 1 : 0) + 
                 (assets.trailer ? 1 : 0) + 
                 (assets.portraitGrid ? 1 : 0)}
              </p>
            </div>

            {/* Composition */}
            {visualAesthetics?.composition?.symmetry_bias && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                <span className="text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wide">Composition Style</span>
                <p className="mt-2 text-xs sm:text-sm text-foreground/90 capitalize">{visualAesthetics.composition.symmetry_bias}</p>
              </div>
            )}
          </div>

          {/* Composition Details */}
          {visualAesthetics?.composition && (
            <div className="rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 lg:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 leading-tight">Composition Guidelines</h3>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                {visualAesthetics.composition.symmetry_bias && (
                  <div>
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Symmetry</span>
                    <p className="mt-1 text-sm text-foreground/90">{visualAesthetics.composition.symmetry_bias}</p>
                  </div>
                )}
                {visualAesthetics.composition.leading_lines && (
                  <div>
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Leading Lines</span>
                    <p className="mt-1 text-sm text-foreground/90">{visualAesthetics.composition.leading_lines}</p>
                  </div>
                )}
                {visualAesthetics.composition.foreground_depth && (
                  <div>
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Depth</span>
                    <p className="mt-1 text-sm text-foreground/90">{visualAesthetics.composition.foreground_depth}</p>
                  </div>
                )}
                {visualAesthetics.composition.color_blocking && (
                  <div>
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Color Blocking</span>
                    <p className="mt-1 text-sm text-foreground/90">{visualAesthetics.composition.color_blocking}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Materials & Textures */}
          {visualAesthetics?.materials_and_textures && (
            <div className="rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 lg:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 leading-tight">Materials & Textures</h3>
              <div className="space-y-3 sm:space-y-4">
                {visualAesthetics.materials_and_textures.human_textures && (
                  <div>
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Character Textures</span>
                    <p className="mt-2 text-foreground/90">{visualAesthetics.materials_and_textures.human_textures}</p>
                  </div>
                )}
                {visualAesthetics.materials_and_textures.set_surfaces && visualAesthetics.materials_and_textures.set_surfaces.length > 0 && (
                  <div>
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Set Surfaces</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {visualAesthetics.materials_and_textures.set_surfaces.map((surface: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {surface}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {visualAesthetics.materials_and_textures.patina && (
                  <div>
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Patina</span>
                    <p className="mt-2 text-foreground/90">{visualAesthetics.materials_and_textures.patina}</p>
                  </div>
                )}
                {visualAesthetics.materials_and_textures.notes && (
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-sm text-foreground/70 italic">{visualAesthetics.materials_and_textures.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Color Prohibitions */}
          {(visualAesthetics?.color?.prohibitions && visualAesthetics.color.prohibitions.length > 0) && (
            <div className="rounded-lg sm:rounded-xl border border-red-900/20 bg-gradient-to-br from-red-900/10 to-transparent p-4 sm:p-5 lg:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2.5 sm:mb-3 text-red-400 leading-tight">Visual Prohibitions</h3>
              <div className="space-y-2 sm:space-y-2.5">
                <div>
                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Avoid These Colors</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {visualAesthetics.color.prohibitions.map((prohibition: string, i: number) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {prohibition}
                      </Badge>
                    ))}
                  </div>
                </div>
                {visualAesthetics.lighting?.no_go && visualAesthetics.lighting.no_go.length > 0 && (
                  <div className="pt-3">
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Avoid These Lighting Styles</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {visualAesthetics.lighting.no_go.map((prohibition: string, i: number) => (
                        <Badge key={i} variant="destructive" className="text-xs">
                          {prohibition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {visualAesthetics?.prohibitions_global && visualAesthetics.prohibitions_global.length > 0 && (
                  <div className="pt-3">
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Global Prohibitions</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {visualAesthetics.prohibitions_global.map((prohibition: string, i: number) => (
                        <Badge key={i} variant="destructive" className="text-xs">
                          {prohibition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Specs */}
          {visualAesthetics?.export_specs && (
            <div className="rounded-lg sm:rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 lg:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 leading-tight">Export Specifications</h3>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                {visualAesthetics.export_specs.stills && visualAesthetics.export_specs.stills.length > 0 && (
                  <div>
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Still Formats</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {visualAesthetics.export_specs.stills.map((format: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs font-mono">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {visualAesthetics.export_specs.video_intermediate && (
                  <div>
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Video Codec</span>
                    <p className="mt-2 font-mono text-sm text-foreground/90">{visualAesthetics.export_specs.video_intermediate}</p>
                  </div>
                )}
                {visualAesthetics.export_specs.delivery_color && (
                  <div>
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Delivery Color Space</span>
                    <p className="mt-2 font-mono text-sm text-foreground/90">{visualAesthetics.export_specs.delivery_color}</p>
                  </div>
                )}
                {visualAesthetics.export_specs.plates && visualAesthetics.export_specs.plates.length > 0 && (
                  <div>
                    <span className="text-xs text-foreground/60 uppercase tracking-wide">Plate Types</span>
                    <div className="mt-2 space-y-1">
                      {visualAesthetics.export_specs.plates.map((plate: string, i: number) => (
                        <p key={i} className="text-xs text-foreground/70">• {plate}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
        
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 px-3 py-6 sm:px-6 sm:py-10 lg:py-12 mt-6 sm:mt-10 lg:mt-16 safe-area-inset-bottom">
        <div className="mx-auto max-w-7xl">
          {/* Call to Action */}
          <div className="mb-6 sm:mb-8 lg:mb-12 flex flex-col items-center justify-center gap-3 sm:gap-4 lg:gap-6 text-center">
            <h3 className="font-sans text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">Explore More Shows</h3>
            <p className="max-w-2xl text-xs sm:text-sm lg:text-base text-foreground/70 px-2">
              Discover other incredible productions in our library
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 lg:gap-4 w-full sm:w-auto px-2 sm:px-0">
              <Button
                variant="default"
                size="lg"
                onClick={() => router.push("/library")}
                className="rounded-full px-5 sm:px-6 lg:px-8 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl active:scale-95 hover:scale-105 transition-all w-full sm:w-auto min-h-[44px] touch-manipulation"
              >
                <Library className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Browse All Shows
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/")}
                className="rounded-full px-5 sm:px-6 lg:px-8 text-sm sm:text-base font-semibold w-full sm:w-auto min-h-[44px] touch-manipulation"
              >
                <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Create Your Own
              </Button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="border-t border-white/10 pt-4 sm:pt-6 lg:pt-8 text-center">
            <p className="text-[10px] sm:text-xs lg:text-sm text-foreground/60">
              Created with Production Flow • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
