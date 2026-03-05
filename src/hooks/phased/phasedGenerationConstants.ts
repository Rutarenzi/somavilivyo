
import type { PhasedGenerationState } from './types';

export const INITIAL_STATE: PhasedGenerationState = {
  sessionId: null,
  formData: null,
  phaseData: null,
  isActive: false,
  currentPhase: 'Ready to begin',
  progress: 0,
  error: null,
  completedPhases: [],
  totalPhases: 4,
  generatedCourse: null // Add the missing property
};

export const GENERATION_PHASES = [
  { name: 'structure', label: 'Course Structure' },
  { name: 'content', label: 'Content Generation' },
  { name: 'quality', label: 'Quality Enhancement' },
  { name: 'finalization', label: 'Course Finalization' }
] as const;

export const PHASE_PROGRESS_MAP = {
  'structure': 25,
  'content': 50,
  'quality': 75,
  'finalization': 100
} as const;
