
export interface ParsedContent {
  title: string;
  overview: string;
  sections: ContentSection[];
  keyPoints: string[];
  learningObjective: string;
}

export interface ContentSection {
  type: 'heading' | 'paragraph' | 'list' | 'highlight' | 'code';
  content: string;
  level?: number;
  items?: string[];
}

export const parseHTMLContent = (htmlContent: string, fallbackTitle?: string): ParsedContent => {
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Extract title from first heading or use fallback
  let title = fallbackTitle || 'Learning Module';
  const firstHeading = tempDiv.querySelector('h1, h2, h3, h4, h5, h6');
  if (firstHeading) {
    title = firstHeading.textContent?.trim() || title;
  } else {
    // Try to extract title from bold text in first paragraph
    const firstBold = tempDiv.querySelector('b, strong');
    if (firstBold && firstBold.textContent && firstBold.textContent.length < 100) {
      title = firstBold.textContent.trim();
    }
  }

  // Extract overview from first paragraph(s)
  let overview = '';
  const firstParagraph = tempDiv.querySelector('p');
  if (firstParagraph) {
    overview = firstParagraph.textContent?.trim() || '';
    // If overview is too short, combine with second paragraph
    if (overview.length < 100) {
      const secondParagraph = firstParagraph.nextElementSibling;
      if (secondParagraph && secondParagraph.tagName === 'P') {
        overview += ' ' + (secondParagraph.textContent?.trim() || '');
      }
    }
    // Limit overview length
    if (overview.length > 200) {
      overview = overview.substring(0, 200) + '...';
    }
  }

  // Extract learning objective
  let learningObjective = '';
  const allText = tempDiv.textContent || '';
  
  // Look for learning objective patterns
  const objectivePatterns = [
    /learning objective[s]?:?\s*([^.!?]*[.!?])/i,
    /objective[s]?:?\s*([^.!?]*[.!?])/i,
    /you will learn:?\s*([^.!?]*[.!?])/i,
    /by the end[^.!?]*you will[^.!?]*([^.!?]*[.!?])/i
  ];

  for (const pattern of objectivePatterns) {
    const match = allText.match(pattern);
    if (match && match[1]) {
      learningObjective = match[1].trim();
      break;
    }
  }

  if (!learningObjective && overview) {
    learningObjective = `Understand ${title.toLowerCase()} concepts and their practical applications.`;
  }

  // Parse content sections
  const sections: ContentSection[] = [];
  const keyPoints: string[] = [];

  const processElement = (element: Element, level = 1) => {
    switch (element.tagName.toLowerCase()) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        sections.push({
          type: 'heading',
          content: element.textContent?.trim() || '',
          level: parseInt(element.tagName.charAt(1))
        });
        break;

      case 'p':
        const content = element.textContent?.trim() || '';
        if (content) {
          sections.push({
            type: 'paragraph',
            content
          });
        }
        break;

      case 'ul':
      case 'ol':
        const items: string[] = [];
        const listItems = element.querySelectorAll('li');
        listItems.forEach(li => {
          const itemText = li.textContent?.trim();
          if (itemText) {
            items.push(itemText);
            // Add to key points if it looks important
            if (itemText.includes(':') || itemText.length > 20) {
              keyPoints.push(itemText);
            }
          }
        });
        
        if (items.length > 0) {
          sections.push({
            type: 'list',
            content: element.previousElementSibling?.textContent?.includes(':') 
              ? element.previousElementSibling.textContent.trim() 
              : 'Key Points:',
            items
          });
        }
        break;

      case 'code':
      case 'pre':
        sections.push({
          type: 'code',
          content: element.textContent?.trim() || ''
        });
        break;
    }
  };

  // Process all child elements
  Array.from(tempDiv.children).forEach(child => processElement(child));

  // If no sections were found, create basic paragraph sections
  if (sections.length === 0 && htmlContent) {
    const textContent = tempDiv.textContent?.trim() || '';
    if (textContent) {
      const paragraphs = textContent.split('\n\n').filter(p => p.trim());
      paragraphs.forEach(paragraph => {
        sections.push({
          type: 'paragraph',
          content: paragraph.trim()
        });
      });
    }
  }

  return {
    title,
    overview,
    sections,
    keyPoints: keyPoints.slice(0, 5), // Limit to top 5 key points
    learningObjective
  };
};

export const extractTopicThemes = (modules: any[]): string[] => {
  const themes = new Set<string>();
  
  modules.forEach(module => {
    const parsed = parseHTMLContent(module.content, module.title);
    
    // Extract themes from key concepts
    parsed.keyPoints.forEach(point => {
      const words = point.toLowerCase().split(/[:\-\s]+/);
      words.forEach(word => {
        if (word.length > 4 && !commonWords.includes(word)) {
          themes.add(word.charAt(0).toUpperCase() + word.slice(1));
        }
      });
    });
    
    // Extract from title
    const titleWords = parsed.title.toLowerCase().split(/\s+/);
    titleWords.forEach(word => {
      if (word.length > 4 && !commonWords.includes(word)) {
        themes.add(word.charAt(0).toUpperCase() + word.slice(1));
      }
    });
  });
  
  return Array.from(themes).slice(0, 3);
};

const commonWords = [
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 
  'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
  'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy',
  'did', 'way', 'who', 'oil', 'sit', 'set', 'run', 'eat', 'far', 'sea',
  'own', 'say', 'she', 'too', 'use', 'her', 'many', 'some', 'time', 'very',
  'when', 'much', 'take', 'them', 'well', 'were', 'here', 'life', 'just',
  'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'they',
  'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good', 'much',
  'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long',
  'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'
];
