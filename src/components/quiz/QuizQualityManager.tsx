
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizRegenerationPanel } from "@/components/course/QuizRegenerationPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Settings, BarChart3 } from "lucide-react";

export function QuizQualityManager() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quiz Quality Management Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Manage and improve the quality of quiz questions across all your courses. 
            This tool identifies generic or low-quality questions and regenerates them with 
            content-specific, educational assessments.
          </p>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Manage Courses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What gets fixed?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">❌ Generic Questions (Fixed)</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• "What is covered in [Module Title]??"</li>
                        <li>• Questions with placeholder text</li>
                        <li>• Overly generic answer options</li>
                        <li>• Non-educational assessments</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">✅ Quality Questions (Generated)</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Content-specific questions</li>
                        <li>• Educational assessments</li>
                        <li>• Relevant answer choices</li>
                        <li>• Clear explanations</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">🔄 How it works</h4>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Scans all courses for generic quiz questions</li>
                      <li>2. Uses AI to generate content-specific questions</li>
                      <li>3. Validates question quality before updating</li>
                      <li>4. Preserves existing high-quality questions</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manage" className="mt-6">
              <QuizRegenerationPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
