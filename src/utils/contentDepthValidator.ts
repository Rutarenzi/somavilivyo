// Content Depth Validator - Ensures generated content is rich and knowledge-focused, not summary-based

export interface ContentDepthMetrics {
  wordCount: number;
  hasStepByStepInstructions: boolean;
  hasWorkedExamples: boolean;
  hasPracticalApplications: boolean;
  hasExpertInsights: boolean;
  hasCaseStudy: boolean;
  hasImplementationDetails: boolean;
  hasTroubleshootingGuidance: boolean;
  depthScore: number;
  isRichContent: boolean;
  feedback: string[];
}

export interface ContentDepthResult {
  isValid: boolean;
  metrics: ContentDepthMetrics;
  recommendations: string[];
  score: number;
}

export class ContentDepthValidator {
  
  /**
   * Validates that content is rich, knowledge-focused, and suitable for learning
   * rather than being summary-based or superficial
   */
  static validateContentDepth(content: string, title: string): ContentDepthResult {
    const metrics = this.calculateDepthMetrics(content);
    const score = this.calculateDepthScore(metrics);
    const isValid = score >= 70; // Minimum 70% for rich content
    const recommendations = this.generateRecommendations(metrics);
    
    return {
      isValid,
      metrics,
      recommendations,
      score
    };
  }

  private static calculateDepthMetrics(content: string): ContentDepthMetrics {
    const cleanContent = this.stripHTML(content).toLowerCase();
    const wordCount = cleanContent.split(/\s+/).filter(word => word.length > 0).length;
    
    // Check for step-by-step instructions
    const hasStepByStepInstructions = this.hasStepByStepContent(cleanContent);
    
    // Check for worked examples
    const hasWorkedExamples = this.hasWorkedExamples(cleanContent);
    
    // Check for practical applications
    const hasPracticalApplications = this.hasPracticalApplications(cleanContent);
    
    // Check for expert insights
    const hasExpertInsights = this.hasExpertInsights(cleanContent);
    
    // Check for case studies
    const hasCaseStudy = this.hasCaseStudy(cleanContent);
    
    // Check for implementation details
    const hasImplementationDetails = this.hasImplementationDetails(cleanContent);
    
    // Check for troubleshooting guidance
    const hasTroubleshootingGuidance = this.hasTroubleshootingGuidance(cleanContent);
    
    const depthScore = this.calculateDepthScore({
      wordCount,
      hasStepByStepInstructions,
      hasWorkedExamples,
      hasPracticalApplications,
      hasExpertInsights,
      hasCaseStudy,
      hasImplementationDetails,
      hasTroubleshootingGuidance
    } as ContentDepthMetrics);
    
    const isRichContent = depthScore >= 70 && wordCount >= 600;
    const feedback = this.generateFeedback({
      wordCount,
      hasStepByStepInstructions,
      hasWorkedExamples,
      hasPracticalApplications,
      hasExpertInsights,
      hasCaseStudy,
      hasImplementationDetails,
      hasTroubleshootingGuidance,
      depthScore,
      isRichContent
    } as ContentDepthMetrics);
    
    return {
      wordCount,
      hasStepByStepInstructions,
      hasWorkedExamples,
      hasPracticalApplications,
      hasExpertInsights,
      hasCaseStudy,
      hasImplementationDetails,
      hasTroubleshootingGuidance,
      depthScore,
      isRichContent,
      feedback
    };
  }

