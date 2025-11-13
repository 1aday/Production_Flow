"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { LIBRARY_LOAD_STORAGE_KEY } from "@/lib/constants";

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
  character_highlights: Record<string, string>;
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
  biometrics?: {
    species?: {
      type?: string;
      subtype?: string;
      visual_markers?: string;
      materiality?: string;
    };
    age_years?: { value: number };
    skin_color?: { hex: string; description: string };
    eye_color?: { hex: string; description: string };
    height?: { value: number; unit: string; notes?: string };
    weight?: { value: number; unit: string; notes?: string };
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

type ShowData = {
  id: string;
  title: string;
  showTitle?: string;
  blueprint: any;
  characterSeeds?: CharacterSeed[];
  characterDocs?: Record<string, CharacterDoc>;
};

export default function ShowPage() {
  const params = useParams();
  const router = useRouter();
  const showId = params.id as string;

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

  useEffect(() => {
    void loadShowData();
  }, [showId]);

  // Pause all other videos when one starts playing
  useEffect(() => {
    const handleVideoPlay = (e: Event) => {
      const playingVideo = e.target as HTMLVideoElement;
      
      // Get all video elements on the page
      const allVideos = document.querySelectorAll('video');
      
      // Pause all other videos
      allVideos.forEach((video) => {
        if (video !== playingVideo && !video.paused) {
          video.pause();
        }
      });
    };

    // Add event listeners to all videos
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video) => {
      video.addEventListener('play', handleVideoPlay);
    });

    // Cleanup
    return () => {
      allVideos.forEach((video) => {
        video.removeEventListener('play', handleVideoPlay);
      });
    };
  }, [showData, assets]); // Re-run when content loads

  const loadShowData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/show/${showId}`);
      if (!response.ok) {
        if (response.status === 404) {
          alert("Show not found");
          router.push("/library");
          return;
        }
        throw new Error("Failed to load show");
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

      setGeneratingContent(true);
      const contentResponse = await fetch(`/api/show/${showId}/generate-content`, {
        method: "POST",
      });

      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        setGeneratedContent(contentData.content);
      }
    } catch (error) {
      console.error("Error loading show:", error);
      alert("Failed to load show");
    } finally {
      setLoading(false);
      setGeneratingContent(false);
    }
  };

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
    // Store the show ID in sessionStorage so console page can load it
    sessionStorage.setItem(LIBRARY_LOAD_STORAGE_KEY, showId);
    router.push("/console");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-foreground/60">Loading show...</p>
        </div>
      </div>
    );
  }

  if (!showData || !assets) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-foreground/60">Show not found</p>
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

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Fixed Header */}
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/library")}
            className="rounded-full font-semibold text-xs sm:text-sm"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Back to Library</span>
            <span className="sm:hidden ml-1">Back</span>
          </Button>

          <div className="flex gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadShow}
              className="rounded-full text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={copyShareUrl}
              className="rounded-full text-xs sm:text-sm"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Copied!</span>
                  <span className="sm:hidden">✓</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[56px] sm:h-[68px]" />

      {/* Incomplete Show Banner */}
      {completionStatus && !completionStatus.isFullyComplete && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-amber-100 mb-1">
                    Production Incomplete ({completionStatus.completionPercentage}%)
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-200/80 mb-2">
                    This show is missing some assets. Continue production to complete it.
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {completionStatus.missingItems.map((item, i) => (
                      <Badge key={i} variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200 text-[10px] sm:text-xs">
                        Missing: {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={continueProduction}
                size="default"
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-full shadow-lg hover:shadow-xl transition-all flex-shrink-0 w-full sm:w-auto text-sm"
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
        <div className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] w-full overflow-hidden group cursor-pointer touch-manipulation" onClick={toggleTrailer}>
          <video
            id="trailer-video"
            src={assets.trailer}
            autoPlay
            loop
            muted
            playsInline
            onPlay={() => setTrailerPlaying(true)}
            onPause={() => setTrailerPlaying(false)}
            onVolumeChange={(e) => setTrailerMuted(e.currentTarget.muted)}
            onLoadedData={(e) => {
              const video = e.currentTarget;
              video.play().then(() => {
                setTrailerPlaying(true);
              }).catch(() => {
                setTrailerPlaying(false);
              });
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          {/* Subtle Play Button - Shows when not playing or when muted */}
          {(!trailerPlaying || trailerMuted) && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm shadow-xl transition-all hover:scale-110 hover:bg-black/80 z-10 border border-white/20">
              <Play className="ml-0.5 h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          )}

          {/* Pause Button - Shows on hover when playing with audio (desktop) or tap (mobile) */}
          {trailerPlaying && !trailerMuted && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 items-center justify-center rounded-full bg-black/80 backdrop-blur-sm shadow-2xl transition-all opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-black/90 z-10">
              <Pause className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
            </div>
          )}

          {/* Audio Toggle Button - Always visible on mobile, hover on desktop */}
          {trailerPlaying && (
            <button
              onClick={toggleTrailerAudio}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/80 backdrop-blur-sm shadow-xl transition-all hover:scale-110 hover:bg-black/90 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 touch-manipulation"
              aria-label={trailerMuted ? "Unmute trailer" : "Mute trailer"}
            >
              {trailerMuted ? (
                <VolumeX className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              )}
            </button>
          )}
          
          <div className={`absolute bottom-0 left-0 right-0 px-4 pb-8 sm:px-6 sm:pb-12 lg:pb-16 transition-opacity duration-500 ${trailerPlaying ? 'opacity-20' : 'opacity-100'}`}>
            <div className="mx-auto max-w-7xl">
              <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl mb-3 sm:mb-4">
                {displayTitle}
              </h1>
              {generatedContent?.hero_tagline && (
                <p className="text-base text-foreground/90 sm:text-lg lg:text-xl xl:text-2xl max-w-3xl">
                  {generatedContent.hero_tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : assets.libraryPoster || assets.poster ? (
        <div className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] w-full overflow-hidden">
          <Image
            src={assets.libraryPoster || assets.poster || ""}
            alt={displayTitle}
            fill
            className="object-cover"
            priority
            quality={95}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 sm:px-6 sm:pb-12 lg:pb-16">
            <div className="mx-auto max-w-7xl">
              <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl mb-3 sm:mb-4">
                {displayTitle}
              </h1>
              {generatedContent?.hero_tagline && (
                <p className="text-base text-foreground/90 sm:text-lg lg:text-xl xl:text-2xl max-w-3xl">
                  {generatedContent.hero_tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-[40vh] sm:h-[50vh] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:pb-16 lg:pt-24">
            <div className="mx-auto max-w-7xl">
              <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl mb-3 sm:mb-4">
                {displayTitle}
              </h1>
              {generatedContent?.hero_tagline && (
                <p className="text-base text-foreground/90 sm:text-lg lg:text-xl xl:text-2xl max-w-3xl">
                  {generatedContent.hero_tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:space-y-12 sm:px-6 sm:py-12 lg:space-y-16 lg:py-16">
        
        {/* Quick Info Bar */}
        <div className="flex flex-wrap gap-3">
          {generatedContent?.tone_keywords?.map((keyword: string, i: number) => (
            <Badge
              key={i}
              variant="outline"
              className="border-white/20 bg-white/5 px-3 py-1"
            >
              {keyword}
            </Badge>
          ))}
        </div>

        {/* Logline & Description */}
        <section className="space-y-4 sm:space-y-6">
          {logline && (
            <p className="text-lg sm:text-xl lg:text-2xl font-light leading-relaxed text-foreground/90 italic border-l-4 border-primary pl-4 sm:pl-6">
              {logline}
            </p>
          )}
          
          {generatingContent ? (
            <div className="flex items-center gap-3 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-foreground/60">Generating enhanced content...</span>
            </div>
          ) : generatedContent?.expanded_description && (
            <div className="space-y-4">
              {generatedContent.expanded_description.map((paragraph: string, i: number) => (
                <p key={i} className="text-lg leading-relaxed text-foreground/80">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </section>

        {/* Visual Goal + Poster */}
        {(visualAesthetics?.goal || posterDesc) && (
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Poster */}
            {(assets.libraryPoster || assets.poster) && (
              <div className="lg:col-span-1">
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                  <Image
                    src={assets.libraryPoster || assets.poster || ""}
                    alt={`${displayTitle} Poster`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 33vw, 100vw"
                  />
                </div>
              </div>
            )}

            {/* Visual Vision */}
            <div className={`space-y-6 ${(assets.libraryPoster || assets.poster) ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              {visualAesthetics?.goal && (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 to-transparent p-8">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/20 p-3">
                      <Eye className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Visual Vision</h3>
                      <p className="text-foreground/80 leading-relaxed">{visualAesthetics.goal}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Poster Description */}
              {posterDesc && (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-white/10 p-3">
                      <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Key Art Description</h3>
                      <p className="text-foreground/80 leading-relaxed italic">{posterDesc}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Characters - COMPREHENSIVE */}
        {characters.length > 0 && (
          <section className="space-y-6 sm:space-y-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Full Character Dossiers</h2>
            </div>

            <div className="space-y-8">
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

                return (
                  <div
                    key={character.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent"
                  >
                    {/* Character Header */}
                    <div className="grid gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-3">
                      {/* Portrait or Video */}
                      <div className={`relative overflow-hidden rounded-xl lg:col-span-1 ${hasVideo ? 'aspect-[9/16]' : 'aspect-square'} group cursor-pointer touch-manipulation`}>
                        {hasVideo && videoUrl ? (
                          <div 
                            className="relative h-full w-full"
                            onClick={(e) => {
                              const video = e.currentTarget.querySelector('video');
                              if (video) {
                                const isPlaying = !video.paused;
                                if (isPlaying) {
                                  video.pause();
                                  video.currentTime = 0;
                                  setPlayingVideos(prev => ({ ...prev, [character.id]: false }));
                                } else {
                                  video.currentTime = 0;
                                  video.play().catch(() => {});
                                  setPlayingVideos(prev => ({ ...prev, [character.id]: true }));
                                }
                              }
                            }}
                          >
                            <video
                              src={videoUrl}
                              loop
                              playsInline
                              muted={false}
                              className="absolute inset-0 h-full w-full object-cover"
                              onMouseEnter={(e) => {
                                // Only auto-play on hover for desktop (non-touch devices)
                                if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                                  e.currentTarget.currentTime = 0;
                                  e.currentTarget.play().catch(() => {});
                                  setPlayingVideos(prev => ({ ...prev, [character.id]: true }));
                                }
                              }}
                              onMouseLeave={(e) => {
                                // Only auto-pause on hover out for desktop
                                if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                                  e.currentTarget.pause();
                                  e.currentTarget.currentTime = 0;
                                  setPlayingVideos(prev => ({ ...prev, [character.id]: false }));
                                }
                              }}
                              onPlay={() => setPlayingVideos(prev => ({ ...prev, [character.id]: true }))}
                              onPause={() => setPlayingVideos(prev => ({ ...prev, [character.id]: false }))}
                            />
                            {/* Play/Pause indicator */}
                            <div 
                              className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-300 pointer-events-none ${
                                playingVideos[character.id] 
                                  ? 'opacity-0 group-hover:opacity-0' 
                                  : 'opacity-100'
                              }`}
                            >
                              <div className="rounded-full bg-white/90 p-3 sm:p-4 shadow-xl backdrop-blur-sm animate-pulse">
                                <Play className="h-6 w-6 sm:h-8 sm:w-8 text-black ml-1" />
                              </div>
                            </div>
                            {/* Tap hint for mobile - shows briefly */}
                            {!playingVideos[character.id] && (
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs sm:text-sm font-medium pointer-events-none lg:hidden animate-pulse">
                                Tap to play with sound
                              </div>
                            )}
                          </div>
                        ) : portraitUrl ? (
                          <Image
                            src={portraitUrl}
                            alt={character.name}
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 33vw, 100vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                            <span className="text-8xl font-bold text-foreground/20">
                              {character.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Basic Info */}
                      <div className="space-y-4 sm:space-y-6 lg:col-span-2">
                        <div>
                          <h3 className="text-2xl sm:text-3xl font-bold mb-2">{character.name}</h3>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="default" className="text-sm">
                              {character.role}
                            </Badge>
                            {character.vibe && (
                              <Badge variant="outline" className="text-sm">
                                {character.vibe}
                              </Badge>
                            )}
                            {charDoc?.biometrics?.age_years && (
                              <Badge variant="secondary" className="text-sm">
                                Age {charDoc.biometrics.age_years.value}
                              </Badge>
                            )}
                          </div>
                          {character.summary && (
                            <p className="text-lg text-foreground/80 leading-relaxed">
                              {character.summary}
                            </p>
                          )}
                          {character.description && (
                            <p className="mt-3 text-foreground/70 leading-relaxed">
                              {character.description}
                            </p>
                          )}
                        </div>

                        {/* Function */}
                        {charDoc?.metadata?.function && (
                          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                            <span className="text-xs text-foreground/60 uppercase tracking-wide">Function</span>
                            <p className="mt-1 text-foreground/90">{charDoc.metadata.function}</p>
                          </div>
                        )}

                        {/* AI Highlight */}
                        {generatedContent?.character_highlights?.[character.id] && (
                          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                            <p className="text-sm leading-relaxed text-foreground/80 italic">
                              {generatedContent.character_highlights[character.id]}
                            </p>
                          </div>
                        )}

                        {/* Expand Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedCharacter(isExpanded ? null : character.id)}
                          className="w-full"
                        >
                          <Info className="mr-2 h-4 w-4" />
                          {isExpanded ? 'Hide' : 'Show'} Full Dossier
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && charDoc && (
                      <div className="border-t border-white/10 p-6 space-y-8">
                        
                        {/* Biometrics */}
                        {charDoc.biometrics && (
                          <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xl font-semibold text-primary">
                              <User className="h-5 w-5" />
                              Physical Characteristics
                            </h4>
                            
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {/* Species */}
                              {charDoc.biometrics.species && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Species</span>
                                  <p className="mt-1 font-medium">{charDoc.biometrics.species.type}</p>
                                  {charDoc.biometrics.species.subtype && (
                                    <p className="text-sm text-foreground/70">{charDoc.biometrics.species.subtype}</p>
                                  )}
                                  {charDoc.biometrics.species.visual_markers && (
                                    <p className="mt-2 text-xs text-foreground/60">{charDoc.biometrics.species.visual_markers}</p>
                                  )}
                                </div>
                              )}

                              {/* Height & Weight */}
                              {charDoc.biometrics.height && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide flex items-center gap-1">
                                    <Ruler className="h-3 w-3" /> Height
                                  </span>
                                  <p className="mt-1 font-medium">
                                    {charDoc.biometrics.height.value} {charDoc.biometrics.height.unit}
                                  </p>
                                  {charDoc.biometrics.height.notes && (
                                    <p className="mt-1 text-xs text-foreground/60">{charDoc.biometrics.height.notes}</p>
                                  )}
                                </div>
                              )}

                              {charDoc.biometrics.weight && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide flex items-center gap-1">
                                    <Weight className="h-3 w-3" /> Weight
                                  </span>
                                  <p className="mt-1 font-medium">
                                    {charDoc.biometrics.weight.value} {charDoc.biometrics.weight.unit}
                                  </p>
                                  {charDoc.biometrics.weight.notes && (
                                    <p className="mt-1 text-xs text-foreground/60">{charDoc.biometrics.weight.notes}</p>
                                  )}
                                </div>
                              )}

                              {/* Build */}
                              {charDoc.biometrics.build && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Build</span>
                                  <p className="mt-1 font-medium capitalize">{charDoc.biometrics.build.body_type}</p>
                                  {charDoc.biometrics.build.notes && (
                                    <p className="mt-1 text-xs text-foreground/60">{charDoc.biometrics.build.notes}</p>
                                  )}
                                </div>
                              )}

                              {/* Colors */}
                              {charDoc.biometrics.skin_color && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Skin/Surface</span>
                                  <div className="mt-2 flex items-center gap-2">
                                    <div
                                      className="h-8 w-8 rounded border border-white/20"
                                      style={{ backgroundColor: charDoc.biometrics.skin_color.hex }}
                                    />
                                    <div>
                                      <p className="text-sm font-medium">{charDoc.biometrics.skin_color.description}</p>
                                      <p className="text-xs font-mono text-foreground/60">{charDoc.biometrics.skin_color.hex}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {charDoc.biometrics.eye_color && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide flex items-center gap-1">
                                    <Eye className="h-3 w-3" /> Eyes
                                  </span>
                                  <div className="mt-2 flex items-center gap-2">
                                    <div
                                      className="h-8 w-8 rounded-full border border-white/20"
                                      style={{ backgroundColor: charDoc.biometrics.eye_color.hex }}
                                    />
                                    <div>
                                      <p className="text-sm font-medium">{charDoc.biometrics.eye_color.description}</p>
                                      <p className="text-xs font-mono text-foreground/60">{charDoc.biometrics.eye_color.hex}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Voice */}
                            {charDoc.biometrics.voice && (
                              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                                <span className="text-xs text-foreground/60 uppercase tracking-wide flex items-center gap-1 mb-3">
                                  <Mic className="h-3 w-3" /> Voice Characteristics
                                </span>
                                <div className="grid gap-3 sm:grid-cols-3">
                                  {charDoc.biometrics.voice.pitch_range && (
                                    <div>
                                      <p className="text-xs text-foreground/60">Pitch</p>
                                      <p className="text-sm font-medium capitalize">{charDoc.biometrics.voice.pitch_range}</p>
                                    </div>
                                  )}
                                  {charDoc.biometrics.voice.tempo && (
                                    <div>
                                      <p className="text-xs text-foreground/60">Tempo</p>
                                      <p className="text-sm font-medium capitalize">{charDoc.biometrics.voice.tempo}</p>
                                    </div>
                                  )}
                                  {charDoc.biometrics.voice.timbre_notes && (
                                    <div>
                                      <p className="text-xs text-foreground/60">Timbre</p>
                                      <p className="text-sm font-medium capitalize">{charDoc.biometrics.voice.timbre_notes}</p>
                                    </div>
                                  )}
                                </div>
                                {charDoc.biometrics.voice.descriptors && charDoc.biometrics.voice.descriptors.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {charDoc.biometrics.voice.descriptors.map((desc: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {desc}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tics */}
                            {charDoc.biometrics.tics && (
                              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                                <span className="text-xs text-foreground/60 uppercase tracking-wide mb-3 block">
                                  Behavioral Tics ({charDoc.biometrics.tics.frequency})
                                </span>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {charDoc.biometrics.tics.motor && charDoc.biometrics.tics.motor.length > 0 && (
                                    <div>
                                      <p className="text-xs text-foreground/60 mb-1">Motor</p>
                                      <div className="space-y-1">
                                        {charDoc.biometrics.tics.motor.map((tic: string, i: number) => (
                                          <p key={i} className="text-sm">• {tic}</p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {charDoc.biometrics.tics.verbal && charDoc.biometrics.tics.verbal.length > 0 && (
                                    <div>
                                      <p className="text-xs text-foreground/60 mb-1">Verbal</p>
                                      <div className="space-y-1">
                                        {charDoc.biometrics.tics.verbal.map((tic: string, i: number) => (
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
                          <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xl font-semibold text-primary">
                              <Palette className="h-5 w-5" />
                              Visual Design
                            </h4>

                            <div className="grid gap-4 lg:grid-cols-2">
                              {/* Silhouette & Surface */}
                              {charDoc.look.silhouette && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Silhouette</span>
                                  <p className="mt-1">{charDoc.look.silhouette}</p>
                                </div>
                              )}

                              {charDoc.look.surface && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Surface</span>
                                  <p className="mt-1">{charDoc.look.surface.materials}</p>
                                  {charDoc.look.surface.finish && (
                                    <p className="text-sm text-foreground/70 capitalize">{charDoc.look.surface.finish} finish</p>
                                  )}
                                  {charDoc.look.surface.texture_rules && (
                                    <p className="mt-2 text-xs text-foreground/60">{charDoc.look.surface.texture_rules}</p>
                                  )}
                                </div>
                              )}

                              {/* Color Palette */}
                              {charDoc.look.palette?.anchors && charDoc.look.palette.anchors.length > 0 && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4 lg:col-span-2">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide mb-3 block">Character Palette</span>
                                  <div className="flex flex-wrap gap-3">
                                    {charDoc.look.palette.anchors.map((color: string, i: number) => (
                                      <div key={i} className="flex flex-col items-center gap-2">
                                        <div
                                          className="h-12 w-12 rounded-lg border-2 border-white/20 shadow-lg"
                                          style={{ backgroundColor: color }}
                                        />
                                        <span className="text-xs font-mono text-foreground/60">{color}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {charDoc.look.palette.notes && (
                                    <p className="mt-3 text-sm text-foreground/70">{charDoc.look.palette.notes}</p>
                                  )}
                                </div>
                              )}

                              {/* Eyes */}
                              {charDoc.look.eyes && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide flex items-center gap-1">
                                    <Eye className="h-3 w-3" /> Eye Design
                                  </span>
                                  <p className="mt-1 capitalize">{charDoc.look.eyes.type}</p>
                                  {charDoc.look.eyes.catchlight_shape && (
                                    <p className="text-sm text-foreground/70">Catchlight: {charDoc.look.eyes.catchlight_shape}</p>
                                  )}
                                  {charDoc.look.eyes.behaviors && charDoc.look.eyes.behaviors.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {charDoc.look.eyes.behaviors.map((behavior: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-[10px]">
                                          {behavior}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Wardrobe */}
                              {charDoc.look.wardrobe && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide flex items-center gap-1">
                                    <Shirt className="h-3 w-3" /> Wardrobe
                                  </span>
                                  {charDoc.look.wardrobe.items && charDoc.look.wardrobe.items.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-foreground/60 mb-1">Items</p>
                                      {charDoc.look.wardrobe.items.map((item: string, i: number) => (
                                        <p key={i} className="text-sm">• {item}</p>
                                      ))}
                                    </div>
                                  )}
                                  {charDoc.look.wardrobe.accessories && charDoc.look.wardrobe.accessories.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-foreground/60 mb-1">Accessories</p>
                                      {charDoc.look.wardrobe.accessories.map((item: string, i: number) => (
                                        <p key={i} className="text-sm">• {item}</p>
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
                          <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xl font-semibold text-primary">
                              <Smile className="h-5 w-5" />
                              Performance Specs
                            </h4>

                            <div className="grid gap-4 sm:grid-cols-2">
                              {charDoc.performance.pose_defaults && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Default Pose</span>
                                  <p className="mt-1 text-sm">{charDoc.performance.pose_defaults}</p>
                                </div>
                              )}

                              {charDoc.performance.expression_set && charDoc.performance.expression_set.length > 0 && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Expressions</span>
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {charDoc.performance.expression_set.map((expr: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {expr}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {charDoc.performance.gestural_loops && charDoc.performance.gestural_loops.length > 0 && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4 sm:col-span-2">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Signature Gestures</span>
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {charDoc.performance.gestural_loops.map((gesture: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs">
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
                          <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xl font-semibold text-primary">
                              <Camera className="h-5 w-5" />
                              Cinematography Override
                            </h4>

                            <div className="grid gap-4 lg:grid-cols-2">
                              {charDoc.scene_presence.camera_override && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Camera</span>
                                  {charDoc.scene_presence.camera_override.lenses && (
                                    <p className="mt-1 text-sm">Lenses: {charDoc.scene_presence.camera_override.lenses.join(", ")}</p>
                                  )}
                                  {charDoc.scene_presence.camera_override.framing && (
                                    <p className="text-sm">Framing: {charDoc.scene_presence.camera_override.framing}</p>
                                  )}
                                  {charDoc.scene_presence.camera_override.movement && (
                                    <p className="text-sm">Movement: {charDoc.scene_presence.camera_override.movement}</p>
                                  )}
                                </div>
                              )}

                              {charDoc.scene_presence.lighting_override && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                  <span className="text-xs text-foreground/60 uppercase tracking-wide">Lighting</span>
                                  {charDoc.scene_presence.lighting_override.key && (
                                    <p className="mt-1 text-sm">Key: {charDoc.scene_presence.lighting_override.key}</p>
                                  )}
                                  {charDoc.scene_presence.lighting_override.fill && (
                                    <p className="text-sm">Fill: {charDoc.scene_presence.lighting_override.fill}</p>
                                  )}
                                  {charDoc.scene_presence.lighting_override.edge && (
                                    <p className="text-sm">Edge: {charDoc.scene_presence.lighting_override.edge}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Showcase Scene */}
                        {charDoc.showcase_scene_prompt && (
                          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
                            <span className="text-xs text-primary uppercase tracking-wide font-semibold">Showcase Scene</span>
                            <p className="mt-2 text-foreground/90 leading-relaxed italic">
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
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              <h2 className="font-serif text-4xl font-bold">Character Design System</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {visualAesthetics.species_design.types.map((type: any, idx: number) => (
                <div
                  key={idx}
                  className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6"
                >
                  <h3 className="text-2xl font-semibold text-primary">{type.name}</h3>
                  
                  <div className="space-y-3 text-sm">
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
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Film className="h-8 w-8 text-primary" />
            <h2 className="font-serif text-4xl font-bold">Production Design</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Production Style */}
            {productionStyle && (
              <div className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
                <h3 className="flex items-center gap-2 text-2xl font-semibold">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Visual Style
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-foreground/60">Medium:</span>
                    <p className="mt-1 font-medium text-lg">{productionStyle.medium}</p>
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
              <div className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
                <h3 className="flex items-center gap-2 text-2xl font-semibold">
                  <Palette className="h-6 w-6 text-primary" />
                  Color Design
                </h3>
                <div className="space-y-4 text-sm">
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
              <div className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
                <h3 className="flex items-center gap-2 text-2xl font-semibold">
                  <Lightbulb className="h-6 w-6 text-primary" />
                  Lighting Design
                </h3>
                <div className="space-y-3 text-sm">
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
              <div className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
                <h3 className="flex items-center gap-2 text-2xl font-semibold">
                  <Camera className="h-6 w-6 text-primary" />
                  Camera & Lenses
                </h3>
                <div className="space-y-3 text-sm">
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
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              <h2 className="font-serif text-4xl font-bold">Locations & Sets</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visualAesthetics.sets_and_prop_visuals.primary_sets.map((set: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium">{set}</p>
                </div>
              ))}
            </div>

            {visualAesthetics.sets_and_prop_visuals.prop_style && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <span className="text-sm text-foreground/60">Prop Style:</span>
                <p className="mt-2 text-foreground/90">{visualAesthetics.sets_and_prop_visuals.prop_style}</p>
              </div>
            )}

            {visualAesthetics.sets_and_prop_visuals.runner_gags_visual && visualAesthetics.sets_and_prop_visuals.runner_gags_visual.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <span className="text-sm text-foreground/60">Running Gags:</span>
                <ul className="mt-3 space-y-2">
                  {visualAesthetics.sets_and_prop_visuals.runner_gags_visual.map((gag: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/80">
                      <span className="text-primary">•</span>
                      {gag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Post-Production */}
        {visualAesthetics?.post_grade && (
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Settings2 className="h-8 w-8 text-primary" />
              <h2 className="font-serif text-4xl font-bold">Post-Production</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {visualAesthetics.post_grade.curve && (
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
                  <span className="text-sm text-foreground/60">Color Curve:</span>
                  <p className="mt-2 text-lg font-medium text-foreground/90">{visualAesthetics.post_grade.curve}</p>
                </div>
              )}
              {visualAesthetics.post_grade.lut && (
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
                  <span className="text-sm text-foreground/60">LUT:</span>
                  <p className="mt-2 text-lg font-medium text-foreground/90">{visualAesthetics.post_grade.lut}</p>
                </div>
              )}
              {visualAesthetics.post_grade.grain && (
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
                  <span className="text-sm text-foreground/60">Film Grain:</span>
                  <p className="mt-2 text-foreground/90">
                    {visualAesthetics.post_grade.grain.intensity} • {visualAesthetics.post_grade.grain.placement}
                  </p>
                </div>
              )}
              {visualAesthetics.post_grade.halation && (
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
                  <span className="text-sm text-foreground/60">Halation:</span>
                  <p className="mt-2 text-foreground/90">
                    {visualAesthetics.post_grade.halation.strength} • {visualAesthetics.post_grade.halation.scope}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Technical Pipeline */}
        {visualAesthetics?.pipeline && (
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8 text-primary" />
              <h2 className="font-serif text-4xl font-bold">Technical Specifications</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visualAesthetics.pipeline.color_management && (
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
                  <Monitor className="h-5 w-5 text-primary mb-2" />
                  <span className="text-sm text-foreground/60">Color Management:</span>
                  <p className="mt-2 font-medium text-foreground/90">{visualAesthetics.pipeline.color_management}</p>
                </div>
              )}
              {visualAesthetics.pipeline.aspect_ratio && (
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
                  <Monitor className="h-5 w-5 text-primary mb-2" />
                  <span className="text-sm text-foreground/60">Aspect Ratio:</span>
                  <p className="mt-2 font-medium text-foreground/90">{visualAesthetics.pipeline.aspect_ratio}</p>
                </div>
              )}
              {visualAesthetics.pipeline.frame_rates && (
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
                  <Film className="h-5 w-5 text-primary mb-2" />
                  <span className="text-sm text-foreground/60">Frame Rate:</span>
                  <p className="mt-2 font-medium text-foreground/90">{visualAesthetics.pipeline.frame_rates.playback} fps</p>
                </div>
              )}
            </div>

            {visualAesthetics.pipeline.render_order && visualAesthetics.pipeline.render_order.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
                <h3 className="text-lg font-semibold mb-4">Render Pipeline</h3>
                <div className="flex flex-wrap gap-2">
                  {visualAesthetics.pipeline.render_order.map((step: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {i + 1}. {step}
                      </Badge>
                      {i < visualAesthetics.pipeline.render_order!.length - 1 && (
                        <span className="text-foreground/30">→</span>
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
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              <h2 className="font-serif text-4xl font-bold">What Makes It Special</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {generatedContent.unique_features.map((feature: string, i: number) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">{feature}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Behind the Scenes */}
        {generatedContent?.behind_the_scenes && (
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Film className="h-8 w-8 text-primary" />
              <h2 className="font-serif text-4xl font-bold">Behind the Scenes</h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8">
              <p className="text-lg leading-relaxed text-foreground/80">
                {generatedContent.behind_the_scenes}
              </p>
            </div>
          </section>
        )}

        {/* Episode Concepts */}
        {generatedContent?.episode_concepts && generatedContent.episode_concepts.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Film className="h-8 w-8 text-primary" />
              <h2 className="font-serif text-4xl font-bold">Story Concepts</h2>
            </div>

            <div className="space-y-4">
              {generatedContent.episode_concepts.map((episode: any, i: number) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary text-lg">
                      {i + 1}
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="text-xl font-semibold">{episode.title}</h3>
                      <p className="text-foreground/80 leading-relaxed">
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
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-primary" />
            <h2 className="font-serif text-4xl font-bold">Show Metadata</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Show ID */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <span className="text-xs text-foreground/60 uppercase tracking-wide">Show ID</span>
              <p className="mt-2 font-mono text-sm text-foreground/90 break-all">{showData.id}</p>
            </div>

            {/* Model */}
            {showData.blueprint && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <span className="text-xs text-foreground/60 uppercase tracking-wide">AI Model</span>
                <p className="mt-2 text-foreground/90">GPT-4o</p>
              </div>
            )}

            {/* Created Date */}
            {showData.blueprint && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <span className="text-xs text-foreground/60 uppercase tracking-wide">Created</span>
                <p className="mt-2 text-foreground/90">
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
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <span className="text-xs text-foreground/60 uppercase tracking-wide">Characters</span>
                <p className="mt-2 text-2xl font-bold text-primary">{characters.length}</p>
              </div>
            )}

            {/* Assets Count */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <span className="text-xs text-foreground/60 uppercase tracking-wide">Total Assets</span>
              <p className="mt-2 text-2xl font-bold text-primary">
                {(assets.portraits?.length || 0) + 
                 (assets.poster ? 1 : 0) + 
                 (assets.libraryPoster ? 1 : 0) + 
                 (assets.trailer ? 1 : 0) + 
                 (assets.portraitGrid ? 1 : 0)}
              </p>
            </div>

            {/* Composition */}
            {visualAesthetics?.composition?.symmetry_bias && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <span className="text-xs text-foreground/60 uppercase tracking-wide">Composition Style</span>
                <p className="mt-2 text-foreground/90 capitalize">{visualAesthetics.composition.symmetry_bias}</p>
              </div>
            )}
          </div>

          {/* Composition Details */}
          {visualAesthetics?.composition && (
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
              <h3 className="text-lg font-semibold mb-4">Composition Guidelines</h3>
              <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
              <h3 className="text-lg font-semibold mb-4">Materials & Textures</h3>
              <div className="space-y-4">
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
            <div className="rounded-xl border border-red-900/20 bg-gradient-to-br from-red-900/10 to-transparent p-6">
              <h3 className="text-lg font-semibold mb-3 text-red-400">Visual Prohibitions</h3>
              <div className="space-y-2">
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
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
              <h3 className="text-lg font-semibold mb-4">Export Specifications</h3>
              <div className="grid gap-4 sm:grid-cols-2">
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
      <footer className="border-t border-white/10 bg-black/50 px-4 py-10 mt-10 sm:px-6 sm:py-12 lg:py-16 lg:mt-16">
        <div className="mx-auto max-w-7xl">
          {/* Call to Action */}
          <div className="mb-8 sm:mb-12 flex flex-col items-center justify-center gap-4 sm:gap-6 text-center">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">Explore More Shows</h3>
            <p className="max-w-2xl text-sm sm:text-base text-foreground/70">
              Discover other incredible productions in our library
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="default"
                size="lg"
                onClick={() => router.push("/library")}
                className="rounded-full px-6 sm:px-8 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all w-full sm:w-auto"
              >
                <Library className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Browse All Shows
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/")}
                className="rounded-full px-6 sm:px-8 text-sm sm:text-base font-semibold w-full sm:w-auto"
              >
                <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Create Your Own
              </Button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="border-t border-white/10 pt-6 sm:pt-8 text-center">
            <p className="text-xs sm:text-sm text-foreground/60">
              Created with Production Flow • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
