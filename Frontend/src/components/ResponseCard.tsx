import React, { useState } from 'react';
import { ProviderResponse } from '@/types';
import { ProviderBadge } from './ProviderBadge';
import { StatusIndicator } from './StatusIndicator';
import { MetricsPanel } from './MetricsPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Star, RefreshCw, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

interface ResponseCardProps {
  response: ProviderResponse;
  isSelected: boolean;
  isBestCandidate: boolean;
  onSelectBest: () => void;
  onRetry: () => void;
  showMetrics?: boolean;
  isHidden?: boolean;
  onToggleHide?: () => void;
}

export const ResponseCard: React.FC<ResponseCardProps> = ({
  response,
  isSelected,
  isBestCandidate,
  onSelectBest,
  onRetry,
  showMetrics = true,
  isHidden = false,
  onToggleHide,
}) => {
  const [metricsExpanded, setMetricsExpanded] = useState(true);
  
  const canSelectBest = response.status === 'success' && !isSelected;
  const canRetry = response.status === 'error' || response.status === 'rate-limited' || response.status === 'timeout';

  if (isHidden) {
    return (
      <div 
        className={cn(
          'flex-shrink-0 w-80 glass-card rounded-xl p-4 opacity-50',
          `provider-${response.provider}`
        )}
      >
        <div className="flex items-center justify-between">
          <ProviderBadge provider={response.provider} size="sm" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleHide}
            className="text-muted-foreground hover:text-foreground"
          >
            <EyeOff className="w-4 h-4 mr-1" />
            Hidden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex-shrink-0 w-[420px] min-w-[420px] glass-card rounded-xl flex flex-col',
        'response-card animate-slide-in-right',
        `provider-${response.provider}`,
        isSelected && 'best-selected',
        isBestCandidate && !isSelected && 'hover:ring-1 hover:ring-primary/50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <ProviderBadge provider={response.provider} />
          <StatusIndicator status={response.status} size="sm" />
        </div>
        <div className="flex items-center gap-2">
          {onToggleHide && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleHide}
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {isSelected && (
            <span className="flex items-center gap-1 text-primary font-medium text-sm">
              <Star className="w-4 h-4 fill-current" />
              Best
            </span>
          )}
        </div>
      </div>

      {/* Response Content */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[400px] min-h-[200px]">
        {response.status === 'pending' ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Waiting for response...</span>
            </div>
          </div>
        ) : response.status === 'error' || response.status === 'rate-limited' ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-status-error text-center">
              <p className="font-medium mb-1">Request Failed</p>
              <p className="text-sm text-muted-foreground">{response.errorMessage}</p>
            </div>
            {canRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="border-status-error/50 text-status-error hover:bg-status-error/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Request
              </Button>
            )}
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
              {response.response}
              {response.isStreaming && <span className="typing-cursor" />}
            </pre>
          </div>
        )}
      </div>

      {/* Progress Bar for Streaming */}
      {response.isStreaming && (
        <div className="px-4 pb-2">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
              style={{ width: `${response.streamingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Metrics Section */}
      {showMetrics && response.status !== 'pending' && (
        <div className="border-t border-border/30">
          <button
            onClick={() => setMetricsExpanded(!metricsExpanded)}
            className="flex items-center justify-between w-full p-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="font-medium">Metrics</span>
            {metricsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {metricsExpanded && (
            <div className="px-3 pb-3">
              <MetricsPanel
                metrics={response.metrics}
                isStreaming={response.isStreaming}
                retryCount={response.retryCount}
              />
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      {canSelectBest && (
        <div className="p-3 border-t border-border/30">
          <Button
            onClick={onSelectBest}
            className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30"
            variant="outline"
          >
            <Star className="w-4 h-4 mr-2" />
            Select as Best Response
          </Button>
        </div>
      )}
    </div>
  );
};
