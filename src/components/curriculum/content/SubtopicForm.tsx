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
import { useCountries, useFilteredEducationLevels, useFilteredSubjects, useFilteredLevelSubjects, useFilteredUnits, useFilteredTopics } from '@/hooks/curriculum/useCurriculumFilters';

interface Topic {
  id: string;
  topic_code: string;
  topic_title: string;
}

interface Subtopic {
  id: string;
  subtopic_code: string;
  subtopic_title: string;
  subtopic_description: string;
  learning_objective: string;
  subtopic_order: number;
  bloom_taxonomy_level: string;
  competency_indicators: any;
  suggested_activities: any;
  assessment_methods: any;
  topic: {
    topic_code: string;
    topic_title: string;
  };
}

export const SubtopicForm = () => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<CurriculumFilters>({});
  const [formData, setFormData] = useState({
    topic_id: '',
    subtopic_code: '',
    subtopic_title: '',
    subtopic_description: '',
    learning_objective: '',
    subtopic_order: 1,
    bloom_taxonomy_level: 'understand',
    competency_indicators: [] as string[],
    suggested_activities: [] as string[],
    assessment_methods: [] as string[]
  });
  const { toast } = useToast();

  // Fetch filter data
  const { data: countries = [] } = useCountries();
  const { data: educationLevels = [] } = useFilteredEducationLevels(filters.countryId);
  const { data: subjects = [] } = useFilteredSubjects(filters.countryId);
  const { data: levelSubjects = [] } = useFilteredLevelSubjects(filters.levelId, filters.subjectId);
  const { data: units = [] } = useFilteredUnits(filters.levelSubjectId);
  const { data: topics = [] } = useFilteredTopics(filters.unitId);

  useEffect(() => {
    fetchSubtopics();
  }, []);

  const fetchSubtopics = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setSubtopics(data || []);
    } catch (error) {
      console.error('Error fetching subtopics:', error);
    }
  };

  // Filter subtopics for display based on selected filters
  const filteredSubtopicsForDisplay = useMemo(() => {
    return subtopics.filter(subtopic => {
      if (!filters.topicId) return true;
      
      const matchTopic = !filters.topicId || subtopic.topic?.topic_code === topics.find(t => t.id === filters.topicId)?.topic_code;
      return matchTopic;
    });
  }, [subtopics, filters, topics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic_id || !formData.subtopic_code || !formData.subtopic_title || !formData.learning_objective) {
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
        .from('curriculum_subtopics')
        .insert([{
          ...formData,
          subtopic_code: formData.subtopic_code.toUpperCase()
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subtopic added successfully"
      });

      setFormData({
        topic_id: '',
        subtopic_code: '',
        subtopic_title: '',
        subtopic_description: '',
        learning_objective: '',
        subtopic_order: 1,
        bloom_taxonomy_level: 'understand',
        competency_indicators: [],
        suggested_activities: [],
        assessment_methods: []
      });
      fetchSubtopics();
    } catch (error: any) {
      console.error('Error adding subtopic:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add subtopic",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subtopic?')) return;

    try {
      const { error } = await supabase
        .from('curriculum_subtopics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subtopic deleted successfully"
      });
      fetchSubtopics();
    } catch (error: any) {
      console.error('Error deleting subtopic:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete subtopic",
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
        topics={topics}
        showCountry={true}
        showLevel={true}
        showSubject={true}
        showLevelSubject={true}
        showUnit={true}
        showTopic={true}
        compact={true}
      />
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="topic_id">Topic *</Label>
          <Select 
            value={formData.topic_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, topic_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                topics.length === 0 
                  ? "Select filters above first" 
                  : "Select a topic"
              } />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.topic_code} - {topic.topic_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {topics.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Select filters above to see available topics
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subtopic_code">Subtopic Code *</Label>
            <Input
              id="subtopic_code"
              value={formData.subtopic_code}
              onChange={(e) => setFormData(prev => ({ ...prev, subtopic_code: e.target.value }))}
              placeholder="e.g., SUB01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtopic_title">Subtopic Title *</Label>
            <Input
              id="subtopic_title"
              value={formData.subtopic_title}
              onChange={(e) => setFormData(prev => ({ ...prev, subtopic_title: e.target.value }))}
              placeholder="e.g., Counting to 100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtopic_description">Subtopic Description</Label>
          <Textarea
            id="subtopic_description"
            value={formData.subtopic_description}
            onChange={(e) => setFormData(prev => ({ ...prev, subtopic_description: e.target.value }))}
            placeholder="Describe the subtopic content..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="learning_objective">Learning Objective *</Label>
          <Textarea
            id="learning_objective"
            value={formData.learning_objective}
            onChange={(e) => setFormData(prev => ({ ...prev, learning_objective: e.target.value }))}
            placeholder="What should students be able to do after this subtopic?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subtopic_order">Subtopic Order</Label>
            <Input
              id="subtopic_order"
              type="number"
              min="1"
              value={formData.subtopic_order}
              onChange={(e) => setFormData(prev => ({ ...prev, subtopic_order: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloom_taxonomy_level">Bloom's Taxonomy Level</Label>
            <Select 
              value={formData.bloom_taxonomy_level} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, bloom_taxonomy_level: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remember">Remember</SelectItem>
                <SelectItem value="understand">Understand</SelectItem>
                <SelectItem value="apply">Apply</SelectItem>
                <SelectItem value="analyze">Analyze</SelectItem>
                <SelectItem value="evaluate">Evaluate</SelectItem>
                <SelectItem value="create">Create</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DynamicListInput
          label="Competency Indicators"
          items={formData.competency_indicators}
          placeholder="Add a competency indicator..."
          onChange={(items) => setFormData(prev => ({ ...prev, competency_indicators: items }))}
        />

        <DynamicListInput
          label="Suggested Activities"
          items={formData.suggested_activities}
          placeholder="Add a learning activity..."
          onChange={(items) => setFormData(prev => ({ ...prev, suggested_activities: items }))}
        />

        <DynamicListInput
          label="Assessment Methods"
          items={formData.assessment_methods}
          placeholder="Add an assessment method..."
          onChange={(items) => setFormData(prev => ({ ...prev, assessment_methods: items }))}
        />

        <Button type="submit" disabled={loading} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          {loading ? 'Adding...' : 'Add Subtopic'}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Existing Subtopics</h4>
          {filters.topicId ? (
            <Badge variant="secondary">
              Showing {filteredSubtopicsForDisplay.length} of {subtopics.length} subtopics
            </Badge>
          ) : null}
        </div>
        {filteredSubtopicsForDisplay.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {subtopics.length === 0 ? "No subtopics added yet" : "No subtopics match your filters"}
          </p>
        ) : (
          filteredSubtopicsForDisplay.map((subtopic) => (
            <Card key={subtopic.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{subtopic.subtopic_code}</Badge>
                  <div>
                    <p className="font-medium">{subtopic.subtopic_title}</p>
                    <p className="text-sm text-muted-foreground">
                      Topic: {subtopic.topic?.topic_code} • Order: {subtopic.subtopic_order} • 
                      Level: {subtopic.bloom_taxonomy_level}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(subtopic.id)}
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