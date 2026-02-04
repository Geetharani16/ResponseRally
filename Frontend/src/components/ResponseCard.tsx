import React, { useState } from 'react';
import { ProviderResponse } from '@/types';
import { ProviderBadge } from './ProviderBadge';
import { StatusIndicator } from './StatusIndicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Star, RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const canSelectBest = response.status === 'success' && !isSelected;
  const canRetry = response.status === 'error' || response.status === 'rate-limited' || response.status === 'timeout';
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

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
        'flex-shrink-0 w-[420px] min-w-[420px] glass-card rounded-xl flex flex-col relative',
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
          {response.status === 'success' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              title="Copy response"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          )}
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
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom components to handle different markdown elements
                  code: ({ node, inline, className, children, ...props }: any) => {
                    const isMultiline = React.Children.toArray(children).some((child: any) => 
                      typeof child === 'string' && child.includes('\n')
                    );
                    
                    if (isMultiline) {
                      return (
                        <div className="relative group">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const codeContent = React.Children.toArray(children).join('');
                              navigator.clipboard.writeText(codeContent);
                            }}
                            className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary/80 hover:bg-secondary"
                            title="Copy code"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <pre className="whitespace-pre-wrap font-mono text-xs p-3 rounded-md bg-muted/50 overflow-x-auto relative">
                            <code {...props} className={className}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      );
                    } else {
                      return (
                        <code {...props} className={className}>
                          {children}
                        </code>
                      );
                    }
                  },
                  pre: ({ node, children, ...props }: any) => (
                    <pre className="whitespace-pre-wrap font-mono text-xs p-3 rounded-md bg-muted/50 overflow-x-auto" {...props}>
                      {children}
                    </pre>
                  ),
                  h1: ({ node, children, ...props }: any) => <h1 className="text-xl font-bold mt-4 mb-2" {...props}>{children}</h1>,
                  h2: ({ node, children, ...props }: any) => <h2 className="text-lg font-semibold mt-3 mb-2" {...props}>{children}</h2>,
                  h3: ({ node, children, ...props }: any) => <h3 className="text-base font-semibold mt-2 mb-2" {...props}>{children}</h3>,
                  p: ({ node, children, ...props }: any) => <p className="my-2" {...props}>{children}</p>,
                  ul: ({ node, children, ...props }: any) => <ul className="list-disc ml-6 my-2" {...props}>{children}</ul>,
                  ol: ({ node, children, ...props }: any) => <ol className="list-decimal ml-6 my-2" {...props}>{children}</ol>,
                  li: ({ node, children, ...props }: any) => <li className="my-1" {...props}>{children}</li>,
                  strong: ({ node, children, ...props }: any) => <strong className="font-semibold" {...props}>{children}</strong>,
                  em: ({ node, children, ...props }: any) => <em className="italic" {...props}>{children}</em>,
                  blockquote: ({ node, children, ...props }: any) => <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground" {...props}>{children}</blockquote>,
                }}
              >
                {response.response}
              </ReactMarkdown>

            </div>
          </div>
        )}
      </div>



      {/* Action Button - Positioned in bottom right corner */}
      {!isSelected && canSelectBest && (
        <div className="absolute bottom-3 right-3 z-20">
          <div className="relative group">
            <Button
              onClick={onSelectBest}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="h-8 w-8 p-0 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 relative z-10"
              variant="outline"
            >
              <Star className="w-4 h-4" />
            </Button>
            <div 
              className={`absolute top-1/2 -translate-y-1/2 right-full mr-2 tooltip-themed opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${isHovered ? 'animate-slide-in-right' : 'animate-slide-out-right'}`}
              style={{ animationFillMode: 'forwards' }}
            >
              Select as Best
            </div>
          </div>
        </div>
      )}

      {/* Selected Status Indicator - Positioned in bottom left corner */}
      {isSelected && (
        <div className="absolute bottom-3 left-3 z-20">
          <span className="flex items-center gap-1 text-primary font-medium text-sm">
            <Star className="w-4 h-4 fill-current" />
            Best
          </span>
        </div>
      )}
    </div>
  );
};
