
export interface PhasedGenerationState {
  sessionId: string | null;
  formData: any | null;
  phaseData: any | null;
  isActive: boolean;
  currentPhase: string;
  progress: number;
  error: string | null;
  completedPhases: string[];
  totalPhases: number;
  generatedCourse: any | null; // Add the missing generatedCourse property
}

export interface ToastOptions {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export interface FinalizationResult {
  finalizedCourseData: any | null;
  finalizeEdgeError: any | null;
  stats: any | null;
}
