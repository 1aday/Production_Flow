# Art Style Quick Reference Guide

## Overview

The enhanced `art_style` section in `production_style` provides comprehensive fields to capture any animation or cartoon aesthetic. This guide shows how to use these fields to replicate specific styles.

## Structure

```
production_style.art_style
├── line_art
├── shape_language
├── color_application
├── rendering_approach
├── character_design
├── background_style
├── animation_motion
├── art_movement_references
├── visual_techniques
└── composition_style
```

## Style Templates

### Family Guy Style
```json
{
  "art_style": {
    "line_art": {
      "outline_style": "bold",
      "outline_color": "black",
      "outline_weight": "uniform",
      "line_quality": "vector_clean"
    },
    "shape_language": {
      "primary_shapes": ["geometric", "rounded"],
      "shape_simplification": "high",
      "edge_softness": "hard",
      "form_representation": "flat"
    },
    "color_application": {
      "color_style": "flat",
      "shading_method": "flat_shadows",
      "color_count": "moderate",
      "color_saturation": "highly_saturated",
      "color_harmony": "eclectic"
    },
    "rendering_approach": {
      "dimensionality": "2d_flat",
      "surface_quality": "digital_clean",
      "detail_level": "simplified",
      "texture_style": "none"
    },
    "character_design": {
      "proportions": "moderately_exaggerated",
      "head_to_body_ratio": "1:3",
      "feature_simplification": "simplified",
      "facial_features": "stylized",
      "body_stylization": "stylized"
    },
    "background_style": {
      "detail_level": "simplified",
      "rendering_consistency": "matches_characters",
      "perspective_style": "one_point",
      "simplification_approach": "geometric"
    },
    "animation_motion": {
      "motion_style": "limited",
      "frame_rate_feel": "12fps_feel",
      "easing_style": "snappy",
      "exaggeration_level": "high"
    },
    "art_movement_references": {
      "primary_influences": ["pop_art", "american_cartoon"],
      "era_aesthetic": "contemporary",
      "cultural_influences": ["american_cartoon"]
    }
  }
}
```

### South Park Style
```json
{
  "art_style": {
    "line_art": {
      "outline_style": "thin",
      "outline_color": "black",
      "outline_weight": "uniform",
      "line_quality": "vector_clean"
    },
    "shape_language": {
      "primary_shapes": ["geometric"],
      "shape_simplification": "high",
      "edge_softness": "hard",
      "form_representation": "flat"
    },
    "color_application": {
      "color_style": "flat",
      "shading_method": "none",
      "color_count": "limited",
      "color_saturation": "moderate",
      "color_harmony": "complementary"
    },
    "rendering_approach": {
      "dimensionality": "2d_flat",
      "surface_quality": "digital_clean",
      "detail_level": "minimal",
      "texture_style": "none"
    },
    "character_design": {
      "proportions": "highly_exaggerated",
      "head_to_body_ratio": "1:2",
      "feature_simplification": "minimal",
      "facial_features": "geometric",
      "body_stylization": "geometric"
    },
    "background_style": {
      "detail_level": "minimal",
      "rendering_consistency": "matches_characters",
      "perspective_style": "flat",
      "simplification_approach": "geometric"
    },
    "animation_motion": {
      "motion_style": "choppy",
      "frame_rate_feel": "12fps_feel",
      "easing_style": "linear",
      "exaggeration_level": "extreme"
    },
    "art_movement_references": {
      "primary_influences": ["minimalism"],
      "era_aesthetic": "contemporary",
      "cultural_influences": ["american_cartoon"]
    }
  }
}
```

