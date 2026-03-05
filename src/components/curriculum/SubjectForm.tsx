import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface Subject {
  id: string;
  subject_code: string;
  subject_name: string;
  subject_category: string;
  hours_per_week: number;
  is_examinable: boolean;
  country: { name: string; code: string };
}

export const SubjectForm = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Subject | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formData, setFormData] = useState({
    country_id: '',
    subject_code: '',
    subject_name: '',
    subject_category: 'core',
    hours_per_week: 0,
    is_examinable: true
  });
  const [editFormData, setEditFormData] = useState({
    id: '',
    country_id: '',
    subject_code: '',
    subject_name: '',
    subject_category: 'core',
    hours_per_week: 0,
    is_examinable: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCountries();
    fetchSubjects();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [subjects, searchFilter, categoryFilter]);

  const filterSubjects = () => {
    let filtered = subjects;

    if (searchFilter) {
      filtered = filtered.filter(subject => 
        subject.subject_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        subject.subject_code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        subject.country?.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(subject => subject.subject_category === categoryFilter);
    }

    setFilteredSubjects(filtered);
  };

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          country:countries(name, code)
        `)
        .order('subject_code');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.country_id || !formData.subject_code || !formData.subject_name) {
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
        .from('subjects')
        .insert([{
          ...formData,
          subject_code: formData.subject_code.toUpperCase()
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject added successfully"
      });

      setFormData({
        country_id: '',
        subject_code: '',
        subject_name: '',
        subject_category: 'core',
        hours_per_week: 0,
        is_examinable: true
      });
      fetchSubjects();
    } catch (error: any) {
      console.error('Error adding subject:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add subject",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject deleted successfully"
      });
      fetchSubjects();
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete subject",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingItem(subject);
    setEditFormData({
      id: subject.id,
      country_id: '', // Would need to get this from the data
      subject_code: subject.subject_code,
      subject_name: subject.subject_name,
      subject_category: subject.subject_category,
      hours_per_week: subject.hours_per_week,
      is_examinable: subject.is_examinable
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editFormData.id || !editFormData.subject_code || !editFormData.subject_name) {
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
        .from('subjects')
        .update({
          subject_code: editFormData.subject_code.toUpperCase(),
          subject_name: editFormData.subject_name,
          subject_category: editFormData.subject_category,
          hours_per_week: editFormData.hours_per_week,
          is_examinable: editFormData.is_examinable
        })
        .eq('id', editFormData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject updated successfully"
      });
      
      setIsEditDialogOpen(false);
      setEditingItem(null);
      fetchSubjects();
    } catch (error: any) {
      console.error('Error updating subject:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update subject",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country_id">Country *</Label>
          <Select 
            value={formData.country_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, country_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.id}>
                  {country.name} ({country.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subject_code">Subject Code *</Label>
            <Input
              id="subject_code"
              value={formData.subject_code}
              onChange={(e) => setFormData(prev => ({ ...prev, subject_code: e.target.value }))}
              placeholder="e.g., MATH, ENG, SCI"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject_name">Subject Name *</Label>
            <Input
              id="subject_name"
              value={formData.subject_name}
              onChange={(e) => setFormData(prev => ({ ...prev, subject_name: e.target.value }))}
              placeholder="e.g., Mathematics"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subject_category">Category</Label>
            <Select 
              value={formData.subject_category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, subject_category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="elective">Elective</SelectItem>
                <SelectItem value="co-curricular">Co-Curricular</SelectItem>
                <SelectItem value="language">Language</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours_per_week">Hours per Week</Label>
            <Input
              id="hours_per_week"
              type="number"
              min="0"
              value={formData.hours_per_week}
              onChange={(e) => setFormData(prev => ({ ...prev, hours_per_week: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_examinable"
            checked={formData.is_examinable}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_examinable: checked as boolean }))}
          />
          <Label htmlFor="is_examinable">Examinable Subject</Label>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          {loading ? 'Adding...' : 'Add Subject'}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Existing Subjects</h4>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="elective">Elective</SelectItem>
                <SelectItem value="co-curricular">Co-Curricular</SelectItem>
                <SelectItem value="language">Language</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredSubjects.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {subjects.length === 0 ? "No subjects added yet" : "No subjects match your filters"}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredSubjects.map((subject) => (
              <Card key={subject.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{subject.subject_code}</Badge>
                    <div>
                      <p className="font-medium text-sm">{subject.subject_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {subject.country?.name} • {subject.subject_category} • {subject.hours_per_week}h/week
                        {subject.is_examinable && " • Examinable"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(subject)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(subject.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_subject_code">Subject Code *</Label>
                <Input
                  id="edit_subject_code"
                  value={editFormData.subject_code}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, subject_code: e.target.value }))}
                  placeholder="e.g., MATH, ENG, SCI"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_subject_name">Subject Name *</Label>
                <Input
                  id="edit_subject_name"
                  value={editFormData.subject_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, subject_name: e.target.value }))}
                  placeholder="e.g., Mathematics"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_subject_category">Category</Label>
                <Select 
                  value={editFormData.subject_category} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, subject_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="elective">Elective</SelectItem>
                    <SelectItem value="co-curricular">Co-Curricular</SelectItem>
                    <SelectItem value="language">Language</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_hours_per_week">Hours per Week</Label>
                <Input
                  id="edit_hours_per_week"
                  type="number"
                  min="0"
                  value={editFormData.hours_per_week}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, hours_per_week: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_is_examinable"
                checked={editFormData.is_examinable}
                onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, is_examinable: checked as boolean }))}
              />
              <Label htmlFor="edit_is_examinable">Examinable Subject</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdate} disabled={loading} className="flex-1">
                {loading ? 'Updating...' : 'Update'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};