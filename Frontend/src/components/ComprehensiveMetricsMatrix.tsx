import React from 'react';
import { ProviderResponse, ResponseMetrics } from '@/types';
import { ProviderBadge } from './ProviderBadge';
import { cn } from '@/lib/utils';

interface ComprehensiveMetricsMatrixProps {
  responses: ProviderResponse[];
}

export const ComprehensiveMetricsMatrix: React.FC<ComprehensiveMetricsMatrixProps> = ({ 
  responses 
}) => {
  if (responses.length === 0) return null;

  // Metrics headers
  const metricsHeaders = [
    'Provider',
    'Status',
    'Latency (ms)',
    'Tokens',
    'Length',
    'First Token (ms)',
    'Tokens/sec',
    'Retries'
  ];

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30">
              {metricsHeaders.map((header, index) => (
                <th 
                  key={index} 
                  className={cn(
                    'p-3 text-left text-muted-foreground font-medium',
                    index === 0 && 'w-32' // Provider column width
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <tr 
                key={response.id} 
                className="border-b border-border/20 last:border-b-0 hover:bg-muted/10 transition-colors"
              >
                <td className="p-3">
                  <ProviderBadge provider={response.provider} size="sm" />
                </td>
                <td className="p-3">
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    response.status === 'success' && 'text-status-success bg-status-success/10',
                    response.status === 'pending' && 'text-status-pending bg-status-pending/10',
                    response.status === 'streaming' && 'text-status-streaming bg-status-streaming/10',
                    response.status === 'error' && 'text-status-error bg-status-error/10',
                    response.status === 'rate-limited' && 'text-status-warning bg-status-warning/10',
                    response.status === 'timeout' && 'text-status-warning bg-status-warning/10'
                  )}>
                    {response.status}
                  </span>
                </td>
                <td className="p-3 mono font-mono">
                  {response.metrics.latencyMs !== null ? response.metrics.latencyMs : '-'}
                </td>
                <td className="p-3 mono font-mono">
                  {response.metrics.tokenCount !== null ? response.metrics.tokenCount : '-'}
                </td>
                <td className="p-3 mono font-mono">
                  {response.metrics.responseLength}
                </td>
                <td className="p-3 mono font-mono">
                  {response.metrics.firstTokenLatencyMs !== null ? response.metrics.firstTokenLatencyMs : '-'}
                </td>
                <td className="p-3 mono font-mono">
                  {response.metrics.tokensPerSecond !== null ? response.metrics.tokensPerSecond.toFixed(2) : '-'}
                </td>
                <td className="p-3 mono font-mono">
                  {response.retryCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};