### Wallace and Gromit (Claymation)
```json
{
  "art_style": {
    "line_art": {
      "outline_style": "none",
      "outline_color": "none",
      "outline_weight": "n/a",
      "line_quality": "n/a"
    },
    "shape_language": {
      "primary_shapes": ["organic", "rounded"],
      "shape_simplification": "moderate",
      "edge_softness": "soft",
      "form_representation": "dimensional"
    },
    "color_application": {
      "color_style": "textured",
      "shading_method": "soft_shading",
      "color_count": "moderate",
      "color_saturation": "moderate",
      "color_harmony": "analogous"
    },
    "rendering_approach": {
      "dimensionality": "stop_motion",
      "surface_quality": "tactile",
      "detail_level": "moderate",
      "texture_style": "prominent"
    },
    "character_design": {
      "proportions": "slightly_exaggerated",
      "head_to_body_ratio": "1:4",
      "feature_simplification": "moderate",
      "facial_features": "stylized",
      "body_stylization": "stylized"
    },
    "background_style": {
      "detail_level": "detailed",
      "rendering_consistency": "matches_characters",
      "perspective_style": "one_point",
      "simplification_approach": "textured"
    },
    "animation_motion": {
      "motion_style": "stop_motion",
      "frame_rate_feel": "24fps_feel",
      "easing_style": "organic",
      "exaggeration_level": "moderate"
    },
    "art_movement_references": {
      "primary_influences": ["vintage"],
      "era_aesthetic": "1950s",
      "cultural_influences": ["european_comics"]
    },
    "visual_techniques": {
      "texture_overlay": "prominent",
      "grain_or_noise": "film_grain",
      "halftone_patterns": "none",
      "color_bleeding": "subtle",
      "hand_drawn_imperfections": "none"
    }
  }
}
```

### Wes Anderson (Fantastic Mr. Fox)
```json
{
  "art_style": {
    "line_art": {
      "outline_style": "thin",
      "outline_color": "black",
      "outline_weight": "uniform",
      "line_quality": "clean"
    },
    "shape_language": {
      "primary_shapes": ["geometric", "angular"],
      "shape_simplification": "moderate",
      "edge_softness": "hard",
      "form_representation": "dimensional"
    },
    "color_application": {
      "color_style": "flat",
      "shading_method": "soft_shading",
      "color_count": "limited",
      "color_saturation": "moderate",
      "color_harmony": "analogous"
    },
    "rendering_approach": {
      "dimensionality": "stop_motion",
      "surface_quality": "smooth",
      "detail_level": "moderate",
      "texture_style": "subtle"
    },
    "character_design": {
      "proportions": "realistic",
      "head_to_body_ratio": "1:6",
      "feature_simplification": "moderate",
      "facial_features": "realistic",
      "body_stylization": "realistic"
    },
    "background_style": {
      "detail_level": "detailed",
      "rendering_consistency": "more_detailed",
      "perspective_style": "symmetrical",
      "simplification_approach": "geometric"
    },
    "animation_motion": {
      "motion_style": "smooth",
      "frame_rate_feel": "24fps_feel",
      "easing_style": "ease_in_out",
      "exaggeration_level": "subtle"
    },
    "art_movement_references": {
      "primary_influences": ["art_deco", "retro", "minimalism"],
      "era_aesthetic": "1960s",
      "cultural_influences": ["indie_animation"]
    },
    "composition_style": {
      "layout_approach": "symmetrical",
      "framing_style": "wide",
      "depth_representation": "moderate",
      "negative_space": "generous"
    },
    "visual_techniques": {
      "texture_overlay": "subtle",
      "grain_or_noise": "film_grain",
      "halftone_patterns": "none",
      "color_bleeding": "none",
      "hand_drawn_imperfections": "none"
    }
  }
}
```

### Studio Ghibli Style
```json
{
  "art_style": {
    "line_art": {
      "outline_style": "variable",
      "outline_color": "black",
      "outline_weight": "variable",
      "line_quality": "hand_drawn"
    },
    "shape_language": {
      "primary_shapes": ["organic", "rounded"],
      "shape_simplification": "low",
      "edge_softness": "soft",
      "form_representation": "dimensional"
    },
    "color_application": {
      "color_style": "painterly",
      "shading_method": "soft_shading",
      "color_count": "extensive",
      "color_saturation": "moderate",
      "color_harmony": "analogous"
    },
    "rendering_approach": {
      "dimensionality": "2d_shaded",
      "surface_quality": "hand_crafted",
      "detail_level": "detailed",
      "texture_style": "visible"
    },
    "character_design": {
      "proportions": "slightly_exaggerated",
      "head_to_body_ratio": "1:4",
      "feature_simplification": "moderate",
      "facial_features": "stylized",
      "body_stylization": "stylized"
    },
    "background_style": {
      "detail_level": "highly_detailed",
      "rendering_consistency": "more_detailed",
      "perspective_style": "atmospheric",
      "simplification_approach": "organic"
    },
    "animation_motion": {
      "motion_style": "smooth",
      "frame_rate_feel": "24fps_feel",
      "easing_style": "organic",
      "exaggeration_level": "moderate"
    },
    "art_movement_references": {
      "primary_influences": ["art_nouveau", "expressionism"],
      "era_aesthetic": "timeless",
      "cultural_influences": ["japanese_anime"]
    },
    "visual_techniques": {
      "texture_overlay": "moderate",
      "grain_or_noise": "paper_texture",
      "halftone_patterns": "none",
      "color_bleeding": "subtle",
      "hand_drawn_imperfections": "subtle"
    }
  }
}
```

