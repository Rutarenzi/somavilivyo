import { supabase } from '@/integrations/supabase/client';

export interface ContentQualityMetrics {
  qualityScore: number;
  contentLength: number;
  hasIntroduction: boolean;
  hasExamples: boolean;
  hasMainContent: boolean;
  hasSummary: boolean;
  hasQuiz: boolean;
  contentDiversityScore: number;
  structuralCompleteness: number;
  validationStatus: 'pending' | 'passed' | 'needs_improvement';
  needsEnhancement: boolean;
  enhancementSuggestions: string[];
}

export interface ContentQualityResult {
  metrics: ContentQualityMetrics;
  feedback: string[];
  improvements: string[];
}

export class ContentQualityValidator {
  private static readonly MIN_CONTENT_LENGTH = 200;
  private static readonly MIN_QUALITY_SCORE = 70;
  
  static async validateContent(
    content: string, 
    title: string, 
    quiz?: any,
    moduleId?: string,
    courseId?: string
  ): Promise<ContentQualityResult> {
    const metrics = this.calculateMetrics(content, title, quiz);
    const feedback = this.generateFeedback(metrics);
    const improvements = this.generateImprovements(metrics);
    
    // Store metrics in database if IDs provided
    if (moduleId && courseId) {
      await this.storeQualityMetrics(moduleId, courseId, metrics);
    }
    
    return { metrics, feedback, improvements };
  }

  private static calculateMetrics(content: string, title: string, quiz?: any): ContentQualityMetrics {
    const cleanContent = this.stripHTML(content);
    const contentLength = cleanContent.length;
    
    // Content structure analysis
    const hasIntroduction = this.hasIntroductionSection(cleanContent);
    const hasExamples = this.hasExamplesSection(cleanContent);
    const hasMainContent = contentLength >= this.MIN_CONTENT_LENGTH;
    const hasSummary = this.hasSummarySection(cleanContent);
    const hasQuiz = quiz && quiz.question && quiz.options?.length > 1;
    
    // Calculate diversity score based on content variety
    const contentDiversityScore = this.calculateContentDiversity(cleanContent);
    
    // Calculate structural completeness
    const structuralCompleteness = this.calculateStructuralCompleteness({
      hasIntroduction,
      hasExamples,
      hasMainContent,
      hasSummary,
      hasQuiz
    });
    
    // Calculate overall quality score
    const qualityScore = this.calculateOverallQuality({
      contentLength,
      hasIntroduction,
      hasExamples,
      hasMainContent,
      hasSummary,
      hasQuiz,
      contentDiversityScore,
      structuralCompleteness
    });
    
    const validationStatus = qualityScore >= 85 ? 'passed' : 
                           qualityScore >= 60 ? 'needs_improvement' : 'pending';
    
    const needsEnhancement = qualityScore < this.MIN_QUALITY_SCORE;
    
    const enhancementSuggestions = this.generateEnhancementSuggestions({
      contentLength,
      hasIntroduction,
      hasExamples,
      hasMainContent,
      hasSummary,
      hasQuiz,
      qualityScore
    });
    
    return {
      qualityScore: Math.round(qualityScore),
      contentLength,
      hasIntroduction,
      hasExamples,
      hasMainContent,
      hasSummary,
      hasQuiz,
      contentDiversityScore: Math.round(contentDiversityScore),
      structuralCompleteness: Math.round(structuralCompleteness),
      validationStatus,
      needsEnhancement,
      enhancementSuggestions
    };
  }

  private static stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private static hasIntroductionSection(content: string): boolean {
    const introPatterns = [
      /^.{0,200}(introduction|overview|welcome|let's start|in this)/i,
      /^.{0,100}(learn about|explore|understand|discover)/i
    ];
    return introPatterns.some(pattern => pattern.test(content));
  }

  private static hasExamplesSection(content: string): boolean {
    const examplePatterns = [
      /example[s]?[:]/i,
      /for instance/i,
      /consider/i,
      /let's look at/i,
      /imagine/i,
      /\d+\.\s/g // Numbered examples
    ];
    return examplePatterns.some(pattern => pattern.test(content));
  }

  private static hasSummarySection(content: string): boolean {
    const summaryPatterns = [
      /(summary|conclusion|key points|in summary|to summarize)/i,
      /(remember|important|takeaway)/i
    ];
    return summaryPatterns.some(pattern => pattern.test(content.slice(-500))); // Check last 500 chars
  }

  private static calculateContentDiversity(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    // Count different content types
    let diversityFactors = 0;
    
    // Technical terms
    if (/\b[A-Z]{2,}\b/.test(content)) diversityFactors += 10; // Acronyms
    if (/\d+%|\$\d+|\d+\.\d+/.test(content)) diversityFactors += 10; // Numbers/stats
    if (/[(){}[\]]/.test(content)) diversityFactors += 10; // Code-like content
    if (content.includes(':') || content.includes(';')) diversityFactors += 5; // Lists/explanations
    
    // Sentence variety
    const shortSentences = sentences.filter(s => s.length < 80).length;
    const longSentences = sentences.filter(s => s.length > 120).length;
    const varietyScore = Math.min(20, (shortSentences + longSentences) / sentences.length * 40);
    
    diversityFactors += varietyScore;
    
    return Math.min(100, diversityFactors + (avgSentenceLength > 40 ? 10 : 0));
  }

  private static calculateStructuralCompleteness(structure: {
    hasIntroduction: boolean;
    hasExamples: boolean;
    hasMainContent: boolean;
    hasSummary: boolean;
    hasQuiz: boolean;
  }): number {
    const weights = {
      hasIntroduction: 15,
      hasMainContent: 30,
      hasExamples: 20,
      hasSummary: 15,
      hasQuiz: 20
    };
    
    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      if (structure[key as keyof typeof structure]) {
        score += weight;
      }
    });
    
