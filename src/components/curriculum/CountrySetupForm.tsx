import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  education_system_type: string;
  created_at: string;
}

export const CountrySetupForm = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Country | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    education_system_type: 'CBC'
  });
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    code: '',
    education_system_type: 'CBC'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    filterCountries();
  }, [countries, searchFilter]);

  const filterCountries = () => {
    let filtered = countries;
    if (searchFilter) {
      filtered = countries.filter(country => 
        country.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        country.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        country.education_system_type.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    setFilteredCountries(filtered);
  };

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch countries",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
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
        .from('countries')
        .insert([{
          name: formData.name,
          code: formData.code.toUpperCase(),
          education_system_type: formData.education_system_type
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Country added successfully"
      });

      setFormData({ name: '', code: '', education_system_type: 'CBC' });
      fetchCountries();
    } catch (error: any) {
      console.error('Error adding country:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add country",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this country?')) return;

    try {
      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Country deleted successfully"
      });
      fetchCountries();
    } catch (error: any) {
      console.error('Error deleting country:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete country",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (country: Country) => {
    setEditingItem(country);
    setEditFormData({
      id: country.id,
      name: country.name,
      code: country.code,
      education_system_type: country.education_system_type
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editFormData.id || !editFormData.name || !editFormData.code) {
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
        .from('countries')
        .update({
          name: editFormData.name,
          code: editFormData.code.toUpperCase(),
          education_system_type: editFormData.education_system_type
        })
        .eq('id', editFormData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Country updated successfully"
      });
      
      setIsEditDialogOpen(false);
      setEditingItem(null);
      fetchCountries();
    } catch (error: any) {
      console.error('Error updating country:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update country",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Country Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Rwanda"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Country Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="e.g., RW"
              maxLength={3}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="education_system_type">Education System Type</Label>
          <Select 
            value={formData.education_system_type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, education_system_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CBC">Competency-Based Curriculum (CBC)</SelectItem>
              <SelectItem value="Traditional">Traditional</SelectItem>
              <SelectItem value="IB">International Baccalaureate</SelectItem>
              <SelectItem value="Cambridge">Cambridge</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          {loading ? 'Adding...' : 'Add Country'}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Existing Countries</h4>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
        </div>
        
        {filteredCountries.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {countries.length === 0 ? "No countries added yet" : "No countries match your search"}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredCountries.map((country) => (
              <Card key={country.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{country.code}</Badge>
                    <div>
                      <p className="font-medium text-sm">{country.name}</p>
                      <p className="text-xs text-muted-foreground">{country.education_system_type}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(country)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(country.id)}
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
            <DialogTitle>Edit Country</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Country Name *</Label>
                <Input
                  id="edit_name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Rwanda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_code">Country Code *</Label>
                <Input
                  id="edit_code"
                  value={editFormData.code}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., RW"
                  maxLength={3}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_education_system_type">Education System Type</Label>
              <Select 
                value={editFormData.education_system_type} 
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, education_system_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBC">Competency-Based Curriculum (CBC)</SelectItem>
                  <SelectItem value="Traditional">Traditional</SelectItem>
                  <SelectItem value="IB">International Baccalaureate</SelectItem>
                  <SelectItem value="Cambridge">Cambridge</SelectItem>
                </SelectContent>
              </Select>
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