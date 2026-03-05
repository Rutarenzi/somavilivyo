import { useMemo } from "react";

interface CourseCompletionHookProps {
  course: {
    id: string;
    title: string;
    description: string;
    difficulty_level: string;
    skill_area: string;
  };
  microModules: Array<{
    id: string;
    title: string;
    estimated_duration_minutes: number;
  }>;
  userProgress: Array<{
    micro_module_id: string;
    completed_at: string | null;
    quiz_score?: number;
    time_spent_seconds?: number;
  }>;
}

export function useCourseCompletion({ course, microModules, userProgress }: CourseCompletionHookProps) {
  const completionData = useMemo(() => {
    if (!course || !microModules.length) return null;

    const completedProgress = userProgress.filter(p => p.completed_at);
    const isCompleted = completedProgress.length === microModules.length && microModules.length > 0;

    if (!isCompleted) return null;

    // Calculate performance metrics
    const scores = completedProgress.map(p => p.quiz_score || 0);
    const totalTimeSpent = completedProgress.reduce((acc, p) => acc + (p.time_spent_seconds || 0), 0);
    
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Map module scores with titles
    const moduleScores = microModules.map(module => {
      const progress = completedProgress.find(p => p.micro_module_id === module.id);
      return {
        moduleId: module.id,
        title: module.title,
        score: progress?.quiz_score || 0,
        timeSpent: progress?.time_spent_seconds || 0
      };
    });

    // Calculate achievements
    const achievements = [
      {
        title: "Course Completed",
        description: "Finished all modules in the course",
        icon: "🎓",
        earned: true
      },
      {
        title: "High Achiever",
        description: "Maintained an average score above 80%",
        icon: "⭐",
        earned: averageScore >= 80
      },
      {
        title: "Perfect Score",
        description: "Achieved 100% on at least one module",
        icon: "💯",
        earned: highestScore === 100
      },
      {
        title: "Quick Learner",
        description: "Completed the course efficiently",
        icon: "⚡",
        earned: totalTimeSpent <= (microModules.length * 300) // 5 minutes average per module
      },
      {
        title: "Consistent Performer",
        description: "Scored above 70% on all modules",
        icon: "🎯",
        earned: lowestScore >= 70
      },
      {
        title: "Knowledge Master",
        description: "Achieved an overall score above 90%",
        icon: "🧠",
        earned: averageScore >= 90
      }
    ];

    return {
      course: {
        id: course.id,
        title: course.title,
        description: course.description || "",
        difficulty_level: course.difficulty_level,
        skill_area: course.skill_area
      },
      performance: {
        completedModules: completedProgress.length,
        totalModules: microModules.length,
        averageScore,
        totalTimeSpent,
        highestScore,
        lowestScore,
        moduleScores
      },
      achievements
    };
  }, [course, microModules, userProgress]);

  return {
    isCompleted: !!completionData,
    completionData
  };
}