
// Route definitions for the application
export const routes = {
  home: '/',
  dashboard: '/dashboard',
  courses: '/courses',
  createCourse: '/create-course',
  courseView: (courseId: string) => `/courses/${courseId}`,
  courseLearning: (courseId: string) => `/courses/${courseId}/learn`,
  courseProgress: (courseId: string) => `/courses/${courseId}/progress`,
  courseEdit: (courseId: string) => `/courses/${courseId}/edit`,
  updateCourse: (courseId: string) => `/courses/${courseId}/update`,
  aiChat: '/ai-chat',
  questionLibrary: '/question-library',
  profile: '/profile',
  settings: '/settings',
  help: '/help-support',
  about: '/about',
  privacy: '/privacy-policy',
  waitlist: '/waitlist',
  curriculumAdmin: '/curriculum-admin'
} as const;
