import { supabase } from '@/integrations/supabase/client';
import { performanceCache, PERF_CACHE_KEYS } from './performanceCache';
import { resourcePreloader } from './performanceOptimizer';

export interface PreFetchableCourse {
  id: string;
  title: string;
  description: string;
  skill_area: string;
  difficulty_level: string;
  estimated_duration: string;
  category: string;
  status: string;
  created_at: string;
  topics: any[];
  priority: number;
  last_activity?: string;
  progress_percentage?: number;
}

export interface PreFetchStats {
  coursesPreFetched: number;
  modulesPreFetched: number;
  cacheHitRate: number;
  prefetchTime: number;
}

class PreFetchingManager {
  private isPreFetching = false;
  private preFetchedCourses = new Set<string>();
  private preFetchStats: PreFetchStats = {
    coursesPreFetched: 0,
    modulesPreFetched: 0,
    cacheHitRate: 0,
    prefetchTime: 0
  };

  async startPreFetching(userId: string): Promise<void> {
    if (this.isPreFetching || !userId) return;
    
    this.isPreFetching = true;
    const startTime = performance.now();
    
    try {
      console.log('🚀 Starting intelligent pre-fetching for user:', userId);
      
      // Get active courses with priority scoring
      const activeCourses = await this.getActiveCourses(userId);
      
      // Pre-fetch top priority courses
      const topCourses = activeCourses.slice(0, 8); // Pre-fetch top 8 courses
      
      // Pre-fetch courses in batches to avoid overwhelming the database
      await this.preFetchCoursesInBatches(topCourses, userId);
      
      // Update stats
      this.preFetchStats.coursesPreFetched = topCourses.length;
      this.preFetchStats.prefetchTime = performance.now() - startTime;
      
      console.log('✅ Pre-fetching completed:', this.preFetchStats);
      
    } catch (error) {
      console.error('❌ Pre-fetching failed:', error);
    } finally {
      this.isPreFetching = false;
    }
  }