  private static stripHTML(content: string): string {
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private static hasStepByStepContent(content: string): boolean {
    const stepPatterns = [
      /step\s*\d+/i,
      /first[,\s].*second[,\s].*third/i,
      /procedure[s]?\s*[:]\s*\d+/i,
      /follow\s*these\s*steps/i,
      /process\s*[:]\s*\d+/i,
      /methodology[:]?\s*\d+/i,
      /instruction[s]?\s*[:]\s*\d+/i
    ];
    return stepPatterns.some(pattern => pattern.test(content));
  }

  private static hasWorkedExamples(content: string): boolean {
    const examplePatterns = [
      /example\s*\d+[:]\s*.{50,}/i,
      /let['']?s\s*consider\s*a\s*case/i,
      /for\s*instance[,]\s*.{50,}/i,
      /worked\s*example/i,
      /case\s*study\s*[:]\s*.{50,}/i,
      /real[- ]world\s*example/i,
      /demonstration\s*[:]\s*.{50,}/i
    ];
    return examplePatterns.some(pattern => pattern.test(content));
  }

  private static hasPracticalApplications(content: string): boolean {
    const applicationPatterns = [
      /practical\s*application/i,
      /how\s*to\s*implement/i,
      /in\s*practice[,]\s*/i,
      /real[- ]world\s*use/i,
      /implementation\s*guide/i,
      /apply\s*this\s*by/i,
      /use\s*this\s*to/i,
      /practical\s*steps/i
    ];
    return applicationPatterns.some(pattern => pattern.test(content));
  }

  private static hasExpertInsights(content: string): boolean {
    const expertPatterns = [
      /expert\s*tip[s]?/i,
      /professional\s*insight/i,
      /best\s*practice[s]?/i,
      /industry\s*standard/i,
      /advanced\s*technique/i,
      /pro\s*tip/i,
      /optimization\s*strategy/i,
      /expert\s*advice/i
    ];
    return expertPatterns.some(pattern => pattern.test(content));
  }

  private static hasCaseStudy(content: string): boolean {
    const caseStudyPatterns = [
      /case\s*study/i,
      /real[- ]world\s*scenario/i,
      /company\s*example/i,
      /success\s*story/i,
      /business\s*case/i,
      /practical\s*scenario/i
    ];
    return caseStudyPatterns.some(pattern => pattern.test(content));
  }

  private static hasImplementationDetails(content: string): boolean {
    const implementationPatterns = [
      /implementation\s*detail[s]?/i,
      /specific\s*procedure[s]?/i,
      /technical\s*specification[s]?/i,
      /configuration\s*step[s]?/i,
      /setup\s*instruction[s]?/i,
      /deployment\s*guide/i,
      /installation\s*process/i
    ];
    return implementationPatterns.some(pattern => pattern.test(content));
  }

  private static hasTroubleshootingGuidance(content: string): boolean {
    const troubleshootingPatterns = [
      /troubleshooting/i,
      /common\s*issue[s]?/i,
      /problem[s]?\s*and\s*solution[s]?/i,
      /if\s*you\s*encounter/i,
      /debugging\s*tip[s]?/i,
      /error\s*handling/i,
      /what\s*if/i,
      /potential\s*problem[s]?/i
    ];
    return troubleshootingPatterns.some(pattern => pattern.test(content));
  }

  private static calculateDepthScore(metrics: Partial<ContentDepthMetrics>): number {
    let score = 0;
    
    // Word count scoring (0-25 points)
    if (metrics.wordCount! >= 1000) score += 25;
    else if (metrics.wordCount! >= 800) score += 20;
    else if (metrics.wordCount! >= 600) score += 15;
    else if (metrics.wordCount! >= 400) score += 10;
    else score += 5;
    
    // Content feature scoring (75 points total)
    if (metrics.hasStepByStepInstructions) score += 15;
    if (metrics.hasWorkedExamples) score += 15;
    if (metrics.hasPracticalApplications) score += 10;
    if (metrics.hasExpertInsights) score += 10;
    if (metrics.hasCaseStudy) score += 10;
    if (metrics.hasImplementationDetails) score += 10;
    if (metrics.hasTroubleshootingGuidance) score += 5;
    
    return Math.min(100, score);
  }

  private static generateFeedback(metrics: ContentDepthMetrics): string[] {
    const feedback: string[] = [];
    
    if (metrics.wordCount < 600) {
      feedback.push('Content is too brief for comprehensive learning. Aim for 600+ words.');
    }
    
    if (!metrics.hasStepByStepInstructions) {
      feedback.push('Add step-by-step instructions or procedures to improve clarity.');
    }
    
    if (!metrics.hasWorkedExamples) {
      feedback.push('Include detailed worked examples to demonstrate concepts.');
    }
    
    if (!metrics.hasPracticalApplications) {
      feedback.push('Add practical applications to show real-world relevance.');
    }
    
    if (!metrics.hasExpertInsights) {
      feedback.push('Include expert tips or professional insights for added value.');
    }
    
    if (!metrics.hasCaseStudy) {
      feedback.push('Consider adding a case study to illustrate concepts in context.');
    }
    
    if (!metrics.hasImplementationDetails) {
      feedback.push('Provide specific implementation details for practical use.');
    }
    
    if (metrics.depthScore < 70) {
      feedback.push('Content needs more depth and detail to facilitate learning.');
    }
    
    if (feedback.length === 0) {
      feedback.push('Content meets rich educational standards!');
    }
    
    return feedback;
  }

  private static generateRecommendations(metrics: ContentDepthMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.wordCount < 600) {
      recommendations.push('Expand content with detailed explanations, examples, and procedures');
    }
    
    if (!metrics.hasStepByStepInstructions) {
      recommendations.push('Add numbered steps or detailed procedures for complex processes');
    }
    
    if (!metrics.hasWorkedExamples) {
      recommendations.push('Include complete worked examples with step-by-step analysis');
    }
    
    if (!metrics.hasPracticalApplications) {
      recommendations.push('Add practical implementation guidance and real-world applications');
    }
    
    if (!metrics.hasExpertInsights) {
      recommendations.push('Include professional tips, best practices, and expert techniques');
    }
    
    if (metrics.depthScore < 70) {
      recommendations.push('Enhance content depth with comprehensive explanations and detailed analysis');
    }
    
    return recommendations;
  }

  /**
   * Quick validation to check if content is summary-based (should be rejected)
   */
  static isSummaryContent(content: string): boolean {
    const cleanContent = this.stripHTML(content).toLowerCase();
    const wordCount = cleanContent.split(/\s+/).length;
    
    // Summary indicators
    const summaryPatterns = [
      /this\s*covers/i,
      /this\s*introduces/i,
      /learn\s*about/i,
      /understanding\s*[a-zA-Z]+$/i,
      /overview\s*of/i,
      /introduction\s*to/i,
      /basics\s*of/i,
      /fundamental\s*concepts/i
    ];
    
    const hasSummaryPatterns = summaryPatterns.some(pattern => pattern.test(content));
    const isShort = wordCount < 400;
    const lacksDetail = !this.hasStepByStepContent(cleanContent) && 
                       !this.hasWorkedExamples(cleanContent) && 
                       !this.hasPracticalApplications(cleanContent);
    
    return hasSummaryPatterns || (isShort && lacksDetail);
  }
}