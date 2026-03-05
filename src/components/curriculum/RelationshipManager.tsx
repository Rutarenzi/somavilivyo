import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Subtopic {
  id: string;
  subtopic_code: string;
  subtopic_title: string;
}

interface Relationship {
  id: string;
  relationship_type: string;
  strength_score: number;
  source_subtopic: {
    subtopic_code: string;
    subtopic_title: string;
  };
  target_subtopic: {
    subtopic_code: string;
    subtopic_title: string;
  };
}

export const RelationshipManager = () => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    source_subtopic_id: '',
    target_subtopic_id: '',
    relationship_type: 'prerequisite',
    strength_score: 0.5
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subtopicsResult, relationshipsResult] = await Promise.all([
        supabase.from('curriculum_subtopics').select('id, subtopic_code, subtopic_title').order('subtopic_code'),
        supabase.from('curriculum_relationships').select(`
          *,
          source_subtopic:curriculum_subtopics!source_subtopic_id(subtopic_code, subtopic_title),
          target_subtopic:curriculum_subtopics!target_subtopic_id(subtopic_code, subtopic_title)
        `)
      ]);

      if (subtopicsResult.error) throw subtopicsResult.error;
      if (relationshipsResult.error) throw relationshipsResult.error;

      setSubtopics(subtopicsResult.data || []);
      setRelationships(relationshipsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.source_subtopic_id || !formData.target_subtopic_id) {
      toast({
        title: "Validation Error",
        description: "Please select both source and target subtopics",
        variant: "destructive"
      });
      return;
    }

    if (formData.source_subtopic_id === formData.target_subtopic_id) {
      toast({
        title: "Validation Error",
        description: "Source and target subtopics cannot be the same",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('curriculum_relationships')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Relationship created successfully"
      });

      setFormData({
        source_subtopic_id: '',
        target_subtopic_id: '',
        relationship_type: 'prerequisite',
        strength_score: 0.5
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating relationship:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create relationship",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this relationship?')) return;

    try {
      const { error } = await supabase
        .from('curriculum_relationships')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Relationship deleted successfully"
      });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting relationship:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete relationship",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Curriculum Relationships
          </CardTitle>
          <CardDescription>
            Define relationships between subtopics (prerequisites, cross-curricular connections, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source_subtopic_id">Source Subtopic *</Label>
                <Select 
                  value={formData.source_subtopic_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, source_subtopic_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source subtopic" />
                  </SelectTrigger>
                  <SelectContent>
                    {subtopics.map((subtopic) => (
                      <SelectItem key={subtopic.id} value={subtopic.id}>
                        {subtopic.subtopic_code} - {subtopic.subtopic_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_subtopic_id">Target Subtopic *</Label>
                <Select 
                  value={formData.target_subtopic_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, target_subtopic_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target subtopic" />
                  </SelectTrigger>
                  <SelectContent>
                    {subtopics
                      .filter(s => s.id !== formData.source_subtopic_id)
                      .map((subtopic) => (
                        <SelectItem key={subtopic.id} value={subtopic.id}>
                          {subtopic.subtopic_code} - {subtopic.subtopic_title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relationship_type">Relationship Type</Label>
                <Select 
                  value={formData.relationship_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prerequisite">Prerequisite</SelectItem>
                    <SelectItem value="builds_on">Builds On</SelectItem>
                    <SelectItem value="reinforces">Reinforces</SelectItem>
                    <SelectItem value="cross_curricular">Cross-Curricular</SelectItem>
                    <SelectItem value="extends">Extends</SelectItem>
                    <SelectItem value="applies">Applies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="strength_score">Strength Score (0.0 - 1.0)</Label>
                <Input
                  id="strength_score"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.strength_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, strength_score: parseFloat(e.target.value) || 0.5 }))}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Create Relationship'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Relationships</CardTitle>
          <CardDescription>
            Manage curriculum connections and dependencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {relationships.length === 0 ? (
              <p className="text-muted-foreground text-sm">No relationships created yet</p>
            ) : (
              relationships.map((relationship) => (
                <Card key={relationship.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{relationship.source_subtopic.subtopic_code}</Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{relationship.source_subtopic.subtopic_title}</span>
                        <Badge variant="secondary" className="text-xs">
                          {relationship.relationship_type}
                        </Badge>
                        <span className="text-sm">{relationship.target_subtopic.subtopic_title}</span>
                      </div>
                      <Badge variant="outline">{relationship.target_subtopic.subtopic_code}</Badge>
                      <div className="text-xs text-muted-foreground">
                        Strength: {relationship.strength_score}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(relationship.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};