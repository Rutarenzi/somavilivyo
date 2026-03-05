import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { BookOpen, Brain, Zap, Target, Clock, Users, Eye, Globe, PenTool } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CurriculumLessonGeneratorProps {
  onGenerate: (formData: any) => void;
  loading?: boolean;
}

interface CurriculumItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

const CurriculumLessonGenerator = ({ onGenerate, loading = false }: CurriculumLessonGeneratorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Curriculum hierarchy state
  const [countries, setCountries] = useState<CurriculumItem[]>([]);
  const [educationLevels, setEducationLevels] = useState<CurriculumItem[]>([]);
  const [subjects, setSubjects] = useState<CurriculumItem[]>([]);
  const [units, setUnits] = useState<CurriculumItem[]>([]);
  const [topics, setTopics] = useState<CurriculumItem[]>([]);
  const [subtopics, setSubtopics] = useState<CurriculumItem[]>([]);

  // Selection state
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');
  const [generationLevel, setGenerationLevel] = useState<string>('subtopic');

  // Enhanced personalization state with 15+ student-friendly options
  const [personalization, setPersonalization] = useState({
    // Basic Information
    age: '',
    educationalBackground: '',
    courseLength: '',
    
    // Learning Preferences
    learningStyle: '',
    cognitiveLevel: '',
    pace: [3], // Slider value
    preferredStudyTime: '', // When do you study best?
    attentionSpan: '', // How long can you focus?
    
    // Content Style & Presentation
    tone: '',
    examples: '',
    outputFormat: [] as string[],
    languageComplexity: '', // Simple or advanced words?
    visualPreference: '', // Lots of pictures or mostly text?
    
    // Assessment & Practice
    assessmentStyle: '',
    practiceFrequency: '', // How often do you want practice questions?
    feedbackStyle: '', // How do you want feedback?
    
    // Motivation & Engagement
    motivationStyle: '', // What keeps you motivated?
    rewardSystem: '', // Do you like progress badges/rewards?
    competitiveElement: '', // Do you like challenges/competitions?
    
    // Study Habits & Environment
    studyEnvironment: '', // Where do you study best?
    backgroundNoise: '', // Quiet or some noise?
    devicePreference: '', // Phone, tablet, or computer?
    
    // Learning Support
    difficultyProgression: '', // Start easy or jump in?
    helpSeekingStyle: '', // How do you prefer getting help?
    parentTeacherInvolvement: '', // Do you study with adults?
    
    // Collaboration & Social
    collaboration: false,
    peerInteraction: '', // Do you like working with classmates?
    teachingOthers: '', // Do you like explaining to others?
    
    // Personal Goals & Context
    learningGoals: '',
    realWorldConnection: '', // How will you use this in real life?
    personalInterests: '', // What are your hobbies/interests?
    
    // Technical & Accessibility
    internetSpeed: '', // Fast or slow internet?
    questionsPerModule: 5, // Number of questions per module
    specialNeeds: '', // Any learning difficulties?
    
    // Additional Details
    prerequisites: [] as string[],
    skill: '', // Main skill for compatibility
    details: '',
    
    // Style Preferences for Dynamic Rendering (matching passionate learner path)
    primaryColor: '#3b82f6', // blue-500
    secondaryColor: '#10b981', // emerald-500  
    fontFamily: 'Inter',
    fontSize: 'base',
    animationStyle: 'fade',
    layoutStyle: 'single-column'
  });

  // Initialize with user's profile data
  useEffect(() => {
    const initializeFromProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('country_id, current_education_level_id')
        .eq('id', user.id)
        .single();

      if (profile?.country_id) setSelectedCountry(profile.country_id);
      if (profile?.current_education_level_id) setSelectedEducationLevel(profile.current_education_level_id);
    };

    initializeFromProfile();
  }, [user]);

  // Fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name, code')
        .order('name');
      
      if (!error) {
        setCountries(data?.map(c => ({ id: c.id, name: c.name, code: c.code })) || []);
      }
    };

    fetchCountries();
  }, []);

  // Fetch education levels based on country
  useEffect(() => {
    const fetchEducationLevels = async () => {
      if (!selectedCountry) return;

      const { data, error } = await supabase
        .from('education_levels')
        .select('id, level_name')
        .eq('country_id', selectedCountry)
        .order('level_name');
      
      if (!error) {
        setEducationLevels(data?.map(l => ({ id: l.id, name: l.level_name })) || []);
      }
    };

    fetchEducationLevels();
    setSelectedEducationLevel('');
  }, [selectedCountry]);

  // Fetch subjects based on education level
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedEducationLevel) return;

      const { data, error } = await supabase
        .from('level_subjects')
        .select(`
          id,
          subjects!inner(id, subject_name)
        `)
        .eq('education_level_id', selectedEducationLevel);
      
      if (!error) {
        const subjectsData = data?.map(ls => ({
          id: ls.subjects.id,
          name: ls.subjects.subject_name
        })) || [];
        setSubjects(subjectsData);
      }
    };

    fetchSubjects();
    setSelectedSubject('');
  }, [selectedEducationLevel]);

  // Fetch units based on level-subject combination
  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedEducationLevel || !selectedSubject) return;

      const { data: levelSubjectData } = await supabase
        .from('level_subjects')
        .select('id')
        .eq('education_level_id', selectedEducationLevel)
        .eq('subject_id', selectedSubject)
        .single();

      if (levelSubjectData) {
        const { data, error } = await supabase
          .from('curriculum_units')
          .select('id, unit_title, unit_code, unit_description')
          .eq('level_subject_id', levelSubjectData.id)
          .order('unit_order');
        
        if (!error) {
          setUnits(data?.map(u => ({ 
            id: u.id, 
            name: u.unit_title, 
            code: u.unit_code,
            description: u.unit_description 
          })) || []);
        }
      }
    };

    fetchUnits();
    setSelectedUnit('');
  }, [selectedEducationLevel, selectedSubject]);

  // Fetch topics based on unit
  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedUnit) return;

      const { data, error } = await supabase
        .from('curriculum_topics')
        .select('id, topic_title, topic_code, topic_description')
        .eq('unit_id', selectedUnit)
        .order('topic_order');
      
      if (!error) {
        setTopics(data?.map(t => ({ 
          id: t.id, 
          name: t.topic_title,
          code: t.topic_code,
          description: t.topic_description 
        })) || []);
      }
    };

    fetchTopics();
    setSelectedTopic('');
  }, [selectedUnit]);

  // Fetch subtopics based on topic
  useEffect(() => {
    const fetchSubtopics = async () => {
      if (!selectedTopic) return;

      const { data, error } = await supabase
        .from('curriculum_subtopics')
        .select('id, subtopic_title, subtopic_code, learning_objective')
        .eq('topic_id', selectedTopic)
        .order('subtopic_order');
      
      if (!error) {
        setSubtopics(data?.map(s => ({ 
          id: s.id, 
          name: s.subtopic_title,
          code: s.subtopic_code,
          description: s.learning_objective 
        })) || []);
      }
    };

    fetchSubtopics();
    setSelectedSubtopic('');
  }, [selectedTopic]);

  const handlePersonalizationChange = (field: string, value: any) => {
    setPersonalization(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setPersonalization(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field as keyof typeof prev] as string[], value]
        : (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const canGenerate = () => {
    switch (generationLevel) {
      case 'subtopic': return selectedSubtopic;
      case 'topic': return selectedTopic;
      case 'unit': return selectedUnit;
      case 'subject': return selectedSubject;
      default: return false;
    }
  };

  const handleGenerate = () => {
    if (!canGenerate()) {
      toast({
        title: "Selection Required",
        description: `Please select a ${generationLevel} to generate a lesson.`,
        variant: "destructive",
      });
      return;
    }

    // Prepare generation data with curriculum context
    const curriculumData = {
      type: 'curriculum',
      generationLevel,
      country: countries.find(c => c.id === selectedCountry)?.name,
      educationLevel: educationLevels.find(l => l.id === selectedEducationLevel)?.name,
      subject: subjects.find(s => s.id === selectedSubject)?.name,
      unit: selectedUnit ? units.find(u => u.id === selectedUnit)?.name : null,
      topic: selectedTopic ? topics.find(t => t.id === selectedTopic)?.name : null,
      subtopic: selectedSubtopic ? subtopics.find(s => s.id === selectedSubtopic)?.name : null,
      curriculumIds: {
        countryId: selectedCountry,
        educationLevelId: selectedEducationLevel,
        subjectId: selectedSubject,
        unitId: selectedUnit || null,
        topicId: selectedTopic || null,
        subtopicId: selectedSubtopic || null
      }
    };

    const formData = {
      ...personalization,
      ...curriculumData,
      pace: Array.isArray(personalization.pace) ? personalization.pace[0] : personalization.pace, // Fix pace type
      skill: `${curriculumData.subject} - ${
        curriculumData.subtopic || curriculumData.topic || curriculumData.unit || curriculumData.subject
      }` // Create skill name for compatibility
    };

    console.log('📋 Generated form data for RAG system:', formData);
    onGenerate(formData);
  };

  return (
    <div className="space-y-8">
      {/* Curriculum Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Curriculum Selection
          </CardTitle>
          <CardDescription>
            Select from your official curriculum structure to generate aligned content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generation Level Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">What would you like to generate?</Label>
            <RadioGroup value={generationLevel} onValueChange={setGenerationLevel}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: 'subtopic', label: 'Subtopic Lesson', desc: 'Focused lesson' },
                  { value: 'topic', label: 'Topic Overview', desc: 'Complete topic' },
                  { value: 'unit', label: 'Unit Course', desc: 'Full unit' },
                  { value: 'subject', label: 'Subject Introduction', desc: 'Subject overview' }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <div>
                      <Label htmlFor={option.value} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Cascading Dropdowns */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Education Level</Label>
              <Select value={selectedEducationLevel} onValueChange={setSelectedEducationLevel} disabled={!selectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  {educationLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedEducationLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={!selectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      <div>
                        <div className="font-medium">{unit.name}</div>
                        {unit.code && <div className="text-sm text-muted-foreground">{unit.code}</div>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic} disabled={!selectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      <div>
                        <div className="font-medium">{topic.name}</div>
                        {topic.code && <div className="text-sm text-muted-foreground">{topic.code}</div>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subtopic</Label>
              <Select value={selectedSubtopic} onValueChange={setSelectedSubtopic} disabled={!selectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subtopic" />
                </SelectTrigger>
                <SelectContent>
                  {subtopics.map((subtopic) => (
                    <SelectItem key={subtopic.id} value={subtopic.id}>
                      <div>
                        <div className="font-medium">{subtopic.name}</div>
                        {subtopic.description && (
                          <div className="text-sm text-muted-foreground">{subtopic.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Personalization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Personalization Options
          </CardTitle>
          <CardDescription>
            Customize how your lesson will be generated and presented
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Age Range</Label>
              <Select value={personalization.age} onValueChange={(value) => handlePersonalizationChange('age', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6-10">6-10 years</SelectItem>
                  <SelectItem value="11-14">11-14 years</SelectItem>
                  <SelectItem value="15-18">15-18 years</SelectItem>
                  <SelectItem value="18+">18+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Educational Background</Label>
              <Select value={personalization.educationalBackground} onValueChange={(value) => handlePersonalizationChange('educationalBackground', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select background" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Complete Beginner</SelectItem>
                  <SelectItem value="basic">Basic Knowledge</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Course Length</Label>
              <Select value={personalization.courseLength} onValueChange={(value) => handlePersonalizationChange('courseLength', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (1-3 lessons)</SelectItem>
                  <SelectItem value="medium">Medium (4-8 lessons)</SelectItem>
                  <SelectItem value="long">Long (9+ lessons)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Learning Preferences */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>How do you learn best?</Label>
                <Select value={personalization.learningStyle} onValueChange={(value) => handlePersonalizationChange('learningStyle', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visual">I like pictures and diagrams</SelectItem>
                    <SelectItem value="auditory">I like listening and talking</SelectItem>
                    <SelectItem value="kinesthetic">I like hands-on activities</SelectItem>
                    <SelectItem value="reading-writing">I like reading and taking notes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>When do you study best?</Label>
                <Select value={personalization.preferredStudyTime} onValueChange={(value) => handlePersonalizationChange('preferredStudyTime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick your time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Early morning (6-9 AM)</SelectItem>
                    <SelectItem value="mid-morning">Mid-morning (9-12 PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12-5 PM)</SelectItem>
                    <SelectItem value="evening">Evening (5-8 PM)</SelectItem>
                    <SelectItem value="night">Night (8+ PM)</SelectItem>
                    <SelectItem value="flexible">Any time works for me</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>How long can you focus at once?</Label>
                <Select value={personalization.attentionSpan} onValueChange={(value) => handlePersonalizationChange('attentionSpan', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose focus time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">5-10 minutes</SelectItem>
                    <SelectItem value="medium">15-30 minutes</SelectItem>
                    <SelectItem value="long">45-60 minutes</SelectItem>
                    <SelectItem value="very-long">More than 1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What kind of explanations do you prefer?</Label>
                <Select value={personalization.tone} onValueChange={(value) => handlePersonalizationChange('tone', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Serious and professional</SelectItem>
                    <SelectItem value="casual">Friendly and casual</SelectItem>
                    <SelectItem value="encouraging">Supportive and motivating</SelectItem>
                    <SelectItem value="humorous">Fun with some jokes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>What examples help you understand?</Label>
                <Select value={personalization.examples} onValueChange={(value) => handlePersonalizationChange('examples', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick examples" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Things from my country/culture</SelectItem>
                    <SelectItem value="global">Examples from around the world</SelectItem>
                    <SelectItem value="analogies">Comparisons I can relate to</SelectItem>
                    <SelectItem value="real-world">How it's used in real life</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Do you prefer simple or advanced language?</Label>
                <Select value={personalization.languageComplexity} onValueChange={(value) => handlePersonalizationChange('languageComplexity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose language level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple words I can understand</SelectItem>
                    <SelectItem value="moderate">Mix of simple and advanced words</SelectItem>
                    <SelectItem value="advanced">Advanced vocabulary to challenge me</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Content Presentation Preferences */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Do you like lots of pictures or mostly text?</Label>
                <Select value={personalization.visualPreference} onValueChange={(value) => handlePersonalizationChange('visualPreference', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high-visual">Lots of pictures and diagrams</SelectItem>
                    <SelectItem value="balanced">Good mix of text and visuals</SelectItem>
                    <SelectItem value="text-focused">Mostly text with some pictures</SelectItem>
                    <SelectItem value="minimal-visual">Just text, minimal pictures</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>How often do you want practice questions?</Label>
                <Select value={personalization.practiceFrequency} onValueChange={(value) => handlePersonalizationChange('practiceFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frequent">After every section</SelectItem>
                    <SelectItem value="moderate">A few times per lesson</SelectItem>
                    <SelectItem value="minimal">Only at the end</SelectItem>
                    <SelectItem value="none">No practice questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>How do you want feedback on your answers?</Label>
                <Select value={personalization.feedbackStyle} onValueChange={(value) => handlePersonalizationChange('feedbackStyle', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose feedback style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Right away after each question</SelectItem>
                    <SelectItem value="section">After finishing each section</SelectItem>
                    <SelectItem value="end">At the very end</SelectItem>
                    <SelectItem value="detailed">Detailed explanations for wrong answers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>What motivates you to keep learning?</Label>
                <Select value={personalization.motivationStyle} onValueChange={(value) => handlePersonalizationChange('motivationStyle', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose motivation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="progress">Seeing my progress</SelectItem>
                    <SelectItem value="badges">Earning badges and rewards</SelectItem>
                    <SelectItem value="challenges">Challenging myself</SelectItem>
                    <SelectItem value="goals">Working toward a big goal</SelectItem>
                    <SelectItem value="praise">Getting encouragement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Study Environment & Habits */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Where do you study best?</Label>
              <Select value={personalization.studyEnvironment} onValueChange={(value) => handlePersonalizationChange('studyEnvironment', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiet-room">Quiet room alone</SelectItem>
                  <SelectItem value="with-family">At home with family around</SelectItem>
                  <SelectItem value="classroom">In a classroom setting</SelectItem>
                  <SelectItem value="library">Library or study hall</SelectItem>
                  <SelectItem value="outdoors">Outside or in nature</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Do you prefer quiet or some background noise?</Label>
              <Select value={personalization.backgroundNoise} onValueChange={(value) => handlePersonalizationChange('backgroundNoise', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose noise level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete-silence">Complete silence</SelectItem>
                  <SelectItem value="soft-music">Soft music</SelectItem>
                  <SelectItem value="nature-sounds">Nature sounds</SelectItem>
                  <SelectItem value="background-chatter">Light background noise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>What device do you use most?</Label>
              <Select value={personalization.devicePreference} onValueChange={(value) => handlePersonalizationChange('devicePreference', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smartphone">Smartphone</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="desktop">Desktop computer</SelectItem>
                  <SelectItem value="mixed">I switch between devices</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Learning Approach & Support */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>How do you like to start learning something new?</Label>
                <Select value={personalization.difficultyProgression} onValueChange={(value) => handlePersonalizationChange('difficultyProgression', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose approach" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very-easy">Start super easy and build up</SelectItem>
                    <SelectItem value="gradual">Start easy with gradual difficulty</SelectItem>
                    <SelectItem value="moderate">Jump into moderate difficulty</SelectItem>
                    <SelectItem value="challenge">Give me a challenge right away</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>When you need help, what works best?</Label>
                <Select value={personalization.helpSeekingStyle} onValueChange={(value) => handlePersonalizationChange('helpSeekingStyle', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose help style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hints">Give me hints to figure it out</SelectItem>
                    <SelectItem value="examples">Show me more examples</SelectItem>
                    <SelectItem value="explanations">Explain it differently</SelectItem>
                    <SelectItem value="videos">Video explanations</SelectItem>
                    <SelectItem value="break-down">Break it into smaller steps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Do you study with parents/teachers?</Label>
                <Select value={personalization.parentTeacherInvolvement} onValueChange={(value) => handlePersonalizationChange('parentTeacherInvolvement', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose involvement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="independent">I study completely alone</SelectItem>
                    <SelectItem value="occasional">Sometimes with adult help</SelectItem>
                    <SelectItem value="regular">Regular help from adults</SelectItem>
                    <SelectItem value="guided">Mostly guided by adults</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Do you like working with classmates?</Label>
                <Select value={personalization.peerInteraction} onValueChange={(value) => handlePersonalizationChange('peerInteraction', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose interaction level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">I prefer studying alone</SelectItem>
                    <SelectItem value="occasional">Sometimes with friends</SelectItem>
                    <SelectItem value="regular">Often with study groups</SelectItem>
                    <SelectItem value="collaborative">I love group projects</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Personal Connection & Goals */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>How will you use this in real life?</Label>
              <Textarea
                value={personalization.realWorldConnection}
                onChange={(e) => handlePersonalizationChange('realWorldConnection', e.target.value)}
                placeholder="e.g., 'For my science project', 'To help my family', 'To get better grades', 'For my future career'"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label>What are your hobbies and interests?</Label>
              <Textarea
                value={personalization.personalInterests}
                onChange={(e) => handlePersonalizationChange('personalInterests', e.target.value)}
                placeholder="e.g., 'Football, music, cooking, video games, art, reading' - helps us use examples you'll relate to"
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Technical & Accessibility */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>How fast is your internet?</Label>
              <Select value={personalization.internetSpeed} onValueChange={(value) => handlePersonalizationChange('internetSpeed', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Slow - text loads best</SelectItem>
                  <SelectItem value="moderate">Moderate - some images OK</SelectItem>
                  <SelectItem value="fast">Fast - videos and images work well</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Any learning challenges we should know about?</Label>
              <Select value={personalization.specialNeeds} onValueChange={(value) => handlePersonalizationChange('specialNeeds', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional - helps us adapt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No special needs</SelectItem>
                  <SelectItem value="dyslexia">Reading difficulties</SelectItem>
                  <SelectItem value="adhd">Attention challenges</SelectItem>
                  <SelectItem value="visual">Vision support needed</SelectItem>
                  <SelectItem value="hearing">Hearing support needed</SelectItem>
                  <SelectItem value="other">Other (will explain in details)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Engagement Preferences */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rewardSystem"
                checked={personalization.rewardSystem === 'yes'}
                onCheckedChange={(checked) => handlePersonalizationChange('rewardSystem', checked ? 'yes' : 'no')}
              />
              <Label htmlFor="rewardSystem" className="cursor-pointer">
                I like earning badges, points, or rewards for completing lessons
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="competitiveElement"
                checked={personalization.competitiveElement === 'yes'}
                onCheckedChange={(checked) => handlePersonalizationChange('competitiveElement', checked ? 'yes' : 'no')}
              />
              <Label htmlFor="competitiveElement" className="cursor-pointer">
                I enjoy challenges and competing with myself or others
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="teachingOthers"
                checked={personalization.teachingOthers === 'yes'}
                onCheckedChange={(checked) => handlePersonalizationChange('teachingOthers', checked ? 'yes' : 'no')}
              />
              <Label htmlFor="teachingOthers" className="cursor-pointer">
                I like explaining things to others (helps me learn better)
              </Label>
            </div>
          </div>

          {/* Learning Depth & Pace */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What level of thinking do you want to reach?</Label>
              <Select value={personalization.cognitiveLevel} onValueChange={(value) => handlePersonalizationChange('cognitiveLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose thinking level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remember">Just remember facts and definitions</SelectItem>
                  <SelectItem value="understand">Understand and explain concepts</SelectItem>
                  <SelectItem value="apply">Apply knowledge to solve problems</SelectItem>
                  <SelectItem value="analyze">Compare and analyze information</SelectItem>
                  <SelectItem value="evaluate">Judge and critique ideas</SelectItem>
                  <SelectItem value="create">Create something new</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>How fast do you want to learn?</Label>
              <div className="px-4">
                <Slider
                  value={personalization.pace}
                  onValueChange={(value) => handlePersonalizationChange('pace', value)}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>Slow & Detailed</span>
                  <span>Just Right</span>
                  <span>Fast & Quick</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Format Preferences */}
          <div className="space-y-3">
            <Label>How do you want your lesson presented? (Pick all you like)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'text', label: 'Written Text', icon: <PenTool className="h-4 w-4" /> },
                { id: 'bullets', label: 'Bullet Points', icon: <Target className="h-4 w-4" /> },
                { id: 'cards', label: 'Summary Cards', icon: <BookOpen className="h-4 w-4" /> },
                { id: 'multimedia', label: 'Links to Videos', icon: <Globe className="h-4 w-4" /> }
              ].map((format) => (
                <div key={format.id} className="flex items-center space-x-2 p-3 border rounded">
                  <Checkbox
                    id={format.id}
                    checked={personalization.outputFormat.includes(format.id)}
                    onCheckedChange={(checked) => handleCheckboxChange('outputFormat', format.id, checked as boolean)}
                  />
                  <div className="flex items-center gap-2">
                    {format.icon}
                    <Label htmlFor={format.id} className="cursor-pointer text-sm">
                      {format.label}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment Preferences */}
          <div className="space-y-2">
            <Label>What kind of questions do you prefer?</Label>
            <Select value={personalization.assessmentStyle} onValueChange={(value) => handlePersonalizationChange('assessmentStyle', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose question type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Multiple choice (A, B, C, D)</SelectItem>
                <SelectItem value="short-answer">Short written answers</SelectItem>
                <SelectItem value="project-based">Projects and assignments</SelectItem>
                <SelectItem value="self-reflection">Think about what I learned</SelectItem>
                <SelectItem value="practical">Hands-on activities</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Collaboration Preference */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="collaboration"
              checked={personalization.collaboration}
              onCheckedChange={(checked) => handlePersonalizationChange('collaboration', checked)}
            />
            <Label htmlFor="collaboration" className="cursor-pointer">
              Include activities I can do with classmates or study groups
            </Label>
          </div>

          {/* Questions per Module */}
          <div className="space-y-2">
            <Label>How many practice questions do you want per module?</Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={personalization.questionsPerModule}
              onChange={(e) => handlePersonalizationChange('questionsPerModule', parseInt(e.target.value) || 5)}
              placeholder="5"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Choose between 1-20 questions per module (default: 5)
            </p>
          </div>

          {/* Learning Goals */}
          <div className="space-y-2">
            <Label>What do you want to achieve with this lesson?</Label>
            <Textarea
              value={personalization.learningGoals}
              onChange={(e) => handlePersonalizationChange('learningGoals', e.target.value)}
              placeholder="e.g., 'Pass my upcoming test', 'Understand for my project', 'Help with homework', 'Get better grades'"
              className="min-h-[80px]"
            />
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label>Anything else we should know?</Label>
            <Textarea
              value={personalization.details}
              onChange={(e) => handlePersonalizationChange('details', e.target.value)}
              placeholder="Tell us about any difficulties you have, special interests, or anything else that might help us create the perfect lesson for you"
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Style Preferences - ADDED: Matching passionate learner functionality */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-600" />
            🎨 Visual Style Preferences
          </CardTitle>
          <CardDescription>
            Customize how your lessons will look and feel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Preferences */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Primary Color</Label>
              <div className="flex items-center space-x-3 mt-2">
                <input
                  type="color"
                  value={personalization.primaryColor}
                  onChange={(e) => handlePersonalizationChange('primaryColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
                <Select value={personalization.primaryColor} onValueChange={(value) => handlePersonalizationChange('primaryColor', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#3b82f6">Blue</SelectItem>
                    <SelectItem value="#10b981">Green</SelectItem>
                    <SelectItem value="#8b5cf6">Purple</SelectItem>
                    <SelectItem value="#f59e0b">Orange</SelectItem>
                    <SelectItem value="#ef4444">Red</SelectItem>
                    <SelectItem value="#06b6d4">Cyan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Secondary Color</Label>
              <div className="flex items-center space-x-3 mt-2">
                <input
                  type="color"
                  value={personalization.secondaryColor}
                  onChange={(e) => handlePersonalizationChange('secondaryColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
                <Select value={personalization.secondaryColor} onValueChange={(value) => handlePersonalizationChange('secondaryColor', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#10b981">Green</SelectItem>
                    <SelectItem value="#3b82f6">Blue</SelectItem>
                    <SelectItem value="#8b5cf6">Purple</SelectItem>
                    <SelectItem value="#f59e0b">Orange</SelectItem>
                    <SelectItem value="#ef4444">Red</SelectItem>
                    <SelectItem value="#06b6d4">Cyan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Typography & Layout */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Font Style</Label>
              <Select value={personalization.fontFamily} onValueChange={(value) => handlePersonalizationChange('fontFamily', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Clean & Modern)</SelectItem>
                  <SelectItem value="Poppins">Poppins (Friendly & Round)</SelectItem>
                  <SelectItem value="Roboto">Roboto (Classic & Clear)</SelectItem>
                  <SelectItem value="Open Sans">Open Sans (Readable & Simple)</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display (Elegant & Stylish)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Font Size</Label>
              <Select value={personalization.fontSize} onValueChange={(value) => handlePersonalizationChange('fontSize', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small (Better for experienced learners)</SelectItem>
                  <SelectItem value="base">Medium (Balanced readability)</SelectItem>
                  <SelectItem value="lg">Large (Easier on the eyes)</SelectItem>
                  <SelectItem value="xl">Extra Large (Best for accessibility)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Animation & Layout Style */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Animation Style</Label>
              <Select value={personalization.animationStyle} onValueChange={(value) => handlePersonalizationChange('animationStyle', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Animations (Minimal)</SelectItem>
                  <SelectItem value="fade">Fade In/Out (Subtle)</SelectItem>
                  <SelectItem value="slide">Slide Effects (Dynamic)</SelectItem>
                  <SelectItem value="scale">Scale & Zoom (Engaging)</SelectItem>
                  <SelectItem value="bounce">Bounce Effects (Playful)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Layout Style</Label>
              <Select value={personalization.layoutStyle} onValueChange={(value) => handlePersonalizationChange('layoutStyle', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single-column">Single Column (Focus)</SelectItem>
                  <SelectItem value="two-column">Two Column (Organized)</SelectItem>
                  <SelectItem value="card-layout">Card Layout (Visual)</SelectItem>
                  <SelectItem value="magazine">Magazine Style (Rich)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="text-center">
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate() || loading}
          size="lg"
          className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {loading ? (
            <>
              <Clock className="mr-2 h-5 w-5 animate-spin" />
              Generating Your Lesson...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-5 w-5" />
              Generate Curriculum Lesson
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CurriculumLessonGenerator;