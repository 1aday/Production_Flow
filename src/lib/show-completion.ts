type ShowCompletionStatus = {
  isFullyComplete: boolean;
  completionPercentage: number;
  missingItems: string[];
  completedItems: string[];
  stats: {
    charactersBuilt: number;
    totalCharacters: number;
    portraitsGenerated: number;
    videosGenerated: number;
    hasPoster: boolean;
    hasLibraryPoster: boolean;
    hasPortraitGrid: boolean;
    hasTrailer: boolean;
  };
};

export function calculateShowCompletion(show: {
  characterSeeds?: Array<{ id: string }>;
  characterDocs?: Record<string, unknown>;
  characterPortraits?: Record<string, string | null>;
  characterVideos?: Record<string, string[]>;
  posterUrl?: string | null;
  libraryPosterUrl?: string | null;
  portraitGridUrl?: string | null;
  trailerUrl?: string | null;
}): ShowCompletionStatus {
  const totalCharacters = show.characterSeeds?.length || 0;
  const charactersBuilt = Object.keys(show.characterDocs || {}).length;
  const portraitsGenerated = Object.values(show.characterPortraits || {}).filter(url => url).length;
  const videosGenerated = Object.values(show.characterVideos || {}).reduce((sum, arr) => sum + arr.length, 0);
  
  // Check if URL is valid (not just a truthy value)
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    if (url.trim().length === 0) return false;
    return true;
  };
  
  const hasPoster = isValidUrl(show.posterUrl);
  const hasLibraryPoster = isValidUrl(show.libraryPosterUrl);
  const hasPortraitGrid = isValidUrl(show.portraitGridUrl);
  const hasTrailer = isValidUrl(show.trailerUrl);

  const completedItems: string[] = [];
  const missingItems: string[] = [];

  // Check character build completion
  if (charactersBuilt === totalCharacters && totalCharacters > 0) {
    completedItems.push(`All ${totalCharacters} characters built`);
  } else if (charactersBuilt > 0) {
    completedItems.push(`${charactersBuilt}/${totalCharacters} characters built`);
    missingItems.push(`${totalCharacters - charactersBuilt} characters need building`);
  } else if (totalCharacters > 0) {
    missingItems.push(`${totalCharacters} characters need building`);
  }

  // Check portraits
  if (portraitsGenerated === totalCharacters && totalCharacters > 0) {
    completedItems.push(`All ${totalCharacters} portraits generated`);
  } else if (portraitsGenerated > 0) {
    completedItems.push(`${portraitsGenerated}/${totalCharacters} portraits`);
    missingItems.push(`${totalCharacters - portraitsGenerated} portraits needed`);
  } else if (totalCharacters > 0) {
    missingItems.push(`${totalCharacters} portraits needed`);
  }

  // Check videos (optional)
  if (videosGenerated > 0) {
    completedItems.push(`${videosGenerated} character videos`);
  }

  // Check poster
  if (hasPoster) {
    completedItems.push("Hero poster");
  } else {
    missingItems.push("Hero poster");
  }

  // Check library poster
  if (hasLibraryPoster) {
    completedItems.push("Library poster");
  } else {
    missingItems.push("Library poster");
  }

  // Check portrait grid
  if (hasPortraitGrid) {
    completedItems.push("Portrait grid");
  } else {
    missingItems.push("Portrait grid");
  }

  // Check trailer
  if (hasTrailer) {
    completedItems.push("Trailer");
  } else {
    missingItems.push("Trailer");
  }

  // Calculate completion percentage
  const totalItems = 7; // characters built, portraits, poster, library poster, grid, trailer (videos optional)
  let completed = 0;
  
  if (charactersBuilt === totalCharacters && totalCharacters > 0) completed++;
  if (portraitsGenerated === totalCharacters && totalCharacters > 0) completed++;
  if (hasPoster) completed++;
  if (hasLibraryPoster) completed++;
  if (hasPortraitGrid) completed++;
  if (hasTrailer) completed++;
  if (videosGenerated > 0) completed++; // Bonus

  const completionPercentage = totalCharacters > 0 ? Math.round((completed / totalItems) * 100) : 0;
  const isFullyComplete = missingItems.length === 0 && totalCharacters > 0;

  return {
    isFullyComplete,
    completionPercentage,
    missingItems,
    completedItems,
    stats: {
      charactersBuilt,
      totalCharacters,
      portraitsGenerated,
      videosGenerated,
      hasPoster,
      hasLibraryPoster,
      hasPortraitGrid,
      hasTrailer,
    },
  };
}

export function getCompletionBadgeVariant(percentage: number): "default" | "outline" | "secondary" {
  if (percentage >= 100) return "default";
  if (percentage >= 50) return "secondary";
  return "outline";
}

