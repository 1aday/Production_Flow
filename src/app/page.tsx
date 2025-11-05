"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

const examples = [
  "Animated noir set in a vertical eco-city where memories are traded as currency.",
  "Children's puppet space opera about a misfit crew restoring forgotten planets.",
  "A grounded docu-style drama about climate mediators balancing tech and tradition.",
];

type CharacterDocument = {
  character: string;
  inherits: string;
  metadata?: {
    role?: string;
    function?: string;
    tags?: string[];
  };
  biometrics?: {
    age_years?: { value?: number; approximate?: boolean };
    ethnicity?: string;
  };
  look?: {
    silhouette?: string;
    palette?: { anchors?: string[]; notes?: string };
    wardrobe?: {
      silhouette_rules?: string;
      items?: string[];
      accessories?: string[];
    };
  };
  performance?: {
    expression_set?: string[];
  };
  [key: string]: unknown;
};

type ModelId = "gpt-5" | "gpt-4o";

const MODEL_OPTIONS: Array<{
  id: ModelId;
  label: string;
  helper: string;
  badgeClass: string;
}> = [
  {
    id: "gpt-5",
    label: "GPT-5",
    helper: "High-reasoning structured output",
    badgeClass: "bg-[#6B5B95]/10 text-[#4C3F84]",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    helper: "Fast JSON mode responses",
    badgeClass: "bg-[#2F95A5]/10 text-[#1E6D76]",
  },
];

let cachedAudioContext: AudioContext | null = null;

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
      <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
        {title}
      </h3>
      {description ? (
        <p className="text-sm text-neutral-600">{description}</p>
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
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white/70">
      <Table className="w-full">
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.label} className="even:bg-neutral-50/70">
              <TableCell className="w-48 whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {item.label}
              </TableCell>
              <TableCell className="max-w-[0] break-words px-4 py-3 text-sm text-neutral-800 whitespace-pre-wrap">
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
          className="rounded-full border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-700 break-words"
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
            className="h-7 w-7 rounded-full border border-neutral-200 shadow-inner"
            style={{ backgroundColor: hex }}
            aria-hidden
          />
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-600">
            {hex}
          </span>
        </div>
      ))}
    </div>
  );
}

