import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudentLearnerSetupProps {
  open: boolean;
  onComplete: (data: { countryId: string; educationLevelId: string }) => void;
}

interface Country {
  id: string;
  name: string;
  code: string;
}

interface EducationLevel {
  id: string;
  level_name: string;
  level_category: string;
  age_range?: string;
  description?: string;
}

const StudentLearnerSetup = ({ open, onComplete }: StudentLearnerSetupProps) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name, code')
        .order('name');
      
      if (error) {
        console.error('Error fetching countries:', error);
        toast({
          title: "Error",
          description: "Failed to load countries. Please refresh and try again.",
          variant: "destructive",
        });
      } else {
        setCountries(data || []);
        // Pre-select Kenya if available
        const kenya = data?.find(c => c.code === 'KE');
        if (kenya) setSelectedCountry(kenya.id);
      }
    };

    if (open) {
      fetchCountries();
    }
  }, [open, toast]);

  // Fetch education levels when country changes
  useEffect(() => {
    const fetchEducationLevels = async () => {
      if (!selectedCountry) {
        setEducationLevels([]);
        return;
      }

      const { data, error } = await supabase
        .from('education_levels')
        .select('id, level_name, level_category, age_range, description')
        .eq('country_id', selectedCountry)
        .order('level_name');
      
      if (error) {
        console.error('Error fetching education levels:', error);
        toast({
          title: "Error",
          description: "Failed to load education levels.",
          variant: "destructive",
        });
      } else {
        setEducationLevels(data || []);
        setSelectedEducationLevel(''); // Reset selection
      }
    };

    fetchEducationLevels();
  }, [selectedCountry, toast]);

  const handleContinue = async () => {
    if (!selectedCountry || !selectedEducationLevel) {
      toast({
        title: "Missing Information",
        description: "Please select both your country and education level.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    onComplete({
      countryId: selectedCountry,
      educationLevelId: selectedEducationLevel
    });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => null}>
      <DialogContent className="max-w-2xl p-0">
        <div className="animated-bg particles p-8">
          <DialogHeader className="text-center mb-8">
            <div className="mx-auto mb-4 p-4 bg-blue-500/20 rounded-full w-fit">
              <GraduationCap className="h-12 w-12 text-blue-300" />
            </div>
            <DialogTitle className="text-3xl font-bold text-white mb-4">
              Complete Your Student Profile 🎓
            </DialogTitle>
            <p className="text-white/80 text-lg">
              Help us tailor content to your educational background
            </p>
          </DialogHeader>

          <Card className="bg-white/10 backdrop-blur-md border-white/30">
            <CardHeader>
              <CardTitle className="text-white text-xl">Educational Background</CardTitle>
              <CardDescription className="text-white/70">
                Select your country and current education level for curriculum-aligned content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Country Selection */}
              <div className="space-y-2">
                <Label className="text-white font-medium">Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="bg-white/20 border-white/30 text-white">
                    <SelectValue placeholder="Select your country" />
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

              {/* Education Level Selection */}
              <div className="space-y-2">
                <Label className="text-white font-medium">Current Education Level</Label>
                <Select 
                  value={selectedEducationLevel} 
                  onValueChange={setSelectedEducationLevel}
                  disabled={!selectedCountry}
                >
                  <SelectTrigger className="bg-white/20 border-white/30 text-white">
                    <SelectValue placeholder="Select your education level" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        <div>
                          <div className="font-medium">{level.level_name}</div>
                          {level.age_range && (
                            <div className="text-sm text-muted-foreground">
                              Age: {level.age_range}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Information Card */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  <strong>💡 Why do we need this?</strong><br />
                  This helps us provide curriculum-aligned lessons that match your education system and level, 
                  ensuring relevant and age-appropriate content.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Button
              onClick={handleContinue}
              disabled={!selectedCountry || !selectedEducationLevel || loading}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 text-lg font-semibold shadow-glow-lg"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentLearnerSetup;