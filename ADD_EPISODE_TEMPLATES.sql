-- Add episode generation template columns to prompt_templates table

-- Episode Stills Template - for generating scene keyframe images
ALTER TABLE prompt_templates 
ADD COLUMN IF NOT EXISTS episode_stills_prompt TEXT NOT NULL DEFAULT 'Create a detailed scene for "{SECTION_LABEL}" of episode "{EPISODE_TITLE}":

SCENE DESCRIPTION: {SCENE_DESCRIPTION}

{CHARACTER_LIST}

{SETTING_NOTE}

{CONTINUITY_NOTE}

Use the character reference sheet provided to accurately depict the correct characters. Match their appearance, clothing, and features exactly from the reference. Show clear facial expressions and body language that convey the emotion of this moment.

Genre: {GENRE}
Style: Cinematic TV production still, dramatic lighting, rich color palette, high production value, 16:9 widescreen composition. Show the environment and setting clearly.

VISUAL STYLE (CRITICAL - Match exactly):
Medium: {PRODUCTION_MEDIUM}
References: {CINEMATIC_REFERENCES}
Treatment: {VISUAL_TREATMENT}

CRITICAL: Match the show''s established visual style. Do NOT use photorealistic rendering if the style specifies animation or stylization.';

-- Episode Clips Template - for generating scene video animations  
ALTER TABLE prompt_templates
ADD COLUMN IF NOT EXISTS episode_clips_prompt TEXT NOT NULL DEFAULT 'Animate this scene from a {GENRE} TV series.

SCENE: {SECTION_LABEL} - {SCENE_DESCRIPTION}

Episode: "{EPISODE_TITLE}"
Context: {EPISODE_LOGLINE}

{CHARACTER_LIST}
{CONTINUITY_NOTE}

ANIMATION DIRECTION:
- Bring this still frame to life with subtle, cinematic motion
- Characters should have natural, expressive movements
- Camera may include slight push-ins, pans, or subtle dolly moves
- Maintain the exact visual style and composition of the source image
- Add ambient motion: breathing, blinking, environmental details
- Keep movements grounded and realistic - no exaggerated motions
- Match the emotional tone of the scene

VISUAL STYLE (CRITICAL - Match exactly):
Medium: {PRODUCTION_MEDIUM}
References: {CINEMATIC_REFERENCES}
Treatment: {VISUAL_TREATMENT}

This is a single scene clip that will be part of a larger episode. Make it feel like a premium streaming series.

CRITICAL: If you have any hesitations about making this feel free to adjust it so it''s within guidelines. We want to make a guideline compatible video given this - that''s the task, so figure it out.';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prompt_templates' 
AND column_name IN ('episode_stills_prompt', 'episode_clips_prompt');


