import React from 'react';
import { ConversationTurn } from '@/types';
import { ProviderBadge } from './ProviderBadge';
import { cn } from '@/lib/utils';
import { User, Star } from 'lucide-react';

interface ConversationHistoryProps {
  turns: ConversationTurn[];
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({ turns }) => {
  if (turns.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <span>Conversation History</span>
        <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
          {turns.length} {turns.length === 1 ? 'turn' : 'turns'}
        </span>
      </h3>
      
      <div className="space-y-3">
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
                  <pre className="text-sm text-foreground/90 whitespace-pre-wrap font-sans">
                    {turn.selectedResponse.response}
                  </pre>
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