  private async getActiveCourses(userId: string): Promise<PreFetchableCourse[]> {
    try {
      // Query to get courses with activity scoring
      const { data: ownedCourses } = await supabase
        .from('courses')
        .select(`
          id, title, description, skill_area, difficulty_level, 
          estimated_duration, category, status, created_at, topics
        `)
        .eq('user_id', userId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20);

      // Get shared courses
      const { data: sharedCourses } = await supabase
        .from('shared_course_access')
        .select(`
          courses!inner(
            id, title, description, skill_area, difficulty_level,
            estimated_duration, category, status, created_at, topics
          )
        `)
        .eq('user_id', userId)
        .limit(10);

      // Get user activity data to calculate priorities
      const { data: progressData } = await supabase
        .from('user_micro_progress')
        .select('course_id, completed_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(100);

      const activityMap = new Map<string, { lastActivity: Date; activityCount: number }>();
      
      progressData?.forEach(progress => {
        const existing = activityMap.get(progress.course_id);
        const activityDate = new Date(progress.updated_at);
        
        if (!existing || activityDate > existing.lastActivity) {
          activityMap.set(progress.course_id, {
            lastActivity: activityDate,
            activityCount: (existing?.activityCount || 0) + 1
          });
        }
      });

      // Combine and prioritize courses
      const allCourses: PreFetchableCourse[] = [
        ...(ownedCourses || []).map(course => this.calculateCoursePriority(course, activityMap, false)),
        ...(sharedCourses || []).map(item => this.calculateCoursePriority(item.courses, activityMap, true))
      ];

      // Sort by priority (higher is better)
      return allCourses.sort((a, b) => b.priority - a.priority);
      
    } catch (error) {
      console.error('Error getting active courses:', error);
      return [];
    }
  }

  private calculateCoursePriority(
    course: any, 
    activityMap: Map<string, { lastActivity: Date; activityCount: number }>, 
    isShared: boolean
  ): PreFetchableCourse {
    let priority = 0;
    
    // Base priority: owned courses > shared courses
    priority += isShared ? 50 : 100;
    
    // Recent activity boost
    const activity = activityMap.get(course.id);
    if (activity) {
      const daysSinceActivity = (Date.now() - activity.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      
      // Higher priority for recent activity (last 7 days)
      if (daysSinceActivity < 1) priority += 50;
      else if (daysSinceActivity < 3) priority += 30;
      else if (daysSinceActivity < 7) priority += 15;
      
      // Activity frequency boost
      priority += Math.min(activity.activityCount * 2, 20);
    }
    
    // Course recency boost
    const daysSinceCreated = (Date.now() - new Date(course.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 30) priority += 10;
    
    return {
      ...course,
      priority,
      last_activity: activity?.lastActivity.toISOString(),
      topics: course.topics || []
    };
  }

  private async preFetchCoursesInBatches(courses: PreFetchableCourse[], userId: string): Promise<void> {
    // Process in batches of 3 to avoid overwhelming the system
    const batchSize = 3;
    
    for (let i = 0; i < courses.length; i += batchSize) {
      const batch = courses.slice(i, i + batchSize);
      
      // Pre-fetch batch in parallel
      await Promise.allSettled(
        batch.map(course => this.preFetchCourseData(course, userId))
      );
      
      // Small delay between batches to prevent overwhelming the database
      if (i + batchSize < courses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  private async preFetchCourseData(course: PreFetchableCourse, userId: string): Promise<void> {
    try {
      if (this.preFetchedCourses.has(course.id)) return;
      
      // Cache course details
      const courseKey = PERF_CACHE_KEYS.COURSE_DETAIL(course.id);
      performanceCache.set(courseKey, { topics: course.topics }, 30 * 60 * 1000);
      
      // Pre-fetch micro-modules
      const { data: modules } = await supabase
        .from('micro_modules')
        .select('id, title, content, learning_objective, topic_index, subtopic_index, module_index, estimated_duration_minutes, quick_quiz')
        .eq('course_id', course.id)
        .order('topic_index', { ascending: true })
        .order('subtopic_index', { ascending: true })
        .order('module_index', { ascending: true })
        .limit(20); // Pre-fetch first 20 modules

      if (modules) {
        // Cache modules
        const modulesKey = `micro_modules_${course.id}`;
        performanceCache.set(modulesKey, modules, 25 * 60 * 1000);
        this.preFetchStats.modulesPreFetched += modules.length;
      }

      // Pre-fetch user progress
      const { data: progress } = await supabase
        .from('user_micro_progress')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', userId);

      if (progress) {
        const progressKey = PERF_CACHE_KEYS.PROGRESS_DATA(userId, course.id);
        performanceCache.set(progressKey, progress, 20 * 60 * 1000);
      }

      // Pre-fetch analytics data
      const analyticsKey = PERF_CACHE_KEYS.COURSE_ANALYTICS(course.id);
      const analyticsData = {
        totalModules: modules?.length || 0,
        completedModules: progress?.filter(p => p.completed_at).length || 0,
        averageScore: progress?.length ? 
          progress.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / progress.length : 0
      };
      performanceCache.set(analyticsKey, analyticsData, 15 * 60 * 1000);

      this.preFetchedCourses.add(course.id);
      
      console.log(`📦 Pre-fetched course: ${course.title} (Priority: ${course.priority})`);
      
    } catch (error) {
      console.error(`Failed to pre-fetch course ${course.title}:`, error);
    }
  }

  // Check if course data is already pre-fetched
  isCoursePreFetched(courseId: string): boolean {
    return this.preFetchedCourses.has(courseId);
  }

  // Get pre-fetch statistics
  getPreFetchStats(): PreFetchStats {
    return { ...this.preFetchStats };
  }

  // Clear pre-fetch cache and reset
  clearPreFetchCache(): void {
    this.preFetchedCourses.clear();
    this.preFetchStats = {
      coursesPreFetched: 0,
      modulesPreFetched: 0,
      cacheHitRate: 0,
      prefetchTime: 0
    };
  }

  // Background pre-fetch for next likely courses
  async backgroundPreFetch(userId: string, currentCourseId?: string): Promise<void> {
    if (this.isPreFetching) return;

    // Pre-fetch related courses or next in sequence
    setTimeout(async () => {
      try {
        const relatedCourses = await this.getRelatedCourses(userId, currentCourseId);
        if (relatedCourses.length > 0) {
          await this.preFetchCoursesInBatches(relatedCourses.slice(0, 3), userId);
        }
      } catch (error) {
        console.error('Background pre-fetch failed:', error);
      }
    }, 2000); // Start background pre-fetch after 2 seconds
  }

  private async getRelatedCourses(userId: string, excludeCourseId?: string): Promise<PreFetchableCourse[]> {
    try {
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, description, skill_area, difficulty_level, estimated_duration, category, status, created_at, topics')
        .eq('user_id', userId)
        .neq('id', excludeCourseId || '')
        .eq('status', 'published')
        .limit(5);

      return (courses || []).map(course => ({
        ...course,
        priority: 25, // Lower priority for background pre-fetch
        topics: Array.isArray(course.topics) ? course.topics : []
      }));
    } catch (error) {
      console.error('Error getting related courses:', error);
      return [];
    }
  }
}

export const preFetchingManager = new PreFetchingManager();