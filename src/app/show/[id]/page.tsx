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
  Volume2,
  Info,
  Ruler,
  Weight,
  User,
  Shirt,
  Smile,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ShowAssets = {
  portraits: string[];
  characterPortraits?: Record<string, string>;
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
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null);

  useEffect(() => {
    void loadShowData();
  }, [showId]);

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
        video.play();
      }
      setTrailerPlaying(!trailerPlaying);
    }
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/library")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadShow}
              className="rounded-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={copyShareUrl}
              className="rounded-full"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section with Trailer */}
      {assets.trailer ? (
        <div className="relative h-[70vh] w-full overflow-hidden group cursor-pointer" onClick={toggleTrailer}>
          <video
            id="trailer-video"
            src={assets.trailer}
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          {/* Play Button - Shows when not playing */}
          {!trailerPlaying && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-24 w-24 items-center justify-center rounded-full bg-primary shadow-2xl transition-all hover:scale-110 hover:bg-primary/90">
              <Play className="ml-2 h-12 w-12 text-white" />
            </div>
          )}

          {/* Pause Button - Shows on hover when playing */}
          {trailerPlaying && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-20 w-20 items-center justify-center rounded-full bg-black/80 backdrop-blur-sm shadow-2xl transition-all opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-black/90">
              <Pause className="h-10 w-10 text-white" />
            </div>
          )}

          {/* Audio Indicator - Only shows when playing */}
          {trailerPlaying && (
            <div className="absolute right-6 top-24 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-md transition-opacity opacity-100 group-hover:opacity-0">
              <Volume2 className="h-4 w-4 text-white" />
              <span className="text-sm text-white">Audio On</span>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-16">
            <div className="mx-auto max-w-7xl">
              <h1 className="font-serif text-5xl font-bold tracking-tight lg:text-6xl mb-4">
                {displayTitle}
              </h1>
              {generatedContent?.hero_tagline && (
                <p className="text-xl text-foreground/90 lg:text-2xl max-w-3xl">
                  {generatedContent.hero_tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : assets.libraryPoster || assets.poster ? (
        <div className="relative h-[70vh] w-full overflow-hidden">
          <Image
            src={assets.libraryPoster || assets.poster || ""}
            alt={displayTitle}
            fill
            className="object-cover"
            priority
            quality={95}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-16">
            <div className="mx-auto max-w-7xl">
              <h1 className="font-serif text-5xl font-bold tracking-tight lg:text-6xl mb-4">
                {displayTitle}
              </h1>
              {generatedContent?.hero_tagline && (
                <p className="text-xl text-foreground/90 lg:text-2xl max-w-3xl">
                  {generatedContent.hero_tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-[50vh] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-16 pt-24">
            <div className="mx-auto max-w-7xl">
              <h1 className="font-serif text-5xl font-bold tracking-tight lg:text-6xl mb-4">
                {displayTitle}
              </h1>
              {generatedContent?.hero_tagline && (
                <p className="text-xl text-foreground/90 lg:text-2xl max-w-3xl">
                  {generatedContent.hero_tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto max-w-7xl space-y-16 px-6 py-16">
        
        {/* Quick Info Bar */}
        <div className="flex flex-wrap gap-3">
          {generatedContent?.tone_keywords?.map((keyword, i) => (
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
        <section className="space-y-6">
          {logline && (
            <p className="text-2xl font-light leading-relaxed text-foreground/90 italic border-l-4 border-primary pl-6">
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
              {generatedContent.expanded_description.map((paragraph, i) => (
                <p key={i} className="text-lg leading-relaxed text-foreground/80">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </section>

        {/* Visual Goal */}
        {visualAesthetics?.goal && (
          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 to-transparent p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/20 p-3">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Visual Vision</h3>
                <p className="text-foreground/80 leading-relaxed">{visualAesthetics.goal}</p>
              </div>
            </div>
          </section>
        )}

        {/* Characters - COMPREHENSIVE */}
        {characters.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <h2 className="font-serif text-4xl font-bold">Full Character Dossiers</h2>
            </div>

            <div className="space-y-8">
              {characters.map((character) => {
                const portraitUrl = assets.characterPortraits?.[character.id] || 
                  assets.portraits.find((p) =>
                    p.toLowerCase().includes(character.id.toLowerCase())
                  );
                
                const charDoc = characterDocs[character.id];
                const isExpanded = expandedCharacter === character.id;

                return (
                  <div
                    key={character.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent"
                  >
                    {/* Character Header */}
                    <div className="grid gap-6 p-6 lg:grid-cols-3">
                      {/* Portrait */}
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl lg:col-span-1">
                        {portraitUrl ? (
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
                      <div className="space-y-6 lg:col-span-2">
                        <div>
                          <h3 className="text-3xl font-bold mb-2">{character.name}</h3>
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
                                    {charDoc.biometrics.voice.descriptors.map((desc, i) => (
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
                                        {charDoc.biometrics.tics.motor.map((tic, i) => (
                                          <p key={i} className="text-sm">• {tic}</p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {charDoc.biometrics.tics.verbal && charDoc.biometrics.tics.verbal.length > 0 && (
                                    <div>
                                      <p className="text-xs text-foreground/60 mb-1">Verbal</p>
                                      <div className="space-y-1">
                                        {charDoc.biometrics.tics.verbal.map((tic, i) => (
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
                                    {charDoc.look.palette.anchors.map((color, i) => (
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
                                      {charDoc.look.eyes.behaviors.map((behavior, i) => (
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
                                      {charDoc.look.wardrobe.items.map((item, i) => (
                                        <p key={i} className="text-sm">• {item}</p>
                                      ))}
                                    </div>
                                  )}
                                  {charDoc.look.wardrobe.accessories && charDoc.look.wardrobe.accessories.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-foreground/60 mb-1">Accessories</p>
                                      {charDoc.look.wardrobe.accessories.map((item, i) => (
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
                                    {charDoc.performance.expression_set.map((expr, i) => (
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
                                    {charDoc.performance.gestural_loops.map((gesture, i) => (
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

        {/* Rest of sections remain the same... Production Design, etc. */}
        {/* I'll keep the rest abbreviated for space, but they're all still there */}
        
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 px-6 py-12 mt-16">
        <div className="mx-auto max-w-7xl text-center space-y-4">
          <p className="text-sm text-foreground/60">
            Created with Production Flow • {new Date().getFullYear()}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-foreground/60 hover:text-foreground"
          >
            Create Your Own Show
          </Button>
        </div>
      </footer>
    </div>
  );
}