const accentVariants = {
  iris: {
    container:
      "border-[#6B5B95]/30 bg-gradient-to-r from-[#f4f1ff] via-white to-white",
    indicator: "bg-[#6B5B95]",
  },
  lagoon: {
    container:
      "border-[#2F95A5]/25 bg-gradient-to-r from-[#ecfbff] via-white to-white",
    indicator: "bg-[#2F95A5]",
  },
  amber: {
    container:
      "border-[#D48A1E]/25 bg-gradient-to-r from-[#fff7eb] via-white to-white",
    indicator: "bg-[#D48A1E]",
  },
  moss: {
    container:
      "border-[#3F7F4C]/25 bg-gradient-to-r from-[#eef9f0] via-white to-white",
    indicator: "bg-[#3F7F4C]",
  },
  blush: {
    container:
      "border-[#C75C8F]/25 bg-gradient-to-r from-[#fff0f6] via-white to-white",
    indicator: "bg-[#C75C8F]",
  },
  coral: {
    container:
      "border-[#E6695B]/25 bg-gradient-to-r from-[#fff1ed] via-white to-white",
    indicator: "bg-[#E6695B]",
  },
  sand: {
    container:
      "border-[#CF9F69]/25 bg-gradient-to-r from-[#fff7ec] via-white to-white",
    indicator: "bg-[#CF9F69]",
  },
  slate: {
    container:
      "border-[#4B5563]/20 bg-gradient-to-r from-[#f5f7fa] via-white to-white",
    indicator: "bg-[#4B5563]",
  },
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
        "relative overflow-hidden rounded-2xl border shadow-sm transition",
        variant.container,
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-1",
          variant.indicator
        )}
      />
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/60"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "mt-1 h-2.5 w-2.5 rounded-full transition",
              variant.indicator
            )}
          />
          <div className="space-y-1">
            <p className="text-base font-semibold text-neutral-900">{title}</p>
            {description ? (
              <p className="text-sm text-neutral-600">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {metadata}
          <ChevronDown
            className={cn(
              "h-4 w-4 flex-shrink-0 text-neutral-500 transition-transform duration-200",
              isOpen ? "rotate-180" : ""
            )}
            aria-hidden
          />
        </div>
      </button>
      {isOpen ? (
        <div className="border-t border-white/60 bg-white/75">
          <div className="px-6 py-5">{children}</div>
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
  const timeoutRef = useRef<number>();

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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-xs text-neutral-600 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 gap-1 rounded-full px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
        >
          <Copy className="h-3.5 w-3.5" />
          {copyState === "copied"
            ? "Copied!"
            : copyState === "error"
              ? "Copy failed"
              : "Copy JSON"}
        </Button>
        <span className="inline-block h-3 w-px bg-neutral-200" />
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsJsonOpen((value) => !value)}
          className="h-7 rounded-full px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
        >
          {isJsonOpen ? "Hide JSON" : "View JSON"}
        </Button>
      </div>
      {isJsonOpen ? (
        <div className="max-h-72 overflow-auto rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 text-xs leading-relaxed text-neutral-800 shadow-inner">
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
}) {
  if (!blueprint) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-neutral-900">
            Nothing generated yet
          </CardTitle>
          <CardDescription className="text-sm text-neutral-500">
            Drop a synopsis, a tone brief, or a fragment of script below. The
            assistant will reply with a complete look bible that matches your
            schema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-neutral-600">
          <p>Helpful prompts include:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>What is the emotional arc or pacing of the show?</li>
            <li>Who are the key characters or archetypes in play?</li>
            <li>Any anchors for palette, lighting, or camera references?</li>
          </ul>
        </CardContent>
      </Card>
    );
  }

  const data = blueprint.visual_aesthetics;
  const modelConfig =
    MODEL_OPTIONS.find((option) => option.id === model) ?? MODEL_OPTIONS[0];
  const usageBadge =
    usage?.input_tokens !== undefined ? (
      <Badge className={`border-none ${modelConfig.badgeClass}`}>
        input {usage.input_tokens} · output {usage.output_tokens ?? "—"}
      </Badge>
    ) : null;

  const posterSection = posterAvailable ? (
    posterLoading || posterError || posterUrl ? (
      <CollapsibleSection
        title="Poster concept"
        description="Key art generated from the look bible."
        accent="iris"
        defaultOpen
      >
        {posterLoading ? (
          <Card className="border border-neutral-200 bg-white/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating poster…
              </CardTitle>
            </CardHeader>
          </Card>
        ) : posterError ? (
          <Card className="border border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-red-700">
                Poster generation failed
              </CardTitle>
              <CardDescription className="text-sm text-red-600">
                {posterError}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : posterUrl ? (
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-900/70">
            <div className="relative h-0 w-full pb-[66%]">
              <Image
                src={posterUrl}
                alt="Generated poster concept"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 600px, 100vw"
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
      <Card className="border border-neutral-200 bg-neutral-50/80">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-700">
            Poster generation unavailable
          </CardTitle>
          <CardDescription className="text-sm text-neutral-600">
            Provide a Replicate API token to enable automatic key art.
          </CardDescription>
        </CardHeader>
      </Card>
    </CollapsibleSection>
  );

  const masterContent = (
    <>
      <CollapsibleSection
        title="Look bible directive"
        description={data.goal}
        accent="iris"
        metadata={usageBadge}
      >
        <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
          <p className="text-base font-medium text-neutral-900">{data.goal}</p>
          <p className="text-xs text-neutral-500">
            {model === "gpt-4o"
              ? "Generated with GPT-4o in JSON mode (temperature 1, top_p 1)."
              : "Generated with GPT-5 · Reasoning effort: low · Verbosity: medium"}
          </p>
        </div>
      </CollapsibleSection>

      {posterSection}

      <div className="grid gap-4 md:grid-cols-2 items-start">
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
                <Separator />
                <SectionHeading title="Avoid" />
                <ArrayPills values={data.color.prohibitions} />
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
                <Separator />
                <SectionHeading title="No-go" />
                <ArrayPills values={data.lighting.no_go} />
              </>
            ) : null}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Camera grammar"
          description="Preferred glass, movement, and coverage."
          accent="moss"
        >
          <div className="space-y-6">
            <KeyValueTable
              items={[
                { label: "Sensor", value: data.camera.sensor },
                { label: "DOF guides", value: data.camera.dof_guides },
              ]}
            />
            <SectionHeading title="Lens family" />
            <ArrayPills values={data.camera.lens_family} />
            {data.camera.movement && data.camera.movement.length ? (
              <>
                <Separator />
                <SectionHeading title="Movement" />
                <ArrayPills values={data.camera.movement} />
              </>
            ) : null}
            {data.camera.coverage_rules && data.camera.coverage_rules.length ? (
              <>
                <Separator />
                <SectionHeading title="Coverage rules" />
                <ArrayPills values={data.camera.coverage_rules} />
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
          title="Materials & textures"
          description="Surface language for cast and environments."
          accent="sand"
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
      </div>

      <CollapsibleSection
        title="Species design"
        description="Character sheets for every performer type."
        accent="coral"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {data.species_design.types.map((type) => (
            <div
              key={type.name}
              className="rounded-xl border border-neutral-200/80 bg-white/80 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-semibold text-neutral-900">
                  {type.name}
                </p>
                <Badge className="border-none bg-[#E6695B]/10 text-[#CF4F43]">
                  {type.surface_finish}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-neutral-600">{type.silhouette}</p>
              <Separator className="my-4" />
              <div className="space-y-3 text-sm text-neutral-600">
                {type.materials ? (
                  <p>
                    <span className="font-medium text-neutral-700">
                      Materials:
                    </span>{" "}
                    {type.materials}
                  </p>
                ) : null}
                <p>
                  <span className="font-medium text-neutral-700">Eyes:</span>{" "}
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
                  <span className="font-medium text-neutral-700">
                    Face modularity:
                  </span>{" "}
                  {type.face_modularity}
                </p>
                {type.stress_cues ? (
                  <p>
                    <span className="font-medium text-neutral-700">
                      Stress cues:
                    </span>{" "}
                    {type.stress_cues}
                  </p>
                ) : null}
                {type.palette?.anchors && type.palette.anchors.length ? (
                  <div className="space-y-2">
                    <span className="font-medium text-neutral-700">
                      Palette anchors
                    </span>
                    <ColorSwatches colors={type.palette.anchors} />
                    {type.palette.notes ? (
                      <p className="text-xs text-neutral-500">
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

      <div className="grid gap-4 md:grid-cols-2 items-start">
        <CollapsibleSection
          title="Sets & props"
          description="Environmental guardrails."
          accent="lagoon"
        >
          <div className="space-y-6">
            <SectionHeading title="Primary sets" />
            <ArrayPills values={data.sets_and_prop_visuals.primary_sets} />
            <KeyValueTable
              items={[
                { label: "Prop style", value: data.sets_and_prop_visuals.prop_style },
                {
                  label: "Display devices",
                  value: data.sets_and_prop_visuals.display_devices,
                },
              ]}
            />
            {data.sets_and_prop_visuals.runner_gags_visual &&
            data.sets_and_prop_visuals.runner_gags_visual.length ? (
              <>
                <Separator />
                <SectionHeading title="Recurring gags" />
                <ArrayPills values={data.sets_and_prop_visuals.runner_gags_visual} />
              </>
            ) : null}
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
            <Separator />
            <SectionHeading title="Export specs" />
            <div className="space-y-3 text-sm text-neutral-600">
              <div>
                <p className="font-medium text-neutral-700">Stills</p>
                <ArrayPills values={data.export_specs.stills} />
              </div>
              <div>
                <p className="font-medium text-neutral-700">Video intermediate</p>
                <p>{data.export_specs.video_intermediate}</p>
              </div>
              <div>
                <p className="font-medium text-neutral-700">Delivery color</p>
                <p>{data.export_specs.delivery_color}</p>
              </div>
              <div>
                <p className="font-medium text-neutral-700">Plates</p>
                <ArrayPills values={data.export_specs.plates} />
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        title="Global prohibitions"
        description="Do-not-cross guardrails to keep the look coherent."
        accent="slate"
      >
        <ArrayPills values={data.prohibitions_global} />
      </CollapsibleSection>
    </>
  );

  const charactersContent = (() => {
    if (charactersLoading) {
      return (
        <Card className="border border-neutral-200 bg-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating character bible…
            </CardTitle>
          </CardHeader>
        </Card>
      );
    }

    if (charactersError) {
      return (
        <Card className="border border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-red-700">
              Character request failed
            </CardTitle>
            <CardDescription className="text-sm text-red-600">
              {charactersError}
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    if (!characters || characters.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/60 p-6 text-sm text-neutral-500">
          No characters generated yet.
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 items-start">
        {characters.map((characterDoc, index) => {
          const role = characterDoc.metadata?.role;
          const storyFunction = characterDoc.metadata?.function;
          const tags = characterDoc.metadata?.tags ?? [];
          const paletteAnchors = characterDoc.look?.palette?.anchors ?? [];
          const wardrobe = characterDoc.look?.wardrobe;
          const ageValue = characterDoc.biometrics?.age_years?.value;
          const ethnicity = characterDoc.biometrics?.ethnicity;

          return (
            <Card
              key={characterDoc.character || `character-${index}`}
              className="rounded-2xl border border-neutral-200 bg-white/80 shadow-sm"
            >
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg font-semibold text-neutral-900">
                  {characterDoc.character || "Unnamed character"}
                </CardTitle>
                <CardDescription className="text-sm text-neutral-600">
                  {role || "Character"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-neutral-700">
                {storyFunction ? (
                  <p className="text-neutral-600">{storyFunction}</p>
                ) : null}
                {ageValue || ethnicity ? (
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    {ageValue ? `Age ${ageValue}` : null}
                    {ageValue && ethnicity ? " • " : ""}
                    {ethnicity || null}
                  </p>
                ) : null}
                {tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="rounded-full border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-700"
                      >
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
                      <p className="text-neutral-600">
                        {wardrobe.silhouette_rules}
                      </p>
                    ) : null}
                    {wardrobe.items && wardrobe.items.length ? (
                      <div className="flex flex-wrap gap-2">
                        {wardrobe.items.map((item) => (
                          <Badge
                            key={item}
                            variant="outline"
                            className="rounded-full border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-700"
                          >
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
      <TabsContent value="master" className="space-y-5">
        {masterContent}
      </TabsContent>
      <TabsContent value="characters" className="space-y-5">
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
    if (blueprint) {
      playSuccessChime();
    }
  }, [blueprint]);

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

  const handleExample = useCallback(
    (example: string) => {
      setInput(example);
    },
    []
  );

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs font-medium">
                {selectedModelOption.label}
              </Badge>
              <span className="text-xs text-neutral-500">
                {selectedModelOption.helper}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="model-select"
                className="text-xs font-semibold uppercase tracking-wide text-neutral-500"
              >
                Model
              </label>
              <select
                id="model-select"
                value={model}
                onChange={(event) => setModel(event.target.value as ModelId)}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-neutral-900">
              Show bible visualizer
            </h1>
            <p className="max-w-3xl text-sm text-neutral-600">
              Paste your concept and we will surface character-driven visual
              direction aligned to the provided schema. Clean, ready for review,
              and easy to tweak.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <Button
                key={example}
                type="button"
                variant="outline"
                onClick={() => handleExample(example)}
                className="border-neutral-200 text-xs text-neutral-700 hover:bg-neutral-100"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
          {error ? (
            <Card className="border border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-red-700">
                  Request failed
                </CardTitle>
                <CardDescription className="text-sm text-red-600">
                  {error}
                </CardDescription>
              </CardHeader>
            </Card>
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
        />
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Describe the show tone, key characters, and any must-hit visual notes..."
              className="min-h-[120px] max-h-60 resize-none overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-400"
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
              <p className="text-xs text-neutral-500">
                Press ⌘⏎ / Ctrl⏎ to send instantly.
              </p>
              <div className="flex items-center gap-2">
                {blueprint ? (
                  <Button
                    type="button"
                    variant="outline"
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
                    }}
                    className="border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  >
                    Clear result
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
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
