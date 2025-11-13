"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Timer, Crown, Loader2 } from "lucide-react";

type VideoModel = 'sora-2' | 'veo-3.1' | 'minimax' | 'kling' | 'runway';

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
    id: 'sora-2',
    name: 'Sora 2',
    duration: '12s',
    quality: 'Premium',
    description: 'OpenAI\'s latest. Highest quality, cinematic results.',
    icon: <Crown className="h-4 w-4" />,
    badge: 'Best',
  },
  {
    id: 'veo-3.1',
    name: 'VEO 3.1',
    duration: '8s',
    quality: 'High',
    description: 'Google\'s model. Fast, reliable, great for quick iterations.',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: 'minimax',
    name: 'Minimax',
    duration: '6s',
    quality: 'High',
    description: 'Excellent motion, dynamic camera movements.',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 'kling',
    name: 'Kling',
    duration: '5s',
    quality: 'Good',
    description: 'Fast generation, good for testing concepts.',
    icon: <Timer className="h-4 w-4" />,
  },
  {
    id: 'runway',
    name: 'Runway Gen-3',
    duration: '10s',
    quality: 'High',
    description: 'Creative studio standard, artistic control.',
    icon: <Sparkles className="h-4 w-4" />,
  },
];

interface TrailerModelSelectorProps {
  currentModel?: string;
  onRegenerate: (model: VideoModel) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function TrailerModelSelector({
  currentModel,
  onRegenerate,
  isLoading = false,
  disabled = false,
}: TrailerModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<VideoModel>(
    (currentModel as VideoModel) || 'sora-2'
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRegenerate = () => {
    onRegenerate(selectedModel);
    setIsExpanded(false);
  };

  const selectedModelInfo = MODEL_OPTIONS.find(m => m.id === selectedModel);
  const currentModelInfo = MODEL_OPTIONS.find(m => m.id === currentModel);

  return (
    <div className="space-y-3">
      {/* Current Model Info */}
      {currentModel && currentModelInfo && (
        <div className="flex items-center justify-between px-4 py-2 bg-black/30 rounded-lg border border-white/5">
          <div className="flex items-center gap-2">
            <div className="text-primary/80">{currentModelInfo.icon}</div>
            <div>
              <p className="text-xs text-foreground/50">Generated with</p>
              <p className="text-sm font-semibold text-foreground/90">
                {currentModelInfo.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground/50">{currentModelInfo.duration}</p>
            <p className="text-xs text-primary/70">{currentModelInfo.quality}</p>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="bg-black/40 rounded-2xl border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground/90">
            Try Different Model
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs h-7 px-3 rounded-full"
          >
            {isExpanded ? 'Hide' : 'Show'} Options
          </Button>
        </div>

        {isExpanded && (
          <>
            {/* Model Grid */}
            <div className="grid grid-cols-1 gap-2">
              {MODEL_OPTIONS.map((model) => {
                const isSelected = selectedModel === model.id;
                const isCurrent = currentModel === model.id;

                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    disabled={disabled}
                    className={`relative text-left p-3 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {/* Badge */}
                    {model.badge && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                          {model.badge}
                        </span>
                      </div>
                    )}

                    {/* Current indicator */}
                    {isCurrent && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                          Current
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`mt-0.5 ${isSelected ? 'text-primary' : 'text-foreground/60'}`}>
                        {model.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-semibold ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                            {model.name}
                          </p>
                          <span className="text-xs text-foreground/50">
                            {model.duration}
                          </span>
                          <span className={`text-xs ${isSelected ? 'text-primary/80' : 'text-foreground/50'}`}>
                            • {model.quality}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/60 leading-relaxed">
                          {model.description}
                        </p>
                      </div>

                      {/* Selection indicator */}
                      <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-white/30 bg-transparent'
                      }`}>
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Regenerate Button */}
            <Button
              onClick={handleRegenerate}
              disabled={disabled || isLoading || !selectedModel}
              className="w-full rounded-full bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 font-semibold shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerate with {selectedModelInfo?.name}
                </>
              )}
            </Button>

            {/* Info note */}
            <p className="text-[10px] text-foreground/40 text-center leading-relaxed px-2">
              Each model has unique characteristics. Generation takes 5-10 minutes.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

