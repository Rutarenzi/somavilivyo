
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, Clock, Users, ChevronRight, Play } from "lucide-react";
import { parseHTMLContent } from "@/utils/enhancedContentParser";

interface NavigationState {
  view: 'course' | 'unit' | 'topic' | 'subtopic' | 'module';
  unitId?: string;
  topicId?: string;
  subtopicId?: string;
  moduleId?: string;
}

interface CourseOverviewProps {
  units: any[];
  onNavigate: (state: NavigationState) => void;
}

export function CourseOverview({ units, onNavigate }: CourseOverviewProps) {
  const calculateUnitProgress = (unit: any) => {
    let completed = 0;
    let total = 0;

    unit.topics.forEach((topic: any) => {
      topic.subtopics.forEach((subtopic: any) => {
        subtopic.modules.forEach((module: any) => {
          total++;
          if (module.completed) completed++;
        });
      });
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getUnitStats = (unit: any) => {
    let totalModules = 0;
    let totalMinutes = 0;
    let topics = unit.topics.length;

    unit.topics.forEach((topic: any) => {
      topic.subtopics.forEach((subtopic: any) => {
        subtopic.modules.forEach((module: any) => {
          totalModules++;
          totalMinutes += module.estimatedMinutes || 0;
        });
      });
    });

    return { totalModules, totalMinutes, topics };
  };

  const getModulePreview = (unit: any) => {
    const firstModule = unit.topics[0]?.subtopics[0]?.modules[0];
    if (!firstModule) return null;
    
    const parsed = parseHTMLContent(firstModule.content, firstModule.title);
    return parsed.overview;
  };

  return (
    <div className="p-3 xs:p-4 sm:p-6 lg:p-8 space-y-6 xs:space-y-8">
      {/* Course Overview Header - Mobile Responsive */}
      <div className="text-center space-y-3 xs:space-y-4">
        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-gray-900">Course Overview</h1>
        <p className="text-base xs:text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Explore the structured learning path designed to build your expertise step by step. 
          Each unit contains focused topics with practical applications.
        </p>
      </div>

      {/* Units Grid - Mobile Responsive */}
      <div className="grid gap-4 xs:gap-6 lg:gap-8">
        {units.map((unit, index) => {
          const progress = calculateUnitProgress(unit);
          const { totalModules, totalMinutes, topics } = getUnitStats(unit);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          const isCompleted = progress === 100;
          const preview = getModulePreview(unit);

          return (
            <Card 
              key={unit.id} 
              className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-indigo-500"
            >
              <CardHeader className="p-3 xs:p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex flex-col xs:flex-row xs:items-center space-y-3 xs:space-y-0 xs:space-x-3 sm:space-x-4 flex-1">
                    <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 self-center xs:self-start">
                      <BookOpen className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-indigo-600" />
                    </div>
                    <div className="flex-1 text-center xs:text-left">
                      <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-3 mb-2">
                        <CardTitle className="text-lg xs:text-xl sm:text-2xl text-gray-900">{unit.title}</CardTitle>
                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-800 self-center xs:self-start">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm xs:text-base sm:text-lg leading-relaxed mb-3">{unit.description}</p>
                      {preview && (
                        <p className="text-gray-500 text-xs xs:text-sm bg-gray-50 rounded-lg p-2 xs:p-3 border">
                          Preview: {preview}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 text-sm xs:text-base lg:text-lg px-2 xs:px-3 py-1 self-center sm:self-start">
                    Unit {index + 1}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 xs:space-y-6 p-3 xs:p-4 sm:p-6">
                {/* Progress Bar - Mobile Responsive */}
                <div className="space-y-2 xs:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm xs:text-base lg:text-lg font-semibold text-gray-700">Progress</span>
                    <span className="text-lg xs:text-xl lg:text-2xl font-bold text-indigo-600">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 xs:h-3" />
                </div>

                {/* Unit Stats - Mobile Responsive Grid */}
                <div className="grid grid-cols-3 gap-3 xs:gap-4 lg:gap-6">
                  <div className="text-center">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-center xs:space-x-1 lg:space-x-2 text-gray-600 mb-1">
                      <Target className="h-3 w-3 xs:h-4 xs:w-4 lg:h-5 lg:w-5 mx-auto xs:mx-0" />
                      <span className="font-medium text-xs xs:text-sm lg:text-base">Topics</span>
                    </div>
                    <div className="text-lg xs:text-xl lg:text-2xl font-bold text-gray-900">{topics}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-center xs:space-x-1 lg:space-x-2 text-gray-600 mb-1">
                      <Users className="h-3 w-3 xs:h-4 xs:w-4 lg:h-5 lg:w-5 mx-auto xs:mx-0" />
                      <span className="font-medium text-xs xs:text-sm lg:text-base">Modules</span>
                    </div>
                    <div className="text-lg xs:text-xl lg:text-2xl font-bold text-gray-900">{totalModules}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-center xs:space-x-1 lg:space-x-2 text-gray-600 mb-1">
                      <Clock className="h-3 w-3 xs:h-4 xs:w-4 lg:h-5 lg:w-5 mx-auto xs:mx-0" />
                      <span className="font-medium text-xs xs:text-sm lg:text-base">Duration</span>
                    </div>
                    <div className="text-lg xs:text-xl lg:text-2xl font-bold text-gray-900">
                      {hours > 0 ? `${hours}h` : ''} {minutes}m
                    </div>
                  </div>
                </div>

                {/* Topics Preview - Mobile Responsive */}
                <div className="border-t pt-4 xs:pt-6">
                  <h4 className="font-semibold text-gray-900 mb-3 xs:mb-4 text-base xs:text-lg">Learning Topics:</h4>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-3">
                    {unit.topics.slice(0, 4).map((topic: any, topicIndex: number) => (
                      <div 
                        key={topic.id}
                        className="text-xs xs:text-sm text-gray-700 bg-gray-50 rounded-lg p-2 xs:p-3 hover:bg-gray-100 transition-colors border"
                      >
                        <div className="font-medium mb-1">{topicIndex + 1}. {topic.title}</div>
                        <div className="text-gray-500 text-xs">{topic.description}</div>
                      </div>
                    ))}
                    {unit.topics.length > 4 && (
                      <div className="text-xs xs:text-sm text-gray-500 bg-gray-50 rounded-lg p-2 xs:p-3 text-center border border-dashed xs:col-span-2">
                        +{unit.topics.length - 4} more topics
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button - Mobile Responsive */}
                <div className="pt-3 xs:pt-4">
                  <Button 
                    onClick={() => onNavigate({ 
                      view: 'unit', 
                      unitId: unit.id 
                    })}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 xs:py-3 text-sm xs:text-base lg:text-lg"
                    size="lg"
                  >
                    {isCompleted ? (
                      <>
                        <BookOpen className="h-4 w-4 xs:h-5 xs:w-5 mr-2" />
                        Review Unit
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 xs:h-5 xs:w-5 mr-2" />
                        {progress > 0 ? 'Continue' : 'Start'} Learning
                      </>
                    )}
                    <ChevronRight className="h-4 w-4 xs:h-5 xs:w-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
