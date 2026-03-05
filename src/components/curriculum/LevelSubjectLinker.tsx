import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Link, Edit, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface EducationLevel {
  id: string;
  level_code: string;
  level_name: string;
}

interface Subject {
  id: string;
  subject_code: string;
  subject_name: string;
}

interface LevelSubject {
  id: string;
  is_core: boolean;
  hours_per_year: number;
  assessment_type: string;
  education_level: {
    level_code: string;
    level_name: string;
  };
  subject: {
    subject_code: string;
    subject_name: string;
  };
}

export const LevelSubjectLinker = () => {
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levelSubjects, setLevelSubjects] = useState<LevelSubject[]>([]);
  const [filteredLevelSubjects, setFilteredLevelSubjects] = useState<LevelSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<LevelSubject | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formData, setFormData] = useState({
    education_level_id: undefined as string | undefined,
    selected_subjects: [] as string[],
    is_core: true,
    hours_per_year: 0,
    assessment_type: 'both'
  });
  const [editFormData, setEditFormData] = useState({
    id: '',
    education_level_id: '',
    subject_id: '',
    is_core: true,
    hours_per_year: 0,
    assessment_type: 'both'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterLevelSubjects();
  }, [levelSubjects, searchFilter, categoryFilter]);

  const filterLevelSubjects = () => {
    let filtered = levelSubjects;

    if (searchFilter) {
      filtered = filtered.filter(link => 
        link.education_level.level_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        link.subject.subject_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        link.education_level.level_code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        link.subject.subject_code.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(link => {
        if (categoryFilter === 'core') return link.is_core;
        if (categoryFilter === 'elective') return !link.is_core;
        return true;
      });
    }

    setFilteredLevelSubjects(filtered);
  };

  const fetchData = async () => {
    try {
      const [levelsResult, subjectsResult, levelSubjectsResult] = await Promise.all([
        supabase.from('education_levels').select('id, level_code, level_name').order('level_code'),
        supabase.from('subjects').select('id, subject_code, subject_name').order('subject_code'),
        supabase.from('level_subjects').select(`
          id,
          is_core,
          hours_per_year,
          assessment_type,
          education_level:education_levels(level_code, level_name),
          subject:subjects(subject_code, subject_name)
        `)
      ]);

      if (levelsResult.error) throw levelsResult.error;
      if (subjectsResult.error) throw subjectsResult.error;
      if (levelSubjectsResult.error) throw levelSubjectsResult.error;

      setEducationLevels(levelsResult.data || []);
      setSubjects(subjectsResult.data || []);
      setLevelSubjects(levelSubjectsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.education_level_id || formData.selected_subjects.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select education level and at least one subject",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const linksToInsert = formData.selected_subjects.map(subject_id => ({
        education_level_id: formData.education_level_id,
        subject_id,
        is_core: formData.is_core,
        hours_per_year: formData.hours_per_year,
        assessment_type: formData.assessment_type
      }));

      const { error } = await supabase
        .from('level_subjects')
        .insert(linksToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${formData.selected_subjects.length} subject(s) linked to education level successfully`
      });

      setFormData({
        education_level_id: undefined,
        selected_subjects: [],
        is_core: true,
        hours_per_year: 0,
        assessment_type: 'both'
      });
      fetchData();
    } catch (error: any) {
      console.error('Error linking subjects:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to link subjects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (link: LevelSubject) => {
    setEditingItem(link);
    setEditFormData({
      id: link.id,
      education_level_id: '',
      subject_id: '',
      is_core: link.is_core,
      hours_per_year: link.hours_per_year,
      assessment_type: link.assessment_type
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editFormData.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('level_subjects')
        .update({
          is_core: editFormData.is_core,
          hours_per_year: editFormData.hours_per_year,
          assessment_type: editFormData.assessment_type
        })
        .eq('id', editFormData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Link updated successfully"
      });
      
      setIsEditDialogOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating link:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update link",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelection = (subjectId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selected_subjects: checked 
        ? [...prev.selected_subjects, subjectId]
        : prev.selected_subjects.filter(id => id !== subjectId)
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this link?')) return;

    try {
      const { error } = await supabase
        .from('level_subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Link removed successfully"
      });
      fetchData();
    } catch (error: any) {
      console.error('Error removing link:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove link",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="education_level_id">Education Level *</Label>
            {educationLevels.length > 0 ? (
              <Select 
                value={formData.education_level_id ?? ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, education_level_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  {educationLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.level_code} - {level.level_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">Loading levels...</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Subjects *</Label>
            <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subject-${subject.id}`}
                    checked={formData.selected_subjects.includes(subject.id)}
                    onCheckedChange={(checked) => handleSubjectSelection(subject.id, checked as boolean)}
                  />
                  <Label htmlFor={`subject-${subject.id}`} className="cursor-pointer">
                    {subject.subject_code} - {subject.subject_name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Core Subject</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_core"
                checked={formData.is_core}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_core: checked as boolean }))}
              />
              <Label htmlFor="is_core" className="cursor-pointer">Is Core Subject</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours_per_year">Hours Per Year</Label>
            <Input
              id="hours_per_year"
              type="number"
              value={formData.hours_per_year}
              onChange={(e) => setFormData(prev => ({ ...prev, hours_per_year: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assessment_type">Assessment Type</Label>
            <Select
              value={formData.assessment_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assessment_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          <Link className="w-4 h-4 mr-2" />
          {loading ? 'Linking...' : 'Link Subjects to Level'}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search level-subject links..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="core">Core Only</SelectItem>
              <SelectItem value="elective">Elective Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {filteredLevelSubjects.map((link) => (
            <Card key={link.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <Badge variant="outline">{link.education_level.level_code}</Badge>
                    <span className="ml-2 font-medium">{link.education_level.level_name}</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div>
                    <Badge variant="secondary">{link.subject.subject_code}</Badge>
                    <span className="ml-2">{link.subject.subject_name}</span>
                  </div>
                  {link.is_core && <Badge>Core</Badge>}
                  <span className="text-sm text-muted-foreground">
                    {link.hours_per_year}hrs/year
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(link)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(link.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Level-Subject Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Core Subject</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_is_core"
                  checked={editFormData.is_core}
                  onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, is_core: checked as boolean }))}
                />
                <Label htmlFor="edit_is_core" className="cursor-pointer">Is Core Subject</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_hours_per_year">Hours Per Year</Label>
              <Input
                id="edit_hours_per_year"
                type="number"
                value={editFormData.hours_per_year}
                onChange={(e) => setEditFormData(prev => ({ ...prev, hours_per_year: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_assessment_type">Assessment Type</Label>
              <Select
                value={editFormData.assessment_type}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, assessment_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? 'Updating...' : 'Update Link'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
