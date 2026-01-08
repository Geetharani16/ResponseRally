import React from 'react';
import { RequestStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, AlertCircle, Clock, Zap, Ban } from 'lucide-react';

interface StatusIndicatorProps {
  status: RequestStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<RequestStatus, { 
  icon: React.ReactNode; 
  label: string; 
  colorClass: string;
  animate?: boolean;
}> = {
  idle: { 
    icon: <Clock className="w-3.5 h-3.5" />, 
    label: 'Idle', 
    colorClass: 'text-muted-foreground' 
  },
  pending: { 
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, 
    label: 'Pending', 
    colorClass: 'text-status-pending',
    animate: true 
  },
  streaming: { 
    icon: <Zap className="w-3.5 h-3.5" />, 
    label: 'Streaming', 
    colorClass: 'text-status-streaming',
    animate: true 
  },
  success: { 
    icon: <CheckCircle className="w-3.5 h-3.5" />, 
    label: 'Complete', 
    colorClass: 'text-status-success' 
  },
  error: { 
    icon: <AlertCircle className="w-3.5 h-3.5" />, 
    label: 'Error', 
    colorClass: 'text-status-error' 
  },
  timeout: { 
    icon: <Clock className="w-3.5 h-3.5" />, 
    label: 'Timeout', 
    colorClass: 'text-status-warning' 
  },
  'rate-limited': { 
    icon: <Ban className="w-3.5 h-3.5" />, 
    label: 'Rate Limited', 
    colorClass: 'text-status-warning' 
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status];

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1.5 font-mono',
        config.colorClass,
        config.animate && 'streaming-indicator',
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};
