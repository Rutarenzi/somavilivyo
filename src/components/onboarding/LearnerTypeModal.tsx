import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearnerTypeModalProps {
  open: boolean;
  onClose: (learnerType: 'student' | 'passionate') => void;
}

const LearnerTypeModal = ({ open, onClose }: LearnerTypeModalProps) => {
  const [selectedType, setSelectedType] = useState<'student' | 'passionate' | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      onClose(selectedType);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => null}>
      <DialogContent className="max-w-4xl p-0">
        <div className="animated-bg particles p-8">
          <DialogHeader className="text-center mb-8">
            <DialogTitle className="text-3xl font-bold text-white mb-4">
              Welcome to Your Learning Journey! 🎓
            </DialogTitle>
            <p className="text-white/80 text-lg">
              Let's personalize your experience. What kind of learner are you?
            </p>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Student Learner Card */}
            <Card 
              className={cn(
                "cursor-pointer transition-all duration-300 border-2 bg-white/10 backdrop-blur-md",
                selectedType === 'student' 
                  ? "border-blue-400 bg-blue-500/20 shadow-glow-lg" 
                  : "border-white/30 hover:border-blue-300 hover:bg-white/15"
              )}
              onClick={() => setSelectedType('student')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-blue-500/20 rounded-full w-fit">
                  <BookOpen className="h-12 w-12 text-blue-300" />
                </div>
                <CardTitle className="text-white text-xl">
                  📚 Student Learner
                </CardTitle>
                <CardDescription className="text-white/70">
                  I want to follow a structured curriculum
                </CardDescription>
              </CardHeader>
              <CardContent className="text-white/80 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Follow official curriculum standards (Kenya, Rwanda)</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Learn by education level and subject</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Aligned with school requirements</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Structured progression through topics</p>
                </div>
              </CardContent>
            </Card>

            {/* Passionate Learner Card */}
            <Card 
              className={cn(
                "cursor-pointer transition-all duration-300 border-2 bg-white/10 backdrop-blur-md",
                selectedType === 'passionate' 
                  ? "border-purple-400 bg-purple-500/20 shadow-glow-lg" 
                  : "border-white/30 hover:border-purple-300 hover:bg-white/15"
              )}
              onClick={() => setSelectedType('passionate')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-purple-500/20 rounded-full w-fit">
                  <Zap className="h-12 w-12 text-purple-300" />
                </div>
                <CardTitle className="text-white text-xl">
                  🚀 Passionate Learner
                </CardTitle>
                <CardDescription className="text-white/70">
                  I want to explore any skill or topic
                </CardDescription>
              </CardHeader>
              <CardContent className="text-white/80 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-300 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Learn any skill or topic of interest</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-300 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Flexible, personalized learning paths</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-300 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Focus on practical applications</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-300 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Self-directed exploration</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              onClick={handleContinue}
              disabled={!selectedType}
              size="lg"
              className={cn(
                "px-8 py-3 text-lg font-semibold transition-all duration-300",
                selectedType === 'student' 
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-glow-lg"
                  : selectedType === 'passionate'
                  ? "bg-purple-500 hover:bg-purple-600 text-white shadow-glow-lg"
                  : "bg-gray-500 cursor-not-allowed"
              )}
            >
              Continue Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            {selectedType && (
              <p className="mt-4 text-white/70 text-sm">
                You can change this preference anytime in your profile settings
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LearnerTypeModal;