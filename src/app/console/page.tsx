"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Copy, Loader2, SendHorizontal, Library, Plus, X, Clock, Settings, FileText, Sliders, ListChecks, Download, Eye, ArrowLeft, AlertCircle, Sparkles, Users, Film, PlayCircle, Boxes, Clapperboard, Zap, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BackgroundTasksIndicator } from "@/components/BackgroundTasksIndicator";
import { TrailerModelSelector } from "@/components/TrailerModelSelector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LIBRARY_LOAD_STORAGE_KEY, STYLIZATION_GUARDRAILS_STORAGE_KEY } from "@/lib/constants";
import { calculateShowCompletion } from "@/lib/show-completion";
import { addBackgroundTask, updateBackgroundTask, removeBackgroundTask, getShowTasks } from "@/lib/background-tasks";
import { getShowUrl } from "@/lib/slug";
import { ShowFormatVisualizer, type ShowFormat } from "@/components/ShowFormatVisualizer";
import { EpisodeCards, type Episode } from "@/components/EpisodeCards";
import { Navbar } from "@/components/Navbar";

// Helper to sanitize filename for downloads
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}


type FrameRates = {
  animation_capture: number;
  playback: number;
  live_action_capture: number;
};

type ShutterAngle = {
  animation: number;
  live_action: number;
};

type Pipeline = {
  color_management: string;
  frame_rates: FrameRates;
  shutter_angle: ShutterAngle;
  aspect_ratio: string;
  highlight_rolloff: string;
  black_floor: string;
  grain_global: string;
  render_order?: string[];
};

type ColorPalette = {
  palette_bias: string;
  anchor_hex: string[];
  skin_protection: string;
  white_balance_baseline_K?: number;
  prohibitions?: string[];
};

type Lighting = {
  temperature_model: string;
  key: string;
  fill: string;
  edge: string;
  practicals_in_frame: boolean;
  halation_policy: string;
  no_go?: string[];
};

type Camera = {
  sensor: string;
  lens_family: string[];
  movement?: string[];
  dof_guides: string;
  coverage_rules?: string[];
};

type Composition = {
  symmetry_bias: string;
  leading_lines: string;
  foreground_depth: string;
  color_blocking: string;
};

type MaterialsAndTextures = {
  human_textures: string;
  set_surfaces: string[];
  patina: string;
  notes?: string;
};

type SpeciesEyes = {
  type?: string;
  catchlight_shape: string;
  behaviors?: string[];
};

type SpeciesPalette = {
  anchors?: string[];
  notes?: string;
};

type SpeciesType = {
  name: string;
  silhouette: string;
  surface_finish: string;
  materials?: string;
  eyes: SpeciesEyes;
  face_modularity: string;
  stress_cues?: string;
  palette?: SpeciesPalette;
};

type SpeciesDesign = {
  types: SpeciesType[];
};

type SetsAndPropVisuals = {
  primary_sets: string[];
  prop_style: string;
  display_devices: string;
  runner_gags_visual?: string[];
};

type PostGrade = {
  curve: string;
  lut: string;
  grain?: {
    placement?: string;
    intensity?: string;
  };
  halation?: {
    scope?: string;
    strength?: string;
  };
};

type ExportSpecs = {
  stills: string[];
  video_intermediate: string;
  delivery_color: string;
  plates: string[];
};

type VisualAesthetics = {
  goal: string;
  pipeline: Pipeline;
  color: ColorPalette;
  lighting: Lighting;
  camera: Camera;
  composition: Composition;
  materials_and_textures: MaterialsAndTextures;
  species_design: SpeciesDesign;
  sets_and_prop_visuals: SetsAndPropVisuals;
  post_grade: PostGrade;
  export_specs: ExportSpecs;
  prohibitions_global: string[];
};

type ShowBlueprint = {
  show_title: string;
  show_logline: string;
  poster_description: string;
  production_style?: {
    medium?: string;
    cinematic_references?: string[];
    visual_treatment?: string;
    stylization_level?: string;
  };
  visual_aesthetics: VisualAesthetics;
};

type ApiResponse = {
  data: ShowBlueprint;
  raw: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  error?: string;
  posterAvailable?: boolean;
};

type CharacterSeed = {
  id: string;
  name: string;
  summary: string;
  role?: string | null;
  vibe?: string | null;
};

type CharacterDocument = {
  character: string;
  inherits: string;
  metadata?: {
    role?: string;
    function?: string;
    tags?: string[];
  };
  biometrics?: {
    species?: {
      type?: string;
      subtype?: string;
      scale_ratio?: number | string;
      visual_markers?: string;
      materiality?: string;
      physiology?: string;
    };
    gender_identity?: string;
    distinguishing_features?: string;
    attire_notes?: string;
    age_years?: { value?: number; approximate?: boolean };
    ethnicity?: string;
    skin_color?: { hex?: string; description?: string };
    eye_color?: { hex?: string; description?: string; patterning?: string };
    has_hair?: boolean;
    hair?: {
      style?: string;
      color_hex?: string;
      color_description?: string;
      length?: string;
      texture?: string;
    };
    facial_hair?: { has_facial_hair?: boolean; style?: string; density?: string };
    height?: { value?: number; unit?: string; notes?: string };
    weight?: { value?: number; unit?: string; notes?: string };
    build?: { body_type?: string; notes?: string };
    voice?: {
      descriptors?: string[];
      pitch_range?: string;
      tempo?: string;
      timbre_notes?: string;
    };
    accent?: { style?: string; strength?: string; code_switching?: string };
    tics?: { motor?: string[]; verbal?: string[]; frequency?: string };
  };
  look?: {
    silhouette?: string;
    palette?: { anchors?: string[]; notes?: string };
    surface?: {
      materials?: string;
      finish?: string;
      texture_rules?: string;
      prohibitions?: string[];
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
      eyelids?: string[];
    };
    wardrobe?: {
      silhouette_rules?: string;
      items?: string[];
      accessories?: string[];
      avoid?: string[];
    };
  };
  performance?: {
    pose_defaults?: string;
    expression_set?: string[];
    gestural_loops?: string[];
    animation_cadence?: {
      animate_fps?: number;
      shutter_angle?: number;
      hold_style?: string;
    };
  };
  scene_presence?: {
    camera_override?: {
      lenses?: string[];
      framing?: string;
      movement?: string;
      dof?: string;
    };
    lighting_override?: {
      key?: string;
      fill?: string;
      edge?: string;
      notes?: string;
    };
    composition_override?: {
      symmetry_bias?: string;
      leading_lines?: string;
      foreground?: string;
    };
    set_nook?: {
      location?: string;
      materials?: string[];
      props?: string[];
      signage?: string[];
    };
  };
  behavior_and_rules?: {
    do?: string[];
    do_not?: string[];
    interaction_readiness?: {
      with_humans?: string;
      with_puppets?: string;
      with_props?: string;
    };
  };
  sound?: {
    ambience?: string;
    fx?: string[];
    dialog_policy?: string;
    music_tone?: string;
  };
  delivery?: {
    motion_button?: string;
    slate?: string;
    stills?: string[];
    exports?: string[];
  };
  showcase_scene_prompt?: string;
  [key: string]: unknown;
};

type CharacterSpecies =
  CharacterDocument["biometrics"] extends { species?: infer T }
    ? NonNullable<T>
    : {
        type?: string;
        subtype?: string;
        scale_ratio?: number | string;
        visual_markers?: string;
        materiality?: string;
        physiology?: string;
        palette?: { anchors?: string[]; notes?: string };
      };

type CharacterWardrobe =
  CharacterDocument["look"] extends { wardrobe?: infer T }
    ? NonNullable<T>
    : {
        silhouette_rules?: string;
        items?: string[];
        accessories?: string[];
        avoid?: string[];
      };

type CharacterBehavior =
  CharacterDocument["behavior_and_rules"] extends infer T
    ? NonNullable<T>
    : {
        do?: string[];
        do_not?: string[];
        interaction_readiness?: Record<string, string>;
};

type ModelId = "gpt-5" | "gpt-4o";
type ImageModelId = "gpt-image" | "flux" | "nano-banana-pro";
type VideoGenerationModelId = "sora-2" | "sora-2-pro" | "veo-3.1";

const MODEL_OPTIONS: Array<{
  id: ModelId;
  label: string;
  helper: string;
}> = [
  {
    id: "gpt-5",
    label: "GPT-5",
    helper: "High-reasoning structured output",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    helper: "Fast JSON mode responses",
  },
];

const IMAGE_MODEL_OPTIONS: Array<{
  id: ImageModelId;
  label: string;
  description: string;
}> = [
  {
    id: "gpt-image",
    label: "GPT Image 1",
    description: "OpenAI's image model, high quality, follows prompts well",
  },
  {
    id: "flux",
    label: "FLUX 1.1 Pro",
    description: "Fast, excellent for stylized art and character consistency",
  },
  {
    id: "nano-banana-pro",
    label: "Nano Banana Pro",
    description: "Google's model with 2K resolution output",
  },
];

const VIDEO_GENERATION_MODEL_OPTIONS: Array<{
  id: VideoGenerationModelId;
  label: string;
  description: string;
}> = [
  {
    id: "sora-2",
    label: "Sora 2",
    description: "Fast, good quality, 12s max",
  },
  {
    id: "sora-2-pro",
    label: "Sora 2 Pro",
    description: "Higher fidelity, 12s max",
  },
  {
    id: "veo-3.1",
    label: "VEO 3.1",
    description: "Google's model, different style, 8s max",
  },
];

let cachedAudioContext: AudioContext | null = null;

const LOADING_MESSAGES = [
  "Locking show_logline and tone directives",
  "Sequencing biometrics & species detail maps",
  "Balancing lighting matrices with camera grammar",
  "Curating wardrobe silhouettes and texture palettes",
  "Authoring behavioral rails & scene presence cues",
  "Scoring delivery exports and validation hooks",
] as const;

type VideoModelId = "openai/sora-2" | "openai/sora-2-pro" | "google/veo-3.1";
type VideoAspectRatio = "portrait" | "landscape";
type VideoDuration = 4 | 8 | 12;
type VideoResolution = "standard" | "high";

type VideoModelOption = {
  id: VideoModelId;
  label: string;
  description: string;
  seconds: readonly VideoDuration[];
  aspectRatios: readonly VideoAspectRatio[];
  resolutions?: readonly VideoResolution[];
};

const VIDEO_MODEL_OPTIONS: readonly VideoModelOption[] = [
  {
    id: "google/veo-3.1",
    label: "VEO 3.1",
    description: "Google's fast model, great consistency.",
    seconds: [4, 8],
    aspectRatios: ["portrait", "landscape"],
  },
  {
    id: "openai/sora-2",
    label: "Sora 2",
    description: "Fast generation, 720p delivery.",
    seconds: [4, 8, 12],
    aspectRatios: ["portrait", "landscape"],
  },
  {
    id: "openai/sora-2-pro",
    label: "Sora 2 Pro",
    description: "Higher fidelity up to 1024p.",
    seconds: [4, 8, 12],
    aspectRatios: ["portrait", "landscape"],
    resolutions: ["standard", "high"],
  },
];

const VIDEO_MODEL_OPTION_MAP = VIDEO_MODEL_OPTIONS.reduce<Record<VideoModelId, VideoModelOption>>(
  (acc, option) => {
    acc[option.id] = option;
    return acc;
  },
  {} as Record<VideoModelId, VideoModelOption>
);

const VIDEO_DURATION_LABELS: Record<VideoDuration, string> = {
  4: "4 seconds",
  8: "8 seconds",
  12: "12 seconds",
};

const VIDEO_ASPECT_LABELS: Record<VideoAspectRatio, string> = {
  portrait: "Portrait 9:16",
  landscape: "Landscape 16:9",
};

const VIDEO_RESOLUTION_LABELS: Record<VideoResolution, string> = {
  standard: "Standard (720p)",
  high: "High (1024p)",
};

function useRotatingMessage(active: boolean, messages: readonly string[], intervalMs = 1600) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    if (!active) {
      const resetId = window.requestAnimationFrame(() => {
        setIndex(0);
      });
      return () => {
        window.cancelAnimationFrame(resetId);
      };
    }

    const resetId = window.requestAnimationFrame(() => {
      setIndex(0);
    });
    const intervalId = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);

    return () => {
      window.cancelAnimationFrame(resetId);
      window.clearInterval(intervalId);
    };
  }, [active, intervalMs, messages]);

  return messages[index] ?? "";
}

const ensureAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (!cachedAudioContext) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    cachedAudioContext = new AudioCtx();
  }
  return cachedAudioContext;
};

const playSuccessChime = () => {
  if (typeof window === "undefined") return;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }

  const now = ctx.currentTime + 0.05;
  const chord = [523.25, 659.25, 783.99]; // C major arpeggio
  chord.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    const startTime = now + index * 0.05;
    const duration = 0.35;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.18, startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
  });
};

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/55">
        {title}
      </h3>
      {description ? (
        <p className="text-sm text-foreground/65">{description}</p>
      ) : null}
    </div>
  );
}

function DossierSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-white/12 bg-black/35 shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-all duration-200">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground/80 hover:bg-white/5 transition-colors duration-150 rounded-2xl"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-foreground/55 transition-transform duration-300 ease-out",
            open ? "rotate-180" : ""
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
        <div className="border-t border-white/10 px-4 py-4 text-sm text-foreground/75">
          {children}
        </div>
        </div>
      </div>
    </div>
  );
}

