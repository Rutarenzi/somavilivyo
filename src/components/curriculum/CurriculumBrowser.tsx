import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, ChevronRight, ChevronDown, BookOpen, FileText, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HierarchicalFilters, CurriculumFilters } from './HierarchicalFilters';
import { useCountries, useFilteredEducationLevels, useFilteredSubjects, useFilteredLevelSubjects, useFilteredUnits } from '@/hooks/curriculum/useCurriculumFilters';

interface CurriculumData {
  countries: any[];
  levels: any[];
  subjects: any[];
  units: any[];
  topics: any[];
  subtopics: any[];
  content: any[];
}

export const CurriculumBrowser = () => {
  const [data, setData] = useState<CurriculumData>({
    countries: [],
    levels: [],
    subjects: [],
    units: [],
    topics: [],
    subtopics: [],
    content: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CurriculumFilters>({});

  // Fetch filter data for the filter component
  const { data: countries = [] } = useCountries();
  const { data: educationLevels = [] } = useFilteredEducationLevels(filters.countryId);
  const { data: subjects = [] } = useFilteredSubjects(filters.countryId);
  const { data: levelSubjects = [] } = useFilteredLevelSubjects(filters.levelId, filters.subjectId);
  const { data: units = [] } = useFilteredUnits(filters.levelSubjectId);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        countriesRes,
        levelsRes,
        subjectsRes,
        unitsRes,
        topicsRes,
        subtopicsRes,
        contentRes
      ] = await Promise.all([
        supabase.from('countries').select('*'),
        supabase.from('education_levels').select('*, country:countries(name, code)'),
        supabase.from('subjects').select('*, country:countries(name, code)'),
        supabase.from('curriculum_units').select(`
          *,
          level_subject:level_subjects(
            education_level:education_levels(level_code, level_name),
            subject:subjects(subject_code, subject_name)
          )
        `),
        supabase.from('curriculum_topics').select(`
          *,
          unit:curriculum_units(unit_code, unit_title)
        `),
        supabase.from('curriculum_subtopics').select(`
          *,
          topic:curriculum_topics(topic_code, topic_title)
        `),
        supabase.from('curriculum_content').select(`
          *,
          subtopic:curriculum_subtopics(subtopic_code, subtopic_title)
        `)
      ]);

      setData({
        countries: countriesRes.data || [],
        levels: levelsRes.data || [],
        subjects: subjectsRes.data || [],
        units: unitsRes.data || [],
        topics: topicsRes.data || [],
        subtopics: subtopicsRes.data || [],
        content: contentRes.data || []
      });
    } catch (error) {
      console.error('Error fetching curriculum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filterData = (items: any[], searchFields: string[]) => {
    if (!searchTerm) return items;
    return items.filter(item =>
      searchFields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  };

  // Apply hierarchical filters to data (MUST be before any conditional returns)
  const filteredCountries = useMemo(() => {
    let result = data.countries;
    if (searchTerm) {
      result = filterData(result, ['name', 'code']);
    }
    return result;
  }, [data.countries, searchTerm]);

  const filteredLevels = useMemo(() => {
    let result = data.levels;
    if (filters.countryId) {
      result = result.filter(level => level.country_id === filters.countryId);
    }
    return result;
  }, [data.levels, filters.countryId]);

  const filteredSubjects = useMemo(() => {
    let result = data.subjects;
    if (searchTerm) {
      result = filterData(result, ['subject_name', 'subject_code']);
    }
    return result;
  }, [data.subjects, searchTerm]);

  const filteredUnits = useMemo(() => {
    let result = data.units;
    if (filters.levelSubjectId) {
      result = result.filter(unit => unit.level_subject_id === filters.levelSubjectId);
    }
    if (searchTerm) {
      result = filterData(result, ['unit_title', 'unit_code']);
    }
    return result;
  }, [data.units, filters.levelSubjectId, searchTerm]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading curriculum data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Curriculum Browser</CardTitle>
          <CardDescription>
            Browse and explore the curriculum structure hierarchically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Hierarchical Filters */}
            <HierarchicalFilters
              filters={filters}
              onFiltersChange={setFilters}
              countries={countries}
              educationLevels={educationLevels}
              subjects={subjects}
              levelSubjects={levelSubjects}
              units={units}
            />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search curriculum content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-4">
              {/* Countries and Education Levels */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Countries & Education Levels
                </h3>
                {filteredCountries.map((country) => (
                  <Collapsible key={country.id}>
                    <CollapsibleTrigger
                      onClick={() => toggleExpanded(`country-${country.id}`)}
                      className="flex items-center gap-2 w-full p-3 hover:bg-muted rounded-lg"
                    >
                      {expandedItems.has(`country-${country.id}`) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <Badge variant="outline">{country.code}</Badge>
                      <span className="font-medium">{country.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({country.education_system_type})
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-6 space-y-2">
                      {filteredLevels
                        .filter(level => level.country_id === country.id)
                        .map((level) => (
                          <div key={level.id} className="flex items-center gap-2 p-2">
                            <Badge variant="secondary">{level.level_code}</Badge>
                            <span>{level.level_name}</span>
                            <span className="text-sm text-muted-foreground">
                              ({level.level_category})
                            </span>
                          </div>
                        ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>

              {/* Subjects */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Subjects
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredSubjects.map((subject) => (
                    <div key={subject.id} className="flex items-center gap-2 p-2 border rounded">
                      <Badge variant="outline">{subject.subject_code}</Badge>
                      <span className="text-sm">{subject.subject_name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Units */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Units
                </h3>
                {filteredUnits.map((unit) => (
                  <Collapsible key={unit.id}>
                    <CollapsibleTrigger
                      onClick={() => toggleExpanded(`unit-${unit.id}`)}
                      className="flex items-center gap-2 w-full p-3 hover:bg-muted rounded-lg"
                    >
                      {expandedItems.has(`unit-${unit.id}`) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <Badge variant="outline">{unit.unit_code}</Badge>
                      <span className="font-medium">{unit.unit_title}</span>
                      <span className="text-sm text-muted-foreground">
                        ({unit.level_subject?.education_level?.level_code} - {unit.level_subject?.subject?.subject_code})
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-6 space-y-2">
                      {/* Topics for this unit */}
                      {data.topics
                        .filter(topic => topic.unit_id === unit.id)
                        .map((topic) => (
                          <Collapsible key={topic.id}>
                            <CollapsibleTrigger
                              onClick={() => toggleExpanded(`topic-${topic.id}`)}
                              className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded"
                            >
                              {expandedItems.has(`topic-${topic.id}`) ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              <Badge variant="secondary" className="text-xs">{topic.topic_code}</Badge>
                              <span className="text-sm">{topic.topic_title}</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="ml-6 space-y-1">
                              {/* Subtopics for this topic */}
                              {data.subtopics
                                .filter(subtopic => subtopic.topic_id === topic.id)
                                .map((subtopic) => (
                                  <div key={subtopic.id} className="flex items-center gap-2 p-1 text-sm">
                                    <Badge variant="secondary" className="text-xs">{subtopic.subtopic_code}</Badge>
                                    <span>{subtopic.subtopic_title}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({subtopic.bloom_taxonomy_level})
                                    </span>
                                  </div>
                                ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>

              {/* Content Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-indigo-600">{data.countries.length}</div>
                    <div className="text-sm text-muted-foreground">Countries</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">{data.levels.length}</div>
                    <div className="text-sm text-muted-foreground">Education Levels</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-pink-600">{data.subjects.length}</div>
                    <div className="text-sm text-muted-foreground">Subjects</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{data.content.length}</div>
                    <div className="text-sm text-muted-foreground">Content Items</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
