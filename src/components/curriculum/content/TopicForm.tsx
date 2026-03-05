import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DynamicListInput } from '../DynamicListInput';
import { HierarchicalFilters, CurriculumFilters } from '../HierarchicalFilters';
import { useCountries, useFilteredEducationLevels, useFilteredSubjects, useFilteredLevelSubjects, useFilteredUnits } from '@/hooks/curriculum/useCurriculumFilters';

interface Unit {
  id: string;
  unit_code: string;
  unit_title: string;
}

interface Topic {
  id: string;
  topic_code: string;
  topic_title: string;
  topic_description: string;
  topic_order: number;
  duration_hours: number;
  difficulty_level: string;
  prerequisites: any;
  unit: {
    unit_code: string;
    unit_title: string;
  };
}

export const TopicForm = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<CurriculumFilters>({});
  const [formData, setFormData] = useState({
    unit_id: '',
    topic_code: '',
    topic_title: '',
    topic_description: '',
    topic_order: 1,
    duration_hours: 1,
    difficulty_level: 'basic',
    prerequisites: [] as string[]
  });
  const { toast } = useToast();

  // Fetch filter data
  const { data: countries = [] } = useCountries();
  const { data: educationLevels = [] } = useFilteredEducationLevels(filters.countryId);
  const { data: subjects = [] } = useFilteredSubjects(filters.countryId);
  const { data: levelSubjects = [] } = useFilteredLevelSubjects(filters.levelId, filters.subjectId);
  const { data: units = [] } = useFilteredUnits(filters.levelSubjectId);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  // Filter topics for display based on selected filters
  const filteredTopicsForDisplay = useMemo(() => {
    return topics.filter(topic => {
      if (!filters.levelSubjectId && !filters.unitId) return true;
      
      const matchUnit = !filters.unitId || topic.unit?.unit_code === units.find(u => u.id === filters.unitId)?.unit_code;
      return matchUnit;
    });
  }, [topics, filters, units]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unit_id || !formData.topic_code || !formData.topic_title) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('curriculum_topics')
        .insert([{
          ...formData,
          topic_code: formData.topic_code.toUpperCase()
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Topic added successfully"
      });

      setFormData({
        unit_id: '',
        topic_code: '',
        topic_title: '',
        topic_description: '',
        topic_order: 1,
        duration_hours: 1,
        difficulty_level: 'basic',
        prerequisites: []
      });
      fetchTopics();
    } catch (error: any) {
      console.error('Error adding topic:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add topic",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    try {
      const { error } = await supabase
        .from('curriculum_topics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Topic deleted successfully"
      });
      fetchTopics();
    } catch (error: any) {
      console.error('Error deleting topic:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete topic",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Hierarchical Filters */}
      <HierarchicalFilters
        filters={filters}
        onFiltersChange={setFilters}
        countries={countries}
        educationLevels={educationLevels}
        subjects={subjects}
        levelSubjects={levelSubjects}
        units={units}
        showCountry={true}
        showLevel={true}
        showSubject={true}
        showLevelSubject={true}
        showUnit={true}
        compact={true}
      />
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="unit_id">Unit *</Label>
          <Select 
            value={formData.unit_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                units.length === 0 
                  ? "Select filters above first" 
                  : "Select a unit"
              } />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.unit_code} - {unit.unit_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {units.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Select filters above to see available units
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="topic_code">Topic Code *</Label>
            <Input
              id="topic_code"
              value={formData.topic_code}
              onChange={(e) => setFormData(prev => ({ ...prev, topic_code: e.target.value }))}
              placeholder="e.g., TOPIC01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic_title">Topic Title *</Label>
            <Input
              id="topic_title"
              value={formData.topic_title}
              onChange={(e) => setFormData(prev => ({ ...prev, topic_title: e.target.value }))}
              placeholder="e.g., Whole Numbers"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic_description">Topic Description</Label>
          <Textarea
            id="topic_description"
            value={formData.topic_description}
            onChange={(e) => setFormData(prev => ({ ...prev, topic_description: e.target.value }))}
            placeholder="Describe the topic content and scope..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="topic_order">Topic Order</Label>
            <Input
              id="topic_order"
              type="number"
              min="1"
              value={formData.topic_order}
              onChange={(e) => setFormData(prev => ({ ...prev, topic_order: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_hours">Duration (Hours)</Label>
            <Input
              id="duration_hours"
              type="number"
              min="1"
              value={formData.duration_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulty_level">Difficulty Level</Label>
            <Select 
              value={formData.difficulty_level} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DynamicListInput
          label="Prerequisites"
          items={formData.prerequisites}
          placeholder="Add a prerequisite topic..."
          onChange={(items) => setFormData(prev => ({ ...prev, prerequisites: items }))}
        />

        <Button type="submit" disabled={loading} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          {loading ? 'Adding...' : 'Add Topic'}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Existing Topics</h4>
          {filters.unitId ? (
            <Badge variant="secondary">
              Showing {filteredTopicsForDisplay.length} of {topics.length} topics
            </Badge>
          ) : null}
        </div>
        {filteredTopicsForDisplay.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {topics.length === 0 ? "No topics added yet" : "No topics match your filters"}
          </p>
        ) : (
          filteredTopicsForDisplay.map((topic) => (
            <Card key={topic.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{topic.topic_code}</Badge>
                  <div>
                    <p className="font-medium">{topic.topic_title}</p>
                    <p className="text-sm text-muted-foreground">
                      Unit: {topic.unit?.unit_code} • Order: {topic.topic_order} • 
                      {topic.duration_hours}h • {topic.difficulty_level}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(topic.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};