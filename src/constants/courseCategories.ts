
// CBC (Competency-Based Curriculum) Subject Groupings for Kenya
export const COURSE_CATEGORIES = [
  // Core Subjects
  { value: 'Languages', label: 'Languages', icon: '🗣️' },
  { value: 'Mathematics', label: 'Mathematics', icon: '📐' },
  { value: 'Environment', label: 'Environmental Activities', icon: '🌱' },
  { value: 'Hygiene', label: 'Hygiene & Nutrition', icon: '🧼' },
  { value: 'Religious', label: 'Religious Education', icon: '🙏' },
  
  // Sciences
  { value: 'Science', label: 'Science & Technology', icon: '🔬' },
  { value: 'Agriculture', label: 'Agriculture', icon: '🌾' },
  { value: 'Health', label: 'Health Education', icon: '⚕️' },
  
  // Arts & Social Studies
  { value: 'Arts', label: 'Creative Arts', icon: '🎨' },
  { value: 'Music', label: 'Music', icon: '🎵' },
  { value: 'Social Studies', label: 'Social Studies', icon: '👥' },
  { value: 'History', label: 'History & Government', icon: '📜' },
  { value: 'Geography', label: 'Geography', icon: '🗺️' },
  { value: 'Literature', label: 'Literature', icon: '📖' },
  
  // Physical & Technical
  { value: 'Sports', label: 'Physical & Health Education', icon: '⚽' },
  { value: 'Technology', label: 'Technology & Engineering', icon: '💻' },
  { value: 'Engineering', label: 'Engineering', icon: '⚙️' },
  
  // Life Skills & Career
  { value: 'Business', label: 'Business Studies', icon: '💼' },
  { value: 'Finance', label: 'Financial Literacy', icon: '💰' },
  { value: 'Life Skills', label: 'Life Skills Education', icon: '🎯' },
  { value: 'Personal Development', label: 'Personal Development', icon: '🌟' },
  { value: 'Career', label: 'Career & Technical Education', icon: '🛠️' },
  
  // Additional
  { value: 'General', label: 'General Studies', icon: '📚' },
  { value: 'Psychology', label: 'Psychology', icon: '🧠' }
] as const;

export type CourseCategory = typeof COURSE_CATEGORIES[number]['value'];

// Helper function to get category details
export const getCategoryDetails = (categoryValue: string) => {
  return COURSE_CATEGORIES.find(cat => cat.value === categoryValue) || COURSE_CATEGORIES[0];
};
