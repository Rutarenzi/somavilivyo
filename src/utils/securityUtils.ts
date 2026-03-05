import DOMPurify from 'dompurify';

export interface SecurityValidationResult {
  isValid: boolean;
  sanitized: string;
  issues: string[];
}

export class SecurityUtils {
  private static readonly MAX_CONTENT_LENGTH = 50000;
  private static readonly BLOCKED_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
  ];

  static sanitizeHtml(content: string): SecurityValidationResult {
    const issues: string[] = [];
    
    // Check content length
    if (content.length > this.MAX_CONTENT_LENGTH) {
      issues.push(`Content exceeds maximum length (${this.MAX_CONTENT_LENGTH} characters)`);
      content = content.substring(0, this.MAX_CONTENT_LENGTH);
    }

    // Check for blocked patterns
    this.BLOCKED_PATTERNS.forEach(pattern => {
      if (pattern.test(content)) {
        issues.push('Potentially unsafe content detected and removed');
      }
    });

    // Sanitize using DOMPurify
    const sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'object', 'iframe', 'embed', 'form', 'input'],
    });

    return {
      isValid: issues.length === 0,
      sanitized,
      issues
    };
  }

  static validateCourseData(courseData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!courseData.title || typeof courseData.title !== 'string') {
      errors.push('Course title is required and must be a string');
    }

    if (courseData.title && courseData.title.length > 200) {
      errors.push('Course title must be under 200 characters');
    }

    if (!courseData.description || typeof courseData.description !== 'string') {
      errors.push('Course description is required and must be a string');
    }

    if (courseData.description && courseData.description.length > 2000) {
      errors.push('Course description must be under 2000 characters');
    }

    // Validate skill area
    const validSkillAreas = ['programming', 'design', 'business', 'science', 'language', 'other'];
    if (!validSkillAreas.includes(courseData.skill_area)) {
      errors.push('Invalid skill area');
    }

    // Validate difficulty level
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(courseData.difficulty_level)) {
      errors.push('Invalid difficulty level');
    }

    return { isValid: errors.length === 0, errors };
  }

  static rateLimitKey(userId: string, action: string): string {
    return `rate_limit:${userId}:${action}`;
  }

  static async checkRateLimit(
    userId: string, 
    action: string, 
    limit: number, 
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = this.rateLimitKey(userId, action);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get from localStorage for client-side rate limiting
    const stored = localStorage.getItem(key);
    let attempts: number[] = stored ? JSON.parse(stored) : [];
    
    // Filter out old attempts
    attempts = attempts.filter(timestamp => timestamp > windowStart);
    
    if (attempts.length >= limit) {
      return { allowed: false, remaining: 0 };
    }
    
    // Add current attempt
    attempts.push(now);
    localStorage.setItem(key, JSON.stringify(attempts));
    
    return { allowed: true, remaining: limit - attempts.length };
  }

  static encodeForUrl(value: string): string {
    return encodeURIComponent(value).replace(/[!'()*]/g, (c) => {
      return '%' + c.charCodeAt(0).toString(16);
    });
  }

  static validateFileUpload(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    if (file.size > maxSize) {
      errors.push('File size must be under 10MB');
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed. Only images and PDFs are permitted');
    }

    // Check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const typeExtensionMap: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'application/pdf': ['pdf']
    };

    const expectedExtensions = typeExtensionMap[file.type] || [];
    if (extension && !expectedExtensions.includes(extension)) {
      errors.push('File extension does not match file type');
    }

    return { isValid: errors.length === 0, errors };
  }
}