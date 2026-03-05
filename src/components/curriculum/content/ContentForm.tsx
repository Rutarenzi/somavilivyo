import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { HierarchicalFilters, CurriculumFilters } from '../HierarchicalFilters';
import { useCountries, useFilteredEducationLevels, useFilteredSubjects, useFilteredLevelSubjects, useFilteredUnits, useFilteredTopics, useFilteredSubtopics } from '@/hooks/curriculum/useCurriculumFilters';

interface Subtopic {
  id: string;
  subtopic_code: string;
  subtopic_title: string;
}

interface Content {
  id: string;
  content_type: string;
  title: string;
  content_text: string;
  source_document: string;
  page_reference: string;
  pdf_file_path?: string;
  content_source?: string;
  subtopic: {
    subtopic_code: string;
    subtopic_title: string;
  };
}

export const ContentForm = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<CurriculumFilters>({});
  const [formData, setFormData] = useState({
    subtopic_id: '',
    content_type: 'learning_material',
    title: '',
    content_text: '',
    source_document: '',
    page_reference: '',
    content_source: 'text'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Fetch filter data
  const { data: countries = [] } = useCountries();
  const { data: educationLevels = [] } = useFilteredEducationLevels(filters.countryId);
  const { data: subjects = [] } = useFilteredSubjects(filters.countryId);
  const { data: levelSubjects = [] } = useFilteredLevelSubjects(filters.levelId, filters.subjectId);
  const { data: units = [] } = useFilteredUnits(filters.levelSubjectId);
  const { data: topics = [] } = useFilteredTopics(filters.unitId);
  const { data: subtopics = [] } = useFilteredSubtopics(filters.topicId);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('curriculum_content')
        .select(`
          *,
          subtopic:curriculum_subtopics(
            subtopic_code,
            subtopic_title,
            topic:curriculum_topics(topic_code, topic_title)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
    }
  };

  // Filter contents for display based on selected filters
  const filteredContentsForDisplay = useMemo(() => {
    return contents.filter(content => {
      if (!filters.subtopicId) return true;
      
      const matchSubtopic = !filters.subtopicId || content.subtopic?.subtopic_code === subtopics.find(s => s.id === filters.subtopicId)?.subtopic_code;
      return matchSubtopic;
    });
  }, [contents, filters, subtopics]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, content_source: 'pdf' }));
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive"
      });
    }
  };

  const handleUploadPDF = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const fileExt = 'pdf';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('curriculum-pdfs')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      return filePath;
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload PDF",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subtopic_id || !formData.title) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (formData.content_source === 'text' && !formData.content_text) {
      toast({
        title: "Validation Error",
        description: "Please provide content text or upload a PDF",
        variant: "destructive"
      });
      return;
    }

    if (formData.content_source === 'pdf' && !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please select a PDF file",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let pdfFilePath = null;
      
      if (formData.content_source === 'pdf' && selectedFile) {
        pdfFilePath = await handleUploadPDF();
        if (!pdfFilePath) {
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('curriculum_content')
        .insert([{
          ...formData,
          pdf_file_path: pdfFilePath
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content added successfully"
      });

      setFormData({
        subtopic_id: '',
        content_type: 'learning_material',
        title: '',
        content_text: '',
        source_document: '',
        page_reference: '',
        content_source: 'text'
      });
      setSelectedFile(null);
      fetchContents();
    } catch (error: any) {
      console.error('Error adding content:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const { error } = await supabase
        .from('curriculum_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content deleted successfully"
      });
      fetchContents();
    } catch (error: any) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete content",
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
        subtopics={subtopics}
        showCountry={true}
        showLevel={true}
        showSubject={true}
        showLevelSubject={true}
        showUnit={true}
        showTopic={true}
        showSubtopic={true}
        compact={true}
      />
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subtopic_id">Subtopic *</Label>
          <Select 
            value={formData.subtopic_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, subtopic_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                subtopics.length === 0 
                  ? "Select filters above first" 
                  : "Select a subtopic"
              } />
            </SelectTrigger>
            <SelectContent>
              {subtopics.map((subtopic) => (
                <SelectItem key={subtopic.id} value={subtopic.id}>
                  {subtopic.subtopic_code} - {subtopic.subtopic_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {subtopics.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Select filters above to see available subtopics
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="content_type">Content Type</Label>
            <Select 
              value={formData.content_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="learning_material">Learning Material</SelectItem>
                <SelectItem value="teacher_guide">Teacher Guide</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
                <SelectItem value="example">Example</SelectItem>
                <SelectItem value="reference">Reference</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Basic Counting Exercises"
            />
          </div>
        </div>

        <Tabs value={formData.content_source} onValueChange={(value) => setFormData(prev => ({ ...prev, content_source: value }))}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              PDF Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-2">
            <Label htmlFor="content_text">Content Text *</Label>
            <Textarea
              id="content_text"
              value={formData.content_text}
              onChange={(e) => setFormData(prev => ({ ...prev, content_text: e.target.value }))}
              placeholder="Enter the detailed content text..."
              rows={6}
            />
          </TabsContent>
          
          <TabsContent value="pdf" className="space-y-2">
            <Label htmlFor="pdf_upload">PDF File *</Label>
            <div className="flex items-center gap-4">
              <Input
                id="pdf_upload"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {selectedFile.name}
                </Badge>
              )}
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="source_document">Source Document</Label>
            <Input
              id="source_document"
              value={formData.source_document}
              onChange={(e) => setFormData(prev => ({ ...prev, source_document: e.target.value }))}
              placeholder="e.g., REB Primary Mathematics Syllabus 2025"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="page_reference">Page Reference</Label>
            <Input
              id="page_reference"
              value={formData.page_reference}
              onChange={(e) => setFormData(prev => ({ ...prev, page_reference: e.target.value }))}
              placeholder="e.g., Page 23-25"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading || uploading} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          {loading || uploading ? 'Processing...' : 'Add Content'}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Existing Content</h4>
          {filters.subtopicId ? (
            <Badge variant="secondary">
              Showing {filteredContentsForDisplay.length} of {contents.length} content items
            </Badge>
          ) : null}
        </div>
        {filteredContentsForDisplay.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {contents.length === 0 ? "No content added yet" : "No content matches your filters"}
          </p>
        ) : (
          filteredContentsForDisplay.map((content) => (
            <Card key={content.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Badge variant="outline">{content.content_type}</Badge>
                    <div className="flex-1">
                      <p className="font-medium">{content.title}</p>
                       <p className="text-sm text-muted-foreground mb-2">
                         Subtopic: {content.subtopic?.subtopic_code} - {content.subtopic?.subtopic_title}
                         {content.source_document && ` • Source: ${content.source_document}`}
                         {content.page_reference && ` • ${content.page_reference}`}
                         {content.content_source === 'pdf' && content.pdf_file_path && ` • PDF File`}
                       </p>
                       {content.content_source === 'pdf' ? (
                         <p className="text-sm text-muted-foreground">
                           <FileText className="w-4 h-4 inline mr-1" />
                           PDF Content: {content.pdf_file_path}
                         </p>
                       ) : (
                         <p className="text-sm text-muted-foreground line-clamp-2">
                           {content.content_text}
                         </p>
                       )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(content.id)}
                    className="text-destructive hover:bg-destructive/10 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};