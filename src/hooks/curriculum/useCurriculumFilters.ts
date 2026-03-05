import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fetch all countries
export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name, code, education_system_type')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Fetch education levels filtered by country
export const useFilteredEducationLevels = (countryId?: string) => {
  return useQuery({
    queryKey: ['education_levels', countryId],
    queryFn: async () => {
      let query = supabase
        .from('education_levels')
        .select(`
          *,
          country:countries(name, code)
        `)
        .order('level_code');
      
      if (countryId) {
        query = query.eq('country_id', countryId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch subjects filtered by country
export const useFilteredSubjects = (countryId?: string) => {
  return useQuery({
    queryKey: ['subjects', countryId],
    queryFn: async () => {
      let query = supabase
        .from('subjects')
        .select(`
          *,
          country:countries(name, code)
        `)
        .order('subject_name');
      
      if (countryId) {
        query = query.eq('country_id', countryId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch level-subject links filtered by level and/or subject
export const useFilteredLevelSubjects = (levelId?: string, subjectId?: string) => {
  return useQuery({
    queryKey: ['level_subjects', levelId, subjectId],
    queryFn: async () => {
      let query = supabase
        .from('level_subjects')
        .select(`
          id,
          education_level:education_levels(id, level_code, level_name, country_id, level_category),
          subject:subjects(id, subject_code, subject_name, country_id)
        `)
        .order('id');
      
      if (levelId) {
        query = query.eq('education_level_id', levelId);
      }
      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch units filtered by level-subject
export const useFilteredUnits = (levelSubjectId?: string) => {
  return useQuery({
    queryKey: ['curriculum_units', levelSubjectId],
    queryFn: async () => {
      let query = supabase
        .from('curriculum_units')
        .select(`
          *,
          level_subject:level_subjects(
            id,
            education_level:education_levels(level_code, level_name, country_id),
            subject:subjects(subject_code, subject_name, country_id)
          )
        `)
        .order('unit_order');
      
      if (levelSubjectId) {
        query = query.eq('level_subject_id', levelSubjectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch topics filtered by unit
export const useFilteredTopics = (unitId?: string) => {
  return useQuery({
    queryKey: ['curriculum_topics', unitId],
    queryFn: async () => {
      let query = supabase
        .from('curriculum_topics')
        .select(`
          *,
          unit:curriculum_units(
            unit_code, 
            unit_title,
            level_subject:level_subjects(
              education_level:education_levels(level_code),
              subject:subjects(subject_code)
            )
          )
        `)
        .order('topic_order');
      
      if (unitId) {
        query = query.eq('unit_id', unitId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch subtopics filtered by topic
export const useFilteredSubtopics = (topicId?: string) => {
  return useQuery({
    queryKey: ['curriculum_subtopics', topicId],
    queryFn: async () => {
      let query = supabase
        .from('curriculum_subtopics')
        .select(`
          *,
          topic:curriculum_topics(
            topic_code,
            topic_title,
            unit:curriculum_units(unit_code, unit_title)
          )
        `)
        .order('subtopic_order');
      
      if (topicId) {
        query = query.eq('topic_id', topicId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch content filtered by subtopic
export const useFilteredContent = (subtopicId?: string) => {
  return useQuery({
    queryKey: ['curriculum_content', subtopicId],
    queryFn: async () => {
      let query = supabase
        .from('curriculum_content')
        .select(`
          *,
          subtopic:curriculum_subtopics(
            subtopic_code,
            subtopic_title,
            topic:curriculum_topics(topic_code, topic_title)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (subtopicId) {
        query = query.eq('subtopic_id', subtopicId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 3 * 60 * 1000,
  });
};