    return score;
  }

  private static calculateOverallQuality(params: {
    contentLength: number;
    hasIntroduction: boolean;
    hasExamples: boolean;
    hasMainContent: boolean;
    hasSummary: boolean;
    hasQuiz: boolean;
    contentDiversityScore: number;
    structuralCompleteness: number;
  }): number {
    const {
      contentLength,
      contentDiversityScore,
      structuralCompleteness
    } = params;
    
    // Base score from structure
    let qualityScore = structuralCompleteness * 0.4;
    
    // Content length bonus/penalty
    const lengthScore = Math.min(30, (contentLength / this.MIN_CONTENT_LENGTH) * 30);
    qualityScore += lengthScore;
    
    // Diversity bonus
    qualityScore += (contentDiversityScore / 100) * 30;
    
    return Math.min(100, Math.max(0, qualityScore));
  }

  private static generateEnhancementSuggestions(params: {
    contentLength: number;
    hasIntroduction: boolean;
    hasExamples: boolean;
    hasMainContent: boolean;
    hasSummary: boolean;
    hasQuiz: boolean;
    qualityScore: number;
  }): string[] {
    const suggestions: string[] = [];
    
    if (params.contentLength < this.MIN_CONTENT_LENGTH) {
      suggestions.push("Expand content to provide more comprehensive coverage");
    }
    
    if (!params.hasIntroduction) {
      suggestions.push("Add an engaging introduction to set context");
    }
    
    if (!params.hasExamples) {
      suggestions.push("Include practical examples to illustrate concepts");
    }
    
    if (!params.hasSummary) {
      suggestions.push("Add a summary section to reinforce key points");
    }
    
    if (!params.hasQuiz) {
      suggestions.push("Create an assessment quiz to test understanding");
    }
    
    if (params.qualityScore < 50) {
      suggestions.push("Content needs significant improvement in structure and depth");
    }
    
    return suggestions;
  }

  private static generateFeedback(metrics: ContentQualityMetrics): string[] {
    const feedback: string[] = [];
    
    if (metrics.qualityScore >= 85) {
      feedback.push("✅ Excellent content quality - well-structured and comprehensive");
    } else if (metrics.qualityScore >= 70) {
      feedback.push("✅ Good content quality with room for minor improvements");
    } else if (metrics.qualityScore >= 50) {
      feedback.push("⚠️ Content quality needs improvement");
    } else {
      feedback.push("❌ Content quality is below standards");
    }
    
    if (metrics.contentLength < this.MIN_CONTENT_LENGTH) {
      feedback.push(`📏 Content is too short (${metrics.contentLength} chars, minimum ${this.MIN_CONTENT_LENGTH})`);
    }
    
    if (metrics.structuralCompleteness < 60) {
      feedback.push("🏗️ Content structure is incomplete - missing key sections");
    }
    
    return feedback;
  }

  private static generateImprovements(metrics: ContentQualityMetrics): string[] {
    const improvements: string[] = [];
    
    if (!metrics.hasIntroduction) {
      improvements.push("Add clear introduction explaining the topic");
    }
    
    if (!metrics.hasExamples) {
      improvements.push("Include concrete examples and use cases");
    }
    
    if (metrics.contentDiversityScore < 50) {
      improvements.push("Vary sentence structure and include different content types");
    }
    
    if (!metrics.hasQuiz && metrics.hasMainContent) {
      improvements.push("Create assessment questions to test comprehension");
    }
    
    return improvements;
  }

  private static async storeQualityMetrics(
    moduleId: string,
    courseId: string,
    metrics: ContentQualityMetrics
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('module_quality_metrics')
        .upsert({
          module_id: moduleId,
          course_id: courseId,
          quality_score: metrics.qualityScore,
          content_length: metrics.contentLength,
          validation_status: metrics.validationStatus,
          has_introduction: metrics.hasIntroduction,
          has_examples: metrics.hasExamples,
          has_main_content: metrics.hasMainContent,
          has_summary: metrics.hasSummary,
          has_quiz: metrics.hasQuiz,
          content_diversity_score: metrics.contentDiversityScore,
          structural_completeness: metrics.structuralCompleteness,
          needs_enhancement: metrics.needsEnhancement,
          last_validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to store quality metrics:', error);
      }
    } catch (error) {
      console.error('Error storing quality metrics:', error);
    }
  }

  static async validateCourseContent(courseId: string): Promise<{
    overallScore: number;
    moduleCount: number;
    qualifiedModules: number;
    improvements: string[];
  }> {
    try {
      const { data: metrics, error } = await supabase
        .from('module_quality_metrics')
        .select('*')
        .eq('course_id', courseId);

      if (error || !metrics) {
        return { overallScore: 0, moduleCount: 0, qualifiedModules: 0, improvements: [] };
      }

      const moduleCount = metrics.length;
      const qualifiedModules = metrics.filter(m => m.quality_score >= this.MIN_QUALITY_SCORE).length;
      const overallScore = metrics.reduce((sum, m) => sum + m.quality_score, 0) / moduleCount;

      const improvements = [
        ...new Set(
          metrics
            .filter(m => m.needs_enhancement)
            .flatMap(() => [
              "Some modules need content expansion",
              "Consider adding more examples and use cases",
              "Improve quiz quality for better assessment"
            ])
        )
      ];

      return { overallScore, moduleCount, qualifiedModules, improvements };
    } catch (error) {
      console.error('Error validating course content:', error);
      return { overallScore: 0, moduleCount: 0, qualifiedModules: 0, improvements: [] };
    }
  }
}