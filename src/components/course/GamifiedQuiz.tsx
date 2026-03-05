import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Trophy,
  Zap,
  CheckCircle,
  XCircle,
  Star,
  Target,
  Brain,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface GamifiedQuizProps {
  quiz: QuizQuestion | QuizQuestion[] | any;
  onComplete: (score: number) => void;
  onNext?: () => void;
}

export function GamifiedQuiz({ quiz, onComplete, onNext }: GamifiedQuizProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'answering' | 'revealing' | 'celebrating'>('answering');
  const [questionStartTime] = useState(Date.now());

  // Normalize quiz data to handle various formats
  const normalizeQuiz = (quizData: any) => {
    if (!quizData) return null;

    // Handle array format (take first item)
    const quiz = Array.isArray(quizData) ? quizData[0] : quizData;
    if (!quiz) return null;

    // Normalize field names
    const question = quiz.question;
    const options = quiz.options || quiz.choices || quiz.answers;
    const correct = quiz.correct ?? quiz.correctAnswerIndex ?? quiz.answer ?? quiz.correctAnswer;
    const explanation = quiz.explanation;

    // Validate normalized data
    if (!question || !Array.isArray(options) || options.length === 0 || typeof correct !== 'number') {
      return null;
    }

    return { question, options, correct, explanation };
  };

  const normalizedQuiz = normalizeQuiz(quiz);
  
  const isValidQuiz = () => {
    return normalizedQuiz !== null;
  };

  if (!isValidQuiz()) {
    console.log('GamifiedQuiz: Falling back to Continue Learning due to invalid quiz');
    return (
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <Target className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-indigo-900">Content Completed!</h3>
            <p className="text-indigo-700">
              You've finished reading this module. Ready to continue to the next one?
            </p>
            {onNext && (
              <Button onClick={onNext} className="bg-indigo-600 hover:bg-indigo-700">
                Continue Learning
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use the normalized quiz from above

  const handleSubmit = () => {
    const correct = parseInt(selectedAnswer) === (normalizedQuiz?.correct ?? 0);
    const timeSpent = Date.now() - questionStartTime;
    setIsCorrect(correct);
    setAnimationPhase('revealing');
    setShowResult(true);
    
    // Trigger celebration animation if correct
    if (correct) {
      setTimeout(() => setAnimationPhase('celebrating'), 500);
    }
    
    onComplete(correct ? 100 : 0);
  };

  const handleContinue = () => {
    if (onNext) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <Sparkles className="h-8 w-8 text-yellow-400" />
                    Quick Knowledge Check
                  </CardTitle>
                  <p className="text-white/90 mt-2">{normalizedQuiz.question}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-white/20 text-white border-white/30">
                  1 Question
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!showResult ? (
            <div className="space-y-6">
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-4">
                {normalizedQuiz.options.map((option, index) => (
                  <div key={index} className="relative">
                    <Label
                      htmlFor={`option-${index}`}
                      className={cn(
                        "flex items-center space-x-3 cursor-pointer",
                        selectedAnswer === index.toString() && "font-medium"
                      )}
                    >
                      <div
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all duration-300",
                          selectedAnswer === index.toString() 
                            ? "border-indigo-600 bg-indigo-50 shadow-lg" 
                            : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <RadioGroupItem
                            value={index.toString()}
                            id={`option-${index}`}
                            className="mr-3"
                          />
                          <span className="flex-1 text-gray-900 text-left">{option}</span>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Button
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Zap className="h-5 w-5 mr-2" />
                Submit Answer
              </Button>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className={cn(
                "transition-all duration-500",
                animationPhase === 'celebrating' && "animate-bounce"
              )}>
                {isCorrect ? (
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-10 w-10 text-orange-600" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {isCorrect ? "🎉 Excellent Work!" : "📚 Keep Learning!"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {isCorrect 
                    ? "You've mastered this concept perfectly!" 
                    : "Every mistake is a step towards mastery."}
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-blue-800 font-medium mb-1">
                      {isCorrect ? "Excellent!" : "Good attempt!"} Here's the explanation:
                    </p>
                    <p className="text-blue-700">{normalizedQuiz.explanation || "Great job completing this knowledge check!"}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={handleContinue}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Continue Learning
                </Button>
              </div>

              {isCorrect && animationPhase === 'celebrating' && (
                <div className="flex justify-center space-x-2 animate-pulse">
                  <Star className="h-6 w-6 text-yellow-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <Star className="h-6 w-6 text-yellow-500 animate-bounce" style={{ animationDelay: '100ms' }} />
                  <Star className="h-6 w-6 text-yellow-500 animate-bounce" style={{ animationDelay: '200ms' }} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}