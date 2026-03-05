
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FloatingCard } from "@/components/ui/floating-card";
import { SkeletonLoader, SkeletonCardGrid } from "@/components/ui/skeleton-loader";
import { BookOpen, Clock, Target, Play, Plus, Brain, Star, TrendingUp, Users, Edit, Share2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useOptimizedCoursesEnhanced } from "@/hooks/useOptimizedCoursesEnhanced";
import { COURSE_CATEGORIES, getCategoryDetails } from "@/constants/courseCategories";
import { useState } from "react";
import { ShareCourseModal } from "@/components/course/ShareCourseModal";

export default function CoursesPage() {
  const { courses, loading, initialLoading, courseStats } = useOptimizedCoursesEnhanced();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; courseId: string; courseTitle: string }>({
    isOpen: false,
    courseId: '',
    courseTitle: ''
  });

  // Filter courses by category
  const filteredCourses = selectedCategory === 'All' 
    ? courses 
    : courses.filter(course => course.category === selectedCategory);

  // Get unique categories from courses
  const availableCategories = ['All', ...new Set(courses.map(course => course.category || 'General'))];

  const handleStartCourse = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleEditCourse = (courseId: string) => {
    navigate(`/courses/${courseId}/edit`);
  };

  const handleShareCourse = (courseId: string, courseTitle: string) => {
    setShareModal({ isOpen: true, courseId, courseTitle });
  };

  const closeShareModal = () => {
    setShareModal({ isOpen: false, courseId: '', courseTitle: '' });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 p-3 xs:p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6 xs:space-y-8">
          <FloatingCard variant="glass" className="p-4 xs:p-6 md:p-8 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-4">
                <SkeletonLoader variant="text" className="w-32 xs:w-48 h-6 xs:h-8" />
                <SkeletonLoader variant="text" className="w-48 xs:w-96 h-4 xs:h-6" />
              </div>
            </div>
          </FloatingCard>
          <SkeletonCardGrid count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 particles overflow-x-hidden">
      {/* Header - Mobile Optimized */}
      <header className="container mx-auto px-3 xs:px-4 md:px-6 py-4 xs:py-6 md:py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 xs:h-7 w-7 md:h-8 w-8 text-indigo-600 flex-shrink-0" />
            <h1 className="text-lg xs:text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SomaVilivyo
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 xs:px-4 md:px-6 pb-8 xs:pb-12 md:pb-16">
        {/* Welcome Header - Mobile First */}
        <FloatingCard variant="glass" className="p-4 xs:p-6 md:p-8 mb-6 xs:mb-8 shadow-large border border-white/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-3 mb-3 xs:mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 xs:w-3 xs:h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs xs:text-sm">
                    <BookOpen className="w-3 h-3 mr-1 flex-shrink-0" />
                    {courses.length} Active Courses
                  </Badge>
                </div>
              </div>
              <h1 className="text-2xl xs:text-3xl md:text-4xl lg:text-5xl font-jakarta font-bold text-gray-900 mb-2 xs:mb-3 leading-tight">
                My Learning Library
              </h1>
              <p className="text-base xs:text-lg md:text-xl text-gray-600 font-inter mb-4 xs:mb-6 leading-relaxed">
                Continue your personalized learning journey and master new skills with AI-powered education.
              </p>
              <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-4 md:space-x-6">
                <div className="flex items-center space-x-2 text-xs xs:text-sm text-gray-500">
                  <TrendingUp className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                  <span>{courses.filter(c => c.status === 'active').length} in progress</span>
                </div>
                <div className="flex items-center space-x-2 text-xs xs:text-sm text-gray-500">
                  <Star className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                  <span>{courses.filter(c => c.status === 'completed').length} completed</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block flex-shrink-0">
              <div className="w-24 h-24 xs:w-28 xs:h-28 md:w-32 md:h-32 gradient-primary rounded-2xl xs:rounded-3xl flex items-center justify-center shadow-glow relative overflow-hidden">
                <BookOpen className="h-12 w-12 xs:h-14 xs:w-14 md:h-16 md:w-16 text-white" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-gradient-shift"></div>
              </div>
            </div>
          </div>
        </FloatingCard>

        {courses.length === 0 ? (
          <FloatingCard className="text-center py-12 xs:py-16 md:py-20 glass bg-white/80 backdrop-blur-glass shadow-large border-white/50 rounded-2xl xs:rounded-3xl">
            <CardContent className="space-y-6 xs:space-y-8 px-4 xs:px-6">
              <div className="relative">
                <div className="w-24 h-24 xs:w-28 xs:h-28 md:w-32 md:h-32 gradient-tertiary rounded-full flex items-center justify-center mx-auto shadow-glow animate-float">
                  <BookOpen className="h-12 w-12 xs:h-14 xs:w-14 md:h-16 md:w-16 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 xs:-top-2 xs:-right-2 w-6 h-6 xs:w-8 xs:h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Plus className="h-3 w-3 xs:h-4 xs:w-4 text-white" />
                </div>
              </div>
              <div className="space-y-3 xs:space-y-4">
                <h3 className="text-xl xs:text-2xl md:text-3xl font-jakarta font-bold text-gray-800">Start Your Learning Adventure</h3>
                <p className="text-gray-600 text-sm xs:text-base md:text-lg leading-relaxed max-w-sm xs:max-w-md mx-auto font-inter">
                  Create your first personalized course and begin mastering new skills with our AI-powered learning platform.
                </p>
              </div>
              <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-glow text-sm xs:text-base">
                <Link to="/create-course">
                  <Plus className="h-4 w-4 xs:h-5 xs:w-5 mr-2" />
                  Create Your First Course
                </Link>
              </Button>
            </CardContent>
          </FloatingCard>
        ) : (
          <>
            {/* Category Filter and Quick Actions - Mobile Responsive */}
            <div className="flex flex-col space-y-4 mb-6 xs:mb-8">
              <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start space-y-3 xs:space-y-0 xs:space-x-4">
                <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-4">
                  <h2 className="text-xl xs:text-2xl font-jakarta font-bold text-gray-900">Course Collection</h2>
                  <Badge variant="secondary" className="bg-white/60 text-xs xs:text-sm w-fit">
                    {filteredCourses.length} courses
                  </Badge>
                </div>
                
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 xs:gap-4">
                  {/* Category Filter - Mobile Optimized */}
                  <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 flex-shrink-0">Filter:</span>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full xs:w-48 bg-white/60 text-sm">
                        <SelectValue>
                          {selectedCategory === 'All' ? (
                            '🗂️ All Categories'
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{getCategoryDetails(selectedCategory).icon}</span>
                              <span className="truncate">{getCategoryDetails(selectedCategory).label}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">🗂️ All Categories</SelectItem>
                        {availableCategories.filter(cat => cat !== 'All').map((category) => {
                          const details = getCategoryDetails(category);
                          return (
                            <SelectItem key={category} value={category}>
                              <div className="flex items-center gap-2">
                                <span>{details.icon}</span>
                                <span>{details.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-sm xs:text-base">
                    <Link to="/create-course">
                      <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="hidden xs:inline">Add New Course</span>
                      <span className="xs:hidden">Add Course</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Course Grid - Fully Responsive */}
            <div className="grid gap-4 xs:gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course, index) => {
                const categoryDetails = getCategoryDetails(course.category || 'General');
                return (
                  <FloatingCard 
                    key={course.id}
                    variant="glass" 
                    className="shadow-large border-white/50 rounded-xl xs:rounded-2xl overflow-hidden group cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader className="pb-3 xs:pb-4">
                      <div className="flex items-start justify-between mb-2 xs:mb-3">
                        <div className="flex items-center space-x-2 xs:space-x-3">
                          <div className="w-10 h-10 xs:w-12 xs:h-12 gradient-primary rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <span className="text-base xs:text-lg">{categoryDetails.icon}</span>
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <Badge 
                              variant={course.status === 'active' ? 'default' : 'secondary'}
                              className={`${course.status === 'active' ? 'gradient-primary text-white' : 'bg-gray-100'} rounded-full text-xs w-fit`}
                            >
                              {course.status === 'active' ? 'In Progress' : course.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-white/40 border-gray-200 w-fit">
                              {categoryDetails.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-lg xs:text-xl font-jakarta group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 font-inter line-clamp-3 text-sm xs:text-base leading-relaxed">
                        {course.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 xs:space-y-4">
                      {/* Course Stats - Mobile Optimized */}
                      <div className="grid grid-cols-2 gap-2 xs:gap-3">
                        <div className="flex items-center space-x-2 p-2 xs:p-3 bg-white/50 rounded-lg">
                          <Target className="h-3 w-3 xs:h-4 xs:w-4 text-indigo-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">Skill Level</p>
                            <p className="text-xs xs:text-sm font-medium capitalize truncate">{course.difficulty_level}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 p-2 xs:p-3 bg-white/50 rounded-lg">
                          <Clock className="h-3 w-3 xs:h-4 xs:w-4 text-purple-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="text-xs xs:text-sm font-medium truncate">{course.estimated_duration}</p>
                          </div>
                        </div>
                      </div>

                      {/* Skill Area - Mobile Responsive */}
                      <div className="flex items-center space-x-2 p-2 xs:p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                        <Users className="h-3 w-3 xs:h-4 xs:w-4 text-blue-600 flex-shrink-0" />
                        <span className="text-xs xs:text-sm font-medium text-blue-700 truncate">{course.skill_area}</span>
                      </div>

                      {/* Topics Preview - Mobile Optimized */}
                      {course.topics && course.topics.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Learning Topics</p>
                          <div className="flex flex-wrap gap-1">
                            {course.topics.slice(0, 2).map((topic: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs bg-white/40 border-gray-200">
                                {topic.title || `Topic ${i + 1}`}
                              </Badge>
                            ))}
                            {course.topics.length > 2 && (
                              <Badge variant="outline" className="text-xs bg-white/40 border-gray-200">
                                +{course.topics.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons - Mobile Responsive */}
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          onClick={() => handleStartCourse(course.id)}
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg text-xs xs:text-sm"
                          size="sm"
                        >
                          <Play className="h-3 w-3 xs:h-4 xs:w-4 mr-1 xs:mr-2 flex-shrink-0" />
                          {course.status === 'active' ? 'Continue' : 'Start'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white/60 border-gray-200 px-2 xs:px-3"
                          onClick={() => handleShareCourse(course.id, course.title)}
                        >
                          <Share2 className="h-3 w-3 xs:h-4 xs:w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white/60 border-gray-200 px-2 xs:px-3"
                          onClick={() => handleEditCourse(course.id)}
                        >
                          <Edit className="h-3 w-3 xs:h-4 xs:w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white/60 border-gray-200 px-2 xs:px-3"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <BookOpen className="h-3 w-3 xs:h-4 xs:w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </FloatingCard>
                );
              })}
            </div>

            {/* No courses found message - Mobile Responsive */}
            {filteredCourses.length === 0 && selectedCategory !== 'All' && (
              <div className="text-center py-8 xs:py-12">
                <div className="w-20 h-20 xs:w-24 xs:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 xs:mb-4">
                  <span className="text-2xl xs:text-3xl">{getCategoryDetails(selectedCategory).icon}</span>
                </div>
                <h3 className="text-lg xs:text-xl font-semibold text-gray-800 mb-2">
                  No {getCategoryDetails(selectedCategory).label} courses yet
                </h3>
                <p className="text-gray-600 mb-4 text-sm xs:text-base px-4">
                  Create your first course in this category to get started.
                </p>
                <Button asChild size="sm" className="text-sm xs:text-base">
                  <Link to="/create-course">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Share Course Modal */}
      <ShareCourseModal
        isOpen={shareModal.isOpen}
        onClose={closeShareModal}
        courseId={shareModal.courseId}
        courseTitle={shareModal.courseTitle}
      />
    </div>
  );
}
