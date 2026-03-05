import React, { useState } from 'react';
import { PageIntro } from '@/components/layout/PageIntro';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Database, BookOpen, Users, Link2, Search } from 'lucide-react';
import { CountrySetupForm } from '@/components/curriculum/CountrySetupForm';
import { EducationLevelForm } from '@/components/curriculum/EducationLevelForm';
import { SubjectForm } from '@/components/curriculum/SubjectForm';
import { LevelSubjectLinker } from '@/components/curriculum/LevelSubjectLinker';
import { CurriculumContentManager } from '@/components/curriculum/CurriculumContentManager';
import { CurriculumBrowser } from '@/components/curriculum/CurriculumBrowser';
import { RelationshipManager } from '@/components/curriculum/RelationshipManager';

const CurriculumAdminPage = () => {
  const [activeTab, setActiveTab] = useState('setup');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageIntro
        title="CBC Curriculum Administration"
        description="Manage the Rwandan Competency-Based Curriculum structure and content for passionate learners of all ages"
        icon={<Database className="w-8 h-8 text-indigo-600" />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Core Setup
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Content Management
          </TabsTrigger>
          <TabsTrigger value="browser" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Curriculum Browser
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Relationships
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Country Setup
                </CardTitle>
                <CardDescription>
                  Configure countries for curriculum management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CountrySetupForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Education Levels
                </CardTitle>
                <CardDescription>
                  Define education levels (P1, P2, S1, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EducationLevelForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Subjects
                </CardTitle>
                <CardDescription>
                  Manage curriculum subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubjectForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Link Levels & Subjects
                </CardTitle>
                <CardDescription>
                  Associate subjects with education levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LevelSubjectLinker />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <CurriculumContentManager />
        </TabsContent>

        <TabsContent value="browser" className="space-y-6">
          <CurriculumBrowser />
        </TabsContent>

        <TabsContent value="relationships" className="space-y-6">
          <RelationshipManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CurriculumAdminPage;