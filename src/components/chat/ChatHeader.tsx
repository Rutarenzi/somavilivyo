
import { Brain, Sparkles } from 'lucide-react';
import { CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { ResponseLengthPreference } from '@/hooks/useChatbot';

interface ChatHeaderProps {
  greeting: string;
  aiStatus: { text: string; color: string; pulse: boolean };
  responseLength: ResponseLengthPreference;
  onResponseLengthChange: (value: ResponseLengthPreference) => void;
}

export function ChatHeader({
  greeting,
  aiStatus,
  responseLength,
  onResponseLengthChange,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Brain className="h-10 w-10 text-indigo-600 animate-pulse" />
          <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-500 animate-pulse" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-gradient bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
            Intelligent Chat Assistant
          </CardTitle>
          <p className="text-sm text-gray-700 mt-1">{greeting}</p>
          <div className="flex items-center space-x-1.5 mt-1">
            <span className={cn(
              "h-2.5 w-2.5 rounded-full transition-colors duration-300",
              aiStatus.color,
              aiStatus.pulse && "animate-pulse"
            )}></span>
            <p className="text-xs text-gray-600">{aiStatus.text}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
          <Label htmlFor="response-length" className="text-sm text-gray-700 font-medium">Response Style:</Label>
          <Select value={responseLength} onValueChange={onResponseLengthChange}>
            <SelectTrigger id="response-length" className="w-[130px] h-9 glass bg-white/80 focus:ring-indigo-500">
              <SelectValue placeholder="Response style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Concise</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
      </div>
    </div>
  );
}
