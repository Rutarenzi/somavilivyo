import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface CurriculumFilters {
  countryId?: string;
  levelId?: string;
  subjectId?: string;
  levelSubjectId?: string;
  unitId?: string;
  topicId?: string;
  subtopicId?: string;
}

interface HierarchicalFiltersProps {
  filters: CurriculumFilters;
  onFiltersChange: (filters: CurriculumFilters) => void;
  
  // Data for dropdowns
  countries?: Array<{ id: string; name: string; code: string }>;
  educationLevels?: Array<{ id: string; level_code: string; level_name: string }>;
  subjects?: Array<{ id: string; subject_code: string; subject_name: string }>;
  levelSubjects?: Array<{ 
    id: string; 
    education_level: { level_code: string }; 
    subject: { subject_code: string; subject_name: string } 
  }>;
  units?: Array<{ id: string; unit_code: string; unit_title: string }>;
  topics?: Array<{ id: string; topic_code: string; topic_title: string }>;
  subtopics?: Array<{ id: string; subtopic_code: string; subtopic_title: string }>;
  
  // Control which filters to show
  showCountry?: boolean;
  showLevel?: boolean;
  showSubject?: boolean;
  showLevelSubject?: boolean;
  showUnit?: boolean;
  showTopic?: boolean;
  showSubtopic?: boolean;
  
  // Loading states
  isLoading?: boolean;
  
  // Styling
  compact?: boolean;
  className?: string;
}

export const HierarchicalFilters: React.FC<HierarchicalFiltersProps> = ({
  filters,
  onFiltersChange,
  countries = [],
  educationLevels = [],
  subjects = [],
  levelSubjects = [],
  units = [],
  topics = [],
  subtopics = [],
  showCountry = true,
  showLevel = true,
  showSubject = true,
  showLevelSubject = false,
  showUnit = false,
  showTopic = false,
  showSubtopic = false,
  isLoading = false,
  compact = false,
  className = ''
}) => {
  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const containerClass = compact 
    ? "flex flex-wrap items-center gap-3" 
    : "space-y-4";

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium">Filters</h4>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        )}
      </div>
      
      <div className={containerClass}>
        {showCountry && countries.length > 0 && (
          <div className={compact ? "flex-1 min-w-[200px]" : "space-y-2"}>
            <Label htmlFor="filter-country">Country</Label>
            <Select 
              value={filters.countryId || 'all'} 
              onValueChange={(value) => onFiltersChange({ 
                ...filters, 
                countryId: value === 'all' ? undefined : value,
                // Clear dependent filters
                levelId: undefined,
                subjectId: undefined,
                levelSubjectId: undefined,
                unitId: undefined,
                topicId: undefined,
                subtopicId: undefined
              })}
              disabled={isLoading}
            >
              <SelectTrigger id="filter-country">
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name} ({country.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showLevel && educationLevels.length > 0 && (
          <div className={compact ? "flex-1 min-w-[200px]" : "space-y-2"}>
            <Label htmlFor="filter-level">Education Level</Label>
            <Select 
              value={filters.levelId || 'all'} 
              onValueChange={(value) => onFiltersChange({ 
                ...filters, 
                levelId: value === 'all' ? undefined : value,
                // Clear dependent filters
                levelSubjectId: undefined,
                unitId: undefined,
                topicId: undefined,
                subtopicId: undefined
              })}
              disabled={isLoading || (filters.countryId ? educationLevels.length === 0 : false)}
            >
              <SelectTrigger id="filter-level">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {educationLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.level_code} - {level.level_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showSubject && subjects.length > 0 && (
          <div className={compact ? "flex-1 min-w-[200px]" : "space-y-2"}>
            <Label htmlFor="filter-subject">Subject</Label>
            <Select 
              value={filters.subjectId || 'all'} 
              onValueChange={(value) => onFiltersChange({ 
                ...filters, 
                subjectId: value === 'all' ? undefined : value,
                // Clear dependent filters
                levelSubjectId: undefined,
                unitId: undefined,
                topicId: undefined,
                subtopicId: undefined
              })}
              disabled={isLoading || (filters.countryId ? subjects.length === 0 : false)}
            >
              <SelectTrigger id="filter-subject">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.subject_code} - {subject.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showLevelSubject && levelSubjects.length > 0 && (
          <div className={compact ? "flex-1 min-w-[200px]" : "space-y-2"}>
            <Label htmlFor="filter-level-subject">Level & Subject</Label>
            <Select 
              value={filters.levelSubjectId || 'all'} 
              onValueChange={(value) => onFiltersChange({ 
                ...filters, 
                levelSubjectId: value === 'all' ? undefined : value,
                // Clear dependent filters
                unitId: undefined,
                topicId: undefined,
                subtopicId: undefined
              })}
              disabled={isLoading || levelSubjects.length === 0}
            >
              <SelectTrigger id="filter-level-subject">
                <SelectValue placeholder="All level-subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All level-subjects</SelectItem>
                {levelSubjects.map((ls) => (
                  <SelectItem key={ls.id} value={ls.id}>
                    {ls.education_level.level_code} - {ls.subject.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showUnit && units.length > 0 && (
          <div className={compact ? "flex-1 min-w-[200px]" : "space-y-2"}>
            <Label htmlFor="filter-unit">Unit</Label>
            <Select 
              value={filters.unitId || 'all'} 
              onValueChange={(value) => onFiltersChange({ 
                ...filters, 
                unitId: value === 'all' ? undefined : value,
                // Clear dependent filters
                topicId: undefined,
                subtopicId: undefined
              })}
              disabled={isLoading || units.length === 0}
            >
              <SelectTrigger id="filter-unit">
                <SelectValue placeholder="All units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All units</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.unit_code} - {unit.unit_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showTopic && topics.length > 0 && (
          <div className={compact ? "flex-1 min-w-[200px]" : "space-y-2"}>
            <Label htmlFor="filter-topic">Topic</Label>
            <Select 
              value={filters.topicId || 'all'} 
              onValueChange={(value) => onFiltersChange({ 
                ...filters, 
                topicId: value === 'all' ? undefined : value,
                // Clear dependent filters
                subtopicId: undefined
              })}
              disabled={isLoading || topics.length === 0}
            >
              <SelectTrigger id="filter-topic">
                <SelectValue placeholder="All topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All topics</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.topic_code} - {topic.topic_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showSubtopic && subtopics.length > 0 && (
          <div className={compact ? "flex-1 min-w-[200px]" : "space-y-2"}>
            <Label htmlFor="filter-subtopic">Subtopic</Label>
            <Select 
              value={filters.subtopicId || 'all'} 
              onValueChange={(value) => onFiltersChange({ 
                ...filters, 
                subtopicId: value === 'all' ? undefined : value
              })}
              disabled={isLoading || subtopics.length === 0}
            >
              <SelectTrigger id="filter-subtopic">
                <SelectValue placeholder="All subtopics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subtopics</SelectItem>
                {subtopics.map((subtopic) => (
                  <SelectItem key={subtopic.id} value={subtopic.id}>
                    {subtopic.subtopic_code} - {subtopic.subtopic_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </Card>
  );
};
