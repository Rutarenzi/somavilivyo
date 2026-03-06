import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { trackGeminiCall, logActualUsage } from '../_shared/tokenTracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Helper function to search for relevant images using web search
async function searchRelevantImages(moduleTitle: string, learningObjective: string): Promise<Array<{url: string, title: string, description: string}>> {
  try {
    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
    if (!TAVILY_API_KEY) {
      console.warn('⚠️ TAVILY_API_KEY not configured, skipping image search');
      return [];
    }

    const searchQuery = `educational images for ${moduleTitle} ${learningObjective}`;
    console.log(`🔍 Searching for images with query: ${searchQuery}`);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: 'basic',
        include_images: true,
        max_results: 3
      })
    });

    if (!response.ok) {
      console.error('❌ Tavily API error:', response.status);
      return [];
    }

    const data = await response.json();
    console.log(`✅ Tavily search returned ${data.images?.length || 0} images`);
    console.log('🔍 Tavily response structure:', JSON.stringify(data, null, 2).substring(0, 500));

    if (!data.images || data.images.length === 0) {
      return [];
    }

    // Tavily returns images as an array of URL strings, not objects
    const imageResults = data.images.slice(0, 5).map((imgUrl: string, index: number) => ({
      url: typeof imgUrl === 'string' ? imgUrl : imgUrl.url || imgUrl,
      title: `${moduleTitle} - Visual ${index + 1}`,
      description: `Educational visual for ${moduleTitle}`
    }));
    
    console.log('📸 Image URLs found:', imageResults.map(img => img.url));
    return imageResults;
  } catch (error) {
    console.error('❌ Error searching for images:', error);
    return [];
  }
}

