"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Zap, Crown, Loader2, RefreshCw, Check, ChevronDown, ChevronUp } from "lucide-react";

type VideoModel = 'sora-2' | 'sora-2-pro' | 'veo-3.1';

interface CharacterSeed {
  id: string;
  name: string;
}

interface ModelInfo {
  id: VideoModel;
  name: string;
  duration: string;
  quality: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

const MODEL_OPTIONS: ModelInfo[] = [
  {
    id: 'sora-2-pro',
    name: 'Sora 2 Pro',
    duration: '12s',
    quality: 'Premium',
    description: 'OpenAI\'s top tier. Highest quality with high resolution.',
    icon: <Crown className="h-4 w-4" />,
    badge: 'Best',
  },
  {
    id: 'sora-2',
    name: 'Sora 2',
    duration: '12s',
    quality: 'High',
    description: 'OpenAI\'s standard model. Fast, high-quality results.',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 'veo-3.1',
    name: 'VEO 3.1',
    duration: '8s',
    quality: 'High',
    description: 'Google\'s model. Fast, reliable, great for quick iterations.',
    icon: <Zap className="h-4 w-4" />,
  },
];

interface TrailerModelSelectorProps {
  currentModel?: string;
  onRegenerate: (model: VideoModel, customPrompt?: string) => void;
  onRegenerateWithNewGrid?: (model: VideoModel, customPrompt?: string, selectedCharacterIds?: string[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
  // Character selection props
  characterSeeds?: CharacterSeed[];
  characterPortraits?: Record<string, string | null>;
  // Prompt editing props
  defaultPrompt?: string;
}

export function TrailerModelSelector({
  currentModel,
  onRegenerate,
  onRegenerateWithNewGrid,
  isLoading = false,
  disabled = false,
  characterSeeds,
  characterPortraits,
  defaultPrompt,
}: TrailerModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<VideoModel>(
    (currentModel as VideoModel) || 'veo-3.1'
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set());

  // Reset selections when expanded
  useEffect(() => {
    if (!isExpanded) {
      setShowAdvanced(false);
      setEditedPrompt("");
      setSelectedCharacters(new Set());
    }
  }, [isExpanded]);

  const handleRegenerate = () => {
    if (selectedCharacters.size >= 4 && onRegenerateWithNewGrid) {
      onRegenerateWithNewGrid(selectedModel, editedPrompt || undefined, Array.from(selectedCharacters));
    } else {
      onRegenerate(selectedModel, editedPrompt || undefined);
    }
    setIsExpanded(false);
  };

  const selectedModelInfo = MODEL_OPTIONS.find(m => m.id === selectedModel);
  const currentModelInfo = MODEL_OPTIONS.find(m => m.id === currentModel);
  
  const charactersWithPortraits = characterSeeds?.filter(seed => characterPortraits?.[seed.id]) || [];
  const hasCharacterSelection = charactersWithPortraits.length > 0 && onRegenerateWithNewGrid;

  return (
    <div className="space-y-3">
      {/* Current Model Info */}
      {currentModel && currentModelInfo && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 rounded-lg border border-white/5">
          <div className="flex items-center gap-2">
            <div className="text-primary/80 shrink-0">{currentModelInfo.icon}</div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-foreground/50">Generated with</p>
              <p className="text-xs sm:text-sm font-semibold text-foreground/90 truncate">
                {currentModelInfo.name}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] sm:text-xs text-foreground/50">{currentModelInfo.duration}</p>
            <p className="text-[10px] sm:text-xs text-primary/70">{currentModelInfo.quality}</p>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="bg-black/40 rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground/90">
            Try Different Model
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] sm:text-xs h-7 sm:h-8 px-2.5 sm:px-3 rounded-full touch-manipulation min-h-[44px] sm:min-h-0"
          >
            {isExpanded ? 'Hide' : 'Show'} Options
          </Button>
        </div>

        {isExpanded && (
          <>
            {/* Model Grid */}
            <div className="grid grid-cols-1 gap-2 sm:gap-2.5">
              {MODEL_OPTIONS.map((model) => {
                const isSelected = selectedModel === model.id;
                const isCurrent = currentModel === model.id;

                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    disabled={disabled}
                    className={`relative text-left p-3 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 touch-manipulation min-h-[44px] ${
                      isSelected
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30 active:bg-black/40'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {/* Badge */}
                    {model.badge && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                          {model.badge}
                        </span>
                      </div>
                    )}

                    {/* Current indicator */}
                    {isCurrent && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                          Current
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-2 sm:gap-3">
                      {/* Icon */}
                      <div className={`mt-0.5 ${isSelected ? 'text-primary' : 'text-foreground/60'}`}>
                        {model.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                          <p className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                            {model.name}
                          </p>
                          <span className="text-[10px] sm:text-xs text-foreground/50">
                            {model.duration}
                          </span>
                          <span className={`text-[10px] sm:text-xs ${isSelected ? 'text-primary/80' : 'text-foreground/50'}`}>
                            • {model.quality}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-foreground/60 leading-relaxed">
                          {model.description}
                        </p>
                      </div>

                      {/* Selection indicator */}
                      <div className={`mt-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-white/30 bg-transparent'
                      }`}>
                        {isSelected && (
                          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Advanced Options Toggle */}
            {(hasCharacterSelection || defaultPrompt) && (
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-foreground/50 hover:text-foreground/70 transition-colors"
              >
                {showAdvanced ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Hide Advanced Options
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show Advanced Options (Edit Prompt & Characters)
                  </>
                )}
              </button>
            )}

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                {/* Prompt Editor */}
                <div className="space-y-2">
                  <p className="text-xs text-foreground/50">Edit trailer prompt (optional):</p>
                  <Textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    onFocus={(e) => {
                      if (!e.target.value && defaultPrompt) {
                        setEditedPrompt(defaultPrompt);
                      }
                    }}
                    placeholder="Click to load default prompt, then edit as needed..."
                    className="min-h-[150px] max-h-[300px] text-xs font-mono resize-y bg-black/40 border-white/15"
                  />
                </div>

                {/* Character Selection */}
                {hasCharacterSelection && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-foreground/50">Select characters for new grid:</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCharacters(new Set(charactersWithPortraits.map(s => s.id)));
                          }}
                          className="text-[10px] text-primary/80 hover:text-primary underline"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCharacters(new Set())}
                          className="text-[10px] text-foreground/50 hover:text-foreground/70 underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {charactersWithPortraits.map((seed) => {
                        const portrait = characterPortraits?.[seed.id];
                        if (!portrait) return null;
                        const isCharSelected = selectedCharacters.has(seed.id);
                        return (
                          <button
                            key={seed.id}
                            type="button"
                            onClick={() => {
                              const newSet = new Set(selectedCharacters);
                              if (isCharSelected) {
                                newSet.delete(seed.id);
                              } else {
                                newSet.add(seed.id);
                              }
                              setSelectedCharacters(newSet);
                            }}
                            className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                              isCharSelected
                                ? "border-primary ring-1 ring-primary/30"
                                : "border-white/10 opacity-50 hover:opacity-70"
                            }`}
                          >
                            <div className="aspect-square relative">
                              <Image
                                src={portrait}
                                alt={seed.name}
                                fill
                                className="object-cover"
                                sizes="60px"
                              />
                              {isCharSelected && (
                                <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="px-0.5 py-0.5 bg-black/70 text-center">
                              <p className="text-[8px] text-foreground/70 truncate">{seed.name}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-foreground/40">
                      {selectedCharacters.size > 0 ? (
                        <>
                          {selectedCharacters.size} selected
                          {selectedCharacters.size < 4 && (
                            <span className="text-amber-400 ml-1">(need 4+ for new grid)</span>
                          )}
                        </>
                      ) : (
                        "Leave empty to use current grid"
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Regenerate Button */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleRegenerate}
                disabled={disabled || isLoading || !selectedModel}
                className="w-full rounded-full bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 font-semibold shadow-lg touch-manipulation min-h-[48px] sm:min-h-[44px] text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm sm:text-base">Generating...</span>
                  </>
                ) : selectedCharacters.size >= 4 ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span className="text-sm sm:text-base">
                      Regenerate with New Grid ({selectedCharacters.size} chars)
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span className="text-sm sm:text-base">Regenerate with {selectedModelInfo?.name}</span>
                  </>
                )}
              </Button>
            </div>

            {/* Info note */}
            <p className="text-[9px] sm:text-[10px] text-foreground/40 text-center leading-relaxed px-2">
              Each model has unique characteristics. Generation takes 5-10 minutes.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
