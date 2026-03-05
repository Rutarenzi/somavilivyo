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
import { useCountries, useFilteredEducationLevels, useFilteredSubjects, useFilteredLevelSubjects } from '@/hooks/curriculum/useCurriculumFilters';

interface LevelSubject {
  id: string;
  education_level: {
    level_code: string;
    level_name: string;
  };
  subject: {
    subject_code: string;
    subject_name: string;
  };
}

interface Unit {
  id: string;
  unit_code: string;
  unit_title: string;
  unit_description: string;
  unit_order: number;
  duration_weeks: number;
  learning_outcomes: any;
  assessment_criteria: any;
  level_subject: {
    education_level: { level_code: string };
    subject: { subject_code: string };
  };
}

export const UnitForm = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<CurriculumFilters>({});
  const [formData, setFormData] = useState({
    level_subject_id: '',
    unit_code: '',
    unit_title: '',
    unit_description: '',
    unit_order: 1,
    duration_weeks: 1,
    learning_outcomes: [] as string[],
    assessment_criteria: [] as string[]
  });
  const { toast } = useToast();

  // Fetch filter data
  const { data: countries = [] } = useCountries();
  const { data: educationLevels = [] } = useFilteredEducationLevels(filters.countryId);
  const { data: subjects = [] } = useFilteredSubjects(filters.countryId);
  const { data: levelSubjects = [] } = useFilteredLevelSubjects(filters.levelId, filters.subjectId);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('curriculum_units')
        .select(`
          *,
          level_subject:level_subjects(
            id,
            education_level:education_levels(level_code, country_id),
            subject:subjects(subject_code, country_id)
          )
        `)
        .order('unit_order');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  // Filter level subjects for dropdown based on selected filters
  const filteredLevelSubjectsForForm = useMemo(() => {
    if (!filters.levelId && !filters.subjectId) return levelSubjects;
    
    return levelSubjects.filter(ls => {
      const matchLevel = !filters.levelId || ls.education_level.id === filters.levelId;
      const matchSubject = !filters.subjectId || ls.subject.id === filters.subjectId;
      return matchLevel && matchSubject;
    });
  }, [levelSubjects, filters.levelId, filters.subjectId]);

  // Filter displayed units based on filters
  const filteredUnitsForDisplay = useMemo(() => {
    return units.filter(unit => {
      if (!filters.countryId && !filters.levelId && !filters.subjectId) return true;
      
      // For level filtering, match by level code
      const matchLevel = !filters.levelId || 
        educationLevels.some(el => 
          el.id === filters.levelId && 
          el.level_code === unit.level_subject?.education_level?.level_code
        );
      
      // For subject filtering, match by subject code
      const matchSubject = !filters.subjectId || 
        subjects.some(s => 
          s.id === filters.subjectId && 
          s.subject_code === unit.level_subject?.subject?.subject_code
        );
      
      return matchLevel && matchSubject;
    });
  }, [units, filters, educationLevels, subjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.level_subject_id || !formData.unit_code || !formData.unit_title) {
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
        .from('curriculum_units')
        .insert([{
          ...formData,
          unit_code: formData.unit_code.toUpperCase()
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Unit added successfully"
      });

      setFormData({
        level_subject_id: '',
        unit_code: '',
        unit_title: '',
        unit_description: '',
        unit_order: 1,
        duration_weeks: 1,
        learning_outcomes: [],
        assessment_criteria: []
      });
      fetchUnits();
    } catch (error: any) {
      console.error('Error adding unit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add unit",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;

    try {
      const { error } = await supabase
        .from('curriculum_units')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Unit deleted successfully"
      });
      fetchUnits();
    } catch (error: any) {
      console.error('Error deleting unit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete unit",
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
        showCountry={true}
        showLevel={true}
        showSubject={true}
        compact={true}
      />
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="level_subject_id">Level & Subject *</Label>
          <Select 
            value={formData.level_subject_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, level_subject_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                filteredLevelSubjectsForForm.length === 0 
                  ? "Select filters above first" 
                  : "Select level and subject"
              } />
            </SelectTrigger>
            <SelectContent>
              {filteredLevelSubjectsForForm.map((ls) => (
                <SelectItem key={ls.id} value={ls.id}>
                  {ls.education_level.level_code} - {ls.subject.subject_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filteredLevelSubjectsForForm.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Select Country, Level, and Subject filters above to see available options
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unit_code">Unit Code *</Label>
            <Input
              id="unit_code"
              value={formData.unit_code}
              onChange={(e) => setFormData(prev => ({ ...prev, unit_code: e.target.value }))}
              placeholder="e.g., UNIT01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit_title">Unit Title *</Label>
            <Input
              id="unit_title"
              value={formData.unit_title}
              onChange={(e) => setFormData(prev => ({ ...prev, unit_title: e.target.value }))}
              placeholder="e.g., Number Systems"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_description">Unit Description</Label>
          <Textarea
            id="unit_description"
            value={formData.unit_description}
            onChange={(e) => setFormData(prev => ({ ...prev, unit_description: e.target.value }))}
            placeholder="Describe the unit content and objectives..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unit_order">Unit Order</Label>
            <Input
              id="unit_order"
              type="number"
              min="1"
              value={formData.unit_order}
              onChange={(e) => setFormData(prev => ({ ...prev, unit_order: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_weeks">Duration (Weeks)</Label>
            <Input
              id="duration_weeks"
              type="number"
              min="1"
              value={formData.duration_weeks}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) || 1 }))}
            />
          </div>
        </div>

        <DynamicListInput
          label="Learning Outcomes"
          items={formData.learning_outcomes}
          placeholder="Add a learning outcome..."
          onChange={(items) => setFormData(prev => ({ ...prev, learning_outcomes: items }))}
        />

        <DynamicListInput
          label="Assessment Criteria"
          items={formData.assessment_criteria}
          placeholder="Add assessment criteria..."
          onChange={(items) => setFormData(prev => ({ ...prev, assessment_criteria: items }))}
        />

        <Button type="submit" disabled={loading} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          {loading ? 'Adding...' : 'Add Unit'}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Existing Units</h4>
          {filters.countryId || filters.levelId || filters.subjectId ? (
            <Badge variant="secondary">
              Showing {filteredUnitsForDisplay.length} of {units.length} units
            </Badge>
          ) : null}
        </div>
        {filteredUnitsForDisplay.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {units.length === 0 ? "No units added yet" : "No units match your filters"}
          </p>
        ) : (
          filteredUnitsForDisplay.map((unit) => (
            <Card key={unit.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{unit.unit_code}</Badge>
                  <div>
                    <p className="font-medium">{unit.unit_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {unit.level_subject.education_level.level_code} - {unit.level_subject.subject.subject_code} • 
                      Order: {unit.unit_order} • {unit.duration_weeks} weeks
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(unit.id)}
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