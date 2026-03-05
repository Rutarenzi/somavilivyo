import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChildFriendlyButton } from '@/components/ui/child-friendly-button';
import { ProgressCelebration } from '@/components/ui/visual-feedback';
import { useConsolidatedCourseData } from '@/hooks/useConsolidatedCourseData';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Trophy, Star, Play, Plus } from 'lucide-react';
export function ChildFriendlyDashboard() {
  const {
    courses,
    loading
  } = useConsolidatedCourseData();
  const navigate = useNavigate();
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-2 xs:p-4 safe-area">
        <div className="text-center py-10 xs:py-20">
          <div className="text-4xl xs:text-6xl mb-4">📚</div>
          <p className="text-lg xs:text-2xl font-bold text-gray-700 px-4">Loading your learning adventure...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-2 xs:p-4 md:p-6 safe-area">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-6 xs:mb-8">
          <h1 className="text-2xl xs:text-3xl md:text-4xl font-bold text-gray-800 mb-2 px-2">
            🌟 Welcome to Your Learning Adventure! 🌟
          </h1>
          <p className="text-base xs:text-lg md:text-xl text-gray-600 px-4">
            Ready to learn something amazing today?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 md:gap-6 mb-6 xs:mb-8">
          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
            <CardContent className="p-4 xs:p-6 text-center">
              <Trophy className="h-8 w-8 xs:h-10 w-10 md:h-12 w-12 mx-auto mb-2" />
              <h3 className="text-xl xs:text-2xl font-bold">{courses.length}</h3>
              <p className="text-sm xs:text-base md:text-lg">Learning Subjects</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-400 to-blue-500 text-white border-0 shadow-lg">
            <CardContent className="p-4 xs:p-6 text-center">
              <Star className="h-8 w-8 xs:h-10 w-10 md:h-12 w-12 mx-auto mb-2" />
              <h3 className="text-xl xs:text-2xl font-bold">0</h3>
              <p className="text-sm xs:text-base md:text-lg">Stars Earned</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-400 to-pink-500 text-white border-0 shadow-lg xs:col-span-2 lg:col-span-1">
            
          </Card>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 xs:gap-6 mb-6 xs:mb-8">
          {courses.map(course => <Card key={course.id} className="hover:shadow-xl transition-shadow duration-200 border-2 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg xs:text-xl font-bold text-gray-800 flex items-center">
                  <span className="text-xl xs:text-2xl mr-2">📖</span>
                  <span className="line-clamp-2">{course.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm xs:text-base line-clamp-3">
                  {course.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs xs:text-sm text-gray-500">
                    
                  </div>
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => <Star key={i} className={`h-3 w-3 xs:h-4 w-4 ${i < Math.floor((course.progressStats?.progressPercentage || 0) / 33) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
                  </div>
                </div>

                <ChildFriendlyButton onClick={() => navigate(`/courses/${course.id}/`)} variant="primary" size="medium" icon={Play} className="w-full text-sm xs:text-base">
                  Start Learning!
                </ChildFriendlyButton>
              </CardContent>
            </Card>)}

          {/* Create New Course Card */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4 xs:p-6 text-center space-y-4">
              <div className="text-4xl xs:text-6xl">➕</div>
              <h3 className="text-lg xs:text-xl font-bold text-gray-700">Create New Subject</h3>
              <p className="text-sm xs:text-base text-gray-600">What would you like to learn about?</p>
              
              <ChildFriendlyButton onClick={() => navigate('/create-course')} variant="secondary" size="medium" icon={Plus} className="w-full text-sm xs:text-base">
                Create New Subject
              </ChildFriendlyButton>
            </CardContent>
          </Card>
        </div>

        {/* Motivational Section */}
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6 xs:p-8 text-center">
            <h2 className="text-2xl xs:text-3xl font-bold mb-4">🚀 Keep Going, Champion! 🚀</h2>
            <p className="text-lg xs:text-xl mb-4 xs:mb-6 px-2">
              Every lesson you complete makes you smarter and stronger!
            </p>
            <div className="flex flex-col xs:flex-row justify-center items-center space-y-4 xs:space-y-0 xs:space-x-6 md:space-x-8">
              <div className="text-center">
                <div className="text-2xl xs:text-3xl mb-2">🏆</div>
                <p className="text-xs xs:text-sm">Complete lessons to earn trophies</p>
              </div>
              <div className="text-center">
                <div className="text-2xl xs:text-3xl mb-2">⭐</div>
                <p className="text-xs xs:text-sm">Answer quizzes to collect stars</p>
              </div>
              <div className="text-center">
                <div className="text-2xl xs:text-3xl mb-2">🎯</div>
                <p className="text-xs xs:text-sm">Reach your learning goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}