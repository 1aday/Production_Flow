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
        <div className="max-w-4xl mx-auto px-6 py-12 pt-24">
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
      <div className="pt-20 border-b border-white/10">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">AI Prompts</h1>
              <p className="text-xs text-foreground/50">Global templates for all shows</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px]">
              v{templates.version}
            </Badge>
            {hasChanges ? (
              <Badge variant="outline" className="text-amber-400 border-amber-400/40 bg-amber-400/10">
                Unsaved changes
              </Badge>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetToDefault}
              disabled={saving}
              className="gap-2 rounded-full"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={saveTemplates}
              disabled={saving || !hasChanges}
              className="gap-2 rounded-full"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-6 py-8 space-y-6 pb-32">
        {/* Info Banner */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-5 py-4">
          <p className="text-sm text-blue-200/90">
            <strong>Global Prompt Templates:</strong> These prompts are used for ALL shows. Changes here affect future generations. Variables like <code className="px-1.5 py-0.5 rounded bg-black/40">{`{SHOW_TITLE}`}</code> are automatically replaced.
          </p>
        </div>

        {/* Show Generation */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Show Generation Directive
            </CardTitle>
            <CardDescription>System directive for creating show blueprints (visual aesthetics JSON)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={templates.showGenerationDirective}
              onChange={(e) => {
                setTemplates({ ...templates, showGenerationDirective: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[200px] resize-y rounded-2xl bg-black/60 text-sm border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Character Extraction */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Character Extraction Directive
            </CardTitle>
            <CardDescription>System directive for extracting character seeds from user prompts</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={templates.characterExtractionDirective}
              onChange={(e) => {
                setTemplates({ ...templates, characterExtractionDirective: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[180px] resize-y rounded-2xl bg-black/60 text-sm border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Character Build */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Character Build Directive
            </CardTitle>
            <CardDescription>System directive for building full character dossiers</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={templates.characterBuildDirective}
              onChange={(e) => {
                setTemplates({ ...templates, characterBuildDirective: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[180px] resize-y rounded-2xl bg-black/60 text-sm border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Portrait Generation */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Portrait Generation Template
            </CardTitle>
            <CardDescription>
              Base prompt for character portraits. Variables: {`{SHOW_TITLE}`}, {`{PRODUCTION_MEDIUM}`}, {`{CINEMATIC_REFERENCES}`}, {`{VISUAL_TREATMENT}`}, {`{STYLIZATION_LEVEL}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={templates.portraitBasePrompt}
              onChange={(e) => {
                setTemplates({ ...templates, portraitBasePrompt: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[150px] resize-y rounded-2xl bg-black/60 text-sm border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Video Generation */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Video Generation Template
            </CardTitle>
            <CardDescription>
              Base prompt for character videos. Variables: {`{DURATION}`}, {`{ASPECT_RATIO}`}, {`{PRODUCTION_MEDIUM}`}, {`{CINEMATIC_REFERENCES}`}, {`{VISUAL_TREATMENT}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={templates.videoBasePrompt}
              onChange={(e) => {
                setTemplates({ ...templates, videoBasePrompt: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[140px] resize-y rounded-2xl bg-black/60 text-sm border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Poster Generation */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              Poster Generation Template
            </CardTitle>
            <CardDescription>
              Base prompt for show posters. Variables: {`{SHOW_TITLE}`}, {`{PRODUCTION_MEDIUM}`}, {`{CINEMATIC_REFERENCES}`}, {`{VISUAL_TREATMENT}`}, {`{STYLIZATION_LEVEL}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={templates.posterBasePrompt}
              onChange={(e) => {
                setTemplates({ ...templates, posterBasePrompt: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[160px] resize-y rounded-2xl bg-black/60 text-sm border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Trailer Generation */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clapperboard className="h-5 w-5 text-primary" />
              Trailer Generation Template
            </CardTitle>
            <CardDescription>
              Base prompt for trailers. Variables: {`{SHOW_TITLE}`}, {`{LOGLINE}`}, {`{PRODUCTION_MEDIUM}`}, {`{CINEMATIC_REFERENCES}`}, {`{VISUAL_TREATMENT}`}, {`{STYLIZATION_LEVEL}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={templates.trailerBasePrompt}
              onChange={(e) => {
                setTemplates({ ...templates, trailerBasePrompt: e.target.value });
                setHasChanges(true);
              }}
              className="min-h-[200px] resize-y rounded-2xl bg-black/60 text-sm border-white/15 font-mono"
            />
          </CardContent>
        </Card>

        {/* Updated timestamp */}
        <p className="text-center text-xs text-foreground/40">
          Last updated: {new Date(templates.updatedAt).toLocaleString()}
        </p>

        {/* Sticky Save Button */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={saveTemplates}
            disabled={saving || !hasChanges}
            className="gap-3 rounded-full shadow-[0_12px_40px_rgba(229,9,20,0.45)] px-8"
          >
            <Save className="h-5 w-5" />
            {saving ? "Saving..." : hasChanges ? "Save All Templates" : "No Changes"}
          </Button>
        </div>
      </main>
    </div>
  );
}


