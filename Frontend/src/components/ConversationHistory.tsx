import React from 'react';
import { ConversationTurn } from '@/types';
import { ProviderBadge } from './ProviderBadge';
import { cn } from '@/lib/utils';
import { User, Star, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ConversationHistoryProps {
  turns: ConversationTurn[];
  currentPrompt?: string;
  isProcessing?: boolean;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({ turns, currentPrompt, isProcessing }) => {
  if (turns.length === 0 && !currentPrompt) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <span>Conversation History</span>
        <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
          {turns.length} {turns.length === 1 ? 'turn' : 'turns'}
        </span>
      </h3>
      
      <div className="max-h-[50vh] overflow-y-auto pr-2 -mr-2 space-y-3">
        {/* Render current prompt if it exists */}
        {currentPrompt && (
          <div className="space-y-2 animate-fade-in">
            {/* Current User Prompt */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 glass-card rounded-lg p-3">
                <p className="text-sm text-foreground/90">{currentPrompt}</p>
                {isProcessing && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    <span>Generating responses...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {turns.map((turn) => (
          <div key={turn.id} className="space-y-2 animate-fade-in">
            {/* User Prompt */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 glass-card rounded-lg p-3">
                <p className="text-sm text-foreground/90">{turn.userPrompt}</p>
              </div>
            </div>

            {/* Selected Response */}
            {turn.selectedResponse && (
              <div className="flex gap-3 pl-11">
                <div
                  className={cn(
                    'flex-1 glass-card rounded-lg p-3',
                    `provider-${turn.selectedResponse.provider}`
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ProviderBadge provider={turn.selectedResponse.provider} size="sm" />
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <Star className="w-3 h-3 fill-current" />
                      Best
                    </span>
                  </div>
                  <div className="text-sm text-foreground/90 markdown-content">
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
                                <button
                                  onClick={() => {
                                    const codeContent = React.Children.toArray(children).join('');
                                    navigator.clipboard.writeText(codeContent);
                                  }}
                                  className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary/80 hover:bg-secondary rounded-md"
                                  title="Copy code"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
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
                      {turn.selectedResponse.response}
                    </ReactMarkdown>
                  </div>
                  <div className="flex gap-4 mt-2 pt-2 border-t border-border/30 text-xs text-muted-foreground font-mono">
                    <span>{turn.selectedResponse.metrics.latencyMs}ms</span>
                    <span>{turn.selectedResponse.metrics.tokenCount} tokens</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
