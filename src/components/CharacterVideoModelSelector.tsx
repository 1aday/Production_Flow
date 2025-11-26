"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Crown, Loader2 } from "lucide-react";

type VideoModelId = 'openai/sora-2' | 'openai/sora-2-pro' | 'google/veo-3.1';

interface ModelInfo {
  id: VideoModelId;
  name: string;
  duration: string;
  quality: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

const MODEL_OPTIONS: ModelInfo[] = [
  {
    id: 'openai/sora-2-pro',
    name: 'Sora 2 Pro',
    duration: '4-12s',
    quality: 'Premium',
    description: 'OpenAI\'s top tier. Highest quality with portrait reference.',
    icon: <Crown className="h-4 w-4" />,
    badge: 'Best',
  },
  {
    id: 'openai/sora-2',
    name: 'Sora 2',
    duration: '4-12s',
    quality: 'High',
    description: 'OpenAI\'s standard model. Fast, high-quality results.',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 'google/veo-3.1',
    name: 'VEO 3.1',
    duration: '4-8s',
    quality: 'High',
    description: 'Google\'s model with reference image support. Great consistency.',
    icon: <Zap className="h-4 w-4" />,
  },
];

interface CharacterVideoModelSelectorProps {
  currentModel?: VideoModelId;
  onModelChange: (model: VideoModelId) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function CharacterVideoModelSelector({
  currentModel,
  onModelChange,
  isLoading = false,
  disabled = false,
}: CharacterVideoModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<VideoModelId>(
    currentModel || 'openai/sora-2-pro'
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const handleModelChange = (model: VideoModelId) => {
    setSelectedModel(model);
    onModelChange(model);
  };

  const selectedModelInfo = MODEL_OPTIONS.find(m => m.id === selectedModel);
  const currentModelInfo = MODEL_OPTIONS.find(m => m.id === currentModel);

  return (
    <div className="space-y-3">
      {/* Current Model Info */}
      {currentModel && currentModelInfo && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 rounded-lg border border-white/5">
          <div className="flex items-center gap-2">
            <div className="text-primary/80 shrink-0">{currentModelInfo.icon}</div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-foreground/50">Current model</p>
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
            Select Video Model
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
                    onClick={() => handleModelChange(model.id)}
                    disabled={disabled || isLoading}
                    className={`relative text-left p-3 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 touch-manipulation min-h-[44px] ${
                      isSelected
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30 active:bg-black/40'
                    } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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

            {/* Info note */}
            <p className="text-[9px] sm:text-[10px] text-foreground/40 text-center leading-relaxed px-2">
              VEO 3.1 uses the character portrait as reference. All models take 5-10 minutes.
            </p>
          </>
        )}
      </div>
    </div>
  );
}


