import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, FileText, Target, List } from 'lucide-react';
import { UnitForm } from './content/UnitForm';
import { TopicForm } from './content/TopicForm';
import { SubtopicForm } from './content/SubtopicForm';
import { ContentForm } from './content/ContentForm';

export const CurriculumContentManager = () => {
  const [activeTab, setActiveTab] = useState('units');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Curriculum Content Management</CardTitle>
          <CardDescription>
            Manage the hierarchical curriculum structure: Units → Topics → Subtopics → Content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="units" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Units
              </TabsTrigger>
              <TabsTrigger value="topics" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Topics
              </TabsTrigger>
              <TabsTrigger value="subtopics" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Subtopics
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content
              </TabsTrigger>
            </TabsList>

            <TabsContent value="units" className="space-y-4">
              <UnitForm />
            </TabsContent>

            <TabsContent value="topics" className="space-y-4">
              <TopicForm />
            </TabsContent>

            <TabsContent value="subtopics" className="space-y-4">
              <SubtopicForm />
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <ContentForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};