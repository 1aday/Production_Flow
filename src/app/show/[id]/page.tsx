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

type ShowData = {
  id: string;
  title: string;
  showTitle?: string;
  blueprint: {
    show_title: string;
    show_logline: string;
    poster_description: string;
    production_style: {
      medium: string;
      cinematic_references: string[];
      visual_treatment: string;
      stylization_level: string;
    };
    visual_aesthetics: {
      goal?: string;
      color: {
        anchor_hex: string[];
        palette_bias: string;
        skin_protection?: string;
        white_balance_baseline_K?: number;
        prohibitions?: string[];
      };
      lighting: {
        temperature_model: string;
        key: string;
        fill?: string;
        edge?: string;
        practicals_in_frame?: boolean;
        halation_policy?: string;
        no_go?: string[];
      };
      camera: {
        sensor?: string;
        lens_family: string[];
        movement?: string[];
        dof_guides?: string;
        coverage_rules?: string[];
      };
      composition?: {
        symmetry_bias?: string;
        leading_lines?: string;
        foreground_depth?: string;
        color_blocking?: string;
      };
      materials_and_textures?: {
        human_textures?: string;
        set_surfaces?: string[];
        patina?: string;
        notes?: string;
      };
      species_design?: {
        types: Array<{
          name: string;
          silhouette?: string;
          surface_finish?: string;
          materials?: string;
          eyes?: {
            type?: string;
            catchlight_shape?: string;
            behaviors?: string[];
          };
          face_modularity?: string;
          stress_cues?: string;
          palette?: {
            anchors?: string[];
            notes?: string;
          };
        }>;
      };
      sets_and_prop_visuals?: {
        primary_sets?: string[];
        prop_style?: string;
        display_devices?: string;
        runner_gags_visual?: string[];
      };
      post_grade?: {
        curve?: string;
        lut?: string;
        grain?: {
          placement?: string;
          intensity?: string;
        };
        halation?: {
          scope?: string;
          strength?: string;
        };
      };
      pipeline?: {
        color_management?: string;
        frame_rates?: {
          animation_capture?: number;
          playback?: number;
          live_action_capture?: number;
        };
        aspect_ratio?: string;
        grain_global?: string;
        render_order?: string[];
      };
    };
  };
  characterSeeds?: Array<{
    id: string;
    name: string;
    role: string;
    age: number;
    description: string;
    personality: string[];
  }>;
  characterDocs?: Record<string, any>;
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

      {/* Trailer Hero Section */}
      {assets.trailer ? (
        <div className="relative h-[70vh] w-full overflow-hidden">
          <video
            src={assets.trailer}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
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

        {/* Characters */}
        {characters.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <h2 className="font-serif text-4xl font-bold">Cast of Characters</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {characters.map((character) => {
                const portraitUrl = assets.characterPortraits?.[character.id] || 
                  assets.portraits.find((p) =>
                    p.toLowerCase().includes(character.id.toLowerCase())
                  );

                return (
                  <div
                    key={character.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent transition-all hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(229,9,20,0.3)]"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {portraitUrl ? (
                        <Image
                          src={portraitUrl}
                          alt={character.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                          <span className="text-6xl font-bold text-foreground/20">
                            {character.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{character.name}</h3>
                        <p className="text-sm text-primary">{character.role}</p>
                        <p className="text-xs text-foreground/50 mt-1">Age {character.age}</p>
                      </div>
                      
                      {character.description && (
                        <p className="text-xs text-foreground/70 leading-relaxed line-clamp-3">
                          {character.description}
                        </p>
                      )}

                      {generatedContent?.character_highlights?.[character.id] && (
                        <p className="text-xs text-foreground/80 leading-relaxed border-t border-white/10 pt-3">
                          {generatedContent.character_highlights[character.id]}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {character.personality?.slice(0, 3).map((trait, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[10px] px-2 py-0.5"
                          >
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
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
              {visualAesthetics.species_design.types.map((type, idx) => (
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
                            {type.eyes.behaviors.map((behavior, i) => (
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
                          {type.palette.anchors.map((color, i) => (
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
                        {productionStyle.cinematic_references.map((ref, i) => (
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
                        {visualAesthetics.color.anchor_hex.map((color, i) => (
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
                        {visualAesthetics.camera.movement.map((move, i) => (
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
                        {visualAesthetics.camera.coverage_rules.map((rule, i) => (
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
              {visualAesthetics.sets_and_prop_visuals.primary_sets.map((set, i) => (
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
                  {visualAesthetics.sets_and_prop_visuals.runner_gags_visual.map((gag, i) => (
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
                  {visualAesthetics.pipeline.render_order.map((step, i) => (
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
              {generatedContent.unique_features.map((feature, i) => (
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
              {generatedContent.episode_concepts.map((episode, i) => (
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

        {/* Poster Description */}
        {posterDesc && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Camera className="h-8 w-8 text-primary" />
              <h2 className="font-serif text-4xl font-bold">Key Art Vision</h2>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/5 to-transparent p-8">
              <p className="text-lg leading-relaxed text-foreground/80 italic">
                {posterDesc}
              </p>
            </div>
          </section>
        )}
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
