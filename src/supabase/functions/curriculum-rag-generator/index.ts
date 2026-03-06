import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { trackGeminiCall, logActualUsage } from '../_shared/tokenTracking.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// RAG: Retrieve relevant curriculum data from database with content depth analysis
async function retrieveCurriculumData(supabase, formData) {
  console.log('🔍 RAG: Starting curriculum data retrieval...');
  const retrievedData = {
    country: formData.country,
    educationLevel: formData.educationLevel,
    subject: formData.subject,
    relatedContent: [],
    contentDepthMetrics: {
      totalContentLength: 0,
      averageContentLength: 0,
      detailLevel: 'basic',
      requiredDepth: 'comprehensive'
    }
  };
  try {
    // 1. Retrieve Unit data if specified
    if (formData.curriculumIds.unitId) {
      console.log('📚 Retrieving unit data:', formData.curriculumIds.unitId);
      const { data: unitData, error: unitError } = await supabase
        .from('curriculum_units')
        .select('*')
        .eq('id', formData.curriculumIds.unitId)
        .single();
      
      if (!unitError && unitData) {
        retrievedData.unit = unitData;
        console.log('✅ Unit data retrieved:', unitData.unit_title);
      }
    }
    
    // 2. Retrieve Topic data if specified
    if (formData.curriculumIds.topicId) {
      console.log('📖 Retrieving topic data:', formData.curriculumIds.topicId);
      const { data: topicData, error: topicError } = await supabase
        .from('curriculum_topics')
        .select('*')
        .eq('id', formData.curriculumIds.topicId)
        .single();
      
      if (!topicError && topicData) {
        retrievedData.topic = topicData;
        console.log('✅ Topic data retrieved:', topicData.topic_title);
      }
    }
    
    // 3. Retrieve Subtopic data if specified
    if (formData.curriculumIds.subtopicId) {
      console.log('🎯 Retrieving subtopic data:', formData.curriculumIds.subtopicId);
      const { data: subtopicData, error: subtopicError } = await supabase
        .from('curriculum_subtopics')
        .select('*')
        .eq('id', formData.curriculumIds.subtopicId)
        .single();
      
      if (!subtopicError && subtopicData) {
        retrievedData.subtopic = subtopicData;
        console.log('✅ Subtopic data retrieved:', subtopicData.subtopic_title);
      }
    }
    
    // 4. Retrieve related curriculum content from database
    // Retrieve curriculum content based on what's been selected
    const contentQueries = [];
    
    // Priority 1: Direct subtopic content
    if (formData.curriculumIds.subtopicId) {
      console.log('📝 Fetching content for subtopic:', formData.curriculumIds.subtopicId);
      contentQueries.push(
        supabase
          .from('curriculum_content')
          .select('*')
          .eq('subtopic_id', formData.curriculumIds.subtopicId)
          .limit(10)
      );
    }
    
    // Priority 2: All subtopics under selected topic
    if (formData.curriculumIds.topicId) {
      console.log('📝 Fetching content for all subtopics in topic:', formData.curriculumIds.topicId);
      contentQueries.push(
        supabase
          .from('curriculum_content')
          .select(`
            *,
            subtopic:curriculum_subtopics!inner(topic_id)
          `)
          .eq('subtopic.topic_id', formData.curriculumIds.topicId)
          .limit(10)
      );
    }
    
    // Priority 3: All topics under selected unit
    if (formData.curriculumIds.unitId && !formData.curriculumIds.topicId) {
      console.log('📝 Fetching content for all topics in unit:', formData.curriculumIds.unitId);
      // First get all topics in the unit
      const { data: topicsInUnit } = await supabase
        .from('curriculum_topics')
        .select('id')
        .eq('unit_id', formData.curriculumIds.unitId);
      
      if (topicsInUnit && topicsInUnit.length > 0) {
        const topicIds = topicsInUnit.map(t => t.id);
        contentQueries.push(
          supabase
            .from('curriculum_content')
            .select(`
              *,
              subtopic:curriculum_subtopics!inner(topic_id)
            `)
            .in('subtopic.topic_id', topicIds)
            .limit(15)
        );
      }
    }
    
    // Execute all content queries
    const contentResults = await Promise.allSettled(contentQueries);
    contentResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.data) {
        retrievedData.relatedContent.push(...result.value.data);
        console.log(`✅ Content query ${index + 1} retrieved:`, result.value.data.length, 'items');
      } else if (result.status === 'rejected') {
        console.error(`❌ Content query ${index + 1} failed:`, result.reason);
      }
    });
    
    // Remove duplicates
    const uniqueContent = retrievedData.relatedContent.filter(
      (content, index, self) => self.findIndex(c => c.id === content.id) === index
    );
    retrievedData.relatedContent = uniqueContent.slice(0, 15);
    // Analyze curriculum content depth and length
    let totalContentLength = 0;
    let contentLengths = [];
    retrievedData.relatedContent.forEach((content)=>{
      if (content.content_text) {
        const contentLength = content.content_text.length;
        totalContentLength += contentLength;
        contentLengths.push(contentLength);
      }
    });
    // Add unit/topic/subtopic description lengths
    if (retrievedData.unit?.unit_description) {
      const unitLength = retrievedData.unit.unit_description.length;
      totalContentLength += unitLength;
      contentLengths.push(unitLength);
    }
    if (retrievedData.topic?.topic_description) {
      const topicLength = retrievedData.topic.topic_description.length;
      totalContentLength += topicLength;
      contentLengths.push(topicLength);
    }
    if (retrievedData.subtopic?.subtopic_description) {
      const subtopicLength = retrievedData.subtopic.subtopic_description.length;
      totalContentLength += subtopicLength;
      contentLengths.push(subtopicLength);
    }
    const averageContentLength = contentLengths.length > 0 ? Math.round(totalContentLength / contentLengths.length) : 500;
    // Determine required content depth based on curriculum content analysis
    let detailLevel = 'basic';
    let requiredDepth = 'comprehensive';
    if (averageContentLength > 2000) {
      detailLevel = 'expert';
      requiredDepth = 'expert-level';
    } else if (averageContentLength > 1000) {
      detailLevel = 'advanced';
      requiredDepth = 'advanced';
    } else if (averageContentLength > 500) {
      detailLevel = 'intermediate';
      requiredDepth = 'comprehensive';
    }
    retrievedData.contentDepthMetrics = {
      totalContentLength,
      averageContentLength,
      detailLevel,
      requiredDepth,
      contentSources: contentLengths.length,
      minRequiredModuleLength: Math.max(800, Math.floor(averageContentLength * 0.6)),
      targetModuleLength: Math.max(1200, Math.floor(averageContentLength * 0.8))
    };
    console.log(`📊 Curriculum Content Depth Analysis:
      - Total Content Length: ${totalContentLength} characters
      - Average Content Length: ${averageContentLength} characters  
      - Detail Level: ${detailLevel}
      - Required Depth: ${requiredDepth}
      - Content Sources: ${contentLengths.length}
      - Target Module Length: ${retrievedData.contentDepthMetrics.targetModuleLength} characters`);
    console.log(`🎯 RAG Retrieval Summary:
      - Unit: ${retrievedData.unit ? '✅' : '❌'}
      - Topic: ${retrievedData.topic ? '✅' : '❌'}  
      - Subtopic: ${retrievedData.subtopic ? '✅' : '❌'}
      - Related Content: ${retrievedData.relatedContent.length} items`);
    return retrievedData;
  } catch (error) {
    console.error('❌ RAG retrieval error:', error);
    // Return partial data even if some queries fail
    return retrievedData;
  }
}
// Generate contextualized prompt with retrieved curriculum data and depth matching
function generateRAGPrompt(formData, curriculumData, questionsPerModule = 5) {
  console.log('🤖 Generating RAG-enhanced prompt with curriculum depth matching...');
  // Build curriculum context section
  let curriculumContext = `
OFFICIAL CURRICULUM CONTEXT:
Country: ${curriculumData.country}
Education Level: ${curriculumData.educationLevel}
Subject: ${curriculumData.subject}
`;
  if (curriculumData.unit) {
    curriculumContext += `
UNIT CONTEXT:
- Code: ${curriculumData.unit.unit_code}
- Title: ${curriculumData.unit.unit_title}
- Description: ${curriculumData.unit.unit_description || 'N/A'}
- Duration: ${curriculumData.unit.duration_weeks} weeks
- Learning Outcomes: ${JSON.stringify(curriculumData.unit.learning_outcomes || [])}
- Assessment Criteria: ${JSON.stringify(curriculumData.unit.assessment_criteria || [])}
`;
  }
  if (curriculumData.topic) {
    curriculumContext += `
TOPIC CONTEXT:
- Code: ${curriculumData.topic.topic_code}
- Title: ${curriculumData.topic.topic_title}
- Description: ${curriculumData.topic.topic_description || 'N/A'}
- Difficulty Level: ${curriculumData.topic.difficulty_level || 'N/A'}
- Duration: ${curriculumData.topic.duration_hours || 'N/A'} hours
- Prerequisites: ${JSON.stringify(curriculumData.topic.prerequisites || [])}
`;
  }
  if (curriculumData.subtopic) {
    curriculumContext += `
SUBTOPIC CONTEXT (PRIMARY FOCUS):
- Code: ${curriculumData.subtopic.subtopic_code}
- Title: ${curriculumData.subtopic.subtopic_title}
- Description: ${curriculumData.subtopic.subtopic_description || 'N/A'}
- Learning Objective: ${curriculumData.subtopic.learning_objective}
- Bloom's Taxonomy Level: ${curriculumData.subtopic.bloom_taxonomy_level || 'N/A'}
- Competency Indicators: ${JSON.stringify(curriculumData.subtopic.competency_indicators || [])}
- Assessment Methods: ${JSON.stringify(curriculumData.subtopic.assessment_methods || [])}
- Suggested Activities: ${JSON.stringify(curriculumData.subtopic.suggested_activities || [])}
`;
  }
  // Add related content context with PDF support
  if (curriculumData.relatedContent.length > 0) {
    curriculumContext += `
RELATED CURRICULUM CONTENT:`;
    curriculumData.relatedContent.forEach((content, index)=>{
      curriculumContext += `
${index + 1}. ${content.title} (${content.content_type})`;
      if (content.content_source === 'pdf' && content.pdf_file_path) {
        curriculumContext += `
   Source: PDF Document - ${content.pdf_file_path}
   Document: ${content.source_document}${content.page_reference ? ` (Page ${content.page_reference})` : ''}
   Note: PDF content should be parsed and analyzed for curriculum alignment`;
      } else {
        curriculumContext += `
   Content: ${content.content_text.substring(0, 300)}...
   Source: ${content.source_document}${content.page_reference ? ` (Page ${content.page_reference})` : ''}`;
      }
    });
  }
  // Student personalization context
  const personalizationContext = `
STUDENT PERSONALIZATION:
- Age Group: ${formData.age}
- Educational Background: ${formData.educationalBackground}
- Learning Style: ${formData.learningStyle}
- Study Time Preference: ${formData.preferredStudyTime}
- Attention Span: ${formData.attentionSpan}
- Language Complexity: ${formData.languageComplexity}
- Visual Preference: ${formData.visualPreference}
- Motivation Style: ${formData.motivationStyle}
- Study Environment: ${formData.studyEnvironment}
- Device Preference: ${formData.devicePreference}
- Help-Seeking Style: ${formData.helpSeekingStyle}
- Real-World Connection: ${formData.realWorldConnection}
- Personal Interests: ${formData.personalInterests}
- Learning Pace: ${formData.pace}/5
- Assessment Style: ${formData.assessmentStyle}
- Practice Frequency: ${formData.practiceFrequency}
- Feedback Style: ${formData.feedbackStyle}
- Learning Goals: ${formData.learningGoals}
${formData.specialNeeds && formData.specialNeeds !== 'none' ? `- Special Needs: ${formData.specialNeeds}` : ''}

🎨 VISUAL STYLE PREFERENCES (APPLY TO DYNAMIC COMPONENTS):
- Primary Color: ${formData.primaryColor || '#3b82f6'}
- Secondary Color: ${formData.secondaryColor || '#10b981'}
- Font Family: ${formData.fontFamily || 'Inter'}
- Font Size: ${formData.fontSize || 'base'}
- Animation Style: ${formData.animationStyle || 'fade'}
- Layout Style: ${formData.layoutStyle || 'single-column'}
`;
  // Course structure based on generation level
  const getModuleStructure = ()=>{
    switch(formData.generationLevel){
      case 'subtopic':
        return {
          modules: 5,
          duration: 3,
          focus: 'Deep dive into specific subtopic concepts'
        };
      case 'topic':
        return {
          modules: 15,
          duration: 4,
          focus: 'Complete topic coverage with multiple subtopics'
        };
      case 'unit':
        return {
          modules: 30,
          duration: 5,
          focus: 'Full unit mastery with all topics'
        };
      case 'subject':
        return {
          modules: 50,
          duration: 6,
          focus: 'Subject overview with key units'
        };
      default:
        return {
          modules: 10,
          duration: 4,
          focus: 'Balanced coverage'
        };
    }
  };
  const structure = getModuleStructure();
  const enhancedPrompt = `You are EduPerfect's Curriculum-Aligned Learning System, specifically designed to create student-friendly lessons that align perfectly with official curriculum standards.

🚨 CRITICAL JSON FORMAT REQUIREMENTS (FAILURE TO COMPLY = INVALID RESPONSE):
1. Use ONLY straight ASCII quotes (" code 34) - NEVER smart quotes or curly quotes
2. Use ONLY straight ASCII apostrophes (' code 39) - NEVER curly apostrophes  
3. Escape ALL quotes inside strings: use \\" not "
4. NO line breaks inside strings - use \\n instead
5. NO trailing commas before } or ]
6. ALL strings must be properly closed
7. "correct" field MUST be a NUMBER (0, 1, 2, or 3) NOT a string - NO SPACES, NO QUOTES
8. NO extra spaces in string values - check all strings before closing quotes
9. NO double quotes like " " - only one set of quotes per string value
10. Test your JSON is valid before returning
11. If unsure, prefer simpler content over complex formatted content
9. DOUBLE-CHECK: No smart quotes anywhere (", ", ', ')
10. Return ONLY valid JSON - no markdown, no explanations

${curriculumContext}

${personalizationContext}

🎯 CRITICAL RAG REQUIREMENTS:
- Your lesson MUST align with the official curriculum context provided above
- Incorporate specific learning objectives, competency indicators, and assessment methods from the curriculum
- Use the related curriculum content as authoritative sources
- Ensure all content matches the specified Bloom's taxonomy level
- Include suggested activities from the curriculum where relevant
- Reference official curriculum codes and standards

📏 CRITICAL CONTENT DEPTH & LENGTH MATCHING REQUIREMENTS:
- CURRICULUM ANALYSIS: Average curriculum content length is ${curriculumData.contentDepthMetrics.averageContentLength} characters
- TARGET MODULE LENGTH: Each module must contain AT LEAST ${curriculumData.contentDepthMetrics.minRequiredModuleLength} characters
- OPTIMAL MODULE LENGTH: Target ${curriculumData.contentDepthMetrics.targetModuleLength} characters per module
- DEPTH LEVEL REQUIRED: ${curriculumData.contentDepthMetrics.requiredDepth} depth matching curriculum detail level: ${curriculumData.contentDepthMetrics.detailLevel}
- CONTENT RICHNESS: Match or exceed the knowledge density found in curriculum sources (${curriculumData.contentDepthMetrics.contentSources} sources analyzed)
- ⚠️ RESPONSE SIZE LIMIT: Keep total response under 30,000 characters to prevent truncation - distribute content strategically across modules

🚫 ANTI-SUMMARY REQUIREMENTS (CRITICAL):
- NO summaries, overviews, or brief explanations - FULL detailed content only
- NO "introduction to" content - provide COMPLETE knowledge transfer
- NO placeholder text or general statements - SPECIFIC, detailed information required  
- NO surface-level content - DEEP knowledge with expert-level detail
- Every concept must include: definition, explanation, examples, applications, implications
- Include step-by-step processes, detailed procedures, comprehensive analysis
- Provide multiple perspectives, case studies, and real-world implementations

📚 ENHANCED LESSON GENERATION REQUIREMENTS:
- Generate exactly ${structure.modules} micro-modules
- Each module should be ${structure.duration} minutes
- Focus: ${structure.focus}
- CRITICAL: Every module must contain AT LEAST ${curriculumData.contentDepthMetrics.minRequiredModuleLength} characters of educational content
- TARGET: Aim for ${curriculumData.contentDepthMetrics.targetModuleLength} characters per module to match curriculum depth
- Content must be age-appropriate for ${formData.age} learners
- Use ${formData.languageComplexity} language complexity
- Include ${formData.practiceFrequency} practice questions
- Provide ${formData.feedbackStyle} feedback

📖 COMPREHENSIVE CONTENT STRUCTURE (MANDATORY for each module):
1. **Deep Conceptual Foundation** (200+ chars): Thorough explanation of core concepts with technical accuracy
2. **Detailed Methodology** (300+ chars): Step-by-step procedures, processes, and methodologies
3. **Multiple Worked Examples** (400+ chars): Comprehensive examples with detailed solutions and reasoning
4. **Real-World Applications** (250+ chars): Practical implementations with specific scenarios and case studies  
5. **Expert Insights** (200+ chars): Professional perspectives, industry standards, and advanced considerations
6. **Implementation Guidelines** (300+ chars): Practical steps for applying knowledge with detailed instructions
7. **Troubleshooting & Problem-Solving** (200+ chars): Common challenges and expert solutions
8. **Assessment & Verification** (150+ chars): Methods to validate understanding and measure progress
9. **Advanced Connections** (200+ chars): Links to related concepts and advanced study pathways
10. **Professional Context** (150+ chars): How experts use this knowledge in professional settings

🔗 CURRICULUM ALIGNMENT VALIDATION:
- Each module must reference specific curriculum standards
- Learning objectives must match official competency indicators
- Assessment questions must use curriculum-specified methods
- Examples must be culturally relevant to ${curriculumData.country}

FORMAT AS JSON:
{
  "title": "Curriculum-Aligned Course Title",
  "description": "Course description emphasizing curriculum alignment",
  "curriculum_alignment": {
    "country": "${curriculumData.country}",
    "education_level": "${curriculumData.educationLevel}",
    "subject": "${curriculumData.subject}",
    "unit_code": "${curriculumData.unit?.unit_code || curriculumData.unit?.code || 'N/A'}",
    "topic_code": "${curriculumData.topic?.topic_code || 'N/A'}",
    "subtopic_code": "${curriculumData.subtopic?.subtopic_code || 'N/A'}",
    "bloom_taxonomy_level": "${curriculumData.subtopic?.bloom_taxonomy_level || 'understand'}"
  },
  "estimated_duration": "${structure.modules * structure.duration} minutes",
  "difficulty_level": "${curriculumData.topic?.difficulty_level || 'intermediate'}",
  "topics": [
    {
      "title": "Topic Title (aligned with curriculum)",
      "description": "Topic description referencing curriculum standards",
      "curriculum_reference": "Specific curriculum code/standard",
      "subtopics": [
        {
          "title": "Subtopic Title",
          "description": "Subtopic description with curriculum alignment",
          "micro_modules": [
               {
                 "title": "Module Title (student-friendly)",
                 "content": "🎓 COMPREHENSIVE MODULE CONTENT (MINIMUM ${curriculumData.contentDepthMetrics.minRequiredModuleLength} characters): Provide exhaustive, detailed content covering all aspects of this topic. Include: 1) Deep conceptual foundations with technical explanations, 2) Step-by-step methodologies and procedures, 3) Multiple detailed worked examples with complete solutions, 4) Extensive real-world applications with specific case studies, 5) Expert insights and professional perspectives, 6) Implementation guidelines with practical steps, 7) Common challenges and expert solutions, 8) Assessment methods and verification techniques, 9) Advanced connections to related concepts, 10) Professional context and industry applications. NO SUMMARIES - provide complete knowledge transfer with rich detail matching curriculum depth.",
                 "learning_objective": "Specific objective from curriculum competency indicators",
                 "curriculum_standard": "Official curriculum reference", 
                 "estimated_duration_minutes": ${structure.duration},
                "quick_quiz": {
                  "question": "🎯 CURRICULUM-SPECIFIC QUIZ: Write a detailed question that tests ${curriculumData.subtopic?.bloom_taxonomy_level || 'understanding'} of the EXACT ${curriculumData.subject} concepts covered in this module. Must align with curriculum assessment methods: ${JSON.stringify(curriculumData.subtopic?.assessment_methods || [])}. Use specific terminology and scenarios from the official curriculum content.",
                  "options": ["CURRICULUM-ALIGNED Option A with specific ${curriculumData.subject} terminology", "REALISTIC Option B using ${curriculumData.country} context and examples", "DETAILED Option C incorporating curriculum competency indicators", "SPECIFIC Option D with technical accuracy for ${formData.educationalBackground} level"],
                  "correct": 0,
                  "explanation": "📚 DETAILED CURRICULUM EXPLANATION: Provide comprehensive reasoning that reinforces the official learning objective: '${curriculumData.subtopic?.learning_objective || 'curriculum-based learning'}'. Reference specific curriculum content, competency indicators, and real applications in ${curriculumData.country} context."
                },
                "⚠️ CRITICAL": "The correct field above MUST be a plain number (0, 1, 2, or 3) with NO quotes, NO spaces. Example: 'correct': 2 NOT 'correct': ' 2' or 'correct': '2'",
               "real_world_example": "🌍 ${curriculumData.country}-SPECIFIC EXAMPLE: Provide concrete, detailed real-world application of this ${curriculumData.subject} concept in ${curriculumData.country} context. Include actual data, locations, institutions, or scenarios relevant to ${formData.personalInterests}. Must demonstrate practical usage of curriculum concepts.",
               "curriculum_activities": "🎯 OFFICIAL CURRICULUM ACTIVITIES: ${curriculumData.subtopic?.suggested_activities && curriculumData.subtopic.suggested_activities.length > 0 ? 'Implement these curriculum-specified activities: ' + JSON.stringify(curriculumData.subtopic.suggested_activities) : 'Create activities that align with the curriculum competency indicators and assessment methods for this subtopic'}",
               "generated_code": "🎨 CRITICAL: Return ONLY executable React/TypeScript component code for curriculum-aligned lesson. Must apply user style preferences: Primary Color '${formData.primaryColor || '#3b82f6'}', Secondary Color '${formData.secondaryColor || '#10b981'}', Font '${formData.fontFamily || 'Inter'}', Animation '${formData.animationStyle || 'fade'}'. Include curriculum context header showing '${curriculumData.country} ${curriculumData.educationLevel} • ${curriculumData.subject}'. Structure: export default function CurriculumLessonContent() { return (<div className='p-6 max-w-4xl mx-auto'>[styled curriculum lesson with user preferences]</div>); }. NO template literals, NO explanatory text - ONLY working React code."
             }
          ]
        }
      ]
    }
  ]
}

🚨 CRITICAL JSON REQUIREMENTS:
- Response MUST be valid JSON only
- NO markdown formatting or code blocks
- NO trailing commas in JSON objects or arrays
- ALL strings must be properly escaped with double quotes
- generated_code MUST contain ONLY executable React/TypeScript component code

🎨 REACT COMPONENT CODE REQUIREMENTS:
- The "generated_code" field MUST contain ONLY executable React/TypeScript code
- Use actual color values, font names, and animation classes - NO template variables
- Apply user preferences: Primary Color: ${formData.primaryColor || '#3b82f6'}, Secondary: ${formData.secondaryColor || '#10b981'}, Font: ${formData.fontFamily || 'Inter'}, Animation: ${formData.animationStyle || 'fade'}
- Code must start with: export default function CurriculumLessonContent() { return (
- NO explanatory text, NO comments in the JSON - ONLY working React code
- Use Tailwind CSS classes with proper styling
- Include curriculum context in the component

USER STYLE PREFERENCES TO INCORPORATE:
- Animation Style: ${formData.animationStyle || 'fade'}
- Primary Color: ${formData.primaryColor || '#3b82f6'}
- Secondary Color: ${formData.secondaryColor || '#8b5cf6'}
- Font Family: ${formData.fontFamily || 'Inter'}
- Layout Style: ${formData.layoutStyle || 'single-column'}
- Font Size: ${formData.fontSize || 'medium'}

INCORPORATE these preferences naturally into your content but DO NOT use template literal syntax in the JSON response.
- Use official curriculum terminology and concepts
- Maintain educational rigor as specified in curriculum guidelines
- Ensure age and level appropriateness according to curriculum specifications
- Each module must have exactly ${questionsPerModule} quiz questions in its quick_quiz section

🎨 DYNAMIC RENDERING REQUIREMENTS:
- For each module, generate an additional "generated_code" field containing a JSON structure for dynamic rendering
- The generated_code should include structured sections (introduction, main_content, examples, activities)
- Apply the user's style preferences (colors, fonts, animations) in the component structure
- Use semantic HTML with Tailwind CSS classes that respect the user's preferences
- Include interactive elements and visual enhancements based on animation preferences
- Ensure curriculum alignment is maintained in dynamic components

🔍 CONTENT DEPTH VALIDATION REQUIREMENTS:
- Each module content must contain detailed explanations (not summaries)  
- Include step-by-step procedures and methodologies
- Provide multiple worked examples with complete solutions
- Include practical applications with specific scenarios
- Add expert insights and professional perspectives
- Include implementation guidelines and troubleshooting
- Must meet minimum ${curriculumData.contentDepthMetrics.minRequiredModuleLength} character requirement per module
- Content depth must match curriculum source material depth level: ${curriculumData.contentDepthMetrics.detailLevel}

CRITICAL: You MUST generate exactly ${structure.modules} modules total with COMPLETE content AND dynamic components for each.
CRITICAL: Each module must be comprehensive and knowledge-rich, NOT a summary or overview.

Generate the complete curriculum-aligned course now:`;
  return enhancedPrompt;
}
// Main serve function
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { userId, formData } = await req.json();
    console.log('🎓 RAG-Enhanced Curriculum Generation Starting:', {
      userId,
      generationLevel: formData.generationLevel,
      subject: formData.subject,
      subtopic: formData.subtopic,
      country: formData.country
    });
    // Validate required data
    if (!formData.type || formData.type !== 'curriculum') {
      throw new Error('Invalid request: Expected curriculum generation type');
    }
    if (!formData.curriculumIds || !formData.curriculumIds.countryId) {
      throw new Error('Missing curriculum context: countryId required');
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    // Get all available API keys for rotation
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
      throw new Error('No Google API keys configured');
    }
    console.log(`🔑 Found ${apiKeys.length} API keys available`);
    async function makeApiCallWithRetry(prompt, maxRetries = apiKeys.length) {
      let lastError = null;
      // Check token limit before making API calls
      const { canProceed, tokensNeeded, tokensRemaining } = await trackGeminiCall(supabase, userId, prompt, 4000, 'curriculum_generation', undefined, undefined);
      if (!canProceed) {
        throw new Error(JSON.stringify({
          error: 'Token limit exceeded',
          tokensNeeded,
          tokensRemaining,
          upgradeRequired: true
        }));
      }
      console.log(`✅ Token check passed. Remaining: ${tokensRemaining}`);
      for(let attempt = 0; attempt < maxRetries; attempt++){
        const currentApiKey = apiKeys[attempt % apiKeys.length];
        console.log(`🔄 Attempt ${attempt + 1}/${maxRetries} with API key ${attempt % apiKeys.length + 1}`);
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentApiKey}`, {
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
                maxOutputTokens: 7500, // Reduced to prevent truncation
                responseMimeType: "application/json"
              }
            })
          });
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ API call successful with key ${attempt % apiKeys.length + 1}`);
            // Log actual token usage
            const responseText = JSON.stringify(data);
            await logActualUsage(supabase, userId, responseText, 'curriculum_generation', undefined, undefined, {
              apiKeyUsed: attempt % apiKeys.length + 1,
              model: 'gemini-1.5-flash',
              generationLevel: formData.generationLevel
            });
            return data;
          }
          const errorText = await response.text();
          // Handle specific error types
          if (response.status === 429 || response.status === 503) {
            console.log(`⏳ Rate limit/quota hit on key ${attempt % apiKeys.length + 1}, trying next...`);
            lastError = new Error(`API limit exceeded: ${errorText}`);
            // Add delay for rate limits
            if (attempt < maxRetries - 1) {
              await new Promise((resolve)=>setTimeout(resolve, 1000 * (attempt + 1)));
            }
            continue;
          }
          throw new Error(`API error ${response.status}: ${errorText}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`❌ Error with API key ${attempt % apiKeys.length + 1}:`, message);
          lastError = error instanceof Error ? error : new Error(String(error));
          // For network errors, try next key immediately
          if (attempt < maxRetries - 1 && message.includes('network')) {
            continue;
          }
          // For quota errors, try next key with delay
          if (attempt < maxRetries - 1 && (message.includes('quota') || message.includes('limit'))) {
            await new Promise((resolve)=>setTimeout(resolve, 500));
            continue;
          }
        }
      }
      throw lastError || new Error('All API keys exhausted');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // RAG STEP 1: Retrieve curriculum data
    console.log('🔍 Step 1: Retrieving curriculum data...');
    const curriculumData = await retrieveCurriculumData(supabase, formData);
    // Get questions per module preference
    const questionsPerModule = formData.questionsPerModule || 5;
    console.log(`📝 Questions per module requested: ${questionsPerModule}`);
    // RAG STEP 2: Generate contextualized prompt  
    console.log('🤖 Step 2: Generating RAG-enhanced prompt...');
    const ragPrompt = generateRAGPrompt(formData, curriculumData, questionsPerModule);
    // RAG STEP 3: Generate content with curriculum context and depth matching
    console.log('⚡ Step 3: Generating curriculum-aligned content...');
    console.log(`🎯 Target content depth: ${curriculumData.contentDepthMetrics.requiredDepth} (${curriculumData.contentDepthMetrics.targetModuleLength} chars/module)`);
    const geminiData = await makeApiCallWithRetry(ragPrompt);
    console.log('✅ RAG-enhanced content generated successfully');
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }
    const generatedContent = geminiData.candidates[0].content.parts[0].text;
    console.log('📊 Generated content length:', generatedContent.length);
    let courseData;
    try {
      // Enhanced JSON cleaning and validation
      let cleanedContent = generatedContent
        // Remove markdown code blocks
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^\s*[\r\n]+/gm, '') // Remove empty lines
        // CRITICAL: Replace smart quotes with straight quotes (most common AI error)
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')  // All types of smart double quotes
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")  // All types of smart single quotes
        // Replace curly apostrophes
        .replace(/[\u2019]/g, "'")
        .trim();
      
      // CRITICAL FIX: Handle the specific issues from logs
      // 1. Fix extra quotes in strings like " "A comprehensive... → "A comprehensive...
      cleanedContent = cleanedContent.replace(/"\s+"/g, '"');
      
      // 2. Fix numeric values with spaces like " 2" → 2 (for "correct" field)
      cleanedContent = cleanedContent.replace(/"correct"\s*:\s*"\s*(\d+)\s*"/g, '"correct": $1');
      
      // 3. Fix any remaining spacing issues in numeric fields
      cleanedContent = cleanedContent.replace(/"\s+(\d+)\s+"/g, ' $1');
      
      // More aggressive JSON cleaning for dynamic content with generated_code
      cleanedContent = cleanedContent
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([}\]]),?\s*$/g, '$1') // Remove trailing comma at end
        .replace(/,\s*,/g, ',') // Remove double commas
        .replace(/:\s*,/g, ': null,'); // Fix missing values
      console.log('🔍 Parsing content length:', cleanedContent.length);
      console.log('🔍 First 500 chars:', cleanedContent.substring(0, 500));
      console.log('🔍 Last 500 chars:', cleanedContent.substring(cleanedContent.length - 500));
      courseData = JSON.parse(cleanedContent);
      console.log('✅ Successfully parsed RAG response');
      // Validate content depth matches curriculum requirements
      console.log('🔍 Validating content depth against curriculum requirements...');
      let totalGeneratedLength = 0;
      let moduleCount = 0;
      if (courseData.topics) {
        courseData.topics.forEach((topic)=>{
          if (topic.subtopics) {
            topic.subtopics.forEach((subtopic)=>{
              if (subtopic.micro_modules) {
                subtopic.micro_modules.forEach((module)=>{
                  if (module.content) {
                    const moduleLength = module.content.length;
                    totalGeneratedLength += moduleLength;
                    moduleCount++;
                    // Validate individual module meets minimum requirements
                    if (moduleLength < curriculumData.contentDepthMetrics.minRequiredModuleLength) {
                      console.warn(`⚠️ Module "${module.title}" length (${moduleLength}) below curriculum requirement (${curriculumData.contentDepthMetrics.minRequiredModuleLength})`);
                    }
                  }
                });
              }
            });
          }
        });
      }
      const averageGeneratedLength = moduleCount > 0 ? Math.round(totalGeneratedLength / moduleCount) : 0;
      console.log(`📊 Content Depth Validation:
        - Generated ${moduleCount} modules
        - Total content: ${totalGeneratedLength} characters
        - Average per module: ${averageGeneratedLength} characters
        - Curriculum target: ${curriculumData.contentDepthMetrics.targetModuleLength} characters
        - Depth match: ${averageGeneratedLength >= curriculumData.contentDepthMetrics.minRequiredModuleLength ? '✅' : '❌'}`);
      if (averageGeneratedLength < curriculumData.contentDepthMetrics.minRequiredModuleLength) {
        console.warn('⚠️ Generated content may not meet curriculum depth requirements');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse RAG response:', parseError);
      const message = parseError instanceof Error ? parseError.message : String(parseError);
      const match = message.match(/position (\d+)/);
      const errorPosition = match ? parseInt(match[1]) : 0;
      console.error('❌ Parse error details:', {
        message: message,
        position: errorPosition
      });
      
      // Show context around error
      if (errorPosition > 0) {
        const start = Math.max(0, errorPosition - 100);
        const end = Math.min(generatedContent.length, errorPosition + 100);
        console.error('🔍 Error context:', generatedContent.substring(start, end));
      }
      
      // Try alternative parsing with more aggressive cleaning
      try {
        console.log('🔄 Attempting alternative JSON parsing...');
        // Extract JSON from response more aggressively
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON object found in response');
        }
        let altContent = jsonMatch[0];
        // Fix common JSON syntax issues
        altContent = altContent.replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([}\]]),?\s*$/g, '$1') // Remove final trailing comma
        .replace(/"\s*\+\s*"/g, '') // Remove string concatenation
        .replace(/\n\s*\n/g, '\n') // Remove double newlines
        .replace(/([^\\])\\([^\\"])/g, '$1\\\\$2'); // Fix backslashes
        courseData = JSON.parse(altContent);
        console.log('✅ Alternative parsing successful');
      } catch (altError) {
        console.error('❌ Alternative parsing also failed:', altError);
        // Try one more aggressive cleaning attempt for content with quotes
        try {
          console.log('🔄 Attempting final JSON repair with advanced techniques...');
          
          // Advanced JSON repair function with unterminated string handling
          const repairJSON = (text: string): string => {
            let repaired = text;
            
            // 1. Remove all markdown artifacts
            repaired = repaired.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            // 2. CRITICAL: Detect and fix unterminated strings
            // Find the last complete JSON structure before any truncation
            const lastValidClosing = Math.max(
              repaired.lastIndexOf('}'),
              repaired.lastIndexOf(']')
            );
            
            if (lastValidClosing > 0 && lastValidClosing < repaired.length - 10) {
              // Content after last closing bracket - likely truncated
              console.log('⚠️ Detected potential truncation, trimming to last valid structure');
              repaired = repaired.substring(0, lastValidClosing + 1);
            }
            
            // 3. Fix unterminated strings by finding unclosed quotes
            let inString = false;
            let escaped = false;
            let lastValidPos = 0;
            
            for (let i = 0; i < repaired.length; i++) {
              const char = repaired[i];
              
              if (escaped) {
                escaped = false;
                continue;
              }
              
              if (char === '\\') {
                escaped = true;
                continue;
              }
              
              if (char === '"') {
                inString = !inString;
                if (!inString) {
                  lastValidPos = i + 1; // Update last valid position after closing quote
                }
              }
              
              // Track valid JSON structure positions
              if (!inString && (char === '}' || char === ']')) {
                lastValidPos = i + 1;
              }
            }
            
            // If we end with an open string, truncate to last valid position
            if (inString && lastValidPos > 0) {
              console.log(`⚠️ Unterminated string detected, truncating from ${repaired.length} to ${lastValidPos}`);
              repaired = repaired.substring(0, lastValidPos);
            }
            
            // 4. Replace ALL unicode quote variations with ASCII
            const quoteReplacements: [RegExp, string][] = [
              [/[\u201C\u201D\u201E\u201F\u2033\u2036\u301D\u301E\uFF02]/g, '"'],
              [/[\u2018\u2019\u201A\u201B\u2032\u2035\u301B\u301C\uFF07]/g, "'"],
              [/[\u2013\u2014]/g, '-'],
              [/[\u2026]/g, '...'],
            ];
            quoteReplacements.forEach(([pattern, replacement]) => {
              repaired = repaired.replace(pattern, replacement);
            });
            
            // 5. CRITICAL FIXES for specific issues from logs
            repaired = repaired.replace(/"\s+"/g, '"');
            repaired = repaired.replace(/"correct"\s*:\s*"\s*(\d+)\s*"/g, '"correct": $1');
            repaired = repaired.replace(/:\s*"\s+([^"]+?)\s+"/g, ': "$1"');
            
            // 6. Fix common JSON structure issues
            repaired = repaired
              .replace(/,(\s*[}\]])/g, '$1')
              .replace(/([}\]]),?\s*$/g, '$1')
              .replace(/,\s*,+/g, ',')
              .replace(/:\s*,/g, ': null,');
            
            // 7. Ensure proper closing of arrays and objects
            let openBraces = 0;
            let openBrackets = 0;
            inString = false;
            escaped = false;
            
            for (let i = 0; i < repaired.length; i++) {
              const char = repaired[i];
              
              if (escaped) {
                escaped = false;
                continue;
              }
              
              if (char === '\\') {
                escaped = true;
                continue;
              }
              
              if (char === '"') {
                inString = !inString;
                continue;
              }
              
              if (!inString) {
                if (char === '{') openBraces++;
                if (char === '}') openBraces--;
                if (char === '[') openBrackets++;
                if (char === ']') openBrackets--;
              }
            }
            
            // Close any unclosed structures
            while (openBrackets > 0) {
              repaired += ']';
              openBrackets--;
            }
            while (openBraces > 0) {
              repaired += '}';
              openBraces--;
            }
            
            // 8. Extract the main JSON object
            const jsonMatch = repaired.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              repaired = jsonMatch[0];
            }
            
            return repaired;
          };
          
          const repairedContent = repairJSON(generatedContent);
          console.log('🔍 Repaired content length:', repairedContent.length);
          console.log('🔍 Repaired first 500:', repairedContent.substring(0, 500));
          console.log('🔍 Repaired last 500:', repairedContent.substring(repairedContent.length - 500));
          
          courseData = JSON.parse(repairedContent);
          console.log('✅ Final repair successful');
        } catch (finalError) {
          console.error('❌ Final repair also failed:', finalError);
          // Generate a minimal fallback response
          console.log('🔄 Generating fallback minimal response...');
          courseData = {
            title: `${formData.subject} - ${formData.subtopic || formData.topic || 'Comprehensive Learning Module'}`,
            description: `An in-depth, curriculum-aligned course for ${formData.subject} designed specifically for ${formData.age || 'all'} learners focusing on ${formData.subtopic || formData.topic || 'core subject concepts'} with real-world applications and practical understanding.`,
            curriculum_alignment: {
              country: formData.country || 'Global',
              education_level: formData.educationLevel || 'General',
              subject: formData.subject || 'General Studies',
              unit_code: 'N/A',
              topic_code: 'N/A',
              subtopic_code: 'N/A',
              bloom_taxonomy_level: 'understand'
            },
            estimated_duration: '15 minutes',
            difficulty_level: 'intermediate',
            topics: [
              {
                title: formData.subtopic || formData.topic || 'Core Concepts',
                description: `Comprehensive learning journey through ${formData.subtopic || formData.topic || 'essential subject knowledge'} with curriculum-aligned content`,
                curriculum_reference: 'Official Curriculum Standards',
                subtopics: [
                  {
                    title: 'Foundational Understanding',
                    description: `Building strong foundations in ${formData.subject} through structured learning`,
                    micro_modules: [
                      {
                        title: `Introduction to ${formData.subject}`,
                        content: `This comprehensive module provides students with a thorough introduction to ${formData.subject}. 

**What You'll Learn:**
- Core principles and fundamental concepts that form the foundation of ${formData.subject}
- Key terminology and essential vocabulary used by professionals in this field
- Historical context and development of ${formData.subject} as a discipline
- Real-world applications and practical importance in daily life and various industries

**Understanding the Basics:**
${formData.subject} is a crucial subject that helps students develop critical thinking skills and analytical abilities. Through this module, you'll explore how ${formData.subject} connects to other areas of knowledge and why it's essential for academic and professional success.

**Practical Applications:**
You'll discover how ${formData.subject} is used in various careers and industries, from technology and healthcare to business and creative fields. This understanding helps bridge the gap between theoretical knowledge and practical skills.

**Building Your Foundation:**
This module is designed to give you confidence in approaching more advanced topics. By mastering these fundamentals, you'll be well-prepared for deeper exploration and specialized study areas.`,
                        learning_objective: `Master fundamental concepts and principles in ${formData.subject}, understanding their practical applications and importance`,
                        curriculum_standard: `${formData.country} ${formData.educationLevel} ${formData.subject} Standards`,
                        estimated_duration_minutes: 8,
                        quick_quiz: {
                          question: `What is the primary importance of studying ${formData.subject} in your education?`,
                          options: [
                            'It provides essential foundational knowledge for advanced learning',
                            'It only helps with test-taking skills',
                            'It has no practical applications',
                            'It is only useful for specific careers'
                          ],
                          correct: 0,
                          explanation: `Studying ${formData.subject} provides essential foundational knowledge that supports advanced learning across multiple disciplines and has numerous practical applications in both academic and professional contexts.`
                        },
                        generated_code: JSON.stringify({
                          component: {
                            type: 'lesson',
                            title: `Introduction to ${formData.subject}`,
                            learningObjective: `Master fundamental concepts and principles in ${formData.subject}`,
                            sections: [
                              {
                                type: 'introduction',
                                title: 'Welcome to Your Learning Journey',
                                content: `Welcome to an exciting exploration of ${formData.subject}! This subject opens doors to understanding our world in new and meaningful ways. Whether you're curious about how things work or want to solve real-world problems, ${formData.subject} provides the tools and knowledge you need.`,
                                highlight: `${formData.subject} is everywhere around us - let's discover how!`
                              },
                              {
                                type: 'main_content',
                                title: 'Core Foundations',
                                content: `Every expert in ${formData.subject} started exactly where you are now. The key concepts we'll explore today form the building blocks for everything else you'll learn. Think of this as learning the alphabet before writing stories - these fundamentals are your foundation for success.`
                              },
                              {
                                type: 'example',
                                title: 'Real-World Connection',
                                content: `Have you ever wondered how professionals use ${formData.subject} in their daily work? From solving complex problems to creating innovative solutions, ${formData.subject} plays a crucial role in shaping our modern world and improving people's lives.`
                              },
                              {
                                type: 'activity',
                                title: 'Think About It',
                                content: `Take a moment to think about where you might encounter ${formData.subject} in your own life. Look around you - can you identify examples or applications? This awareness will help you connect your learning to the real world.`,
                                interactive: true
                              }
                            ],
                            keyTakeaways: [
                              `${formData.subject} provides essential knowledge for understanding our world`,
                              'Fundamental concepts serve as building blocks for advanced learning',
                              'Real-world applications make abstract concepts practical and meaningful',
                              'Strong foundations enable confidence in tackling complex challenges'
                            ],
                            callToAction: {
                              title: 'Ready to Dive Deeper?',
                              description: 'Test your understanding with our interactive quiz and continue your learning journey',
                              action: 'Take Knowledge Check'
                            }
                          }
                        })
                      }
                    ]
                  }
                ]
              }
          ]
          };
          console.log('⚠️ Using fallback response due to parsing errors');
        }
      }
    }
    // Validate curriculum alignment
    if (!courseData.curriculum_alignment) {
      console.warn('⚠️ Missing curriculum alignment data');
      courseData.curriculum_alignment = {
        country: curriculumData.country,
        education_level: curriculumData.educationLevel,
        subject: curriculumData.subject
      };
    }
    // RAG STEP 4: Create course with curriculum metadata
    console.log('💾 Step 4: Saving curriculum-aligned course...');
    
    // Validate courseData before saving
    if (!courseData.topics || !Array.isArray(courseData.topics) || courseData.topics.length === 0) {
      console.error('❌ Invalid courseData: topics missing or invalid');
      courseData.topics = [{
        title: 'Introduction',
        description: 'Course introduction',
        subtopics: []
      }];
    }
    
    const { data: course, error: courseError } = await supabase.from('courses').insert({
      user_id: userId,
      title: courseData.title || `${formData.subject} Course`,
      description: courseData.description || `A comprehensive course on ${formData.subject}`,
      skill_area: formData.subject,
      difficulty_level: courseData.difficulty_level || 'intermediate',
      estimated_duration: courseData.estimated_duration || '30 minutes',
      topics: courseData.topics,
      learning_preferences: {
        ...formData,
        curriculum_aligned: true,
        rag_enhanced: true,
        generation_type: 'curriculum-rag',
        curriculum_data: curriculumData,
        generation_timestamp: new Date().toISOString()
      },
      status: 'active'
    }).select().single();
    
    if (courseError) {
      console.error('❌ Database error saving course:', {
        error: courseError,
        message: courseError.message,
        details: courseError.details,
        hint: courseError.hint,
        code: courseError.code
      });
      throw new Error(`Database error: ${courseError.message}`);
    }
    
    if (!course) {
      console.error('❌ No course data returned from database');
      throw new Error('Failed to create course: No data returned');
    }
    
    console.log(`✅ Course saved successfully with ID: ${course.id}`);
    // Create micro-modules with curriculum references
    const moduleCreationPromises = [];
    let totalMicroModules = 0;
    
    try {
      if (!courseData.topics || courseData.topics.length === 0) {
        console.warn('⚠️ No topics found, skipping module creation');
      } else {
        for(let topicIndex = 0; topicIndex < courseData.topics.length; topicIndex++){
          const topic = courseData.topics[topicIndex];
          if (!topic.subtopics || !Array.isArray(topic.subtopics)) {
            console.warn(`⚠️ Topic ${topicIndex} has no subtopics, skipping`);
            continue;
          }
          
          for(let subtopicIndex = 0; subtopicIndex < topic.subtopics.length; subtopicIndex++){
            const subtopic = topic.subtopics[subtopicIndex];
            if (subtopic.micro_modules && subtopic.micro_modules.length > 0) {
              for(let moduleIndex = 0; moduleIndex < subtopic.micro_modules.length; moduleIndex++){
                const microModule = subtopic.micro_modules[moduleIndex];
                const modulePromise = supabase.from('micro_modules').insert({
                  subtopic_id: `${topicIndex}-${subtopicIndex}`,
                  course_id: course.id,
                  topic_index: topicIndex,
                  subtopic_index: subtopicIndex,
                  module_index: moduleIndex,
                  title: microModule.title || `Module ${moduleIndex + 1}`,
                  content: microModule.content || 'Content coming soon',
                  estimated_duration_minutes: microModule.estimated_duration_minutes || 5,
                  learning_objective: microModule.learning_objective || 'Learn key concepts',
                  quick_quiz: microModule.quick_quiz || {
                    question: `What is the main concept covered in ${microModule.title || 'this module'}?`,
                    options: [
                      "Concept A",
                      "Concept B",
                      "Concept C"
                    ],
                    correct: 0,
                    explanation: "This covers the fundamental aspects of the topic."
                  },
                  prerequisites: [],
                  // Store the generated dynamic code as JSON string
                  generated_code: microModule.generated_code && typeof microModule.generated_code === 'object' ? JSON.stringify(microModule.generated_code) : microModule.generated_code || null
                });
                moduleCreationPromises.push(modulePromise);
                totalMicroModules++;
              }
            }
          }
        }
      }
      
      // Execute all module creations in parallel
      if (totalMicroModules > 0) {
        console.log(`⚡ Creating ${totalMicroModules} curriculum-aligned micro-modules...`);
        const moduleResults = await Promise.allSettled(moduleCreationPromises);
        const successfulModules = moduleResults.filter((result)=>result.status === 'fulfilled').length;
        const failedModules = moduleResults.filter((result)=>result.status === 'rejected').length;
        
        if (failedModules > 0) {
          console.warn(`⚠️ ${failedModules} modules failed to create, ${successfulModules} succeeded`);
          // Log details of failed modules
          moduleResults.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.error(`❌ Module ${index} failed:`, result.reason);
            }
          });
        } else {
          console.log(`✅ All ${successfulModules} modules created successfully`);
        }
      } else {
        console.warn('⚠️ No micro-modules to create');
      }
    } catch (moduleError) {
      console.error('❌ Error during module creation:', moduleError);
      // Don't throw - we still want to return the course even if modules fail
    }
    console.log(`🎉 RAG-Enhanced Curriculum Course created successfully: ${course.id}`);
    console.log(`📚 Curriculum alignment: ${curriculumData.subtopic ? 'Subtopic' : curriculumData.topic ? 'Topic' : 'Unit'} level`);
    const responseBody = {
      success: true,
      course: course,
      message: 'RAG-enhanced curriculum-aligned course generated successfully',
      curriculum_alignment: courseData.curriculum_alignment,
      stats: {
        rag_sources: curriculumData.relatedContent.length,
        curriculum_level: formData.generationLevel,
        modules_created: successfulModules,
        curriculum_aligned: true,
        generation_type: 'curriculum-rag'
      }
    };
    const responseInit = {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    };
    return new Response(JSON.stringify(responseBody), responseInit);
  } catch (error) {
    console.error('❌ RAG generation error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({
      success: false,
      error: message || 'An unexpected error occurred during RAG generation',
      details: String(error)
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
