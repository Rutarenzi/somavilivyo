import { supabase } from '@/integrations/supabase/client';
import { SecurityUtils } from './securityUtils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: any;
}

export interface DataIntegrityIssue {
  table_name: string;
  issue_type: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export class DataValidator {
  
  // Validate course data before saving
  static async validateCourseData(courseData: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    const basicValidation = SecurityUtils.validateCourseData(courseData);
    if (!basicValidation.isValid) {
      errors.push(...basicValidation.errors);
    }

    // Advanced validation
    if (courseData.topics && Array.isArray(courseData.topics)) {
      if (courseData.topics.length === 0) {
        warnings.push('Course has no topics defined');
      }
      
      courseData.topics.forEach((topic: any, index: number) => {
        if (!topic.title || topic.title.trim().length === 0) {
          errors.push(`Topic ${index + 1} is missing a title`);
        }
        if (!topic.subtopics || !Array.isArray(topic.subtopics)) {
          warnings.push(`Topic ${index + 1} has no subtopics defined`);
        }
      });
    }

    // Check for duplicate titles in user's courses
    if (courseData.title) {
      try {
        const { data: existingCourses } = await supabase
          .from('courses')
          .select('id, title')
          .eq('user_id', courseData.user_id)
          .ilike('title', courseData.title);

        if (existingCourses && existingCourses.length > 0) {
          warnings.push('A course with similar title already exists');
        }
      } catch (error) {
        warnings.push('Could not check for duplicate course titles');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data: courseData
    };
  }

  // Validate micro module data
  static validateMicroModuleData(moduleData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!moduleData.title || moduleData.title.trim().length === 0) {
      errors.push('Module title is required');
    }

    if (!moduleData.content || moduleData.content.trim().length < 50) {
      errors.push('Module content must be at least 50 characters');
    }

    if (!moduleData.learning_objective || moduleData.learning_objective.trim().length === 0) {
      errors.push('Learning objective is required');
    }

    if (moduleData.topic_index < 0 || moduleData.subtopic_index < 0 || moduleData.module_index < 0) {
      errors.push('Invalid topic, subtopic, or module index');
    }

    if (!moduleData.estimated_duration_minutes || moduleData.estimated_duration_minutes < 1) {
      warnings.push('Estimated duration should be at least 1 minute');
    }

    // Validate quiz data if present
    if (moduleData.quick_quiz) {
      try {
        const quiz = typeof moduleData.quick_quiz === 'string' 
          ? JSON.parse(moduleData.quick_quiz) 
          : moduleData.quick_quiz;
        
        if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
          warnings.push('Quiz should have at least one question');
        }
      } catch (error) {
        errors.push('Invalid quiz data format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data: moduleData
    };
  }

  // Check data integrity across the database
  static async checkDataIntegrity(): Promise<DataIntegrityIssue[]> {
    const issues: DataIntegrityIssue[] = [];

    try {
      // Check for orphaned user progress records
      const { data: orphanedProgress } = await supabase
        .from('user_micro_progress')
        .select('micro_module_id')
        .not('micro_module_id', 'in', 
          supabase.from('micro_modules').select('id')
        );

      if (orphanedProgress && orphanedProgress.length > 0) {
        issues.push({
          table_name: 'user_micro_progress',
          issue_type: 'orphaned_records',
          count: orphanedProgress.length,
          severity: 'high'
        });
      }

      // Check for courses without modules
      const { data: coursesWithoutModules } = await supabase
        .from('courses')
        .select('id, title')
        .not('id', 'in', 
          supabase.from('micro_modules').select('course_id')
        );

      if (coursesWithoutModules && coursesWithoutModules.length > 0) {
        issues.push({
          table_name: 'courses',
          issue_type: 'courses_without_modules',
          count: coursesWithoutModules.length,
          severity: 'medium'
        });
      }

      // Check for invalid quiz scores
      const { data: invalidScores } = await supabase
        .from('user_micro_progress')
        .select('id, quiz_score')
        .or('quiz_score.lt.0,quiz_score.gt.100');

      if (invalidScores && invalidScores.length > 0) {
        issues.push({
          table_name: 'user_micro_progress',
          issue_type: 'invalid_quiz_scores',
          count: invalidScores.length,
          severity: 'medium'
        });
      }

    } catch (error) {
      console.error('Error checking data integrity:', error);
      issues.push({
        table_name: 'system',
        issue_type: 'integrity_check_failed',
        count: 1,
        severity: 'critical'
      });
    }

    return issues;
  }

  // Clean up orphaned records
  static async cleanupOrphanedRecords(): Promise<{ cleaned: number; errors: string[] }> {
    const errors: string[] = [];
    let cleaned = 0;

    try {
      // Call the database function to clean up orphaned records
      const { data, error } = await supabase.rpc('cleanup_orphaned_records');
      
      if (error) {
        errors.push(`Database cleanup failed: ${error.message}`);
      } else {
        cleaned = data || 0;
      }
    } catch (error) {
      errors.push(`Cleanup operation failed: ${error}`);
    }

    return { cleaned, errors };
  }

  // Validate user input before database operations
  static sanitizeUserInput(input: any): any {
    if (typeof input === 'string') {
      return SecurityUtils.sanitizeHtml(input).sanitized;
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = Array.isArray(input) ? [] : {};
      
      for (const key in input) {
        if (input.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeUserInput(input[key]);
        }
      }
      
      return sanitized;
    }
    
    return input;
  }
}