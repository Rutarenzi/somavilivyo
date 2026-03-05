import { FloatingCard } from "@/components/ui/floating-card";
import { EnhancedProgress } from "@/components/ui/enhanced-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTokenUsage } from "@/hooks/useTokenUsage";
import { formatTokenCount } from "@/utils/tokenTracking";
import { Zap, TrendingUp, AlertCircle, RefreshCw, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

export function TokenUsageCard() {
  const { usage, loading, error, refreshUsage } = useTokenUsage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animatedRemaining, setAnimatedRemaining] = useState(0);

  // Animate remaining tokens count
  useEffect(() => {
    if (usage?.tokensRemaining) {
      const duration = 1000;
      const steps = 30;
      const increment = usage.tokensRemaining / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= usage.tokensRemaining) {
          setAnimatedRemaining(usage.tokensRemaining);
          clearInterval(timer);
        } else {
          setAnimatedRemaining(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [usage?.tokensRemaining]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUsage();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading) {
    return (
      <FloatingCard variant="elevated" className="overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </FloatingCard>
    );
  }

  if (error) {
    return (
      <FloatingCard variant="elevated" className="border-destructive/20">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold">Error Loading Usage</h3>
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="w-full">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
      </FloatingCard>
    );
  }

  if (!usage) {
    return (
      <FloatingCard variant="elevated">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Token Usage</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-2">No usage data available</p>
        </div>
      </FloatingCard>
    );
  }

  const isNearLimit = usage.percentageUsed >= 80;
  const isAtLimit = usage.percentageUsed >= 100;
  const isHealthy = usage.percentageUsed < 50;

  const getStatusMessage = () => {
    if (isAtLimit) return "Token limit reached";
    if (isNearLimit) return "Approaching limit";
    if (isHealthy) return "All clear — your balance is healthy!";
    return "Usage is moderate";
  };

  const getProgressVariant = () => {
    if (isAtLimit) return "default";
    if (isNearLimit) return "default";
    return "gradient";
  };

  return (
    <FloatingCard 
      variant="elevated" 
      className={`overflow-hidden transition-all duration-300 ${
        isAtLimit ? 'border-destructive/30 shadow-lg shadow-destructive/10' : 
        isNearLimit ? 'border-warning/30' : 
        'border-border/50'
      }`}
    >
      {/* Header Zone */}
      <div className="p-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-bold text-lg tracking-tight">Token Usage</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Tokens measure AI API usage. Each AI interaction consumes tokens based on content length.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge 
            variant={usage.planName === 'free' ? 'secondary' : 'default'}
            className="font-semibold tracking-wide"
          >
            {usage.planName.toUpperCase()} PLAN
          </Badge>
        </div>
      </div>

      {/* Progress & Metrics Zone */}
      <div className="p-6 space-y-4">
        <div className="flex items-baseline justify-between text-sm">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tabular-nums ${
              isAtLimit ? 'text-destructive' : 
              isNearLimit ? 'text-warning' : 
              'text-foreground'
            }`}>
              {usage.percentageUsed.toFixed(1)}%
            </span>
            <span className="text-muted-foreground font-medium">used</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              {formatTokenCount(usage.currentMonthUsage)} / {formatTokenCount(usage.monthlyLimit)}
            </div>
          </div>
        </div>

        <EnhancedProgress 
          value={Math.min(usage.percentageUsed, 100)} 
          variant={getProgressVariant()}
          className="h-3"
        />

        <p className="text-xs text-muted-foreground text-center">
          {getStatusMessage()}
        </p>
      </div>

      {/* Summary Badge Zone */}
      <div className="p-6 pt-4 bg-gradient-to-br from-background to-muted/30">
        <div className="rounded-2xl p-6 text-center relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                Tokens Remaining
              </span>
            </div>
            <div className="text-5xl font-extrabold tracking-tight bg-gradient-to-br from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              {formatTokenCount(animatedRemaining)}
            </div>
            {isHealthy && (
              <div className="mt-3 text-xs text-primary/70 font-medium">
                ✨ You're all set for AI-powered learning!
              </div>
            )}
          </div>
        </div>

        {/* Warning Messages */}
        {isAtLimit && (
          <div className="mt-4 flex items-start gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-fade-in">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-destructive">Token limit reached</p>
              <p className="text-destructive/80 text-xs mt-1">
                Upgrade your plan to continue using AI features
              </p>
            </div>
          </div>
        )}

        {isNearLimit && !isAtLimit && (
          <div className="mt-4 flex items-start gap-2 p-4 rounded-xl bg-warning/10 border border-warning/20 animate-fade-in">
            <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-warning">Approaching limit</p>
              <p className="text-warning/80 text-xs mt-1">
                You've used {usage.percentageUsed.toFixed(0)}% of your monthly tokens
              </p>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <Button 
          onClick={handleRefresh}
          variant="ghost" 
          size="sm" 
          className="w-full mt-4 group hover:bg-primary/5 transition-all"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 transition-transform ${
            isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'
          } duration-500`} />
          <span className="font-medium">Refresh Usage</span>
        </Button>
      </div>
    </FloatingCard>
  );
}
