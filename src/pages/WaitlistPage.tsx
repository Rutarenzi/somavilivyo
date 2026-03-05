import React, { useState } from 'react';
import { PageIntro } from '@/components/layout/PageIntro';
import { FloatingCard } from '@/components/ui/floating-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, BookOpen, Target, Star } from 'lucide-react';

interface WaitlistFormData {
  fullName: string;
  email: string;
  studentType: 'cbc_student' | 'general_student' | 'other';
  institutionName: string;
  interests: string[];
  referralSource: string;
}

const WaitlistPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WaitlistFormData>({
    fullName: '',
    email: '',
    studentType: 'general_student',
    institutionName: '',
    interests: [],
    referralSource: ''
  });

  const interestOptions = [
    'AI & Machine Learning',
    'Web Development', 
    'Digital Marketing',
    'Data Science',
    'Business Skills',
    'Creative Writing',
    'Mathematics',
    'Science & Technology',
    'Language Learning',
    'Exam Preparation'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('waitlist_signups')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          student_type: formData.studentType,
          institution_name: formData.institutionName || null,
          interests: formData.interests,
          referral_source: formData.referralSource || null
        });

      if (error) throw error;

      toast({
        title: "Welcome to the waitlist! 🎉",
        description: "You'll be among the first to know when we launch exclusive features and early access opportunities.",
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        studentType: 'general_student',
        institutionName: '',
        interests: [],
        referralSource: ''
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      <div className="container mx-auto px-4 py-8">
        <PageIntro
          title="Join Our Exclusive Waitlist"
          description="Be the first to access premium learning features, CBC-focused content, and opportunities for passionate learners of all ages!"
          icon={<Star className="h-8 w-8 text-primary" />}
        />

        <div className="max-w-2xl mx-auto">
          {/* Benefits Section */}
          <FloatingCard variant="glass" className="mb-8 p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Why Join Our Waitlist?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium mb-1">Early Access</h3>
                <p className="text-sm text-muted-foreground">First access to new features and courses</p>
              </div>
              <div className="text-center">
                <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium mb-1">CBC Content</h3>
                <p className="text-sm text-muted-foreground">Specialized content for CBC students and passionate learners</p>
              </div>
              <div className="text-center">
                <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium mb-1">Exclusive Offers</h3>
                <p className="text-sm text-muted-foreground">Special discounts and promotions</p>
              </div>
            </div>
          </FloatingCard>

          {/* Waitlist Form */}
          <FloatingCard variant="glass" className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="studentType">I am a...</Label>
                <Select 
                  value={formData.studentType} 
                  onValueChange={(value: any) => setFormData(prev => ({...prev, studentType: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cbc_student">CBC Student (Competency-Based Curriculum)</SelectItem>
                    <SelectItem value="general_student">Student (Other curriculum)</SelectItem>
                    <SelectItem value="other">Passionate learner / Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="institutionName">School/Institution (Optional)</Label>
                <Input
                  id="institutionName"
                  type="text"
                  value={formData.institutionName}
                  onChange={(e) => setFormData(prev => ({...prev, institutionName: e.target.value}))}
                  placeholder="Enter your school or institution name"
                />
              </div>

              <div>
                <Label>Learning Interests (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {interestOptions.map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest}
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={() => handleInterestToggle(interest)}
                      />
                      <Label htmlFor={interest} className="text-sm cursor-pointer">
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="referralSource">How did you hear about us? (Optional)</Label>
                <Textarea
                  id="referralSource"
                  value={formData.referralSource}
                  onChange={(e) => setFormData(prev => ({...prev, referralSource: e.target.value}))}
                  placeholder="Social media, friend, school, etc."
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining Waitlist...
                  </>
                ) : (
                  'Join the Waitlist'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                By joining our waitlist, you agree to receive updates about our platform. 
                We respect your privacy and you can unsubscribe at any time.
              </p>
            </div>
          </FloatingCard>
        </div>
      </div>
    </div>
  );
};

export default WaitlistPage;