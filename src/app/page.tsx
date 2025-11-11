"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Copy, Loader2, SendHorizontal, Library, Plus, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { LIBRARY_LOAD_STORAGE_KEY } from "@/lib/constants";

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

let cachedAudioContext: AudioContext | null = null;

const LOADING_MESSAGES = [
  "Locking show_logline and tone directives",
  "Sequencing biometrics & species detail maps",
  "Balancing lighting matrices with camera grammar",
  "Curating wardrobe silhouettes and texture palettes",
  "Authoring behavioral rails & scene presence cues",
  "Scoring delivery exports and validation hooks",
] as const;

type VideoModelId = "openai/sora-2" | "openai/sora-2-pro";
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
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
                  <div className="relative h-0 w-full pb-[100%]">
                    {portraitUrl ? (
                      <Image
                        src={portraitUrl}
                        alt={`${doc.character} portrait`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 360px, 100vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.25),_transparent)]">
                        <span className="text-xs uppercase tracking-[0.3em] text-foreground/45">
                          Portrait pending
                        </span>
                      </div>
                    )}
                    {portraitLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : null}
                  </div>
                </div>
                {portraitError ? (
                  <p className="text-xs text-red-300">{portraitError}</p>
                ) : null}
                <Button
                  type="button"
                  variant={portraitUrl ? "outline" : "default"}
                  onClick={() => onGeneratePortrait(characterId)}
                  disabled={portraitLoading}
                  className="w-full justify-center rounded-full"
                >
                  {portraitLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rendering portrait…
                    </>
                  ) : portraitUrl ? (
                    "Re-render portrait"
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

function RawJsonPeek({ rawJson }: { rawJson?: string | null }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  const formattedJson = useMemo(() => {
    if (!rawJson) return "";
    try {
      return JSON.stringify(JSON.parse(rawJson), null, 2);
    } catch {
      return rawJson;
    }
  }, [rawJson]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!rawJson) return;
    try {
      await navigator.clipboard.writeText(formattedJson || rawJson);
      setCopyState("copied");
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(
        () => setCopyState("idle"),
        2000
      );
    } catch (error) {
      console.error("Failed to copy JSON", error);
      setCopyState("error");
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(
        () => setCopyState("idle"),
        2000
      );
    }
  }, [formattedJson, rawJson]);

  if (!rawJson) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-foreground/60">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCopy}
          className="h-8 gap-1 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/75 hover:bg-white/10"
        >
          <Copy className="h-3.5 w-3.5 text-foreground/55" />
          {copyState === "copied"
            ? "Copied!"
            : copyState === "error"
              ? "Copy failed"
              : "Copy JSON"}
        </Button>
        <span className="inline-block h-3 w-px bg-white/15" />
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsJsonOpen((value) => !value)}
          className="h-8 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/75 hover:bg-white/10"
        >
          {isJsonOpen ? "Hide JSON" : "View JSON"}
        </Button>
      </div>
      {isJsonOpen ? (
        <div className="max-h-72 overflow-auto rounded-3xl border border-white/15 bg-black/55 p-5 text-xs leading-relaxed text-foreground/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <pre className="whitespace-pre-wrap break-words">{formattedJson}</pre>
        </div>
      ) : null}
    </div>
  );
}

