import React from 'react';
import { ResponseMetrics as MetricsType } from '@/types';
import { cn } from '@/lib/utils';
import { Timer, Hash, FileText, Zap } from 'lucide-react';

interface MetricsPanelProps {
  metrics: MetricsType;
  isStreaming?: boolean;
  retryCount: number;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  metrics,
  isStreaming = false,
  retryCount,
}) => {
  const formatLatency = (ms: number | null) => {
    if (ms === null) return '—';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTokens = (count: number | null) => {
    if (count === null) return '—';
    return count.toLocaleString();
  };

  const formatTPS = (tps: number | null) => {
    if (tps === null) return '—';
    return `${tps.toFixed(1)}/s`;
  };

  return (
    <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg border border-border/30">
      <MetricItem
        icon={<Timer className="w-3.5 h-3.5" />}
        label="Latency"
        value={formatLatency(metrics.latencyMs)}
        subValue={metrics.firstTokenLatencyMs ? `TTFT: ${formatLatency(metrics.firstTokenLatencyMs)}` : undefined}
        colorClass="text-metric-latency"
        animate={isStreaming}
      />
      <MetricItem
        icon={<Hash className="w-3.5 h-3.5" />}
        label="Tokens"
        value={formatTokens(metrics.tokenCount)}
        subValue={metrics.tokensPerSecond ? formatTPS(metrics.tokensPerSecond) : undefined}
        colorClass="text-metric-tokens"
        animate={isStreaming}
      />
      <MetricItem
        icon={<FileText className="w-3.5 h-3.5" />}
        label="Length"
        value={`${metrics.responseLength.toLocaleString()} chars`}
        colorClass="text-metric-length"
      />
      <MetricItem
        icon={<Zap className="w-3.5 h-3.5" />}
        label="Retries"
        value={retryCount.toString()}
        colorClass={retryCount > 0 ? 'text-status-warning' : 'text-muted-foreground'}
      />
    </div>
  );
};

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  colorClass: string;
  animate?: boolean;
}

const MetricItem: React.FC<MetricItemProps> = ({
  icon,
  label,
  value,
  subValue,
  colorClass,
  animate,
}) => (
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
      {icon}
      <span>{label}</span>
    </div>
    <div className={cn('font-mono text-sm font-medium', colorClass, animate && 'streaming-indicator')}>
      {value}
    </div>
    {subValue && (
      <div className="text-xs text-muted-foreground font-mono">{subValue}</div>
    )}
  </div>
);