### Spider-Verse Style
```json
{
  "art_style": {
    "line_art": {
      "outline_style": "variable",
      "outline_color": "colored",
      "outline_weight": "variable",
      "line_quality": "sketchy"
    },
    "shape_language": {
      "primary_shapes": ["geometric", "angular"],
      "shape_simplification": "medium",
      "edge_softness": "hard",
      "form_representation": "dimensional"
    },
    "color_application": {
      "color_style": "cel_shaded",
      "shading_method": "cel_shading",
      "color_count": "extensive",
      "color_saturation": "vibrant",
      "color_harmony": "eclectic"
    },
    "rendering_approach": {
      "dimensionality": "3d_cel_shaded",
      "surface_quality": "digital_clean",
      "detail_level": "moderate",
      "texture_style": "visible"
    },
    "character_design": {
      "proportions": "moderately_exaggerated",
      "head_to_body_ratio": "1:4",
      "feature_simplification": "simplified",
      "facial_features": "stylized",
      "body_stylization": "stylized"
    },
    "background_style": {
      "detail_level": "moderate",
      "rendering_consistency": "matches_characters",
      "perspective_style": "dynamic",
      "simplification_approach": "geometric"
    },
    "animation_motion": {
      "motion_style": "stylized",
      "frame_rate_feel": "variable",
      "easing_style": "snappy",
      "exaggeration_level": "high"
    },
    "art_movement_references": {
      "primary_influences": ["pop_art", "postmodern"],
      "era_aesthetic": "contemporary",
      "cultural_influences": ["american_cartoon"]
    },
    "visual_techniques": {
      "texture_overlay": "moderate",
      "grain_or_noise": "halftone_patterns",
      "halftone_patterns": "prominent",
      "color_bleeding": "moderate",
      "hand_drawn_imperfections": "moderate"
    }
  }
}
```

## Field Reference

### line_art
- **outline_style**: `bold` | `thin` | `variable` | `none` | `brush_stroke`
- **outline_color**: `black` | `colored` | `variable` | `none`
- **outline_weight**: `uniform` | `variable` | `tapered`
- **line_quality**: `clean` | `sketchy` | `hand_drawn` | `vector_clean`

### shape_language
- **primary_shapes**: Array of `geometric` | `organic` | `angular` | `rounded` | `hybrid`
- **shape_simplification**: `high` | `medium` | `low`
- **edge_softness**: `hard` | `soft` | `mixed`
- **form_representation**: `flat` | `dimensional` | `isometric`

### color_application
- **color_style**: `flat` | `gradient` | `cel_shaded` | `painterly` | `textured` | `mixed`
- **shading_method**: `none` | `flat_shadows` | `gradient_shading` | `cel_shading` | `soft_shading`
- **color_count**: `limited` | `moderate` | `extensive`
- **color_saturation**: `desaturated` | `moderate` | `highly_saturated` | `vibrant`
- **color_harmony**: `monochromatic` | `complementary` | `analogous` | `triadic` | `eclectic`

### rendering_approach
- **dimensionality**: `2d_flat` | `2d_shaded` | `2.5d` | `3d_cel_shaded` | `3d_realistic` | `stop_motion` | `mixed_media`
- **surface_quality**: `smooth` | `textured` | `hand_crafted` | `digital_clean` | `tactile`
- **detail_level**: `minimal` | `simplified` | `moderate` | `detailed` | `highly_detailed`
- **texture_style**: `none` | `subtle` | `visible` | `prominent` | `hand_drawn`

