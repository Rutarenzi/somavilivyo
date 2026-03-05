import { useState, useCallback } from 'react';
import { SecurityUtils } from '@/utils/securityUtils';
import { DataValidator } from '@/utils/dataValidation';
import { useToast } from '@/hooks/use-toast';

export interface SecurityValidationState {
  isValidating: boolean;
  hasSecurityIssues: boolean;
  validationErrors: string[];
  sanitizedData: any;
}

export const useSecurityValidation = () => {
  const [validationState, setValidationState] = useState<SecurityValidationState>({
    isValidating: false,
    hasSecurityIssues: false,
    validationErrors: [],
    sanitizedData: null
  });
  
  const { toast } = useToast();

  const validateAndSanitize = useCallback(async (data: any, type: 'course' | 'module' | 'general') => {
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    try {
      let validationResult;
      
      switch (type) {
        case 'course':
          validationResult = await DataValidator.validateCourseData(data);
          break;
        case 'module':
          validationResult = DataValidator.validateMicroModuleData(data);
          break;
        default:
          // General validation for other data types
          const sanitized = DataValidator.sanitizeUserInput(data);
          validationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            data: sanitized
          };
      }

      const hasSecurityIssues = !validationResult.isValid;
      
      setValidationState({
        isValidating: false,
        hasSecurityIssues,
        validationErrors: validationResult.errors,
        sanitizedData: validationResult.data
      });

      // Show warnings to user
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        validationResult.warnings.forEach(warning => {
          toast({
            title: "Validation Warning",
            description: warning,
            variant: "default"
          });
        });
      }

      // Show errors to user
      if (validationResult.errors && validationResult.errors.length > 0) {
        toast({
          title: "Validation Error",
          description: `${validationResult.errors.length} validation errors found`,
          variant: "destructive"
        });
      }

      return validationResult;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      
      setValidationState({
        isValidating: false,
        hasSecurityIssues: true,
        validationErrors: [errorMessage],
        sanitizedData: null
      });

      toast({
        title: "Validation Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return {
        isValid: false,
        errors: [errorMessage],
        warnings: [],
        data: null
      };
    }
  }, [toast]);

  const checkRateLimit = useCallback(async (action: string, limit: number = 10, windowMs: number = 60000) => {
    try {
      const userId = 'current-user'; // This should be replaced with actual user ID
      const rateLimitResult = await SecurityUtils.checkRateLimit(userId, action, limit, windowMs);
      
      if (!rateLimitResult.allowed) {
        toast({
          title: "Rate Limit Exceeded",
          description: `Too many ${action} attempts. Please wait before trying again.`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Fail open to not block legitimate users
    }
  }, [toast]);

  const validateFileUpload = useCallback((file: File) => {
    const validation = SecurityUtils.validateFileUpload(file);
    
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast({
          title: "File Upload Error",
          description: error,
          variant: "destructive"
        });
      });
    }
    
    return validation;
  }, [toast]);

  const reset = useCallback(() => {
    setValidationState({
      isValidating: false,
      hasSecurityIssues: false,
      validationErrors: [],
      sanitizedData: null
    });
  }, []);

  return {
    validationState,
    validateAndSanitize,
    checkRateLimit,
    validateFileUpload,
    reset
  };
};