function ResultView({
  blueprint,
  usage,
  rawJson,
  model,
  characterSeeds,
  charactersLoading,
  charactersError,
  characterDocs,
  characterBuilding,
  characterBuildErrors,
  characterPortraits,
  characterPortraitLoading,
  characterPortraitErrors,
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
  onGenerateVideo,
  activeCharacterId,
  posterUrl,
  posterLoading,
  posterError,
  posterAvailable,
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
  onGenerateTrailer,
  onRegenerateGrid,
  onRegeneratePoster,
  onClearTrailer,
  onOpenLightbox,
}: {
  blueprint: ShowBlueprint | null;
  usage?: ApiResponse["usage"];
  rawJson?: string | null;
  model: ModelId;
  characterSeeds: CharacterSeed[] | null;
  charactersLoading: boolean;
  charactersError: string | null;
  characterDocs: Record<string, CharacterDocument>;
  characterBuilding: Record<string, boolean>;
  characterBuildErrors: Record<string, string>;
  characterPortraits: Record<string, string | null>;
  characterPortraitLoading: Record<string, boolean>;
  characterPortraitErrors: Record<string, string>;
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
  onGenerateVideo: (characterId: string, customPrompt?: string) => void;
  activeCharacterId: string | null;
  posterUrl: string | null;
  posterLoading: boolean;
  posterError: string | null;
  posterAvailable: boolean;
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
  onGenerateTrailer: () => void;
  onRegenerateGrid: () => void;
  onRegeneratePoster: () => void;
  onClearTrailer: () => void;
  onOpenLightbox: (url: string) => void;
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
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-white/20 bg-gradient-to-br from-primary/5 via-black/50 to-black/45 p-8 sm:p-12 text-center shadow-[0_18px_60px_rgba(0,0,0,0.6)]">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Create Your Show Bible
            </h2>
            <p className="text-sm sm:text-base text-foreground/70">
              Describe your show's premise, tone, or visual style below.
              We'll generate a complete look bible with characters, color palettes, lighting plans, and more.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-foreground/50">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary font-semibold">
                1
              </span>
              <span>Enter your brief</span>
            </div>
            <span className="text-foreground/30">→</span>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/5 text-foreground/50 font-semibold">
                2
              </span>
              <span>Generate show bible</span>
            </div>
            <span className="text-foreground/30">→</span>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/5 text-foreground/50 font-semibold">
                3
              </span>
              <span className="hidden sm:inline">Build characters</span>
              <span className="sm:hidden">Characters</span>
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

  const posterSection = posterAvailable
    ? posterLoading || posterError || posterUrl
      ? posterLoading
        ? (
          <div className="flex items-center gap-3 rounded-3xl bg-black/45 px-5 py-4 text-sm text-foreground/70 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Generating poster…
          </div>
        )
        : posterError
          ? (
            <div className="space-y-3 rounded-3xl bg-red-500/10 px-5 py-4 text-sm shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <p className="font-semibold text-red-200">Poster generation failed</p>
            <p className="text-red-200/80">{posterError}</p>
          </div>
          )
          : posterUrl
            ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => onOpenLightbox(posterUrl)}
                  className="overflow-hidden rounded-3xl bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.65)] cursor-zoom-in transition-transform hover:scale-[1.01] w-full"
                >
                  <div className="relative h-0 w-full pb-[100%]">
                    <Image
                      src={posterUrl}
                      alt="Generated poster concept"
                      fill
                      className="object-contain"
                      sizes="(min-width: 768px) 560px, 100vw"
                      priority
                    />
                  </div>
                  <div className="border-t border-white/10 bg-black/40 px-4 py-2 text-center text-xs text-foreground/60">
                    1024×1792 • Sora output • Click to view full size
                  </div>
                </button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRegeneratePoster}
                  disabled={posterLoading}
                  className="w-full justify-center rounded-full text-sm"
                >
                  Re-generate Poster
                </Button>
              </div>
            )
            : null
      : null
    : (
      <div className="rounded-3xl bg-black/45 px-5 py-4 text-sm text-foreground/65 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        Poster generation is disabled. Add a Replicate token to unlock one-click key art.
      </div>
    );

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
          title="Library-ready poster"
          description="Polished 9:16 artwork staged for the library carousel."
          accent="lagoon"
          defaultOpen
        >
          {libraryPosterLoading ? (
            <div className="flex items-center gap-3 rounded-3xl border border-white/12 bg-black/45 px-5 py-4 text-sm text-foreground/70">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Rendering library poster…
            </div>
          ) : libraryPosterUrl ? (
            <button
              type="button"
              onClick={() => onOpenLightbox(libraryPosterUrl)}
              className="overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.65)] cursor-zoom-in transition-transform hover:scale-[1.01] w-full"
            >
              <div className="relative h-0 w-full pb-[177%]">
                <Image
                  src={libraryPosterUrl}
                  alt="Library-ready poster"
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 420px, 100vw"
                />
              </div>
              <div className="border-t border-white/10 bg-black/40 px-4 py-2 text-center text-xs text-foreground/60">
                9:16 • Library poster • Click to view full size
              </div>
            </button>
          ) : (
            <div className="space-y-3 rounded-3xl border border-dashed border-white/15 bg-black/35 px-5 py-4 text-sm text-foreground/70">
              <p>Library poster will appear once a finished portrait exists.</p>
              <p className="text-foreground/55">
                Portraits trigger this automatically—no additional action needed.
              </p>
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
          <p>Grid renders after every character portrait is complete.</p>
          <p className="text-foreground/55">Finish generating portraits to unlock the consolidated asset.</p>
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
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
            <video
              controls
              className="h-full w-full"
              poster={portraitGridUrl ?? undefined}
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
          <p className="text-xs text-red-300">{trailerError}</p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={onGenerateTrailer}
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
          {posterSection}
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
      (seed) => characterDocs[seed.id] && !characterPortraits[seed.id] && !characterPortraitErrors[seed.id]
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
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
        {characterSeeds.map((seed) => {
          const doc = characterDocs[seed.id];
          const isBuilding = Boolean(characterBuilding[seed.id]);
          const buildError = characterBuildErrors[seed.id];
          const portraitUrl = characterPortraits[seed.id];
          const portraitLoading = Boolean(characterPortraitLoading[seed.id]);
          const portraitError = characterPortraitErrors[seed.id];
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
                'min-h-[240px] justify-between transition-all duration-500 ease-in-out overflow-hidden',
                isActive ? 'sm:col-span-2 xl:col-span-3 scale-[1.01]' : 'scale-100',
                !isActive && portraitUrl ? 'p-0' : ''
              )}
            >
              {!isActive && portraitUrl ? (
                <button
                  type="button"
                  onClick={() => onOpenLightbox(portraitUrl)}
                  className={cn(
                    "relative overflow-hidden bg-black/60 cursor-zoom-in transition-transform hover:scale-[1.02]",
                    portraitError && "ring-2 ring-amber-500/50"
                  )}
                >
                  <div className="relative h-0 w-full pb-[100%]">
                    {portraitLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : null}
                    <Image
                      src={portraitUrl}
                      alt={`${seed.name} portrait`}
                      fill
                      className="object-cover object-center transition-opacity duration-500"
                      sizes="(min-width: 768px) 280px, 100vw"
                      onLoad={(e) => {
                        e.currentTarget.style.opacity = "1";
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
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-black/60">
                      <span className="text-sm uppercase tracking-[0.3em] text-amber-300/70">
                        Retry
                      </span>
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
                {portraitError ? (
                  <div className="w-full space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                    <p className="text-xs font-semibold text-amber-200">Portrait needs attention</p>
                    <p className="text-xs text-amber-200/80 break-words leading-relaxed">{portraitError}</p>
                    <details className="group">
                      <summary 
                        className="cursor-pointer text-xs font-medium text-amber-200/80 hover:text-amber-200 underline decoration-dotted"
                        onClick={(e) => {
                          // Pre-populate with original prompt when expanded
                          if (!editedPortraitPrompts[seed.id] && doc) {
                            const showJson = JSON.stringify(blueprint, null, 2).slice(0, 3000);
                            const characterJson = JSON.stringify(doc, null, 2).slice(0, 3000);
                            const defaultPrompt = [
                              "Create a highly production character portrait.",
                              "Focus on cinematic lighting, intentional wardrobe, and expressive posture.",
                              "Respect the show's aesthetic while capturing the essence of the character.",
                              "Every choice must adhere to the aesthetic, palette, lighting, and creative rules specified in the show blueprint JSON.",
                              "",
                              "Show blueprint JSON:",
                              showJson,
                              "",
                              "Character blueprint JSON:",
                              characterJson,
                            ].join("\n");
                            
                            onSetEditedPortraitPrompt((prev) => ({
                              ...prev,
                              [seed.id]: defaultPrompt,
                            }));
                          }
                        }}
                      >
                        Customize prompt & retry →
                      </summary>
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={editedPortraitPrompts[seed.id] ?? ""}
                          onChange={(e) => {
                            onSetEditedPortraitPrompt((prev) => ({
                              ...prev,
                              [seed.id]: e.target.value,
                            }));
                          }}
                          placeholder="Edit the portrait prompt..."
                          className="min-h-[120px] text-xs font-mono"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const customPrompt = editedPortraitPrompts[seed.id];
                              if (customPrompt) {
                                onGeneratePortrait(seed.id, customPrompt);
                              }
                            }}
                            disabled={!editedPortraitPrompts[seed.id] || portraitLoading}
                            className="flex-1 rounded-full text-xs"
                          >
                            Retry with custom prompt
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onSetEditedPortraitPrompt((prev) => {
                                const next = { ...prev };
                                delete next[seed.id];
                                return next;
                              });
                            }}
                            className="rounded-full text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </details>
                  </div>
                ) : null}
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
                {doc && posterAvailable && !portraitError ? (
                  <Button
                    type="button"
                    variant={portraitUrl ? "outline" : "secondary"}
                    onClick={() => {
                      const customPrompt = editedPortraitPrompts[seed.id];
                      onGeneratePortrait(seed.id, customPrompt as string | undefined);
                    }}
                    disabled={portraitLoading}
                    className="w-full justify-center rounded-full text-sm transition-all duration-200"
                  >
                    {portraitLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rendering…
                      </>
                    ) : portraitUrl ? (
                      editedPortraitPrompts[seed.id] ? "Re-render with custom" : "Re-render portrait"
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
  
  const trailerPreviewSection = canGenerateTrailerFromPartial ? (
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
                  placeholder="Enter custom trailer prompt..."
                  className="min-h-[140px] text-xs font-mono"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (editedTrailerPrompt) {
                        // TODO: Pass custom prompt to trailer generation
                        console.log("Regenerating trailer with custom prompt:", editedTrailerPrompt.slice(0, 100));
                        onGenerateTrailer();
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
          onClick={onGenerateTrailer}
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

  const masterContent = (
    <div className="space-y-8 sm:space-y-10">
      {/* Trailer Hero - Always visible at top */}
      <div className="max-w-[1400px] mx-auto">
        <div className="overflow-hidden rounded-3xl border border-white/12 bg-black/60 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
          {trailerUrl ? (
            <video
              controls
              className="h-full w-full"
              poster={portraitGridUrl ?? undefined}
              autoPlay={false}
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
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {trailerStatus === "starting" ? "Starting" : trailerStatus === "processing" ? "Processing" : "Rendering"}
                    </p>
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
                      {trailerStatus === "starting" ? "Initializing Sora 2" : 
                       trailerStatus === "processing" ? "Processing with Sora 2" : 
                       trailerStatus === "succeeded" ? "Complete (Sora 2)" :
                       trailerStatus === "succeeded (VEO fallback)" ? "Complete (VEO 3.1)" :
                       trailerStatus?.includes("VEO") ? "Trying VEO 3.1 fallback" :
                       trailerStatus || "Queued"}
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
              </div>
            </div>
          ) : canGenerateTrailerFromPartial ? (
            <div className="bg-gradient-to-br from-white/5 via-black/50 to-black/60 px-8 py-16">
              <div className="text-center space-y-8 max-w-3xl mx-auto">
                <div>
                  <div className="inline-flex items-center gap-3 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">
                      Ready to Generate
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-foreground/80">
                    Trailer Ready
                  </p>
                  <p className="mt-2 text-sm text-foreground/60">
                    {completedPortraits.length} of {characterSeeds?.length || 0} character portraits complete
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
                  onClick={onGenerateTrailer}
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
      </div>

      {/* Hero Section - Show Overview */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] max-w-[1400px] mx-auto">
        <div className="space-y-6">
          {loglinePanel}
        </div>
        <div className="space-y-6">
          {posterSection}
        </div>
      </div>

      {/* Trailer Section */}
      {trailerPreviewSection ? (
        <div className="max-w-[1400px] mx-auto">
          {trailerPreviewSection}
        </div>
      ) : null}

      {/* Character Cards */}
      {characterSeeds && characterSeeds.length > 0 ? (
        <div className="max-w-[1400px] mx-auto space-y-4">
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
      <div className="max-w-[1400px] mx-auto">
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
      <div className="max-w-[1400px] mx-auto">
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
      <div className="max-w-[1400px] mx-auto">
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
      <div className="max-w-[1400px] mx-auto">
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
                      <div className="relative h-0 w-full pb-[56.25%]">
                        {currentVideoUrl ? (
                          <video
                            key={currentVideoUrl}
                            controls
                            className="absolute inset-0 h-full w-full rounded-2xl object-cover"
                            poster={portraitUrl ?? undefined}
                          >
                            <source src={currentVideoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.2),_transparent)]">
                            <span className="text-xs uppercase tracking-[0.3em] text-foreground/45">
                              Video pending
                            </span>
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
                                  poster={portraitUrl ?? undefined}
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
    <div className="space-y-6 max-w-[1000px] mx-auto">
      {portraitGridSection}
      {trailerSection}
    </div>
  );

  const assetStatusItems = [
    { key: "poster", label: "Hero poster", ready: Boolean(posterUrl) },
    { key: "libraryPoster", label: "Library poster", ready: Boolean(libraryPosterUrl) },
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

  return (
    <>
      <Tabs defaultValue="master" className="space-y-6" id="main-tabs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-[1600px] mx-auto">
        <TabsList className="w-full sm:w-auto justify-start">
          <TabsTrigger value="master" className="flex-1 sm:flex-none">
            <span className="flex items-center gap-2">
              Master
            </span>
          </TabsTrigger>
          <TabsTrigger value="characters" className="flex-1 sm:flex-none">
            <span className="flex items-center gap-2">
              Characters
              {charactersTabBusy ? (
                <span
                  className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(229,9,20,0.4)] animate-pulse"
                  aria-label="Character tasks running"
                />
              ) : null}
            </span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex-1 sm:flex-none">
            <span className="flex items-center gap-2">
              Videos
              {videosTabBusy ? (
                <span
                  className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(229,9,20,0.4)] animate-pulse"
                  aria-label="Video renders running"
                />
              ) : null}
            </span>
          </TabsTrigger>
          <TabsTrigger value="trailer" className="flex-1 sm:flex-none">
            <span className="flex items-center gap-2">
              Trailer
              {trailerTabBusy ? (
                <span
                  className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(229,9,20,0.4)] animate-pulse"
                  aria-label="Trailer rendering"
                />
              ) : null}
            </span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex-1 sm:flex-none">
            <span className="flex items-center gap-2">
              Assets
              {assetsTabBusy ? (
                <span
                  className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(229,9,20,0.4)] animate-pulse"
                  aria-label="Asset renders running"
                />
              ) : null}
            </span>
          </TabsTrigger>
        </TabsList>
        <RawJsonPeek key={rawJson ?? "no-json"} rawJson={rawJson} />
      </div>
      <TabsContent value="master" className="pb-32">
        {masterContent}
      </TabsContent>
      <TabsContent value="assets" className="space-y-6 pb-32 max-w-[1400px] mx-auto">
        <div className="space-y-8">
          {assetsSummary}
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground/55">
                  Key art delivery
                </p>
                <p className="text-sm text-foreground/65">
                  Poster-ready stills staged for decks, look books, and library carousels.
                </p>
              </div>
              {posterSection}
              {libraryPosterSection}
            </section>
            <section className="space-y-4">
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
      <TabsContent value="characters" className="pb-32 max-w-[1600px] mx-auto">
        {charactersContent}
      </TabsContent>
      <TabsContent value="videos" className="pb-32 max-w-[1600px] mx-auto">
        {videosContent}
      </TabsContent>
      <TabsContent value="trailer" className="pb-32 max-w-[1200px] mx-auto">
        {trailerContent}
      </TabsContent>
    </Tabs>
    <div className="hidden" aria-hidden>
      {overviewContent}
    </div>
    </>
  );

}

export default function Home() {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isLoadingShow, setIsLoadingShow] = useState(false);
  const [currentShowId, setCurrentShowId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [blueprint, setBlueprint] = useState<ShowBlueprint | null>(null);
  const [usage, setUsage] = useState<ApiResponse["usage"]>();
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<ModelId>("gpt-4o");
  const [activeModel, setActiveModel] = useState<ModelId>("gpt-4o");
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
  const [libraryPosterUrl, setLibraryPosterUrl] = useState<string | null>(null);
  const [libraryPosterLoading, setLibraryPosterLoading] = useState(false);
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
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [videoModelId, setVideoModelId] = useState<VideoModelId>(VIDEO_MODEL_OPTIONS[0].id);
  const [videoSeconds, setVideoSeconds] = useState<VideoDuration>(8);
  const [videoAspectRatio, setVideoAspectRatio] = useState<VideoAspectRatio>("landscape");
  const [videoResolution, setVideoResolution] = useState<VideoResolution>("standard");
  const selectedVideoModel = useMemo(
    () => VIDEO_MODEL_OPTION_MAP[videoModelId] ?? VIDEO_MODEL_OPTIONS[0],
    [videoModelId]
  );

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
    async (value: string, showData: ShowBlueprint, chosenModel: ModelId) => {
      setCharactersLoading(true);
      setCharactersError(null);

      try {
        const response = await fetch("/api/characters/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: value, show: showData, model: chosenModel }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string; details?: unknown }
            | null;
          const fallback = `Failed to generate characters (${response.status}).`;
          throw new Error(body?.error ?? fallback);
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
        setCharacterPortraitErrors({});
        setCharacterVideos({});
        setCharacterVideoLoading({});
        setCharacterVideoErrors({});
        setPortraitGridUrl(null);
        setPortraitGridLoading(false);
        setPortraitGridError(null);
        portraitGridDigestRef.current = "";
        
        // Update show with character seeds
        if (currentShowId && blueprint) {
          setTimeout(() => void saveCurrentShow(false), 500);
        }
      } catch (err) {
        console.error(err);
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
      if (!blueprint) {
        setCharacterPortraitErrors((prev) => ({
          ...prev,
          [characterId]: "Blueprint missing for portrait generation.",
        }));
        return;
      }

      const doc = characterDocs[characterId];
      if (!doc) {
        setCharacterPortraitErrors((prev) => ({
          ...prev,
          [characterId]: "Build the character dossier first.",
        }));
        return;
      }

      setCharacterPortraitLoading((prev) => ({ ...prev, [characterId]: true }));
      setCharacterPortraitErrors((prev) => {
        const next = { ...prev };
        delete next[characterId];
        return next;
      });

      // Set a 3-minute timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Generation took longer than expected. The server may be busy—try again in a moment or edit the prompt below.")), 180000);
      });

      try {
        const characterWithPrompt = customPrompt ? {
          ...doc,
          _customPortraitPrompt: customPrompt,
        } : doc;

        const fetchPromise = fetch("/api/characters/portrait", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            show: blueprint,
            character: characterWithPrompt,
            customPrompt: customPrompt || undefined,
          }),
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          const fallback = `Failed to generate portrait (${response.status}).`;
          throw new Error(body?.error ?? fallback);
        }

        const result = (await response.json()) as { url?: string };
        if (!result.url) {
          throw new Error("Portrait response missing URL.");
        }

        setCharacterPortraits((prev) => ({
          ...prev,
          [characterId]: result.url ?? null,
        }));
        setCharacterVideos((prev) => {
          const next = { ...prev };
          delete next[characterId];
          return next;
        });
        setCharacterVideoErrors((prev) => {
          const next = { ...prev };
          delete next[characterId];
          return next;
        });
        
        // Play success sound
        playSuccessChime();
        
        // Trigger library poster generation after first portrait
        const completedPortraits = Object.values(characterPortraits).filter(url => url).length;
        if (completedPortraits === 0) { // This is the first portrait
          console.log("🎨 First portrait completed - will attempt library poster generation");
          setTimeout(() => void saveCurrentShow(true), 1000); // Give state time to update
        }
      } catch (err) {
        console.error("Portrait generation error:", err);
        let errorMessage = err instanceof Error ? err.message : "Unable to render portrait.";
        
        // Handle E005 sensitivity flag gracefully
        if (errorMessage.includes("E005") || errorMessage.includes("flagged as sensitive")) {
          errorMessage = "Portrait was flagged by content filters. Try editing the character description or regenerating with a custom prompt.";
        }
        
        setCharacterPortraitErrors((prev) => ({
          ...prev,
          [characterId]: errorMessage,
        }));
      } finally {
        setCharacterPortraitLoading((prev) => ({ ...prev, [characterId]: false }));
      }
    },
    [blueprint, characterDocs]
  );

  useEffect(() => {
    if (!blueprint) return;
    if (!posterAvailable) return;
    if (!characterSeeds?.length) return;
    characterSeeds.forEach((seed) => {
      if (!characterDocs[seed.id]) return;
      if (characterPortraits[seed.id]) return;
      if (characterPortraitLoading[seed.id]) return;
      if (characterPortraitErrors[seed.id]) return; // Don't auto-retry errors
      void generateCharacterPortrait(seed.id);
    });
  }, [
    blueprint,
    posterAvailable,
    characterSeeds,
    characterDocs,
    characterPortraits,
    characterPortraitLoading,
    characterPortraitErrors,
    generateCharacterPortrait,
  ]);

  const generateCharacterVideo = useCallback(
    async (characterId: string, customPrompt?: string) => {
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

      setCharacterVideoLoading((prev) => ({ ...prev, [characterId]: true }));
      setCharacterVideoErrors((prev) => {
        const next = { ...prev };
        delete next[characterId];
        return next;
      });

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
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          const fallback = `Failed to generate video (${response.status}).`;
          throw new Error(body?.error ?? fallback);
        }

        const result = (await response.json()) as { url?: string };
        if (!result.url) {
          throw new Error("Video response missing URL.");
        }

        setCharacterVideos((prev) => {
          const existing = prev[characterId] || [];
          return {
            ...prev,
            [characterId]: [result.url ?? "", ...existing].filter(Boolean),
          };
        });
        
        // Set the new video as selected (index 0, latest)
        setSelectedVideoIndex((prev) => ({
          ...prev,
          [characterId]: 0,
        }));
        
        // Play success sound
        playSuccessChime();
      } catch (err) {
        console.error(err);
        setCharacterVideoErrors((prev) => ({
          ...prev,
          [characterId]:
            err instanceof Error ? err.message : "Unable to render video.",
        }));
      } finally {
        setCharacterVideoLoading((prev) => ({ ...prev, [characterId]: false }));
      }
    },
    [blueprint, characterDocs, characterPortraits, posterAvailable, videoAspectRatio, videoModelId, videoResolution, videoSeconds]
  );

  const generatePoster = useCallback(
    async (value: string, gridUrl?: string) => {
      setPosterLoading(true);
      setPosterError(null);

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
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          const fallback = `Failed to generate poster (${response.status}).`;
          throw new Error(body?.error ?? fallback);
        }

        return (await response.json()) as { url?: string };
      };

      try {
        let attempts = 0;
        let result: { url?: string } | null = null;
        while (attempts < 3) {
          attempts += 1;
          try {
            result = await attemptPoster();
            if (result?.url) break;
          } catch (innerError) {
            const message =
              innerError instanceof Error
                ? innerError.message
                : "Unable to generate poster.";
            console.warn(`Poster attempt ${attempts} failed:`, message);
            if (
              /sensitive/i.test(message) ||
              /flagged/i.test(message) ||
              /E005/i.test(message)
            ) {
              if (attempts >= 3) {
                throw innerError;
              }
              continue;
            }
            throw innerError;
          }
        }

        if (!result?.url) {
          throw new Error("Poster generation returned no image.");
        }

        setPosterUrl(result.url ?? null);
      } catch (err) {
        console.error(err);
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
      } finally {
        setPosterLoading(false);
      }
    },
    []
  );

  const generateTrailer = useCallback(async () => {
    if (!blueprint) {
      setTrailerError("Blueprint missing.");
      return;
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

    const digest = gridUrl;
    trailerDigestRef.current = digest;

    const startTime = Date.now();
    setTrailerLoading(true);
    setTrailerError(null);
    setTrailerStatus("starting");
    setTrailerStartTime(startTime);
    setTrailerElapsed(0);

    try {
      const response = await fetch("/api/trailer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: blueprint.show_title ?? "Untitled Series",
          logline: blueprint.show_logline ?? "",
          characterGridUrl: gridUrl,
          show: blueprint,
        }),
      }).catch((fetchError) => {
        throw new Error(`Network error: ${fetchError.message || "Check your connection and try again"}`);
      });

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
      
      // Update status based on which model was used
      if (result.model === "veo-3.1") {
        setTrailerStatus("succeeded (VEO fallback)");
        console.log("ℹ️ Trailer generated with VEO 3.1 fallback (8 seconds)");
        // Show notification that VEO was used
        setTimeout(() => {
          alert("Note: Sora 2 flagged the content, so VEO 3.1 was used as fallback. Trailer is 8 seconds instead of 12.");
        }, 500);
      } else {
        setTrailerStatus("succeeded");
      }
      
      setTrailerUrl(result.url);
      
      console.log("🎵 Playing success sound");
      // Play success sound
      playSuccessChime();
      
      console.log("✅ Trailer generation complete!");
    } catch (err) {
      console.error("Failed to generate trailer:", err);
      let message = err instanceof Error ? err.message : "Unable to generate trailer.";
      
      // Handle E005 sensitivity flag - check if VEO fallback was attempted
      if (message.includes("E005") || message.includes("flagged as sensitive")) {
        // Check if both models failed (VEO was attempted)
        if (message.includes("VEO") || message.includes("also failed")) {
          message = "Both Sora 2 and VEO 3.1 flagged this content. Please edit the prompt below to adjust the trailer description.";
        } else {
          message = "Trailer was flagged by content filters. Attempting VEO 3.1 fallback automatically, or edit the prompt below.";
        }
        
        // Pre-populate edit field with original prompt if not already set
        if (!editedTrailerPrompt && blueprint) {
          const defaultPrompt = `Create a blockbuster-style teaser trailer for the series "${blueprint.show_title || 'Untitled'}".

${blueprint.show_logline || ''}

Style: Cinematic trailer with dramatic pacing, quick cuts showcasing the characters, high-energy moments, and a sense of scale and adventure. Professional movie trailer aesthetic with dynamic camera movements, impactful compositions, and a sense of intrigue that makes you want to watch the show.`;
          
          setEditedTrailerPrompt(defaultPrompt);
        }
      }
      // Handle 504 Gateway Timeout specifically
      else if (message.includes("504") || message.includes("Gateway") || message.includes("Timeout")) {
        message = "Trailer generation timed out. Sora 2 may be busy—try again in a moment.";
      }
      
      setTrailerError(message);
      setTrailerUrl(null);
      setTrailerStatus(null);
      setTrailerStartTime(null);
      trailerDigestRef.current = ""; // Allow retry
    } finally {
      setTrailerLoading(false);
      setTimeout(() => {
        setTrailerStatus(null);
        setTrailerStartTime(null);
        setTrailerElapsed(0);
      }, 3000);
    }
  }, [blueprint, portraitGridUrl, characterSeeds, characterPortraits]);

  useEffect(() => {
    if (!posterAvailable) return;
    if (!blueprint?.show_logline) return;
    if (!characterSeeds || characterSeeds.length === 0) return;
    const allDocsReady = characterSeeds.every((seed) => Boolean(characterDocs[seed.id]));
    if (!allDocsReady) return;
    if (posterLoading) return;

    const charactersSummary = characterSeeds
      .map((seed) => {
        const doc = characterDocs[seed.id];
        if (!doc) return null;
        return {
          id: seed.id,
          name: seed.name,
          role: doc.metadata?.role ?? seed.summary,
          species: doc.biometrics?.species ?? null,
          gender: doc.biometrics?.gender_identity ?? null,
          ethnicity: doc.biometrics?.ethnicity ?? null,
          skin_color: doc.biometrics?.skin_color ?? null,
          eye_color: doc.biometrics?.eye_color ?? null,
          distinguishing_features:
            doc.biometrics?.distinguishing_features ?? doc.biometrics?.species?.visual_markers ?? null,
          wardrobe: doc.look?.wardrobe ?? null,
        };
      })
      .filter(Boolean);

    if (charactersSummary.length === 0) return;

    const signature = JSON.stringify({
      logline: blueprint.show_logline,
      characters: charactersSummary,
      grid: portraitGridUrl,
    });

    if (posterDigestRef.current === signature) {
      return;
    }

    posterDigestRef.current = signature;

    const compositePrompt = [
      `Series logline: ${blueprint.show_logline}`,
      "Character dossiers (minified JSON):",
      JSON.stringify(charactersSummary),
    ].join("\n\n");

    void generatePoster(compositePrompt, portraitGridUrl || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    posterAvailable,
    blueprint?.show_logline,
    characterSeeds?.length,
    Object.keys(characterDocs || {}).length,
    portraitGridUrl,
    posterLoading,
  ]);

  useEffect(() => {
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

    void (async () => {
      try {
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
        } else {
          throw new Error("Portrait grid response missing URL.");
        }
      } catch (error) {
        console.error("Failed to compose portrait grid:", error);
        const message =
          error instanceof Error ? error.message : "Unable to compose portrait grid.";
        setPortraitGridError(message);
        portraitGridDigestRef.current = "";
      } finally {
        setPortraitGridLoading(false);
      }
    })();
  }, [
    blueprint,
    characterSeeds,
    characterPortraits,
    portraitGridUrl,
    portraitGridLoading,
  ]);

  useEffect(() => {
    if (!blueprint) return;
    if (!portraitGridUrl) return;
    if (trailerUrl || trailerLoading || trailerError) return; // Don't auto-retry on error!
    if (!posterAvailable) return;
    if (trailerDigestRef.current === portraitGridUrl) return;
    void generateTrailer();
  }, [
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
      posterDigestRef.current = "";
      portraitGridDigestRef.current = "";
      setLastPrompt(null);

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: value, model: chosenModel }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | {
                error?: string;
                messages?: Array<{ instancePath?: string; message?: string }>;
                details?: unknown;
              }
            | null;

          if (body?.messages) {
            console.error("Schema validation errors:", body.messages);
          } else if (body?.details) {
            console.error("Model output details:", body.details);
          }

          const fallback = `Request failed (${response.status})`;
          throw new Error(body?.error ?? fallback);
        }

        const result = (await response.json()) as ApiResponse;

        if ("error" in result && result.error) {
          throw new Error(result.error);
        }

        setBlueprint(result.data);
        setUsage(result.usage);
        setRawJson(result.raw);
        setActiveModel(chosenModel);
        setLastPrompt(value);

        // Generate show ID immediately
        const newShowId = `show-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setCurrentShowId(newShowId);
        console.log("🆕 New show created with ID:", newShowId);

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
          generateCharacterSeeds(value, result.data, chosenModel),
        ];

        if (posterIsAvailable) {
          tasks.push(generatePoster(value));
        } else {
          setPosterLoading(false);
          setPosterError(null);
        }

        await Promise.all(tasks);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
        setCharactersLoading(false);
        setPosterLoading(false);
      } finally {
        setIsLoading(false);
      }
    },
    [generateCharacterSeeds, generatePoster]
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
    setBlueprint(null);
    setUsage(undefined);
    setRawJson(null);
    setError(null);
    setActiveModel(model);
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
    setLastPrompt(null);
    setCurrentShowId(null);
    posterDigestRef.current = "";
    portraitGridDigestRef.current = "";
    trailerDigestRef.current = "";
  }, [model]);

  const loadShow = useCallback(async (showId: string) => {
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
      setCharacterPortraits(show.characterPortraits || {});
      setCharacterVideos(show.characterVideos || {});
      setSelectedVideoIndex({});
      setPosterUrl(show.posterUrl || null);
      setLibraryPosterUrl(show.libraryPosterUrl || null);
      setPortraitGridUrl(show.portraitGridUrl || null);
      setPortraitGridError(null);
      setTrailerUrl(show.trailerUrl || null);
      setTrailerError(null);
      setPosterAvailable(true);
      setCurrentShowId(show.id);
      setPortraitGridLoading(false);
      setTrailerLoading(false);
      
      console.log("State updated - portraits now:", Object.keys(show.characterPortraits || {}).length);
      console.log("State updated - videos now:", Object.keys(show.characterVideos || {}).length);
      
      // Clear any loading/error states
      setCharacterBuilding({});
      setCharacterBuildErrors({});
      setCharacterPortraitLoading({});
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
      trailerDigestRef.current = show.portraitGridUrl ?? "";
      console.log("✅ Show loaded successfully");
      
      // Small delay to ensure state has propagated before allowing saves
      setTimeout(() => setIsLoadingShow(false), 1000);
    } catch (error) {
      console.error("Failed to load show:", error);
      setError("Failed to load show from library");
      setIsLoadingShow(false);
    }
  }, []);

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

  const canGenerateLibraryPoster = useCallback(() => {
    // Must have blueprint with show data
    if (!blueprint?.visual_aesthetics) {
      console.log("⏳ No blueprint yet");
      return false;
    }
    
    // Must have Replicate token
    if (!posterAvailable) {
      console.log("⏳ No Replicate token");
      return false;
    }
    
    // Must NOT be currently loading any portraits
    const isLoadingAnyPortrait = Object.values(characterPortraitLoading).some(Boolean);
    if (isLoadingAnyPortrait) {
      console.log("⏳ Portraits still loading, waiting...");
      return false;
    }
    
    // Must have at least one COMPLETED character portrait with actual URL
    const completedPortraits = Object.values(characterPortraits).filter(url => url && typeof url === 'string' && url.length > 0);
    
    if (completedPortraits.length === 0) {
      console.log("⏳ No completed portraits yet - need at least 1 character portrait");
      return false;
    }
    
    console.log(`✅ Can generate library poster - ${completedPortraits.length} portrait(s) ready`);
    return true;
  }, [blueprint, characterPortraits, characterPortraitLoading, posterAvailable]);

  const generateLibraryPoster = useCallback(async () => {
    const canGenerate = canGenerateLibraryPoster();
    
    if (!canGenerate || !blueprint) {
      return null;
    }
    
    // Find first character with a valid portrait URL
    const characterWithPortrait = characterSeeds?.find(
      (seed) => {
        const url = characterPortraits[seed.id];
        return url && typeof url === 'string' && url.length > 0;
      }
    );
    
    if (!characterWithPortrait) {
      console.log("⏳ No character with valid portrait found");
      return null;
    }

    const characterImageUrl = characterPortraits[characterWithPortrait.id];
    
    if (!characterImageUrl) {
      console.log("⏳ Character portrait URL is invalid");
      return null;
    }

    const logline = blueprint.show_logline || "Untitled Show";

    console.log("🎬 GENERATING LIBRARY POSTER");
    console.log("   Using character portrait:", characterWithPortrait.name);
    console.log("   Portrait URL:", characterImageUrl.slice(0, 80) + "...");
    setLibraryPosterLoading(true);
    try {
      const response = await fetch("/api/library-poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logline,
          characterImageUrl,
          showData: blueprint,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate library poster");
      }

      const result = (await response.json()) as { url?: string };
      if (result.url) {
        setLibraryPosterUrl(result.url);
        return result.url;
      }
      return null;
    } catch (error) {
      console.error("Failed to generate library poster:", error);
      return null;
    } finally {
      setLibraryPosterLoading(false);
    }
  }, [blueprint, posterAvailable, characterSeeds, characterPortraits, canGenerateLibraryPoster]);

  const saveCurrentShow = useCallback(async (forceLibraryPoster = false) => {
    if (!blueprint) return;
    if (!currentShowId) return; // Don't save if no ID yet
    if (isLoadingShow) {
      console.log("⏸️ Skipping save - show is currently loading");
      return;
    }

    // First, download all assets locally
    let savedAssets = {
      characterPortraits,
      characterVideos,
      posterUrl,
      libraryPosterUrl,
      portraitGridUrl,
      trailerUrl,
    };

    try {
      const assetResponse = await fetch("/api/library/save-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId: currentShowId,
          assets: {
            characterPortraits,
            characterVideos,
            posterUrl,
            libraryPosterUrl,
            portraitGridUrl,
            trailerUrl,
          },
        }),
      });

      if (assetResponse.ok) {
        const result = await assetResponse.json() as { savedAssets?: typeof savedAssets; downloadCount?: number };
        if (result.savedAssets) {
          savedAssets = result.savedAssets;
          console.log(`✅ Saved ${result.downloadCount || 0} assets locally`);
        }
      }
    } catch (error) {
      console.warn("Failed to save assets locally, using URLs:", error);
    }

    // Generate library poster ONLY if forced or meets all requirements
    let finalLibraryPosterUrl = savedAssets.libraryPosterUrl;
    
    if (forceLibraryPoster && !finalLibraryPosterUrl) {
      const canGenerate = canGenerateLibraryPoster();
      if (canGenerate) {
        console.log("🎬 Force-generating library poster...");
        const generated = await generateLibraryPoster();
        if (generated) {
          finalLibraryPosterUrl = generated;
        }
      }
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
        characterPortraits: savedAssets.characterPortraits || {},
        characterVideos: savedAssets.characterVideos || {},
        posterUrl: savedAssets.posterUrl || null,
        libraryPosterUrl: finalLibraryPosterUrl || null,
        portraitGridUrl: savedAssets.portraitGridUrl || null,
        trailerUrl: savedAssets.trailerUrl || null,
      };
      
      const totalVideos = Object.values(characterVideos || {}).reduce((sum, arr) => sum + arr.length, 0);
      const portraitCount = Object.keys(characterPortraits || {}).filter(k => characterPortraits[k]).length;
      
      console.log(`💾 Updating show ${currentShowId}:`, {
        characters: characterSeeds?.length || 0,
        dossiers: Object.keys(characterDocs || {}).length,
        portraits: portraitCount,
        videos: totalVideos,
        hasLibraryPoster: !!finalLibraryPosterUrl,
        hasPortraitGrid: !!portraitGridUrl,
      });
      
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
  }, [blueprint, rawJson, usage, activeModel, characterSeeds, characterDocs, characterPortraits, characterVideos, posterUrl, libraryPosterUrl, portraitGridUrl, trailerUrl, currentShowId, isLoadingShow, generateLibraryPoster, canGenerateLibraryPoster]);


  // Auto-save when character data changes
  const lastSaveRef = useRef<string>("");
  const posterDigestRef = useRef<string>("");
  const portraitGridDigestRef = useRef<string>("");
  const trailerDigestRef = useRef<string>("");
  useEffect(() => {
    if (blueprint && currentShowId) {
      const hasAnyCharacterData = 
        Object.keys(characterDocs).length > 0 ||
        Object.keys(characterPortraits).length > 0 ||
        Object.keys(characterVideos).length > 0;
      
      if (hasAnyCharacterData) {
        // Create a hash to prevent duplicate saves
        const saveHash = JSON.stringify({
          docs: Object.keys(characterDocs).sort(),
          portraits: Object.keys(characterPortraits).filter(k => characterPortraits[k]).sort(),
          videos: Object.keys(characterVideos).filter(k => characterVideos[k]).sort(),
          grid: portraitGridUrl ?? null,
          trailer: trailerUrl ?? null,
        });
        
        if (saveHash !== lastSaveRef.current) {
          lastSaveRef.current = saveHash;
          void saveCurrentShow(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterDocs, characterPortraits, characterVideos, portraitGridUrl, trailerUrl]);

  return (
    <div className="flex min-h-screen flex-col bg-black text-foreground">
      {/* Lightbox */}
      {lightboxImage ? (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/98 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute right-6 top-6 z-10 rounded-full border border-white/20 bg-black/80 p-3 text-white shadow-lg backdrop-blur-md transition-all hover:bg-primary hover:border-primary/40 hover:scale-110"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative max-h-[92vh] max-w-[92vw] animate-in zoom-in-95 duration-300">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
              <Image
                src={lightboxImage}
                alt="Full size view"
                width={2048}
                height={2048}
                className="h-auto max-h-[92vh] w-auto max-w-[92vw] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <p className="mt-4 text-center text-sm text-white/60">
              Click anywhere to close
            </p>
          </div>
        </div>
      ) : null}
      
      <header className="border-b border-white/12 bg-black/90">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-base sm:text-lg font-semibold uppercase tracking-[0.28em] sm:tracking-[0.32em] text-primary">
              Production Flow
            </span>
            <span className="hidden sm:inline text-xs text-foreground/55">Look bible console</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {blueprint ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startNewShow}
                className="gap-2 rounded-full"
              >
                <Plus className="h-4 w-4" />
                New Show
              </Button>
            ) : null}
            <Link href="/library">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 rounded-full"
              >
                <Library className="h-4 w-4" />
                Show Library
              </Button>
            </Link>
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-semibold uppercase tracking-[0.26em]">
              {selectedModelOption.label}
            </Badge>
            <label
              htmlFor="model-select"
              className="sr-only"
            >
              Model
            </label>
            <select
              id="model-select"
              value={model}
              onChange={(event) => setModel(event.target.value as ModelId)}
              className="rounded-full border border-white/15 bg-black/60 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground/75 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 sm:gap-6 px-4 sm:px-6 py-6 sm:py-10 pb-32">
          {error ? (
            <div className="space-y-2 rounded-3xl border border-red-500/40 bg-red-500/10 px-4 sm:px-6 py-4 text-sm">
              <p className="font-semibold text-red-200">Request failed</p>
              <p className="text-red-200/85 break-words">{error}</p>
            </div>
          ) : null}

          <ResultView
            blueprint={blueprint}
            usage={usage}
            rawJson={rawJson}
            model={activeModel}
            characterSeeds={characterSeeds}
            charactersLoading={charactersLoading}
            charactersError={charactersError}
            characterDocs={characterDocs}
            characterBuilding={characterBuilding}
            characterBuildErrors={characterBuildErrors}
            characterPortraits={characterPortraits}
            characterPortraitLoading={characterPortraitLoading}
            characterPortraitErrors={characterPortraitErrors}
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
            onGenerateVideo={generateCharacterVideo}
            activeCharacterId={activeCharacterId}
            posterUrl={posterUrl}
            posterLoading={posterLoading}
            posterError={posterError}
            posterAvailable={posterAvailable}
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
            onGenerateTrailer={() => void generateTrailer()}
            onRegenerateGrid={() => {
              portraitGridDigestRef.current = "";
              setPortraitGridUrl(null);
            }}
            onRegeneratePoster={() => {
              posterDigestRef.current = "";
              setPosterUrl(null);
            }}
            onClearTrailer={() => {
              setTrailerUrl(null);
              setTrailerError(null);
              trailerDigestRef.current = "";
            }}
            onOpenLightbox={(url) => setLightboxImage(url)}
          />
        </div>
      </main>

      <div className="sticky bottom-0 z-40 border-t border-white/12 bg-black/90 backdrop-blur">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 py-4">
          <form onSubmit={handleSubmit}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-black/70 px-4 sm:px-5 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition-colors duration-200",
                "focus-within:border-primary/40 focus-within:bg-black/80",
                !blueprint ? "border-primary/40" : "border-white/15"
              )}
            >
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
                placeholder="Describe the show…"
                className={cn(
                  "h-12 sm:h-14 min-h-0 flex-1 resize-none border-none bg-transparent px-0 py-0 text-lg sm:text-xl font-medium leading-snug tracking-tight text-foreground caret-primary placeholder:text-foreground/45 placeholder:font-normal rounded-none",
                  "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-none focus-visible:outline-none"
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
                  "shrink-0 rounded-full bg-primary px-4 sm:px-5 py-2 text-base font-semibold text-white shadow-[0_12px_30px_rgba(229,9,20,0.35)] transition-all duration-200",
                  "hover:bg-primary/90 hover:shadow-[0_14px_36px_rgba(229,9,20,0.55)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                )}
                >
                  {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">Send to {selectedModelOption.label}</span>
                    <SendHorizontal className="h-5 w-5" />
                  </div>
                  )}
                </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
