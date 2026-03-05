import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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

interface EducationLevel {
  id: string;
  level_code: string;
  level_name: string;
  level_category: string;
  age_range: string;
  is_compulsory: boolean;
  duration_years: number;
  description: string;
  country: { name: string; code: string };
}

export const EducationLevelForm = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [filteredEducationLevels, setFilteredEducationLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<EducationLevel | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formData, setFormData] = useState({
    country_id: '',
    level_code: '',
    level_name: '',
    level_category: '',
    age_range: '',
    is_compulsory: false,
    duration_years: 1,
    description: ''
  });
  const [editFormData, setEditFormData] = useState({
    id: '',
    country_id: '',
    level_code: '',
    level_name: '',
    level_category: '',
    age_range: '',
    is_compulsory: false,
    duration_years: 1,
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCountries();
    fetchEducationLevels();
  }, []);

  useEffect(() => {
    filterEducationLevels();
  }, [educationLevels, searchFilter, categoryFilter]);

  const filterEducationLevels = () => {
    let filtered = educationLevels;

    if (searchFilter) {
      filtered = filtered.filter(level => 
        level.level_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        level.level_code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        level.level_category.toLowerCase().includes(searchFilter.toLowerCase()) ||
        level.country?.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(level => level.level_category === categoryFilter);
    }

    setFilteredEducationLevels(filtered);
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

  const fetchEducationLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('education_levels')
        .select(`
          *,
          country:countries(name, code)
        `)
        .order('level_code');

      if (error) throw error;
      setEducationLevels(data || []);
    } catch (error) {
      console.error('Error fetching education levels:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.country_id || !formData.level_code || !formData.level_name) {
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
        .from('education_levels')
        .insert([{
          ...formData,
          level_code: formData.level_code.toUpperCase()
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Education level added successfully"
      });

      setFormData({
        country_id: '',
        level_code: '',
        level_name: '',
        level_category: '',
        age_range: '',
        is_compulsory: false,
        duration_years: 1,
        description: ''
      });
      fetchEducationLevels();
    } catch (error: any) {
      console.error('Error adding education level:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add education level",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this education level?')) return;

    try {
      const { error } = await supabase
        .from('education_levels')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Education level deleted successfully"
      });
      fetchEducationLevels();
    } catch (error: any) {
      console.error('Error deleting education level:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete education level",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (level: EducationLevel) => {
    setEditingItem(level);
    setEditFormData({
      id: level.id,
      country_id: '', // Would need to get this from the data
      level_code: level.level_code,
      level_name: level.level_name,
      level_category: level.level_category,
      age_range: level.age_range,
      is_compulsory: level.is_compulsory,
      duration_years: level.duration_years,
      description: level.description
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editFormData.id || !editFormData.level_code || !editFormData.level_name) {
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
        .from('education_levels')
        .update({
          level_code: editFormData.level_code.toUpperCase(),
          level_name: editFormData.level_name,
          level_category: editFormData.level_category,
          age_range: editFormData.age_range,
          is_compulsory: editFormData.is_compulsory,
          duration_years: editFormData.duration_years,
          description: editFormData.description
        })
        .eq('id', editFormData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Education level updated successfully"
      });
      
      setIsEditDialogOpen(false);
      setEditingItem(null);
      fetchEducationLevels();
    } catch (error: any) {
      console.error('Error updating education level:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update education level",
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
            <Label htmlFor="level_code">Level Code *</Label>
            <Input
              id="level_code"
              value={formData.level_code}
              onChange={(e) => setFormData(prev => ({ ...prev, level_code: e.target.value }))}
              placeholder="e.g., P1, S1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level_name">Level Name *</Label>
            <Input
              id="level_name"
              value={formData.level_name}
              onChange={(e) => setFormData(prev => ({ ...prev, level_name: e.target.value }))}
              placeholder="e.g., Primary 1"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="level_category">Category</Label>
            <Select 
              value={formData.level_category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, level_category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="pre-primary">Pre-Primary</SelectItem>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="ordinary-level">Ordinary Level</SelectItem>
              <SelectItem value="advanced-level">Advanced Level</SelectItem>
              <SelectItem value="tertiary">Tertiary</SelectItem>
            </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="age_range">Age Range</Label>
            <Input
              id="age_range"
              value={formData.age_range}
              onChange={(e) => setFormData(prev => ({ ...prev, age_range: e.target.value }))}
              placeholder="e.g., 6-7"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_years">Duration (Years)</Label>
            <Input
              id="duration_years"
              type="number"
              min="1"
              value={formData.duration_years}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_years: parseInt(e.target.value) || 1 }))}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_compulsory"
            checked={formData.is_compulsory}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_compulsory: checked as boolean }))}
          />
          <Label htmlFor="is_compulsory">Compulsory Education Level</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description of this education level..."
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          {loading ? 'Adding...' : 'Add Education Level'}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Existing Education Levels</h4>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search levels..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="pre-primary">Pre-Primary</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="ordinary-level">Ordinary Level</SelectItem>
                <SelectItem value="advanced-level">Advanced Level</SelectItem>
                <SelectItem value="tertiary">Tertiary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredEducationLevels.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {educationLevels.length === 0 ? "No education levels added yet" : "No levels match your filters"}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredEducationLevels.map((level) => (
              <Card key={level.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{level.level_code}</Badge>
                    <div>
                      <p className="font-medium text-sm">{level.level_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {level.country?.name} • {level.level_category} • Age: {level.age_range}
                        {level.is_compulsory && " • Compulsory"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(level)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(level.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Education Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_level_code">Level Code *</Label>
                <Input
                  id="edit_level_code"
                  value={editFormData.level_code}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, level_code: e.target.value }))}
                  placeholder="e.g., P1, S1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_level_name">Level Name *</Label>
                <Input
                  id="edit_level_name"
                  value={editFormData.level_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, level_name: e.target.value }))}
                  placeholder="e.g., Primary 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_level_category">Category</Label>
                <Select 
                  value={editFormData.level_category} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, level_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre-primary">Pre-Primary</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="ordinary-level">Ordinary Level</SelectItem>
                    <SelectItem value="advanced-level">Advanced Level</SelectItem>
                    <SelectItem value="tertiary">Tertiary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_age_range">Age Range</Label>
                <Input
                  id="edit_age_range"
                  value={editFormData.age_range}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, age_range: e.target.value }))}
                  placeholder="e.g., 6-7"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_duration_years">Duration (Years)</Label>
                <Input
                  id="edit_duration_years"
                  type="number"
                  min="1"
                  value={editFormData.duration_years}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, duration_years: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_is_compulsory"
                checked={editFormData.is_compulsory}
                onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, is_compulsory: checked as boolean }))}
              />
              <Label htmlFor="edit_is_compulsory">Compulsory Education Level</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of this education level..."
              />
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