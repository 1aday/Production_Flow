"use client";

import { useEffect, useState } from "react";
import { Save, RotateCcw, Loader2, Sparkles, User, Image as ImageIcon, Video, Film, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";

type PromptTemplates = {
  id: string;
  version: string;
  showGenerationDirective: string;
  characterExtractionDirective: string;
  characterBuildDirective: string;
  portraitBasePrompt: string;
  videoBasePrompt: string;
  posterBasePrompt: string;
  trailerBasePrompt: string;
  episodeStillsPrompt: string;
  episodeClipsPrompt: string;
  updatedAt: string;
};

export default function PromptsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplates | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/prompts");
      if (!response.ok) throw new Error("Failed to load templates");
      
      const data = await response.json() as { templates: PromptTemplates };
      setTemplates(data.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const saveTemplates = async () => {
    if (!templates) return;

    setSaving(true);
    try {
      const response = await fetch("/api/prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showGenerationDirective: templates.showGenerationDirective,
          characterExtractionDirective: templates.characterExtractionDirective,
          characterBuildDirective: templates.characterBuildDirective,
          portraitBasePrompt: templates.portraitBasePrompt,
          videoBasePrompt: templates.videoBasePrompt,
          posterBasePrompt: templates.posterBasePrompt,
          trailerBasePrompt: templates.trailerBasePrompt,
          episodeStillsPrompt: templates.episodeStillsPrompt,
          episodeClipsPrompt: templates.episodeClipsPrompt,
        }),
      });

      if (!response.ok) throw new Error("Failed to save templates");
      
      setHasChanges(false);
      await loadTemplates(); // Reload to get updated timestamp
      console.log("✅ Prompt templates saved successfully");
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Failed to save templates. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    if (!confirm("Reset ALL prompts to factory defaults? This cannot be undone.")) return;
    
    setSaving(true);
    try {
      const response = await fetch("/api/prompts/reset", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to reset templates");
      
      await loadTemplates();
      setHasChanges(false);
      console.log("✅ Reset to defaults");
    } catch (err) {
      console.error("Failed to reset:", err);
      alert("Failed to reset templates. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-foreground">
        <Navbar variant="solid" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-foreground/70">Loading prompt templates...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !templates) {
    return (
      <div className="min-h-screen bg-black text-foreground">
        <Navbar variant="solid" />
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-8 pt-20 sm:pt-24">
          <div className="space-y-4 text-center">
            <p className="text-red-400 font-semibold">Failed to load prompt templates</p>
            <p className="text-sm text-foreground/60">{error || "Database error"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Navbar */}
      <Navbar variant="solid" />
      
      {/* Page Header */}
      <div className="pt-16 border-b border-white/10">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-3 sm:px-5 py-2.5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-base sm:text-lg font-sans font-semibold text-white">AI Prompts</h1>
              <p className="text-[10px] text-white/50">Global templates for all shows</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] h-5">
              v{templates.version}
            </Badge>
            {hasChanges ? (
              <Badge variant="outline" className="text-amber-400 border-amber-400/40 bg-amber-400/10 text-[9px] h-5">
                Unsaved
              </Badge>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetToDefault}
              disabled={saving}
              className="gap-1.5 rounded-full h-8 px-3 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={saveTemplates}
              disabled={saving || !hasChanges}
              className="gap-1.5 rounded-full h-8 px-3 text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-2 sm:px-4 lg:px-6 py-3 sm:py-5 space-y-4 pb-20">
        {/* Info Banner */}
        <div className="rounded-lg border border-blue-500/25 bg-blue-500/8 px-3 py-2.5">
          <p className="text-xs text-blue-200/80">
            <strong>Global Prompt Templates:</strong> These prompts are used for ALL shows. Variables like <code className="px-1 py-0.5 rounded bg-black/40 text-[10px]">{`{SHOW_TITLE}`}</code> are automatically replaced.
          </p>
        </div>

        {/* Show Generation */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Show Generation Directive
            </CardTitle>
            <CardDescription className="text-[11px]">System directive for creating show blueprints</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Textarea
              value={templates.showGenerationDirective}
              onChange={(e) => {
                setTemplates({ ...templates, showGenerationDirective: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[150px] resize-y rounded-lg bg-black/60 text-xs border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Character Extraction */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-primary" />
              Character Extraction Directive
            </CardTitle>
            <CardDescription className="text-[11px]">System directive for extracting character seeds</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Textarea
              value={templates.characterExtractionDirective}
              onChange={(e) => {
                setTemplates({ ...templates, characterExtractionDirective: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[120px] resize-y rounded-lg bg-black/60 text-xs border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Character Build */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-primary" />
              Character Build Directive
            </CardTitle>
            <CardDescription className="text-[11px]">System directive for building full character dossiers</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Textarea
              value={templates.characterBuildDirective}
              onChange={(e) => {
                setTemplates({ ...templates, characterBuildDirective: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[120px] resize-y rounded-lg bg-black/60 text-xs border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Portrait Generation */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4 text-primary" />
              Portrait Generation Template
            </CardTitle>
            <CardDescription className="text-[11px]">
              Variables: {`{SHOW_TITLE}`}, {`{PRODUCTION_MEDIUM}`}, {`{CINEMATIC_REFERENCES}`}, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Textarea
              value={templates.portraitBasePrompt}
              onChange={(e) => {
                setTemplates({ ...templates, portraitBasePrompt: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[100px] resize-y rounded-lg bg-black/60 text-xs border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Video Generation */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Video className="h-4 w-4 text-primary" />
              Video Generation Template
            </CardTitle>
            <CardDescription className="text-[11px]">
              Variables: {`{DURATION}`}, {`{ASPECT_RATIO}`}, {`{PRODUCTION_MEDIUM}`}, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Textarea
              value={templates.videoBasePrompt}
              onChange={(e) => {
                setTemplates({ ...templates, videoBasePrompt: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[100px] resize-y rounded-lg bg-black/60 text-xs border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Poster Generation */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Film className="h-4 w-4 text-primary" />
              Poster Generation Template
            </CardTitle>
            <CardDescription className="text-[11px]">
              Variables: {`{SHOW_TITLE}`}, {`{PRODUCTION_MEDIUM}`}, {`{STYLIZATION_LEVEL}`}, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Textarea
              value={templates.posterBasePrompt}
              onChange={(e) => {
                setTemplates({ ...templates, posterBasePrompt: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[120px] resize-y rounded-lg bg-black/60 text-xs border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Trailer Generation */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clapperboard className="h-4 w-4 text-primary" />
              Trailer Generation Template
            </CardTitle>
            <CardDescription className="text-[11px]">
              Variables: {`{SHOW_TITLE}`}, {`{LOGLINE}`}, {`{PRODUCTION_MEDIUM}`}, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Textarea
              value={templates.trailerBasePrompt}
              onChange={(e) => {
                setTemplates({ ...templates, trailerBasePrompt: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[140px] resize-y rounded-lg bg-black/60 text-xs border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Episode Studio Section Divider */}
        <div className="relative py-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-emerald-500/25" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-black px-3 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Clapperboard className="h-3.5 w-3.5" />
              Episode Studio Templates
            </span>
          </div>
        </div>

        {/* Episode Stills Generation */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4 text-emerald-400" />
              Episode Stills Template
            </CardTitle>
            <CardDescription className="text-[11px]">
              Template for generating scene keyframe images
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Textarea
              value={templates.episodeStillsPrompt || ''}
              onChange={(e) => {
                setTemplates({ ...templates, episodeStillsPrompt: e.target.value });
                setHasChanges(true);
              }}
              placeholder="Template for generating episode scene stills..."
              className="min-h-[140px] resize-y rounded-lg bg-black/60 text-xs border-emerald-500/20 font-mono focus:border-emerald-500/50"
            />
          </CardContent>
        </Card>

        {/* Episode Clips Generation */}
        <Card className="border-violet-500/20 bg-violet-500/5">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Video className="h-4 w-4 text-violet-400" />
              Episode Clips Template
            </CardTitle>
            <CardDescription className="text-[11px]">
              Template for animating scene stills into video clips (VEO 3.1)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Textarea
              value={templates.episodeClipsPrompt || ''}
              onChange={(e) => {
                setTemplates({ ...templates, episodeClipsPrompt: e.target.value });
                setHasChanges(true);
              }}
              placeholder="Template for generating episode scene video clips..."
              className="min-h-[140px] resize-y rounded-lg bg-black/60 text-xs border-violet-500/20 font-mono focus:border-violet-500/50"
            />
          </CardContent>
        </Card>

        {/* Updated timestamp */}
        <p className="text-center text-[10px] text-foreground/40">
          Last updated: {new Date(templates.updatedAt).toLocaleString()}
        </p>

        {/* Sticky Save Button */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={saveTemplates}
            disabled={saving || !hasChanges}
            className="gap-2 rounded-full shadow-[0_8px_30px_rgba(229,9,20,0.4)] px-5 h-9 text-xs"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : hasChanges ? "Save All Templates" : "No Changes"}
          </Button>
        </div>
      </main>
    </div>
  );
}


