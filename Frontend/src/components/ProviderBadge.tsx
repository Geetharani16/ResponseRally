import React from 'react';
import { ProviderType, PROVIDERS } from '@/types';
import { cn } from '@/lib/utils';

interface ProviderBadgeProps {
  provider: ProviderType;
  size?: 'sm' | 'md' | 'lg';
  showFullName?: boolean;
}

const providerIcons: Record<ProviderType, string> = {
  gpt: '◉',
  llama: '🦙',
  mistral: '◈',
  gemini: '✦',
  copilot: '◇',
  deepseek: '◆',
};

export const ProviderBadge: React.FC<ProviderBadgeProps> = ({
  provider,
  size = 'md',
  showFullName = false,
}) => {
  const config = PROVIDERS.find(p => p.id === provider);
  if (!config) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium font-mono',
        'bg-secondary/50 border border-border/50',
        sizeClasses[size],
        `text-provider-${provider}`
      )}
    >
      <span className="text-sm">{providerIcons[provider]}</span>
      <span>{showFullName ? config.displayName : config.name}</span>
    </span>
  );
};
