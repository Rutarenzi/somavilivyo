// Web Worker for content parsing to avoid blocking main thread
interface ParsedContent {
  title: string;
  overview: string;
  sections: ContentSection[];
  keyPoints: string[];
  learningObjective: string;
}

interface ContentSection {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'highlight';
  content: string;
  level?: number;
  items?: string[];
}

// Simulated Web Worker using setTimeout for non-blocking parsing
export const parseContentAsync = (htmlContent: string, fallbackTitle?: string): Promise<ParsedContent> => {
  return new Promise((resolve) => {
    // Use setTimeout to simulate Web Worker and avoid blocking main thread
    setTimeout(() => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // Extract title
      let title = tempDiv.querySelector('h1, h2, h3')?.textContent?.trim() || fallbackTitle || 'Module Content';
      
      // Extract overview (first paragraph)
      const firstParagraph = tempDiv.querySelector('p');
      const overview = firstParagraph?.textContent?.trim() || 'Interactive learning module covering essential concepts.';
      
      // Extract learning objective
      const objectiveElement = tempDiv.querySelector('[data-objective], .learning-objective');
      const learningObjective = objectiveElement?.textContent?.trim() || 'Master key concepts through practical application.';
      
      // Parse sections efficiently
      const sections: ContentSection[] = [];
      const elements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, pre, code, .highlight');
      
      elements.forEach(element => {
        const tagName = element.tagName.toLowerCase();
        const content = element.textContent?.trim() || '';
        
        if (!content) return;
        
        if (tagName.startsWith('h')) {
          sections.push({
            type: 'heading',
            content,
            level: parseInt(tagName.substring(1))
          });
        } else if (tagName === 'p') {
          sections.push({
            type: 'paragraph',
            content
          });
        } else if (tagName === 'ul' || tagName === 'ol') {
          const items = Array.from(element.querySelectorAll('li')).map(li => li.textContent?.trim() || '');
          sections.push({
            type: 'list',
            content: `${tagName === 'ul' ? 'Bullet' : 'Numbered'} list`,
            items: items.filter(item => item.length > 0)
          });
        } else if (tagName === 'pre' || tagName === 'code') {
          sections.push({
            type: 'code',
            content
          });
        } else if (element.classList.contains('highlight')) {
          sections.push({
            type: 'highlight',
            content
          });
        }
      });
      
      // Extract key points (from lists, highlighted text, or strong elements)
      const keyPoints: string[] = [];
      const strongElements = tempDiv.querySelectorAll('strong, b, .key-point');
      strongElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 10 && text.length < 100) {
          keyPoints.push(text);
        }
      });
      
      // If no strong elements, extract from list items
      if (keyPoints.length === 0) {
        const listItems = tempDiv.querySelectorAll('li');
        listItems.forEach(li => {
          const text = li.textContent?.trim();
          if (text && text.length > 15 && text.length < 150) {
            keyPoints.push(text);
          }
        });
      }
      
      resolve({
        title,
        overview,
        sections: sections.slice(0, 10), // Limit sections for performance
        keyPoints: keyPoints.slice(0, 5), // Limit key points
        learningObjective
      });
    }, 0);
  });
};

// Batch parsing for multiple content items
export const batchParseContent = async (contents: Array<{ html: string; title?: string }>): Promise<ParsedContent[]> => {
  const results: ParsedContent[] = [];
  
  // Process in chunks to avoid overwhelming the main thread
  const chunkSize = 3;
  for (let i = 0; i < contents.length; i += chunkSize) {
    const chunk = contents.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(({ html, title }) => parseContentAsync(html, title))
    );
    results.push(...chunkResults);
    
    // Allow other tasks to run between chunks
    if (i + chunkSize < contents.length) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  
  return results;
};