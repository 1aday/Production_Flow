"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Copy, Loader2, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
  };
  [key: string]: unknown;
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

function useRotatingMessage(active: boolean, messages: readonly string[], intervalMs = 1600) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    if (!messages.length) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);
    return () => {
      window.clearInterval(id);
    };
  }, [active, intervalMs, messages]);

  useEffect(() => {
    if (!active) {
      setIndex(0);
    }
  }, [active]);

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

const SESSION_STORAGE_KEY = "production-flow.session.v1";

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
  characters,
  charactersLoading,
  charactersError,
  posterUrl,
  posterLoading,
  posterError,
  posterAvailable,
  isLoading,
}: {
  blueprint: ShowBlueprint | null;
  usage?: ApiResponse["usage"];
  rawJson?: string | null;
  model: ModelId;
  characters: CharacterDocument[] | null;
  charactersLoading: boolean;
  charactersError: string | null;
  posterUrl: string | null;
  posterLoading: boolean;
  posterError: string | null;
  posterAvailable: boolean;
  isLoading: boolean;
}) {
  const loaderActive = !blueprint && isLoading;
  const loaderMessage = useRotatingMessage(loaderActive, LOADING_MESSAGES, 1700);

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
      <div className="rounded-3xl border border-white/12 bg-black/45 p-12 text-center shadow-[0_18px_60px_rgba(0,0,0,0.6)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/55">
          Ready when you are
        </p>
        <p className="mt-4 text-base text-foreground/70">
          Drop a synopsis or tone brief and we’ll stage the entire look bible here.
        </p>
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

  const posterSection = posterAvailable ? (
    posterLoading || posterError || posterUrl ? (
      <CollapsibleSection
        title="Poster concept"
        description="Key art pulled directly from the latest look bible."
        accent="iris"
        defaultOpen
      >
        {posterLoading ? (
          <div className="flex items-center gap-3 rounded-3xl border border-white/12 bg-black/45 px-5 py-4 text-sm text-foreground/70">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Generating poster…
          </div>
        ) : posterError ? (
          <div className="space-y-3 rounded-3xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm">
            <p className="font-semibold text-red-200">Poster generation failed</p>
            <p className="text-red-200/80">{posterError}</p>
          </div>
        ) : posterUrl ? (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
            <div className="relative h-0 w-full pb-[80%]">
              <Image
                src={posterUrl}
                alt="Generated poster concept"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 560px, 100vw"
                priority
              />
            </div>
          </div>
        ) : null}
      </CollapsibleSection>
    ) : null
  ) : (
    <CollapsibleSection
      title="Poster concept"
      description="Connect Replicate to render hero artwork."
      accent="iris"
      defaultOpen={false}
    >
      <div className="rounded-3xl border border-white/12 bg-black/45 px-5 py-4 text-sm text-foreground/65">
        Poster generation is disabled. Add a Replicate token to unlock one-click key art.
      </div>
    </CollapsibleSection>
  );

  const loglinePanel = (
    <div className="rounded-3xl border border-white/12 bg-black/45 p-6 space-y-4 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground/55">
          Series logline
        </p>
        {usageBadge}
      </div>
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

  const masterContent = (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {loglinePanel}
          {posterBriefPanel}
          {directivePanel}
        </div>
        <div className="space-y-6">
          {posterSection}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
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
          Building character bible…
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

    if (!characters || characters.length === 0) {
      return (
        <div className="rounded-3xl border border-dashed border-white/12 bg-black/45 p-6 text-center text-sm text-foreground/55">
          No characters generated yet.
        </div>
      );
    }

    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {characters.map((characterDoc, index) => {
          const role = characterDoc.metadata?.role;
          const storyFunction = characterDoc.metadata?.function;
          const tags = characterDoc.metadata?.tags ?? [];
          const paletteAnchors = characterDoc.look?.palette?.anchors ?? [];
          const wardrobe = characterDoc.look?.wardrobe;
          const ageValue = characterDoc.biometrics?.age_years?.value;
          const ethnicity = characterDoc.biometrics?.ethnicity;

          return (
            <Card key={characterDoc.character || `character-${index}`} className="h-full">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold text-foreground">
                  {characterDoc.character || "Unnamed character"}
                </CardTitle>
                <CardDescription className="text-sm text-foreground/55">
                  {role || "Character"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-foreground/70">
                {storyFunction ? <p>{storyFunction}</p> : null}
                {ageValue || ethnicity ? (
                  <p className="text-[11px] uppercase tracking-[0.26em] text-foreground/45">
                    {ageValue ? `Age ${ageValue}` : null}
                    {ageValue && ethnicity ? " • " : ""}
                    {ethnicity || null}
                  </p>
                ) : null}
                {tags.length ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {paletteAnchors.length ? (
                  <div className="space-y-2">
                    <SectionHeading title="Palette" />
                    <ColorSwatches colors={paletteAnchors} />
                  </div>
                ) : null}
                {wardrobe ? (
                  <div className="space-y-2">
                    <SectionHeading title="Wardrobe" />
                    {wardrobe.silhouette_rules ? (
                      <p className="text-foreground/65">{wardrobe.silhouette_rules}</p>
                    ) : null}
                    {wardrobe.items && wardrobe.items.length ? (
                      <div className="flex flex-wrap gap-2">
                        {wardrobe.items.map((item) => (
                          <Badge key={item} variant="outline">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  })();

  return (
    <Tabs defaultValue="master" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="master">Master</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
        </TabsList>
        <RawJsonPeek key={rawJson ?? "no-json"} rawJson={rawJson} />
      </div>
      <TabsContent value="master" className="space-y-5 pb-32">
        {masterContent}
      </TabsContent>
      <TabsContent value="characters" className="space-y-5 pb-32">
        {charactersContent}
      </TabsContent>
    </Tabs>
  );

}

export default function Home() {
  const [input, setInput] = useState("");
  const [blueprint, setBlueprint] = useState<ShowBlueprint | null>(null);
  const [usage, setUsage] = useState<ApiResponse["usage"]>();
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<ModelId>("gpt-5");
  const [activeModel, setActiveModel] = useState<ModelId>("gpt-5");
  const selectedModelOption = useMemo(
    () => MODEL_OPTIONS.find((option) => option.id === model) ?? MODEL_OPTIONS[0],
    [model]
  );
  const [characters, setCharacters] = useState<CharacterDocument[] | null>(null);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [charactersError, setCharactersError] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [posterLoading, setPosterLoading] = useState(false);
  const [posterError, setPosterError] = useState<string | null>(null);
  const [posterAvailable, setPosterAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as {
        model?: ModelId;
        blueprint?: ShowBlueprint | null;
        usage?: ApiResponse["usage"];
        rawJson?: string | null;
        characters?: CharacterDocument[] | null;
        posterUrl?: string | null;
        posterAvailable?: boolean;
      };

      if (parsed.model) {
        setModel(parsed.model);
        setActiveModel(parsed.model);
      }
      if (parsed.blueprint) {
        setBlueprint(parsed.blueprint);
      }
      if (parsed.usage) {
        setUsage(parsed.usage);
      }
      if (parsed.rawJson) {
        setRawJson(parsed.rawJson);
      }
      if (parsed.characters) {
        setCharacters(parsed.characters);
      }
      if (parsed.posterUrl) {
        setPosterUrl(parsed.posterUrl);
      }
      if (typeof parsed.posterAvailable === "boolean") {
        setPosterAvailable(parsed.posterAvailable);
      }
    } catch (error) {
      console.error("Failed to restore session", error);
    }
  }, []);

  useEffect(() => {
    if (blueprint) {
      playSuccessChime();
    }
  }, [blueprint]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      !blueprint &&
      (!characters || characters.length === 0) &&
      !posterUrl &&
      !rawJson
    ) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    const payload = {
      model: activeModel,
      blueprint,
      usage,
      rawJson,
      characters,
      posterUrl,
      posterAvailable,
    };
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error("Failed to persist session", error);
    }
  }, [activeModel, blueprint, characters, posterAvailable, posterUrl, rawJson, usage]);

  const canSubmit = useMemo(
    () => input.trim().length > 0 && !isLoading,
    [input, isLoading]
  );

  const generateCharacters = useCallback(
    async (value: string, showData: ShowBlueprint, chosenModel: ModelId) => {
      setCharactersLoading(true);
      setCharactersError(null);

      try {
        const response = await fetch("/api/characters", {
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
          characters?: CharacterDocument[];
        };

        setCharacters(result.characters ?? []);
      } catch (err) {
        console.error(err);
        setCharactersError(
          err instanceof Error
            ? err.message
            : "Unable to generate characters."
        );
        setCharacters(null);
      } finally {
        setCharactersLoading(false);
      }
    },
    []
  );

  const generatePoster = useCallback(
    async (value: string) => {
      setPosterLoading(true);
      setPosterError(null);

      const pitch = value.trim();

      const trimmedPrompt =
        pitch.length > 5000 ? `${pitch.slice(0, 4950)}…` : pitch;

      try {
        const response = await fetch("/api/poster", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: trimmedPrompt || value.slice(0, 4950),
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          const fallback = `Failed to generate poster (${response.status}).`;
          throw new Error(body?.error ?? fallback);
        }

        const result = (await response.json()) as { url?: string };
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

  const submitPrompt = useCallback(
    async (value: string, chosenModel: ModelId) => {
      if (!value.trim()) return;
      setIsLoading(true);
      setError(null);
      setCharacters(null);
      setCharactersError(null);
      setPosterUrl(null);
      setPosterError(null);
      setPosterLoading(false);
      setPosterAvailable(false);

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

        const posterIsAvailable = Boolean(result.posterAvailable);
        setPosterAvailable(posterIsAvailable);

        const tasks: Array<Promise<void>> = [
          generateCharacters(value, result.data, chosenModel),
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
    [generateCharacters, generatePoster]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await submitPrompt(input, model);
    },
    [input, submitPrompt, model]
  );

  return (
    <div className="flex min-h-screen flex-col bg-black text-foreground">
      <header className="border-b border-white/12 bg-black/90">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold uppercase tracking-[0.32em] text-primary">
              Production Flow
            </span>
            <span className="text-xs text-foreground/55">Look bible console</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-[11px] font-semibold uppercase tracking-[0.26em]">
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
              className="rounded-full border border-white/15 bg-black/60 px-4 py-2 text-sm text-foreground/75 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 pb-32">
          {error ? (
            <div className="space-y-2 rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm">
              <p className="font-semibold text-red-200">Request failed</p>
              <p className="text-red-200/85">{error}</p>
            </div>
          ) : null}

          <ResultView
            blueprint={blueprint}
            usage={usage}
            rawJson={rawJson}
            model={activeModel}
            characters={characters}
            charactersLoading={charactersLoading}
            charactersError={charactersError}
            posterUrl={posterUrl}
            posterLoading={posterLoading}
            posterError={posterError}
            posterAvailable={posterAvailable}
            isLoading={isLoading}
          />
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-white/12 bg-black/90 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Tell us what the show needs visually…"
              className="overflow-hidden"
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  if (canSubmit) {
                    void submitPrompt(input, model);
                  }
                }
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-foreground/55">
                Press ⌘⏎ / Ctrl⏎ to send instantly.
              </p>
              <div className="flex items-center gap-2">
                {blueprint ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setBlueprint(null);
                      setUsage(undefined);
                      setRawJson(null);
                      setActiveModel(model);
                      setCharacters(null);
                      setCharactersError(null);
                      setCharactersLoading(false);
                      setPosterUrl(null);
                      setPosterError(null);
                      setPosterLoading(false);
                      setPosterAvailable(false);
                      if (typeof window !== "undefined") {
                        window.localStorage.removeItem(SESSION_STORAGE_KEY);
                      }
                    }}
                  >
                    Clear result
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      Send to {selectedModelOption.label}
                      <SendHorizontal className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
