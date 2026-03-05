import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Bug, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DebugInfo {
  hasGeneratedCode: boolean;
  codeStructure: string;
  parseError?: string;
  componentValid: boolean;
  sectionsCount: number;
  stylePreferences: any;
}

interface DynamicContentDebuggerProps {
  module: {
    id: string;
    title: string;
    content: string;
    generated_code?: string;
    style_preferences?: any;
  };
  courseId: string;
  onRegenerate?: () => void;
}

export function DynamicContentDebugger({ 
  module, 
  courseId, 
  onRegenerate 
}: DynamicContentDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const analyzeModule = () => {
    setIsAnalyzing(true);
    
    try {
      const info: DebugInfo = {
        hasGeneratedCode: !!module.generated_code,
        codeStructure: module.generated_code ? 'Present' : 'Missing',
        componentValid: false,
        sectionsCount: 0,
        stylePreferences: module.style_preferences || {}
      };

      if (module.generated_code) {
        try {
          const parsedCode = JSON.parse(module.generated_code);
          
          if (parsedCode.component?.type === 'lesson') {
            info.componentValid = true;
            info.sectionsCount = parsedCode.component.sections?.length || 0;
            info.codeStructure = `Valid component with ${info.sectionsCount} sections`;
          } else if (parsedCode.type === 'lesson') {
            info.componentValid = true;
            info.sectionsCount = parsedCode.sections?.length || 0;
            info.codeStructure = `Direct component with ${info.sectionsCount} sections`;
          } else {
            info.codeStructure = 'Invalid structure - not a lesson component';
          }
        } catch (error) {
          info.parseError = error instanceof Error ? error.message : 'Parse failed';
          info.codeStructure = 'Parse error';
        }
      }

      setDebugInfo(info);
    } catch (error) {
      console.error('Debug analysis failed:', error);
      toast({
        title: "Debug Analysis Failed",
        description: "Could not analyze module content",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const regenerateDynamicContent = async () => {
    setIsRegenerating(true);
    
    try {
      // Call the content recovery function to regenerate dynamic content
      const { data, error } = await supabase.functions.invoke('content-recovery', {
        body: {
          courseId,
          specificModuleId: module.id,
          forceRegeneration: true
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Dynamic Content Regenerated",
        description: "Module content has been updated with new dynamic rendering",
      });

      if (onRegenerate) {
        onRegenerate();
      }

      // Re-analyze after regeneration
      setTimeout(analyzeModule, 1000);
    } catch (error) {
      console.error('Regeneration failed:', error);
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Could not regenerate content",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Bug className="h-5 w-5" />
          Dynamic Content Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={analyzeModule}
            disabled={isAnalyzing}
            variant="outline"
            size="sm"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bug className="h-4 w-4 mr-2" />
            )}
            Analyze Content
          </Button>
          
          <Button
            onClick={regenerateDynamicContent}
            disabled={isRegenerating}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            {isRegenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Regenerate Dynamic Content
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-3 p-3 bg-white rounded-lg border">
            <h4 className="font-medium text-gray-900">Debug Results:</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Generated Code:</span>
                {debugInfo.hasGeneratedCode ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Present
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Missing
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Component Valid:</span>
                {debugInfo.componentValid ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Invalid
                  </Badge>
                )}
              </div>

              <div className="col-span-2">
                <span className="font-medium">Structure:</span>
                <p className="text-gray-600 mt-1">{debugInfo.codeStructure}</p>
              </div>

              {debugInfo.parseError && (
                <div className="col-span-2">
                  <span className="font-medium text-red-600">Parse Error:</span>
                  <p className="text-red-600 text-xs mt-1">{debugInfo.parseError}</p>
                </div>
              )}

              <div className="col-span-2">
                <span className="font-medium">Style Preferences:</span>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(debugInfo.stylePreferences, null, 2)}
                </pre>
              </div>
            </div>

            {!debugInfo.hasGeneratedCode && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Missing Dynamic Content</p>
                  <p className="text-yellow-700 mt-1">
                    This module was created without dynamic rendering support. 
                    Click "Regenerate Dynamic Content" to add interactive styling.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}