function CharacterDossierContent({
  characterId,
  metadata,
  storyFunction,
  species,
  paletteAnchors,
  wardrobe,
  behavior,
  doc,
  quickFacts,
  tags,
  portraitUrl,
  portraitError,
  portraitLoading,
  portraitRetryCount,
  portraitUsedLlmAdjustment,
  portraitLlmAdjustmentReason,
  portraitLlmAdjustedPrompt,
  posterAvailable,
  onGeneratePortrait,
  onClear,
}: {
  characterId: string;
  metadata: Record<string, unknown>;
  storyFunction?: string;
  species?: CharacterSpecies;
  paletteAnchors: string[];
  wardrobe?: CharacterWardrobe;
  behavior?: CharacterBehavior;
  doc: CharacterDocument;
  quickFacts: Array<{ label: string; value: string }>;
  tags: string[];
  portraitUrl: string | null | undefined;
  portraitError?: string;
  portraitLoading: boolean;
  portraitRetryCount?: number;
  portraitUsedLlmAdjustment?: boolean;
  portraitLlmAdjustmentReason?: string;
  portraitLlmAdjustedPrompt?: string;
  posterAvailable: boolean;
  onGeneratePortrait: (characterId: string, customPrompt?: string) => void;
  onClear: () => void;
}) {
  const expressionSet = doc.performance?.expression_set ?? [];
  const soundFx = doc.sound?.fx ?? [];
  const hasSound =
    Boolean(soundFx.length) || Boolean(doc.sound?.ambience) || Boolean(doc.sound?.music_tone);
  const showcaseScenePrompt = doc.showcase_scene_prompt;
  const roleLabel =
    typeof metadata.role === "string" && metadata.role.trim().length
      ? metadata.role
      : "Character";

  return (
    <div className="mt-6 space-y-6 border-t border-white/10 pt-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground/55">
            Character dossier
          </p>
          <p className="text-sm text-foreground/50">{roleLabel}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/70 hover:bg-white/10"
        >
          Collapse
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4 text-sm text-foreground/75">
          {storyFunction ? (
            <DossierSection title="Story function">
              <p className="text-base text-foreground/80">{storyFunction}</p>
            </DossierSection>
          ) : null}

          {showcaseScenePrompt ? (
            <DossierSection title="Showcase scene prompt" defaultOpen={false}>
              <p className="whitespace-pre-wrap text-sm text-foreground/80">
                {showcaseScenePrompt}
              </p>
            </DossierSection>
          ) : null}

          {quickFacts.length ? (
            <DossierSection title="Quick facts">
              <Table>
                <TableBody>
                  {quickFacts.map(({ label, value }) => (
                    <TableRow key={label}>
                      <TableCell className="text-[11px] uppercase tracking-[0.24em] text-foreground/45">
                        {label}
                      </TableCell>
                      <TableCell className="text-sm text-foreground/80">{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DossierSection>
          ) : null}

          {species ? (
            <DossierSection title="Biometrics & species">
              <div className="space-y-2">
                {species.materiality ? (
                  <p>
                    <span className="font-medium text-foreground/80">Materiality:</span>{" "}
                    {species.materiality}
                  </p>
                ) : null}
                {species.physiology ? (
                  <p>
                    <span className="font-medium text-foreground/80">Physiology:</span>{" "}
                    {species.physiology}
                  </p>
                ) : null}
                {species.visual_markers ? (
                  <p>
                    <span className="font-medium text-foreground/80">Visual markers:</span>{" "}
                    {species.visual_markers}
                  </p>
                ) : null}
                {species.palette?.anchors?.length ? (
                  <div className="space-y-2">
                    <span className="font-medium text-foreground/80">Palette anchors</span>
                    <ColorSwatches colors={species.palette.anchors} />
                    {species.palette.notes ? (
                      <p className="text-xs text-foreground/55">{species.palette.notes}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </DossierSection>
          ) : null}

          {wardrobe ? (
            <DossierSection title="Wardrobe">
              {wardrobe.silhouette_rules ? (
                <p className="text-foreground/75">{wardrobe.silhouette_rules}</p>
              ) : null}
              {wardrobe.items?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {wardrobe.items.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {wardrobe.accessories?.length ? (
                <p className="mt-2 text-xs text-foreground/60">
                  Accessories: {wardrobe.accessories.join(", ")}
                </p>
              ) : null}
            </DossierSection>
          ) : null}

          {behavior ? (
            <DossierSection title="Behavioural rails">
              {behavior.do?.length ? (
                <p>
                  <span className="font-medium text-foreground/80">Do:</span>{" "}
                  {behavior.do.join(", ")}
                </p>
              ) : null}
              {behavior.do_not?.length ? (
                <p>
                  <span className="font-medium text-foreground/80">Avoid:</span>{" "}
                  {behavior.do_not.join(", ")}
                </p>
              ) : null}
            </DossierSection>
          ) : null}

          {doc.look?.surface ? (
            <DossierSection title="Surface treatment">
              <p>
                <span className="font-medium text-foreground/80">Materials:</span>{" "}
                {doc.look.surface.materials}
              </p>
              <p>
                <span className="font-medium text-foreground/80">Finish:</span>{" "}
                {doc.look.surface.finish}
              </p>
              {doc.look.surface.texture_rules ? (
                <p className="text-xs text-foreground/60">{doc.look.surface.texture_rules}</p>
              ) : null}
            </DossierSection>
          ) : null}

          {paletteAnchors.length ? (
            <DossierSection title="Palette anchors">
              <ColorSwatches colors={paletteAnchors} />
              {doc.look?.palette?.notes ? (
                <p className="mt-2 text-xs text-foreground/55">{doc.look.palette.notes}</p>
              ) : null}
            </DossierSection>
          ) : null}

          {tags.length ? (
            <DossierSection title="Tags" defaultOpen={false}>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </DossierSection>
          ) : null}

          {expressionSet.length ? (
            <DossierSection title="Expression set" defaultOpen={false}>
              <ArrayPills values={expressionSet} />
            </DossierSection>
          ) : null}

          {hasSound ? (
            <DossierSection title="Sound cues" defaultOpen={false}>
              {doc.sound?.ambience ? (
                <p>
                  <span className="font-medium text-foreground/80">Ambience:</span>{" "}
                  {doc.sound.ambience}
                </p>
              ) : null}
              {soundFx.length ? <ArrayPills values={soundFx} /> : null}
              {doc.sound?.music_tone ? (
                <p className="text-xs text-foreground/60">
                  Music tone: {doc.sound.music_tone}
                </p>
              ) : null}
            </DossierSection>
          ) : null}
        </div>

        <div className="space-y-4">
          <DossierSection title="Portrait">
            {posterAvailable ? (
              <div className="space-y-3 w-full max-w-full">
                <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.65)] w-full">
                  <div className="relative h-0 w-full pb-[100%]">
                    {portraitUrl ? (
                      <Image
                        key={portraitUrl}
                        src={portraitUrl}
                        alt={`${doc.character} portrait`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 360px, 100vw"
                        unoptimized={portraitUrl.includes('replicate.delivery')}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.25),_transparent)]">
                        <span className="text-xs uppercase tracking-[0.3em] text-foreground/45">
                          Portrait pending
                        </span>
                      </div>
                    )}
                    {portraitLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        {(portraitRetryCount && portraitRetryCount > 0) ? (
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                              Attempt #{portraitRetryCount + 1}
                            </span>
                            {portraitUsedLlmAdjustment && (
                              <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[10px] font-medium text-violet-300 flex items-center gap-1">
                                <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                AI
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                {portraitError ? (
                  <div className="space-y-1">
                    <p className="text-xs text-red-300">{portraitError}</p>
                    {portraitError.includes('AI-adjusted') && (
                      <div className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5">
                        <svg className="h-2.5 w-2.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-[10px] font-medium text-violet-300">AI prompt was used</span>
                      </div>
                    )}
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant={portraitLoading ? "destructive" : portraitError ? "destructive" : portraitUrl ? "secondary" : "default"}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log(`🖱️ Dossier portrait button clicked for ${characterId}, loading: ${portraitLoading}`);
                    onGeneratePortrait(characterId);
                  }}
                  className="w-full justify-center rounded-full relative z-50 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  style={{ pointerEvents: 'auto' }}
                >
                  {portraitLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Cancel & Restart
                    </>
                  ) : portraitError ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry portrait
                    </>
                  ) : portraitUrl ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Re-render portrait
                    </>
                  ) : (
                    "Render portrait"
                  )}
                </Button>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/12 bg-black/35 p-4 text-xs text-foreground/55">
                Add a Replicate token to enable per-character portraits.
              </div>
            )}
          </DossierSection>
        </div>
      </div>
    </div>
  );
}

function KeyValueTable({
  items,
}: {
  items: Array<{ label: string; value: string | number | undefined }>;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/12 bg-black/40">
      <Table className="w-full">
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.label} className="even:bg-black/30/70">
              <TableCell className="w-48 whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">
                {item.label}
              </TableCell>
              <TableCell className="max-w-[0] break-words px-4 py-3 text-sm text-foreground/85 whitespace-pre-wrap">
                {item.value ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ArrayPills({ values }: { values?: string[] }) {
  if (!values || values.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge
          key={value}
          variant="outline"
          className="rounded-full border-white/12 bg-black/30 text-xs font-medium text-foreground/75 break-words"
        >
          {value}
        </Badge>
      ))}
    </div>
  );
}

function ColorSwatches({ colors }: { colors: string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((hex) => (
        <div key={hex} className="flex items-center gap-2">
          <span
            className="h-7 w-7 rounded-full border border-white/12 shadow-inner"
            style={{ backgroundColor: hex }}
            aria-hidden
          />
          <span className="text-xs font-medium uppercase tracking-wide text-foreground/65">
            {hex}
          </span>
        </div>
      ))}
    </div>
  );
}

type SavedShow = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  blueprint: ShowBlueprint;
  rawJson?: string;
  usage?: ApiResponse["usage"];
  model: ModelId;
  characterSeeds: CharacterSeed[];
  characterDocs: Record<string, CharacterDocument>;
  characterPortraits: Record<string, string | null>;
  characterVideos: Record<string, string[]>;
  posterUrl: string | null;
  libraryPosterUrl?: string | null;
  portraitGridUrl?: string | null;
  trailerUrl?: string | null;
  // NEW: Essential data
  originalPrompt?: string | null;
  customPortraitPrompts?: Record<string, string>;
  customVideoPrompts?: Record<string, string>;
  customPosterPrompt?: string | null;
  customTrailerPrompt?: string | null;
  videoModelId?: string;
  videoSeconds?: number;
  videoAspectRatio?: string;
  videoResolution?: string;
  trailerModel?: string | null;
  // Episode format and loglines
  showFormat?: ShowFormat | null;
  episodes?: Episode[];
};

const accentVariants = {
  iris: { indicator: "bg-white/30", border: "border-white/15" },
  lagoon: { indicator: "bg-white/20", border: "border-white/12" },
  amber: { indicator: "bg-white/18", border: "border-white/12" },
  moss: { indicator: "bg-white/14", border: "border-white/12" },
  blush: { indicator: "bg-white/16", border: "border-white/12" },
  coral: { indicator: "bg-primary/70", border: "border-primary/40" },
  sand: { indicator: "bg-white/22", border: "border-white/12" },
  slate: { indicator: "bg-white/12", border: "border-white/12" },
};

type AccentVariant = keyof typeof accentVariants;

function CollapsibleSection({
  title,
  description,
  children,
  metadata,
  accent = "iris",
  defaultOpen = false,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  metadata?: ReactNode;
  accent?: AccentVariant;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const variant = accentVariants[accent] ?? accentVariants.iris;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/12 bg-[#111]/70 p-[1px] shadow-[0_18px_60px_rgba(0,0,0,0.65)] transition-colors",
        variant.border,
        className
      )}
    >
      <div className="absolute inset-0 bg-black/30" aria-hidden />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-6 left-6 h-7 w-7 rounded-full blur-sm",
          variant.indicator
        )}
      />
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative z-10 flex w-full items-center justify-between gap-5 rounded-[28px] bg-black/40 px-8 py-6 text-left transition-colors hover:bg-black/55"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "mt-1.5 h-2.5 w-2.5 rounded-full transition",
              variant.indicator
            )}
          />
          <div className="space-y-1">
            <p className="text-lg font-semibold tracking-[0.02em] text-foreground">
              {title}
            </p>
            {description ? (
              <p className="text-sm text-foreground/65">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {metadata}
          <ChevronDown
            className={cn(
              "h-5 w-5 flex-shrink-0 text-foreground/50 transition-transform duration-300",
              isOpen ? "rotate-180" : ""
            )}
            aria-hidden
          />
        </div>
      </button>
      {isOpen ? (
        <div className="relative border-t border-white/12 bg-black/55 px-8 py-6 text-sm text-foreground/75">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function RawJsonPeek({ rawJson, currentShowId }: { rawJson?: string | null; currentShowId?: string | null }) {

  if (!rawJson) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Show Page Button - Prominent */}
      {currentShowId && (
        <Link href={`/show/${currentShowId}`} className="block touch-manipulation">
          <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 sm:p-6 transition-all hover:border-primary/50 hover:shadow-[0_8px_30px_rgba(229,9,20,0.4)] active:scale-[0.98]">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-primary">
                    View Show Page
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-foreground/60">
                  See this show as a beautiful, shareable presentation
                </p>
              </div>
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/20 transition-transform group-hover:scale-110 shrink-0">
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 rotate-180 text-primary" />
              </div>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}

function ResultView({
  blueprint,
  usage,
  rawJson,
  model,
  currentShowId,
  characterSeeds,
  charactersLoading,
  charactersError,
  characterDocs,
  characterBuilding,
  characterBuildErrors,
  characterPortraits,
  characterPortraitLoading,
  characterPortraitLoaded,
  characterPortraitErrors,
  portraitRetryCounts,
  portraitLlmAdjustments,
  editedPortraitPrompts,
  onSetEditedPortraitPrompt,
  characterVideos,
  characterVideoLoading,
  characterVideoErrors,
  editedVideoPrompts,
  selectedVideoIndex,
  onSetSelectedVideoIndex,
  onSetEditedVideoPrompt,
  onBuildCharacter,
  onSelectCharacter,
  onClearActiveCharacter,
  onGeneratePortrait,
  onPortraitLoaded,
  onGenerateVideo,
  activeCharacterId,
  posterUrl,
  posterLoading,
  posterError,
  posterAvailable,
  editedPosterPrompt,
  onSetEditedPosterPrompt,
  isLoading,
  videoModelId,
  videoSeconds,
  videoAspectRatio,
  videoResolution,
  onVideoModelChange,
  onVideoSecondsChange,
  onVideoAspectRatioChange,
  onVideoResolutionChange,
  libraryPosterUrl,
  libraryPosterLoading,
  libraryPosterError,
  portraitGridUrl,
  portraitGridLoading,
  portraitGridError,
  trailerUrl,
  trailerLoading,
  trailerError,
  trailerStatus,
  trailerElapsed,
  editedTrailerPrompt,
  onSetEditedTrailerPrompt,
  trailerFindText,
  setTrailerFindText,
  trailerReplaceText,
  setTrailerReplaceText,
  trailerRetryModel,
  setTrailerRetryModel,
  trailerRetryCount,
  trailerUsedLlmAdjustment,
  trailerLlmAdjustmentReason,
  trailerAdjustingPrompt,
  trailerOriginalPrompt,
  trailerAdjustedPrompt,
  onGenerateTrailer,
  buildDefaultTrailerPrompt,
  onRegenerateGrid,
  onRegeneratePoster,
  editedLibraryPosterPrompt,
  setEditedLibraryPosterPrompt,
  onClearTrailer,
  onClearTrailerError,
  onOpenLightbox,
  trailerModel,
  buildDefaultLibraryPosterPrompt,
  stylizationGuardrails,
  toggleStylizationGuardrails,
  autopilotMode,
  setAutopilotMode,
  // Episode format and loglines
  showFormat,
  showFormatLoading,
  episodes,
  episodesLoading,
  seasonArc,
  onGenerateShowFormat,
  onGenerateEpisodes,
  // Original user prompt
  lastPrompt,
}: {
  blueprint: ShowBlueprint | null;
  usage?: ApiResponse["usage"];
  rawJson?: string | null;
  model: ModelId;
  currentShowId: string | null;
  characterSeeds: CharacterSeed[] | null;
  charactersLoading: boolean;
  charactersError: string | null;
  characterDocs: Record<string, CharacterDocument>;
  characterBuilding: Record<string, boolean>;
  characterBuildErrors: Record<string, string>;
  characterPortraits: Record<string, string | null>;
  characterPortraitLoading: Record<string, boolean>;
  characterPortraitLoaded: Record<string, boolean>;
  characterPortraitErrors: Record<string, string>;
  portraitRetryCounts: Record<string, number>;
  portraitLlmAdjustments: Record<string, { used: boolean; reason?: string; adjustedPrompt?: string }>;
  editedPortraitPrompts: Record<string, string>;
  onSetEditedPortraitPrompt: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  characterVideos: Record<string, string[]>;
  characterVideoLoading: Record<string, boolean>;
  characterVideoErrors: Record<string, string>;
  editedVideoPrompts: Record<string, string>;
  selectedVideoIndex: Record<string, number>;
  onSetSelectedVideoIndex: (value: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  onSetEditedVideoPrompt: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  onBuildCharacter: (seed: CharacterSeed) => void;
  onSelectCharacter: (characterId: string) => void;
  onClearActiveCharacter: () => void;
  onGeneratePortrait: (characterId: string, customPrompt?: string) => void;
  onPortraitLoaded: (characterId: string) => void;
  onGenerateVideo: (characterId: string, customPrompt?: string) => void;
  activeCharacterId: string | null;
  posterUrl: string | null;
  posterLoading: boolean;
  posterError: string | null;
  posterAvailable: boolean;
  editedPosterPrompt: string;
  onSetEditedPosterPrompt: (value: string) => void;
  isLoading: boolean;
  videoModelId: VideoModelId;
  videoSeconds: VideoDuration;
  videoAspectRatio: VideoAspectRatio;
  videoResolution: VideoResolution;
  onVideoModelChange: (value: VideoModelId) => void;
  onVideoSecondsChange: (value: VideoDuration) => void;
  onVideoAspectRatioChange: (value: VideoAspectRatio) => void;
  onVideoResolutionChange: (value: VideoResolution) => void;
  libraryPosterUrl: string | null;
  libraryPosterLoading: boolean;
  libraryPosterError: string | null;
  portraitGridUrl: string | null;
  portraitGridLoading: boolean;
  portraitGridError: string | null;
  trailerUrl: string | null;
  trailerLoading: boolean;
  trailerError: string | null;
  trailerStatus: string | null;
  trailerElapsed: number;
  editedTrailerPrompt: string;
  onSetEditedTrailerPrompt: (value: string) => void;
  trailerFindText: string;
  setTrailerFindText: (value: string) => void;
  trailerReplaceText: string;
  setTrailerReplaceText: (value: string) => void;
  trailerRetryModel: "sora-2" | "sora-2-pro" | "veo-3.1";
  setTrailerRetryModel: (value: "sora-2" | "sora-2-pro" | "veo-3.1") => void;
  trailerRetryCount: number;
  trailerUsedLlmAdjustment: boolean;
  trailerLlmAdjustmentReason: string | null;
  trailerAdjustingPrompt: boolean;
  trailerOriginalPrompt: string | null;
  trailerAdjustedPrompt: string | null;
  onGenerateTrailer: (model?: 'sora-2' | 'sora-2-pro' | 'veo-3.1' | 'auto', customPrompt?: string) => void;
  buildDefaultTrailerPrompt: () => string;
  buildDefaultLibraryPosterPrompt: () => string;
  onRegenerateGrid: () => void;
  onRegeneratePoster: (customPrompt?: string) => void;
  editedLibraryPosterPrompt: string;
  setEditedLibraryPosterPrompt: (value: string) => void;
  onClearTrailer: () => void;
  onClearTrailerError?: () => void;
  onOpenLightbox: (url: string) => void;
  trailerModel: string | null;
  stylizationGuardrails: boolean;
  toggleStylizationGuardrails: () => void;
  autopilotMode: boolean;
  setAutopilotMode: (value: boolean) => void;
  // Episode format and loglines
  showFormat: ShowFormat | null;
  showFormatLoading: boolean;
  episodes: Episode[];
  episodesLoading: boolean;
  seasonArc: string | null;
  onGenerateShowFormat: () => void;
  onGenerateEpisodes: () => void;
  // Original user prompt
  lastPrompt: string | null;
}) {
  const loaderActive = !blueprint && isLoading;
  const loaderMessage = useRotatingMessage(loaderActive, LOADING_MESSAGES, 1700);
  const videoModelOption = VIDEO_MODEL_OPTION_MAP[videoModelId] ?? VIDEO_MODEL_OPTIONS[0];
  const charactersTabBusy =
    charactersLoading ||
    Object.values(characterBuilding).some(Boolean) ||
    Object.values(characterPortraitLoading).some(Boolean);
  const videosTabBusy = Object.values(characterVideoLoading).some(Boolean);
  const trailerTabBusy = trailerLoading;
  const assetsTabBusy =
    Boolean(posterLoading || libraryPosterLoading || portraitGridLoading || trailerLoading);
  const [portraitCopyStates, setPortraitCopyStates] = useState<Record<string, "idle" | "copied" | "error">>({});
  const portraitCopyTimeoutRef = useRef<Record<string, number>>({});
  const trailerStatusLower = trailerStatus?.toLowerCase() ?? "";
  const trailerStatusIsVeo = trailerStatusLower.includes("veo");
  const trailerStatusIsSora2Pro = trailerStatusLower.includes("sora2pro");
  const trailerStatusIsFinalFallback = trailerStatusLower.includes("final-fallback");
  const trailerStatusIsStarting = trailerStatusLower.includes("starting");
  const trailerStatusIsProcessing = trailerStatusLower.includes("processing");
  const trailerStatusIsSucceeded = trailerStatusLower.startsWith("succeeded");
  
  // Determine the model name for display
  const currentModelDisplayName = trailerStatusIsVeo ? "VEO 3.1" : 
                                   trailerStatusIsSora2Pro ? "Sora 2 Pro" : "Sora 2";
  
  const trailerStatusBadgeLabel = (() => {
    if (trailerStatusIsFinalFallback) {
      return trailerStatusIsStarting ? "Starting Final Fallback" : "Processing Final Fallback";
    }
    if (trailerStatusIsStarting) {
      return `Starting (${currentModelDisplayName})`;
    }
    if (trailerStatusIsProcessing) {
      return `Processing (${currentModelDisplayName})`;
    }
    if (trailerStatusIsSucceeded) {
      return "Complete";
    }
    if (trailerStatus === "failed") {
      return "Failed";
    }
    if (trailerStatus) {
      return trailerStatus;
    }
    return "Rendering";
  })();
  const trailerStatusDetailLabel = (() => {
    if (trailerAdjustingPrompt || trailerStatus === "adjusting-prompt") {
      return "GPT-4 is rewriting prompt to bypass filters";
    }
    if (trailerStatusIsFinalFallback) {
      return trailerStatusIsStarting 
        ? "Trying Sora 2 without character grid (final fallback)"
        : "Processing with Sora 2 (no character grid)";
    }
    if (trailerStatusIsStarting) {
      return `Running ${currentModelDisplayName}`;
    }
    if (trailerStatusIsProcessing) {
      return `Processing with ${currentModelDisplayName}`;
    }
    if (trailerStatusIsSucceeded) {
      return `Complete (${currentModelDisplayName})`;
    }
    if (trailerStatus === "failed") {
      return "Failed — please review the error below";
    }
    if (trailerStatus?.includes("veo")) {
      return "Trying VEO 3.1 fallback";
    }
    return trailerStatus || "Queued";
  })();

  const buildPortraitPrompt = useCallback((characterId: string) => {
    if (!blueprint) return null;
    const doc = characterDocs[characterId];
    if (!doc) return null;
    const showJson = JSON.stringify(blueprint, null, 2);
    const characterJson = JSON.stringify(doc, null, 2);

    return [
      "Create portrait of this character.",
      "Focus on cinematic lighting, intentional wardrobe, and expressive posture that reflect the character and the aesthetics of the show.",
      "Create portrait of this character.",
      "Focus on cinematic lighting, intentional wardrobe, and expressive posture that reflect the character and the aesthetics of the show.",
      "",
      "Character blueprint JSON:",
      characterJson,
      "",
      "Respect the show's aesthetic while capturing the essence of the character.",
      "Every choice must adhere to the aesthetic, palette, lighting, and creative rules specified in the show blueprint JSON.",
      "",
      "Show blueprint JSON:",
      showJson,
    ].join("\n");
  }, [blueprint, characterDocs]);

  const handleCopyPortraitPrompt = useCallback(async (seedId: string) => {
    const promptText = buildPortraitPrompt(seedId);
    if (!promptText) {
      setPortraitCopyStates((prev) => ({ ...prev, [seedId]: "error" }));
      return;
    }
    try {
      await navigator.clipboard.writeText(promptText);
      setPortraitCopyStates((prev) => ({ ...prev, [seedId]: "copied" }));
    } catch (error) {
      console.error("Failed to copy portrait prompt", error);
      setPortraitCopyStates((prev) => ({ ...prev, [seedId]: "error" }));
    } finally {
      if (portraitCopyTimeoutRef.current[seedId]) {
        window.clearTimeout(portraitCopyTimeoutRef.current[seedId]);
      }
      portraitCopyTimeoutRef.current[seedId] = window.setTimeout(() => {
        setPortraitCopyStates((prev) => {
          const next = { ...prev };
          delete next[seedId];
          return next;
        });
        delete portraitCopyTimeoutRef.current[seedId];
      }, 2000);
    }
  }, [buildPortraitPrompt]);

  useEffect(() => {
    const registry = portraitCopyTimeoutRef.current;
    return () => {
      Object.values(registry).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  // Tab navigation hooks (must be before any conditional returns)
  const tabNavRef = useRef<HTMLDivElement>(null);
  const [tabScrollState, setTabScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

  const updateTabScrollState = useCallback(() => {
    const container = tabNavRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = scrollWidth - clientWidth;
    setTabScrollState({
      canScrollLeft: scrollLeft > 4,
      canScrollRight: scrollLeft < maxScrollLeft - 4,
    });
  }, []);

  useEffect(() => {
    const container = tabNavRef.current;
    if (!container) return;
    updateTabScrollState();
    const handleScroll = () => updateTabScrollState();
    container.addEventListener("scroll", handleScroll, { passive: true } as AddEventListenerOptions);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [updateTabScrollState]);

  if (!blueprint) {
    if (isLoading) {
      return (
        <div className="flex min-h-[420px] w-full flex-col items-center justify-center gap-7 rounded-3xl bg-black/50 p-12 text-center shadow-[0_20px_65px_rgba(0,0,0,0.7)]">
          <div className="netflix-loader netflix-loader-lg" aria-hidden>
            {Array.from({ length: 12 }).map((_, index) => (
              <span
                key={index}
                className="netflix-loader-bar"
                style={{ animationDelay: `${index * 0.06}s` }}
              />
            ))}
          </div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/55 transition-opacity duration-300"
            aria-live="polite"
          >
            {loaderMessage}
          </p>
        </div>
      );
    }

    return (
      <div className="flex min-h-[360px] sm:min-h-[420px] items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-white/20 bg-gradient-to-br from-primary/5 via-black/50 to-black/45 p-6 sm:p-12 text-center shadow-[0_18px_60px_rgba(0,0,0,0.6)]">
        <div className="max-w-2xl space-y-5 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
              Create Your Show Bible
            </h2>
            <p className="text-sm sm:text-base text-foreground/70 leading-relaxed px-2">
              Describe your show&apos;s premise, tone, or visual style below.
              We&apos;ll generate a complete look bible with characters, color palettes, lighting plans, and more.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs sm:text-xs text-foreground/50">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary font-semibold text-sm sm:text-xs">
                1
              </span>
              <span className="text-sm sm:text-xs">Enter your brief</span>
            </div>
            <span className="hidden sm:inline text-foreground/30">→</span>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full border border-white/20 bg-white/5 text-foreground/50 font-semibold text-sm sm:text-xs">
                2
              </span>
              <span className="text-sm sm:text-xs">Generate show bible</span>
            </div>
            <span className="hidden sm:inline text-foreground/30">→</span>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full border border-white/20 bg-white/5 text-foreground/50 font-semibold text-sm sm:text-xs">
                3
              </span>
              <span className="text-sm sm:text-xs">Build characters</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const data = blueprint.visual_aesthetics;
  const usageBadge =
    usage?.input_tokens !== undefined ? (
      <Badge variant="outline">
        input {usage.input_tokens} · output {usage.output_tokens ?? "—"}
      </Badge>
    ) : null;

  const libraryPosterSection =
    !posterAvailable
      ? (
        <div className="space-y-3 rounded-3xl border border-dashed border-white/15 bg-black/35 px-5 py-4 text-sm text-foreground/70">
          <p>Library poster unlocks once poster automation is configured.</p>
          <p className="text-foreground/55">
            Add a Replicate token and render the hero poster to stage the 9:16 version.
          </p>
        </div>
      )
      : (
        <CollapsibleSection
          title="Show poster"
          description="Cinematic 9:16 poster featuring your characters."
          accent="lagoon"
          defaultOpen
        >
          {libraryPosterUrl ? (
            <div className="space-y-3 relative">
              {/* Loading overlay */}
              {libraryPosterLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-foreground">Generating poster…</p>
                  </div>
                </div>
              )}
              
              <button
                type="button"
                onClick={() => !libraryPosterLoading && onOpenLightbox(libraryPosterUrl)}
                disabled={libraryPosterLoading}
                className="overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.65)] cursor-zoom-in transition-transform hover:scale-[1.01] w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative h-0 w-full pb-[177%]">
                  <Image
                    src={libraryPosterUrl}
                    alt="Show poster"
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 420px, 100vw"
                  />
                </div>
                <div className="border-t border-white/10 bg-black/40 px-4 py-2 text-center text-xs text-foreground/60">
                  9:16 • {blueprint?.show_title || "Show poster"} • Click to view full size
                </div>
              </button>
              
              {/* Edit prompt section */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground/70">
                  Edit poster prompt:
                </label>
                <Textarea
                  value={editedLibraryPosterPrompt}
                  onChange={(e) => setEditedLibraryPosterPrompt(e.target.value)}
                  onFocus={(e) => {
                    if (!e.target.value) {
                      const defaultPrompt = buildDefaultLibraryPosterPrompt();
                      if (defaultPrompt) {
                        setEditedLibraryPosterPrompt(defaultPrompt);
                      }
                    }
                  }}
                  placeholder="Click to load default prompt with style guide, then edit as needed..."
                  className="min-h-[120px] resize-none rounded-2xl border-white/10 bg-black/40 text-sm font-mono"
                />
                <p className="text-xs text-foreground/50">
                  Includes style guide from your show bible. Edit to customize the poster.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void onRegeneratePoster(editedLibraryPosterPrompt || undefined);
                  }}
                  disabled={libraryPosterLoading}
                  className="flex-1 justify-center rounded-full text-sm"
                >
                  {libraryPosterLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Re-generate"
                  )}
                </Button>
                {editedLibraryPosterPrompt && !libraryPosterLoading && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditedLibraryPosterPrompt("")}
                    className="rounded-full text-sm"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          ) : libraryPosterLoading ? (
            <div className="flex items-center gap-3 rounded-3xl border border-white/12 bg-black/45 px-5 py-4 text-sm text-foreground/70">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Generating poster…
            </div>
          ) : libraryPosterError ? (
            <div className="space-y-3 rounded-3xl border border-red-900/20 bg-red-900/10 px-5 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-200 mb-2">Failed to generate poster</p>
                  <p className="text-sm text-red-300/80">{libraryPosterError}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => void onRegeneratePoster()}
                className="w-full justify-center rounded-full text-sm border-red-500/30 text-red-200 hover:bg-red-500/10"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-3 rounded-3xl border border-dashed border-white/15 bg-black/35 px-5 py-4 text-sm text-foreground/70">
              {portraitGridUrl ? (
                <>
                  <p>Portrait grid is ready. Click below to generate poster.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void onRegeneratePoster()}
                    className="w-full justify-center rounded-full text-sm"
                  >
                    Generate Show Poster
                  </Button>
                </>
              ) : (
                <>
                  <p>Show poster generates automatically after portrait grid is ready.</p>
                  <p className="text-foreground/55">
                    Generate a character grid first, or it will auto-generate when autopilot is on.
                  </p>
                </>
              )}
            </div>
          )}
      </CollapsibleSection>
      );

  const portraitGridSection = (
    <CollapsibleSection
      title="Character grid"
      description="All hero portraits arranged in a single export."
      accent="sand"
      defaultOpen
    >
      {portraitGridLoading ? (
        <div className="flex items-center gap-3 rounded-3xl border border-white/12 bg-black/45 px-5 py-4 text-sm text-foreground/70">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Building character grid…
        </div>
       ) : portraitGridUrl ? (
         <div className="space-y-3">
           <button
             type="button"
             onClick={() => onOpenLightbox(portraitGridUrl)}
             className="overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.65)] cursor-zoom-in transition-transform hover:scale-[1.01] w-full"
           >
             <div className="relative h-0 w-full pb-[56.25%]">
               <Image
                 src={portraitGridUrl}
                 alt="Character portrait grid (1280x720 for Sora)"
                 fill
                 className="object-contain"
                 sizes="(min-width: 1024px) 1280px, 100vw"
               />
             </div>
             <div className="border-t border-white/10 bg-black/40 px-4 py-2 text-center text-xs text-foreground/60">
               1280×720 • Ready for Sora • Click to view full size
             </div>
           </button>
           <Button
             type="button"
             variant="outline"
             onClick={onRegenerateGrid}
             className="w-full justify-center rounded-full text-sm"
           >
             Re-generate Grid
           </Button>
         </div>
       ) : (
        <div className="space-y-3 rounded-3xl border border-dashed border-white/15 bg-black/35 px-5 py-4 text-sm text-foreground/70">
          {(() => {
            const availablePortraits = characterSeeds?.filter(seed => characterPortraits[seed.id])?.length || 0;
            const totalCharacters = characterSeeds?.length || 0;
            return (
              <>
                <p>
                  {availablePortraits > 0 
                    ? `${availablePortraits}/${totalCharacters} portraits ready.`
                    : "Generate character portraits first."}
                </p>
                {availablePortraits >= 1 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onRegenerateGrid}
                    className="w-full justify-center rounded-full text-sm"
                  >
                    Generate Grid with {availablePortraits} Portrait{availablePortraits !== 1 ? 's' : ''}
                  </Button>
                ) : (
                  <p className="text-foreground/55">Finish generating at least one portrait to create the grid.</p>
                )}
              </>
            );
          })()}
        </div>
      )}
      {portraitGridError ? (
        <p className="mt-3 text-xs text-red-300">{portraitGridError}</p>
      ) : null}
    </CollapsibleSection>
  );

  const trailerSection = (
    <CollapsibleSection
      title="Series trailer"
      description="Blockbuster-style teaser rendered via Sora 2."
      accent={trailerUrl || trailerLoading ? "coral" : "slate"}
      defaultOpen
    >
      <div className="space-y-4">
        {trailerLoading ? (
          <div className="flex items-center gap-3 rounded-3xl border border-white/12 bg-black/45 px-5 py-4 text-sm text-foreground/70">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Rendering trailer…
          </div>
        ) : trailerUrl ? (
          <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-black/60 shadow-[0_12px_40px_rgba(0,0,0,0.55)] sm:shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
            <video
              controls
              className="h-full w-full"
              poster={portraitGridUrl ?? undefined}
              playsInline
              preload="metadata"
            >
              <source src={trailerUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div className="space-y-3 rounded-3xl border border-dashed border-white/15 bg-black/35 px-5 py-4 text-sm text-foreground/70">
            <p>Generate the character grid to unlock the cinematic trailer.</p>
            {!portraitGridUrl ? (
              <p className="text-foreground/55">Portrait grid required.</p>
            ) : null}
          </div>
        )}
        {trailerError ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-amber-200">Trailer generation failed</p>
              <p className="mt-1 text-xs text-amber-200/80 break-words leading-relaxed">{trailerError}</p>
            </div>
            
            {/* Edit Prompt Section - Always visible on error */}
            <div className="space-y-3 pt-2 border-t border-amber-500/20">
              <p className="text-xs font-medium text-amber-200/90">Edit prompt & retry:</p>
              
              {/* Find & Replace */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">Find</label>
                  <input
                    type="text"
                    value={trailerFindText}
                    onChange={(e) => setTrailerFindText(e.target.value)}
                    placeholder="Text to find..."
                    className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-xs text-foreground placeholder:text-foreground/40 focus:border-primary/60 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">Replace with</label>
                  <input
                    type="text"
                    value={trailerReplaceText}
                    onChange={(e) => setTrailerReplaceText(e.target.value)}
                    placeholder="Replacement text..."
                    className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-xs text-foreground placeholder:text-foreground/40 focus:border-primary/60 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (trailerFindText) {
                        // Auto-load prompt if not yet loaded
                        const promptToUse = editedTrailerPrompt || (buildDefaultTrailerPrompt ? buildDefaultTrailerPrompt() : "");
                        if (promptToUse) {
                          // Case-insensitive replace using RegExp
                          const regex = new RegExp(trailerFindText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                          onSetEditedTrailerPrompt(promptToUse.replace(regex, trailerReplaceText));
                          setTrailerFindText("");
                          setTrailerReplaceText("");
                        }
                      }
                    }}
                    disabled={!trailerFindText}
                    className="rounded-lg text-xs h-[34px] whitespace-nowrap"
                  >
                    Replace All
                  </Button>
                </div>
              </div>
              
              {/* Prompt Editor */}
              <Textarea
                value={editedTrailerPrompt}
                onChange={(e) => onSetEditedTrailerPrompt(e.target.value)}
                onFocus={(e) => {
                  if (!e.target.value && blueprint) {
                    const defaultPrompt = buildDefaultTrailerPrompt();
                    onSetEditedTrailerPrompt(defaultPrompt);
                  }
                }}
                placeholder="Click to load default prompt, then edit as needed..."
                className="min-h-[350px] max-h-[500px] text-xs font-mono resize-y bg-black/40 border-white/15 overflow-auto"
              />
              
              {/* Model Selector */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-2">Select model for retry:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "veo-3.1", label: "VEO 3.1", desc: "Fast, reliable" },
                    { id: "sora-2", label: "Sora 2", desc: "High quality" },
                    { id: "sora-2-pro", label: "Sora 2 Pro", desc: "Best quality" },
                  ].map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setTrailerRetryModel(model.id as "sora-2" | "sora-2-pro" | "veo-3.1")}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        trailerRetryModel === model.id
                          ? "border-primary/50 bg-primary/15"
                          : "border-white/15 bg-black/30 hover:border-white/25"
                      }`}
                    >
                      <p className={`text-xs font-medium ${trailerRetryModel === model.id ? "text-foreground" : "text-foreground/80"}`}>
                        {model.label}
                      </p>
                      <p className="text-[10px] text-foreground/50">{model.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() => {
                    if (editedTrailerPrompt) {
                      onGenerateTrailer(trailerRetryModel, editedTrailerPrompt);
                    } else {
                      onGenerateTrailer(trailerRetryModel);
                    }
                  }}
                  disabled={trailerLoading}
                  className="flex-1 rounded-full text-sm"
                >
                  {trailerLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    `Retry with ${trailerRetryModel === "veo-3.1" ? "VEO 3.1" : trailerRetryModel === "sora-2-pro" ? "Sora 2 Pro" : "Sora 2"}`
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    onSetEditedTrailerPrompt("");
                    setTrailerFindText("");
                    setTrailerReplaceText("");
                  }}
                  className="rounded-full text-sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        {!trailerError && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onGenerateTrailer()}
            disabled={!portraitGridUrl || trailerLoading}
            className="w-full justify-center rounded-full text-sm"
          >
            {trailerLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rendering trailer…
              </>
            ) : trailerUrl ? (
              "Re-render trailer"
            ) : (
              "Generate trailer"
            )}
          </Button>
        )}
      </div>
    </CollapsibleSection>
  );

  const loglinePanel = (
    <div className="rounded-3xl border border-white/12 bg-black/45 p-6 space-y-4 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground/55">
          Show overview
        </p>
        {usageBadge}
      </div>
      {blueprint.show_title ? (
        <h2 className="text-2xl font-bold text-foreground/90">
          {blueprint.show_title}
        </h2>
      ) : null}
      
      {/* Original Prompt - Subtle collapsible */}
      {lastPrompt && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-xs text-foreground/40 hover:text-foreground/60 transition-colors select-none list-none">
            <svg 
              className="h-3 w-3 transition-transform duration-200 group-open:rotate-90" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium">Original prompt</span>
            <span className="text-foreground/30">•</span>
            <span className="truncate max-w-[200px] sm:max-w-[300px] italic text-foreground/35">
              "{lastPrompt.slice(0, 50)}{lastPrompt.length > 50 ? '...' : ''}"
            </span>
          </summary>
          <div className="mt-3 pl-5 pr-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-foreground/60 whitespace-pre-wrap leading-relaxed italic">
                "{lastPrompt}"
              </p>
              <p className="mt-2 text-[10px] text-foreground/30">
                This is the prompt you started with when creating this show
              </p>
            </div>
          </div>
        </details>
      )}
      
      <p className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
        {blueprint.show_logline}
      </p>
    </div>
  );

  const posterBriefPanel = (
    <div className="rounded-3xl border border-white/12 bg-black/45 p-6 space-y-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground/55">
        Poster direction
      </p>
      <p className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
        {blueprint.poster_description}
      </p>
    </div>
  );

  const directivePanel = (
    <div className="rounded-3xl border border-white/12 bg-black/45 p-6 space-y-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground/55">
        Look bible directive
      </p>
      <p className="text-lg font-semibold text-foreground">{data.goal}</p>
      <p className="text-xs text-foreground/45">
        {model === "gpt-4o"
          ? "Generated with GPT-4o in JSON mode"
          : "Generated with GPT-5 · reasoning effort low"}
      </p>
    </div>
  );

  const overviewContent = (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4 sm:space-y-6">
          {loglinePanel}
          {posterBriefPanel}
          {directivePanel}
        </div>
        <div className="space-y-4 sm:space-y-6">
          {libraryPosterSection}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <CollapsibleSection
            title="Pipeline"
            description="Capture and finishing guardrails."
            accent="lagoon"
          >
            <div className="space-y-6">
              <KeyValueTable
                items={[
                  { label: "Color management", value: data.pipeline.color_management },
                  { label: "Aspect ratio", value: data.pipeline.aspect_ratio },
                  { label: "Highlight rolloff", value: data.pipeline.highlight_rolloff },
                  { label: "Black floor", value: data.pipeline.black_floor },
                  { label: "Grain", value: data.pipeline.grain_global },
                ]}
              />
              <SectionHeading title="Frame rates" />
              <KeyValueTable
                items={[
                  {
                    label: "Animation",
                    value: `${data.pipeline.frame_rates.animation_capture} fps`,
                  },
                  {
                    label: "Playback",
                    value: `${data.pipeline.frame_rates.playback} fps`,
                  },
                  {
                    label: "Live action",
                    value: `${data.pipeline.frame_rates.live_action_capture} fps`,
                  },
                ]}
              />
              <SectionHeading title="Shutter angle" />
              <KeyValueTable
                items={[
                  {
                    label: "Animation",
                    value: `${data.pipeline.shutter_angle.animation}°`,
                  },
                  {
                    label: "Live action",
                    value: `${data.pipeline.shutter_angle.live_action}°`,
                  },
                ]}
              />
              {data.pipeline.render_order && data.pipeline.render_order.length ? (
                <>
                  <SectionHeading title="Render order" />
                  <ArrayPills values={data.pipeline.render_order} />
                </>
              ) : null}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Lighting plan"
            description="Mood, contrast, and practical policy."
            accent="amber"
          >
            <div className="space-y-6">
              <KeyValueTable
                items={[
                  { label: "Temperature model", value: data.lighting.temperature_model },
                  { label: "Key", value: data.lighting.key },
                  { label: "Fill", value: data.lighting.fill },
                  { label: "Edge", value: data.lighting.edge },
                  {
                    label: "Practicals",
                    value: data.lighting.practicals_in_frame ? "Encouraged" : "Limit",
                  },
                  { label: "Halation", value: data.lighting.halation_policy },
                ]}
              />
              {data.lighting.no_go && data.lighting.no_go.length ? (
                <>
                  <SectionHeading title="No-go" />
                  <ArrayPills values={data.lighting.no_go} />
                </>
              ) : null}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Composition"
            description="Framing habits to keep scenes cohesive."
            accent="sand"
          >
            <KeyValueTable
              items={[
                { label: "Symmetry bias", value: data.composition.symmetry_bias },
                { label: "Leading lines", value: data.composition.leading_lines },
                {
                  label: "Foreground depth",
                  value: data.composition.foreground_depth,
                },
                {
                  label: "Color blocking",
                  value: data.composition.color_blocking,
                },
              ]}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Sets & props"
            description="Environment staging and recurring gags."
            accent="lagoon"
          >
            <div className="space-y-6">
              <SectionHeading title="Primary sets" />
              <ArrayPills values={data.sets_and_prop_visuals.primary_sets} />
              <KeyValueTable
                items={[
                  { label: "Prop style", value: data.sets_and_prop_visuals.prop_style },
                  { label: "Displays", value: data.sets_and_prop_visuals.display_devices },
                ]}
              />
              {data.sets_and_prop_visuals.runner_gags_visual?.length ? (
                <>
                  <SectionHeading title="Recurring gags" />
                  <ArrayPills values={data.sets_and_prop_visuals.runner_gags_visual} />
                </>
              ) : null}
            </div>
          </CollapsibleSection>
        </div>

        <div className="space-y-6">
          <CollapsibleSection
            title="Color direction"
            description="Palette anchors and restrictions."
            accent="blush"
          >
            <div className="space-y-6">
              <KeyValueTable
                items={[
                  { label: "Palette bias", value: data.color.palette_bias },
                  { label: "Skin protection", value: data.color.skin_protection },
                  {
                    label: "White balance",
                    value: data.color.white_balance_baseline_K
                      ? `${data.color.white_balance_baseline_K}K`
                      : undefined,
                  },
                ]}
              />
              <SectionHeading title="Anchor hex" />
              <ColorSwatches colors={data.color.anchor_hex} />
              {data.color.prohibitions && data.color.prohibitions.length ? (
                <>
                  <SectionHeading title="Avoid" />
                  <ArrayPills values={data.color.prohibitions} />
                </>
              ) : null}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Camera grammar"
            description="Glass, movement, and coverage preferences."
            accent="iris"
          >
            <div className="space-y-6">
              <KeyValueTable
                items={[
                  { label: "Sensor", value: data.camera.sensor },
                  { label: "Depth of field", value: data.camera.dof_guides },
                ]}
              />
              <SectionHeading title="Lens family" />
              <ArrayPills values={data.camera.lens_family} />
              {data.camera.movement && data.camera.movement.length ? (
                <>
                  <SectionHeading title="Movement" />
                  <ArrayPills values={data.camera.movement} />
                </>
              ) : null}
              {data.camera.coverage_rules && data.camera.coverage_rules.length ? (
                <>
                  <SectionHeading title="Coverage rules" />
                  <ArrayPills values={data.camera.coverage_rules} />
                </>
              ) : null}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Materials & textures"
            description="Surface language for cast and environments."
            accent="moss"
          >
            <div className="space-y-6">
              <KeyValueTable
                items={[
                  {
                    label: "Human textures",
                    value: data.materials_and_textures.human_textures,
                  },
                  { label: "Patina", value: data.materials_and_textures.patina },
                  { label: "Notes", value: data.materials_and_textures.notes },
                ]}
              />
              <SectionHeading title="Set surfaces" />
              <ArrayPills values={data.materials_and_textures.set_surfaces} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Post & delivery"
            description="Finishing expectations."
            accent="slate"
          >
            <div className="space-y-6">
              <SectionHeading title="Post grade" />
              <KeyValueTable
                items={[
                  { label: "Curve", value: data.post_grade.curve },
                  { label: "LUT", value: data.post_grade.lut },
                  { label: "Grain placement", value: data.post_grade.grain?.placement },
                  { label: "Grain intensity", value: data.post_grade.grain?.intensity },
                  { label: "Halation scope", value: data.post_grade.halation?.scope },
                  { label: "Halation strength", value: data.post_grade.halation?.strength },
                ]}
              />
              <SectionHeading title="Export specs" />
              <div className="space-y-3 text-sm text-foreground/65">
                <div>
                  <p className="font-medium text-foreground/70">Stills</p>
                  <ArrayPills values={data.export_specs.stills} />
                </div>
                <div>
                  <p className="font-medium text-foreground/70">Video intermediate</p>
                  <p>{data.export_specs.video_intermediate}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground/70">Delivery color</p>
                  <p>{data.export_specs.delivery_color}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground/70">Plates</p>
                  <ArrayPills values={data.export_specs.plates} />
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      </div>

      <CollapsibleSection
        title="Species design"
        description="Character sheets for every performer type."
        accent="slate"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {data.species_design.types.map((type) => (
            <div
              key={type.name}
              className="rounded-2xl border border-white/12 bg-black/40 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-semibold text-foreground">
                  {type.name}
                </p>
                <Badge className="border-white/20 bg-black/50 text-foreground/70">
                  {type.surface_finish}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-foreground/65">{type.silhouette}</p>
              <Separator className="my-4 border-white/10" />
              <div className="space-y-3 text-sm text-foreground/65">
                {type.materials ? (
                  <p>
                    <span className="font-medium text-foreground/70">
                      Materials:
                    </span>{" "}
                    {type.materials}
                  </p>
                ) : null}
                <p>
                  <span className="font-medium text-foreground/70">
                    Eyes:
                  </span>{" "}
                  {[
                    type.eyes.type,
                    `Catchlight ${type.eyes.catchlight_shape}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {type.eyes.behaviors && type.eyes.behaviors.length ? (
                  <ArrayPills values={type.eyes.behaviors} />
                ) : null}
                <p>
                  <span className="font-medium text-foreground/70">
                    Face modularity:
                  </span>{" "}
                  {type.face_modularity}
                </p>
                {type.stress_cues ? (
                  <p>
                    <span className="font-medium text-foreground/70">
                      Stress cues:
                    </span>{" "}
                    {type.stress_cues}
                  </p>
                ) : null}
                {type.palette?.anchors && type.palette.anchors.length ? (
                  <div className="space-y-2">
                    <span className="font-medium text-foreground/70">
                      Palette anchors
                    </span>
                    <ColorSwatches colors={type.palette.anchors} />
                    {type.palette.notes ? (
                      <p className="text-xs text-foreground/55">
                        {type.palette.notes}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Global prohibitions"
        description="Do-not-cross guardrails to keep the look coherent."
        accent="slate"
      >
        <ArrayPills values={data.prohibitions_global} />
      </CollapsibleSection>
    </div>
  );
  const charactersContent = (() => {
    if (charactersLoading) {
      return (
        <div className="rounded-3xl border border-white/12 bg-black/45 px-6 py-4 text-sm text-foreground/70">
          <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin text-primary" />
          Curating character lineup…
        </div>
      );
    }

    if (charactersError) {
      return (
        <div className="space-y-2 rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm">
          <p className="font-semibold text-red-200">Character request failed</p>
          <p className="text-red-200/80">{charactersError}</p>
        </div>
      );
    }

    if (!characterSeeds || characterSeeds.length === 0) {
      return (
        <div className="rounded-3xl border border-dashed border-white/12 bg-black/45 p-6 text-center text-sm text-foreground/55">
          Generate a show brief to surface candidates.
        </div>
      );
    }

    const unbuiltCharacters = characterSeeds.filter((seed) => !characterDocs[seed.id]);
    const charactersWithoutPortraits = characterSeeds.filter(
      (seed) => characterDocs[seed.id] && !characterPortraits[seed.id] && !characterPortraitErrors[seed.id] && !characterPortraitLoading[seed.id]
    );
    const charactersWithPortraitErrors = characterSeeds.filter(
      (seed) => characterPortraitErrors[seed.id]
    );
    const anyBuilding = Object.values(characterBuilding).some(Boolean);
    const anyPortraitLoading = Object.values(characterPortraitLoading).some(Boolean);

    return (
      <div className="space-y-4 sm:space-y-5">
        {characterSeeds.length > 0 ? (
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {unbuiltCharacters.length > 0 ? (
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  unbuiltCharacters.forEach((seed) => {
                    onBuildCharacter(seed);
                  });
                }}
                disabled={anyBuilding}
                className="gap-2 rounded-full"
              >
                {anyBuilding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Building {Object.values(characterBuilding).filter(Boolean).length} of {unbuiltCharacters.length}...
                  </>
                ) : (
                  <>
                    Build All Dossiers ({unbuiltCharacters.length})
                  </>
                )}
              </Button>
            ) : null}
            {charactersWithoutPortraits.length > 0 && posterAvailable ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  charactersWithoutPortraits.forEach((seed) => {
                    onGeneratePortrait(seed.id);
                  });
                }}
                disabled={anyPortraitLoading}
                className="gap-2 rounded-full"
              >
                {anyPortraitLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rendering {Object.values(characterPortraitLoading).filter(Boolean).length} of {charactersWithoutPortraits.length}...
                  </>
                ) : (
                  <>
                    Render All Portraits ({charactersWithoutPortraits.length})
                  </>
                )}
              </Button>
            ) : null}
            {charactersWithPortraitErrors.length > 0 ? (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-200">
                {charactersWithPortraitErrors.length} portrait{charactersWithPortraitErrors.length === 1 ? '' : 's'} need{charactersWithPortraitErrors.length === 1 ? 's' : ''} attention
              </Badge>
            ) : null}
          </div>
        ) : null}
        <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 auto-rows-max">
        {characterSeeds.map((seed) => {
          const doc = characterDocs[seed.id];
          const isBuilding = Boolean(characterBuilding[seed.id]);
          const buildError = characterBuildErrors[seed.id];
          const portraitUrl = characterPortraits[seed.id];
          const portraitLoading = Boolean(characterPortraitLoading[seed.id]);
          const portraitLoaded = Boolean(characterPortraitLoaded[seed.id]);
          const portraitError = characterPortraitErrors[seed.id];
          const portraitRetryCount = portraitRetryCounts[seed.id] || 0;
          const portraitUsedLlmAdjustment = portraitLlmAdjustments[seed.id]?.used || false;
          const portraitLlmAdjustmentReason = portraitLlmAdjustments[seed.id]?.reason;
          const portraitLlmAdjustedPrompt = portraitLlmAdjustments[seed.id]?.adjustedPrompt;
          const isActive = Boolean(doc && activeCharacterId === seed.id);

          const metadata = doc?.metadata ?? {};
          const tags = metadata.tags ?? [];
          const storyFunction = metadata.function;
          const biometrics = doc?.biometrics;
          const species = biometrics?.species as CharacterSpecies | undefined;
          const paletteAnchors = doc?.look?.palette?.anchors ?? [];
          const wardrobe = doc?.look?.wardrobe as CharacterWardrobe | undefined;
          const behavior = doc?.behavior_and_rules as CharacterBehavior | undefined;

          const quickFacts: Array<{ label: string; value: string }> = [];
          if (isActive && species?.type) {
            quickFacts.push({
              label: "Species",
              value: [species.type, species.subtype].filter(Boolean).join(" · "),
            });
          }
          if (isActive && biometrics?.age_years?.value !== undefined) {
            const approx = biometrics.age_years.approximate ? "≈" : "";
            quickFacts.push({
              label: "Age",
              value: `${approx}${biometrics.age_years.value}`,
            });
          }
          if (isActive && biometrics?.ethnicity) {
            quickFacts.push({ label: "Ethnicity", value: biometrics.ethnicity });
          }
          if (
            isActive &&
            biometrics?.height &&
            biometrics.height.value !== undefined
          ) {
            const { value, unit, notes } = biometrics.height;
            quickFacts.push({
              label: "Height",
              value: `${value}${unit ? ` ${unit}` : ""}${notes ? ` (${notes})` : ""}`,
            });
          }
          if (
            isActive &&
            biometrics?.weight &&
            biometrics.weight.value !== undefined
          ) {
            const { value, unit, notes } = biometrics.weight;
            quickFacts.push({
              label: "Weight",
              value: `${value}${unit ? ` ${unit}` : ""}${notes ? ` (${notes})` : ""}`,
            });
          }
          if (isActive && biometrics?.build?.body_type) {
            const buildNotes =
              biometrics.build.notes && biometrics.build.notes.length
                ? ` · ${biometrics.build.notes}`
                : "";
            quickFacts.push({
              label: "Build",
              value: `${biometrics.build.body_type}${buildNotes}`,
            });
          }
          if (isActive && biometrics?.voice) {
            const voiceParts = [
              biometrics.voice.descriptors && biometrics.voice.descriptors.length
                ? biometrics.voice.descriptors.join(", ")
                : null,
              biometrics.voice.pitch_range,
              biometrics.voice.tempo,
              biometrics.voice.timbre_notes,
            ].filter(Boolean) as string[];
            if (voiceParts.length) {
              quickFacts.push({
                label: "Voice",
                value: voiceParts.join(" · "),
              });
            }
          }
          if (isActive && biometrics?.accent) {
            const accentParts = [
              biometrics.accent.style,
              biometrics.accent.strength,
              biometrics.accent.code_switching,
            ].filter(Boolean) as string[];
            if (accentParts.length) {
              quickFacts.push({
                label: "Accent",
                value: accentParts.join(" · "),
              });
            }
          }
          if (isActive && biometrics?.tics) {
            const ticsParts: string[] = [];
            if (biometrics.tics.motor?.length) {
              ticsParts.push(`Motor: ${biometrics.tics.motor.join(", ")}`);
            }
            if (biometrics.tics.verbal?.length) {
              ticsParts.push(`Verbal: ${biometrics.tics.verbal.join(", ")}`);
            }
            if (biometrics.tics.frequency) {
              ticsParts.push(biometrics.tics.frequency);
            }
            if (ticsParts.length) {
              quickFacts.push({
                label: "Tics",
                value: ticsParts.join(" · "),
              });
            }
          }

          return (
            <Card
              key={seed.id}
              className={cn(
                'min-h-[200px] sm:min-h-[240px] justify-between transition-all duration-500 ease-in-out overflow-hidden',
                isActive ? 'col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 scale-[1.01]' : 'scale-100',
                !isActive && portraitUrl ? 'p-0' : ''
              )}
            >
              {!isActive && portraitUrl ? (
                <button
                  type="button"
                  onClick={() => onOpenLightbox(portraitUrl)}
                  className={cn(
                    "relative overflow-hidden bg-black/60 cursor-zoom-in transition-transform hover:scale-[1.02] w-full max-w-full",
                    portraitError && "ring-2 ring-amber-500/50"
                  )}
                >
                  <div className="relative h-0 w-full max-w-full pb-[100%]">
                    {/* Full loading state: still generating */}
                    {portraitLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/80 p-2 z-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        {portraitRetryCount > 0 && (
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                              #{portraitRetryCount + 1}
                            </span>
                            {portraitUsedLlmAdjustment && (
                              <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.5 text-[9px] font-medium text-violet-300">
                                AI
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : !portraitLoaded ? (
                      /* Light loading state: image downloading */
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                        <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                      </div>
                    ) : null}
                    <Image
                      key={portraitUrl}
                      src={portraitUrl}
                      alt={`${seed.name} portrait`}
                      fill
                      className="object-cover object-center transition-opacity duration-500"
                      sizes="(min-width: 768px) 280px, 100vw"
                      unoptimized={portraitUrl.includes('replicate.delivery')}
                      onLoad={(e) => {
                        console.log(`🖼️ Image onLoad fired for ${seed.id}`);
                        e.currentTarget.style.opacity = "1";
                        onPortraitLoaded(seed.id);
                      }}
                      onError={(e) => {
                        console.warn(`❌ Portrait image failed to load for ${seed.id}:`, e);
                        onPortraitLoaded(seed.id);
                      }}
                      style={{ opacity: 0 }}
                    />
                  </div>
                  {portraitError ? (
                    <div className="absolute inset-0 bg-amber-500/15 backdrop-blur-[2px]" />
                  ) : null}
                </button>
              ) : !isActive && portraitError ? (
                <div className="relative overflow-hidden bg-black/60">
                  <div className="relative h-0 w-full pb-[100%]">
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-amber-500/20 to-black/60 p-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-amber-300/70">
                        Retry
                      </span>
                      {portraitUsedLlmAdjustment && (
                        <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.5 text-[9px] font-medium text-violet-300 flex items-center gap-0.5">
                          <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          AI tried
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
              <CardHeader className={cn('space-y-1', isActive ? 'gap-3' : '', !isActive && portraitUrl ? 'pt-4 px-6' : '')}>
                <CardTitle className="text-lg font-semibold text-foreground">
                  {seed.name}
                </CardTitle>
                <CardDescription className="text-sm text-foreground/60">
                  {seed.role ?? 'Character'}
                </CardDescription>
              </CardHeader>
              <CardContent className={cn('space-y-3 text-sm text-foreground/70', !isActive && portraitUrl ? 'px-6' : '')}>
                {seed.summary ? (
                  <p className="leading-relaxed text-foreground/75">{seed.summary}</p>
                ) : null}
                {seed.vibe ? (
                  <Badge variant="outline" className="rounded-full border-white/20 bg-black/40 text-foreground/65">
                    {seed.vibe}
                  </Badge>
                ) : null}

                {isActive && doc ? (
                  <div className="mt-6 space-y-4 border-t border-white/10 pt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-4 text-sm text-foreground/75">
                        {storyFunction ? (
                          <DossierSection title="Story function" defaultOpen={false}>
                            <p className="text-base text-foreground/80">{storyFunction}</p>
                          </DossierSection>
                        ) : null}

                        {quickFacts.length ? (
                          <DossierSection title="Quick facts" defaultOpen={false}>
                            <Table>
                              <TableBody>
                                {quickFacts.map(({ label, value }) => (
                                  <TableRow key={label}>
                                    <TableCell className="text-[11px] uppercase tracking-[0.24em] text-foreground/45">
                                      {label}
                                    </TableCell>
                                    <TableCell className="text-sm text-foreground/75">
                                      {value}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </DossierSection>
                        ) : null}

                        {species ? (
                          <DossierSection title="Biometrics & species" defaultOpen={false}>
                            <div className="space-y-2">
                              {species.materiality ? (
                                <p>
                                  <span className="font-medium text-foreground/80">Materiality:</span>{' '}
                                  {species.materiality}
                                </p>
                              ) : null}
                              {species.physiology ? (
                                <p>
                                  <span className="font-medium text-foreground/80">Physiology:</span>{' '}
                                  {species.physiology}
                                </p>
                              ) : null}
                              {species.visual_markers ? (
                                <p>
                                  <span className="font-medium text-foreground/80">Visual markers:</span>{' '}
                                  {species.visual_markers}
                                </p>
                              ) : null}
                              {species.palette?.anchors?.length ? (
                                <div className="space-y-2">
                                  <span className="font-medium text-foreground/80">Palette anchors</span>
                                  <ColorSwatches colors={species.palette.anchors} />
                                  {species.palette.notes ? (
                                    <p className="text-xs text-foreground/55">{species.palette.notes}</p>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </DossierSection>
                        ) : null}

                        {wardrobe ? (
                          <DossierSection title="Wardrobe" defaultOpen={false}>
                            {wardrobe.silhouette_rules ? <p>{wardrobe.silhouette_rules}</p> : null}
                            {wardrobe.items?.length ? (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {wardrobe.items.map((item) => (
                                  <Badge key={item} variant="outline">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                            {wardrobe.accessories?.length ? (
                              <p className="text-xs text-foreground/60 mt-2">
                                Accessories: {wardrobe.accessories.join(", ")}
                              </p>
                            ) : null}
                          </DossierSection>
                        ) : null}

                        {behavior ? (
                          <DossierSection title="Behavioural rails" defaultOpen={false}>
                            {behavior.do?.length ? (
                              <p>
                                <span className="font-medium text-foreground/80">Do:</span>{" "}
                                {behavior.do.join(", ")}
                              </p>
                            ) : null}
                            {behavior.do_not?.length ? (
                              <p className="mt-2">
                                <span className="font-medium text-foreground/80">Avoid:</span>{" "}
                                {behavior.do_not.join(", ")}
                              </p>
                            ) : null}
                          </DossierSection>
                        ) : null}

                        {doc.look?.surface ? (
                          <DossierSection title="Surface treatment" defaultOpen={false}>
                            <p>
                              <span className="font-medium text-foreground/80">Materials:</span>{' '}
                              {doc.look.surface.materials}
                            </p>
                            <p className="mt-2">
                              <span className="font-medium text-foreground/80">Finish:</span>{' '}
                              {doc.look.surface.finish}
                            </p>
                            {doc.look.surface.texture_rules ? (
                              <p className="text-xs text-foreground/60 mt-2">
                                {doc.look.surface.texture_rules}
                              </p>
                            ) : null}
                          </DossierSection>
                        ) : null}

                        {paletteAnchors.length ? (
                          <DossierSection title="Palette anchors" defaultOpen={false}>
                            <ColorSwatches colors={paletteAnchors} />
                            {doc.look?.palette?.notes ? (
                              <p className="mt-2 text-xs text-foreground/55">
                                {doc.look.palette.notes}
                              </p>
                            ) : null}
                          </DossierSection>
                        ) : null}

                        {tags.length ? (
                          <DossierSection title="Tags" defaultOpen={false}>
                            <div className="flex flex-wrap gap-2">
                              {tags.map((tag) => (
                                <Badge key={tag} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </DossierSection>
                        ) : null}

                        {doc.performance?.expression_set?.length ? (
                          <DossierSection title="Expression set" defaultOpen={false}>
                            <ArrayPills values={doc.performance.expression_set} />
                          </DossierSection>
                        ) : null}

                        {doc.sound?.fx?.length || doc.sound?.ambience || doc.sound?.music_tone ? (
                          <DossierSection title="Sound cues" defaultOpen={false}>
                            {doc.sound?.ambience ? (
                              <p>
                                <span className="font-medium text-foreground/80">Ambience:</span>{" "}
                                {doc.sound.ambience}
                              </p>
                            ) : null}
                            {doc.sound?.fx?.length ? <ArrayPills values={doc.sound.fx} /> : null}
                            {doc.sound?.music_tone ? (
                              <p className="text-xs text-foreground/60 mt-2">
                                Music tone: {doc.sound.music_tone}
                              </p>
                            ) : null}
                          </DossierSection>
                        ) : null}
                    </div>
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className={cn('flex flex-col gap-2', !isActive && portraitUrl ? 'px-6 pb-6' : '')}>
                {buildError ? (
                  <p className="text-xs text-red-300 break-words">{buildError}</p>
                ) : null}
                {/* Error indicator with retry count and AI status */}
                {portraitError && (
                  <div className="w-full space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
                      <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider">Failed</span>
                      {portraitRetryCount > 0 && (
                        <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[9px] font-medium text-amber-200">
                          {portraitRetryCount + 1} attempts
                        </span>
                      )}
                      {portraitUsedLlmAdjustment && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[9px] font-medium text-violet-300">
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          AI rewrote prompt
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">{portraitError}</p>
                    {portraitLlmAdjustmentReason && (
                      <p className="text-[10px] text-violet-300/80 leading-relaxed">
                        <span className="font-medium">AI adjustment:</span> {portraitLlmAdjustmentReason}
                      </p>
                    )}
                  </div>
                )}
                <Button
                  type="button"
                  variant={doc ? "default" : "outline"}
                  onClick={() => {
                    if (!doc) {
                      onBuildCharacter(seed);
                      return;
                    }
                    if (isActive) {
                      onClearActiveCharacter();
                    } else {
                      onSelectCharacter(seed.id);
                    }
                  }}
                  disabled={isBuilding}
                  className="w-full justify-center rounded-full transition-all duration-200"
                >
                  {isBuilding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Building…
                    </>
                  ) : doc ? (
                    isActive ? "Hide dossier" : "View dossier"
                  ) : (
                    "Build dossier"
                  )}
                </Button>
                {doc && posterAvailable ? (
                  <Button
                    type="button"
                    variant={portraitLoading ? "destructive" : portraitError ? "destructive" : portraitUrl ? "secondary" : "default"}
                    onMouseDown={(e) => {
                      // Force stop loading state for stuck portraits
                      if (portraitLoading) {
                        console.log(`🛑 Force-stopping stuck portrait for ${seed.id}`);
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      console.log(`🖱️ Portrait button clicked for ${seed.id}, loading: ${portraitLoading}, error: ${portraitError || 'none'}`);
                      
                      // If portrait appears stuck, force clear the loading state first
                      if (portraitLoading) {
                        console.log(`🔄 Portrait ${seed.id} appears stuck, force-clearing state before restart`);
                      }
                      
                      const customPrompt = editedPortraitPrompts[seed.id];
                      onGeneratePortrait(seed.id, customPrompt as string | undefined);
                    }}
                    className="w-full justify-center rounded-full text-sm transition-all duration-200 relative z-50 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ pointerEvents: 'auto' }}
                  >
                    {portraitLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Cancel & Restart
                      </>
                    ) : portraitError ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry portrait
                      </>
                    ) : portraitUrl ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {editedPortraitPrompts[seed.id] ? "Re-render with custom" : "Re-render portrait"}
                      </>
                    ) : (
                      editedPortraitPrompts[seed.id] ? "Render with custom" : "Render portrait"
                    )}
                  </Button>
                ) : null}
                {doc && posterAvailable ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleCopyPortraitPrompt(seed.id)}
                    disabled={portraitLoading}
                    className="w-full justify-center rounded-full text-sm transition-all duration-200"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {portraitCopyStates[seed.id] === "copied"
                      ? "Portrait prompt copied"
                      : portraitCopyStates[seed.id] === "error"
                        ? "Copy failed"
                        : "Copy portrait prompt"}
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          );
        })}
        </div>
      </div>
    );
  })();

  // Trailer preview section for Master tab
  const completedPortraits = characterSeeds
    ?.map((seed) => ({
      seed,
      url: characterPortraits[seed.id],
    }))
    .filter((p) => p.url) || [];
  
  const canGenerateTrailerFromPartial = completedPortraits.length >= 4;
  
  // Removed repetitive trailer section - trailer content shown in Trailer tab
  const trailerPreviewSection = null;
  
  /*
  const OLD_trailerPreviewSection = canGenerateTrailerFromPartial ? (
    <div className="rounded-3xl border border-white/12 bg-black/45 p-6 space-y-4 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground/55">
          Series Trailer
        </p>
        <p className="mt-2 text-sm text-foreground/65">
          {completedPortraits.length === characterSeeds?.length 
            ? `All ${completedPortraits.length} character portraits ready`
            : `${completedPortraits.length} of ${characterSeeds?.length} portraits ready`}
        </p>
      </div>
      
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {characterSeeds?.map((seed) => {
          const portraitUrl = characterPortraits[seed.id];
          const isLoading = characterPortraitLoading[seed.id];
  return (
            <div 
              key={seed.id}
              className="relative overflow-hidden rounded-lg border border-white/10 bg-black/40"
              title={seed.name}
            >
              <div className="relative h-0 w-full pb-[100%]">
                {portraitUrl ? (
                  <Image
                    src={portraitUrl}
                    alt={seed.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized={portraitUrl.includes('replicate.delivery')}
                  />
                ) : isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="h-3 w-3 animate-spin text-primary/60" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                    <span className="text-[10px] text-foreground/30">•</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {trailerLoading ? (
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-black/50 to-black/60 p-6 shadow-[0_12px_40px_rgba(229,9,20,0.3)]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="absolute inset-0 animate-ping">
                <div className="h-full w-full rounded-full border-2 border-primary/30" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground/90">Generating Trailer</p>
              <p className="mt-1 text-xs text-foreground/60">Rendering 12s blockbuster trailer with Sora 2...</p>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      ) : trailerUrl ? (
        <div className="overflow-hidden rounded-2xl border border-white/12 bg-black/60 shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
          <video
            controls
            className="h-full w-full"
            poster={portraitGridUrl ?? undefined}
          >
            <source src={trailerUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="border-t border-white/10 bg-black/40 px-4 py-2 text-center text-xs text-foreground/60">
            12s • Sora 2 • Landscape
          </div>
        </div>
      ) : null}

      {trailerError ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-xs font-semibold text-amber-200">Trailer generation issue</p>
          <p className="mt-1 text-xs text-amber-200/80 break-words leading-relaxed">{trailerError}</p>
          
          {(trailerError.includes("E005") || trailerError.includes("flagged")) ? (
            <details className="mt-3 group">
              <summary className="cursor-pointer text-xs font-medium text-amber-200/80 hover:text-amber-200 underline decoration-dotted">
                Edit prompt & retry →
              </summary>
              <div className="mt-3 space-y-2">
                <Textarea
                  value={editedTrailerPrompt}
                  onChange={(e) => onSetEditedTrailerPrompt(e.target.value)}
                  onFocus={(e) => {
                    // Pre-fill with default prompt on first focus if empty
                    if (!e.target.value && blueprint) {
                      const defaultPrompt = buildDefaultTrailerPrompt();
                      onSetEditedTrailerPrompt(defaultPrompt);
                    }
                  }}
                  placeholder="Click to load default prompt with style guide, then edit as needed..."
                  className="min-h-[350px] max-h-[500px] text-xs font-mono resize-y overflow-auto"
                />
                <p className="text-xs text-foreground/50">
                  Includes style guide from your show bible. Edit to customize the trailer prompt.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (editedTrailerPrompt) {
                        console.log("Regenerating trailer with custom prompt:", editedTrailerPrompt.slice(0, 100));
                        onGenerateTrailer(undefined, editedTrailerPrompt);
                      }
                    }}
                    disabled={!editedTrailerPrompt || trailerLoading}
                    className="flex-1 rounded-full text-xs"
                  >
                    Retry with custom prompt
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetEditedTrailerPrompt("")}
                    className="rounded-full text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant={trailerUrl ? "outline" : "default"}
          onClick={() => onGenerateTrailer()}
          disabled={trailerLoading || completedPortraits.length < 4}
          className="flex-1 justify-center rounded-full"
        >
          {trailerLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Rendering…
            </>
          ) : trailerUrl ? (
            "Re-render trailer"
          ) : (
            `Generate Trailer (${completedPortraits.length} portraits ready)`
          )}
        </Button>
        {trailerUrl || trailerError ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onClearTrailer}
            disabled={trailerLoading}
            className="rounded-full px-4"
          >
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  ) : null;
  */

  // Simple poster image for Master tab (no wrapper, just image)
  const simplePosterImage = libraryPosterUrl ? (
    <button
      type="button"
      onClick={() => onOpenLightbox(libraryPosterUrl)}
      className="overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.65)] cursor-zoom-in transition-transform hover:scale-[1.01] w-full"
    >
      <div className="relative w-full" style={{ aspectRatio: '9/16', maxWidth: '100%' }}>
        <Image
          src={libraryPosterUrl}
          alt="Show poster"
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 25vw, 100vw"
        />
      </div>
    </button>
  ) : libraryPosterLoading ? (
    <div className="flex items-center justify-center rounded-3xl border border-white/12 bg-black/45 w-full max-w-full" style={{ aspectRatio: '9/16' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground/70">Generating poster…</p>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center rounded-3xl border border-dashed border-white/15 bg-black/35 p-6 text-center w-full max-w-full" style={{ aspectRatio: '9/16' }}>
      <p className="text-sm text-foreground/60">
        Show poster will generate automatically after portrait grid is ready
      </p>
    </div>
  );

  const masterContent = (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero Section - Trailer (3/4) & Poster (1/4) Side by Side */}
      <div className="w-full max-w-[900px] lg:max-w-[1400px] mx-auto px-4 sm:px-0">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Trailer - 3 columns (3/4 width) - LEFT SIDE */}
          <div className="lg:col-span-3 w-full max-w-full">
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-white/12 bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.6)] sm:shadow-[0_24px_80px_rgba(0,0,0,0.7)] w-full max-w-full">
              {trailerUrl ? (
                <video
                  controls
                  controlsList="nodownload"
                  className="h-full w-full max-w-full rounded-2xl sm:rounded-3xl bg-black"
                  style={{ 
                    aspectRatio: '16/9',
                    objectFit: 'contain',
                    maxHeight: '70vh'
                  }}
                  poster={portraitGridUrl ?? undefined}
                  autoPlay={false}
                  playsInline
                  preload="metadata"
                >
                  <source src={trailerUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : trailerLoading ? (
            <div className="relative flex items-center justify-center bg-black px-8 py-40 overflow-hidden">
              {/* Netflix-style background animation */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(229,9,20,0.15)_0%,_transparent_70%)]" />
              </div>
              
              {/* Netflix-style loader */}
              <div className="relative text-center space-y-8 z-10">
                <div className="netflix-loader netflix-loader-lg mx-auto" aria-hidden>
                  {Array.from({ length: 12 }).map((_, index) => (
                    <span
                      key={index}
                      className="netflix-loader-bar"
                      style={{ animationDelay: `${index * 0.06}s` }}
                    />
                  ))}
                </div>
                
                <div className="space-y-3">
                  <p className="text-xl font-bold tracking-tight text-foreground/95">
                    Rendering Series Trailer
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {trailerAdjustingPrompt ? "AI Adjusting Prompt" : trailerStatusBadgeLabel}
                      </p>
                    </div>
                    {trailerRetryCount > 0 && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
                        <p className="text-xs font-semibold text-amber-300">
                          Attempt #{trailerRetryCount + 1}
                        </p>
                      </div>
                    )}
                    {trailerUsedLlmAdjustment && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5">
                        <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <p className="text-xs font-semibold text-violet-300">
                          AI-Adjusted Prompt
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-foreground/50">
                    This can take up to 10 minutes
                  </p>
                </div>
                
                {/* Elapsed time and Sora status */}
                <div className="inline-flex items-center gap-6 rounded-2xl border border-white/10 bg-black/40 px-6 py-3 backdrop-blur-sm">
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/45">
                      Elapsed
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-primary/90">
                      {Math.floor(trailerElapsed / 60000)}:{String(Math.floor((trailerElapsed % 60000) / 1000)).padStart(2, '0')}
                    </p>
                    <p className="mt-0.5 text-[9px] text-foreground/40">
                      mm:ss
                    </p>
                  </div>
                  <div className="h-12 w-px bg-white/10" />
                  <div className="text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/45">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground/80">
                      {trailerStatusDetailLabel}
                    </p>
                    <p className="mt-1 text-[10px] text-foreground/40">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                {/* Elegant progress indicator */}
                <div className="flex items-center justify-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-primary/40"
                      style={{
                        animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
                
                {/* AI Prompt Adjustment Panel - shown while AI is rewriting */}
                {trailerAdjustingPrompt && (
                  <div className="mt-8 w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-black/60 to-black/80 p-6 backdrop-blur-sm">
                      {/* Header */}
                      <div className="flex items-center justify-center gap-3 mb-5">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                            <svg className="h-5 w-5 text-violet-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-violet-400 animate-ping" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-violet-300">AI Rewriting Prompt</p>
                          <p className="text-xs text-foreground/50">Bypassing content filters while preserving intent</p>
                        </div>
                      </div>
                      
                      {/* Before/After comparison */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Original Prompt */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-400" />
                            <p className="text-xs font-semibold text-red-300 uppercase tracking-wider">Original (Flagged)</p>
                          </div>
                          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 h-32 overflow-y-auto">
                            <p className="text-[11px] text-foreground/60 whitespace-pre-wrap font-mono leading-relaxed">
                              {trailerOriginalPrompt?.slice(0, 500) || "Loading original prompt..."}
                              {(trailerOriginalPrompt?.length || 0) > 500 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                        
                        {/* Adjusted Prompt - Skeleton while loading */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                            <p className="text-xs font-semibold text-green-300 uppercase tracking-wider">Adjusted (AI)</p>
                          </div>
                          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 h-32 overflow-hidden">
                            {/* Skeleton animation */}
                            <div className="space-y-2 animate-pulse">
                              <div className="h-2 bg-green-500/20 rounded w-full" />
                              <div className="h-2 bg-green-500/20 rounded w-11/12" />
                              <div className="h-2 bg-green-500/20 rounded w-10/12" />
                              <div className="h-2 bg-green-500/20 rounded w-full" />
                              <div className="h-2 bg-green-500/20 rounded w-9/12" />
                              <div className="h-2 bg-green-500/20 rounded w-11/12" />
                              <div className="h-2 bg-green-500/20 rounded w-8/12" />
                            </div>
                            <p className="text-[10px] text-green-400/60 text-center mt-3 animate-pulse">
                              ✨ GPT-4 is crafting a safer prompt...
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-4 h-1 w-full bg-violet-500/20 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full animate-[shimmer_2s_ease-in-out_infinite]" 
                             style={{ width: '60%', backgroundSize: '200% 100%' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : trailerError ? (
            <div className="bg-gradient-to-br from-amber-900/20 via-black/70 to-black/80 px-6 py-10">
              <div className="space-y-6 max-w-3xl mx-auto">
                {/* Error Header */}
                <div className="text-center">
                  <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                    <div className="inline-flex items-center gap-3 rounded-full border border-amber-500/40 bg-amber-500/15 px-5 py-2">
                      <div className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">
                        Generation Failed
                      </span>
                    </div>
                    {trailerRetryCount > 0 && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                        <span className="text-xs font-semibold text-amber-300">
                          Attempt #{trailerRetryCount + 1}
                        </span>
                      </div>
                    )}
                    {trailerUsedLlmAdjustment && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-2">
                        <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-xs font-semibold text-violet-300">
                          AI-Adjusted
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-amber-200">Trailer generation failed</p>
                  <p className="mt-2 text-sm text-amber-200/70 max-w-lg mx-auto">{trailerError}</p>
                  {trailerRetryCount === 1 && !trailerUsedLlmAdjustment && (
                    <p className="mt-2 text-xs text-foreground/50 max-w-md mx-auto">
                      💡 Next retry will use AI to automatically adjust the prompt
                    </p>
                  )}
                  {trailerRetryCount === 0 && (
                    <p className="mt-2 text-xs text-foreground/50 max-w-md mx-auto">
                      💡 After 2 failures, AI will automatically adjust the prompt to bypass content filters
                    </p>
                  )}
                </div>
                
                {/* AI Prompt Adjustment Comparison - show when LLM was used */}
                {trailerUsedLlmAdjustment && (trailerOriginalPrompt || trailerAdjustedPrompt || trailerLlmAdjustmentReason) && (
                  <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="text-sm font-semibold text-violet-300">AI Prompt Adjustment</p>
                    </div>
                    
                    {/* Rejection Reason */}
                    {trailerLlmAdjustmentReason && (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                        <p className="text-xs font-medium text-amber-300 mb-1">Why it was adjusted:</p>
                        <p className="text-sm text-amber-200/80">{trailerLlmAdjustmentReason}</p>
                      </div>
                    )}
                    
                    {/* Side-by-side prompt comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Original Prompt */}
                      {trailerOriginalPrompt && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-400" />
                            <p className="text-xs font-semibold text-red-300 uppercase tracking-wider">Original (Failed)</p>
                          </div>
                          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 max-h-48 overflow-y-auto">
                            <p className="text-xs text-foreground/70 whitespace-pre-wrap font-mono leading-relaxed">
                              {trailerOriginalPrompt.slice(0, 800)}{trailerOriginalPrompt.length > 800 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Adjusted Prompt */}
                      {trailerAdjustedPrompt && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-400" />
                            <p className="text-xs font-semibold text-green-300 uppercase tracking-wider">AI Adjusted (Used)</p>
                          </div>
                          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 max-h-48 overflow-y-auto">
                            <p className="text-xs text-foreground/70 whitespace-pre-wrap font-mono leading-relaxed">
                              {trailerAdjustedPrompt.slice(0, 800)}{trailerAdjustedPrompt.length > 800 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Info about retry */}
                    <p className="text-xs text-violet-300/60 text-center">
                      The AI-adjusted prompt was used but still failed. You can edit below or try again.
                    </p>
                  </div>
                )}
                
                {/* Find & Replace Section */}
                <div className="rounded-xl border border-white/10 bg-black/40 p-5 space-y-4">
                  <p className="text-sm font-semibold text-foreground/80">Edit prompt & retry:</p>
                  
                  {/* Find/Replace Inputs */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-foreground/50">Find</label>
                      <input
                        type="text"
                        placeholder="Text to find..."
                        value={trailerFindText}
                        onChange={(e) => setTrailerFindText(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-foreground/50">Replace with</label>
                      <input
                        type="text"
                        placeholder="Replacement text..."
                        value={trailerReplaceText}
                        onChange={(e) => setTrailerReplaceText(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!trailerFindText}
                        onClick={() => {
                          if (trailerFindText) {
                            // Auto-load prompt if not yet loaded
                            const promptToUse = editedTrailerPrompt || (buildDefaultTrailerPrompt ? buildDefaultTrailerPrompt() : "");
                            if (promptToUse) {
                              // Case-insensitive replace using RegExp
                              const regex = new RegExp(trailerFindText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                              onSetEditedTrailerPrompt(promptToUse.replace(regex, trailerReplaceText));
                              setTrailerFindText("");
                              setTrailerReplaceText("");
                            }
                          }
                        }}
                        className="whitespace-nowrap"
                      >
                        Replace All
                      </Button>
                    </div>
                  </div>
                  
                  {/* Prompt Editor */}
                  <textarea
                    value={editedTrailerPrompt}
                    onChange={(e) => onSetEditedTrailerPrompt(e.target.value)}
                    onFocus={(e) => {
                      if (!e.target.value && buildDefaultTrailerPrompt) {
                        const defaultPrompt = buildDefaultTrailerPrompt();
                        onSetEditedTrailerPrompt(defaultPrompt);
                      }
                    }}
                    placeholder="Click to load default prompt, then edit as needed..."
                    className="w-full min-h-[350px] max-h-[500px] rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:outline-none font-mono overflow-auto resize-y"
                  />
                  
                  {/* Model Selection */}
                  <div className="space-y-2">
                    <p className="text-xs text-foreground/50">Select model for retry:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "veo-3.1" as const, name: "VEO 3.1", desc: "Fast, reliable" },
                        { id: "sora-2" as const, name: "Sora 2", desc: "High quality" },
                        { id: "sora-2-pro" as const, name: "Sora 2 Pro", desc: "Best quality" },
                      ].map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => setTrailerRetryModel(model.id)}
                          className={`px-4 py-2 rounded-lg border text-left transition-all ${
                            trailerRetryModel === model.id
                              ? "border-primary/50 bg-primary/15 text-foreground"
                              : "border-white/10 bg-black/30 text-foreground/60 hover:border-white/20"
                          }`}
                        >
                          <p className="text-sm font-medium">{model.name}</p>
                          <p className="text-xs text-foreground/40">{model.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={() => {
                        onClearTrailerError?.();
                        onGenerateTrailer(trailerRetryModel, editedTrailerPrompt || undefined);
                      }}
                      className="flex-1"
                    >
                      Retry with {trailerRetryModel === "veo-3.1" ? "VEO 3.1" : trailerRetryModel === "sora-2-pro" ? "Sora 2 Pro" : "Sora 2"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        onClearTrailerError?.();
                        onSetEditedTrailerPrompt("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : canGenerateTrailerFromPartial ? (
            <div className="bg-gradient-to-br from-white/5 via-black/50 to-black/60 px-8 py-16">
              <div className="text-center space-y-8 max-w-3xl mx-auto">
                <div>
                  <div className="inline-flex items-center gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">
                      Ready to Generate
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-foreground/80">
                    {completedPortraits.length >= 4 ? "Ready to Generate Trailer" : "Trailer Not Ready"}
                  </p>
                  <p className="mt-2 text-sm text-foreground/60">
                    {completedPortraits.length} of {characterSeeds?.length || 0} portraits complete
                    {completedPortraits.length >= 4 ? "" : " — Need 4 minimum"}
                  </p>
                  {completedPortraits.length >= 4 && (
                    <p className="mt-1 text-xs text-foreground/50">
                      Auto-generates when portrait grid is ready, or click Generate below
                    </p>
                  )}
                </div>
                
                {/* Character Portrait Preview Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 max-w-2xl mx-auto">
                  {characterSeeds?.slice(0, 10).map((seed) => {
                    const portraitUrl = characterPortraits[seed.id];
                    const isLoading = characterPortraitLoading[seed.id];
                    const hasError = characterPortraitErrors[seed.id];
                    
                    return (
                      <button
                        key={seed.id}
                        type="button"
                        className="group relative"
                        title={`${seed.name} - Click to view in Characters tab`}
                        onClick={() => {
                          // Switch to Characters tab and scroll
                          const tabsElement = document.querySelector('[value="characters"]') as HTMLElement;
                          if (tabsElement) {
                            tabsElement.click();
                            setTimeout(() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                          }
                        }}
                      >
                        <div className="overflow-hidden rounded-xl border border-white/12 bg-black/50 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:border-primary/30 group-hover:shadow-[0_8px_32px_rgba(229,9,20,0.3)]">
                          <div className="relative h-0 w-full pb-[100%]">
                            {portraitUrl ? (
                              <Image
                                src={portraitUrl}
                                alt={seed.name}
                                fill
                                className="object-cover transition-opacity duration-500"
                                sizes="120px"
                                unoptimized={portraitUrl.includes('replicate.delivery')}
                              />
                            ) : isLoading ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-black/60">
                                <Loader2 className="h-6 w-6 animate-spin text-primary/80" />
                              </div>
                            ) : hasError ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/15 to-black/60">
                                <span className="text-xs text-amber-300/70">!</span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-black/60">
                                <div className="h-8 w-8 rounded-full border-2 border-dashed border-white/20" />
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 text-center text-[9px] font-medium uppercase tracking-wider text-foreground/40 truncate">
                          {seed.name.split(' ')[0]}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  size="lg"
                  onClick={() => onGenerateTrailer()}
                  className="rounded-full"
                >
                  Generate 12s Trailer with Sora 2
                </Button>
                <p className="text-xs text-foreground/45">Generation can take up to 10 minutes</p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-white/5 via-black/50 to-black/60 px-8 py-16">
              <div className="text-center space-y-8 max-w-3xl mx-auto">
                <div>
                  <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-5 py-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-amber-500/70 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-[0.26em] text-foreground/60">
                      Trailer Pending
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-foreground/80">
                    Building Character Lineup
                  </p>
                  <p className="mt-2 text-sm text-foreground/50">
                    Need 4 character portraits to unlock the series trailer • {completedPortraits.length} of {characterSeeds?.length || 0} complete
                  </p>
                </div>
                
                {/* Character Portrait Preview Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 max-w-2xl mx-auto">
                  {characterSeeds?.slice(0, 10).map((seed) => {
                    const portraitUrl = characterPortraits[seed.id];
                    const isLoading = characterPortraitLoading[seed.id];
                    const hasError = characterPortraitErrors[seed.id];
                    
                    return (
                      <button
                        key={seed.id}
                        type="button"
                        className="group relative"
                        title={`${seed.name} - Click to view in Characters tab`}
                        onClick={() => {
                          // Switch to Characters tab and scroll
                          const tabsElement = document.querySelector('[value="characters"]') as HTMLElement;
                          if (tabsElement) {
                            tabsElement.click();
                            setTimeout(() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                          }
                        }}
                      >
                        <div className="overflow-hidden rounded-xl border border-white/12 bg-black/50 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:border-primary/30 group-hover:shadow-[0_8px_32px_rgba(229,9,20,0.3)]">
                          <div className="relative h-0 w-full pb-[100%]">
                            {portraitUrl ? (
                              <Image
                                src={portraitUrl}
                                alt={seed.name}
                                fill
                                className="object-cover transition-opacity duration-500"
                                sizes="120px"
                                unoptimized={portraitUrl.includes('replicate.delivery')}
                              />
                            ) : isLoading ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-black/60">
                                <Loader2 className="h-6 w-6 animate-spin text-primary/80" />
                              </div>
                            ) : hasError ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/15 to-black/60">
                                <span className="text-xs text-amber-300/70">!</span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-black/60">
                                <div className="h-8 w-8 rounded-full border-2 border-dashed border-white/20" />
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 text-center text-[9px] font-medium uppercase tracking-wider text-foreground/40 truncate">
                          {seed.name.split(' ')[0]}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs text-foreground/40">
                  Click portraits to view in Characters tab
                </div>
              </div>
            </div>
          )}
            </div>
            
            {/* Trailer Model Selector - Only show when trailer exists */}
            {trailerUrl && (
              <div className="mt-6 px-4">
                <TrailerModelSelector
                  currentModel={trailerModel || undefined}
                  onRegenerate={(model) => {
                    console.log("🔄 Regenerating trailer with model:", model);
                    void onGenerateTrailer(model);
                  }}
                  isLoading={trailerLoading}
                  disabled={trailerLoading || !portraitGridUrl}
                />
              </div>
            )}
          </div>
          
          {/* Show Poster - 1 column (1/4 width) - RIGHT SIDE */}
          <div className="lg:col-span-1 w-full">
            <div className="w-full max-w-[280px] sm:max-w-xs md:max-w-sm mx-auto lg:max-w-none lg:mx-0">
              {simplePosterImage}
            </div>
          </div>
        </div>
      </div>

      {/* Character Cards */}
      {characterSeeds && characterSeeds.length > 0 ? (
        <div className="w-full max-w-[1400px] mx-auto space-y-4 px-4 sm:px-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Character Lineup
            </h2>
            <p className="mt-2 text-sm text-foreground/60">
              {characterSeeds.length} character{characterSeeds.length === 1 ? '' : 's'} in the series
            </p>
          </div>
          {charactersContent}
        </div>
      ) : null}

      {/* Visual Direction Section */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-0">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Look Bible
          </h2>
          <p className="mt-2 text-sm text-foreground/60">
            Complete visual aesthetics framework for the series
          </p>
        </div>
        {directivePanel}
      </div>

      {/* Technical Specs Grid */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-0">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Production Specifications
          </h2>
          <p className="mt-2 text-sm text-foreground/60">
            Pipeline, camera, lighting, and finishing guardrails
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <CollapsibleSection
              title="Pipeline"
              description="Capture and finishing guardrails."
              accent="lagoon"
            >
              <div className="space-y-6">
                <KeyValueTable
                  items={[
                    { label: "Color management", value: data.pipeline.color_management },
                    { label: "Aspect ratio", value: data.pipeline.aspect_ratio },
                    { label: "Highlight rolloff", value: data.pipeline.highlight_rolloff },
                    { label: "Black floor", value: data.pipeline.black_floor },
                    { label: "Grain", value: data.pipeline.grain_global },
                  ]}
                />
                <SectionHeading title="Frame rates" />
                <KeyValueTable
                  items={[
                    {
                      label: "Animation",
                      value: `${data.pipeline.frame_rates.animation_capture} fps`,
                    },
                    {
                      label: "Playback",
                      value: `${data.pipeline.frame_rates.playback} fps`,
                    },
                    {
                      label: "Live action",
                      value: `${data.pipeline.frame_rates.live_action_capture} fps`,
                    },
                  ]}
                />
                <SectionHeading title="Shutter angle" />
                <KeyValueTable
                  items={[
                    {
                      label: "Animation",
                      value: `${data.pipeline.shutter_angle.animation}°`,
                    },
                    {
                      label: "Live action",
                      value: `${data.pipeline.shutter_angle.live_action}°`,
                    },
                  ]}
                />
                {data.pipeline.render_order && data.pipeline.render_order.length ? (
                  <>
                    <SectionHeading title="Render order" />
                    <ArrayPills values={data.pipeline.render_order} />
                  </>
                ) : null}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Lighting plan"
              description="Mood, contrast, and practical policy."
              accent="amber"
            >
              <div className="space-y-6">
                <KeyValueTable
                  items={[
                    { label: "Temperature model", value: data.lighting.temperature_model },
                    { label: "Key", value: data.lighting.key },
                    { label: "Fill", value: data.lighting.fill },
                    { label: "Edge", value: data.lighting.edge },
                    {
                      label: "Practicals",
                      value: data.lighting.practicals_in_frame ? "Encouraged" : "Limit",
                    },
                    { label: "Halation", value: data.lighting.halation_policy },
                  ]}
                />
                {data.lighting.no_go && data.lighting.no_go.length ? (
                  <>
                    <SectionHeading title="No-go" />
                    <ArrayPills values={data.lighting.no_go} />
                  </>
                ) : null}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Composition"
              description="Framing habits to keep scenes cohesive."
              accent="sand"
            >
              <KeyValueTable
                items={[
                  { label: "Symmetry bias", value: data.composition.symmetry_bias },
                  { label: "Leading lines", value: data.composition.leading_lines },
                  {
                    label: "Foreground depth",
                    value: data.composition.foreground_depth,
                  },
                  {
                    label: "Color blocking",
                    value: data.composition.color_blocking,
                  },
                ]}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Sets & props"
              description="Environment staging and recurring gags."
              accent="lagoon"
            >
              <div className="space-y-6">
                <SectionHeading title="Primary sets" />
                <ArrayPills values={data.sets_and_prop_visuals.primary_sets} />
                <KeyValueTable
                  items={[
                    { label: "Prop style", value: data.sets_and_prop_visuals.prop_style },
                    { label: "Displays", value: data.sets_and_prop_visuals.display_devices },
                  ]}
                />
                {data.sets_and_prop_visuals.runner_gags_visual?.length ? (
                  <>
                    <SectionHeading title="Recurring gags" />
                    <ArrayPills values={data.sets_and_prop_visuals.runner_gags_visual} />
                  </>
                ) : null}
              </div>
            </CollapsibleSection>
          </div>

          <div className="space-y-6">
            <CollapsibleSection
              title="Color direction"
              description="Palette anchors and restrictions."
              accent="blush"
            >
              <div className="space-y-6">
                <KeyValueTable
                  items={[
                    { label: "Palette bias", value: data.color.palette_bias },
                    { label: "Skin protection", value: data.color.skin_protection },
                    {
                      label: "White balance",
                      value: data.color.white_balance_baseline_K
                        ? `${data.color.white_balance_baseline_K}K`
                        : undefined,
                    },
                  ]}
                />
                <SectionHeading title="Anchor hex" />
                <ColorSwatches colors={data.color.anchor_hex} />
                {data.color.prohibitions && data.color.prohibitions.length ? (
                  <>
                    <SectionHeading title="Avoid" />
                    <ArrayPills values={data.color.prohibitions} />
                  </>
                ) : null}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Camera grammar"
              description="Glass, movement, and coverage preferences."
              accent="iris"
            >
              <div className="space-y-6">
                <KeyValueTable
                  items={[
                    { label: "Sensor", value: data.camera.sensor },
                    { label: "Depth of field", value: data.camera.dof_guides },
                  ]}
                />
                <SectionHeading title="Lens family" />
                <ArrayPills values={data.camera.lens_family} />
                {data.camera.movement && data.camera.movement.length ? (
                  <>
                    <SectionHeading title="Movement" />
                    <ArrayPills values={data.camera.movement} />
                  </>
                ) : null}
                {data.camera.coverage_rules && data.camera.coverage_rules.length ? (
                  <>
                    <SectionHeading title="Coverage rules" />
                    <ArrayPills values={data.camera.coverage_rules} />
                  </>
                ) : null}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Materials & textures"
              description="Surface language for cast and environments."
              accent="moss"
            >
              <div className="space-y-6">
                <KeyValueTable
                  items={[
                    {
                      label: "Human textures",
                      value: data.materials_and_textures.human_textures,
                    },
                    { label: "Patina", value: data.materials_and_textures.patina },
                    { label: "Notes", value: data.materials_and_textures.notes },
                  ]}
                />
                <SectionHeading title="Set surfaces" />
                <ArrayPills values={data.materials_and_textures.set_surfaces} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Post & delivery"
              description="Finishing expectations."
              accent="slate"
            >
              <div className="space-y-6">
                <SectionHeading title="Post grade" />
                <KeyValueTable
                  items={[
                    { label: "Curve", value: data.post_grade.curve },
                    { label: "LUT", value: data.post_grade.lut },
                    { label: "Grain placement", value: data.post_grade.grain?.placement },
                    { label: "Grain intensity", value: data.post_grade.grain?.intensity },
                    { label: "Halation scope", value: data.post_grade.halation?.scope },
                    { label: "Halation strength", value: data.post_grade.halation?.strength },
                  ]}
                />
                <SectionHeading title="Export specs" />
                <div className="space-y-3 text-sm text-foreground/65">
                  <div>
                    <p className="font-medium text-foreground/70">Stills</p>
                    <ArrayPills values={data.export_specs.stills} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground/70">Video intermediate</p>
                    <p>{data.export_specs.video_intermediate}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground/70">Delivery color</p>
                    <p>{data.export_specs.delivery_color}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground/70">Plates</p>
                    <ArrayPills values={data.export_specs.plates} />
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>

      {/* Species Design */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-0">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Species Design
          </h2>
          <p className="mt-2 text-sm text-foreground/60">
            Character sheets for every performer type
          </p>
        </div>
        <CollapsibleSection
          title="Species design"
          description="Character sheets for every performer type."
          accent="slate"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {data.species_design.types.map((type) => (
              <div
                key={type.name}
                className="rounded-2xl border border-white/12 bg-black/40 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-foreground">
                    {type.name}
                  </p>
                  <Badge className="border-white/20 bg-black/50 text-foreground/70">
                    {type.surface_finish}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-foreground/65">{type.silhouette}</p>
                <Separator className="my-4 border-white/10" />
                <div className="space-y-3 text-sm text-foreground/65">
                  {type.materials ? (
                    <p>
                      <span className="font-medium text-foreground/70">
                        Materials:
                      </span>{" "}
                      {type.materials}
                    </p>
                  ) : null}
                  <p>
                    <span className="font-medium text-foreground/70">
                      Eyes:
                    </span>{" "}
                    {[
                      type.eyes.type,
                      `Catchlight ${type.eyes.catchlight_shape}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {type.eyes.behaviors && type.eyes.behaviors.length ? (
                    <ArrayPills values={type.eyes.behaviors} />
                  ) : null}
                  <p>
                    <span className="font-medium text-foreground/70">
                      Face modularity:
                    </span>{" "}
                    {type.face_modularity}
                  </p>
                  {type.stress_cues ? (
                    <p>
                      <span className="font-medium text-foreground/70">
                        Stress cues:
                      </span>{" "}
                      {type.stress_cues}
                    </p>
                  ) : null}
                  {type.palette?.anchors && type.palette.anchors.length ? (
                    <div className="space-y-2">
                      <span className="font-medium text-foreground/70">
                        Palette anchors
                      </span>
                      <ColorSwatches colors={type.palette.anchors} />
                      {type.palette.notes ? (
                        <p className="text-xs text-foreground/55">
                          {type.palette.notes}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Global Rules */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-0">
        <CollapsibleSection
          title="Global prohibitions"
          description="Do-not-cross guardrails to keep the look coherent."
          accent="slate"
        >
          <ArrayPills values={data.prohibitions_global} />
        </CollapsibleSection>
      </div>
    </div>
  );

  const videosContent = (() => {
    if (!posterAvailable) {
      return (
        <div className="rounded-3xl border border-white/12 bg-black/45 p-6 text-sm text-foreground/65">
          Video generation is disabled. Add a Replicate token to unlock character showcases.
        </div>
      );
    }

    if (charactersLoading && (!characterSeeds || characterSeeds.length === 0)) {
      return (
        <div className="rounded-3xl border border-white/12 bg-black/45 px-6 py-4 text-sm text-foreground/70">
          <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin text-primary" />
          Preparing character lineup…
        </div>
      );
    }

    if (!characterSeeds || characterSeeds.length === 0) {
      return (
        <div className="rounded-3xl border border-dashed border-white/12 bg-black/45 p-6 text-center text-sm text-foreground/55">
          Generate a show brief to unlock character showcases.
        </div>
      );
    }

    const supportsResolution = Boolean(videoModelOption.resolutions?.length);

    const charactersReadyForVideo = characterSeeds.filter((seed) => {
      const doc = characterDocs[seed.id];
      const portraitUrl = characterPortraits[seed.id];
      const hasShowcasePrompt = Boolean(doc?.showcase_scene_prompt);
      const videoLoading = Boolean(characterVideoLoading[seed.id]);
      return doc && portraitUrl && hasShowcasePrompt && !videoLoading;
    });

    const handleGenerateAllVideos = () => {
      charactersReadyForVideo.forEach((seed) => {
        const customPrompt = editedVideoPrompts[seed.id];
        onGenerateVideo(seed.id, customPrompt);
      });
    };

    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-white/12 bg-black/35 p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-foreground/55">
                Video render settings
              </p>
              <p className="text-sm text-foreground/65">{videoModelOption.description}</p>
            </div>
            <div className="grid w-full gap-3 sm:auto-cols-max sm:grid-flow-col">
              <div className="flex flex-col gap-1">
                <label htmlFor="video-model" className="text-[11px] uppercase tracking-[0.28em] text-foreground/50">
                  Model
                </label>
                <select
                  id="video-model"
                  value={videoModelId}
                  onChange={(event) => onVideoModelChange(event.target.value as VideoModelId)}
                  className="rounded-full border border-white/20 bg-black/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                >
                  {VIDEO_MODEL_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="video-seconds" className="text-[11px] uppercase tracking-[0.28em] text-foreground/50">
                  Duration
                </label>
                <select
                  id="video-seconds"
                  value={videoSeconds}
                  onChange={(event) => onVideoSecondsChange(Number(event.target.value) as VideoDuration)}
                  className="rounded-full border border-white/20 bg-black/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                >
                  {videoModelOption.seconds.map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {VIDEO_DURATION_LABELS[seconds]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="video-aspect" className="text-[11px] uppercase tracking-[0.28em] text-foreground/50">
                  Aspect
                </label>
                <select
                  id="video-aspect"
                  value={videoAspectRatio}
                  onChange={(event) => onVideoAspectRatioChange(event.target.value as VideoAspectRatio)}
                  className="rounded-full border border-white/20 bg-black/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                >
                  {videoModelOption.aspectRatios.map((aspect) => (
                    <option key={aspect} value={aspect}>
                      {VIDEO_ASPECT_LABELS[aspect]}
                    </option>
                  ))}
                </select>
              </div>
              {supportsResolution ? (
                <div className="flex flex-col gap-1">
                  <label htmlFor="video-resolution" className="text-[11px] uppercase tracking-[0.28em] text-foreground/50">
                    Resolution
                  </label>
                  <select
                    id="video-resolution"
                    value={videoResolution}
                    onChange={(event) => onVideoResolutionChange(event.target.value as VideoResolution)}
                    className="rounded-full border border-white/20 bg-black/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                  >
                    {videoModelOption.resolutions?.map((resolution) => (
                      <option key={resolution} value={resolution}>
                        {VIDEO_RESOLUTION_LABELS[resolution]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {charactersReadyForVideo.length > 0 && (
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleGenerateAllVideos}
              disabled={charactersReadyForVideo.length === 0}
              className="rounded-full"
            >
              <SendHorizontal className="mr-2 h-4 w-4" />
              Generate All Videos ({charactersReadyForVideo.length} ready)
            </Button>
          </div>
        )}
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {characterSeeds.map((seed) => {
          const doc = characterDocs[seed.id];
          const portraitUrl = characterPortraits[seed.id];
          const videoUrls = characterVideos[seed.id] || [];
          const selectedIndex = selectedVideoIndex[seed.id] ?? 0;
          const currentVideoUrl = videoUrls[selectedIndex];
          const videoLoading = Boolean(characterVideoLoading[seed.id]);
          const videoError = characterVideoErrors[seed.id];
          const hasShowcasePrompt = Boolean(doc?.showcase_scene_prompt);
          const canRender = Boolean(doc && portraitUrl && hasShowcasePrompt);

          let actionLabel = "Render video";
          if (!doc) {
            actionLabel = "Build dossier first";
          } else if (!portraitUrl) {
            actionLabel = "Render portrait first";
          } else if (!hasShowcasePrompt) {
            actionLabel = "Missing scene prompt";
          } else if (videoUrls.length > 0) {
            actionLabel = "Render new version";
          }

          return (
            <Card key={seed.id} className="flex h-full flex-col overflow-hidden border-white/10 bg-black/45 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
              <CardHeader className="space-y-1 border-b border-white/10 bg-black/40">
                <CardTitle className="text-base text-foreground">{seed.name}</CardTitle>
                <CardDescription className="text-xs text-foreground/60">
                  {seed.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4 py-6 text-sm text-foreground/75">
                {!doc ? (
                  <p className="rounded-xl border border-white/10 bg-black/35 p-3 text-xs text-foreground/60">
                    Build this character’s dossier from the Characters tab to unlock video renders.
                  </p>
                ) : !portraitUrl ? (
                  <p className="rounded-xl border border-white/10 bg-black/35 p-3 text-xs text-foreground/60">
                    Generate a portrait first so the model can lock onto their likeness.
                  </p>
                ) : !hasShowcasePrompt ? (
                  <p className="rounded-xl border border-white/10 bg-black/35 p-3 text-xs text-foreground/60">
                    Showcase prompt missing. Regenerate the character dossier to capture it.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-black/60 shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
                      <div className="relative h-0 w-full pb-[177.78%]">
                        {currentVideoUrl ? (
                          <video
                            key={currentVideoUrl}
                            controls
                            controlsList="nodownload"
                            className="absolute inset-0 h-full w-full rounded-xl sm:rounded-2xl object-cover bg-black"
                            style={{
                              WebkitTapHighlightColor: 'transparent'
                            }}
                            playsInline
                            preload="metadata"
                          >
                            <source src={currentVideoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/80 via-black/60 to-black/80">
                            {portraitUrl && (
                              <div 
                                className="absolute inset-0 opacity-20 blur-2xl"
                                style={{
                                  backgroundImage: `url(${portraitUrl})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }}
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const customPrompt = editedVideoPrompts[seed.id];
                                onGenerateVideo(seed.id, customPrompt);
                              }}
                              disabled={videoLoading || !canRender}
                              className="group relative z-10 flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-8 py-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/60 hover:from-primary/30 hover:via-primary/20 hover:shadow-[0_0_40px_rgba(229,9,20,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-primary/30"
                            >
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-[0_0_30px_rgba(229,9,20,0.4)] transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_0_50px_rgba(229,9,20,0.6)]">
                                <SendHorizontal className="h-6 w-6 text-white" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                  Render Video
                                </p>
                                <p className="text-xs text-foreground/50">
                                  {videoModelOption.label}
                                </p>
                              </div>
                            </button>
                          </div>
                        )}
                        {videoLoading ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : null}
                      </div>
                      {videoUrls.length > 0 ? (
                        <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-foreground/80 backdrop-blur-sm">
                          Version {selectedIndex + 1} of {videoUrls.length}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleCopyPortraitPrompt(seed.id)}
                        className="rounded-full text-xs"
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        {portraitCopyStates[seed.id] === "copied"
                          ? "Portrait prompt copied"
                          : portraitCopyStates[seed.id] === "error"
                            ? "Copy failed"
                            : "Copy portrait prompt"}
                      </Button>
                    </div>
                    {videoUrls.length > 1 ? (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-foreground/45">
                          Previous versions
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {videoUrls.map((url, index) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() => {
                                onSetSelectedVideoIndex((prev) => ({
                                  ...prev,
                                  [seed.id]: index,
                                }));
                              }}
                              className={cn(
                                "relative flex-shrink-0 overflow-hidden rounded-lg border transition-all duration-200",
                                selectedIndex === index
                                  ? "border-primary/60 ring-2 ring-primary/30"
                                  : "border-white/20 hover:border-white/40"
                              )}
                            >
                              <div className="relative h-16 w-28">
                                <video
                                  className="h-full w-full object-cover"
                                  preload="metadata"
                                >
                                  <source src={url} type="video/mp4" />
                                </video>
                                {selectedIndex === index ? (
                                  <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                                    <span className="text-xs font-bold text-foreground">
                                      ▶
                                    </span>
                                  </div>
                                ) : null}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center text-[10px] text-foreground/70">
                                  V{index + 1}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="space-y-2 rounded-2xl border border-white/10 bg-black/35 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-foreground/45">
                        Showcase scene prompt
                      </p>
                      <Textarea
                        value={editedVideoPrompts[seed.id] ?? doc.showcase_scene_prompt ?? ""}
                        onChange={(e) => {
                          onSetEditedVideoPrompt((prev) => ({
                            ...prev,
                            [seed.id]: e.target.value,
                          }));
                        }}
                        placeholder="Describe the 8-second showcase scene..."
                        className="min-h-[120px] text-sm"
                        disabled={videoLoading}
                      />
                      {editedVideoPrompts[seed.id] && editedVideoPrompts[seed.id] !== doc.showcase_scene_prompt ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onSetEditedVideoPrompt((prev) => {
                                const next = { ...prev };
                                delete next[seed.id];
                                return next;
                              });
                            }}
                            className="h-7 text-xs"
                          >
                            Reset
                          </Button>
                          <p className="flex-1 text-xs text-foreground/50">
                            Prompt modified - will use custom version
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
                {videoError ? (
                  <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200/80">
                    {videoError}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="border-t border-white/10 bg-black/40">
                <Button
                   type="button"
                   className="w-full justify-center rounded-full"
                   variant={currentVideoUrl ? "outline" : "default"}
                   onClick={() => {
                     const customPrompt = editedVideoPrompts[seed.id];
                     onGenerateVideo(seed.id, customPrompt);
                   }}
                   disabled={videoLoading || !canRender}
                 >
                  {videoLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rendering video…
                    </>
                  ) : (
                    actionLabel
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        </div>
      </div>
    );
  })();

  const trailerContent = (
    <div className="space-y-6 w-full max-w-[1000px] mx-auto px-4 sm:px-0">
      {portraitGridSection}
      {trailerSection}
    </div>
  );

  const assetStatusItems = [
    { key: "libraryPoster", label: "Show poster", ready: Boolean(libraryPosterUrl) },
    { key: "grid", label: "Character grid", ready: Boolean(portraitGridUrl) },
    { key: "trailer", label: "Series trailer", ready: Boolean(trailerUrl) },
  ] as const;
  const assetsReadyCount = assetStatusItems.filter((item) => item.ready).length;
  const assetsSummary = (
    <section className="rounded-3xl border border-white/12 bg-black/40 px-6 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground/55">
            Asset readiness
          </p>
          <p className="text-3xl font-bold text-foreground">{assetsReadyCount} / {assetStatusItems.length}</p>
          <p className="text-sm text-foreground/60">Ready for export</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={async () => {
              if (!currentShowId) return;
              
              try {
                const response = await fetch(`/api/download-show?showId=${currentShowId}`);
                if (!response.ok) throw new Error("Download failed");
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${sanitizeFilename(blueprint?.show_title || 'show')}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                console.error("Download failed:", error);
              }
            }}
            disabled={!currentShowId || assetsReadyCount === 0}
            className="gap-2 rounded-full"
            variant="default"
          >
            <Download className="h-4 w-4" />
            Download All Assets
          </Button>
          <Badge
            variant="outline"
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
              posterAvailable ? "border-emerald-400/40 text-emerald-200" : "border-white/20 text-foreground/60"
            )}
          >
            {posterAvailable ? "Automation unlocked" : "Automation locked"}
          </Badge>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {assetStatusItems.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  item.ready ? "bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.65)]" : "bg-white/25"
                )}
              />
              <p
                className={cn(
                  "text-sm font-semibold",
                  item.ready ? "text-foreground" : "text-foreground/60"
                )}
              >
                {item.ready ? "Ready" : "Pending"}
              </p>
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-foreground/50">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );

  // Episodes Tab Content
  const episodesContent = (
    <div className="space-y-8">
      {/* Show Format Section */}
      <ShowFormatVisualizer
        format={showFormat}
        showTitle={blueprint?.show_title || "Untitled Show"}
        isLoading={showFormatLoading}
        onRegenerate={onGenerateShowFormat}
      />
      
      {/* Episode Studio Quick Access - shown when episodes exist */}
      {episodes.length > 0 && currentShowId && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Clapperboard className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Episode Studio</h4>
              <p className="text-xs text-foreground/50">Generate storyboards, keyframes & video clips</p>
            </div>
          </div>
          <Link href={`/episodes/${currentShowId}`}>
            <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
              Open Studio
              <PlayCircle className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Generate Episodes Button (if format exists but no episodes) */}
      {showFormat && episodes.length === 0 && !episodesLoading && (
        <div className="flex justify-center">
          <Button
            onClick={onGenerateEpisodes}
            className="rounded-full"
            size="lg"
          >
            <Clapperboard className="mr-2 h-4 w-4" />
            Generate 6 Episode Loglines
          </Button>
        </div>
      )}
      
      {/* Episodes Section */}
      {(showFormat || episodes.length > 0) && (
        <EpisodeCards
          episodes={episodes}
          seasonArc={seasonArc || undefined}
          characterSeeds={characterSeeds?.map(s => ({ id: s.id, name: s.name }))}
          isLoading={episodesLoading}
          onRegenerate={showFormat ? onGenerateEpisodes : undefined}
          showId={currentShowId || undefined}
        />
      )}
      
      {/* Empty state - no format and no episodes */}
      {!showFormat && episodes.length === 0 && !showFormatLoading && !episodesLoading && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-8 text-center">
          <Clapperboard className="mx-auto h-10 w-10 text-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Create Your Episode Format</h3>
          <p className="text-sm text-foreground/60 mb-6 max-w-md mx-auto">
            Generate the structural DNA for your series - the episode formula that makes every episode feel consistent while allowing creative variation.
          </p>
          <Button
            onClick={onGenerateShowFormat}
            className="rounded-full"
            size="lg"
            disabled={!blueprint || !characterSeeds?.length}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Episode Format
          </Button>
          {(!blueprint || !characterSeeds?.length) && (
            <p className="text-xs text-foreground/40 mt-3">
              Requires show blueprint and characters
            </p>
          )}
        </div>
      )}
    </div>
  );

  const episodesTabBusy = showFormatLoading || episodesLoading;
  
  const navigationTabs = [
    { value: "master", label: "Master", icon: Sparkles, busy: false, busyLabel: "" },
    { value: "characters", label: "Characters", icon: Users, busy: charactersTabBusy, busyLabel: "Character tasks running" },
    { value: "episodes", label: "Episodes", icon: Clapperboard, busy: episodesTabBusy, busyLabel: "Generating episodes" },
    { value: "videos", label: "Videos", icon: Film, busy: videosTabBusy, busyLabel: "Video renders running" },
    { value: "trailer", label: "Trailer", icon: PlayCircle, busy: trailerTabBusy, busyLabel: "Trailer rendering" },
    { value: "assets", label: "Assets", icon: Boxes, busy: assetsTabBusy, busyLabel: "Asset renders running" },
  ] as const;

  const guardrailToggleBaseClasses = stylizationGuardrails
    ? "border-primary/50 bg-primary/15 text-foreground hover:bg-primary/25"
    : "border-white/25 bg-transparent text-foreground/70 hover:bg-white/10";

  const autopilotToggleBaseClasses = autopilotMode
    ? "border-primary/50 bg-primary/15 text-foreground hover:bg-primary/25"
    : "border-white/25 bg-transparent text-foreground/70 hover:bg-white/10";

  const scrollTabs = (direction: "left" | "right") => {
    const container = tabNavRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    window.requestAnimationFrame(updateTabScrollState);
  };

  return (
    <>
      {/* Show Overview with Integrated Tabs */}
      <div className="max-w-[1600px] mx-auto mb-4 sm:mb-6 px-3 sm:px-4 min-w-0 w-full box-border" style={{ maxWidth: 'calc(100vw - 24px)' }}>
        <div className="rounded-2xl sm:rounded-3xl border border-white/12 bg-black/45 shadow-[0_18px_60px_rgba(0,0,0,0.55)] overflow-hidden w-full min-w-0 max-w-full box-border">
          {/* Show Header */}
          <div className="p-4 sm:p-6 pb-3 sm:pb-4 space-y-3 sm:space-y-4 border-b border-white/12 overflow-hidden max-w-full box-border">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.28em] sm:tracking-[0.32em] text-foreground/55">
                Show overview
              </p>
              {usageBadge}
            </div>
            {blueprint.show_title ? (
              <h2 className="text-xl sm:text-2xl font-bold text-foreground/90 leading-tight break-words">
                {blueprint.show_title}
              </h2>
            ) : null}
            <p className="text-sm sm:text-base leading-relaxed text-foreground/80 whitespace-pre-wrap break-words max-w-full overflow-hidden overflow-wrap-anywhere" style={{ wordBreak: 'break-word' }}>
              {blueprint.show_logline}
            </p>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="master" className="space-y-0 overflow-hidden w-full max-w-full" id="main-tabs">
            <div className="flex flex-col gap-3 px-3 sm:px-6 pt-3 sm:pt-4 pb-2 overflow-hidden w-full max-w-full box-border">
              <div className="relative w-full max-w-full overflow-hidden">
                <div
                  className={cn(
                    "pointer-events-none absolute inset-y-1 left-0 hidden w-6 rounded-l-2xl bg-gradient-to-r from-black/80 to-transparent transition-opacity duration-200 sm:block",
                    tabScrollState.canScrollLeft ? "opacity-100" : "opacity-0"
                  )}
                  aria-hidden="true"
                />
                <div
                  className={cn(
                    "pointer-events-none absolute inset-y-1 right-0 hidden w-6 rounded-r-2xl bg-gradient-to-l from-black/80 to-transparent transition-opacity duration-200 sm:block",
                    tabScrollState.canScrollRight ? "opacity-100" : "opacity-0"
                  )}
                  aria-hidden="true"
                />

                <button
                  type="button"
                  aria-label="Scroll tabs left"
                  onClick={() => scrollTabs("left")}
                  className={cn(
                    "absolute left-1 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-foreground shadow-lg transition-opacity duration-200 sm:flex",
                    tabScrollState.canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                >
                  <ChevronDown className="-rotate-90 h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Scroll tabs right"
                  onClick={() => scrollTabs("right")}
                  className={cn(
                    "absolute right-1 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-foreground shadow-lg transition-opacity duration-200 sm:flex",
                    tabScrollState.canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                >
                  <ChevronDown className="rotate-90 h-4 w-4" />
                </button>

                <div
                  ref={tabNavRef}
                  className="console-tabs-scroll scrollbar-hide overflow-x-auto rounded-2xl border border-white/12 bg-black/40 p-1.5 sm:p-2"
                >
                  <TabsList className="flex min-w-max gap-2 bg-transparent p-0 text-foreground/70 snap-x snap-mandatory">
                    {navigationTabs.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex-none rounded-xl px-3.5 py-2 text-[11px] sm:text-sm font-semibold tracking-wide uppercase text-foreground/70 transition-all duration-200 border border-transparent data-[state=active]:bg-white/15 data-[state=active]:text-foreground data-[state=active]:border-white/20 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none whitespace-nowrap snap-center"
                      >
                        <span className="flex items-center gap-1.5">
                          <tab.icon className="h-3.5 w-3.5 text-primary/80" />
                          <span>{tab.label}</span>
                          {tab.busy ? (
                            <span
                              className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(229,9,20,0.65)] animate-pulse"
                              aria-label={tab.busyLabel}
                            />
                          ) : null}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>
              <div className="hidden sm:flex w-full items-center justify-between gap-3">
                <RawJsonPeek key={rawJson ?? "no-json"} rawJson={rawJson} currentShowId={currentShowId} />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAutopilotMode(!autopilotMode)}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-semibold tracking-[0.2em] uppercase transition-colors",
                      autopilotToggleBaseClasses
                    )}
                    title="Auto-generate portraits, poster, and trailer"
                  >
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    Autopilot: {autopilotMode ? "On" : "Off"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleStylizationGuardrails}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-semibold tracking-[0.2em] uppercase transition-colors",
                      guardrailToggleBaseClasses
                    )}
                    title="Toggle stylization guardrails"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Guardrails: {stylizationGuardrails ? "On" : "Off"}
                  </Button>
                </div>
              </div>
              <div className="sm:hidden w-full flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAutopilotMode(!autopilotMode)}
                  className={cn(
                    "flex-1 rounded-full px-3 py-2 text-[10px] font-semibold tracking-[0.12em] uppercase transition-colors",
                    autopilotToggleBaseClasses
                  )}
                  title="Auto-generate all media"
                >
                  <Zap className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="truncate">Auto: {autopilotMode ? "On" : "Off"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleStylizationGuardrails}
                  className={cn(
                    "flex-1 rounded-full px-3 py-2 text-[10px] font-semibold tracking-[0.12em] uppercase transition-colors",
                    guardrailToggleBaseClasses
                  )}
                  title="Toggle stylization guardrails"
                >
                  <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="truncate">Guardrails: {stylizationGuardrails ? "On" : "Off"}</span>
                </Button>
              </div>
            </div>
            
            {/* Tab Content - All inside the show overview container */}
            <div className="console-master-shell px-3 sm:px-6 pb-4 sm:pb-6">
              <TabsContent value="master" className="mt-4 sm:mt-6">
                {masterContent}
              </TabsContent>
              <TabsContent value="assets" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <div className="space-y-6 sm:space-y-8">
                  {assetsSummary}
                  <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                    <section className="space-y-3 sm:space-y-4">
                      <div>
                        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.28em] sm:tracking-[0.32em] text-foreground/55">
                          Key art delivery
                        </p>
                        <p className="text-xs sm:text-sm text-foreground/65">
                          Poster-ready stills staged for decks, look books, and library carousels.
                        </p>
                      </div>
                      {libraryPosterSection}
                    </section>
                    <section className="space-y-3 sm:space-y-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground/55">
                          Companion media
                        </p>
                        <p className="text-sm text-foreground/65">
                          Character grids and the auto-cut trailer for packaging and pitches.
                        </p>
                      </div>
                      {portraitGridSection}
                      {trailerSection}
                    </section>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="characters" className="mt-6">
                {charactersContent}
              </TabsContent>
              <TabsContent value="episodes" className="mt-6">
                {episodesContent}
              </TabsContent>
              <TabsContent value="videos" className="mt-6">
                {videosContent}
              </TabsContent>
              <TabsContent value="trailer" className="mt-6">
                {trailerContent}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      
      <div className="hidden" aria-hidden>
        {overviewContent}
      </div>
    </>
  );

}

type ConsoleProps = {
  initialShowId?: string;
};

export function Console({ initialShowId }: ConsoleProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  // Start in loading state if we have an initialShowId to load
  const [isLoadingShow, setIsLoadingShow] = useState(!!initialShowId);
  // Don't pre-set currentShowId - it gets set after loading completes
  const [currentShowId, setCurrentShowId] = useState<string | null>(null);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [input, setInput] = useState("");
  const [stylizationGuardrails, setStylizationGuardrails] = useState(false); // Default matches home page
  const [autopilotMode, setAutopilotMode] = useState(true); // Auto-generate all media - Default ON
  const [blueprint, setBlueprint] = useState<ShowBlueprint | null>(null);
  // Global prompt template for trailers (loaded from database)
  const [trailerTemplate, setTrailerTemplate] = useState<string | null>(null);
  const [usage, setUsage] = useState<ApiResponse["usage"]>();
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<ModelId>("gpt-4o");
  const [activeModel, setActiveModel] = useState<ModelId>("gpt-4o");
  const [imageModel, setImageModel] = useState<ImageModelId>("nano-banana-pro");
  const [videoGenModel, setVideoGenModel] = useState<VideoGenerationModelId>("veo-3.1");
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isPipelinePanelOpen, setIsPipelinePanelOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STYLIZATION_GUARDRAILS_STORAGE_KEY);
    if (stored !== null) {
      setStylizationGuardrails(stored !== "false");
    }
    
    // Load autopilot mode preference from home page settings
    const storedAutopilot = window.localStorage.getItem("production-flow.autopilot-mode");
    if (storedAutopilot !== null) {
      setAutopilotMode(storedAutopilot === "true");
    }
    
    // Load image model preference from home page settings
    const storedImageModel = window.localStorage.getItem("production-flow.image-model");
    if (storedImageModel && (storedImageModel === "gpt-image" || storedImageModel === "flux" || storedImageModel === "nano-banana-pro")) {
      setImageModel(storedImageModel as ImageModelId);
    }
    
    // Load video generation model preference from home page settings
    const storedVideoModel = window.localStorage.getItem("production-flow.video-model");
    if (storedVideoModel) {
      // Set the video generation model if it matches
      if (storedVideoModel === "sora-2" || storedVideoModel === "sora-2-pro" || storedVideoModel === "veo-3.1") {
        setVideoGenModel(storedVideoModel as VideoGenerationModelId);
      }
    }
    
    // Load global prompt templates from database
    async function loadTemplates() {
      try {
        const response = await fetch("/api/prompts");
        if (response.ok) {
          const data = await response.json() as { templates: { trailerBasePrompt: string } };
          if (data.templates?.trailerBasePrompt) {
            setTrailerTemplate(data.templates.trailerBasePrompt);
            console.log("✅ Loaded trailer template from database");
          }
        }
      } catch (error) {
        console.warn("Failed to load prompt templates:", error);
      }
    }
    void loadTemplates();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STYLIZATION_GUARDRAILS_STORAGE_KEY,
      stylizationGuardrails ? "true" : "false"
    );
  }, [stylizationGuardrails]);

  // Persist autopilot mode changes to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("production-flow.autopilot-mode", autopilotMode ? "true" : "false");
  }, [autopilotMode]);

  // Persist image model changes to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("production-flow.image-model", imageModel);
  }, [imageModel]);

  // Sync trailer retry model with user's video model preference
  useEffect(() => {
    setTrailerRetryModel(videoGenModel);
  }, [videoGenModel]);

  // Sync character video model with user's video model preference from home page
  useEffect(() => {
    // Map trailer model (sora-2, veo-3.1) to character video model (openai/sora-2, google/veo-3.1)
    const modelMap: Record<string, VideoModelId> = {
      "sora-2": "openai/sora-2",
      "sora-2-pro": "openai/sora-2-pro",
      "veo-3.1": "google/veo-3.1",
    };
    const mappedModel = modelMap[videoGenModel];
    if (mappedModel) {
      setVideoModelId(mappedModel);
    }
  }, [videoGenModel]);

  const toggleStylizationGuardrails = () => {
    setStylizationGuardrails((prev) => !prev);
  };
  const selectedModelOption = useMemo(
    () => MODEL_OPTIONS.find((option) => option.id === model) ?? MODEL_OPTIONS[0],
    [model]
  );
  const [characterSeeds, setCharacterSeeds] = useState<CharacterSeed[] | null>(null);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [charactersError, setCharactersError] = useState<string | null>(null);
  const [characterDocs, setCharacterDocs] = useState<Record<string, CharacterDocument>>({});
  const [characterBuilding, setCharacterBuilding] = useState<Record<string, boolean>>({});
  const [characterBuildErrors, setCharacterBuildErrors] = useState<Record<string, string>>(
    {}
  );
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [characterPortraits, setCharacterPortraits] = useState<Record<string, string | null>>({});
  const [characterPortraitLoading, setCharacterPortraitLoading] = useState<Record<string, boolean>>({});
  const [characterPortraitLoaded, setCharacterPortraitLoaded] = useState<Record<string, boolean>>({});
  const [characterPortraitErrors, setCharacterPortraitErrors] = useState<Record<string, string>>({});
  const [editedPortraitPrompts, setEditedPortraitPrompts] = useState<Record<string, string>>({});
  const [characterVideos, setCharacterVideos] = useState<Record<string, string[]>>({});
  const [characterVideoLoading, setCharacterVideoLoading] = useState<Record<string, boolean>>({});
  const [characterVideoErrors, setCharacterVideoErrors] = useState<Record<string, string>>({});
  const [editedVideoPrompts, setEditedVideoPrompts] = useState<Record<string, string>>({});
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<Record<string, number>>({});
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [posterLoading, setPosterLoading] = useState(false);
  const [posterError, setPosterError] = useState<string | null>(null);
  const [posterAvailable, setPosterAvailable] = useState(false);
  const [editedPosterPrompt, setEditedPosterPrompt] = useState<string>("");
  const [libraryPosterUrl, setLibraryPosterUrl] = useState<string | null>(null);
  const [libraryPosterLoading, setLibraryPosterLoading] = useState(false);
  const [libraryPosterError, setLibraryPosterError] = useState<string | null>(null);
  const [editedLibraryPosterPrompt, setEditedLibraryPosterPrompt] = useState<string>("");
  const [portraitGridUrl, setPortraitGridUrl] = useState<string | null>(null);
  const [portraitGridLoading, setPortraitGridLoading] = useState(false);
  const [portraitGridError, setPortraitGridError] = useState<string | null>(null);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [trailerError, setTrailerError] = useState<string | null>(null);
  const [trailerStatus, setTrailerStatus] = useState<string | null>(null);
  const [trailerStartTime, setTrailerStartTime] = useState<number | null>(null);
  const [trailerElapsed, setTrailerElapsed] = useState<number>(0);
  const [editedTrailerPrompt, setEditedTrailerPrompt] = useState<string>("");
  const [trailerModel, setTrailerModel] = useState<string | null>(null);
  const [trailerModelPreference, setTrailerModelPreference] = useState<"sora-2" | "veo-3.1">("sora-2");
  const [trailerFindText, setTrailerFindText] = useState<string>("");
  const [trailerReplaceText, setTrailerReplaceText] = useState<string>("");
  const [trailerRetryModel, setTrailerRetryModel] = useState<"sora-2" | "sora-2-pro" | "veo-3.1">(videoGenModel);
  const [trailerRetryCount, setTrailerRetryCount] = useState<number>(0);
  const [trailerUsedLlmAdjustment, setTrailerUsedLlmAdjustment] = useState<boolean>(false);
  const [trailerLlmAdjustmentReason, setTrailerLlmAdjustmentReason] = useState<string | null>(null);
  const [trailerAdjustingPrompt, setTrailerAdjustingPrompt] = useState<boolean>(false);
  const [trailerOriginalPrompt, setTrailerOriginalPrompt] = useState<string | null>(null); // The prompt before LLM adjustment
  const [trailerAdjustedPrompt, setTrailerAdjustedPrompt] = useState<string | null>(null); // The LLM-adjusted prompt
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  
  // Episode format and loglines
  const [showFormat, setShowFormat] = useState<ShowFormat | null>(null);
  const [showFormatLoading, setShowFormatLoading] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [seasonArc, setSeasonArc] = useState<string | null>(null);
  
  const portraitJobsRef = useRef<Map<string, string>>(new Map()); // characterId -> jobId
  const portraitPollsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const portraitRetryCountRef = useRef<Map<string, number>>(new Map()); // characterId -> retry count (max 8 with LLM adjustment)
  const portraitStartTimesRef = useRef<Map<string, number>>(new Map()); // characterId -> start timestamp for timeout
  const portraitPollCountRef = useRef<Map<string, number>>(new Map()); // characterId -> poll count for stuck detection
  const portraitLlmAdjustedPromptRef = useRef<Map<string, string>>(new Map()); // characterId -> LLM-adjusted prompt
  const [portraitLlmAdjustments, setPortraitLlmAdjustments] = useState<Record<string, { used: boolean; reason?: string; adjustedPrompt?: string }>>({});
  const [portraitRetryCounts, setPortraitRetryCounts] = useState<Record<string, number>>({}); // characterId -> retry count for UI display;
  const videoJobsRef = useRef<Map<string, string>>(new Map()); // characterId -> jobId
  const videoPollsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const videoStartTimesRef = useRef<Map<string, number>>(new Map()); // characterId -> start timestamp
  const [videoModelId, setVideoModelId] = useState<VideoModelId>("google/veo-3.1"); // Default to VEO 3.1
  const [videoSeconds, setVideoSeconds] = useState<VideoDuration>(8);
  const [videoAspectRatio, setVideoAspectRatio] = useState<VideoAspectRatio>("portrait");
  const [videoResolution, setVideoResolution] = useState<VideoResolution>("standard");
  const selectedVideoModel = useMemo(
    () => VIDEO_MODEL_OPTION_MAP[videoModelId] ?? VIDEO_MODEL_OPTIONS[0],
    [videoModelId]
  );
  const trailerStatusJobIdRef = useRef<string | null>(null);
  const trailerStatusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trailerStartTimeRef = useRef<number | null>(null);
  const autoGenCheckedShowIdRef = useRef<string | null>(null);
  const autoPortraitCheckedRef = useRef<Set<string>>(new Set());
  const urlUpdatedForShowRef = useRef<string | null>(null);
  const initialShowIdLoadedRef = useRef(false);

  const stopTrailerStatusPolling = useCallback(() => {
    if (trailerStatusPollRef.current) {
      clearInterval(trailerStatusPollRef.current);
      trailerStatusPollRef.current = null;
    }
    trailerStartTimeRef.current = null;
    // Clear from localStorage when manually stopped
    try {
      localStorage.removeItem('production-flow.trailer-job');
    } catch (e) {
      // Ignore
    }
  }, []);

  const startTrailerStatusPolling = useCallback((jobId: string, showId?: string) => {
    if (trailerStatusPollRef.current) {
      clearInterval(trailerStatusPollRef.current);
      trailerStatusPollRef.current = null;
    }
    trailerStatusJobIdRef.current = jobId;
    trailerStartTimeRef.current = Date.now();
    
    // Persist to localStorage so it survives navigation
    try {
      localStorage.setItem('production-flow.trailer-job', JSON.stringify({
        jobId,
        showId: showId || currentShowId,
        startedAt: Date.now(),
      }));
    } catch (e) {
      console.warn("Failed to persist trailer job to localStorage:", e);
    }

    const poll = async () => {
      try {
        // Check for timeout (15 minutes)
        const startTime = trailerStartTimeRef.current;
        if (startTime) {
          const elapsed = Date.now() - startTime;
          const timeoutMs = 15 * 60 * 1000; // 15 minutes
          
          if (elapsed > timeoutMs) {
            console.error(`⏱️ Trailer generation timed out after ${Math.round(elapsed / 1000)}s`);
            
            setTrailerError("Trailer generation timed out. Please try again.");
            setTrailerLoading(false);
            
            // Update background task
            if (showId) {
              updateBackgroundTask(jobId, {
                status: 'failed',
                error: 'Generation timed out after 15 minutes'
              });
              setTimeout(() => removeBackgroundTask(jobId), 10000);
            }
            
            // Stop polling
            stopTrailerStatusPolling();
            return;
          }
        }
        
        const response = await fetch(
          `/api/trailer/status?jobId=${encodeURIComponent(jobId)}`,
          { cache: "no-store" }
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          status?: string | null;
          detail?: string | null;
          outputUrl?: string | null;
          model?: string | null;
        };
        console.log("📊 Trailer status poll:", data.status, "model:", data.model);
        if (typeof data.status === "string") {
          // Preserve model info in status for display purposes
          let statusWithModel = data.status;
          if (data.model) {
            const modelSuffix = data.model.includes("veo") ? "-veo" : 
                               data.model.includes("sora-2-pro") ? "-sora2pro" : "-sora2";
            // Only add suffix if not already present and status is starting/processing
            if ((data.status === "starting" || data.status === "processing") && 
                !data.status.includes("-")) {
              statusWithModel = data.status + modelSuffix;
            }
          }
          setTrailerStatus(statusWithModel);
          // Also update the trailerModel state
          if (data.model) {
            setTrailerModel(data.model);
          }
        }
        
        // If succeeded, set the trailer URL and model
        if (data.status && data.status.startsWith("succeeded")) {
          if (data.outputUrl) {
            console.log("✅ Setting trailer URL from polling:", data.outputUrl);
            setTrailerUrl(data.outputUrl);
            
            // Update background task as succeeded
            if (showId) {
              updateBackgroundTask(jobId, {
                status: 'succeeded',
                outputUrl: data.outputUrl,
              });
              setTimeout(() => removeBackgroundTask(jobId), 5000);
              
              // CRITICAL: Auto-save the trailer to database immediately
              // This ensures trailer is persisted even if user has left the page
              console.log("💾 Auto-saving trailer to database for show:", showId);
              fetch("/api/library", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: showId,
                  trailerUrl: data.outputUrl,
                  trailerModel: data.model,
                }),
              }).then(response => {
                if (response.ok) {
                  console.log("✅ Trailer auto-saved successfully");
                } else {
                  console.error("❌ Failed to auto-save trailer:", response.status);
                }
              }).catch(error => {
                console.error("❌ Error auto-saving trailer:", error);
              });
            }
          }
          if (data.model) {
            setTrailerModel(data.model);
          }
        }
        
        if (
          data.status === null ||
          data.status === "failed" ||
          (typeof data.status === "string" && data.status.startsWith("succeeded"))
        ) {
          if (data.status === "failed" && data.detail) {
            setTrailerError((prev) => prev ?? data.detail ?? null);
          }
          if (trailerStatusPollRef.current) {
            clearInterval(trailerStatusPollRef.current);
            trailerStatusPollRef.current = null;
          }
          // Clear from localStorage when complete
          try {
            localStorage.removeItem('production-flow.trailer-job');
          } catch (e) {
            // Ignore
          }
          setTrailerLoading(false);
        }
      } catch (pollError) {
        console.error("Failed to poll trailer status:", pollError);
      }
    };

    void poll();
    trailerStatusPollRef.current = setInterval(poll, 3000);
  }, [currentShowId, stopTrailerStatusPolling]);


  // Resume trailer polling on mount if there's an active job
  useEffect(() => {
    // Skip if we're already polling
    if (trailerStatusPollRef.current) return;
    
    try {
      const savedJob = localStorage.getItem('production-flow.trailer-job');
      if (!savedJob) return;
      
      const { jobId, showId, startedAt } = JSON.parse(savedJob);
      const elapsed = Date.now() - startedAt;
      
      // Job is too old, clear it
      if (elapsed >= 600000) {
        console.log("⏰ Trailer job expired (>10 min), clearing");
        localStorage.removeItem('production-flow.trailer-job');
        return;
      }
      
      // If currentShowId matches OR isn't set yet, resume polling
      const shouldResume = !currentShowId || showId === currentShowId;
      
      if (jobId && shouldResume) {
        console.log("🔄 Resuming trailer polling for job:", jobId);
        console.log(`   Show ID: ${showId}, Current: ${currentShowId || 'not set yet'}`);
        console.log(`   Elapsed time: ${Math.floor(elapsed / 1000)}s`);
        
        trailerStatusJobIdRef.current = jobId;
        setTrailerLoading(true);
        setTrailerStatus("processing");
        setTrailerStartTime(startedAt);
        setTrailerElapsed(Math.floor(elapsed / 1000));
        startTrailerStatusPolling(jobId, showId);
      }
    } catch (e) {
      console.warn("Failed to resume trailer job:", e);
    }
    
    return () => {
      // Don't stop polling on unmount - let it continue
    };
  }, [currentShowId, startTrailerStatusPolling]);

  useEffect(() => {
    if (blueprint) {
      playSuccessChime();
    }
  }, [blueprint]);

  // Update elapsed time for trailer generation
  useEffect(() => {
    if (!trailerLoading || !trailerStartTime) return;

    const interval = setInterval(() => {
      setTrailerElapsed(Date.now() - trailerStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [trailerLoading, trailerStartTime]);

  useEffect(() => {
    if (!selectedVideoModel.seconds.includes(videoSeconds)) {
      setVideoSeconds(selectedVideoModel.seconds[0]);
    }
    if (!selectedVideoModel.aspectRatios.includes(videoAspectRatio)) {
      setVideoAspectRatio(selectedVideoModel.aspectRatios[0]);
    }
    if (!selectedVideoModel.resolutions) {
      if (videoResolution !== "standard") {
        setVideoResolution("standard");
      }
    } else if (!selectedVideoModel.resolutions.includes(videoResolution)) {
      setVideoResolution(selectedVideoModel.resolutions[0]);
    }
  }, [selectedVideoModel, videoAspectRatio, videoResolution, videoSeconds]);

  const canSubmit = useMemo(
    () => input.trim().length > 0 && !isLoading,
    [input, isLoading]
  );

  const generateCharacterSeeds = useCallback(
    async (value: string, showData: ShowBlueprint, chosenModel: ModelId, specificShowId?: string) => {
      // Use specific show ID to prevent cross-contamination
      const targetShowId = specificShowId || currentShowId;
      
      setCharactersLoading(true);
      setCharactersError(null);
      
      const charSeedsTaskId = `char-seeds-${targetShowId}`;
      
      console.log(`🎭 Generating character seeds for show: ${targetShowId}`);
      
      // Track character seeds generation
      if (targetShowId) {
        addBackgroundTask({
          id: charSeedsTaskId,
          type: 'character-seeds',
          showId: targetShowId,
          status: 'starting',
          stepNumber: 2,
          metadata: {
            showTitle: showData?.show_title || "Untitled Show",
          },
        });
      }

      try {
        if (targetShowId) {
          updateBackgroundTask(charSeedsTaskId, { status: 'processing' });
        }
        
        const response = await fetch("/api/characters/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: value, show: showData, model: chosenModel }),
        });

        if (!response.ok) {
          // Check if response is HTML (error page) or JSON
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("text/html")) {
            throw new Error(`Character generation failed with server error (${response.status}). The server may be overloaded or timed out. Please try again.`);
          }
          
          const body = (await response.json().catch(() => null)) as
            | { error?: string; details?: unknown }
            | null;
          const fallback = `Failed to generate characters (${response.status}).`;
          throw new Error(body?.error ?? fallback);
        }

        // Check if successful response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error("Character generation returned unexpected response format. The server may have encountered an error.");
        }

        const result = (await response.json()) as {
          characters?: CharacterSeed[];
        };

        const seeds = result.characters ?? [];
        setCharacterSeeds(seeds);
        setCharacterDocs({});
        setCharacterBuilding({});
        setCharacterBuildErrors({});
        setActiveCharacterId(null);
        setCharacterPortraits({});
        setCharacterPortraitLoading({});
        setCharacterPortraitLoaded({});
        setCharacterPortraitErrors({});
        setCharacterVideos({});
        setCharacterVideoLoading({});
        setCharacterVideoErrors({});
        setPortraitGridUrl(null);
        setPortraitGridLoading(false);
        setPortraitGridError(null);
        portraitGridDigestRef.current = "";
        
        console.log(`✅ Character seeds generated for show: ${targetShowId}, count: ${seeds.length}`);
        
        // Mark character seeds as succeeded
        if (targetShowId) {
          updateBackgroundTask(charSeedsTaskId, {
            status: 'succeeded',
            completedAt: Date.now(),
            metadata: {
              characterCount: seeds.length,
              showTitle: showData?.show_title || "Untitled Show",
            },
          });
        }
        
        // Update show with character seeds ONLY if it's the current show
        if (targetShowId === currentShowId && blueprint) {
          setTimeout(() => void saveCurrentShow(false), 500);
        }
      } catch (err) {
        console.error(`❌ Character seeds failed for show: ${targetShowId}`, err);
        
        // Mark as failed
        if (targetShowId) {
          updateBackgroundTask(charSeedsTaskId, {
            status: 'failed',
            error: err instanceof Error ? err.message : "Unable to generate characters.",
          });
        }
        
        setCharactersError(
          err instanceof Error
            ? err.message
            : "Unable to generate characters."
        );
        setCharacterSeeds(null);
        setCharacterDocs({});
        setCharacterBuilding({});
        setCharacterBuildErrors({});
        setActiveCharacterId(null);
        setCharacterPortraits({});
        setCharacterPortraitLoading({});
        setCharacterPortraitLoaded({});
        setCharacterPortraitErrors({});
        setCharacterVideos({});
        setCharacterVideoLoading({});
        setCharacterVideoErrors({});
        setPortraitGridUrl(null);
        setPortraitGridLoading(false);
        setPortraitGridError(null);
        portraitGridDigestRef.current = "";
      } finally {
        setCharactersLoading(false);
      }
    },
    []
  );

  const buildCharacter = useCallback(
    async (seed: CharacterSeed) => {
      if (!blueprint) {
        setCharacterBuildErrors((prev) => ({
          ...prev,
          [seed.id]: "Blueprint missing for character build.",
        }));
        return;
      }

      const promptForCharacter = (lastPrompt ?? input).trim();
      if (!promptForCharacter) {
        setCharacterBuildErrors((prev) => ({
          ...prev,
          [seed.id]: "Original prompt unavailable. Regenerate the show briefing first.",
        }));
        return;
      }

      setCharacterBuilding((prev) => ({ ...prev, [seed.id]: true }));
      setCharacterBuildErrors((prev) => {
        const next = { ...prev };
        delete next[seed.id];
        return next;
      });

      try {
        const response = await fetch("/api/characters/build", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: promptForCharacter,
            show: blueprint,
            seed,
            model: activeModel,
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          const fallback = `Failed to build character (${response.status}).`;
          throw new Error(body?.error ?? fallback);
        }

        const result = (await response.json()) as {
          character?: CharacterDocument;
        };

        if (!result.character) {
          throw new Error("Build response missing character document.");
        }

        setCharacterDocs((prev) => ({
          ...prev,
          [seed.id]: result.character as CharacterDocument,
        }));
      } catch (err) {
        console.error(err);
        setCharacterBuildErrors((prev) => ({
          ...prev,
          [seed.id]:
            err instanceof Error ? err.message : "Unable to build character.",
        }));
      } finally {
        setCharacterBuilding((prev) => ({ ...prev, [seed.id]: false }));
      }
    },
    [activeModel, blueprint, input, lastPrompt]
  );

  useEffect(() => {
    if (!blueprint || !characterSeeds?.length) return;
    const seedsToBuild = characterSeeds.filter(
      (seed) => !characterDocs[seed.id] && !characterBuilding[seed.id]
    );
    if (seedsToBuild.length === 0) return;
    seedsToBuild.forEach((seed) => {
      void buildCharacter(seed);
    });
  }, [blueprint, characterSeeds, characterDocs, characterBuilding, buildCharacter]);

  const generateCharacterPortrait = useCallback(
    async (characterId: string, customPrompt?: string) => {
      console.log(`🎯 generateCharacterPortrait called for: ${characterId}`);
      
      // CRITICAL: Capture show ID immediately to prevent cross-contamination
      const targetShowId = currentShowId;
      
      console.log(`   Blueprint exists: ${!!blueprint}, ShowId: ${targetShowId}`);
      
      // GUARD: Skip if already loading (prevent double-clicks)
      if (characterPortraitLoading[characterId]) {
        console.log(`   ⏭️ Portrait already loading for ${characterId}, skipping duplicate request`);
        return;
      }
      
      // FORCE CLEANUP: Always clear any potentially stuck state first
      // This ensures the restart works even for stuck/orphaned portraits
      const existingPoll = portraitPollsRef.current.get(characterId);
      if (existingPoll) {
        console.log(`   🧹 Force-clearing existing poll interval for ${characterId}`);
        clearInterval(existingPoll);
        portraitPollsRef.current.delete(characterId);
      }
      
      const existingJob = portraitJobsRef.current.get(characterId);
      if (existingJob) {
        console.log(`   🧹 Force-clearing existing job ref ${existingJob} for ${characterId}`);
        // Mark background task as canceled
        if (targetShowId) {
          updateBackgroundTask(existingJob, { status: 'canceled', error: 'Manually restarted' });
          setTimeout(() => removeBackgroundTask(existingJob), 3000);
        }
        portraitJobsRef.current.delete(characterId);
      }
      
      // Clear other refs
      portraitStartTimesRef.current.delete(characterId);
      portraitRetryCountRef.current.delete(characterId);
      portraitPollCountRef.current.delete(characterId);
      // Clear UI state
      setPortraitRetryCounts(prev => { const n = { ...prev }; delete n[characterId]; return n; });
      setPortraitLlmAdjustments(prev => { const n = { ...prev }; delete n[characterId]; return n; });
      
      // Force clear loading state - this is the key for stuck portraits
      setCharacterPortraitLoading((prev) => ({ ...prev, [characterId]: false }));
      
      if (!blueprint) {
        console.log(`   ❌ No blueprint - returning early`);
        setCharacterPortraitErrors((prev) => ({
          ...prev,
          [characterId]: "Blueprint missing for portrait generation.",
        }));
        return;
      }

      const doc = characterDocs[characterId];
      console.log(`   Doc exists for ${characterId}: ${!!doc}`);
      
      if (!doc) {
        console.log(`   ❌ No doc - returning early`);
        setCharacterPortraitErrors((prev) => ({
          ...prev,
          [characterId]: "Build the character dossier first.",
        }));
        return;
      }
      
      console.log(`   ✅ Proceeding with portrait generation for ${characterId}`);

      // Also check for existing background tasks that might be orphaned and cancel them
      if (targetShowId) {
        const existingTasks = getShowTasks(targetShowId);
        const existingPortraitTasks = existingTasks.filter(
          t => t.type === 'portrait' && t.characterId === characterId && (t.status === 'starting' || t.status === 'processing')
        );
        
        existingPortraitTasks.forEach(task => {
          console.log(`🔄 Canceling orphaned background task ${task.id} for ${characterId}`);
          updateBackgroundTask(task.id, { status: 'canceled', error: 'Replaced by new generation' });
          setTimeout(() => removeBackgroundTask(task.id), 3000);
        });
      }

      // Generate NEW job ID
      const jobId = typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `portrait-${characterId}-${Date.now()}`;
      
      // Store job ID for this character
      portraitJobsRef.current.set(characterId, jobId);
      
      // Reset retry count for fresh generation
      portraitRetryCountRef.current.delete(characterId);
      setPortraitRetryCounts(prev => { const n = { ...prev }; delete n[characterId]; return n; });
      setPortraitLlmAdjustments(prev => { const n = { ...prev }; delete n[characterId]; return n; });
      
      // Track start time for timeout detection
      portraitStartTimesRef.current.set(characterId, Date.now());
      
      console.log(`🎨 Generating portrait for ${characterId} in show: ${targetShowId}`);
      
      // Create background task to track this generation
      if (targetShowId) {
        const characterName = characterSeeds?.find(s => s.id === characterId)?.name;
        addBackgroundTask({
          id: jobId,
          type: 'portrait',
          showId: targetShowId,
          characterId,
          status: 'starting',
          stepNumber: 4,
          metadata: {
            characterName: characterName || characterId,
            showTitle: blueprint?.show_title || "Untitled Show",
          },
        });
        console.log(`📝 Created background task for portrait: ${characterName || characterId} in show ${targetShowId} (job: ${jobId})`);
      }

      setCharacterPortraitLoading((prev) => ({ ...prev, [characterId]: true }));
      setCharacterPortraitErrors((prev) => {
        const next = { ...prev };
        delete next[characterId];
        return next;
      });

      // Start polling for this portrait
      const startPolling = (replicateJobId: string) => {
        const PORTRAIT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes max
        const MAX_POLL_COUNT = 60; // Max 60 polls (3 minutes at 3s intervals) before assuming stuck
        const MAX_PROCESSING_POLLS = 40; // If stuck in "processing" for 40 polls, assume failed
        
        // Reset poll count for new job
        portraitPollCountRef.current.set(characterId, 0);
        
        const pollInterval = setInterval(async () => {
          try {
            // Increment poll count
            const pollCount = (portraitPollCountRef.current.get(characterId) || 0) + 1;
            portraitPollCountRef.current.set(characterId, pollCount);
            
            // CRITICAL: Check if this job is still the active one for this character
            // If user clicked "restart render", a new job may have replaced this one
            const currentJobId = portraitJobsRef.current.get(characterId);
            if (currentJobId !== replicateJobId) {
              console.log(`🛑 Portrait poll for ${characterId} skipped - job ${replicateJobId.slice(0, 8)} replaced by ${currentJobId?.slice(0, 8) || 'none'}`);
              // Stop this orphaned polling loop
              const interval = portraitPollsRef.current.get(characterId);
              if (interval === pollInterval) {
                clearInterval(pollInterval);
                portraitPollsRef.current.delete(characterId);
              } else {
                clearInterval(pollInterval); // Clear this specific interval anyway
              }
              portraitPollCountRef.current.delete(characterId);
              return;
            }
            
            // Check for max poll count (stuck detection) - trigger retry with LLM adjustment
            if (pollCount >= MAX_POLL_COUNT) {
              const currentRetryCount = portraitRetryCountRef.current.get(characterId) || 0;
              const MAX_RETRIES = 8;
              const LLM_ADJUSTMENT_THRESHOLD = 2;
              
              console.warn(`🔄 Portrait ${characterId} stuck (poll ${pollCount}), retry ${currentRetryCount + 1}/${MAX_RETRIES}`);
              
              // Stop current polling
              const interval = portraitPollsRef.current.get(characterId);
              if (interval) {
                clearInterval(interval);
                portraitPollsRef.current.delete(characterId);
              }
              portraitJobsRef.current.delete(characterId);
              portraitPollCountRef.current.delete(characterId);
              
              // If we can retry, do so with LLM adjustment
              if (currentRetryCount < MAX_RETRIES) {
                const retryNumber = currentRetryCount + 1;
                portraitRetryCountRef.current.set(characterId, retryNumber);
                setPortraitRetryCounts(prev => ({ ...prev, [characterId]: retryNumber }));
                
                console.log(`🔄 Retrying stuck portrait (attempt ${retryNumber + 1}) for ${characterId}`);
                
                // Retry after delay with LLM adjustment if threshold met
                const needsLlmAdjustment = retryNumber >= LLM_ADJUSTMENT_THRESHOLD && !portraitLlmAdjustedPromptRef.current.has(characterId);
                const retryDelay = needsLlmAdjustment ? 3000 : 1500;
                
                setTimeout(async () => {
                  try {
                    // LLM prompt adjustment for stuck retries
                    let promptToUse = customPrompt || portraitLlmAdjustedPromptRef.current.get(characterId) || undefined;
                    
                    if (retryNumber >= LLM_ADJUSTMENT_THRESHOLD && !portraitLlmAdjustedPromptRef.current.has(characterId)) {
                      console.log(`🤖 Requesting LLM prompt adjustment for stuck portrait ${characterId}`);
                      
                      try {
                        const seed = characterSeeds?.find(s => s.id === characterId);
                        // Build a proper prompt with character details for LLM to adjust
                        const charName = seed?.name || (doc?.metadata as Record<string, unknown>)?.name as string || characterId;
                        const charRole = seed?.role || doc?.metadata?.role || 'character';
                        const charSummary = seed?.summary || doc?.metadata?.function || '';
                        const charVibe = seed?.vibe || '';
                        const appearance = doc?.look?.silhouette || doc?.look?.surface?.materials || '';
                        const expression = doc?.performance?.expression_set?.[0] || 'neutral';
                        const pose = doc?.performance?.pose_defaults || 'natural pose';
                        
                        // Build a meaningful prompt that includes character details
                        const detailedPrompt = [
                          `Create a high-quality character portrait for a TV show.`,
                          ``,
                          `CHARACTER: ${charName}`,
                          `ROLE: ${charRole}`,
                          charSummary ? `DESCRIPTION: ${charSummary}` : '',
                          charVibe ? `VIBE: ${charVibe}` : '',
                          appearance ? `APPEARANCE: ${appearance}` : '',
                          `EXPRESSION: ${expression}`,
                          `POSE: ${pose}`,
                          ``,
                          `Style: ${blueprint?.production_style?.medium || 'Cinematic'}`,
                          `Genre: ${(blueprint as Record<string, unknown>)?.genre as string || 'drama'}`,
                          ``,
                          `Create a professional, cinematic portrait with theatrical lighting and expressive posture.`,
                        ].filter(Boolean).join('\n');
                        
                        const adjustResponse = await fetch("/api/adjust-prompt", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            originalPrompt: customPrompt || detailedPrompt,
                            generationType: "portrait",
                            errorMessage: "Generation timed out/stuck - may need simpler or clearer prompt",
                            attemptNumber: retryNumber + 1,
                          }),
                        });
                        
                        if (adjustResponse.ok) {
                          const adjustResult = await adjustResponse.json() as {
                            success: boolean;
                            adjustedPrompt?: string;
                            adjustmentReason?: string;
                          };
                          
                          if (adjustResult.success && adjustResult.adjustedPrompt) {
                            promptToUse = adjustResult.adjustedPrompt;
                            portraitLlmAdjustedPromptRef.current.set(characterId, adjustResult.adjustedPrompt);
                            console.log(`✅ LLM adjusted prompt for stuck portrait ${characterId}`);
                            
                            setPortraitLlmAdjustments(prev => ({
                              ...prev,
                              [characterId]: { 
                                used: true, 
                                reason: adjustResult.adjustmentReason,
                                adjustedPrompt: adjustResult.adjustedPrompt 
                              }
                            }));
                          }
                        }
                      } catch (adjustError) {
                        console.error(`⚠️ LLM adjustment failed for stuck portrait:`, adjustError);
                      }
                    }
                    
                    // Retry the generation
                    const retryResponse = await fetch("/api/characters/portrait", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        show: blueprint,
                        character: doc,
                        customPrompt: promptToUse,
                        imageModel,
                      }),
                    });
                    
                    if (retryResponse.ok) {
                      const retryResult = await retryResponse.json() as { jobId?: string };
                      if (retryResult.jobId) {
                        console.log(`✅ Retry started for stuck portrait: ${retryResult.jobId}`);
                        portraitJobsRef.current.set(characterId, retryResult.jobId);
                        portraitStartTimesRef.current.set(characterId, Date.now());
                        startPolling(retryResult.jobId);
                      }
                    } else {
                      throw new Error(`Retry failed: ${retryResponse.status}`);
                    }
                  } catch (retryError) {
                    console.error(`❌ Retry failed for stuck portrait:`, retryError);
                    setCharacterPortraitErrors((prev) => ({
                      ...prev,
                      [characterId]: `Portrait failed after ${retryNumber + 1} attempts (stuck/timeout).`,
                    }));
                    setCharacterPortraitLoading((prev) => ({ ...prev, [characterId]: false }));
                    portraitRetryCountRef.current.delete(characterId);
                    portraitLlmAdjustedPromptRef.current.delete(characterId);
                  }
                }, retryDelay);
                
                return; // Don't mark as failed yet
              }
              
              // All retries exhausted
              const usedLlm = portraitLlmAdjustedPromptRef.current.has(characterId);
              setCharacterPortraitErrors((prev) => ({
                ...prev,
                [characterId]: `Portrait generation failed after ${currentRetryCount + 1} attempts (stuck/timeout).${usedLlm ? ' AI-adjusted prompt was used.' : ''}`,
              }));
              setCharacterPortraitLoading((prev) => ({ ...prev, [characterId]: false }));
              
              if (currentShowId) {
                updateBackgroundTask(replicateJobId, { 
                  status: 'failed', 
                  error: `Exceeded max retries - job stuck after ${currentRetryCount + 1} attempts` 
                });
                setTimeout(() => removeBackgroundTask(replicateJobId), 10000);
              }
              
              portraitStartTimesRef.current.delete(characterId);
              portraitRetryCountRef.current.delete(characterId);
              portraitLlmAdjustedPromptRef.current.delete(characterId);
              return;
            }
            
            // Check for timeout
            const startTime = portraitStartTimesRef.current.get(characterId);
            if (startTime && Date.now() - startTime > PORTRAIT_TIMEOUT_MS) {
              console.error(`⏰ Portrait ${characterId} timed out after 5 minutes`);
              
              // Set error and stop polling
              setCharacterPortraitErrors((prev) => ({
                ...prev,
                [characterId]: "Portrait generation timed out after 5 minutes. Please try again.",
              }));
              setCharacterPortraitLoading((prev) => ({ ...prev, [characterId]: false }));
              
              // Update background task
              if (currentShowId) {
                updateBackgroundTask(replicateJobId, { 
                  status: 'failed', 
                  error: "Timed out after 5 minutes" 
                });
                setTimeout(() => removeBackgroundTask(replicateJobId), 10000);
              }
              
              // Stop polling and clean up
              const interval = portraitPollsRef.current.get(characterId);
              if (interval) {
                clearInterval(interval);
                portraitPollsRef.current.delete(characterId);
              }
              portraitJobsRef.current.delete(characterId);
              portraitStartTimesRef.current.delete(characterId);
              portraitRetryCountRef.current.delete(characterId);
              portraitPollCountRef.current.delete(characterId);
              return;
            }
            
            const response = await fetch(
              `/api/characters/portrait/status?jobId=${encodeURIComponent(replicateJobId)}`,
              { cache: "no-store" }
            );
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string; detail?: string };
              const errorMessage = errorData.detail || errorData.error || `HTTP ${response.status}`;
              console.error(`❌ Failed to poll portrait status for ${characterId}:`, errorMessage);
              
              // Set error and stop polling
              setCharacterPortraitErrors((prev) => ({
                ...prev,
                [characterId]: `Failed to check portrait status: ${errorMessage}`,
              }));
              setCharacterPortraitLoading((prev) => ({ ...prev, [characterId]: false }));
              
              // Update background task
              if (currentShowId) {
                updateBackgroundTask(replicateJobId, { 
                  status: 'failed', 
                  error: `Status check failed: ${errorMessage}` 
                });
                setTimeout(() => removeBackgroundTask(replicateJobId), 10000);
              }
              
              // Stop polling
              const interval = portraitPollsRef.current.get(characterId);
              if (interval) {
                clearInterval(interval);
                portraitPollsRef.current.delete(characterId);
              }
              portraitJobsRef.current.delete(characterId);
              return;
            }
            
            const data = (await response.json()) as {
              status: string | null;
              detail?: string;
              outputUrl?: string;
              isTransient?: boolean;
            };
            
            // Skip transient errors and wait for next poll
            if (data.isTransient) {
              console.warn(`⚠️ Portrait ${characterId} transient error, waiting for next poll...`);
              return;
            }
            
            console.log(`📊 Portrait ${characterId} status:`, data.status);
            
            if (data.status === "succeeded" && data.outputUrl) {
              console.log(`✅ Portrait ${characterId} completed:`, data.outputUrl.slice(0, 60) + "...");
              console.log(`🔧 Setting state: portraits[${characterId}] = URL, loading = false, loaded = false (waiting for image onLoad)`);
              
              setCharacterPortraits((prev) => {
                console.log(`📝 Portrait state update for ${characterId}:`, { 
                  prevCount: Object.keys(prev).length,
                  newUrl: data.outputUrl?.slice(0, 40) + '...' 
                });
                return {
                  ...prev,
                  [characterId]: data.outputUrl ?? null,
                };
              });
              setCharacterPortraitLoaded((prev) => ({
                ...prev,
                [characterId]: false, // Will be set to true when Image.onLoad fires
              }));
              
              // Clear loading state IMMEDIATELY
              setCharacterPortraitLoading((prev) => {
                console.log(`📝 Loading state update for ${characterId}: false`);
                return { ...prev, [characterId]: false };
              });
              
              // Update background task
              if (currentShowId) {
                updateBackgroundTask(replicateJobId, { 
                  status: 'succeeded', 
                  outputUrl: data.outputUrl 
                });
                setTimeout(() => removeBackgroundTask(replicateJobId), 5000);
              }
              
              // Stop polling
              const interval = portraitPollsRef.current.get(characterId);
              if (interval) {
                clearInterval(interval);
                portraitPollsRef.current.delete(characterId);
              }
              portraitJobsRef.current.delete(characterId);
              portraitStartTimesRef.current.delete(characterId);
              portraitRetryCountRef.current.delete(characterId);
              portraitLlmAdjustedPromptRef.current.delete(characterId);
              // Clear UI state on success (but keep LLM adjustment info briefly so user knows it worked)
              setPortraitRetryCounts(prev => { const n = { ...prev }; delete n[characterId]; return n; });
              // Note: Keep portraitLlmAdjustments briefly visible on success
              
              // Play success sound
              playSuccessChime();
              
              // Portrait completed! 
              // Note: Library poster will auto-generate when portrait grid is ready (see useEffect below)
              console.log("✅ Portrait completed for:", characterId);
              
              // Check if ALL characters now have portraits
              const allPortraitsComplete = characterSeeds?.every(seed => 
                characterPortraits[seed.id] || seed.id === characterId
              ) ?? false;
              
              if (allPortraitsComplete) {
                console.log("🎉 All portraits complete! Portrait grid will auto-generate, then poster will follow.");
              } else {
                const completedCount = characterSeeds?.filter(seed => 
                  characterPortraits[seed.id] || seed.id === characterId
                ).length || 0;
                console.log(`⏳ ${completedCount}/${characterSeeds?.length || 0} portraits complete`);
              }
            } else if (data.status === "failed" || data.status === null) {
              let errorMessage = data.detail || "Failed to generate portrait.";
              
              // Check if this is a transient network error - if so, just skip this poll and wait for next one
              const isNetworkError = errorMessage.includes("fetch failed") || 
                                     errorMessage.includes("network") || 
                                     errorMessage.includes("ECONNREFUSED") ||
                                     errorMessage.includes("timeout");
              
              if (isNetworkError && data.status === null) {
                console.warn(`⚠️ Portrait ${characterId} network error (will retry on next poll):`, errorMessage);
                // Don't treat as failure - just skip this poll and let the next one try
                return;
              }
              
              console.error(`❌ Portrait ${characterId} failed:`, data.detail);
              
              const isContentFilterError = errorMessage.includes("E005") || errorMessage.includes("flagged as sensitive") || errorMessage.includes("content filter");
              const isRateLimitError = errorMessage.includes("429") || errorMessage.includes("rate limit") || errorMessage.includes("too many requests");
              const isStuckError = errorMessage.includes("stuck") || errorMessage.includes("silently");
              // ALL errors are now retryable (we'll use LLM adjustment to fix prompt issues)
              const isRetryableError = true;
              
              // Check if we should retry
              const currentRetryCount = portraitRetryCountRef.current.get(characterId) || 0;
              const MAX_RETRIES = 8; // Extended from 4 to allow for LLM-adjusted retries
              const LLM_ADJUSTMENT_THRESHOLD = 2; // Start LLM adjustment at retry 2 (lowered for faster response)
              
              if (isRetryableError && currentRetryCount < MAX_RETRIES) {
                // Retry the generation
                const retryNumber = currentRetryCount + 1;
                portraitRetryCountRef.current.set(characterId, retryNumber);
                // Update state for UI display
                setPortraitRetryCounts(prev => ({ ...prev, [characterId]: retryNumber }));
                const errorType = isRateLimitError ? "Rate limit" : isContentFilterError ? "Content filter" : isStuckError ? "Stuck/timeout" : "Generation error";
                console.log(`🔄 ${errorType} - retrying portrait (attempt ${retryNumber + 1}/${MAX_RETRIES + 1}) for ${characterId}`);
                
                // Stop current polling
                const interval = portraitPollsRef.current.get(characterId);
                if (interval) {
                  clearInterval(interval);
                  portraitPollsRef.current.delete(characterId);
                }
                portraitJobsRef.current.delete(characterId);
                
                // Update background task to show retry
                if (currentShowId) {
                  updateBackgroundTask(replicateJobId, { 
                    status: 'processing', 
                    metadata: { retryAttempt: retryNumber, usesLlmAdjustment: retryNumber >= LLM_ADJUSTMENT_THRESHOLD }
                  });
                }
                
                // Retry after delay (longer for rate limits, even longer if we need LLM adjustment)
                // LLM adjustment now triggers for ANY error after threshold, not just content filter
                const needsLlmAdjustment = retryNumber >= LLM_ADJUSTMENT_THRESHOLD && !portraitLlmAdjustedPromptRef.current.has(characterId);
                const retryDelay = isRateLimitError ? 3000 + (retryNumber * 2000) : (needsLlmAdjustment ? 3000 : 1500);
                console.log(`⏳ Waiting ${retryDelay}ms before retry${needsLlmAdjustment ? ' (with LLM adjustment)' : ''}...`);
                
                // Capture the job ID at the time of scheduling the retry
                const retryFromJobId = replicateJobId;
                
                setTimeout(async () => {
                  try {
                    // CRITICAL: Check if this retry is still relevant
                    // User may have clicked "restart render" since we scheduled this
                    const currentJobId = portraitJobsRef.current.get(characterId);
                    if (currentJobId && currentJobId !== retryFromJobId) {
                      console.log(`🛑 Retry for ${characterId} cancelled - job replaced by ${currentJobId.slice(0, 8)}`);
                      return; // Abort this retry, a new generation was started
                    }
                    
                    // LLM prompt adjustment for ANY error at retry 2+
                    let promptToUse = customPrompt || portraitLlmAdjustedPromptRef.current.get(characterId) || undefined;
                    
                    // Trigger LLM adjustment for any error after threshold (not just content filter)
                    if (retryNumber >= LLM_ADJUSTMENT_THRESHOLD && !portraitLlmAdjustedPromptRef.current.has(characterId)) {
                      console.log(`🤖 Requesting LLM prompt adjustment for ${characterId} (attempt ${retryNumber + 1})`);
                      
                      try {
                        // Build a proper prompt with character details for LLM to adjust
                        const seed = characterSeeds?.find(s => s.id === characterId);
                        const charName = seed?.name || (doc?.metadata as Record<string, unknown>)?.name as string || characterId;
                        const charRole = seed?.role || doc?.metadata?.role || 'character';
                        const charSummary = seed?.summary || doc?.metadata?.function || '';
                        const charVibe = seed?.vibe || '';
                        const appearance = doc?.look?.silhouette || doc?.look?.surface?.materials || '';
                        const expression = doc?.performance?.expression_set?.[0] || 'neutral';
                        const pose = doc?.performance?.pose_defaults || 'natural pose';
                        
                        // Build a meaningful prompt that includes character details
                        const detailedPrompt = [
                          `Create a high-quality character portrait for a TV show.`,
                          ``,
                          `CHARACTER: ${charName}`,
                          `ROLE: ${charRole}`,
                          charSummary ? `DESCRIPTION: ${charSummary}` : '',
                          charVibe ? `VIBE: ${charVibe}` : '',
                          appearance ? `APPEARANCE: ${appearance}` : '',
                          `EXPRESSION: ${expression}`,
                          `POSE: ${pose}`,
                          ``,
                          `Style: ${blueprint?.production_style?.medium || 'Cinematic'}`,
                          `Genre: ${(blueprint as Record<string, unknown>)?.genre as string || 'drama'}`,
                          ``,
                          `Create a professional, cinematic portrait with theatrical lighting and expressive posture.`,
                        ].filter(Boolean).join('\n');
                        
                        const adjustResponse = await fetch("/api/adjust-prompt", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            originalPrompt: customPrompt || detailedPrompt,
                            generationType: "portrait",
                            errorMessage: errorMessage,
                            attemptNumber: retryNumber + 1,
                          }),
                        });
                        
                        if (adjustResponse.ok) {
                          const adjustResult = await adjustResponse.json() as {
                            success: boolean;
                            adjustedPrompt?: string;
                            adjustmentReason?: string;
                          };
                          
                          if (adjustResult.success && adjustResult.adjustedPrompt) {
                            promptToUse = adjustResult.adjustedPrompt;
                            portraitLlmAdjustedPromptRef.current.set(characterId, adjustResult.adjustedPrompt);
                            console.log(`✅ LLM adjusted portrait prompt for ${characterId}`);
                            
                            // Track LLM adjustment usage and store the adjusted prompt
                            setPortraitLlmAdjustments(prev => ({
                              ...prev,
                              [characterId]: { 
                                used: true, 
                                reason: adjustResult.adjustmentReason,
                                adjustedPrompt: adjustResult.adjustedPrompt 
                              }
                            }));
                          }
                        }
                      } catch (adjustError) {
                        console.error(`⚠️ LLM adjustment failed for portrait:`, adjustError);
                        // Continue with original prompt
                      }
                    }
                    
                    console.log(`🎨 Retrying portrait for ${characterId} (attempt ${retryNumber + 1})${promptToUse ? ' with adjusted prompt' : ''}`);
                    
                    const retryResponse = await fetch("/api/characters/portrait", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        show: blueprint,
                        character: doc,
                        customPrompt: promptToUse,
                        imageModel,
                      }),
                    });
                    
                    if (!retryResponse.ok) {
                      throw new Error(`Retry failed: ${retryResponse.status}`);
                    }
                    
                    const retryResult = await retryResponse.json() as { jobId?: string };
                    if (retryResult.jobId) {
                      console.log(`✅ Retry started with new job ID: ${retryResult.jobId}`);
                      portraitJobsRef.current.set(characterId, retryResult.jobId);
                      // Reset start time for the new attempt
                      portraitStartTimesRef.current.set(characterId, Date.now());
                      startPolling(retryResult.jobId);
                    } else {
                      throw new Error("No job ID returned from retry");
                    }
                  } catch (retryError) {
                    console.error(`❌ Retry ${retryNumber} failed:`, retryError);
                    const usedLlm = portraitLlmAdjustedPromptRef.current.has(characterId);
                    const retryErrorMsg = isRateLimitError 
                      ? `Portrait generation failed after ${retryNumber + 1} attempts due to rate limiting. Please wait a moment and try again.`
                      : `Portrait generation failed after ${retryNumber + 1} attempts. Content was flagged by filters.${usedLlm ? ' (AI-adjusted prompt was used)' : ''}`;
                    setCharacterPortraitErrors((prev) => ({
                      ...prev,
                      [characterId]: retryErrorMsg,
                    }));
                    setCharacterPortraitLoading((prev) => ({ ...prev, [characterId]: false }));
                    portraitRetryCountRef.current.delete(characterId);
                    portraitStartTimesRef.current.delete(characterId);
                    portraitLlmAdjustedPromptRef.current.delete(characterId);
                  }
                }, retryDelay);
                
                return; // Don't set error state yet, we're retrying
              }
              
              // All retries exhausted or non-retryable error
              const usedLlmAdjustment = portraitLlmAdjustedPromptRef.current.has(characterId);
              if (isContentFilterError) {
                errorMessage = `Portrait was flagged by content filters after ${currentRetryCount + 1} attempts${usedLlmAdjustment ? ' (including AI-adjusted prompt)' : ''}. Try editing the character description or regenerating with a custom prompt.`;
              } else if (isRateLimitError) {
                errorMessage = `Portrait generation rate limited after ${currentRetryCount + 1} attempts. Please wait a few minutes and try again.`;
              }
              
              // Clean up LLM adjustment ref
              portraitLlmAdjustedPromptRef.current.delete(characterId);
              
              // Clear retry count on final failure
              portraitRetryCountRef.current.delete(characterId);
              
              setCharacterPortraitErrors((prev) => ({
                ...prev,
                [characterId]: errorMessage,
              }));
              setCharacterPortraitLoading((prev) => ({ ...prev, [characterId]: false }));
              
              // Update background task
              if (currentShowId) {
                updateBackgroundTask(replicateJobId, { 
                  status: 'failed', 
                  error: errorMessage 
                });
                setTimeout(() => removeBackgroundTask(replicateJobId), 10000);
              }
              
              // Stop polling
              const interval = portraitPollsRef.current.get(characterId);
              if (interval) {
                clearInterval(interval);
                portraitPollsRef.current.delete(characterId);
              }
              portraitJobsRef.current.delete(characterId);
              portraitStartTimesRef.current.delete(characterId);
            }
          } catch (pollError) {
            console.error(`Failed to poll portrait status for ${characterId}:`, pollError);
          }
        }, 3000);
        
        portraitPollsRef.current.set(characterId, pollInterval);
      };

      try {
        const characterWithPrompt = customPrompt ? {
          ...doc,
          _customPortraitPrompt: customPrompt,
        } : doc;

        const response = await fetch("/api/characters/portrait", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            show: blueprint,
            character: characterWithPrompt,
            customPrompt: customPrompt || undefined,
            jobId,
            imageModel, // Pass selected image model
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          const fallback = `Failed to start portrait generation (${response.status}).`;
          throw new Error(body?.error ?? fallback);
        }

        const result = (await response.json()) as { jobId?: string; status?: string };
        if (!result.jobId) {
          throw new Error("Portrait API did not return job ID.");
        }
        
        // CRITICAL: Update the jobId to use the ACTUAL prediction ID from Replicate
        const actualJobId = result.jobId;
        portraitJobsRef.current.set(characterId, actualJobId);  // Update stored job ID
        
        console.log(`🚀 Portrait generation started for ${characterId}`);
        console.log(`   Original UUID: ${jobId}`);
        console.log(`   Actual Replicate prediction ID: ${actualJobId}`);
        
        // Update background task with actual job ID
        if (targetShowId) {
          updateBackgroundTask(jobId, { id: actualJobId });
        }
        
        // Start polling for status using the ACTUAL job ID
        startPolling(actualJobId);
      } catch (err) {
        console.error("Portrait API call error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to start portrait generation.";
        
        setCharacterPortraitErrors((prev) => ({
          ...prev,
          [characterId]: errorMessage,
        }));
        setCharacterPortraitLoading((prev) => ({ ...prev, [characterId]: false }));
        
        // Update background task as failed
        if (currentShowId) {
          updateBackgroundTask(jobId, { 
            status: 'failed', 
            error: errorMessage 
          });
          setTimeout(() => removeBackgroundTask(jobId), 10000);
        }
        
        // Clean up
        portraitJobsRef.current.delete(characterId);
      }
    },
    [blueprint, characterDocs, characterPortraits, characterPortraitLoading, libraryPosterUrl, currentShowId, characterSeeds, imageModel]
  );

  const handlePortraitLoaded = useCallback((characterId: string) => {
    console.log(`✅ Portrait image loaded/rendered for ${characterId}, setting portraitLoaded = true`);
    setCharacterPortraitLoaded((prev) => ({
      ...prev,
      [characterId]: true,
    }));
  }, []);

  // Auto-generate portraits for built characters (only when creating new show, not loading from library)
  useEffect(() => {
    if (!autopilotMode) return; // Only auto-generate when autopilot is ON
    if (!blueprint) return;
    if (!posterAvailable) return;
    if (!characterSeeds?.length) return;
    if (isLoadingShow) return; // Don't auto-generate when loading from library
    
    characterSeeds.forEach((seed) => {
      if (!characterDocs[seed.id]) return; // Need dossier first
      if (characterPortraits[seed.id]) return; // Already has portrait
      if (characterPortraitLoading[seed.id]) return; // Currently generating
      if (characterPortraitErrors[seed.id]) return; // Don't auto-retry errors
      
      // Check if we've already triggered auto-gen for this character
      const checkKey = `${currentShowId}-${seed.id}`;
      if (autoPortraitCheckedRef.current.has(checkKey)) {
        return; // Already auto-generated for this character in this show
      }
      
      console.log(`🎨 Auto-generating portrait for: ${seed.name}`);
      autoPortraitCheckedRef.current.add(checkKey);
      void generateCharacterPortrait(seed.id);
    });
  }, [
    autopilotMode,
    blueprint,
    posterAvailable,
    characterSeeds,
    characterDocs,
    characterPortraits,
    characterPortraitLoading,
    characterPortraitErrors,
    generateCharacterPortrait,
    isLoadingShow,
    currentShowId,
  ]);

  const generateCharacterVideo = useCallback(
    async (characterId: string, customPrompt?: string) => {
      // CRITICAL: Capture show ID immediately to prevent cross-contamination
      const targetShowId = currentShowId;
      
      // GUARD: Skip if already loading (prevent double-clicks)
      if (characterVideoLoading[characterId]) {
        console.log(`⏭️ Video already loading for ${characterId}, skipping duplicate request`);
        return;
      }
      
      if (!posterAvailable) {
        setCharacterVideoErrors((prev) => ({
          ...prev,
          [characterId]:
            "Video generation requires a Replicate API token. Add one in the server environment.",
        }));
        return;
      }

      if (!blueprint) {
        setCharacterVideoErrors((prev) => ({
          ...prev,
          [characterId]: "Blueprint missing for video generation.",
        }));
        return;
      }

      const doc = characterDocs[characterId];
      if (!doc) {
        setCharacterVideoErrors((prev) => ({
          ...prev,
          [characterId]: "Build the character dossier first.",
        }));
        return;
      }

      const portraitUrl = characterPortraits[characterId];
      if (!portraitUrl) {
        setCharacterVideoErrors((prev) => ({
          ...prev,
          [characterId]: "Render a portrait before generating video.",
        }));
        return;
      }

      const promptToUse = customPrompt || doc.showcase_scene_prompt;
      
      if (!promptToUse) {
        setCharacterVideoErrors((prev) => ({
          ...prev,
          [characterId]: "Character dossier missing showcase scene prompt.",
        }));
        return;
      }

      // Check if there's an existing job for this character
      const existingJobId = videoJobsRef.current.get(characterId);
      if (existingJobId) {
        console.log(`⏸️ Video for ${characterId} already has active job ${existingJobId}, skipping duplicate call`);
        return;
      }

      // Check for existing background task
      if (targetShowId) {
        const existingTasks = getShowTasks(targetShowId);
        const existingVideoTask = existingTasks.find(
          t => t.type === 'video' && t.characterId === characterId && (t.status === 'starting' || t.status === 'processing')
        );
        
        if (existingVideoTask) {
          console.log(`⏸️ Video for ${characterId} already generating (task ${existingVideoTask.id}), will not create new job`);
          return;
        }
      }

      // Generate NEW job ID
      const jobId = typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `video-${characterId}-${Date.now()}`;
      
      // Store job ID
      videoJobsRef.current.set(characterId, jobId);
      
      console.log(`🎥 Generating video for ${characterId} in show: ${targetShowId}`);
      
      // Track start time for timeout
      videoStartTimesRef.current.set(characterId, Date.now());
      
      // Create background task
      if (targetShowId) {
        const characterName = characterSeeds?.find(s => s.id === characterId)?.name;
        addBackgroundTask({
          id: jobId,
          type: 'video',
          showId: targetShowId,
          characterId,
          status: 'starting',
          stepNumber: 5,
          metadata: {
            characterName: characterName || characterId,
            showTitle: blueprint?.show_title || "Untitled Show",
          },
        });
        console.log(`📝 Created background task for video: ${characterName || characterId} in show ${targetShowId} (job: ${jobId})`);
      }

      setCharacterVideoLoading((prev) => ({ ...prev, [characterId]: true }));
      setCharacterVideoErrors((prev) => {
        const next = { ...prev };
        delete next[characterId];
        return next;
      });

      // Start polling
      const startPolling = (replicateJobId: string) => {
        const pollInterval = setInterval(async () => {
          try {
            // Check for timeout (15 minutes)
            const startTime = videoStartTimesRef.current.get(characterId);
            if (startTime) {
              const elapsed = Date.now() - startTime;
              const timeoutMs = 15 * 60 * 1000; // 15 minutes
              
              if (elapsed > timeoutMs) {
                console.error(`⏱️ Video generation timed out for ${characterId} after ${Math.round(elapsed / 1000)}s`);
                
                setCharacterVideoErrors((prev) => ({
                  ...prev,
                  [characterId]: "Video generation timed out. Please try again.",
                }));
                setCharacterVideoLoading((prev) => ({ ...prev, [characterId]: false }));
                
                // Update background task
                if (currentShowId) {
                  updateBackgroundTask(replicateJobId, { 
                    status: 'failed', 
                    error: 'Generation timed out after 15 minutes' 
                  });
                  setTimeout(() => removeBackgroundTask(replicateJobId), 10000);
                }
                
                // Stop polling and cleanup
                const interval = videoPollsRef.current.get(characterId);
                if (interval) {
                  clearInterval(interval);
                  videoPollsRef.current.delete(characterId);
                }
                videoJobsRef.current.delete(characterId);
                videoStartTimesRef.current.delete(characterId);
                return;
              }
            }
            
            const response = await fetch(
              `/api/characters/video/status?jobId=${encodeURIComponent(replicateJobId)}`,
              { cache: "no-store" }
            );
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string; detail?: string };
              const errorMessage = errorData.detail || errorData.error || `HTTP ${response.status}`;
              console.error(`❌ Failed to poll video status for ${characterId}:`, errorMessage);
              
              // Set error and stop polling
              setCharacterVideoErrors((prev) => ({
                ...prev,
                [characterId]: `Failed to check video status: ${errorMessage}`,
              }));
              setCharacterVideoLoading((prev) => ({ ...prev, [characterId]: false }));
              
              // Update background task
              if (currentShowId) {
                updateBackgroundTask(replicateJobId, { 
                  status: 'failed', 
                  error: `Status check failed: ${errorMessage}` 
                });
                setTimeout(() => removeBackgroundTask(replicateJobId), 10000);
              }
              
              // Stop polling
              const interval = videoPollsRef.current.get(characterId);
              if (interval) {
                clearInterval(interval);
                videoPollsRef.current.delete(characterId);
              }
              videoJobsRef.current.delete(characterId);
              videoStartTimesRef.current.delete(characterId);
              return;
            }
            
            const data = (await response.json()) as {
              status: string | null;
              detail?: string;
              outputUrl?: string;
            };
            
            console.log(`📊 Video ${characterId} status:`, data.status);
            
            if (data.status === "succeeded" && data.outputUrl) {
              console.log(`✅ Video ${characterId} completed:`, data.outputUrl.slice(0, 60) + "...");
              
              setCharacterVideos((prev) => {
                const existing = prev[characterId] || [];
                return {
                  ...prev,
                  [characterId]: [data.outputUrl ?? "", ...existing].filter(Boolean),
                };
              });
              
              // Set as selected
              setSelectedVideoIndex((prev) => ({
                ...prev,
                [characterId]: 0,
              }));
              
              // Clear loading
              setCharacterVideoLoading((prev) => ({ ...prev, [characterId]: false }));
              
              // Update background task
              if (currentShowId) {
                updateBackgroundTask(replicateJobId, { 
                  status: 'succeeded', 
                  outputUrl: data.outputUrl 
                });
                setTimeout(() => removeBackgroundTask(replicateJobId), 5000);
              }
              
              // Stop polling
              const interval = videoPollsRef.current.get(characterId);
              if (interval) {
                clearInterval(interval);
                videoPollsRef.current.delete(characterId);
              }
              videoJobsRef.current.delete(characterId);
              videoStartTimesRef.current.delete(characterId);
              
              // Play success sound
              playSuccessChime();
            } else if (data.status === "failed" || data.status === null) {
              console.error(`❌ Video ${characterId} failed:`, data.detail);
              
              const errorMessage = data.detail || "Failed to generate video.";
              
              setCharacterVideoErrors((prev) => ({
                ...prev,
                [characterId]: errorMessage,
              }));
              setCharacterVideoLoading((prev) => ({ ...prev, [characterId]: false }));
              
              // Update background task
              if (currentShowId) {
                updateBackgroundTask(replicateJobId, { 
                  status: 'failed', 
                  error: errorMessage 
                });
                setTimeout(() => removeBackgroundTask(replicateJobId), 10000);
              }
              
              // Stop polling
              const interval = videoPollsRef.current.get(characterId);
              if (interval) {
                clearInterval(interval);
                videoPollsRef.current.delete(characterId);
              }
              videoJobsRef.current.delete(characterId);
              videoStartTimesRef.current.delete(characterId);
            }
          } catch (pollError) {
            console.error(`Failed to poll video status for ${characterId}:`, pollError);
          }
        }, 3000);
        
        videoPollsRef.current.set(characterId, pollInterval);
      };

      try {
        // Use custom prompt if provided, otherwise use the one from the doc
        const characterWithPrompt = customPrompt ? {
          ...doc,
          showcase_scene_prompt: customPrompt,
        } : doc;
        
        const response = await fetch("/api/characters/video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            show: blueprint,
            character: characterWithPrompt,
            portraitUrl,
            modelId: videoModelId,
            seconds: videoSeconds,
            aspectRatio: videoAspectRatio,
            resolution: videoResolution,
            jobId,
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          const fallback = `Failed to start video generation (${response.status}).`;
          throw new Error(body?.error ?? fallback);
        }

        const result = (await response.json()) as { jobId?: string; status?: string };
        if (!result.jobId) {
          throw new Error("Video API did not return job ID.");
        }
        
        const replicateJobId = result.jobId;
        console.log(`🚀 Video generation started for ${characterId}, Replicate job: ${replicateJobId}`);
        
        // Update the stored job ID to the actual Replicate prediction ID
        videoJobsRef.current.set(characterId, replicateJobId);
        
        // Update background task with correct ID
        if (currentShowId) {
          // Remove old task if it exists
          if (jobId !== replicateJobId) {
            removeBackgroundTask(jobId);
          }
          
          // Create/update task with Replicate job ID
          const characterName = characterSeeds?.find(s => s.id === characterId)?.name;
          addBackgroundTask({
            id: replicateJobId,
            type: 'video',
            showId: currentShowId,
            characterId,
            status: (result.status || 'starting') as 'starting' | 'processing' | 'succeeded' | 'failed',
            stepNumber: 5,
            metadata: {
              characterName: characterName || characterId,
              showTitle: blueprint?.show_title || "Untitled Show",
            },
          });
        }
        
        // Start polling with the correct Replicate job ID
        startPolling(replicateJobId);
      } catch (err) {
        console.error("Video API call error:", err);
        setCharacterVideoErrors((prev) => ({
          ...prev,
          [characterId]:
            err instanceof Error ? err.message : "Failed to start video generation.",
        }));
        setCharacterVideoLoading((prev) => ({ ...prev, [characterId]: false }));
        
        // Clean up background task with client-side UUID
        if (currentShowId && jobId) {
          updateBackgroundTask(jobId, { 
            status: 'failed', 
            error: err instanceof Error ? err.message : "Failed to start video generation." 
          });
          setTimeout(() => removeBackgroundTask(jobId), 10000);
        }
        
        // Clean up
        videoJobsRef.current.delete(characterId);
        videoStartTimesRef.current.delete(characterId);
      }
    },
    [blueprint, characterDocs, characterPortraits, characterVideoLoading, posterAvailable, videoAspectRatio, videoModelId, videoResolution, videoSeconds, currentShowId, characterSeeds]
  );

  // Clean up stale background tasks on page load
  // Don't try to resume portrait/video jobs - they can't be resumed after page refresh
  // The Replicate jobs may still be running, but we've lost the polling connection
  useEffect(() => {
    if (!currentShowId) return;
    
    const activeTasks = getShowTasks(currentShowId);
    const staleTasks = activeTasks.filter(t => 
      (t.type === 'portrait' || t.type === 'video') && 
      (t.status === 'starting' || t.status === 'processing')
    );
    
    // Mark stale tasks as needing re-generation
    staleTasks.forEach(task => {
      console.log(`🧹 Cleaning up stale ${task.type} task: ${task.id} for ${task.characterId || 'unknown'}`);
      // Remove stale tasks - user will need to regenerate
      removeBackgroundTask(task.id);
    });
    
    if (staleTasks.length > 0) {
      console.log(`🧹 Cleaned up ${staleTasks.length} stale background tasks. Portraits/videos will need to be regenerated.`);
    }
  }, [currentShowId]);

  const generatePoster = useCallback(
    async (value: string, gridUrl?: string, specificShowId?: string) => {
      // Use specific show ID to prevent cross-contamination between parallel shows
      const targetShowId = specificShowId || currentShowId;
      
      // Check if already loading (prevent duplicate calls)
      if (posterLoading) {
        console.log("⏸️ Poster generation already in progress, skipping");
        return;
      }
      
      setPosterLoading(true);
      setPosterError(null);
      
      const heroPosterTaskId = `hero-poster-${targetShowId}`;
      
      console.log(`🎨 Generating poster for show: ${targetShowId}`);
      
      // Track hero poster generation
      if (targetShowId) {
        addBackgroundTask({
          id: heroPosterTaskId,
          type: 'poster',
          showId: targetShowId,
          status: 'starting',
          stepNumber: 0, // This is the hero poster, happens early
          metadata: {
            showTitle: blueprint?.show_title || "Untitled Show",
          },
        });
      }

      const pitch = value.trim();

      const trimmedPrompt =
        pitch.length > 5000 ? `${pitch.slice(0, 4950)}…` : pitch;

      const attemptPoster = async (): Promise<{ url?: string } | null> => {
        const response = await fetch("/api/poster", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: trimmedPrompt || value.slice(0, 4950),
            characterGridUrl: gridUrl,
            show: blueprint ? {
              show_title: blueprint.show_title,
              production_style: blueprint.production_style,
            } : undefined,
          }),
        });

        if (!response.ok) {
          // Check if response is HTML (error page) or JSON
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("text/html")) {
            throw new Error(`Poster generation failed with server error (${response.status}). The server may be overloaded or timed out. Please try again.`);
          }
          
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          const fallback = `Failed to generate poster (${response.status}).`;
          throw new Error(body?.error ?? fallback);
        }

        // Check if successful response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error("Poster generation returned unexpected response format. The server may have encountered an error.");
        }

        return (await response.json()) as { url?: string };
      };

      try {
        let attempts = 0;
        let result: { url?: string } | null = null;
        const MAX_POSTER_ATTEMPTS = 5; // 1 initial + 4 retries
        
        while (attempts < MAX_POSTER_ATTEMPTS) {
          attempts += 1;
          try {
            result = await attemptPoster();
            if (result?.url) break;
          } catch (innerError) {
            const message =
              innerError instanceof Error
                ? innerError.message
                : "Unable to generate poster.";
            
            const isContentFilter = /sensitive/i.test(message) || /flagged/i.test(message) || /E005/i.test(message);
            const isRateLimit = /429/i.test(message) || /rate.?limit/i.test(message) || /too many requests/i.test(message);
            const isRetryable = isContentFilter || isRateLimit;
            
            console.warn(`Poster attempt ${attempts}/${MAX_POSTER_ATTEMPTS} failed:`, message);
            
            if (isRetryable) {
              if (attempts >= MAX_POSTER_ATTEMPTS) {
                throw innerError;
              }
              // Add delay before retry (longer for rate limits)
              const retryDelay = isRateLimit ? 3000 + (attempts * 2000) : 1500;
              console.log(`🔄 ${isRateLimit ? 'Rate limited' : 'Content filtered'} - retrying in ${retryDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              continue;
            }
            throw innerError;
          }
        }

        if (!result?.url) {
          throw new Error("Poster generation returned no image.");
        }

        setPosterUrl(result.url ?? null);
        
        console.log(`✅ Poster generated for show: ${targetShowId}`);
        
        // Mark as succeeded
        if (targetShowId) {
          updateBackgroundTask(heroPosterTaskId, {
            status: 'succeeded',
            completedAt: Date.now(),
            outputUrl: result.url,
          });
        }
      } catch (err) {
        console.error(`❌ Poster generation failed for show: ${targetShowId}`, err);
        const message =
          err instanceof Error ? err.message : "Unable to generate poster.";
        setPosterError(
          /Missing REPLICATE_API_TOKEN/.test(message)
            ? "Poster generation unavailable. Add REPLICATE_API_TOKEN to enable artwork."
            : /string (too long|above max length)/i.test(message)
              ? "Poster prompt exceeded provider limits. Try shortening the brief or regenerating."
              : message
        );
        setPosterUrl(null);
        
        // Mark as failed
        if (targetShowId) {
          updateBackgroundTask(heroPosterTaskId, {
            status: 'failed',
            error: message,
          });
        }
      } finally {
        setPosterLoading(false);
        // Clear poster job from localStorage
        try {
          localStorage.removeItem('production-flow.poster-job');
        } catch (e) {
          // Ignore
        }
      }
    },
    [blueprint, posterLoading, currentShowId]
  );

  const generateTrailer = useCallback(async (requestedModel?: 'sora-2' | 'sora-2-pro' | 'veo-3.1' | 'auto', customPrompt?: string) => {
    // Use user's selected model from settings as default, not 'auto'
    const modelToUse = requestedModel || videoGenModel || 'veo-3.1';
    console.log("🎬 generateTrailer called");
    console.log("   Requested model:", requestedModel || `using user setting: ${videoGenModel}`);
    console.log("   Has blueprint:", !!blueprint);
    console.log("   Has portraitGridUrl:", !!portraitGridUrl);
    console.log("   characterSeeds length:", characterSeeds?.length || 0);
    console.log("   characterPortraits:", Object.keys(characterPortraits).length);
    console.log("   Current digest:", trailerDigestRef.current);
    
    // Clear any previous error and digest to allow retry
    setTrailerError(null);
    setTrailerStatus(null);
    trailerDigestRef.current = ""; // Clear digest to allow retry with same grid
    console.log("   Cleared error and digest for fresh start");
    
    if (!blueprint) {
      console.log("❌ No blueprint - aborting");
      setTrailerError("Blueprint missing.");
      return;
    }
    
    // Check if there's already a trailer job in progress
    if (trailerStatusJobIdRef.current) {
      console.log("⏸️ Trailer generation already in progress, skipping");
      return;
    }
    
    // Check localStorage for active job
    try {
      const savedJob = localStorage.getItem('production-flow.trailer-job');
      if (savedJob) {
        const { jobId, startedAt } = JSON.parse(savedJob);
        const elapsed = Date.now() - startedAt;
        if (elapsed < 600000) {
          console.log("⏸️ Active trailer job detected in localStorage, skipping");
          return;
        }
      }
    } catch (e) {
      // Ignore
    }
    
    // Generate grid first if we don't have one but have 4+ portraits
    let gridUrl = portraitGridUrl;
    if (!gridUrl) {
      const portraitsData = characterSeeds
        ?.map((seed) => {
          const url = characterPortraits[seed.id];
          if (!url) return null;
          return { id: seed.id, name: seed.name, url };
        })
        .filter((entry): entry is { id: string; name: string; url: string } => Boolean(entry)) || [];
      
      if (portraitsData.length < 4) {
        setTrailerError("Need at least 4 character portraits to generate trailer.");
        return;
      }
      
      console.log("Generating character grid first with", portraitsData.length, "portraits");
      setPortraitGridLoading(true);
      
      try {
        const gridResponse = await fetch("/api/characters/portrait-grid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portraits: portraitsData,
            columns: 3,
          }),
        }).catch((fetchError) => {
          throw new Error(`Network error generating grid: ${fetchError.message || "Check your connection"}`);
        });
        
        if (!gridResponse.ok) {
          const errorBody = await gridResponse.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorBody.error || `Grid generation failed (${gridResponse.status})`);
        }
        
        const gridResult = (await gridResponse.json()) as { url?: string };
        if (!gridResult.url) {
          throw new Error("Grid generation returned no URL");
        }
        
        gridUrl = gridResult.url;
        setPortraitGridUrl(gridUrl);
      } catch (error) {
        console.error("Failed to generate grid for trailer:", error);
        const message = error instanceof Error ? error.message : "Failed to create character grid";
        setTrailerError(message);
        setTrailerLoading(false);
        setPortraitGridLoading(false);
        return;
      } finally {
        setPortraitGridLoading(false);
      }
    }

    const jobId =
      typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `trailer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const digest = gridUrl;
    trailerDigestRef.current = digest;

    const startTime = Date.now();
    setTrailerLoading(true);
    setTrailerError(null);
    // Include model in status so UI shows correct model name
    const statusWithModel = modelToUse.includes("veo") ? "starting-veo" : 
                            modelToUse.includes("sora-2-pro") ? "starting-sora2pro" : "starting-sora2";
    setTrailerStatus(statusWithModel);
    setTrailerModel(modelToUse); // Track which model we're using
    setTrailerStartTime(startTime);
    setTrailerElapsed(0);
    
    // Create background task for trailer
    if (currentShowId) {
      addBackgroundTask({
        id: jobId,
        type: 'trailer',
        showId: currentShowId,
        status: 'starting',
        stepNumber: 8,
        metadata: {
          showTitle: blueprint.show_title || "Untitled Series",
        },
      });
      console.log(`📝 Created background task for trailer`);
    }

      try {
        console.log("🚀 Starting trailer generation with jobId:", jobId);
        console.log("   Current retry count:", trailerRetryCount);
        
        // Create a clean, serializable copy of blueprint data
        // Only include simple, serializable data to avoid circular references
        const cleanBlueprint: Record<string, unknown> = {
          show_title: String(blueprint.show_title || ""),
          show_logline: String(blueprint.show_logline || ""),
        };
        
        // Safely extract production_style if it exists
        if (blueprint.production_style) {
          const ps = blueprint.production_style;
          cleanBlueprint.production_style = {
            medium: ps.medium ? String(ps.medium) : undefined,
            cinematic_references: Array.isArray(ps.cinematic_references) 
              ? ps.cinematic_references.map(String).filter(Boolean)
              : [],
            visual_treatment: ps.visual_treatment ? String(ps.visual_treatment) : undefined,
            stylization_level: ps.stylization_level ? String(ps.stylization_level) : undefined,
          };
        }
        
        // Auto LLM prompt adjustment after 2 failures (lowered from 4 for faster response)
        const LLM_ADJUSTMENT_THRESHOLD = 2;
        let finalPrompt = customPrompt || undefined;
        let usedLlmAdjustment = false;
        let adjustmentReason: string | null = null;
        let originalPromptForDisplay: string | null = null;
        let adjustedPromptForDisplay: string | null = null;
        
        // Build the base prompt that will be used (either custom or default)
        const basePrompt = customPrompt || buildDefaultTrailerPrompt();
        
        if (trailerRetryCount >= LLM_ADJUSTMENT_THRESHOLD) {
          console.log("🤖 Auto-adjusting prompt with LLM (attempt #" + (trailerRetryCount + 1) + ")...");
          setTrailerAdjustingPrompt(true);
          setTrailerStatus("adjusting-prompt");
          
          // Store the original prompt for display - set immediately so UI shows it while loading
          originalPromptForDisplay = basePrompt;
          setTrailerOriginalPrompt(basePrompt);
          
          try {
            const adjustResponse = await fetch("/api/adjust-prompt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                originalPrompt: basePrompt,
                generationType: "trailer",
                errorMessage: trailerError || "Content flagged by moderation",
                attemptNumber: trailerRetryCount + 1,
              }),
            });
            
            if (adjustResponse.ok) {
              const adjustResult = await adjustResponse.json() as {
                success: boolean;
                adjustedPrompt?: string;
                adjustmentReason?: string;
                confidenceLevel?: string;
                refusal?: string;
              };
              
              if (adjustResult.success && adjustResult.adjustedPrompt) {
                finalPrompt = adjustResult.adjustedPrompt;
                adjustedPromptForDisplay = adjustResult.adjustedPrompt;
                usedLlmAdjustment = true;
                adjustmentReason = adjustResult.adjustmentReason || null;
                console.log("✅ LLM adjusted prompt successfully");
                console.log("   Reason:", adjustmentReason);
                console.log("   Confidence:", adjustResult.confidenceLevel);
              } else if (adjustResult.refusal) {
                console.log("⚠️ LLM refused to adjust:", adjustResult.refusal);
                adjustmentReason = `LLM refused: ${adjustResult.refusal}`;
              }
            } else {
              const errorText = await adjustResponse.text().catch(() => "Unknown error");
              console.error("❌ LLM adjustment API error:", errorText);
              adjustmentReason = `API error: ${errorText.slice(0, 100)}`;
            }
          } catch (adjustError) {
            console.error("⚠️ LLM adjustment failed:", adjustError);
            adjustmentReason = adjustError instanceof Error ? adjustError.message : "Unknown error";
          } finally {
            setTrailerAdjustingPrompt(false);
          }
        }
        
        // Track LLM adjustment usage and store prompts for UI display
        setTrailerUsedLlmAdjustment(usedLlmAdjustment);
        setTrailerLlmAdjustmentReason(adjustmentReason);
        setTrailerOriginalPrompt(originalPromptForDisplay);
        setTrailerAdjustedPrompt(adjustedPromptForDisplay);
        
        const response = await fetch("/api/trailer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: blueprint.show_title ?? "Untitled Series",
            logline: blueprint.show_logline ?? "",
            characterGridUrl: gridUrl,
            show: cleanBlueprint,
            jobId,
            model: modelToUse,
            customPrompt: finalPrompt,
          }),
        }).catch((fetchError) => {
          throw new Error(`Network error: ${fetchError.message || "Check your connection and try again"}`);
        });

      // Start polling AFTER we've confirmed the request was sent
      console.log("✅ Trailer request sent, starting status polling");
      startTrailerStatusPolling(jobId, currentShowId || undefined);

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        const fallback = `Failed to generate trailer (${response.status}).`;
        throw new Error(body?.error ?? fallback);
      }

      const result = (await response.json()) as { url?: string; status?: string; model?: string };
      console.log("📹 Trailer API response:", result);
      console.log("📹 Trailer URL:", result.url);
      console.log("📹 Model used:", result.model || "sora-2");
      
      if (!result.url) {
        console.error("❌ No URL in trailer response:", result);
        throw new Error("Trailer response missing URL.");
      }
      
      console.log("✅ Setting trailer URL in state:", result.url);
      
      // Track which model was used
      setTrailerModel(result.model || "sora-2");
      
      // Update status based on which model was used
      if (result.model === "veo-3.1") {
        setTrailerStatus("succeeded (veo)");
        console.log("ℹ️ Trailer generated with VEO 3.1 fallback (8 seconds)");
        // Show notification that VEO was used
        setTimeout(() => {
          alert("Note: Sora 2 flagged the content, so VEO 3.1 was used as fallback. Trailer is 8 seconds instead of 12.");
        }, 500);
      } else {
        setTrailerStatus("succeeded");
      }
      
      setTrailerUrl(result.url);
      setTrailerRetryCount(0); // Reset retry count on success
      // Note: Keep LLM adjustment info visible even on success so user knows it was used
      
      // Update background task as succeeded
      if (currentShowId) {
        updateBackgroundTask(jobId, { 
          status: 'succeeded', 
          outputUrl: result.url 
        });
        setTimeout(() => removeBackgroundTask(jobId), 5000);
      }
      
      console.log("🎵 Playing success sound");
      // Play success sound
      playSuccessChime();
      
      console.log("✅ Trailer generation complete!");
    } catch (err) {
      console.error("Failed to generate trailer:", err);
      let message = err instanceof Error ? err.message : "Unable to generate trailer.";
      
      // Handle E005 sensitivity flag - all automatic retries have already been attempted by backend
      // Backend flow: Sora → AI rewrite → Sora retry → VEO → Sora (no grid)
      if (message.includes("E005") || message.includes("flagged as sensitive") || message.includes("All trailer generation methods failed")) {
        // All automatic retries (including AI prompt rewrite) have been attempted
        message = "Content was flagged. Automatic retries (AI prompt rewrite + VEO fallback) were attempted. Please edit the prompt below.";
        
        // Pre-populate edit field with default prompt if not already set
        if (!editedTrailerPrompt && blueprint) {
          const defaultPrompt = buildDefaultTrailerPrompt();
          setEditedTrailerPrompt(defaultPrompt);
        }
      }
      // Handle 504 Gateway Timeout specifically
      else if (message.includes("504") || message.includes("Gateway") || message.includes("Timeout")) {
        message = "Trailer generation timed out. Sora 2 may be busy—try again in a moment.";
      }
      
      setTrailerError(message);
      setTrailerUrl(null);
      setTrailerStatus("failed");
      setTrailerStartTime(null);
      trailerDigestRef.current = ""; // Allow retry
      setTrailerRetryCount(prev => prev + 1); // Increment retry count
      
      // Update background task as failed
      if (currentShowId) {
        updateBackgroundTask(jobId, { 
          status: 'failed', 
          error: message 
        });
        setTimeout(() => removeBackgroundTask(jobId), 10000);
      }
    } finally {
      stopTrailerStatusPolling();
      trailerStatusJobIdRef.current = null;
      setTrailerLoading(false);
      setTimeout(() => {
        setTrailerStatus(null);
        setTrailerStartTime(null);
        setTrailerElapsed(0);
      }, 3000);
    }
  // Note: buildDefaultTrailerPrompt is intentionally not in deps - it's defined later in file
  // and its dependencies (blueprint, trailerTemplate) are already captured here
  }, [
    blueprint,
    portraitGridUrl,
    characterSeeds,
    characterPortraits,
    startTrailerStatusPolling,
    stopTrailerStatusPolling,
    currentShowId,
    videoGenModel,
    trailerRetryCount,
    trailerError,
  ]);

  // REMOVED: Old auto-poster effect - We only use library poster now
  // The library poster auto-generates after first portrait (see generateCharacterPortrait)

  useEffect(() => {
    if (!autopilotMode) return; // Only auto-generate when autopilot is ON
    if (!blueprint) return;
    if (!characterSeeds || characterSeeds.length === 0) return;
    const portraitsData = characterSeeds
      .map((seed) => {
        const url = characterPortraits[seed.id];
        if (!url) return null;
        return { id: seed.id, name: seed.name, url };
      })
      .filter((entry): entry is { id: string; name: string; url: string } => Boolean(entry));
    if (portraitsData.length === 0) return;
    // Allow partial grids with 4+ portraits (changed from requiring all)
    if (portraitsData.length < 4) return;

    const signature = JSON.stringify(portraitsData.map((entry) => entry.url));

    if (portraitGridUrl && portraitGridDigestRef.current === "") {
      portraitGridDigestRef.current = signature;
      return;
    }

    if (portraitGridDigestRef.current === signature || portraitGridLoading) {
      return;
    }

    portraitGridDigestRef.current = signature;
    setPortraitGridLoading(true);
    setPortraitGridError(null);
    
    const gridTaskId = `portrait-grid-${currentShowId}`;

    void (async () => {
      // Track portrait grid generation
      if (currentShowId) {
        addBackgroundTask({
          id: gridTaskId,
          type: 'portrait-grid',
          showId: currentShowId,
          status: 'starting',
          stepNumber: 6,
          metadata: {
            showTitle: blueprint?.show_title || "Untitled Show",
            portraitCount: portraitsData.length,
          },
        });
      }
      
      try {
        if (currentShowId) {
          updateBackgroundTask(gridTaskId, { status: 'processing' });
        }
        
        const response = await fetch("/api/characters/portrait-grid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portraits: portraitsData,
            columns: 3,
          }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          const message = body?.error ?? `Failed to generate portrait grid (${response.status})`;
          throw new Error(message);
        }
        const result = (await response.json()) as { url?: string };
        if (result.url) {
          setPortraitGridUrl(result.url);
          setPortraitGridError(null);
          
          // Mark as succeeded
          if (currentShowId) {
            updateBackgroundTask(gridTaskId, {
              status: 'succeeded',
              completedAt: Date.now(),
              outputUrl: result.url,
            });
          }
        } else {
          throw new Error("Portrait grid response missing URL.");
        }
      } catch (error) {
        console.error("Failed to compose portrait grid:", error);
        const message =
          error instanceof Error ? error.message : "Unable to compose portrait grid.";
        setPortraitGridError(message);
        portraitGridDigestRef.current = "";
        
        // Mark as failed
        if (currentShowId) {
          updateBackgroundTask(gridTaskId, {
            status: 'failed',
            error: message,
          });
        }
      } finally {
        setPortraitGridLoading(false);
      }
    })();
  }, [
    autopilotMode,
    blueprint,
    characterSeeds,
    characterPortraits,
    portraitGridUrl,
    portraitGridLoading,
  ]);


  useEffect(() => {
    if (!autopilotMode) return; // Only auto-generate when autopilot is ON
    
    const checkConditions = {
      hasBlueprint: !!blueprint,
      hasGrid: !!portraitGridUrl,
      hasTrailer: !!trailerUrl,
      isLoading: trailerLoading,
      hasError: !!trailerError,
      digestMatch: trailerDigestRef.current === portraitGridUrl,
      posterAvailable,
    };
    
    console.log("🎬 Trailer auto-gen check:", checkConditions);
    
    if (!blueprint) return;
    if (!portraitGridUrl) return;
    if (trailerUrl || trailerLoading || trailerError) return; // Don't auto-retry on error!
    if (!posterAvailable) return;
    if (trailerDigestRef.current === portraitGridUrl) return;
    
    console.log("✅ All conditions met - auto-generating trailer");
    void generateTrailer();
  }, [
    autopilotMode,
    blueprint,
    portraitGridUrl,
    trailerUrl,
    trailerLoading,
    trailerError,
    posterAvailable,
    generateTrailer,
  ]);

  const submitPrompt = useCallback(
    async (value: string, chosenModel: ModelId) => {
      if (!value.trim()) return;
      stopTrailerStatusPolling();
      trailerStatusJobIdRef.current = null;
      autoGenCheckedShowIdRef.current = null; // Reset auto-gen check for new show
      autoPortraitCheckedRef.current.clear(); // Reset portrait auto-gen tracking
      setIsLoading(true);
      setError(null);
      setCharacterSeeds(null);
      setCharacterDocs({});
      setCharacterBuilding({});
      setCharacterBuildErrors({});
      setActiveCharacterId(null);
      setCharacterPortraits({});
      setCharacterPortraitLoading({});
      setCharacterPortraitErrors({});
      setCharacterVideos({});
      setCharacterVideoLoading({});
      setCharacterVideoErrors({});
      setCharactersError(null);
      setPosterUrl(null);
      setPosterError(null);
      setPosterLoading(false);
      setPosterAvailable(false);
      setLibraryPosterUrl(null);
      setLibraryPosterLoading(false);
      setPortraitGridUrl(null);
      setPortraitGridLoading(false);
      setPortraitGridError(null);
      setTrailerUrl(null);
      setTrailerLoading(false);
      setTrailerError(null);
      setTrailerStatus(null);
      setTrailerElapsed(0);
      setTrailerStartTime(null);
      posterDigestRef.current = "";
      portraitGridDigestRef.current = "";
      trailerDigestRef.current = "";
      setLastPrompt(null);

      // Generate show ID early for tracking
      const newShowId = `show-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const showGenTaskId = `show-gen-${newShowId}`;
      
      // Track show generation
      addBackgroundTask({
        id: showGenTaskId,
        type: 'show-generation',
        showId: newShowId,
        status: 'starting',
        stepNumber: 1,
        metadata: {
          prompt: value.slice(0, 100),
          model: chosenModel,
        },
      });

      try {
        updateBackgroundTask(showGenTaskId, { status: 'processing' });
        
        // Retry logic for schema validation failures
        const MAX_RETRIES = 2;
        let lastError: Error | null = null;
        let result: ApiResponse | null = null;
        
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          if (attempt > 0) {
            console.log(`🔄 Retrying show generation (attempt ${attempt + 1}/${MAX_RETRIES}) after schema validation failure...`);
            // Brief delay before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          const response = await fetch("/api/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              prompt: value, 
              model: chosenModel,
              stylizationGuardrails, // Pass the user's setting
            }),
          });

          if (!response.ok) {
            // Check if response is HTML (error page) or JSON
            const contentType = response.headers.get("content-type");
            if (contentType?.includes("text/html")) {
              throw new Error(`Show generation failed with server error (${response.status}). The server may be overloaded or timed out. Please try again.`);
            }
            
            const body = (await response.json().catch(() => null)) as
              | {
                  error?: string;
                  messages?: Array<{ instancePath?: string; message?: string }>;
                  details?: unknown;
                }
              | null;

            // Check if this is a schema validation error (retryable)
            if (body?.messages || body?.error?.includes("schema validation")) {
              console.error(`Schema validation error (attempt ${attempt + 1}):`, body.messages || body.error);
              const errorDetails = body.messages
                ? body.messages.map(m => `${m.instancePath || 'root'}: ${m.message || 'invalid'}`).join('; ')
                : body.error || 'Unknown validation error';
              lastError = new Error(`Schema validation failed: ${errorDetails}`);
              
              // Continue to retry if not last attempt
              if (attempt < MAX_RETRIES - 1) {
                continue;
              }
              // Last attempt - throw with user-friendly message
              throw new Error(`Schema validation failed after ${MAX_RETRIES} attempts: ${errorDetails}. The AI model is having trouble generating a valid response. Please try again or use a different prompt.`);
            } else if (body?.details) {
              console.error("Model output details:", body.details);
            }

            const fallback = `Request failed (${response.status})`;
            throw new Error(body?.error ?? fallback);
          }

          // Check if successful response is JSON
          const contentType = response.headers.get("content-type");
          if (!contentType?.includes("application/json")) {
            throw new Error("Show generation returned unexpected response format. The server may have encountered an error.");
          }

          result = (await response.json()) as ApiResponse;
          
          // Success - break out of retry loop
          if (attempt > 0) {
            console.log(`✅ Show generation succeeded on attempt ${attempt + 1}`);
          }
          break;
        }
        
        if (!result) {
          throw lastError || new Error("Show generation failed after retries");
        }

        if ("error" in result && result.error) {
          throw new Error(result.error);
        }

        setBlueprint(result.data);
        setUsage(result.usage);
        setRawJson(result.raw);
        setActiveModel(chosenModel);
        setLastPrompt(value);
        setShowPromptInput(false); // Hide input after successful generation

        // Debug: Check if show_title is in blueprint
        console.log("=== BLUEPRINT DEBUG ===");
        console.log("Blueprint show_title:", result.data?.show_title);
        console.log("Blueprint production_style:", result.data?.production_style?.medium);

        // Use the show ID we created earlier
        setCurrentShowId(newShowId);
        console.log("🆕 New show created with ID:", newShowId);
        
        // Mark show generation as succeeded with actual show title from blueprint
        const actualShowTitle = result.data?.show_title || "Untitled Show";
        updateBackgroundTask(showGenTaskId, {
          status: 'succeeded',
          completedAt: Date.now(),
          metadata: {
            showTitle: actualShowTitle,
            prompt: value.slice(0, 100),
            model: chosenModel,
          },
        });
        console.log("✅ Show generation complete, title:", actualShowTitle);

        const posterIsAvailable = Boolean(result.posterAvailable);
        setPosterAvailable(posterIsAvailable);

        // Save the initial show with blueprint
        try {
          const initialSave = {
            id: newShowId,
            blueprint: result.data,
            rawJson: result.raw,
            usage: result.usage,
            model: chosenModel,
            characterSeeds: [],
            characterDocs: {},
            characterPortraits: {},
            characterVideos: {},
            posterUrl: null,
            libraryPosterUrl: null,
            portraitGridUrl: null,
            trailerUrl: null,
            createdAt: new Date().toISOString(),
          };
          
          const saveResponse = await fetch("/api/library", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(initialSave),
          });
          
          if (saveResponse.ok) {
            console.log("✅ Initial show saved to library");
          }
        } catch (err) {
          console.error("Failed to save initial show:", err);
        }

        const tasks: Array<Promise<void>> = [
          generateCharacterSeeds(value, result.data, chosenModel, newShowId),
        ];

        if (posterIsAvailable) {
          tasks.push(generatePoster(value, undefined, newShowId));
        } else {
          setPosterLoading(false);
          setPosterError(null);
        }

        await Promise.all(tasks);
      } catch (err) {
        console.error(err);
        
        // Mark show generation as failed
        updateBackgroundTask(showGenTaskId, {
          status: 'failed',
          error: err instanceof Error ? err.message : "Something went wrong.",
        });
        
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
        setCharactersLoading(false);
        setPosterLoading(false);
      } finally {
        setIsLoading(false);
      }
    },
    [generateCharacterSeeds, generatePoster, stopTrailerStatusPolling]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await submitPrompt(input, model);
    },
    [input, submitPrompt, model]
  );

  const handleSelectCharacter = useCallback((id: string) => {
    setActiveCharacterId(id);
  }, []);

  const handleClearActiveCharacter = useCallback(() => {
    setActiveCharacterId(null);
  }, []);

  const startNewShow = useCallback(() => {
    // Clear all state for a fresh start
    stopTrailerStatusPolling();
    trailerStatusJobIdRef.current = null;
    autoGenCheckedShowIdRef.current = null; // Reset auto-gen check
    autoPortraitCheckedRef.current.clear(); // Reset portrait auto-gen tracking
    setBlueprint(null);
    setUsage(undefined);
    setRawJson(null);
    setError(null);
    setActiveModel(model);
    setShowPromptInput(true); // Show the input box for new show
    setCharacterSeeds(null);
    setCharacterDocs({});
    setCharacterBuilding({});
    setCharacterBuildErrors({});
    setActiveCharacterId(null);
    setCharacterPortraits({});
    setCharacterPortraitLoading({});
    setCharacterPortraitErrors({});
    setCharacterVideos({});
    setCharacterVideoLoading({});
    setCharacterVideoErrors({});
    setEditedVideoPrompts({});
    setSelectedVideoIndex({});
    setCharactersError(null);
    setCharactersLoading(false);
    setPosterUrl(null);
    setPosterError(null);
    setPosterLoading(false);
    setLibraryPosterUrl(null);
    setLibraryPosterLoading(false);
    setPortraitGridUrl(null);
    setPortraitGridLoading(false);
    setPortraitGridError(null);
    setTrailerUrl(null);
    setTrailerLoading(false);
    setTrailerError(null);
    setTrailerStatus(null);
    setTrailerElapsed(0);
    setTrailerStartTime(null);
    setLastPrompt(null);
    setCurrentShowId(null);
    posterDigestRef.current = "";
    portraitGridDigestRef.current = "";
    trailerDigestRef.current = "";
    urlUpdatedForShowRef.current = null;
    // Update URL back to /console without ID (without triggering route change)
    if (typeof window !== 'undefined') {
      window.history.replaceState(window.history.state, '', '/console');
    }
  }, [model, stopTrailerStatusPolling]);

  const loadShow = useCallback(async (showId: string) => {
    // Reset auto-gen checks for this new show load
    autoGenCheckedShowIdRef.current = null;
    autoPortraitCheckedRef.current.clear();
    console.log("🔄 Loading show, reset auto-gen checks");
    setShowPromptInput(false); // Hide input when loading existing show
    
    // Check if there's an active trailer job for this show
    let hasActiveTrailerJob = false;
    try {
      const savedJob = localStorage.getItem('production-flow.trailer-job');
      if (savedJob) {
        const { jobId, showId: jobShowId, startedAt } = JSON.parse(savedJob);
        const elapsed = Date.now() - startedAt;
        // If job is for this show and recent, don't stop it
        if (jobId && jobShowId === showId && elapsed < 600000) {
          hasActiveTrailerJob = true;
          console.log("🔄 Active trailer job detected, will resume polling");
        }
      }
    } catch (e) {
      // Ignore
    }
    
    // Only stop polling if no active job for this show
    if (!hasActiveTrailerJob) {
      stopTrailerStatusPolling();
      trailerStatusJobIdRef.current = null;
    }
    
    setIsLoadingShow(true);
    try {
      const response = await fetch(`/api/library/${showId}`);
      if (!response.ok) throw new Error("Failed to load show");
      const data = await response.json() as { show: SavedShow };
      const show = data.show;

      const totalVideos = Object.values(show.characterVideos || {}).reduce((sum, arr) => sum + arr.length, 0);
      
      console.log("📂 Loading show:", {
        id: show.id,
        hasBlueprint: !!show.blueprint,
        characterCount: show.characterSeeds?.length || 0,
        builtDossiers: Object.keys(show.characterDocs || {}).length,
        portraitCount: Object.keys(show.characterPortraits || {}).filter(k => show.characterPortraits[k]).length,
        videoCount: totalVideos,
        hasPoster: !!show.posterUrl,
        hasLibraryPoster: !!show.libraryPosterUrl,
      });
      
      // Load ALL saved data
      console.log("Loading data from show object:");
      console.log("  - Portraits:", Object.keys(show.characterPortraits || {}).length);
      console.log("  - Videos:", Object.keys(show.characterVideos || {}).length);
      console.log("  - Portrait URLs:", show.characterPortraits);
      console.log("  - Video arrays:", show.characterVideos);
      
      setBlueprint(show.blueprint);
      setRawJson(show.rawJson || null);
      setUsage(show.usage);
      setModel(show.model);
      setActiveModel(show.model);
      setCharacterSeeds(show.characterSeeds || []);
      setCharacterDocs(show.characterDocs || {});
      setCharacterBuilding({});
      setCharacterBuildErrors({});
      setCharacterPortraits(show.characterPortraits || {});
      setCharacterPortraitLoading({});
      setCharacterPortraitLoaded({});
      setCharacterPortraitErrors({});
      setCharacterVideos(show.characterVideos || {});
      setCharacterVideoLoading({});
      setCharacterVideoErrors({});
      setSelectedVideoIndex({});
      setPosterUrl(show.posterUrl || null);
      setLibraryPosterUrl(show.libraryPosterUrl || null);
      setPortraitGridUrl(show.portraitGridUrl || null);
      setPortraitGridError(null);
      setTrailerUrl(show.trailerUrl || null);
      setTrailerError(null);
      
      // Check if there's an active trailer job - don't clear state if so
      let hasActiveTrailerJob = false;
      try {
        const savedJob = localStorage.getItem('production-flow.trailer-job');
        if (savedJob) {
          const { jobId, showId: jobShowId, startedAt } = JSON.parse(savedJob);
          const elapsed = Date.now() - startedAt;
          if (jobId && jobShowId === show.id && elapsed < 600000) {
            hasActiveTrailerJob = true;
            console.log("⏸️ Active trailer job detected - preserving trailer state");
          }
        }
      } catch (e) {
        // Ignore
      }
      
      // Only clear trailer state if no active job
      if (!hasActiveTrailerJob) {
        setTrailerStatus(null);
        setTrailerElapsed(0);
        setTrailerStartTime(null);
        setTrailerLoading(false);
      } else {
        // Preserve/restore loading state for active job
        console.log("🔄 Trailer job active - restoring loading state");
        setTrailerLoading(true);
        try {
          const savedJob = localStorage.getItem('production-flow.trailer-job');
          if (savedJob) {
            const { startedAt } = JSON.parse(savedJob);
            setTrailerStartTime(startedAt);
            setTrailerElapsed(Date.now() - startedAt);
            setTrailerStatus("processing");
          }
        } catch (e) {
          // Ignore
        }
      }
      
      setPosterAvailable(true);
      setCurrentShowId(show.id);
      setPortraitGridLoading(false);
      
      // NEW: Restore prompts and preferences
      setLastPrompt(show.originalPrompt || null);
      setEditedPortraitPrompts(show.customPortraitPrompts || {});
      setEditedVideoPrompts(show.customVideoPrompts || {});
      setEditedPosterPrompt(show.customPosterPrompt || "");
      setEditedTrailerPrompt(show.customTrailerPrompt || "");
      setVideoModelId((show.videoModelId as VideoModelId) || VIDEO_MODEL_OPTIONS[0].id);
      setVideoSeconds((show.videoSeconds as VideoDuration) || 8);
      setVideoAspectRatio((show.videoAspectRatio as VideoAspectRatio) || "landscape");
      setVideoResolution((show.videoResolution as VideoResolution) || "standard");
      setTrailerModel(show.trailerModel || null);
      
      // Episode format and loglines
      setShowFormat(show.showFormat || null);
      setEpisodes(show.episodes || []);
      setSeasonArc(null); // We don't persist seasonArc separately, it's part of the generation
      
      console.log("State updated - portraits now:", Object.keys(show.characterPortraits || {}).length);
      console.log("State updated - showFormat:", show.showFormat ? "yes" : "no");
      console.log("State updated - episodes:", show.episodes?.length || 0);
      console.log("State updated - videos now:", Object.keys(show.characterVideos || {}).length);
      
      // Clear any loading/error states
      setCharacterBuilding({});
      setCharacterBuildErrors({});
      setCharacterPortraitLoading({});
      
      // Mark existing portraits as loaded so they don't show spinner
      const loadedPortraits: Record<string, boolean> = {};
      Object.entries(show.characterPortraits || {}).forEach(([id, url]) => {
        if (url) {
          loadedPortraits[id] = true;
        }
      });
      setCharacterPortraitLoaded(loadedPortraits);
      
      setCharacterPortraitErrors({});
      setCharacterVideoLoading({});
      setCharacterVideoErrors({});
      setActiveCharacterId(null);
      setError(null);
      
      const portraitUrlsForDigest =
        show.characterSeeds?.map((seed) => show.characterPortraits?.[seed.id] || null) ?? [];
      if (
        show.portraitGridUrl &&
        portraitUrlsForDigest.length &&
        portraitUrlsForDigest.every((url) => typeof url === "string" && url.length > 0)
      ) {
        portraitGridDigestRef.current = JSON.stringify(
          portraitUrlsForDigest as string[]
        );
      } else {
        portraitGridDigestRef.current = "";
      }
      posterDigestRef.current = "";
      // Only set trailer digest if trailer actually exists OR is actively processing
      if (show.trailerUrl) {
        trailerDigestRef.current = show.portraitGridUrl ?? "";
      } else if (hasActiveTrailerJob) {
        // If trailer is currently processing, set digest to prevent duplicate generation
        trailerDigestRef.current = show.portraitGridUrl ?? "";
        console.log("ℹ️  Trailer job active - preventing duplicate auto-generation");
      } else {
        trailerDigestRef.current = "";
        console.log("ℹ️  No trailer in show - will allow auto-generation");
      }
      console.log("✅ Show loaded successfully");
      
      // Check for any in-progress background tasks for this show
      if (typeof window !== 'undefined') {
        const activeTasks = getShowTasks(show.id);
        if (activeTasks.length > 0) {
          console.log(`📋 Found ${activeTasks.length} active background tasks for this show`);
          activeTasks.forEach(task => {
            console.log(`   - ${task.type} (${task.characterId || 'show-level'}): ${task.status}`);
            
            // Restore loading state and start polling for in-progress tasks
            if (task.characterId) {
              if (task.type === 'portrait' && (task.status === 'starting' || task.status === 'processing')) {
                console.log(`   🔄 Resuming portrait polling for ${task.characterId}`);
                setCharacterPortraitLoading(prev => ({
                  ...prev,
                  [task.characterId!]: true,
                }));
                portraitJobsRef.current.set(task.characterId, task.id);
                // TODO: Start portrait polling (will be added in useEffect below)
              } else if (task.type === 'video' && (task.status === 'starting' || task.status === 'processing')) {
                console.log(`   🔄 Resuming video polling for ${task.characterId}`);
                setCharacterVideoLoading(prev => ({
                  ...prev,
                  [task.characterId!]: true,
                }));
                videoJobsRef.current.set(task.characterId, task.id);
                videoStartTimesRef.current.set(task.characterId, Date.now());
                // TODO: Start video polling (will be added in useEffect below)
              }
            }
          });
        }
      }
      
      // Check completion status
      const completion = calculateShowCompletion({
        characterSeeds: show.characterSeeds,
        characterDocs: show.characterDocs,
        characterPortraits: show.characterPortraits,
        characterVideos: show.characterVideos,
        posterUrl: show.posterUrl,
        libraryPosterUrl: show.libraryPosterUrl,
        portraitGridUrl: show.portraitGridUrl,
        trailerUrl: show.trailerUrl,
      });
      
      console.log("📊 Show completion:", completion.completionPercentage + "%");
      
      // Log character dossier status
      if (show.characterSeeds && show.characterSeeds.length > 0) {
        const seedIds = show.characterSeeds.map(s => s.id);
        const docIds = Object.keys(show.characterDocs || {});
        const missingDocs = seedIds.filter(id => !docIds.includes(id));
        
        console.log("📝 Character dossier status:");
        console.log(`  Total seeds: ${seedIds.length}`);
        console.log(`  Total docs: ${docIds.length}`);
        if (missingDocs.length > 0) {
          console.log(`  ⚠️ Missing dossiers for:`, missingDocs.map(id => {
            const seed = show.characterSeeds.find(s => s.id === id);
            return `${seed?.name || id} (${id})`;
          }));
        } else {
          console.log(`  ✅ All character dossiers present`);
        }
      }
      
      if (!completion.isFullyComplete) {
        console.log("⚠️ Missing:", completion.missingItems);
        setShowCompletionBanner(true);
      } else {
        console.log("✅ Show is fully complete");
        setShowCompletionBanner(false);
      }
      
      // Small delay to ensure state has propagated before allowing saves
      setTimeout(() => {
        setIsLoadingShow(false);
        
        // Re-check for active trailer job now that show is loaded
        if (hasActiveTrailerJob) {
          try {
            const savedJob = localStorage.getItem('production-flow.trailer-job');
            if (savedJob) {
              const { jobId } = JSON.parse(savedJob);
              if (jobId && !trailerStatusPollRef.current) {
                console.log("🔄 Re-triggering trailer polling after show load");
                startTrailerStatusPolling(jobId, show.id);
              }
            }
          } catch (e) {
            // Ignore
          }
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to load show:", error);
      setError("Failed to load show from library");
      setIsLoadingShow(false);
    }
  }, [stopTrailerStatusPolling]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const pendingShowId = window.sessionStorage.getItem(LIBRARY_LOAD_STORAGE_KEY);
      if (!pendingShowId) return;
      window.sessionStorage.removeItem(LIBRARY_LOAD_STORAGE_KEY);
      if (pendingShowId === currentShowId) return;
      void loadShow(pendingShowId);
    } catch (error) {
      console.error("Failed to read pending library selection", error);
    }
  }, [currentShowId, loadShow]);

  // Load show from URL param (initialShowId) on mount
  useEffect(() => {
    if (!initialShowId || initialShowIdLoadedRef.current) return;
    initialShowIdLoadedRef.current = true;
    console.log("📍 Loading show from URL:", initialShowId);
    void loadShow(initialShowId);
  }, [initialShowId, loadShow]);

  // Update URL when show is created or loaded
  // Using history.replaceState to avoid triggering a route change/remount
  useEffect(() => {
    if (!currentShowId || !blueprint) return;
    // Skip if we already updated URL for this show
    if (urlUpdatedForShowRef.current === currentShowId) return;
    
    // Get the proper URL with slug
    const showUrl = getShowUrl({ 
      id: currentShowId, 
      blueprint: { show_title: blueprint.show_title }
    });
    const consoleUrl = showUrl.replace('/show/', '/console/');
    
    // Check if we're already on the correct URL
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      // Only update if we're on /console without ID or with wrong ID
      if (currentPath === '/console' || (currentPath.startsWith('/console/') && !currentPath.includes(currentShowId))) {
        console.log("📍 Updating URL to:", consoleUrl);
        // Use history.replaceState instead of router.replace to avoid 
        // triggering a route change which would remount the component
        window.history.replaceState(window.history.state, '', consoleUrl);
        urlUpdatedForShowRef.current = currentShowId;
      }
    }
  }, [currentShowId, blueprint]);

  // Handle initial prompt from landing page
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (blueprint || isLoading) return; // Skip if show already exists or loading
    
    try {
      const initialPrompt = window.sessionStorage.getItem("production-flow.initial-prompt");
      if (!initialPrompt) return;
      
      console.log("🎬 Initial prompt from landing page detected");
      window.sessionStorage.removeItem("production-flow.initial-prompt");
      
      setInput(initialPrompt);
      setShowPromptInput(true); // Show input when coming from landing page
      // Auto-submit after a brief delay
      setTimeout(() => {
        void submitPrompt(initialPrompt, model);
      }, 500);
    } catch (error) {
      console.error("Failed to read initial prompt:", error);
    }
  }, [blueprint, isLoading, model, submitPrompt]);

  const canGenerateLibraryPoster = useCallback(() => {
    console.log("🔍 Checking if can generate library poster:");
    
    // Must have blueprint with show data
    if (!blueprint?.visual_aesthetics) {
      console.log("   ❌ No blueprint with visual_aesthetics");
      return false;
    }
    console.log("   ✅ Blueprint exists");
    
    // Must have show title
    if (!blueprint.show_title) {
      console.log("   ⚠️  No show_title in blueprint");
    } else {
      console.log(`   ✅ Show title: "${blueprint.show_title}"`);
    }
    
    // Must have Replicate token
    if (!posterAvailable) {
      console.log("   ❌ No Replicate token (posterAvailable=false)");
      return false;
    }
    console.log("   ✅ Replicate token available");
    
    // CRITICAL: Must have portrait grid - this is REQUIRED for library poster
    if (!portraitGridUrl) {
      console.log("   ❌ Portrait grid not ready yet - REQUIRED for library poster");
      return false;
    }
    console.log("   ✅ Portrait grid URL:", portraitGridUrl.slice(0, 80) + "...");
    
    // Must NOT be currently loading grid
    if (portraitGridLoading) {
      console.log("   ⏳ Portrait grid still generating...");
      return false;
    }
    console.log("   ✅ Portrait grid not loading");
    
    // Must NOT be currently loading any portraits
    const isLoadingAnyPortrait = Object.values(characterPortraitLoading).some(Boolean);
    if (isLoadingAnyPortrait) {
      console.log("   ⏳ Portraits still loading, waiting...");
      return false;
    }
    console.log("   ✅ No portraits currently loading");
    console.log("   ✅ ALL CONDITIONS MET - Can generate library poster!");
    
    // Must have at least one COMPLETED character portrait with actual URL
    const completedPortraits = Object.values(characterPortraits).filter(url => url && typeof url === 'string' && url.length > 0);
    
    if (completedPortraits.length === 0) {
      console.log("⏳ No completed portraits yet - need at least 1 character portrait");
      return false;
    }
    
    console.log(`✅ Can generate library poster - grid ready with ${completedPortraits.length} portrait(s)`);
    return true;
  }, [blueprint, characterPortraits, characterPortraitLoading, posterAvailable, portraitGridUrl, portraitGridLoading]);

  // Build default library poster prompt with style guide
  const buildDefaultLibraryPosterPrompt = useCallback(() => {
    if (!blueprint) return "";
    
    const showTitle = blueprint.show_title || "Untitled Show";
    const logline = blueprint.show_logline || "";
    const productionStyle = blueprint.production_style;
    const guardrailLines = stylizationGuardrails
      ? [
          "",
          "CRITICAL: DO NOT use photorealistic rendering. MUST match the specified visual style exactly.",
          "Use theatrical/stylized treatment, NOT photorealistic rendering.",
        ]
      : [];
    
    const styleGuideLines = productionStyle
      ? [
          `Production Medium: ${productionStyle.medium || 'Stylized cinematic'}`,
          `Visual References: ${(productionStyle.cinematic_references || []).join(', ')}`,
          `Stylization Level: ${productionStyle.stylization_level || 'moderately stylized'}`,
          `Visual Treatment: ${productionStyle.visual_treatment || 'Cinematic theatrical style'}`,
          ...guardrailLines,
        ]
      : [
          stylizationGuardrails ? "Use theatrical/stylized treatment, NOT photorealistic rendering." : null,
          "Display the show title prominently with bold typography.",
        ].filter(Boolean) as string[];
    
    const styleGuide = styleGuideLines.join("\n");
    
    return [
      "Create a show poster for:",
      "",
      `Show Title: ${showTitle}`,
      "",
      `Show Description: ${logline}`,
      "",
      `Style Guide:`,
      styleGuide,
      "",
      "I have attached the character sheet. Use some of the characters in the poster.",
    ].join("\n");
  }, [blueprint, stylizationGuardrails]);

  const buildDefaultTrailerPrompt = useCallback(() => {
    if (!blueprint) return "";
    
    const showTitle = blueprint.show_title || "Untitled Show";
    const logline = blueprint.show_logline || "";
    const productionStyle = blueprint.production_style;
    const productionMedium = productionStyle?.medium || "";
    const cinematicReferences = (productionStyle?.cinematic_references || []).join(", ");
    const visualTreatment = productionStyle?.visual_treatment || "";
    const stylizationLevel = productionStyle?.stylization_level || "";

    // Use the global template if available
    if (trailerTemplate) {
      return trailerTemplate
        .replace(/{SHOW_TITLE}/g, showTitle)
        .replace(/{LOGLINE}/g, logline)
        .replace(/{PRODUCTION_MEDIUM}/g, productionMedium)
        .replace(/{CINEMATIC_REFERENCES}/g, cinematicReferences)
        .replace(/{VISUAL_TREATMENT}/g, visualTreatment)
        .replace(/{STYLIZATION_LEVEL}/g, stylizationLevel);
    }

    // Fallback to hardcoded default
    return `Create an iconic teaser trailer for the series "${showTitle}".

${logline}

TRAILER REQUIREMENTS:

1. OPENING TITLE CARD: Begin with a striking title card displaying "${showTitle}" in beautiful, bold typography that matches the show's aesthetic. The title should be elegant, memorable, and set the tone for what follows. Hold for 2-3 seconds.

2. VOICEOVER NARRATION: Include a professional, CINEMATIC trailer voiceover that sounds like an ACTUAL movie trailer - NOT someone reading a script or explaining the show:
   
   CRITICAL: The voiceover must be ENGAGING, DRAMATIC, and ICONIC - like the voice actors in real Hollywood trailers.
   
   Genre-Specific Voice Direction:
   - For COMEDY: The "In a World" guy doing comedy - dry wit, impeccable timing, knowing irony. Think: casual cool meets sharp humor
   - For ACTION: Deep, gravelly, INTENSE voice (think: Hans Zimmer trailer narrator). Every word drips with stakes and danger
   - For HORROR: Whispered menace, bone-chilling calm before the storm. Not explaining - HAUNTING
   - For DRAMA: Emotional power, thoughtful gravitas, pulls at heartstrings. Raw and real
   - For ADVENTURE: Epic, wonder-struck, makes you FEEL the journey. Grand and inspiring
   
   VOICEOVER STYLE RULES:
   ✓ Short, punchy phrases that PUNCTUATE visuals
   ✓ Build tension and intrigue with each line
   ✓ Use trailer-speak: fragments, dramatic pauses, building rhythm
   ✓ Match the energy of what's on screen
   ✓ End lines on power words that hit hard
   ✓ Create mystery - DON'T explain everything
   
   ✗ NEVER sound like: "This is a show about..." or "Meet the characters who..."
   ✗ NEVER be explanatory or expository
   ✗ NEVER use boring, flat narration
   ✗ NEVER sound like a documentary narrator

3. Study the character grid reference image to understand the cast, weaving them into the narrative
4. Create a well-paced, exciting montage that captures the show's core vibe and genre
5. Showcase the MOST INTERESTING and ICONIC moments that would make viewers want to watch
6. Build anticipation and intrigue through dynamic editing, compelling visuals, and punchy narration`;
  }, [blueprint, trailerTemplate]);

  const generateLibraryPoster = useCallback(async (customPrompt?: string) => {
    const canGenerate = canGenerateLibraryPoster();
    
    if (!canGenerate || !blueprint) {
      return null;
    }
    
    // MUST have portrait grid to generate library poster
    if (!portraitGridUrl) {
      console.log("❌ Portrait grid not ready yet - REQUIRED for library poster");
      console.log("   portraitGridUrl is:", portraitGridUrl);
      return null;
    }

    const showTitle = blueprint.show_title || "Untitled Show";
    const promptToUse = customPrompt || buildDefaultLibraryPosterPrompt();

    console.log("=== LIBRARY POSTER GENERATION START ===");
    console.log("✅ All prerequisites met:");
    console.log("   ✓ Blueprint exists");
    console.log("   ✓ Portrait grid URL:", portraitGridUrl.slice(0, 80) + "...");
    console.log("   ✓ Show title from blueprint:", blueprint.show_title);
    console.log("   ✓ Show title to use in poster:", showTitle);
    console.log("   ✓ Custom prompt:", customPrompt ? "YES" : "NO");
    console.log("   ✓ Selected image model:", imageModel);
    console.log("\nBlueprint data being sent to API:");
    console.log("   - show_title:", JSON.stringify(blueprint.show_title));
    console.log("   - production_style.medium:", blueprint.production_style?.medium);
    console.log("   - Full blueprint keys:", Object.keys(blueprint).slice(0, 15).join(', '));
    console.log("\nAPI Request Details:");
    console.log("   - Endpoint: /api/library-poster");
    console.log("   - Method: POST");
    console.log("   - Body fields: prompt, characterImageUrl, showData, imageModel");
    
    // Create background task
    const posterTaskId = `library-poster-${Date.now()}`;
    if (currentShowId) {
      addBackgroundTask({
        id: posterTaskId,
        type: 'library-poster',
        showId: currentShowId,
        status: 'starting',
        stepNumber: 7,
        metadata: {
          showTitle: blueprint.show_title || "Untitled Show",
        },
      });
      console.log(`📝 Created background task for library poster`);
    }
    
    setLibraryPosterLoading(true);
    setLibraryPosterError(null); // Clear any previous errors
    try {
      if (currentShowId) {
        updateBackgroundTask(posterTaskId, { status: 'processing' });
      }
      
      console.log("📤 Sending library poster request...");
      console.log("   Full prompt length:", promptToUse.length);
      console.log("   Prompt preview:", promptToUse.slice(0, 200) + "...");
      console.log("   Portrait grid URL:", portraitGridUrl.slice(0, 80) + "...");
      console.log("   Image model:", imageModel);
      console.log("   Show title from blueprint:", blueprint.show_title);
      
      // Retry logic for library poster
      const MAX_LIBRARY_POSTER_ATTEMPTS = 5;
      let lastError: Error | null = null;
      let result: { url?: string } | null = null;
      
      for (let attempt = 1; attempt <= MAX_LIBRARY_POSTER_ATTEMPTS; attempt++) {
        try {
          console.log(`📤 Library poster attempt ${attempt}/${MAX_LIBRARY_POSTER_ATTEMPTS}...`);
          
          const response = await fetch("/api/library-poster", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: promptToUse,
              characterImageUrl: portraitGridUrl,
              showData: blueprint,
              imageModel,
            }),
          });
          
          console.log("📥 Library poster API response status:", response.status);

          if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType?.includes("text/html")) {
              throw new Error(`Library poster generation failed with server error (${response.status}). Please try again.`);
            }
            
            const body = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(body?.error ?? "Failed to generate library poster");
          }

          const contentType = response.headers.get("content-type");
          if (!contentType?.includes("application/json")) {
            throw new Error("Library poster generation returned unexpected response format.");
          }

          result = (await response.json()) as { url?: string };
          if (result?.url) {
            break; // Success!
          }
        } catch (attemptError) {
          lastError = attemptError instanceof Error ? attemptError : new Error("Unknown error");
          const msg = lastError.message;
          
          const isContentFilter = /sensitive/i.test(msg) || /flagged/i.test(msg) || /E005/i.test(msg);
          const isRateLimit = /429/i.test(msg) || /rate.?limit/i.test(msg) || /too many requests/i.test(msg);
          const isRetryable = isContentFilter || isRateLimit;
          
          console.warn(`Library poster attempt ${attempt}/${MAX_LIBRARY_POSTER_ATTEMPTS} failed:`, msg);
          
          if (isRetryable && attempt < MAX_LIBRARY_POSTER_ATTEMPTS) {
            const retryDelay = isRateLimit ? 3000 + (attempt * 2000) : 1500;
            console.log(`🔄 ${isRateLimit ? 'Rate limited' : 'Content filtered'} - retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          
          throw lastError;
        }
      }
      
      if (result?.url) {
        setLibraryPosterUrl(result.url);
        
        // Update background task as succeeded
        if (currentShowId) {
          updateBackgroundTask(posterTaskId, { 
            status: 'succeeded', 
            outputUrl: result.url 
          });
          setTimeout(() => removeBackgroundTask(posterTaskId), 5000);
        }
        
        return result.url;
      }
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate library poster";
      console.error("❌ Failed to generate library poster:", errorMessage);
      console.error("   Full error:", error);
      
      setLibraryPosterError(errorMessage);
      
      // Update background task as failed
      if (currentShowId) {
        updateBackgroundTask(posterTaskId, { 
          status: 'failed', 
          error: errorMessage
        });
        setTimeout(() => removeBackgroundTask(posterTaskId), 10000);
      }
      
      return null;
    } finally {
      setLibraryPosterLoading(false);
    }
  }, [blueprint, posterAvailable, portraitGridUrl, canGenerateLibraryPoster, buildDefaultLibraryPosterPrompt, imageModel, currentShowId]);

  const saveCurrentShow = useCallback(async (forceLibraryPoster = false) => {
    if (!blueprint) return;
    if (!currentShowId) return; // Don't save if no ID yet
    if (isLoadingShow) {
      console.log("⏸️ Skipping save - show is currently loading");
      return;
    }

    // Generate library poster ONLY if forced or meets all requirements
    let finalLibraryPosterUrl = libraryPosterUrl;
    
    console.log("💾 Save params:", {
      forceLibraryPoster,
      hasExistingLibraryPoster: !!finalLibraryPosterUrl,
      libraryPosterUrlValue: finalLibraryPosterUrl?.slice(0, 60) || "null",
    });
    
    if (forceLibraryPoster && !finalLibraryPosterUrl) {
      const canGenerate = canGenerateLibraryPoster();
      const hasGrid = !!portraitGridUrl;
      console.log("📝 Can generate library poster?", canGenerate);
      console.log("📝 Has portrait grid?", hasGrid);
      
      if (canGenerate && hasGrid) {
        console.log("🎬 Force-generating library poster with portrait grid...");
        const generated = await generateLibraryPoster();
        if (generated) {
          finalLibraryPosterUrl = generated;
          console.log("✅ Library poster generated and will be saved:", generated.slice(0, 80) + "...");
        } else {
          console.log("❌ Library poster generation returned null");
        }
      } else if (!hasGrid) {
        console.log("⏭️ Cannot generate library poster yet - portrait grid required");
      } else {
        console.log("⏭️ Cannot generate library poster yet (missing other requirements)");
      }
    } else if (finalLibraryPosterUrl) {
      console.log("✅ Using existing library poster URL:", finalLibraryPosterUrl.slice(0, 60));
    } else {
      console.log("ℹ️  No library poster (not forced or doesn't exist yet)");
    }

    try {
      const saveData = {
        id: currentShowId,
        blueprint,
        rawJson,
        usage,
        model: activeModel,
        characterSeeds: characterSeeds || [],
        characterDocs: characterDocs || {},
        characterPortraits: characterPortraits || {},
        characterVideos: characterVideos || {},
        posterUrl: posterUrl || null,
        libraryPosterUrl: finalLibraryPosterUrl || null,
        portraitGridUrl: portraitGridUrl || null,
        trailerUrl: trailerUrl || null,
        // NEW: Essential data
        originalPrompt: lastPrompt,
        customPortraitPrompts: editedPortraitPrompts,
        customVideoPrompts: editedVideoPrompts,
        customPosterPrompt: editedPosterPrompt || null,
        customTrailerPrompt: editedTrailerPrompt || null,
        videoModelId,
        videoSeconds,
        videoAspectRatio,
        videoResolution,
        trailerModel,
        // Episode format and loglines
        showFormat: showFormat || null,
        episodes: episodes || [],
      };
      
      const totalVideos = Object.values(characterVideos || {}).reduce((sum, arr) => sum + arr.length, 0);
      const portraitCount = Object.keys(characterPortraits || {}).filter(k => characterPortraits[k]).length;
      
      console.log(`💾 Updating show ${currentShowId}:`, {
        characters: characterSeeds?.length || 0,
        dossiers: Object.keys(characterDocs || {}).length,
        portraits: portraitCount,
        videos: totalVideos,
        hasPoster: !!posterUrl,
        hasLibraryPoster: !!finalLibraryPosterUrl,
        hasPortraitGrid: !!portraitGridUrl,
        hasTrailer: !!trailerUrl,
        hasShowFormat: !!showFormat,
        episodeCount: episodes?.length || 0,
      });
      
      console.log("  Library poster URL being saved:", finalLibraryPosterUrl);
      console.log("  Poster URL being saved:", posterUrl);
      console.log("  Portrait data being saved:", characterPortraits);
      console.log("  Video data being saved:", characterVideos);
      
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) throw new Error("Failed to save show");
      console.log("✅ Show updated");
    } catch (error) {
      console.error("❌ Failed to save show:", error);
    }
  }, [
    blueprint, 
    rawJson, 
    usage, 
    activeModel, 
    characterSeeds, 
    characterDocs, 
    characterPortraits, 
    characterVideos, 
    posterUrl, 
    libraryPosterUrl, 
    portraitGridUrl, 
    trailerUrl, 
    currentShowId, 
    isLoadingShow, 
    generateLibraryPoster, 
    canGenerateLibraryPoster,
    lastPrompt,
    editedPortraitPrompts,
    editedVideoPrompts,
    editedPosterPrompt,
    editedTrailerPrompt,
    videoModelId,
    videoSeconds,
    videoAspectRatio,
    videoResolution,
    trailerModel,
    showFormat,
    episodes,
  ]);


  // Auto-generate missing assets after loading a show (ONE TIME PER SHOW)
  useEffect(() => {
    if (!autopilotMode) return; // Only auto-generate when autopilot is ON
    if (!blueprint) return;
    if (isLoadingShow) return; // Wait until show is fully loaded
    if (!posterAvailable) return;
    if (!currentShowId) return; // Need a show ID to save
    
    // Only check once per show load
    if (autoGenCheckedShowIdRef.current === currentShowId) {
      return; // Already checked this show
    }
    
    console.log("🔍 Checking for missing assets on show:", currentShowId);
    
    // Auto-generate library poster if missing but we have portrait grid
    if (!libraryPosterUrl && !libraryPosterLoading && portraitGridUrl) {
      console.log("🎨 Auto-generating missing library poster (portrait grid exists)");
      setTimeout(async () => {
        const newUrl = await generateLibraryPoster();
        if (newUrl) {
          // Save the show with the new poster
          setTimeout(() => void saveCurrentShow(false), 500);
        }
      }, 2000);
    }
    
    // Auto-generate portrait grid if missing but we have enough portraits
    if (!portraitGridUrl && !portraitGridLoading && characterSeeds) {
      const validPortraits = Object.values(characterPortraits).filter(url => url && typeof url === 'string' && url.length > 0);
      if (validPortraits.length >= 4) {
        console.log("🖼️ Auto-generating missing portrait grid");
        // Portrait grid will be auto-generated by the existing useEffect below
        // No need to manually trigger - just ensure the digest is clear
        if (portraitGridDigestRef.current === "") {
          console.log("   Portrait grid digest is clear, auto-gen will trigger");
        }
      }
    }
    
    // Mark this show as checked
    autoGenCheckedShowIdRef.current = currentShowId;
    console.log("✅ Auto-gen check complete for show:", currentShowId);
  }, [autopilotMode, blueprint, isLoadingShow, posterAvailable, libraryPosterUrl, libraryPosterLoading, portraitGridUrl, portraitGridLoading, characterPortraits, characterSeeds, currentShowId, saveCurrentShow, generateLibraryPoster]);

  // Auto-generate library poster when portrait grid becomes available
  useEffect(() => {
    if (!autopilotMode) return; // Only auto-generate when autopilot is ON
    if (!portraitGridUrl || !blueprint || !currentShowId) return;
    if (libraryPosterUrl || libraryPosterLoading) return; // Already have or generating
    
    // Check if we should auto-generate
    const canGenerate = canGenerateLibraryPoster();
    if (!canGenerate) return;
    
    console.log("🎨 Portrait grid ready! Auto-generating library poster...");
    console.log("   Portrait grid URL:", portraitGridUrl.slice(0, 80) + "...");
    console.log("   Show title:", blueprint.show_title);
    
    // Small delay to ensure grid is fully saved
    const timer = setTimeout(async () => {
      const newUrl = await generateLibraryPoster();
      if (newUrl) {
        console.log("✅ Library poster auto-generated:", newUrl.slice(0, 80) + "...");
        // Save the show with the new poster
        setTimeout(() => void saveCurrentShow(false), 500);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [autopilotMode, portraitGridUrl, libraryPosterUrl, libraryPosterLoading, blueprint, currentShowId, canGenerateLibraryPoster, generateLibraryPoster, saveCurrentShow]);
  
  // Generate Show Format
  const generateShowFormat = useCallback(async () => {
    if (!blueprint || !characterSeeds) return;
    
    setShowFormatLoading(true);
    try {
      console.log("🎬 Generating show format for:", blueprint.show_title);
      
      const response = await fetch("/api/show-format/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprint,
          characterSeeds,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate show format");
      }
      
      const result = await response.json();
      setShowFormat(result.format);
      console.log("✅ Show format generated successfully");
    } catch (error) {
      console.error("❌ Failed to generate show format:", error);
    } finally {
      setShowFormatLoading(false);
    }
  }, [blueprint, characterSeeds]);

  // Generate Episodes
  const generateEpisodes = useCallback(async () => {
    if (!blueprint || !characterSeeds || !showFormat) return;
    
    setEpisodesLoading(true);
    try {
      console.log("📺 Generating episodes for:", blueprint.show_title);
      
      const response = await fetch("/api/episodes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprint,
          characterSeeds,
          showFormat,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate episodes");
      }
      
      const result = await response.json();
      setEpisodes(result.episodes || []);
      setSeasonArc(result.seasonArc || null);
      console.log("✅ Episodes generated successfully:", result.episodes?.length || 0);
    } catch (error) {
      console.error("❌ Failed to generate episodes:", error);
    } finally {
      setEpisodesLoading(false);
    }
  }, [blueprint, characterSeeds, showFormat]);
  
  // Auto-save when character data or episodes change
  const lastSaveRef = useRef<string>("");
  const posterDigestRef = useRef<string>("");
  const portraitGridDigestRef = useRef<string>("");
  const trailerDigestRef = useRef<string>("");
  useEffect(() => {
    if (blueprint && currentShowId) {
      const hasAnyData = 
        Object.keys(characterDocs).length > 0 ||
        Object.keys(characterPortraits).length > 0 ||
        Object.keys(characterVideos).length > 0 ||
        showFormat !== null ||
        episodes.length > 0;
      
      if (hasAnyData) {
        // Create a hash to prevent duplicate saves
        const saveHash = JSON.stringify({
          docs: Object.keys(characterDocs).sort(),
          portraits: Object.keys(characterPortraits).filter(k => characterPortraits[k]).sort(),
          videos: Object.keys(characterVideos).filter(k => characterVideos[k]).sort(),
          poster: posterUrl ?? null,
          libraryPoster: libraryPosterUrl ?? null,
          grid: portraitGridUrl ?? null,
          trailer: trailerUrl ?? null,
          showFormat: showFormat ? 'yes' : null,
          episodeCount: episodes.length,
          // Include custom prompts in save hash so they trigger saves
          customTrailerPrompt: editedTrailerPrompt || null,
          customPosterPrompt: editedPosterPrompt || null,
        });
        
        if (saveHash !== lastSaveRef.current) {
          lastSaveRef.current = saveHash;
          void saveCurrentShow(false);
        }
      }
    }
  }, [
    blueprint,
    currentShowId,
    characterDocs,
    characterPortraits,
    characterVideos,
    posterUrl,
    libraryPosterUrl,
    portraitGridUrl,
    trailerUrl,
    showFormat,
    episodes,
    editedTrailerPrompt,
    editedPosterPrompt,
    saveCurrentShow,
  ]);

  // Show loading screen when loading a show from URL
  if (isLoadingShow && !blueprint) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-foreground/60">Loading show...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-foreground overflow-x-hidden max-w-[100vw] w-full">
      {/* Lightbox */}
      {lightboxImage ? (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200 p-4 sm:p-6"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute right-3 top-3 sm:right-6 sm:top-6 z-10 rounded-full border border-white/20 bg-black/80 p-2.5 sm:p-3 text-white shadow-lg backdrop-blur-md transition-all hover:bg-primary hover:border-primary/40 active:scale-95 touch-manipulation"
            aria-label="Close"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <div className="relative max-h-[88vh] max-w-[92vw] sm:max-h-[92vh] animate-in zoom-in-95 duration-300">
            <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
              <Image
                src={lightboxImage}
                alt="Full size view"
                width={2048}
                height={2048}
                className="h-auto max-h-[88vh] sm:max-h-[92vh] w-auto max-w-[92vw] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <p className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-white/60">
              Tap anywhere to close
            </p>
          </div>
        </div>
      ) : null}
      
      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent onClose={() => setShowSettingsDialog(false)}>
          <DialogHeader>
            <DialogTitle>Model Settings</DialogTitle>
            <DialogDescription>
              Configure which AI models to use for different generation tasks.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            {/* Blueprint Model */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                Blueprint Model
              </label>
              <p className="text-xs text-foreground/60">
                Used for generating show bibles and character documents
              </p>
              <div className="space-y-2">
                {MODEL_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setModel(option.id)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition-all",
                      model === option.id
                        ? "border-primary bg-primary/10"
                        : "border-white/10 bg-black/20 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{option.label}</p>
                        <p className="text-xs text-foreground/60">{option.helper}</p>
                      </div>
                      {model === option.id && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Model */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                Image Model
              </label>
              <p className="text-xs text-foreground/60">
                Used for character portraits, posters, and all static images
              </p>
              <div className="space-y-2">
                {IMAGE_MODEL_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setImageModel(option.id)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition-all",
                      imageModel === option.id
                        ? "border-primary bg-primary/10"
                        : "border-white/10 bg-black/20 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{option.label}</p>
                        <p className="text-xs text-foreground/60">{option.description}</p>
                      </div>
                      {imageModel === option.id && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Video Generation Model */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                Video Generation Model
              </label>
              <p className="text-xs text-foreground/60">
                Used for character videos and trailers
              </p>
              <div className="space-y-2">
                {VIDEO_GENERATION_MODEL_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setVideoGenModel(option.id)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition-all",
                      videoGenModel === option.id
                        ? "border-primary bg-primary/10"
                        : "border-white/10 bg-black/20 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{option.label}</p>
                        <p className="text-xs text-foreground/60">{option.description}</p>
                      </div>
                      {videoGenModel === option.id && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setShowSettingsDialog(false)}
              className="rounded-full"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Background Tasks Indicator */}
      <BackgroundTasksIndicator 
        showId={currentShowId} 
        isOpen={isPipelinePanelOpen}
        onOpenChange={setIsPipelinePanelOpen}
      />
      
      {/* Main Navigation */}
      <Navbar variant="solid" />
      
      {/* Console Toolbar - hidden on mobile, shows on sm+ */}
      <div className="hidden sm:block fixed top-[72px] sm:top-[88px] left-0 right-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-2 px-4 sm:px-6 py-2">
          <span className="text-xs text-foreground/50">Console Workspace</span>
          <div className="flex items-center gap-1 sm:gap-2">
            {blueprint ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startNewShow}
                className="gap-1.5 rounded-full h-8 px-3 text-xs touch-manipulation"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New</span>
              </Button>
            ) : null}
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsPipelinePanelOpen(true)}
              className="gap-1.5 rounded-full h-8 px-3 text-xs touch-manipulation"
              title="Production Pipeline Tracker"
            >
              <ListChecks className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Pipeline</span>
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsDialog(true)}
              className="gap-1.5 rounded-full h-8 px-3 text-xs touch-manipulation"
              title="Model Settings"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Settings</span>
            </Button>
            
            <label htmlFor="model-select" className="sr-only">Model</label>
            <select
              id="model-select"
              value={model}
              onChange={(event) => setModel(event.target.value as ModelId)}
              className="hidden sm:block rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-foreground/75 focus:outline-none focus:ring-2 focus:ring-primary/50 touch-manipulation h-8"
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <main className="flex-1 pb-[100px] sm:pb-[120px] md:pb-32 pt-[72px] sm:pt-[130px] overflow-x-hidden">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 sm:gap-5 md:gap-6 px-4 sm:px-5 md:px-6 py-4 sm:py-6 md:py-10">
          {error ? (
            <div className="space-y-2 rounded-xl sm:rounded-2xl md:rounded-3xl border border-red-500/40 bg-red-500/10 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 text-xs sm:text-sm animate-in slide-in-from-top-2 duration-300">
              <p className="font-semibold text-red-200 text-sm sm:text-base">Request failed</p>
              <p className="text-red-200/85 break-words">{error}</p>
            </div>
          ) : null}

          {showCompletionBanner && blueprint ? (() => {
            const completion = calculateShowCompletion({
              characterSeeds: characterSeeds || undefined,
              characterDocs,
              characterPortraits,
              characterVideos,
              posterUrl,
              libraryPosterUrl,
              portraitGridUrl,
              trailerUrl,
            });
            
            return (
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-white/40 shrink-0" />
                    <p className="text-xs text-white/50">Show loaded - {completion.completionPercentage}% complete</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCompletionBanner(false)}
                    className="text-white/40 hover:text-white/60 shrink-0 h-6 w-6 p-0 touch-manipulation"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })() : null}

          <ResultView
            blueprint={blueprint}
            usage={usage}
            rawJson={rawJson}
            model={activeModel}
            currentShowId={currentShowId}
            characterSeeds={characterSeeds}
            charactersLoading={charactersLoading}
            charactersError={charactersError}
            characterDocs={characterDocs}
            characterBuilding={characterBuilding}
            characterBuildErrors={characterBuildErrors}
            characterPortraits={characterPortraits}
            characterPortraitLoading={characterPortraitLoading}
            characterPortraitLoaded={characterPortraitLoaded}
            characterPortraitErrors={characterPortraitErrors}
            portraitRetryCounts={portraitRetryCounts}
            portraitLlmAdjustments={portraitLlmAdjustments}
            editedPortraitPrompts={editedPortraitPrompts}
            onSetEditedPortraitPrompt={setEditedPortraitPrompts}
            characterVideos={characterVideos}
            characterVideoLoading={characterVideoLoading}
            characterVideoErrors={characterVideoErrors}
            editedVideoPrompts={editedVideoPrompts}
            selectedVideoIndex={selectedVideoIndex}
            onSetSelectedVideoIndex={setSelectedVideoIndex}
            onSetEditedVideoPrompt={setEditedVideoPrompts}
            onBuildCharacter={buildCharacter}
            onSelectCharacter={handleSelectCharacter}
            onClearActiveCharacter={handleClearActiveCharacter}
            onGeneratePortrait={generateCharacterPortrait}
            onPortraitLoaded={handlePortraitLoaded}
            onGenerateVideo={generateCharacterVideo}
            activeCharacterId={activeCharacterId}
            posterUrl={posterUrl}
            posterLoading={posterLoading}
            posterError={posterError}
            posterAvailable={posterAvailable}
            editedPosterPrompt={editedPosterPrompt}
            onSetEditedPosterPrompt={setEditedPosterPrompt}
            isLoading={isLoading}
            videoModelId={videoModelId}
            videoSeconds={videoSeconds}
            videoAspectRatio={videoAspectRatio}
            videoResolution={videoResolution}
            onVideoModelChange={(value) => setVideoModelId(value)}
            onVideoSecondsChange={(value) => setVideoSeconds(value)}
            onVideoAspectRatioChange={(value) => setVideoAspectRatio(value)}
            onVideoResolutionChange={(value) => setVideoResolution(value)}
            libraryPosterUrl={libraryPosterUrl}
            libraryPosterLoading={libraryPosterLoading}
            libraryPosterError={libraryPosterError}
            portraitGridUrl={portraitGridUrl}
            portraitGridLoading={portraitGridLoading}
            portraitGridError={portraitGridError}
            trailerUrl={trailerUrl}
            trailerLoading={trailerLoading}
            trailerError={trailerError}
            trailerStatus={trailerStatus}
            trailerElapsed={trailerElapsed}
            editedTrailerPrompt={editedTrailerPrompt}
            onSetEditedTrailerPrompt={setEditedTrailerPrompt}
            trailerFindText={trailerFindText}
            setTrailerFindText={setTrailerFindText}
            trailerReplaceText={trailerReplaceText}
            setTrailerReplaceText={setTrailerReplaceText}
            trailerRetryModel={trailerRetryModel}
            setTrailerRetryModel={setTrailerRetryModel}
            trailerRetryCount={trailerRetryCount}
            trailerUsedLlmAdjustment={trailerUsedLlmAdjustment}
            trailerLlmAdjustmentReason={trailerLlmAdjustmentReason}
            trailerAdjustingPrompt={trailerAdjustingPrompt}
            trailerOriginalPrompt={trailerOriginalPrompt}
            trailerAdjustedPrompt={trailerAdjustedPrompt}
            buildDefaultTrailerPrompt={buildDefaultTrailerPrompt}
            buildDefaultLibraryPosterPrompt={buildDefaultLibraryPosterPrompt}
            onGenerateTrailer={(model, customPrompt) => void generateTrailer(model, customPrompt)}
            onRegenerateGrid={() => {
              // Manual grid generation - works with any available portraits
              if (!characterSeeds || characterSeeds.length === 0) return;
              
              const portraitsData = characterSeeds
                .map((seed) => {
                  const url = characterPortraits[seed.id];
                  if (!url) return null;
                  return { id: seed.id, name: seed.name, url };
                })
                .filter((entry): entry is { id: string; name: string; url: string } => Boolean(entry));
              
              if (portraitsData.length === 0) {
                setPortraitGridError("No portraits available to generate grid.");
                return;
              }
              
              console.log(`🖼️ Manually generating portrait grid with ${portraitsData.length} portraits`);
              
              // Clear existing and regenerate
              portraitGridDigestRef.current = "";
              setPortraitGridUrl(null);
              setPortraitGridLoading(true);
              setPortraitGridError(null);
              
              const gridTaskId = `portrait-grid-${currentShowId}`;
              
              void (async () => {
                if (currentShowId) {
                  addBackgroundTask({
                    id: gridTaskId,
                    type: 'portrait-grid',
                    showId: currentShowId,
                    status: 'starting',
                    stepNumber: 6,
                    metadata: {
                      showTitle: blueprint?.show_title || "Untitled Show",
                      portraitCount: portraitsData.length,
                    },
                  });
                }
                
                try {
                  if (currentShowId) {
                    updateBackgroundTask(gridTaskId, { status: 'processing' });
                  }
                  
                  const response = await fetch("/api/characters/portrait-grid", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      portraits: portraitsData,
                      columns: Math.min(3, portraitsData.length),
                    }),
                  });
                  
                  if (!response.ok) {
                    const body = (await response.json().catch(() => null)) as { error?: string } | null;
                    const message = body?.error ?? `Failed to generate portrait grid (${response.status})`;
                    throw new Error(message);
                  }
                  
                  const result = (await response.json()) as { url?: string };
                  if (result.url) {
                    setPortraitGridUrl(result.url);
                    portraitGridDigestRef.current = JSON.stringify(portraitsData.map(p => p.url));
                    playSuccessChime();
                    
                    if (currentShowId) {
                      updateBackgroundTask(gridTaskId, {
                        status: 'succeeded',
                        completedAt: Date.now(),
                        outputUrl: result.url,
                      });
                      setTimeout(() => removeBackgroundTask(gridTaskId), 5000);
                    }
                  } else {
                    throw new Error("Portrait grid response missing URL.");
                  }
                } catch (error) {
                  console.error("Failed to compose portrait grid:", error);
                  const message = error instanceof Error ? error.message : "Unable to compose portrait grid.";
                  setPortraitGridError(message);
                  portraitGridDigestRef.current = "";
                  
                  if (currentShowId) {
                    updateBackgroundTask(gridTaskId, { status: 'failed', error: message });
                    setTimeout(() => removeBackgroundTask(gridTaskId), 10000);
                  }
                } finally {
                  setPortraitGridLoading(false);
                }
              })();
            }}
            onRegeneratePoster={async (customPrompt?: string) => {
              console.log("🔄 Regenerating library poster...");
              console.log("   Custom prompt:", customPrompt ? "YES" : "NO");
              
              // Don't clear the poster URL - keep showing old one during generation
              // generateLibraryPoster handles loading state
              try {
                const newUrl = await generateLibraryPoster(customPrompt);
                if (newUrl) {
                  console.log("✅ New poster generated:", newUrl.slice(0, 80) + "...");
                  // The new URL is already set by generateLibraryPoster
                  // Save the show with the new poster
                  await saveCurrentShow(false);
                  console.log("✅ Show saved with new poster");
                } else {
                  console.warn("⚠️ Poster generation returned null");
                }
              } catch (error) {
                console.error("❌ Failed to regenerate poster:", error);
              }
            }}
            editedLibraryPosterPrompt={editedLibraryPosterPrompt}
            setEditedLibraryPosterPrompt={setEditedLibraryPosterPrompt}
            onClearTrailer={() => {
              console.log("🗑️ Clearing trailer state");
              stopTrailerStatusPolling();
              trailerStatusJobIdRef.current = null;
              setTrailerUrl(null);
              setTrailerError(null);
              setTrailerStatus(null);
              setTrailerElapsed(0);
              setTrailerStartTime(null);
              setTrailerLoading(false); // Clear loading state too!
              trailerDigestRef.current = ""; // Allow regeneration
            }}
            onClearTrailerError={() => setTrailerError(null)}
            onOpenLightbox={(url) => setLightboxImage(url)}
            trailerModel={trailerModel}
            stylizationGuardrails={stylizationGuardrails}
            toggleStylizationGuardrails={toggleStylizationGuardrails}
            autopilotMode={autopilotMode}
            setAutopilotMode={setAutopilotMode}
            showFormat={showFormat}
            showFormatLoading={showFormatLoading}
            episodes={episodes}
            episodesLoading={episodesLoading}
            seasonArc={seasonArc}
            onGenerateShowFormat={generateShowFormat}
            onGenerateEpisodes={generateEpisodes}
            lastPrompt={lastPrompt}
          />
        </div>
      </main>

      {/* Show input only when starting a new show or when no blueprint exists */}
      {(showPromptInput || !blueprint) ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/12 bg-black/95 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-5 md:px-6 py-3 sm:py-4">
            <form onSubmit={handleSubmit}>
              <div
                className={cn(
                  "flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border bg-black/70 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition-all duration-200",
                  "focus-within:border-primary/50 focus-within:bg-black/80 focus-within:shadow-[0_10px_35px_rgba(229,9,20,0.3)]",
                  !blueprint ? "border-primary/40" : "border-white/15"
                )}
              >
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                  placeholder="Describe your show..."
                  className={cn(
                    "min-h-[48px] sm:min-h-[44px] md:h-11 md:min-h-0 flex-1 resize-none border-none bg-transparent px-0 py-2.5 sm:py-2 md:py-0 text-sm sm:text-base font-medium leading-snug text-foreground caret-primary placeholder:text-foreground/45 placeholder:font-normal rounded-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-none focus-visible:outline-none touch-manipulation"
                  )}
                  rows={1}
                onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (canSubmit) {
                      void submitPrompt(input, model);
                    }
                  }
                }}
              />
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                  className={cn(
                    "shrink-0 rounded-full bg-primary px-4 sm:px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(229,9,20,0.35)] transition-all duration-200 min-h-[48px] sm:min-h-[44px] md:min-h-0 touch-manipulation active:scale-95",
                    "hover:bg-primary/90 hover:shadow-[0_14px_36px_rgba(229,9,20,0.55)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100"
                  )}
                  >
                    {isLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-4.5 md:h-5 md:w-5 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="hidden sm:inline">Send</span>
                      <SendHorizontal className="h-4 w-4 sm:h-4 md:h-4.5 md:w-4.5" />
                    </div>
                    )}
                  </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Default export for /console route (no initial show)
export default function ConsolePage() {
  return <Console />;
}