// Helper function to search for relevant educational videos
async function searchRelevantVideos(moduleTitle: string, learningObjective: string): Promise<Array<{url: string, title: string, description: string, videoId: string, thumbnail: string}>> {
  try {
    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
    if (!TAVILY_API_KEY) {
      console.warn('⚠️ TAVILY_API_KEY not configured, skipping video search');
      return [];
    }

    const searchQuery = `educational video tutorial for ${moduleTitle} ${learningObjective} site:youtube.com`;
    console.log(`🎥 Searching for videos with query: ${searchQuery}`);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: 'basic',
        include_domains: ['youtube.com', 'youtu.be'],
        max_results: 3
      })
    });

    if (!response.ok) {
      console.error('❌ Tavily API error for videos:', response.status);
      return [];
    }

    const data = await response.json();
    console.log(`✅ Tavily search returned ${data.results?.length || 0} video results`);

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Extract YouTube video IDs and create video objects
    const videoResults = data.results
      .filter((result: any) => result.url && (result.url.includes('youtube.com') || result.url.includes('youtu.be')))
      .map((result: any) => {
        let videoId = '';
        const url = result.url;
        
        // Extract video ID from various YouTube URL formats
        if (url.includes('youtube.com/watch?v=')) {
          videoId = new URL(url).searchParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
        } else if (url.includes('youtube.com/embed/')) {
          videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
        }

        if (!videoId) return null;

        return {
          url: url,
          videoId: videoId,
          title: result.title || `${moduleTitle} - Educational Video`,
          description: result.content || `Educational video about ${moduleTitle}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        };
      })
      .filter((video: any) => video !== null)
      .slice(0, 2); // Limit to 2 videos per module
    
    console.log(`🎥 Found ${videoResults.length} YouTube videos`);
    console.log('🎥 Video IDs:', videoResults.map(v => v.videoId));
    return videoResults;
  } catch (error) {
    console.error('❌ Error searching for videos:', error);
    return [];
  }
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { rawContent, moduleTitle, learningObjective, userId } = await req.json();
    console.log('UI Shell Generator - Processing request for user:', userId);
    console.log('Raw content length:', rawContent?.length || 0);
    // Get all available API keys
    const apiKeys = [];
    let currentKey = Deno.env.get('GOOGLE_API_KEY');
    if (currentKey) apiKeys.push(currentKey);
    let keyIndex = 2;
    while(keyIndex <= 20){
      const nextKey = Deno.env.get(`GOOGLE_API_KEY_${keyIndex}`);
      if (!nextKey) break;
      apiKeys.push(nextKey);
      keyIndex++;
    }
    if (apiKeys.length === 0) {
      throw new Error('No GOOGLE_API_KEY configured');
    }
    console.log(`🔑 Available API keys: ${apiKeys.length}`);
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Fetch user preferences with comprehensive error handling
    let preferences = {};
    try {
      console.log('🔍 Fetching user preferences from database...');
      const { data: profile, error: profileError } = await supabase.from('profiles').select('learning_preferences').eq('id', userId).single();
      if (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        console.warn('⚠️ Using default preferences due to profile fetch error');
      } else if (profile?.learning_preferences) {
        preferences = profile.learning_preferences;
        console.log('✅ User preferences loaded successfully');
      } else {
        console.warn('⚠️ No learning preferences found in profile - using defaults');
      }
    } catch (error) {
      console.error('💥 Exception while fetching preferences:', error);
      console.warn('⚠️ Using default preferences due to exception');
    }
    console.log('🔍 User preferences loaded:', Object.keys(preferences));
    console.log('📊 Preference values (detailed):', JSON.stringify(preferences, null, 2));
    
    // Search for relevant images if visual content is requested
    let relevantImages = [];
    if (preferences.wantsVisuals !== false) {
      console.log('🔍 Searching for relevant images for:', moduleTitle);
      relevantImages = await searchRelevantImages(moduleTitle, learningObjective);
      console.log(`✅ Found ${relevantImages.length} relevant images`);
    }
    
    // Search for relevant videos if user prefers video content
    let relevantVideos = [];
    const prefersVideos = preferences.contentTypePreferences?.includes('videos') || 
                          preferences.contentTypePreferences?.includes('video-lectures') ||
                          preferences.learningStylePreferences?.includes('visual');
    if (prefersVideos) {
      console.log('🎥 User prefers videos - searching for relevant educational videos');
      relevantVideos = await searchRelevantVideos(moduleTitle, learningObjective);
      console.log(`✅ Found ${relevantVideos.length} relevant videos`);
    }
    
    // Comprehensive preference validation and logging
    const preferenceAnalysis = {
      hasVisualPreferences: !!(preferences.primaryColor || preferences.secondaryColor || preferences.accentColor),
      hasTypographyPreferences: !!(preferences.fontFamily || preferences.fontSize || preferences.fontWeight || preferences.fontStyle),
      hasLayoutPreferences: !!(preferences.layoutStyle || preferences.layoutDensity || preferences.contentAlignment),
      hasAnimationPreferences: !!(preferences.animationStyle || preferences.animationSpeed),
      hasContentTypePreferences: !!(preferences.contentTypePreferences && preferences.contentTypePreferences.length > 0),
      hasLearningStylePreferences: !!(preferences.learningStylePreferences && preferences.learningStylePreferences.length > 0),
      hasPresentationPreferences: !!(preferences.presentationStyle || preferences.toneStyle),
      hasInteractionPreferences: !!(preferences.wantsVisuals !== undefined || preferences.wantsQuizzes !== undefined || preferences.preferSimpleTerms !== undefined)
    };
    console.log('🔍 Comprehensive preference analysis:', preferenceAnalysis);
    // Log specific preference categories
    if (preferences.primaryColor || preferences.secondaryColor) {
      console.log('🎨 Color preferences detected:', {
        primary: preferences.primaryColor,
        secondary: preferences.secondaryColor,
        accent: preferences.accentColor
      });
    }
    if (preferences.contentTypePreferences && preferences.contentTypePreferences.length > 0) {
      console.log('📋 Content type preferences:', preferences.contentTypePreferences);
    } else {
      console.warn('⚠️ No content type preferences found - will use generic structure');
    }
    if (preferences.learningStylePreferences && preferences.learningStylePreferences.length > 0) {
      console.log('🧠 Learning style preferences:', preferences.learningStylePreferences);
    } else {
      console.warn('⚠️ No learning style preferences found - will use default approach');
    }
    // Validate critical personalization preferences
    if (!preferenceAnalysis.hasVisualPreferences && !preferenceAnalysis.hasLayoutPreferences && !preferenceAnalysis.hasPresentationPreferences) {
      console.error('🚨 CRITICAL: No visual/layout preferences found - output may be generic');
    }
    if (!preferenceAnalysis.hasContentTypePreferences && !preferenceAnalysis.hasLearningStylePreferences) {
      console.error('🚨 CRITICAL: No content/learning preferences found - structure may be generic');
    }
    if (Object.keys(preferences).length === 0) {
      console.error('🚨 CRITICAL: No preferences found at all - will use complete defaults');
    } else {
      console.log(`✅ Found ${Object.keys(preferences).length} preference settings to apply`);
    }
    // Generate React component using Gemini API
    const reactCode = await generateStyledComponentWithGemini(rawContent, moduleTitle, learningObjective, preferences, apiKeys, supabase, userId, relevantImages, relevantVideos);
    console.log('Generated React component successfully with Gemini');
    return new Response(JSON.stringify({
      component: reactCode,
      success: true
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in UI Shell Generator:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({
      error: errorMessage,
      success: false
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
// Helper function to convert hex color to HSL values for design system integration
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max){
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}
// Helper function to generate comprehensive design system based on all preferences
function generateComprehensiveDesignSystem(preferences) {
  console.log('🎨 Generating comprehensive design system with ALL preferences:', {
    colors: {
      primary: preferences.primaryColor,
      secondary: preferences.secondaryColor,
      accent: preferences.accentColor
    },
    typography: {
      family: preferences.fontFamily,
      size: preferences.fontSize,
      weight: preferences.fontWeight,
      style: preferences.fontStyle
    },
    layout: {
      style: preferences.layoutStyle,
      density: preferences.layoutDensity,
      alignment: preferences.contentAlignment
    },
    visual: {
      cardStyle: preferences.cardStyle,
      borderRadius: preferences.borderRadius,
      shadowStyle: preferences.shadowStyle,
      spacing: preferences.spacing
    },
    animation: {
      style: preferences.animationStyle,
      speed: preferences.animationSpeed
    },
    theme: {
      mode: preferences.theme,
      colorScheme: preferences.colorScheme
    }
  });
  const primaryColor = preferences.primaryColor || '#8b5cf6';
  const secondaryColor = preferences.secondaryColor || '#a855f7';
  const accentColor = preferences.accentColor || '#ec4899';
  console.log('🌈 Color palette:', {
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor
  });
  const primaryHsl = hexToHsl(primaryColor);
  const secondaryHsl = hexToHsl(secondaryColor);
  const accentHsl = hexToHsl(accentColor);
  console.log('🎨 HSL conversions:', {
    primaryHsl,
    secondaryHsl,
    accentHsl
  });
  // Generate comprehensive color palette
  const colors = {
    primary: {
      bg: `bg-[hsl(${primaryHsl.h}_${primaryHsl.s}%_${primaryHsl.l}%)]`,
      text: `text-[hsl(${primaryHsl.h}_${primaryHsl.s}%_${Math.max(primaryHsl.l - 40, 10)}%)]`,
      border: `border-[hsl(${primaryHsl.h}_${primaryHsl.s}%_${primaryHsl.l}%)]`,
      light: `bg-[hsl(${primaryHsl.h}_${Math.max(primaryHsl.s - 20, 20)}%_${Math.min(primaryHsl.l + 30, 95)}%)]`,
      dark: `bg-[hsl(${primaryHsl.h}_${primaryHsl.s}%_${Math.max(primaryHsl.l - 20, 5)}%)]`
    },
    secondary: {
      bg: `bg-[hsl(${secondaryHsl.h}_${secondaryHsl.s}%_${secondaryHsl.l}%)]`,
      text: `text-[hsl(${secondaryHsl.h}_${secondaryHsl.s}%_${Math.max(secondaryHsl.l - 40, 10)}%)]`,
      light: `bg-[hsl(${secondaryHsl.h}_${Math.max(secondaryHsl.s - 20, 20)}%_${Math.min(secondaryHsl.l + 30, 95)}%)]`
    },
    accent: {
      bg: `bg-[hsl(${accentHsl.h}_${accentHsl.s}%_${accentHsl.l}%)]`,
      text: `text-[hsl(${accentHsl.h}_${accentHsl.s}%_${Math.max(accentHsl.l - 40, 10)}%)]`,
      light: `bg-[hsl(${accentHsl.h}_${Math.max(accentHsl.s - 20, 20)}%_${Math.min(accentHsl.l + 30, 95)}%)]`
    },
    neutral: {
      bg: `bg-[hsl(${primaryHsl.h}_${Math.max(primaryHsl.s - 40, 10)}%_${Math.min(primaryHsl.l + 45, 97)}%)]`,
      text: preferences.theme === 'dark' ? 'text-[hsl(0_0%_98%)]' : `text-[hsl(${primaryHsl.h}_${Math.max(primaryHsl.s - 55, 8)}%_${Math.max(primaryHsl.l - 40, 12)}%)]`,
      border: `border-[hsl(${primaryHsl.h}_${Math.max(primaryHsl.s - 50, 8)}%_${Math.max(Math.min(primaryHsl.l + 45, 97) - 15, 35)}%)]`,
      muted: `bg-[hsl(${primaryHsl.h}_${Math.max(primaryHsl.s - 45, 10)}%_${Math.min(primaryHsl.l + 48, 98)}%)]`
    }
  };
  console.log('🎨 Generated color system with custom palette');
  // Typography system based on ALL typography preferences
  const fontWeightMap = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };
  const fontStyleMap = {
    normal: '',
    italic: 'italic'
  };
  const typography = {
    fontFamily: preferences.fontFamily === 'Jakarta' ? 'font-jakarta' : preferences.fontFamily === 'Poppins' ? 'font-poppins' : preferences.fontFamily === 'Roboto' ? 'font-roboto' : 'font-inter',
    fontWeight: fontWeightMap[preferences.fontWeight] || 'font-normal',
    fontStyle: fontStyleMap[preferences.fontStyle] || '',
    sizes: {
      xs: preferences.fontSize === 'sm' ? 'text-xs' : 'text-sm',
      sm: preferences.fontSize === 'sm' ? 'text-sm' : preferences.fontSize === 'lg' ? 'text-base' : 'text-sm',
      base: preferences.fontSize === 'sm' ? 'text-base' : preferences.fontSize === 'lg' ? 'text-lg' : preferences.fontSize === 'xl' ? 'text-xl' : 'text-base',
      lg: preferences.fontSize === 'sm' ? 'text-lg' : preferences.fontSize === 'lg' ? 'text-xl' : preferences.fontSize === 'xl' ? 'text-2xl' : 'text-lg',
      xl: preferences.fontSize === 'sm' ? 'text-xl' : preferences.fontSize === 'lg' ? 'text-2xl' : preferences.fontSize === 'xl' ? 'text-3xl' : 'text-xl',
      '2xl': preferences.fontSize === 'sm' ? 'text-2xl' : preferences.fontSize === 'lg' ? 'text-3xl' : preferences.fontSize === 'xl' ? 'text-4xl' : 'text-2xl'
    }
  };
  console.log('🔤 Typography system generated:', {
    family: typography.fontFamily,
    weight: typography.fontWeight,
    style: typography.fontStyle
  });
  // Spacing and layout based on ALL layout preferences
  const spacing = {
    container: preferences.layoutStyle === 'single-column' ? 'max-w-3xl' : preferences.layoutStyle === 'two-column' ? 'max-w-6xl' : preferences.layoutStyle === 'magazine' ? 'max-w-7xl' : 'max-w-4xl',
    padding: preferences.layoutDensity === 'compact' ? 'p-4' : preferences.layoutDensity === 'spacious' ? 'p-8' : preferences.spacing === 'compact' ? 'p-3' : preferences.spacing === 'spacious' ? 'p-10' : 'p-6',
    gap: preferences.layoutDensity === 'compact' ? 'space-y-4' : preferences.layoutDensity === 'spacious' ? 'space-y-8' : preferences.spacing === 'compact' ? 'space-y-3' : preferences.spacing === 'spacious' ? 'space-y-10' : 'space-y-6',
    alignment: preferences.contentAlignment === 'center' ? 'text-center' : preferences.contentAlignment === 'justify' ? 'text-justify' : 'text-left'
  };
  console.log('📐 Spacing system generated:', spacing);
  // Visual effects based on ALL visual preferences
  const borderRadiusMap = {
    none: 'rounded-none',
    small: 'rounded-sm',
    medium: 'rounded-lg',
    large: 'rounded-2xl',
    full: 'rounded-full'
  };
  const shadowMap = {
    none: 'shadow-none',
    subtle: 'shadow-sm',
    medium: 'shadow-lg',
    strong: 'shadow-2xl'
  };
  const effects = {
    shadows: shadowMap[preferences.shadowStyle] || (preferences.cardStyle === 'minimal' ? 'shadow-sm' : preferences.cardStyle === 'elevated' ? 'shadow-xl' : 'shadow-lg'),
    corners: borderRadiusMap[preferences.borderRadius] || (preferences.cardStyle === 'sharp' ? 'rounded-none' : preferences.cardStyle === 'round' ? 'rounded-2xl' : 'rounded-lg'),
    borders: preferences.cardStyle === 'outlined' ? `${colors.primary.border} border-2` : preferences.cardStyle === 'subtle' ? `${colors.neutral.border} border` : 'border-0'
  };
  console.log('✨ Visual effects generated:', effects);
  // Animation preferences with speed control
  const animationSpeedMap = {
    slow: '500',
    normal: '300',
    fast: '150'
  };
  const duration = animationSpeedMap[preferences.animationSpeed] || '300';
  const animations = {
    transition: preferences.animationStyle === 'none' ? '' : preferences.animationStyle === 'fade' ? `transition-opacity duration-${duration}` : preferences.animationStyle === 'slide' ? `transition-transform duration-${duration}` : preferences.animationStyle === 'scale' ? `transition-transform duration-${duration} hover:scale-105` : preferences.animationStyle === 'bounce' ? `transition-all duration-${duration} hover:bounce` : `transition-all duration-${duration}`,
    hover: preferences.animationStyle === 'none' ? '' : preferences.animationStyle === 'fade' ? 'hover:opacity-80' : preferences.animationStyle === 'slide' ? 'hover:-translate-y-1' : preferences.animationStyle === 'scale' ? 'hover:scale-105' : preferences.animationStyle === 'bounce' ? 'hover:animate-bounce' : 'hover:shadow-xl'
  };
  console.log('🎬 Animation system generated:', {
    style: preferences.animationStyle,
    speed: preferences.animationSpeed,
    duration
  });
  const designSystem = {
    colors,
    typography,
    spacing,
    effects,
    animations
  };
  console.log('✅ Complete design system generated with ALL preferences applied');
  return designSystem;
}
// Helper functions for preference-driven generation
function generateStyleInstructions(preferences) {
  console.log('🎨 Generating comprehensive style instructions with preferences:', {
    primaryColor: preferences.primaryColor,
    layoutStyle: preferences.layoutStyle,
    presentationStyle: preferences.presentationStyle,
    fontSize: preferences.fontSize,
    animationStyle: preferences.animationStyle,
    cardStyle: preferences.cardStyle,
    theme: preferences.theme
  });
  const designSystem = generateComprehensiveDesignSystem(preferences);
  let instructions = `COMPREHENSIVE STYLING REQUIREMENTS - EVERYTHING MUST BE PREFERENCE-DRIVEN:\n`;
  // Color System
  instructions += `COLOR SYSTEM (NO HARDCODED COLORS ALLOWED):\n`;
  instructions += `- Primary colors: Background ${designSystem.colors.primary.bg}, Text ${designSystem.colors.primary.text}, Border ${designSystem.colors.primary.border}\n`;
  instructions += `- Secondary colors: Background ${designSystem.colors.secondary.bg}, Text ${designSystem.colors.secondary.text}\n`;
  instructions += `- Accent colors: Background ${designSystem.colors.accent.bg}, Text ${designSystem.colors.accent.text}\n`;
  instructions += `- Neutral colors: Background ${designSystem.colors.neutral.bg}, Text ${designSystem.colors.neutral.text}, Border ${designSystem.colors.neutral.border}\n`;
  // Typography System
  instructions += `TYPOGRAPHY SYSTEM:\n`;
  instructions += `- Font family: ${designSystem.typography.fontFamily}\n`;
  instructions += `- Heading sizes: H1 ${designSystem.typography.sizes['2xl']}, H2 ${designSystem.typography.sizes.xl}, H3 ${designSystem.typography.sizes.lg}\n`;
  instructions += `- Body text: ${designSystem.typography.sizes.base}, Small text: ${designSystem.typography.sizes.sm}\n`;
  // Layout System
  instructions += `LAYOUT SYSTEM:\n`;
  instructions += `- Container: ${designSystem.spacing.container} mx-auto\n`;
  instructions += `- Padding: ${designSystem.spacing.padding}\n`;
  instructions += `- Spacing: ${designSystem.spacing.gap}\n`;
  // Visual Effects System
  instructions += `VISUAL EFFECTS SYSTEM:\n`;
  instructions += `- Shadows: ${designSystem.effects.shadows}\n`;
  instructions += `- Border radius: ${designSystem.effects.corners}\n`;
  instructions += `- Borders: ${designSystem.effects.borders}\n`;
  // Animation System
  instructions += `ANIMATION SYSTEM:\n`;
  instructions += `- Transitions: ${designSystem.animations.transition}\n`;
  instructions += `- Hover effects: ${designSystem.animations.hover}\n`;
  // Typography
  const fontSizeMap = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  instructions += `- Font family: ${preferences.fontFamily || 'Inter'}\n`;
  instructions += `- Base font size: ${fontSizeMap[preferences.fontSize] || 'text-base'}\n`;
  // Layout-specific instructions based on preferences
  instructions += `LAYOUT IMPLEMENTATION:\n`;
  switch(preferences.layoutStyle){
    case 'single-column':
      instructions += `- Use single centered column with ${designSystem.spacing.container}\n`;
      instructions += `- Focus on readability with generous line height and spacing\n`;
      console.log('📐 Applied single-column layout style');
      break;
    case 'two-column':
      instructions += `- Use CSS Grid with grid-cols-1 md:grid-cols-3 layout\n`;
      instructions += `- Main content in col-span-2, sidebar in col-span-1\n`;
      console.log('📐 Applied two-column layout style');
      break;
    case 'card-layout':
      instructions += `- Use card-based sections with ${designSystem.effects.shadows} and ${designSystem.effects.corners}\n`;
      instructions += `- Each section should have ${designSystem.colors.neutral.bg} background and ${designSystem.effects.borders}\n`;
      console.log('📐 Applied card-layout style');
      break;
    case 'magazine':
      instructions += `- Use varied section layouts with mixed column widths\n`;
      instructions += `- Implement rich typography hierarchy and visual elements\n`;
      console.log('📐 Applied magazine layout style');
      break;
    default:
      instructions += `- Use flexible layout with ${designSystem.spacing.container} and card-based sections\n`;
      console.log('📐 Applied default layout (flexible preference-driven)');
  }
  // Animation and interaction preferences
  if (preferences.animationStyle && preferences.animationStyle !== 'none') {
    instructions += `INTERACTIONS AND ANIMATIONS:\n`;
    instructions += `- Apply ${designSystem.animations.transition} to all interactive elements\n`;
    instructions += `- Use ${designSystem.animations.hover} for hover states\n`;
    console.log('🎬 Added animation style:', preferences.animationStyle);
  } else {
    instructions += `INTERACTIONS: Static design with no animations (per user preference)\n`;
    console.log('🎬 No animation style applied (user prefers none)');
  }
  // Critical implementation rules
  instructions += `CRITICAL IMPLEMENTATION RULES:\n`;
  instructions += `- NEVER use hardcoded colors like bg-white, text-gray-800, border-gray-200\n`;
  instructions += `- ALWAYS use the preference-generated classes specified above\n`;
  instructions += `- Container: ${designSystem.spacing.container} mx-auto ${designSystem.spacing.padding}\n`;
  instructions += `- Sections: ${designSystem.colors.neutral.bg} ${designSystem.effects.shadows} ${designSystem.effects.corners} ${designSystem.spacing.padding}\n`;
  instructions += `- Headings: ${designSystem.colors.primary.text} ${designSystem.typography.fontFamily} font-bold\n`;
  instructions += `- Body text: ${designSystem.colors.neutral.text} ${designSystem.typography.fontFamily}\n`;
  instructions += `- Spacing between elements: ${designSystem.spacing.gap}\n`;
  instructions += `- All interactive elements must include ${designSystem.animations.transition} ${designSystem.animations.hover}\n`;
  instructions += `- Use semantic HTML structure with proper headings (h1, h2, h3)\n`;
  instructions += `- Make it fully responsive with responsive classes (sm:, md:, lg:)\n`;
  instructions += `- Ensure accessibility with proper contrast and ARIA labels\n`;
  console.log('✅ Comprehensive style instructions generated, length:', instructions.length);
  console.log('🎨 Design system generated:', designSystem);
  return instructions;
}
function generateStructureGuidance(preferences) {
  console.log('🏗️ Generating comprehensive structure guidance with ALL personalization preferences');
  let guidance = `COMPREHENSIVE CONTENT STRUCTURE GUIDANCE (Adapt content presentation based on ALL user preferences):\n\n`;
  let structuresAdded = [];
  // ===== AGE & EDUCATIONAL LEVEL ADAPTATIONS =====
  if (preferences.ageRange || preferences.educationalBackground) {
    guidance += `AGE & EDUCATION LEVEL ADAPTATIONS:\n`;
    if (preferences.ageRange) {
      const ageNum = parseInt(preferences.ageRange);
      if (ageNum <= 11) {
        guidance += `- Use simple, child-friendly language with lots of emojis and friendlyFacile friendly tone\n`;
        guidance += `- Include playful examples and games-based learning elements\n`;
        guidance += `- Break content into very small, digestible chunks (2-3 paragraphs max per section)\n`;
      } else if (ageNum <= 17) {
        guidance += `- Use age-appropriate language suitable for teenagers\n`;
        guidance += `- Include relevant pop culture references and relatable examples\n`;
        guidance += `- Structure content with clear headings and engaging visuals\n`;
      } else {
        guidance += `- Use mature, sophisticated language appropriate for adults\n`;
        guidance += `- Include professional and real-world examples\n`;
        guidance += `- Allow for deeper exploration and complex concepts\n`;
      }
      console.log(`👶 Added age-appropriate adaptations for age: ${preferences.ageRange}`);
    }
    if (preferences.educationalBackground) {
      guidance += `- Adjust complexity level based on ${preferences.educationalBackground} education level\n`;
      console.log(`🎓 Added education level adaptations: ${preferences.educationalBackground}`);
    }
    guidance += `\n`;
  }
  // ===== LEARNING PACE & FOCUS DURATION =====
  if (preferences.learningPace || preferences.focusDuration) {
    guidance += `PACING & FOCUS ADAPTATIONS:\n`;
    if (preferences.learningPace === 'slow-detailed') {
      guidance += `- Provide extensive explanations with multiple examples for each concept\n`;
      guidance += `- Include frequent recap sections and summaries\n`;
      guidance += `- Break down complex ideas into very small steps\n`;
      console.log('🐌 Added slow-paced detailed learning structure');
    } else if (preferences.learningPace === 'fast-quick') {
      guidance += `- Provide concise, to-the-point explanations\n`;
      guidance += `- Use bullet points and quick summaries\n`;
      guidance += `- Focus on key concepts without excessive detail\n`;
      console.log('🚀 Added fast-paced quick learning structure');
    } else {
      guidance += `- Provide balanced explanations with moderate detail\n`;
      guidance += `- Include both detailed content and quick summaries\n`;
      console.log('⚖️ Added moderate-paced learning structure');
    }
    if (preferences.focusDuration) {
      guidance += `- Design content sections for ${preferences.focusDuration}-minute focus blocks\n`;
      guidance += `- Include natural break points every ${preferences.focusDuration} minutes\n`;
      guidance += `- Add progress indicators to show completion within focus time\n`;
      console.log(`⏱️ Added focus duration adaptations: ${preferences.focusDuration} minutes`);
    }
    guidance += `\n`;
  }
  // ===== EXPLANATION & LANGUAGE STYLE =====
  if (preferences.explanationStyle || preferences.languageLevel || preferences.preferSimpleLanguage) {
    guidance += `EXPLANATION & LANGUAGE STYLE:\n`;
    if (preferences.explanationStyle === 'simple' || preferences.preferSimpleLanguage) {
      guidance += `- Use simple, everyday language - avoid jargon and technical terms\n`;
      guidance += `- Explain concepts as if talking to a friend\n`;
      guidance += `- Define any necessary technical terms immediately when used\n`;
      console.log('💬 Added simple, jargon-free language style');
    } else if (preferences.explanationStyle === 'step-by-step') {
      guidance += `- Break down every concept into numbered steps\n`;
      guidance += `- Use "First... Then... Next... Finally..." structure\n`;
      guidance += `- Include checkpoints after each step\n`;
      console.log('📝 Added step-by-step explanation structure');
    } else if (preferences.explanationStyle === 'conceptual') {
      guidance += `- Focus on big-picture understanding and concepts\n`;
      guidance += `- Use analogies and metaphors to explain ideas\n`;
      guidance += `- Connect to broader themes and principles\n`;
      console.log('💡 Added conceptual explanation style');
    }
    if (preferences.languageLevel) {
      guidance += `- Maintain ${preferences.languageLevel} language complexity throughout\n`;
      console.log(`📚 Set language level to: ${preferences.languageLevel}`);
    }
    guidance += `\n`;
  }
  // ===== EXAMPLES & REAL-WORLD APPLICATION =====
  if (preferences.exampleType || preferences.realLifeApplication || preferences.hobbiesInterests) {
    guidance += `EXAMPLES & PRACTICAL APPLICATION:\n`;
    if (preferences.hobbiesInterests) {
      guidance += `- Use examples related to: ${preferences.hobbiesInterests}\n`;
      guidance += `- Connect concepts to these interests whenever possible\n`;
      console.log(`🎯 Incorporating user interests: ${preferences.hobbiesInterests}`);
    }
    if (preferences.realLifeApplication) {
      guidance += `- Show how concepts apply to: ${preferences.realLifeApplication}\n`;
      guidance += `- Include practical scenarios for this specific use case\n`;
      console.log(`🌍 Added real-life application context: ${preferences.realLifeApplication}`);
    }
    if (preferences.exampleType === 'real-world') {
      guidance += `- Provide realistic, practical examples from everyday life\n`;
      guidance += `- Include current events and relatable scenarios\n`;
    } else if (preferences.exampleType === 'visual') {
      guidance += `- Use visual examples with diagrams and illustrations\n`;
      guidance += `- Include visual metaphors and graphic representations\n`;
    }
    guidance += `\n`;
  }
  // ===== MOTIVATION & GAMIFICATION =====
  if (preferences.gamificationPreferences || preferences.motivationType) {
    guidance += `MOTIVATION & ENGAGEMENT ELEMENTS:\n`;
    if (preferences.gamificationPreferences?.includes('badges')) {
      guidance += `- Include achievement indicators and milestone markers\n`;
      guidance += `- Add "You've

 mastered..." celebration sections\n`;
    }
    if (preferences.gamificationPreferences?.includes('points')) {
      guidance += `- Show progress metrics and completion percentages\n`;
      guidance += `- Include "Points to remember" summary sections\n`;
    }
    if (preferences.gamificationPreferences?.includes('challenges')) {
      guidance += `- Frame practice questions as challenges or missions\n`;
      guidance += `- Include "Challenge yourself" sections with bonus questions\n`;
    }
    if (preferences.gamificationPreferences?.includes('teaching-others')) {
      guidance += `- Include "Explain this to someone" reflection prompts\n`;
      guidance += `- Add "How would you teach this?" discussion sections\n`;
    }
    console.log('🎮 Added gamification elements:', preferences.gamificationPreferences);
    guidance += `\n`;
  }
  // ===== BLOOM'S TAXONOMY LEVEL =====
  if (preferences.bloomLevel) {
    guidance += `COGNITIVE LEVEL (Bloom's Taxonomy - ${preferences.bloomLevel}):\n`;
    switch(preferences.bloomLevel){
      case 'remember':
        guidance += `- Focus on recall and recognition of facts\n`;
        guidance += `- Include definitions, lists, and memorization aids\n`;
        guidance += `- Use "What is..." and "Define..." type questions\n`;
        break;
      case 'understand':
        guidance += `- Focus on explanation and interpretation\n`;
        guidance += `- Include summaries, examples, and paraphrasing\n`;
        guidance += `- Use "Explain..." and "Describe..." type questions\n`;
        break;
      case 'apply':
        guidance += `- Focus on using knowledge in new situations\n`;
        guidance += `- Include practice problems and real-world scenarios\n`;
        guidance += `- Use "How would you..." and "Apply this to..." prompts\n`;
        break;
      case 'analyze':
        guidance += `- Focus on breaking down and examining components\n`;
        guidance += `- Include comparisons, cause-effect analysis, and patterns\n`;
        guidance += `- Use "Compare...", "Why...", and "What patterns..." questions\n`;
        break;
      case 'evaluate':
        guidance += `- Focus on making judgments and critiques\n`;
        guidance += `- Include debates, critiques, and justification prompts\n`;
        guidance += `- Use "Judge...", "Critique...", and "Defend..." questions\n`;
        break;
      case 'create':
        guidance += `- Focus on producing original work and synthesis\n`;
        guidance += `- Include project ideas, design challenges, and creation prompts\n`;
        guidance += `- Use "Design...", "Create...", and "Develop..." questions\n`;
        break;
    }
    console.log(`🧠 Set Bloom's taxonomy level: ${preferences.bloomLevel}`);
    guidance += `\n`;
  }
  // Content type preferences - COMPREHENSIVE HANDLING WITH STRICT FORMAT ENFORCEMENT
  if (preferences.contentTypePreferences?.includes('articles')) {
    guidance += `- MUST structure content as article-style with clear headings, paragraphs, and reading flow\n`;
    guidance += `- REQUIRED: Use semantic HTML with h1, h2, h3 hierarchy for easy scanning\n`;
    guidance += `- MUST include introduction, main content sections, and conclusion/summary\n`;
    structuresAdded.push('articles');
    console.log('📰 Added articles & text structure');
  }
  if (preferences.contentTypePreferences?.includes('video-lectures')) {
    guidance += `- MUST create sections that mimic video lecture structure: intro, main points, recap\n`;
    guidance += `- REQUIRED: Use progressive disclosure with expandable sections\n`;
    guidance += `- MUST include time estimates and chapter-like divisions\n`;
    structuresAdded.push('video-lectures');
    console.log('📹 Added video lectures structure');
  }
  if (preferences.contentTypePreferences?.includes('interactive-exercises')) {
    guidance += `- CRITICAL: Include interactive exercise sections with hands-on activities and practice areas\n`;
    guidance += `- REQUIRED: Add step-by-step instructions and guided practice components\n`;
    guidance += `- MUST create action-oriented sections with "Try This" or "Practice" areas with interactive elements\n`;
    guidance += `- REQUIRED: Include clickable buttons, input fields, or interactive components for practice\n`;
    structuresAdded.push('interactive-exercises');
    console.log('🎯 Added interactive exercises structure');
  }
  if (preferences.contentTypePreferences?.includes('quizzes')) {
    guidance += `- REQUIRED: Include self-assessment sections and knowledge check areas\n`;
    guidance += `- MUST add reflection questions and critical thinking prompts\n`;
    guidance += `- CRITICAL: Create "Test Your Understanding" sections with example questions\n`;
    structuresAdded.push('quizzes');
    console.log('❓ Added quizzes & assessments structure');
  }
  if (preferences.contentTypePreferences?.includes('summaries')) {
    guidance += `- REQUIRED: Add key takeaway sections, summary boxes, and highlight areas\n`;
    guidance += `- MUST include "At a Glance" or "Quick Summary" sections\n`;
    guidance += `- CRITICAL: Create bullet-point summaries and key concept lists\n`;
    structuresAdded.push('summaries');
    console.log('📋 Added quick summaries structure');
  }
  if (preferences.contentTypePreferences?.includes('infographics')) {
    guidance += `- CRITICAL: Use visual elements like progress indicators, stat boxes, and data displays\n`;
    guidance += `- REQUIRED: Include icon lists, visual timelines, and graphical representations\n`;
    guidance += `- MUST create visually-structured information with charts and diagrams representation\n`;
    guidance += `- REQUIRED: Use SVG or chart components to display data visually where relevant\n`;
    structuresAdded.push('infographics');
    console.log('📊 Added infographics & charts structure');
  }
  if (preferences.contentTypePreferences?.includes('flashcards')) {
    guidance += `- CRITICAL: Create flashcard-style sections with front/back card format\n`;
    guidance += `- REQUIRED: Include "Question" on one side and "Answer" revealed on click/toggle\n`;
    guidance += `- MUST use card components with flip or toggle functionality for Q&A format\n`;
    guidance += `- REQUIRED: Make flashcards interactive with click-to-reveal answers\n`;
    structuresAdded.push('flashcards');
    console.log('🃏 Added flashcards structure');
  }
  // Learning style adaptations - COMPREHENSIVE HANDLING
  if (preferences.learningStylePreferences?.includes('visual')) {
    guidance += `- Use extensive icons, color coding, visual hierarchy, and graphical elements\n`;
    guidance += `- Include visual separators, progress indicators, and visual cues throughout\n`;
    guidance += `- Structure content with clear visual breaks and highlight boxes\n`;
    console.log('👁️ Added comprehensive visual learning adaptations');
  }
  if (preferences.learningStylePreferences?.includes('auditory')) {
    guidance += `- Structure content for easy reading aloud with natural rhythm and flow\n`;
    guidance += `- Include conversational elements and discussion prompts\n`;
    guidance += `- Use clear verbal cues and transition phrases between sections\n`;
    console.log('👂 Added auditory learning style adaptations');
  }
  if (preferences.learningStylePreferences?.includes('kinesthetic')) {
    guidance += `- Include step-by-step guides, actionable sections, and hands-on components\n`;
    guidance += `- Add "Try This Now" sections and practical application areas\n`;
    guidance += `- Create interactive elements and movement-oriented learning activities\n`;
    console.log('🤲 Added comprehensive kinesthetic learning adaptations');
  }
  if (preferences.learningStylePreferences?.includes('reading')) {
    guidance += `- Focus on well-structured text with clear headings, subheadings, and bullet points\n`;
    guidance += `- Include detailed explanations, examples, and comprehensive written content\n`;
    guidance += `- Use proper paragraph structure and reading-friendly formatting\n`;
    console.log('📚 Added comprehensive reading learning style adaptations');
  }
  // Additional preferences - COMPREHENSIVE HANDLING
  if (preferences.wantsVisuals !== false) {
    guidance += `- Include extensive visual cues, icons, emojis, and graphical elements throughout\n`;
    guidance += `- Use visual hierarchy with colors, borders, and spacing to guide attention\n`;
    console.log('🎨 Added comprehensive visual elements preference');
  }
  if (preferences.wantsQuizzes) {
    guidance += `- Integrate quiz-style elements, self-check questions, and knowledge verification areas\n`;
    guidance += `- Include interactive assessment components and reflection prompts\n`;
    console.log('🧠 Added comprehensive quiz integration preference');
  }
  if (preferences.preferSimpleTerms) {
    guidance += `- Use clear, simple language structure and explain technical terms inline\n`;
    guidance += `- Include glossary-style explanations and definition boxes for complex concepts\n`;
    console.log('💬 Added comprehensive simple language preference');
  }
  // Layout-specific structure guidance
  if (preferences.layoutStyle === 'two-column') {
    guidance += `- Structure content for two-column layout with main content and sidebar elements\n`;
    guidance += `- Include complementary information in sidebar areas\n`;
    console.log('📰 Added two-column layout structure guidance');
  }
  if (preferences.layoutStyle === 'magazine') {
    guidance += `- Use magazine-style varied sections with mixed content types\n`;
    guidance += `- Include featured sections, callout boxes, and varied visual treatments\n`;
    console.log('📰 Added magazine layout structure guidance');
  }
  if (preferences.layoutStyle === 'card-layout') {
    guidance += `- Structure content in card-based sections with clear separation\n`;
    guidance += `- Each major concept should be in its own card container\n`;
    console.log('🃏 Added card-layout structure guidance');
  }
  // Log comprehensive analysis
  console.log(`✅ Structure guidance generated with ${structuresAdded.length} content type structures`);
  console.log('📋 Structures added:', structuresAdded);
  // ===== QUESTIONS & PRACTICE PREFERENCES =====
  if (preferences.questionsPerModule || preferences.practiceFrequency || preferences.questionTypes) {
    guidance += `\nQUESTIONS & PRACTICE STRUCTURE:\n`;
    if (preferences.questionsPerModule) {
      guidance += `- Include exactly ${preferences.questionsPerModule} practice questions per module\n`;
      guidance += `- Distribute questions evenly throughout the content\n`;
      console.log(`❓ Set ${preferences.questionsPerModule} questions per module`);
    }
    if (preferences.practiceFrequency === 'frequent') {
      guidance += `- Include practice questions after every major concept\n`;
      guidance += `- Add micro-quizzes and quick checks throughout\n`;
    } else if (preferences.practiceFrequency === 'minimal') {
      guidance += `- Include only end-of-module summary questions\n`;
      guidance += `- Focus on reflection rather than frequent testing\n`;
    }
    if (preferences.questionTypes === 'multiple-choice') {
      guidance += `- Structure all questions as multiple-choice format\n`;
      guidance += `- Provide clear options and explanations\n`;
    } else if (preferences.questionTypes === 'open-ended') {
      guidance += `- Use thought-provoking, open-ended questions\n`;
      guidance += `- Encourage deeper reflection and critical thinking\n`;
    } else if (preferences.questionTypes === 'practical') {
      guidance += `- Include hands-on, practical application questions\n`;
      guidance += `- Focus on "How would you apply this?" scenarios\n`;
    }
    guidance += `\n`;
  }
  // ===== PRESENTATION FORMAT PREFERENCES =====
  if (preferences.presentationFormats && preferences.presentationFormats.length > 0) {
    guidance += `PRESENTATION FORMAT STRUCTURE:\n`;
    if (preferences.presentationFormats.includes('written-text')) {
      guidance += `- Use comprehensive written paragraphs and detailed explanations\n`;
    }
    if (preferences.presentationFormats.includes('bullet-points')) {
      guidance += `- Break down information into clear bullet-point lists\n`;
      guidance += `- Use concise, scannable bullet points for key ideas\n`;
    }
    if (preferences.presentationFormats.includes('summary-cards')) {
      guidance += `- Create summary card sections highlighting key takeaways\n`;
      guidance += `- Include "Key Points" boxes with highlighted information\n`;
    }
    if (preferences.presentationFormats.includes('video-links')) {
      guidance += `- Add sections suggesting relevant video resources\n`;
      guidance += `- Include placeholders for multimedia content\n`;
    }
    console.log('📺 Added presentation format preferences:', preferences.presentationFormats);
    guidance += `\n`;
  }
  // ===== COLLABORATIVE & SOCIAL LEARNING =====
  if (preferences.includeCollaborativeActivities || preferences.peerInteraction || preferences.parentTeacherInvolvement) {
    guidance += `COLLABORATIVE & SOCIAL LEARNING ELEMENTS:\n`;
    if (preferences.includeCollaborativeActivities) {
      guidance += `- Include "Work Together" sections with group activity suggestions\n`;
      guidance += `- Add discussion prompts for collaborative exploration\n`;
      guidance += `- Provide team project ideas and peer learning activities\n`;
      console.log('👥 Added collaborative activities');
    }
    if (preferences.peerInteraction === 'frequent' || preferences.peerInteraction === 'collaborative') {
      guidance += `- Structure content to encourage peer discussion and sharing\n`;
      guidance += `- Include "Discuss with classmates" prompts\n`;
    }
    if (preferences.parentTeacherInvolvement === 'high' || preferences.parentTeacherInvolvement === 'collaborative') {
      guidance += `- Include "Ask your teacher/parent" extension questions\n`;
      guidance += `- Provide guidance for parent/teacher support sections\n`;
    }
    guidance += `\n`;
  }
  // ===== FEEDBACK & HELP STYLE =====
  if (preferences.feedbackStyle || preferences.helpStyle) {
    guidance += `FEEDBACK & SUPPORT STRUCTURE:\n`;
    if (preferences.feedbackStyle === 'immediate') {
      guidance += `- Provide instant feedback indicators (✓ or ✗) after each question\n`;
      guidance += `- Include immediate explanations for correct/incorrect answers\n`;
    } else if (preferences.feedbackStyle === 'encouraging') {
      guidance += `- Use positive, motivational feedback language\n`;
      guidance += `- Focus on progress and growth mindset messaging\n`;
    } else if (preferences.feedbackStyle === 'detailed') {
      guidance += `- Provide comprehensive explanations for all answers\n`;
      guidance += `- Include detailed reasoning and additional context\n`;
    }
    if (preferences.helpStyle === 'hints') {
      guidance += `- Include progressive hint systems in practice sections\n`;
      guidance += `- Provide "Need a hint?" sections before full answers\n`;
    } else if (preferences.helpStyle === 'step-by-step') {
      guidance += `- Break down help into sequential steps\n`;
      guidance += `- Include "How to approach this" guidance sections\n`;
    } else if (preferences.helpStyle === 'examples') {
      guidance += `- Use worked examples as primary help mechanism\n`;
      guidance += `- Include "Similar Example" sections for difficult concepts\n`;
    }
    console.log('💬 Added feedback and help style preferences');
    guidance += `\n`;
  }
  // ===== SKILL-BASED / PASSIONATE LEARNER PREFERENCES =====
  if (preferences.skillToMaster || preferences.projectGoal || preferences.successMetrics) {
    guidance += `SKILL MASTERY & GOAL-ORIENTED STRUCTURE:\n`;
    if (preferences.skillToMaster) {
      guidance += `- Frame all content in context of mastering: ${preferences.skillToMaster}\n`;
      guidance += `- Show clear connection to skill development throughout\n`;
      console.log(`🎯 Targeting skill mastery: ${preferences.skillToMaster}`);
    }
    if (preferences.projectGoal) {
      guidance += `- Connect concepts to project goal: ${preferences.projectGoal}\n`;
      guidance += `- Include "How this helps your project" sections\n`;
      console.log(`🚀 Aligned with project goal: ${preferences.projectGoal}`);
    }
    if (preferences.successMetrics) {
      guidance += `- Structure content to align with success metrics: ${preferences.successMetrics}\n`;
      guidance += `- Include progress checkpoints toward stated goals\n`;
      console.log(`📊 Tracking success via: ${preferences.successMetrics}`);
    }
    if (preferences.learningMotivation) {
      guidance += `- Reinforce motivation throughout: ${preferences.learningMotivation}\n`;
      guidance += `- Connect learning to stated reasons for pursuing this skill\n`;
    }
    guidance += `\n`;
  }
  // ===== EMOTIONAL STATE & COMMUNICATION STYLE =====
  if (preferences.emotionalState || preferences.communicationStyle || preferences.toneStyle) {
    guidance += `TONE & EMOTIONAL ADAPTATION:\n`;
    if (preferences.emotionalState === 'anxious' || preferences.emotionalState === 'overwhelmed') {
      guidance += `- Use reassuring, supportive language throughout\n`;
      guidance += `- Break content into very manageable chunks\n`;
      guidance += `- Include frequent encouragement and "You can do this!" messages\n`;
    } else if (preferences.emotionalState === 'excited' || preferences.emotionalState === 'motivated') {
      guidance += `- Use enthusiastic, energetic language\n`;
      guidance += `- Include challenging extensions and "level up" opportunities\n`;
    }
    if (preferences.communicationStyle === 'casual' || preferences.toneStyle === 'casual') {
      guidance += `- Use friendly, conversational tone as if talking to a friend\n`;
      guidance += `- Include relatable language and casual expressions\n`;
    } else if (preferences.communicationStyle === 'formal' || preferences.toneStyle === 'professional') {
      guidance += `- Maintain professional, formal tone throughout\n`;
      guidance += `- Use proper academic or business language\n`;
    } else if (preferences.communicationStyle === 'humorous') {
      guidance += `- Include lighthearted humor and fun elements\n`;
      guidance += `- Use playful examples and witty explanations\n`;
    } else if (preferences.communicationStyle === 'direct' || preferences.toneStyle === 'direct') {
      guidance += `- Use clear, direct communication without fluff\n`;
      guidance += `- Get straight to the point with concise explanations\n`;
    }
    console.log('😊 Added emotional state and communication style adaptations');
    guidance += `\n`;
  }
  // ===== DEVICE & ACCESSIBILITY CONSIDERATIONS =====
  if (preferences.primaryDevice || preferences.primaryDevices || preferences.internetSpeed) {
    guidance += `DEVICE & ACCESSIBILITY OPTIMIZATIONS:\n`;
    if (preferences.primaryDevice === 'mobile' || preferences.primaryDevices === 'mobile') {
      guidance += `- Optimize for mobile viewing with shorter sections\n`;
      guidance += `- Use mobile-friendly interactions and tap-friendly elements\n`;
      guidance += `- Ensure all content is easily scrollable on small screens\n`;
    } else if (preferences.primaryDevice === 'desktop' || preferences.primaryDevices === 'desktop') {
      guidance += `- Leverage larger screen space with richer layouts\n`;
      guidance += `- Can include more detailed side-by-side comparisons\n`;
    }
    if (preferences.internetSpeed === 'slow') {
      guidance += `- Keep content lightweight with minimal heavy elements\n`;
      guidance += `- Avoid suggesting video content or large media\n`;
      guidance += `- Focus on text-based learning materials\n`;
      console.log('🐢 Optimized for slow internet connection');
    }
    guidance += `\n`;
  }
  // ===== LEARNING GOALS & CHALLENGES =====
  if (preferences.learningGoals || preferences.learningChallenges || preferences.topicsToAvoid || preferences.pastFrustrations) {
    guidance += `PERSONALIZED GOALS & ACCOMMODATIONS:\n`;
    if (preferences.learningGoals) {
      guidance += `- Structure content to support goal: ${preferences.learningGoals}\n`;
      guidance += `- Show progress toward this specific objective\n`;
      console.log(`🎯 Aligned with learning goal: ${preferences.learningGoals}`);
    }
    if (preferences.learningChallenges) {
      guidance += `- Accommodate learning challenges: ${preferences.learningChallenges}\n`;
      guidance += `- Provide appropriate support and adaptations\n`;
      console.log(`♿ Accommodating challenges: ${preferences.learningChallenges}`);
    }
    if (preferences.topicsToAvoid) {
      guidance += `- Avoid or minimize coverage of: ${preferences.topicsToAvoid}\n`;
      console.log(`🚫 Avoiding topics: ${preferences.topicsToAvoid}`);
    }
    if (preferences.pastFrustrations) {
      guidance += `- Address past frustrations: ${preferences.pastFrustrations}\n`;
      guidance += `- Specifically avoid patterns that caused previous issues\n`;
      console.log(`⚠️ Addressing past frustrations: ${preferences.pastFrustrations}`);
    }
    guidance += `\n`;
  }
  console.log(`✅ Structure guidance generated with ${structuresAdded.length} content type structures`);
  console.log('📋 Structures added:', structuresAdded);
  console.log(`📝 Total guidance length: ${guidance.length} characters`);
  if (structuresAdded.length === 0) {
    console.warn('⚠️ No specific content type preferences found - using generic article structure');
    guidance += `- Use generic article structure with introduction, main content, and summary\n`;
    guidance += `- Include clear headings and well-organized paragraphs\n`;
  }
  console.log('✅ Comprehensive structure guidance completed');
  return guidance;
}
function generatePresentationStyle(preferences) {
  console.log('🎭 Generating presentation style with preferences:', {
    presentationStyle: preferences.presentationStyle,
    toneStyle: preferences.toneStyle
  });
  let style = `PRESENTATION STYLE: ${preferences.presentationStyle || 'structured'}\n`;
  switch(preferences.presentationStyle){
    case 'minimalist':
      style += `- Keep design clean and minimal with plenty of whitespace\n`;
      style += `- Use subtle colors and simple layouts\n`;
      console.log('🎨 Applied minimalist presentation style');
      break;
    case 'rich-media':
      style += `- Use rich visual elements and varied content sections\n`;
      style += `- Include multiple content types and visual hierarchy\n`;
      console.log('🎨 Applied rich-media presentation style');
      break;
    case 'conversational':
      style += `- Use friendly, conversational tone in headings and explanations\n`;
      style += `- Include engaging, informal language\n`;
      console.log('🎨 Applied conversational presentation style');
      break;
    case 'structured':
    default:
      style += `- Use clear structure with defined sections and logical flow\n`;
      console.log('🎨 Applied structured presentation style (default)');
      break;
  }
  // Tone adaptation
  const toneStyle = preferences.toneStyle || 'professional';
  style += `\nTONE ADAPTATION: ${toneStyle}\n`;
  switch(toneStyle){
    case 'casual':
      style += `- Use casual, friendly language in headings and descriptions\n`;
      console.log('🗣️ Applied casual tone');
      break;
    case 'motivational':
      style += `- Include encouraging and motivational language\n`;
      console.log('🗣️ Applied motivational tone');
      break;
    case 'direct':
      style += `- Use clear, direct language focused on key points\n`;
      console.log('🗣️ Applied direct tone');
      break;
    case 'professional':
    default:
      style += `- Maintain professional, educational tone\n`;
      console.log('🗣️ Applied professional tone (default)');
      break;
  }
  console.log('✅ Presentation style generated, length:', style.length);
  return style;
}
async function generateStyledComponentWithGemini(rawContent, title, objective = '', preferences, apiKeys, supabase, userId, relevantImages = [], relevantVideos = []) {
  console.log('🚀 Starting comprehensive UI generation with detailed logging...');
  console.log('📝 Input parameters:', {
    contentLength: rawContent?.length || 0,
    title: title?.substring(0, 50) || 'No title',
    objective: objective?.substring(0, 50) || 'No objective',
    apiKeysAvailable: apiKeys.length,
    preferencesCount: Object.keys(preferences).length,
    imagesAvailable: relevantImages.length,
    videosAvailable: relevantVideos.length
  });
  const preferencesText = Object.entries(preferences).filter(([_, value])=>value !== undefined && value !== null).map(([key, value])=>`${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(', ');
  console.log('🚀 Starting Gemini API generation with preferences text length:', preferencesText.length);
  console.log('📝 Preferences summary for API:', preferencesText.substring(0, 200) + (preferencesText.length > 200 ? '...' : ''));
  try {
    console.log('🔧 Generating style instructions...');
    const styleInstructions = generateStyleInstructions(preferences);
    console.log('✅ Style instructions generated, length:', styleInstructions.length);
    console.log('🏗️ Generating structure guidance...');
    const structureGuidance = generateStructureGuidance(preferences);
    console.log('✅ Structure guidance generated, length:', structureGuidance.length);
    console.log('🎭 Generating presentation style...');
    const presentationStyle = generatePresentationStyle(preferences);
    console.log('✅ Presentation style generated, length:', presentationStyle.length);
    console.log('🔨 Building comprehensive prompt...');
    
    // Build image integration section if images are available
    let imageInstructions = '';
    if (relevantImages.length > 0) {
      imageInstructions = `
VISUAL INTEGRATION INSTRUCTIONS (CRITICAL - IMAGES AVAILABLE):
You have access to ${relevantImages.length} relevant educational images for this module:

${relevantImages.map((img, i) => `${i + 1}. ${img.url}
   Title: ${img.title}
   Description: ${img.description}`).join('\n\n')}

REQUIREMENTS FOR IMAGE INTEGRATION:
1. Integrate AT LEAST 2-3 of these images strategically throughout the content
2. Place images near the concepts they illustrate (not randomly)
3. Use proper semantic HTML with this exact format:
   <figure className="my-6 text-center">
     <img 
       src="IMAGE_URL_HERE" 
       alt="Descriptive text explaining what the image shows" 
       className="w-full max-w-2xl mx-auto rounded-xl shadow-lg object-cover"
       onError={(e) => { e.currentTarget.style.display = 'none'; }}
     />
     <figcaption className="mt-3 text-sm text-gray-600 italic">
       Figure: Brief caption explaining the relevance
     </figcaption>
   </figure>

4. Ensure images enhance learning comprehension, not just decoration
5. Add contextual explanations before and after each image
6. Use responsive Tailwind classes: w-full, max-w-2xl, mx-auto, rounded-xl, shadow-lg
7. IMPORTANT: Reference the actual image URLs provided above, not placeholder URLs
8. Add onError handler to hide broken images gracefully

`;
      console.log(`📸 Added ${relevantImages.length} images to prompt`);
    }
    
    // Build video integration section if videos are available
    let videoInstructions = '';
    if (relevantVideos.length > 0) {
      videoInstructions = `
🎥 VIDEO INTEGRATION INSTRUCTIONS - CRITICAL:

AVAILABLE EDUCATIONAL VIDEOS:
${relevantVideos.map((vid, i) => `${i + 1}. Video ID: "${vid.videoId}"
   Title: ${vid.title}
   URL: https://www.youtube.com/watch?v=${vid.videoId}`).join('\n\n')}

⚠️ MANDATORY REQUIREMENTS:
1. You MUST embed at least 1-2 videos from the list above
2. Place videos in sections where they best explain concepts

3. COPY THIS EXACT CODE (Replace only what's marked as [REPLACE]):

<div className="my-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-xl border-2 border-blue-200 dark:border-blue-800">
  <div className="flex items-center gap-3 mb-4">
    <div className="bg-red-600 rounded-full p-2">
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      </svg>
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
      [REPLACE: Video title from list above]
    </h3>
  </div>
  <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{"{{paddingBottom: '56.25%'}}"}}>
    <iframe
      src="https://www.youtube.com/embed/[REPLACE: Exact video ID from list]"
      title="[REPLACE: Video title]"
      className="absolute top-0 left-0 w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
  <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
    📝 <strong>What you'll learn:</strong> [REPLACE: Brief description]
  </p>
</div>

4. REPLACEMENT RULES:
   - [REPLACE: Exact video ID from list] → Use ONLY the video ID from the list above (e.g., "${relevantVideos[0]?.videoId}")
   - Keep the YouTube embed URL format: https://www.youtube.com/embed/[VIDEO_ID]
   - Do NOT add query parameters to the URL
   - Keep double curly braces for style: {{"{{paddingBottom: '56.25%'}}}}

5. EXAMPLE with video ID "${relevantVideos[0]?.videoId}":
   src="https://www.youtube.com/embed/${relevantVideos[0]?.videoId}"

6. VALIDATION:
   ✓ Video ID must be from the list above (not "VIDEO_ID_HERE" or placeholder)
   ✓ URL must be: https://www.youtube.com/embed/[REAL_ID]
   ✓ No extra query parameters
   ✓ Use double curly braces in style attribute

`;
      console.log(`🎥 Added ${relevantVideos.length} videos to prompt`);
    }
    
    const prompt = `You are a React component generator and pedagogical expert. Transform the provided raw educational content into a RICH PEDAGOGICAL React component with structured learning elements.

CRITICAL: The user preferences below affect BOTH visual styling AND content structure/presentation. You MUST adapt HOW you present the content based on these preferences, not just HOW it looks.

${styleInstructions}

${structureGuidance}

${presentationStyle}

${imageInstructions}

${videoInstructions}

CONTENT PERSONALIZATION REQUIREMENTS (CRITICAL - READ CAREFULLY):
1. The structure guidance above contains CONTENT ADAPTATION requirements based on the user's:
   - Age, educational level, and learning pace
   - Preferred explanation style and language complexity
   - Examples type and real-life applications
   - Motivation style and gamification preferences
   - Bloom's taxonomy cognitive level
   - Practice frequency and question types
   - Presentation formats and collaborative elements
   - Feedback style and help preferences
   - Emotional state and communication style
   - Learning goals, challenges, and accommodations

2. You MUST restructure the raw content to match these preferences:
   - If they prefer simple language, simplify ALL explanations
   - If they want step-by-step style, break down ALL concepts into steps
   - If they want real-world examples related to specific interests, ADD those connections
   - If they prefer bullet points, use bullets throughout
   - If they want frequent practice, add questions after each concept
   - If they prefer visual learning, add visual indicators and structured layouts
   - If they want gamification, frame sections as achievements or challenges
   - If their age is young, use playful, simple language with emojis
   - If they have specific goals, connect all content to those goals

3. The content structure should CHANGE based on preferences, not just the styling.

TECHNICAL REQUIREMENTS:
1. Generate ONLY the React component code, no explanations, no markdown blocks
2. MUST start with "export default function LessonContent()" - this exact pattern is required
3. Use ONLY Tailwind CSS classes - NO inline styles at all
4. Parse the raw content and ADAPT it based on user preferences above
5. Must be a COMPLETELY SELF-CONTAINED React component with NO EXTERNAL IMPORTS
6. DO NOT use any imports - create the component using only native HTML elements and Tailwind classes
7. Use ONLY basic HTML elements: div, h1, h2, h3, p, span, button, etc.

RAW CONTENT TO TRANSFORM:
Title: ${title}
${objective ? `Learning Objective: ${objective}` : ''}
Raw Content: ${rawContent}

USER PREFERENCES SUMMARY:
${preferencesText || 'Using default styling preferences'}

IMPLEMENTATION TEMPLATE (All values MUST come from user preferences):
${(()=>{
      const designSystem = generateComprehensiveDesignSystem(preferences);
      return `
CONTAINER: Use ${designSystem.spacing.container} mx-auto ${designSystem.spacing.padding} ${designSystem.colors.neutral.bg} ${designSystem.effects.corners} ${designSystem.effects.shadows}
HEADINGS: Use ${designSystem.typography.sizes['2xl']} ${designSystem.colors.primary.text} ${designSystem.typography.fontFamily} font-bold
CONTENT: Use ${designSystem.typography.sizes.base} ${designSystem.colors.neutral.text} ${designSystem.typography.fontFamily}
SECTIONS: Use ${designSystem.colors.neutral.bg} ${designSystem.effects.shadows} ${designSystem.effects.corners} ${designSystem.spacing.padding} ${designSystem.spacing.gap}
INTERACTIVE: Use ${designSystem.animations.transition} ${designSystem.animations.hover}

EXAMPLE STRUCTURE (using ONLY preference-generated classes):
export default function LessonContent() {
  return (
    <div className="${designSystem.spacing.container} mx-auto ${designSystem.spacing.padding} ${designSystem.colors.neutral.bg} ${designSystem.effects.corners} ${designSystem.effects.shadows} min-h-screen">
      <h1 className="${designSystem.typography.sizes['2xl']} font-bold ${designSystem.colors.primary.text} ${designSystem.typography.fontFamily} mb-4">${title}</h1>
      <div className="${designSystem.spacing.gap}">
        {/* All content sections must use preference-generated classes only */}
        {/* AND must adapt content structure based on personalization preferences */}
      </div>
    </div>
  );
}`;
    })()}

CRITICAL: Start your response with EXACTLY this pattern:
export default function LessonContent() {

Transform and adapt the raw content based on ALL user preferences now:`;
    console.log('📏 Full prompt generated, length:', prompt.length);
    console.log('🔍 Prompt includes user preferences:', prompt.includes(preferencesText));
    console.log('🎨 Prompt includes style instructions:', prompt.includes('STYLING REQUIREMENTS'));
    console.log('🏗️ Prompt includes structure guidance:', prompt.includes('COMPONENT STRUCTURE GUIDANCE'));
    console.log('🎭 Prompt includes presentation style:', prompt.includes('PRESENTATION STYLE'));
    // Check token limit before API calls
    const { canProceed, tokensNeeded, tokensRemaining } = await trackGeminiCall(supabase, userId, prompt, 2500, 'ui_generation', undefined, undefined);
    if (!canProceed) {
      console.error('❌ Token limit exceeded');
      throw new Error(JSON.stringify({
        error: 'Token limit exceeded',
        tokensNeeded,
        tokensRemaining,
        upgradeRequired: true
      }));
    }
    console.log(`✅ Token check passed. Remaining: ${tokensRemaining}`);
    // Try API keys until one works
    let response;
    let lastError;
    for(let i = 0; i < apiKeys.length; i++){
      const apiKey = apiKeys[i];
      const keyNumber = i + 1;
      try {
        console.log(`📡 Attempting API call ${keyNumber}/${apiKeys.length} with key ${keyNumber}`);
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        });
        if (response.ok) {
          console.log(`✅ Success with API key ${keyNumber}/${apiKeys.length}`);
          break;
        }
        const errorText = await response.text();
        console.error(`❌ API key ${keyNumber} failed:`, response.status, errorText);
        if (response.status === 429) {
          console.log(`🔄 Quota exceeded for key ${keyNumber}, trying next key...`);
          continue;
        } else {
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`💥 Error with API key ${keyNumber}:`, errorMessage);
        lastError = error;
        if (errorMessage.includes('429') && i < apiKeys.length - 1) {
          console.log(`🔄 Trying next API key due to quota exhaustion...`);
          continue;
        }
        if (i === apiKeys.length - 1) {
          console.error('🚨 All API keys exhausted or failed');
          console.log('🔄 Falling back to preference-based component generation...');
          return generateFallbackComponent(rawContent, title, objective, preferences);
        }
      }
    }
    if (!response || !response.ok) {
      console.error('🚨 All API attempts failed, using fallback');
      return generateFallbackComponent(rawContent, title, objective, preferences);
    }
    try {
      console.log('📦 Processing Gemini API response...');
      const data = await response.json();
      console.log('Gemini API response received');
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid Gemini response structure:', data);
        console.log('🔄 Using fallback due to invalid response structure');
        return generateFallbackComponent(rawContent, title, objective, preferences);
      }
      let generatedCode = data.candidates[0].content.parts[0].text;
      // Log actual token usage
      await logActualUsage(supabase, userId, generatedCode, 'ui_generation', undefined, undefined, {
        apiKeyUsed: apiKeys.length,
        model: 'gemini-2.0-flash-exp',
        moduleTitle: title
      });
      // Clean up the response - remove markdown code blocks if present
      generatedCode = generatedCode.replace(/```tsx\n?/g, '').replace(/```jsx\n?/g, '').replace(/```javascript\n?/g, '').replace(/```\n?/g, '');
      generatedCode = generatedCode.trim();
      console.log('Cleaned generated code preview:', generatedCode.substring(0, 150) + '...');
      
      // Validate video integration if videos were provided
      if (relevantVideos && relevantVideos.length > 0) {
        const videoIdsInCode = relevantVideos.filter(v => 
          generatedCode.includes(v.videoId)
        );
        console.log(`🎥 Video integration check: ${videoIdsInCode.length}/${relevantVideos.length} videos embedded`);
        if (videoIdsInCode.length === 0) {
          console.warn('⚠️ No video IDs found in generated code - videos may not be properly embedded');
          console.warn(`Expected to find: ${relevantVideos.map(v => v.videoId).join(', ')}`);
        } else {
          console.log(`✅ Found embedded videos: ${videoIdsInCode.map(v => v.videoId).join(', ')}`);
        }
      }
      
      // Analyze if preferences were likely applied in the generated code
      const hasCustomColors = generatedCode.includes(preferences.primaryColor?.replace('#', '')) || generatedCode.includes('bg-blue-') || generatedCode.includes('text-blue-');
      const hasLayoutStyle = preferences.layoutStyle && generatedCode.includes('max-w-');
      const hasCustomFont = preferences.fontSize && (generatedCode.includes('text-lg') || generatedCode.includes('text-xl') || generatedCode.includes('text-sm'));
      console.log('🔍 Generated code personalization analysis:');
      console.log('  - Custom colors detected:', hasCustomColors);
      console.log('  - Layout preferences applied:', hasLayoutStyle);
      console.log('  - Font size preferences applied:', hasCustomFont);
      console.log('  - Code length:', generatedCode.length, 'characters');
      if (!hasCustomColors && !hasLayoutStyle && !hasCustomFont) {
        console.warn('⚠️ Generated code appears to have minimal personalization applied');
      } else {
        console.log('✅ Generated code shows signs of successful personalization');
      }
      // Ensure it's valid React component code with more flexible validation
      const hasExportDefault = /export\s+default\s+/i.test(generatedCode);
      const hasNamedExport = /export\s*\{[^}]*\}/i.test(generatedCode);
      const hasReactFunction = /function\s+\w+\s*\(/i.test(generatedCode) || /const\s+\w+\s*=\s*\(/i.test(generatedCode);
      if (!hasExportDefault && !hasNamedExport) {
        console.error('Generated code validation failed - no valid export found:', generatedCode.substring(0, 200));
        console.log('🔄 Using fallback due to validation failure');
        return generateFallbackComponent(rawContent, title, objective, preferences);
      }
      if (!hasReactFunction) {
        console.error('Generated code validation failed - no function found:', generatedCode.substring(0, 200));
        console.log('🔄 Using fallback due to validation failure');
        return generateFallbackComponent(rawContent, title, objective, preferences);
      }
      console.log('Successfully generated React component with Gemini');
      return generatedCode;
    } catch (jsonError) {
      console.error('💥 Error processing Gemini response:', jsonError);
      console.log('🔄 Using fallback due to response processing error');
      return generateFallbackComponent(rawContent, title, objective, preferences);
    }
  } catch (promptError) {
    console.error('💥 Error in prompt generation phase:', promptError);
    console.log('🔄 Using fallback due to prompt generation error');
    return generateFallbackComponent(rawContent, title, objective, preferences);
  }
}
function generateFallbackComponent(rawContent, title, objective = '', preferences) {
  console.log('🚨 Generating fallback component due to Gemini API failure');
  console.log('🔄 Fallback preferences applied:', {
    layoutStyle: preferences.layoutStyle,
    presentationStyle: preferences.presentationStyle,
    toneStyle: preferences.toneStyle,
    fontSize: preferences.fontSize
  });
  // Apply preferences to fallback component
  const maxWidth = preferences.layoutStyle === 'single-column' ? 'max-w-3xl' : 'max-w-4xl';
  const fontSize = preferences.fontSize === 'lg' ? 'text-lg' : preferences.fontSize === 'xl' ? 'text-xl' : 'text-base';
  const isMinimalist = preferences.presentationStyle === 'minimalist';
  const isCasual = preferences.toneStyle === 'casual';
  console.log('🎨 Fallback styling decisions:', {
    maxWidth,
    fontSize,
    isMinimalist,
    isCasual
  });
  const designSystem = generateComprehensiveDesignSystem(preferences);
  const contentTitle = isCasual ? title : title;
  const takeawayTitle = isCasual ? "What You'll Learn" : "Key Takeaway";
  return `export default function LessonContent() {
  return (
    <div className="${designSystem.spacing.container} mx-auto ${designSystem.spacing.padding} ${designSystem.colors.neutral.bg} ${designSystem.effects.corners} ${designSystem.effects.shadows} min-h-screen animate-fade-in">
      <div className="${designSystem.spacing.gap}">
        <div className="${preferences.layoutStyle === 'single-column' ? 'text-center' : ''}">
          <h1 className="${designSystem.typography.sizes['2xl']} font-bold ${designSystem.colors.primary.text} ${designSystem.typography.fontFamily} mb-4">${contentTitle}</h1>
          ${objective ? `<p className="${designSystem.typography.sizes.base} ${designSystem.colors.neutral.text} mb-6 ${preferences.layoutStyle === 'single-column' ? 'max-w-2xl mx-auto' : ''}">${objective}</p>` : ''}
        </div>
        
        <section className="${designSystem.colors.neutral.muted} ${designSystem.effects.corners} ${designSystem.effects.borders} ${designSystem.spacing.padding} ${designSystem.animations.transition}">
          <h2 className="${designSystem.typography.sizes.lg} font-semibold ${designSystem.colors.secondary.text} mb-4 flex items-center">
            ${preferences.wantsVisuals !== false ? '<span className="mr-2">📚</span>' : ''}
            Lesson Content
          </h2>
          <div className="whitespace-pre-wrap ${designSystem.typography.sizes.base} ${designSystem.typography.fontFamily} ${designSystem.colors.neutral.text}">
            ${rawContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}
          </div>
        </section>
        
        <section className="${designSystem.colors.primary.light} ${designSystem.effects.corners} ${designSystem.effects.borders} p-4 ${designSystem.animations.transition}">
          <h3 className="${designSystem.typography.sizes.base} font-semibold ${designSystem.colors.primary.text} mb-2 flex items-center">
            ${preferences.wantsVisuals !== false ? '<span className="mr-2">💡</span>' : ''}
            ${takeawayTitle}
          </h3>
          <p className="${designSystem.colors.neutral.text}">
            ${isCasual ? 'Take a moment to review the content above and think about the main ideas!' : 'Review the content above and identify the main concepts and learning objectives.'}
          </p>
        </section>
      </div>
    </div>
  );
}`;
}
