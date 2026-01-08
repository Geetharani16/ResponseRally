import React, { useState } from 'react';
import { ProviderType, PROVIDERS } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Send, Loader2, Settings2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isProcessing: boolean;
  enabledProviders: ProviderType[];
  onToggleProvider: (providerId: ProviderType) => void;
  placeholder?: string;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  isProcessing,
  enabledProviders,
  onToggleProvider,
  placeholder = "Enter your prompt here... Compare responses from multiple AI providers.",
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isProcessing) {
      onSubmit(prompt.trim());
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative glass-card rounded-xl input-glow transition-all duration-300">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isProcessing}
          className={cn(
            'min-h-[120px] resize-none bg-transparent border-0',
            'text-foreground placeholder:text-muted-foreground/60',
            'focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0',
            'pr-16 text-base leading-relaxed'
          )}
        />
        
        {/* Character count */}
        <div className="absolute bottom-3 left-4 text-xs text-muted-foreground font-mono">
          {prompt.length} chars
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={!prompt.trim() || isProcessing}
          size="icon"
          className={cn(
            'absolute bottom-3 right-3 h-10 w-10 rounded-lg',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 hover:glow-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-300'
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Provider Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Providers:</span>
          <div className="flex gap-1.5 flex-wrap">
            {PROVIDERS.map((provider) => {
              const isEnabled = enabledProviders.includes(provider.id);
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => onToggleProvider(provider.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-mono font-medium',
                    'border transition-all duration-200',
                    isEnabled
                      ? `bg-provider-${provider.id}/20 border-provider-${provider.id}/50 text-provider-${provider.id}`
                      : 'bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {provider.name}
                </button>
              );
            })}
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Settings2 className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Provider Settings</h4>
              <p className="text-xs text-muted-foreground">
                Select which AI providers to include in the comparison.
              </p>
              <div className="space-y-2">
                {PROVIDERS.map((provider) => (
                  <label
                    key={provider.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={enabledProviders.includes(provider.id)}
                      onCheckedChange={() => onToggleProvider(provider.id)}
                    />
                    <span className={cn('text-sm', `text-provider-${provider.id}`)}>
                      {provider.displayName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </form>
  );
};
