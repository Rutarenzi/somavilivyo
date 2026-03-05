
export interface ParsedContent {
  sections: ContentSection[];
  keyPoints: string[];
  codeExamples: string[];
}

export interface ContentSection {
  type: 'heading' | 'paragraph' | 'list' | 'highlight' | 'code';
  content: string;
  items?: string[];
}

export const parseAndFormatContent = (htmlContent: string): ParsedContent => {
  // Strip HTML tags but preserve structure
  const strippedContent = htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sections: ContentSection[] = [];
  const keyPoints: string[] = [];
  const codeExamples: string[] = [];

  // Split content into meaningful chunks
  const paragraphs = strippedContent.split(/\n\s*\n|\.\s+(?=[A-Z])/);

  paragraphs.forEach((paragraph, index) => {
    const cleanPara = paragraph.trim();
    if (!cleanPara) return;

    // Detect headings (sentences ending with colons or starting with numbers)
    if (cleanPara.endsWith(':') || /^\d+\./.test(cleanPara)) {
      sections.push({
        type: 'heading',
        content: cleanPara.replace(/^#+\s*/, '')
      });
    }
    // Detect code-like content
    else if (cleanPara.includes('()') || cleanPara.includes('{}') || cleanPara.includes('[]')) {
      codeExamples.push(cleanPara);
      sections.push({
        type: 'code',
        content: cleanPara
      });
    }
    // Detect lists (content with multiple sentences)
    else if (cleanPara.includes('.') && cleanPara.split('.').length > 3) {
      const items = cleanPara.split(/\.\s+/).filter(item => item.trim());
      sections.push({
        type: 'list',
        content: 'Key Learning Points:',
        items: items.map(item => item.trim())
      });
      keyPoints.push(...items.filter(item => item.length > 10));
    }
    // Important concepts (short, impactful sentences)
    else if (cleanPara.length < 100 && cleanPara.length > 20) {
      sections.push({
        type: 'highlight',
        content: cleanPara
      });
      keyPoints.push(cleanPara);
    }
    // Regular paragraphs
    else {
      sections.push({
        type: 'paragraph',
        content: cleanPara
      });
    }
  });

  return { sections, keyPoints, codeExamples };
};

export const extractQuizInfo = (quizData: any) => {
  if (!quizData || !quizData.question) return null;
  
  return {
    question: quizData.question,
    options: quizData.options || [],
    correct: quizData.correct || 0,
    explanation: quizData.explanation || ''
  };
};