### character_design
- **proportions**: `realistic` | `slightly_exaggerated` | `moderately_exaggerated` | `highly_exaggerated` | `abstract`
- **head_to_body_ratio**: `1:6` | `1:5` | `1:4` | `1:3` | `1:2` | `other`
- **feature_simplification**: `detailed` | `moderate` | `simplified` | `minimal` | `iconic`
- **facial_features**: `realistic` | `stylized` | `geometric` | `minimal` | `exaggerated`
- **body_stylization**: `realistic` | `stylized` | `geometric` | `abstract`

### background_style
- **detail_level**: `minimal` | `simplified` | `moderate` | `detailed` | `highly_detailed`
- **rendering_consistency**: `matches_characters` | `more_detailed` | `less_detailed` | `stylistically_different`
- **perspective_style**: `flat` | `one_point` | `two_point` | `isometric` | `atmospheric`
- **simplification_approach**: `geometric` | `organic` | `textured` | `pattern_based`

### animation_motion
- **motion_style**: `smooth` | `choppy` | `limited` | `full` | `stylized` | `stop_motion`
- **frame_rate_feel**: `12fps_feel` | `24fps_feel` | `smooth_60fps` | `variable`
- **easing_style**: `linear` | `ease_in_out` | `bouncy` | `snappy` | `organic`
- **exaggeration_level**: `subtle` | `moderate` | `high` | `extreme`

### art_movement_references
- **primary_influences**: Array of `pop_art` | `minimalism` | `art_deco` | `art_nouveau` | `brutalism` | `retro` | `vintage` | `modernist` | `postmodern` | `surrealism` | `expressionism`
- **era_aesthetic**: `1920s` | `1950s` | `1960s` | `1970s` | `1980s` | `1990s` | `2000s` | `contemporary` | `timeless`
- **cultural_influences**: Array of `japanese_anime` | `european_comics` | `american_cartoon` | `indie_animation` | `other`

### visual_techniques
- **texture_overlay**: `none` | `subtle` | `moderate` | `prominent`
- **grain_or_noise**: `none` | `film_grain` | `digital_noise` | `paper_texture` | `canvas_texture`
- **halftone_patterns**: `none` | `subtle` | `moderate` | `prominent`
- **color_bleeding**: `none` | `subtle` | `moderate` | `prominent`
- **hand_drawn_imperfections**: `none` | `subtle` | `moderate` | `prominent`

### composition_style
- **layout_approach**: `symmetrical` | `rule_of_thirds` | `centered` | `asymmetrical` | `dynamic`
- **framing_style**: `tight` | `medium` | `wide` | `variable`
- **depth_representation**: `flat` | `shallow` | `moderate` | `deep`
- **negative_space**: `minimal` | `moderate` | `generous` | `prominent`

## Usage Tips

1. **Start with a reference**: Choose a known style (Family Guy, South Park, etc.) and use the template
2. **Mix and match**: Combine elements from different styles to create unique aesthetics
3. **Be specific**: Fill in all relevant fields for best prompt generation results
4. **Test and iterate**: Generate images/videos and refine the art_style values based on results
5. **Use defaults**: If unsure, use moderate/middle values as defaults

## Prompt Generation

When constructing prompts for image/video generation, use these fields to build comprehensive style descriptions:

```
Style: {art_style.rendering_approach.dimensionality}
Outlines: {art_style.line_art.outline_style} {art_style.line_art.outline_color} outlines
Shapes: {art_style.shape_language.primary_shapes.join(', ')} shapes, {art_style.shape_language.shape_simplification} simplification
Colors: {art_style.color_application.color_style} colors, {art_style.color_application.shading_method} shading, {art_style.color_application.color_saturation} saturation
Characters: {art_style.character_design.proportions} proportions, {art_style.character_design.head_to_body_ratio} head-to-body ratio
Backgrounds: {art_style.background_style.detail_level} detail, {art_style.background_style.perspective_style} perspective
Motion: {art_style.animation_motion.motion_style} animation, {art_style.animation_motion.frame_rate_feel} feel
Influences: {art_style.art_movement_references.primary_influences.join(', ')} style, {art_style.art_movement_references.era_aesthetic} aesthetic
```

