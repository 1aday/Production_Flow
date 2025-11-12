"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, RotateCcw, Settings, User, Image as ImageIcon, Video, Film, Clapperboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type ShowPrompts = {
  id: string;
  title: string;
  originalPrompt: string | null;
  customPortraitPrompts: Record<string, string>;
  customVideoPrompts: Record<string, string>;
  customPosterPrompt: string | null;
  customTrailerPrompt: string | null;
  characterSeeds?: Array<{ id: string; name: string }>;
};

export default function ControlPanelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showId = searchParams.get("show");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prompts, setPrompts] = useState<ShowPrompts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const loadPrompts = useCallback(async () => {
    if (!showId) {
      setError("No show ID provided");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/control-panel/${showId}`);
      if (!response.ok) throw new Error("Failed to load prompts");
      
      const data = await response.json() as { prompts: ShowPrompts };
      setPrompts(data.prompts);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load prompts");
      setLoading(false);
    }
  }, [showId]);

  const savePrompts = async () => {
    if (!prompts || !showId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/control-panel/${showId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalPrompt: prompts.originalPrompt,
          customPortraitPrompts: prompts.customPortraitPrompts,
          customVideoPrompts: prompts.customVideoPrompts,
          customPosterPrompt: prompts.customPosterPrompt,
          customTrailerPrompt: prompts.customTrailerPrompt,
        }),
      });

      if (!response.ok) throw new Error("Failed to save prompts");
      
      setHasChanges(false);
      console.log("✅ Prompts saved successfully");
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Failed to save prompts. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const resetPrompt = (type: 'original' | 'poster' | 'trailer') => {
    if (!prompts) return;
    
    const updated = { ...prompts };
    if (type === 'original') updated.originalPrompt = null;
    if (type === 'poster') updated.customPosterPrompt = null;
    if (type === 'trailer') updated.customTrailerPrompt = null;
    
    setPrompts(updated);
    setHasChanges(true);
  };

  const resetCharacterPrompt = (characterId: string, type: 'portrait' | 'video') => {
    if (!prompts) return;
    
    const updated = { ...prompts };
    if (type === 'portrait') {
      const newPrompts = { ...updated.customPortraitPrompts };
      delete newPrompts[characterId];
      updated.customPortraitPrompts = newPrompts;
    } else {
      const newPrompts = { ...updated.customVideoPrompts };
      delete newPrompts[characterId];
      updated.customVideoPrompts = newPrompts;
    }
    
    setPrompts(updated);
    setHasChanges(true);
  };

  useEffect(() => {
    void loadPrompts();
  }, [loadPrompts]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-foreground">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-foreground/70">Loading control panel...</p>
        </div>
      </div>
    );
  }

  if (error || !prompts) {
    return (
      <div className="min-h-screen bg-black text-foreground">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="space-y-4 text-center">
            <p className="text-red-400 font-semibold">Failed to load control panel</p>
            <p className="text-sm text-foreground/60">{error || "No show data found"}</p>
            <Button onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/12 bg-black/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-lg font-semibold uppercase tracking-[0.32em] text-primary">
                  Control Panel
                </h1>
                <p className="text-xs text-foreground/50">{prompts.title}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges ? (
              <Badge variant="outline" className="text-amber-400 border-amber-400/40 bg-amber-400/10">
                Unsaved changes
              </Badge>
            ) : null}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={savePrompts}
              disabled={saving || !hasChanges}
              className="gap-2 rounded-full"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8 space-y-6">
        {/* Original Show Prompt */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Film className="h-5 w-5 text-primary" />
                  Original Show Prompt
                </CardTitle>
                <CardDescription>The initial prompt that created this show</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => resetPrompt('original')}
                className="gap-2"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prompts.originalPrompt || ""}
              onChange={(e) => {
                setPrompts({ ...prompts, originalPrompt: e.target.value });
                setHasChanges(true);
              }}
              placeholder="Enter the show concept prompt..."
              className="min-h-[120px] resize-y rounded-2xl bg-black/60 text-sm border-white/15"
            />
          </CardContent>
        </Card>

        {/* Poster Prompt */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Custom Poster Prompt
                </CardTitle>
                <CardDescription>Override the default poster generation prompt</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => resetPrompt('poster')}
                className="gap-2"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prompts.customPosterPrompt || ""}
              onChange={(e) => {
                setPrompts({ ...prompts, customPosterPrompt: e.target.value });
                setHasChanges(true);
              }}
              placeholder="Leave empty to use default poster generation prompt..."
              className="min-h-[100px] resize-y rounded-2xl bg-black/60 text-sm border-white/15"
            />
          </CardContent>
        </Card>

        {/* Trailer Prompt */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clapperboard className="h-5 w-5 text-primary" />
                  Custom Trailer Prompt
                </CardTitle>
                <CardDescription>Override the default trailer generation prompt</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => resetPrompt('trailer')}
                className="gap-2"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prompts.customTrailerPrompt || ""}
              onChange={(e) => {
                setPrompts({ ...prompts, customTrailerPrompt: e.target.value });
                setHasChanges(true);
              }}
              placeholder="Leave empty to use default trailer generation prompt..."
              className="min-h-[100px] resize-y rounded-2xl bg-black/60 text-sm border-white/15"
            />
          </CardContent>
        </Card>

        {/* Character Prompts */}
        {prompts.characterSeeds && prompts.characterSeeds.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Character Prompts</h2>
              <Badge variant="outline">{prompts.characterSeeds.length} characters</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {prompts.characterSeeds.map((char) => (
                <Card key={char.id} className="border-white/8 bg-black/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{char.name}</CardTitle>
                    <CardDescription className="text-xs">{char.id}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Portrait Prompt */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground/70 flex items-center gap-2">
                          <ImageIcon className="h-3 w-3" />
                          Portrait Prompt
                        </label>
                        {prompts.customPortraitPrompts[char.id] ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => resetCharacterPrompt(char.id, 'portrait')}
                            className="h-6 px-2 text-xs"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        ) : null}
                      </div>
                      <Textarea
                        value={prompts.customPortraitPrompts[char.id] || ""}
                        onChange={(e) => {
                          const updated = {
                            ...prompts,
                            customPortraitPrompts: {
                              ...prompts.customPortraitPrompts,
                              [char.id]: e.target.value,
                            },
                          };
                          setPrompts(updated);
                          setHasChanges(true);
                        }}
                        placeholder="Custom portrait prompt..."
                        className="min-h-[80px] resize-y rounded-xl bg-black/60 text-xs border-white/10"
                      />
                    </div>

                    {/* Video Prompt */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground/70 flex items-center gap-2">
                          <Video className="h-3 w-3" />
                          Video Prompt
                        </label>
                        {prompts.customVideoPrompts[char.id] ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => resetCharacterPrompt(char.id, 'video')}
                            className="h-6 px-2 text-xs"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        ) : null}
                      </div>
                      <Textarea
                        value={prompts.customVideoPrompts[char.id] || ""}
                        onChange={(e) => {
                          const updated = {
                            ...prompts,
                            customVideoPrompts: {
                              ...prompts.customVideoPrompts,
                              [char.id]: e.target.value,
                            },
                          };
                          setPrompts(updated);
                          setHasChanges(true);
                        }}
                        placeholder="Custom video prompt..."
                        className="min-h-[80px] resize-y rounded-xl bg-black/60 text-xs border-white/10"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {/* Sticky Save Button */}
        <div className="sticky bottom-6 flex justify-center">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={savePrompts}
            disabled={saving || !hasChanges}
            className="gap-3 rounded-full shadow-[0_12px_40px_rgba(229,9,20,0.45)] px-8"
          >
            <Save className="h-5 w-5" />
            {saving ? "Saving..." : hasChanges ? "Save All Changes" : "No Changes"}
          </Button>
        </div>
      </main>
    </div>
  );
}

