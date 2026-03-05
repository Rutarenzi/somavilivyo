
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Info, ListChecks } from "lucide-react";
import { QuizQuestionPosedByAI } from '@/hooks/useChatbot';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StaticQuizViewProps {
  quiz: QuizQuestionPosedByAI;
}

export function StaticQuizView({ quiz }: StaticQuizViewProps) {
  return (
    <Card className="mt-3 border-indigo-200 bg-indigo-50/50 shadow-sm">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-md font-semibold text-indigo-700">Quiz Recap</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3 text-sm">
        <p className="font-medium text-gray-800">{quiz.question}</p>
        <ul className="space-y-1.5 pl-1">
          {quiz.options.map((option, index) => (
            <li
              key={index}
              className={cn(
                "flex items-center p-2 rounded-md text-gray-700",
                index === quiz.correctAnswerIndex ? "bg-green-100 border border-green-300" : "bg-gray-100 border border-gray-200"
              )}
            >
              {index === quiz.correctAnswerIndex && <CheckCircle className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />}
              <span>{option}</span>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-indigo-500" /> Explanation:
          </h4>
          <p className="text-gray-600">{quiz.explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
